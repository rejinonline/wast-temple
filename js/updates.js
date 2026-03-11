// ─────────────────────────────────────────────
//  WAST Temple — Live Updates from Firestore
// ─────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore, collection, query,
  orderBy, onSnapshot, where
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// Category label config
const CATEGORY_CONFIG = {
  event:        { label: "🗓 Event",        cls: "event"  },
  pooja:        { label: "🛕 Pooja",        cls: "pooja"  },
  announcement: { label: "📣 Announcement", cls: ""       },
  urgent:       { label: "🚨 Urgent",       cls: "urgent" },
};

function buildUpdateCard(data) {
  const cat  = CATEGORY_CONFIG[data.category] ?? CATEGORY_CONFIG.announcement;
  const date = data.date?.toDate
    ? data.date.toDate().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })
    : data.date ?? "";

  return `
    <article class="update-card ${data.pinned ? "pinned" : ""} reveal visible">
      <div class="update-meta">
        <span class="update-tag ${cat.cls}">${cat.label}</span>
        <time class="update-date">${date}</time>
        ${data.pinned ? '<span class="pinned-badge">★ Important</span>' : ""}
      </div>
      <h3>${data.title}</h3>
      <p>${data.body}</p>
    </article>`;
}

function buildTickerItem(data) {
  return `<span class="ticker-item">${data.title}</span>`;
}

// Real-time listener — updates UI the moment Firestore changes
export function listenToUpdates(containerEl, tickerEl) {
  const q = query(
    collection(db, "updates"),
    where("active", "==", true),
    orderBy("pinned", "desc"),
    orderBy("date", "desc")
  );

  const skeletons = `
    <div class="update-skeleton"></div>
    <div class="update-skeleton"></div>
    <div class="update-skeleton"></div>`;

  containerEl.innerHTML = skeletons;

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      containerEl.innerHTML = `
        <div class="update-card reveal visible">
          <p style="color:var(--muted);text-align:center;padding:20px;">
            No updates at this time. Check back soon! 🙏
          </p>
        </div>`;
      return;
    }

    containerEl.innerHTML = snapshot.docs.map(d => buildUpdateCard(d.data())).join("");

    // Rebuild ticker with latest data (duplicate for infinite scroll)
    const items = snapshot.docs.map(d => buildTickerItem(d.data())).join("");
    tickerEl.innerHTML = items + items;
  });
}
