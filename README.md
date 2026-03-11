# 🛕 New York Ayyappa Swami Temple — Website & App

**WAST INC.** · Non-Profit · Est. 1988

---

## 📁 Project Structure

```
wast-temple/
├── index.html              ← Main website
├── manifest.json           ← PWA manifest (install as app)
├── sw.js                   ← Service worker (offline + push)
├── CNAME                   ← Custom domain for GitHub Pages
├── css/
│   └── styles.css          ← All styles
├── js/
│   ├── firebase-config.js  ← 🔑 YOUR KEYS GO HERE
│   ├── app.js              ← Main entry point
│   ├── updates.js          ← Firestore live updates
│   └── notifications.js    ← Push / email / SMS subscriptions
├── admin/
│   └── index.html          ← Admin panel (post updates)
├── icons/                  ← App icons (add your own)
│   ├── icon-192.png
│   ├── icon-512.png
│   └── badge-72.png
└── .github/
    └── workflows/
        └── deploy.yml      ← Auto-deploy to GitHub Pages
```

---

## 🚀 Setup in 5 Steps

### Step 1 — Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit — WAST Temple website"
gh repo create wast-temple --public
git push -u origin main
```

Then go to: **GitHub → Settings → Pages → Source: GitHub Actions**

Your site will be live at: `https://yourusername.github.io/wast-temple`

---

### Step 2 — Point Custom Domain to GitHub Pages

In your **domain registrar** (wherever newyorkayyappatemple.org is registered), add these DNS records:

| Type  | Host  | Value                    |
|-------|-------|--------------------------|
| A     | @     | 185.199.108.153          |
| A     | @     | 185.199.109.153          |
| A     | @     | 185.199.110.153          |
| A     | @     | 185.199.111.153          |
| CNAME | www   | yourusername.github.io   |

The `CNAME` file in this repo tells GitHub Pages to use `www.newyorkayyappatemple.org`.

In GitHub: **Settings → Pages → Custom domain** → enter `www.newyorkayyappatemple.org` → check "Enforce HTTPS"

---

### Step 3 — Set Up Firebase

1. Go to https://console.firebase.google.com
2. **Create project** → name it `wast-temple`
3. Add a **Web App** → copy the config object

Edit `js/firebase-config.js` and paste your values:
```javascript
export const firebaseConfig = {
  apiKey:            "AIza...",
  authDomain:        "wast-temple.firebaseapp.com",
  projectId:         "wast-temple",
  storageBucket:     "wast-temple.appspot.com",
  messagingSenderId: "12345...",
  appId:             "1:12345:web:abc..."
};
```

4. **Firestore** → Create database → Production mode → `us-east1`
5. Add Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public reads for updates
    match /updates/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Only authenticated writes for subscribers
    match /email_subscribers/{doc} { allow create: if true; allow read, update, delete: if request.auth != null; }
    match /sms_subscribers/{doc}   { allow create: if true; allow read, update, delete: if request.auth != null; }
    match /fcm_tokens/{doc}        { allow create: if true; allow read, update, delete: if request.auth != null; }
  }
}
```

6. **Authentication** → Sign-in method → Enable **Email/Password**
7. Add admin user: Authentication → Users → Add user → your email + password

---

### Step 4 — Set Up Push Notifications (FCM)

1. Firebase Console → **Project Settings → Cloud Messaging**
2. Web Push Certificates → **Generate key pair** → copy the VAPID key
3. Paste it in `js/firebase-config.js`:
   ```javascript
   export const VAPID_KEY = "BNj...";
   ```
4. Copy `messagingSenderId` to `sw.js` (replace `YOUR_SENDER_ID`)
5. Also copy full firebase config into `sw.js`

**To send a notification to all subscribers:**
```
Firebase Console → Cloud Messaging → Send your first message
  → Title: "🛕 Temple Update"
  → Body: "Your announcement here"
  → Target: Topic → "temple-updates"
  → Send now
```

---

### Step 5 — Set Up Email Subscriptions (Brevo)

1. Sign up free at https://brevo.com
2. Create a **Contact List** → note the List ID
3. Settings → **API Keys** → Create a new key
4. Paste in `js/firebase-config.js`:
   ```javascript
   export const BREVO_API_KEY = "xkeysib-...";
   export const BREVO_LIST_ID = 3; // your list ID number
   ```
5. To send campaigns: Brevo → Campaigns → Email → select your list → compose → send

**Free tier**: 300 emails/day, unlimited contacts. More than enough for the temple.

---

## 🖼 Adding Icons

Create two icon images for the app:
- `icons/icon-192.png` — 192×192 px (app icon)
- `icons/icon-512.png` — 512×512 px (splash screen)
- `icons/badge-72.png` — 72×72 px monochrome (notification badge)

Use a simple lamp/diya or Om symbol on a saffron/deep-red background.
Free tool: https://realfavicongenerator.net

---

## 📱 How Devotees Install the App

**Android (Chrome):**
1. Visit the website
2. Chrome shows "Add to Home Screen" banner automatically
3. Tap "Install"

**iPhone (Safari):**
1. Visit the website in Safari
2. Tap the Share button (□↑)
3. Tap "Add to Home Screen"
4. Tap "Add"

Once installed: push notifications work, loads instantly, offline access.

---

## 🔄 Workflow: Posting Updates

**For temple staff (no code needed):**
1. Go to `https://www.newyorkayyappatemple.org/admin/`
2. Sign in with your admin email/password
3. Fill in title + message, pick category
4. Check "Push Notification" to notify all app subscribers
5. Click "Post Update"

The website updates **instantly** in real-time for all visitors.

---

## 💰 Monthly Cost

| Service        | Plan          | Cost |
|----------------|---------------|------|
| GitHub Pages   | Free forever  | $0   |
| Firebase       | Spark (free)  | $0   |
| Brevo Email    | Free tier     | $0   |
| WhatsApp       | Business      | $0   |
| Domain renewal | (existing)    | ~$15/yr |
| **TOTAL**      |               | **~$1.25/month** |

---

## 🆘 Troubleshooting

**Site not updating after push:**
- Check GitHub Actions tab for deployment status

**Push notifications not working:**
- Ensure VAPID key is correct in firebase-config.js
- `sw.js` must be at the root `/sw.js`, not in a subfolder
- Check browser console for FCM errors

**Admin login not working:**
- Make sure Firebase Authentication is enabled
- User must be created in Firebase Console → Authentication → Users

---

*Swamiye Saranam Ayyappa 🕉*
