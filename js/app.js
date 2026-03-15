// ─────────────────────────────────────────────
//  WAST Temple — Main App Entry Point
// ─────────────────────────────────────────────

import { listenToUpdates }   from "./updates.js";
import { loadEvents }         from "./events.js";
import { requestPushPermission, subscribeEmail, subscribeSMS } from "./notifications.js";

// ── SERVICE WORKER REGISTRATION ──────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(reg => console.log("SW registered:", reg.scope))
      .catch(err => console.warn("SW failed:", err));
  });
}

// ── DOM READY ─────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  // Boot Firestore live updates
  const updateCards = document.getElementById("updateCards");
  const tickerTrack = document.getElementById("tickerTrack");
  if (updateCards && tickerTrack) {
    listenToUpdates(updateCards, tickerTrack).catch(console.error);

  // Boot Firestore live events
  const eventsGrid = document.getElementById('eventsGrid');
  if (eventsGrid) loadEvents(eventsGrid).catch(console.error);
  }

  // Scroll reveal
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  });

  // Mobile nav toggle
  document.getElementById("hamburger")?.addEventListener("click", () => {
    document.getElementById("mobileNav").classList.toggle("open");
  });

  // PWA install prompt
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById("installBtn")?.style.setProperty("display", "inline-flex");
  });

  document.getElementById("installBtn")?.addEventListener("click", () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(r => {
        if (r.outcome === "accepted") showToast("App installed! Check your home screen 📲", "📲");
        deferredPrompt = null;
      });
    } else {
      showInstallInstructions();
    }
  });

  document.getElementById("installHelpBtn")?.addEventListener("click", showInstallInstructions);

});

// ── PUSH NOTIFICATION ─────────────────────────
window.handlePushSubscribe = async () => {
  const result = await requestPushPermission();
  showToast(result.msg, result.ok ? "✅" : "⚠️");
};

// ── EMAIL SUBSCRIBE ───────────────────────────
window.handleEmailSubscribe = async () => {
  const email = document.getElementById("emailInput")?.value.trim();
  const result = await subscribeEmail(email);
  showToast(result.msg, result.ok ? "📧" : "⚠️");
  if (result.ok) document.getElementById("emailInput").value = "";
};

// ── SMS SUBSCRIBE ─────────────────────────────
window.handleSMSSubscribe = async () => {
  const phone = document.getElementById("smsInput")?.value.trim();
  const result = await subscribeSMS(phone);
  showToast(result.msg, result.ok ? "📱" : "⚠️");
  if (result.ok) document.getElementById("smsInput").value = "";
};

// ── TOAST ─────────────────────────────────────
export function showToast(msg, icon = "🔔") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.querySelector(".toast-icon").textContent = icon;
  toast.querySelector("#toastMsg").textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4500);
}

window.hideToast = () => document.getElementById("toast")?.classList.remove("show");

// ── INSTALL INSTRUCTIONS ──────────────────────
function showInstallInstructions() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const msg = isIOS
    ? "On iPhone: tap the Share button (□↑) then \"Add to Home Screen\""
    : "Tap the ⋮ menu in Chrome → \"Install App\" or \"Add to Home Screen\"";
  showToast(msg, "📲");
}
// Last updated: Sat Mar 14 22:53:46 EDT 2026
