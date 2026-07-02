import { getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebaseConfig';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth throws if it has already been called once (e.g. after a
// fast-refresh reload), so fall back to whatever instance already exists.
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
