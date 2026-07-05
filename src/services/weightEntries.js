import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

function weightEntriesRef(userId) {
  return collection(db, 'users', userId, 'weightEntries');
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function subscribeToWeightEntries(userId, onChange, onError) {
  const q = query(weightEntriesRef(userId), orderBy('date', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      onChange(entries);
    },
    onError
  );
}

export async function logWeightEntry(userId, { weight, date }) {
  const ref = doc(db, 'users', userId, 'weightEntries', dateKey(date));
  return setDoc(
    ref,
    {
      weight,
      date: Timestamp.fromDate(date),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteWeightEntry(userId, entryId) {
  const ref = doc(db, 'users', userId, 'weightEntries', entryId);
  return deleteDoc(ref);
}
