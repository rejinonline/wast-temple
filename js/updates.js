import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

const CATEGORY_CONFIG = {
  event:        { label: "🗓 Event",        cls: "event"  },
  pooja:        { label: "🛕 Pooja",        cls: "pooja"  },
  announcement: { label: "📣 Announcement", cls: ""       },
  urgent:       { label: "🚨 Urgent",       cls: "urgent" },
};

function buildUpdateCard(data) {
  const cat = CATEGORY_CONFIG[data.category] ?? CATEGORY_CONFIG.announcement;
  return `
    <article class="update-card ${data.pinned ? "pinned" : ""} reveal visible">
      <div class="update-meta">
        <span class="update-tag ${cat.cls}">${cat.label}</span>
        <time class="update-date">${data.date ?? ""}</time>
        ${data.pinned ? '<span class="pinned-badge">★ Important</span>' : ""}
      </div>
      <h3>${data.title}</h3>
      <p>${data.body}</p>
      ${data.imageUrl ? `<div class="update-image-wrap"><img src="${data.imageUrl}" alt="${data.title}" class="update-image" onerror="this.parentElement.style.display='none'" /></div>` : ""}
    </article>`;
}

export async function listenToUpdates(containerEl, tickerEl) {
  containerEl.innerHTML = `<div class="update-skeleton"></div><div class="update-skeleton"></div>`;
  try {
    console.log("Fetching updates from Firestore...");
    const snapshot = await getDocs(collection(db, "updates"));
    console.log("Total docs fetched:", snapshot.size);

    const active = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.active === true)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.date ?? "").localeCompare(a.date ?? "");
      });

    console.log("Active docs:", active.length);

    if (active.length === 0) {
      containerEl.innerHTML = `<div class="update-card reveal visible"><p style="color:var(--muted);text-align:center;padding:20px;">No updates at this time. Check back soon! 🙏</p></div>`;
      return;
    }

    containerEl.innerHTML = active.map(d => buildUpdateCard(d)).join("");
    tickerEl.innerHTML = active.map(d => `<span class="ticker-item">${d.title}</span>`).join("") +
                         active.map(d => `<span class="ticker-item">${d.title}</span>`).join("");
  } catch (err) {
    console.error("Firestore error:", err);
    containerEl.innerHTML = `<div class="update-card reveal visible"><p style="color:var(--muted);text-align:center;padding:20px;">Unable to load updates. Please try again later.</p></div>`;
  }
}
