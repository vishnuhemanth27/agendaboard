# AgendaBoard v3 — Setup & Deployment Guide

## What's new in v3
- **Today Dashboard** — main screen showing all pending agenda tasks due today + today's study session in one place
- **Study Tracker** merged in — YouTube playlists, flexible schedule, manual video management
- **Editable timeline** — drag entries to reorder, mark any entry done in any order, add/remove videos from any entry
- **Google Sign-In + Firebase** sync across all devices

---

## Step 1 — Firebase Setup (one time, ~10 min)

### 1a. Create project
1. Go to https://console.firebase.google.com
2. **Add project** → name it `agendaboard` → click through → **Create project**
3. Click the **Web** icon `</>` → name it `agendaboard` → **Register app**
4. Copy the `firebaseConfig` object shown

### 1b. Paste into the app
Open `src/firebase.js` and replace the 6 `REPLACE_*` values with your real config values.

### 1c. Enable Google Sign-In
1. Firebase Console → **Authentication** → **Get started**
2. **Sign-in method** tab → **Google** → toggle **Enable** → add your Gmail as support email → **Save**

### 1d. Enable Firestore
1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **Start in production mode** → pick region `asia-south1` (India) → **Enable**
3. Go to **Rules** tab → paste and **Publish**:

```
rules_version = '2';
service cloud.firestore.beta1 {
  match /databases/{database}/documents {
    match /users/{userId}/data/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Step 2 — Push to GitHub

```bash
# In the agendaboard folder:
npm install          # installs React + Firebase + Vite
npm run dev          # test locally at http://localhost:5173

git init
git add .
git commit -m "AgendaBoard v3"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agendaboard.git
git push -u origin main
```

---

## Step 3 — Deploy to Vercel (free, ~2 min)

1. Go to https://vercel.com → **Sign up with GitHub**
2. **Add New Project** → import your `agendaboard` repo
3. Framework: **Vite** (auto-detected) → click **Deploy**
4. Done — you get a URL like `agendaboard.vercel.app`

Every time you `git push`, Vercel redeploys automatically.

---

## Step 4 — Install on your phone

**iPhone (Safari):**
Open the URL → tap Share → **Add to Home Screen** → Add

**Android (Chrome):**
Open the URL → tap ⋮ → **Add to Home Screen** → Install

The app opens fullscreen with no browser chrome, like a native app.

---

## YouTube API Key (for Study Tracker)

1. Go to https://console.cloud.google.com
2. Create a project (or use existing)
3. **APIs & Services** → **Enable APIs** → search **YouTube Data API v3** → Enable
4. **Credentials** → **Create Credentials** → **API Key**
5. Copy the key and paste it into the app under **Study → ⚙ Setup**

The YouTube API free tier (10,000 units/day) is more than enough for personal use.

---

## Usage Tips

### Today Dashboard
- Shows all agenda tasks that are **due today or overdue** in one place
- Shows your **next pending study session** — mark it done directly from here

### Agendas
- Create agendas (big goals) with deadlines, priority, and reminders
- Add tasks under each agenda — tasks can have their own optional deadlines
- Click **GCal** to push a deadline to Google Calendar with a reminder

### Study Tracker
- **Setup**: Paste playlist URLs (one per line) + your API key → Fetch & build
- **Schedule tab**: Drag entries to reorder them — complete in any order you want
- **Add/remove videos**: Expand any entry → add videos by URL or remove unwanted ones
- **Today tab**: Shows your next pending session with a "Mark done" button
- You can also add individual videos manually without a playlist
