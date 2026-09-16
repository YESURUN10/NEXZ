/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
          setIsNewUser(false);
        } else {
          setUserData(null);
          setIsNewUser(true);
        }
      } else {
        setUserData(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  
  const googleSignIn = () => signInWithPopup(auth, googleProvider);
  
  const logout = () => signOut(auth);

  const savePreferences = async (preferences) => {
    if (!user) return;
    const data = {
      email: user.email,
      preferences,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid), data);
    setUserData(data);
    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, userData, isNewUser, loading, login, signup, googleSignIn, logout, savePreferences }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
