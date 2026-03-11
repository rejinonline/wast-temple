// ─────────────────────────────────────────────
//  WAST Temple — Subscriptions & Notifications
// ─────────────────────────────────────────────

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { firebaseConfig, VAPID_KEY, BREVO_API_KEY, BREVO_LIST_ID } from "./firebase-config.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── PUSH NOTIFICATIONS ──────────────────────

export async function requestPushPermission() {
  if (!("Notification" in window)) {
    return { ok: false, msg: "Your browser doesn't support notifications" };
  }
  if (!("serviceWorker" in navigator)) {
    return { ok: false, msg: "Service workers not supported in this browser" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, msg: "Permission denied — enable notifications in browser settings" };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });

    // Save FCM token to Firestore (so admin can send targeted notifications)
    await addDoc(collection(db, "fcm_tokens"), {
      token,
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent
    });

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      showInAppNotification(payload.notification?.title, payload.notification?.body);
    });

    return { ok: true, msg: "Push notifications enabled! You'll hear from us 🙏" };
  } catch (err) {
    console.error("FCM error:", err);
    return { ok: false, msg: "Could not enable notifications. Try again later." };
  }
}

function showInAppNotification(title, body) {
  const banner = document.createElement("div");
  banner.className = "in-app-notification";
  banner.innerHTML = `
    <div class="ian-icon">🔔</div>
    <div class="ian-content">
      <strong>${title}</strong>
      <p>${body}</p>
    </div>
    <button class="ian-close" onclick="this.parentElement.remove()">✕</button>`;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 6000);
}

// ── EMAIL SUBSCRIPTION (Brevo) ───────────────

export async function subscribeEmail(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, msg: "Please enter a valid email address" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
        attributes: { TEMPLE: "WAST", SOURCE: "website" }
      })
    });

    if (res.status === 201 || res.status === 204) {
      // Also log to Firestore
      await addDoc(collection(db, "email_subscribers"), {
        email, createdAt: serverTimestamp(), source: "website"
      });
      return { ok: true, msg: `Subscribed! Updates will be sent to ${email} 📧` };
    }

    const data = await res.json();
    if (data.code === "duplicate_parameter") {
      return { ok: true, msg: "You're already subscribed! We'll keep sending updates 🙏" };
    }
    return { ok: false, msg: "Subscription failed. Please try again." };
  } catch (err) {
    console.error("Brevo error:", err);
    return { ok: false, msg: "Could not subscribe. Please try again later." };
  }
}

// ── SMS SUBSCRIPTION ─────────────────────────
// Stores the number in Firestore for manual/Twilio sending

export async function subscribeSMS(phone) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 10) {
    return { ok: false, msg: "Please enter a valid phone number" };
  }

  try {
    await addDoc(collection(db, "sms_subscribers"), {
      phone: cleaned, createdAt: serverTimestamp(), source: "website"
    });
    return { ok: true, msg: `You'll receive SMS alerts at ${phone} 📱` };
  } catch (err) {
    console.error("SMS sub error:", err);
    return { ok: false, msg: "Could not subscribe. Please try again." };
  }
}
