import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Valid configuration from existing Firebase project nexz-c24d9
 */
const PROJECT_CONFIG = {
  apiKey: 'AIzaSyAvujeJYDUcnSkNsTtTiqzHwzF0b6huC-Q',
  authDomain: 'nexz-c24d9.firebaseapp.com',
  projectId: 'nexz-c24d9',
  storageBucket: 'nexz-c24d9.firebasestorage.app',
  messagingSenderId: '192963986329',
  appId: '1:192963986329:web:ab827d8f3e35267b90c908',
};

/**
 * Checks if a configuration value is an unconfigured template placeholder.
 */
function isPlaceholder(val) {
  if (!val) return true;
  const lower = val.toLowerCase();
  return (
    lower.startsWith('your_') ||
    lower.includes('placeholder') ||
    lower.includes('demokey') ||
    lower.includes('changeme') ||
    lower.includes('your_project')
  );
}

const envApiKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
const envAuthDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
const envProjectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
const envStorageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim();
const envMessagingSenderId = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim();
const envAppId = (import.meta.env.VITE_FIREBASE_APP_ID || '').trim();

const apiKey = envApiKey && !isPlaceholder(envApiKey) ? envApiKey : PROJECT_CONFIG.apiKey;
const authDomain = envAuthDomain && !isPlaceholder(envAuthDomain) ? envAuthDomain : PROJECT_CONFIG.authDomain;
const projectId = envProjectId && !isPlaceholder(envProjectId) ? envProjectId : PROJECT_CONFIG.projectId;
const storageBucket = envStorageBucket && !isPlaceholder(envStorageBucket) ? envStorageBucket : PROJECT_CONFIG.storageBucket;
const messagingSenderId = envMessagingSenderId && !isPlaceholder(envMessagingSenderId) ? envMessagingSenderId : PROJECT_CONFIG.messagingSenderId;
const appId = envAppId && !isPlaceholder(envAppId) ? envAppId : PROJECT_CONFIG.appId;

// Development-safe validation report (strictly avoids printing secret values)
export const firebaseConfigStatus = {
  apiKey: {
    present: Boolean(apiKey && !isPlaceholder(apiKey)),
    validFormat: Boolean(apiKey && apiKey.startsWith('AIzaSy')),
  },
  authDomain: {
    present: Boolean(authDomain && !isPlaceholder(authDomain)),
    validFormat: Boolean(authDomain && authDomain.includes('.firebaseapp.com')),
  },
  projectId: {
    present: Boolean(projectId && !isPlaceholder(projectId)),
    validFormat: Boolean(projectId),
  },
  appId: {
    present: Boolean(appId && !isPlaceholder(appId)),
    validFormat: Boolean(appId && appId.startsWith('1:')),
  },
};

export const isFirebaseConfigValid =
  firebaseConfigStatus.apiKey.present &&
  firebaseConfigStatus.authDomain.present &&
  firebaseConfigStatus.projectId.present &&
  firebaseConfigStatus.appId.present;

// Safe development log: Never expose or print secret credentials
if (typeof console !== 'undefined' && console.info) {
  console.info(
    '%c[Firebase Configuration Status]',
    'color: #8b5cf6; font-weight: bold;',
    `\n  ${firebaseConfigStatus.apiKey.present ? '✓' : '✗'} Firebase API key: PRESENT` +
    `\n  ${firebaseConfigStatus.authDomain.present ? '✓' : '✗'} Firebase auth domain: PRESENT` +
    `\n  ${firebaseConfigStatus.projectId.present ? '✓' : '✗'} Firebase project ID: PRESENT` +
    `\n  ${firebaseConfigStatus.appId.present ? '✓' : '✗'} Firebase app ID: PRESENT`
  );
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Initialize Firebase exactly once
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

