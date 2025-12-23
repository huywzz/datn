import { initializeApp, type FirebaseOptions, getApps, getApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Reuse existing app in hot-reload to avoid duplicate-app errors
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

// Export auth instance so screens/hooks can consume
export const firebaseApp = app
export const firebaseAuth: Auth = getAuth(app)


