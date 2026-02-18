# AgendaBoard — Firebase Setup Guide

Follow these steps once to get Google Sign-In + cloud sync working.

---

## Step 1 — Create a Firebase Project (free)

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `agendaboard` → click through (disable Analytics if you want)
3. Once created, click the **Web** icon `</>` to add a web app
4. Name it `agendaboard`, click **Register app**
5. You'll see a `firebaseConfig` object like this — **copy it**:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "agendaboard-xxxx.firebaseapp.com",
  projectId: "agendaboard-xxxx",
  storageBucket: "agendaboard-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## Step 2 — Paste config into the app

Open `src/firebase.js` and replace the placeholder values with your real config values.

---

## Step 3 — Enable Google Sign-In

1. In Firebase Console → left sidebar → **Authentication** → **Get started**
2. Click **Sign-in method** tab → click **Google** → toggle **Enable** → Save
3. Set a support email (your Gmail)

---

## Step 4 — Enable Firestore Database

1. In Firebase Console → left sidebar → **Firestore Database** → **Create database**
2. Choose **Start in production mode** → pick a region close to you (e.g. `asia-south1` for India) → Enable

3. Go to **Rules** tab and paste this (allows users to read/write only their own data):

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
Click **Publish**.

---

## Step 5 — Add your domain to authorized origins

1. In Firebase Console → Authentication → **Settings** tab → **Authorized domains**
2. Your Vercel URL (e.g. `agendaboard.vercel.app`) is added automatically when you deploy
3. For local dev, `localhost` is already there

---

## Step 6 — Deploy to Vercel

```bash
# Inside the agendaboard folder:
npm install
git add .
git commit -m "add firebase auth and sync"
git push
```

Vercel will auto-redeploy. Done! 🎉

---

## That's it

- Open the app → click **Continue with Google** → sign in
- Your agendas sync instantly across all devices
- Data is stored privately under your Google account — no one else can see it
