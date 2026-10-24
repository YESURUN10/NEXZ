/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigValid, firebaseConfigStatus } from '../services/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            try {
              const docRef = doc(db, 'users', currentUser.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                setUserData(docSnap.data());
                setIsNewUser(false);
              } else {
                setUserData(null);
                setIsNewUser(true);
              }
            } catch (err) {
              console.warn('[Auth] Firestore profile read error:', err.message);
              setUserData(null);
              setIsNewUser(false);
            }
          } else {
            setUser(null);
            setUserData(null);
            setIsNewUser(false);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('[Auth] onAuthStateChanged listener error:', err.message);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('[Auth] Auth initialization error:', err.message);
      setLoading(false);
    }
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (err) {
      let message = 'Unable to sign in with provided credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Invalid email or password. Please verify and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Access temporarily disabled due to multiple failed attempts. Please reset password or try later.';
      } else if (err.message) {
        message = err.message;
      }
      const customErr = new Error(message);
      customErr.code = err.code;
      throw customErr;
    }
  };
  
  const signup = async (email, password) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (err) {
      let message = 'Registration could not be completed.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email address is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (err.message) {
        message = err.message;
      }
      const customErr = new Error(message);
      customErr.code = err.code;
      throw customErr;
    }
  };
  
  const googleSignIn = async () => {
    // 1. Early check on Firebase configuration validity
    if (!isFirebaseConfigValid) {
      const configErr = new Error(
        'Firebase API configuration is invalid or contains placeholder values. Please set a valid VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID in your environment variables.'
      );
      configErr.code = 'auth/api-key-not-valid';
      throw configErr;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('[Auth] Google sign-in failure:', err);
      let message = "We couldn't establish your Google session.";
      let userFriendlyCode = err.code || 'auth/unknown';

      if (err.code === 'auth/popup-blocked') {
        message = 'The authentication popup was blocked by your browser. Please allow popups for this site and try again.';
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        message = 'The Google sign-in window was closed before completing authentication.';
      } else if (err.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'nexz-psi.vercel.app';
        message = `Deployment domain "${domain}" is not authorized in Firebase Auth. To enable Google sign-in: In Firebase Console, open project "nexz-c24d9" > Authentication > Settings > Authorized domains, and add "${domain}".`;
      } else if (
        err.code === 'auth/invalid-api-key' || 
        err.code === 'auth/api-key-not-valid' || 
        (err.message && err.message.toLowerCase().includes('api-key-not-valid'))
      ) {
        message = 'The Firebase API key is invalid or contains placeholder values. Please verify your VITE_FIREBASE_API_KEY configuration.';
        userFriendlyCode = 'auth/api-key-not-valid';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network connection failed during authentication. Please check your connection and retry.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Google sign-in is not enabled in your Firebase Console. Enable Google under Authentication > Sign-in method.';
      } else if (err.message) {
        message = err.message;
      }

      const customErr = new Error(message);
      customErr.code = userFriendlyCode;
      throw customErr;
    }
  };
  
  const logout = async () => {
    setUser(null);
    setUserData(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Auth] Sign-out error:', err.message);
    }
  };

  const savePreferences = async (preferences) => {
    if (!user) return;
    const data = {
      email: user.email,
      preferences,
      isAdmin: false,
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
      setUserData(data);
      setIsNewUser(false);
    } catch (e) {
      console.warn('[Auth] Failed to persist user preferences:', e.message);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userData, 
        isNewUser, 
        loading, 
        login, 
        signup, 
        googleSignIn, 
        logout, 
        savePreferences,
        isFirebaseConfigValid,
        firebaseConfigStatus,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
