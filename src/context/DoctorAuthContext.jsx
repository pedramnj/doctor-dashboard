import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const DoctorAuthContext = createContext();

export const useDoctorAuth = () => useContext(DoctorAuthContext);

export const DoctorAuthProvider = ({ children }) => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
        setDoctor({ uid: user.uid, ...doctorDoc.data() });
      } else {
        setDoctor(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    doctor,
    login,
    logout,
    loading
  };

  return (
    <DoctorAuthContext.Provider value={value}>
      {!loading && children}
    </DoctorAuthContext.Provider>
  );
};