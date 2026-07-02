import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function ensureUserProfile(userId, data) {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: data.email || '',
      displayName: data.displayName || '',
      reminderEnabled: false,
      reminderTime: '18:00',
      reminderDays: ['Mon', 'Wed', 'Fri'],
    });
  }
  return getUserProfile(userId);
}

export async function getUserProfile(userId) {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(userId, data) {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, data);
}
