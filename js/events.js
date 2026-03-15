import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

function buildEventCard(data) {
  return `
    <article class="event-card reveal visible">
      <div class="event-card-top">
        <div class="event-date-badge">
          <span class="day">${data.day ?? ""}</span>
          <span class="month">${data.month ?? ""}</span>
        </div>
        <h3>${data.title}</h3>
      </div>
      <div class="event-card-body">
        <p>${data.description ?? ""}</p>
        <div class="event-meta-row">
          <span>&#9200; ${data.time ?? ""}</span>
          <span>&#128205; ${data.location ?? ""}</span>
        </div>
      </div>
      ${data.imageUrl ? `
        <div class="update-image-wrap">
          <img src="${data.imageUrl}" alt="${data.title}" class="update-image"
               onerror="this.parentElement.style.display='none'" />
        </div>` : ""}
    </article>`;
}

export async function loadEvents(containerEl) {
  containerEl.innerHTML = `<div class="update-skeleton" style="height:200px;border-radius:24px;"></div><div class="update-skeleton" style="height:200px;border-radius:24px;"></div><div class="update-skeleton" style="height:200px;border-radius:24px;"></div>`;
  try {
    console.log("Fetching events from Firestore...");
    const snapshot = await getDocs(collection(db, "events"));
    console.log("Total events fetched:", snapshot.size);
    const active = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.active === true)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    console.log("Active events:", active.length);
    if (active.length === 0) {
      containerEl.innerHTML = `<div class="event-card reveal visible" style="padding:40px;text-align:center;grid-column:1/-1;"><p style="color:var(--muted);">No upcoming events at this time. Check back soon!</p></div>`;
      return;
    }
    containerEl.innerHTML = active.map(d => buildEventCard(d)).join("");
  } catch (err) {
    console.error("Events Firestore error:", err);
  }
}
