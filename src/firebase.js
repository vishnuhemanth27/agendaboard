// src/firebase.js
// ─────────────────────────────────────────────────────────────
// STEP: Replace the values below with your own Firebase project
// config after you create one at https://console.firebase.google.com
// ─────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBUjSbsf9f7PLJRjSzeTXnVuKoUTG5TfSA",
  authDomain: "agendaboard-8b3f2.firebaseapp.com",
  projectId: "agendaboard-8b3f2",
  storageBucket: "agendaboard-8b3f2.firebasestorage.app",
  messagingSenderId: "829072246279",
  appId: "1:829072246279:web:92a6db24516de3a31e0ca2",
  measurementId: "G-KHH0TM33KE"
};

const app      = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)

const provider = new GoogleAuthProvider()

// ── Auth ──────────────────────────────────────────────────────
export const signInWithGoogle = () => signInWithPopup(auth, provider)
export const signOutUser      = () => signOut(auth)
export const onAuthChange     = (cb) => onAuthStateChanged(auth, cb)

// ── Firestore helpers ─────────────────────────────────────────
// Each user's data lives at /users/{uid}/data/main
export async function loadUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'data', 'main'))
  return snap.exists() ? snap.data() : null
}

export async function saveUserData(uid, data) {
  await setDoc(doc(db, 'users', uid, 'data', 'main'), data, { merge: true })
}
