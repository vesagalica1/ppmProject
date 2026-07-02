import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

function workoutsRef(userId) {
  return collection(db, 'users', userId, 'workouts');
}

export function subscribeToWorkouts(userId, onChange, onError) {
  const q = query(workoutsRef(userId), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const workouts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onChange(workouts);
    },
    onError
  );
}

export async function fetchWorkouts(userId) {
  const q = query(workoutsRef(userId), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function addWorkout(userId, workout) {
  return addDoc(workoutsRef(userId), {
    exerciseName: workout.exerciseName,
    sets: workout.sets,
    reps: workout.reps,
    weight: workout.weight,
    notes: workout.notes || '',
    date: Timestamp.fromDate(workout.date),
    createdAt: serverTimestamp(),
  });
}

export async function updateWorkout(userId, workoutId, workout) {
  const ref = doc(db, 'users', userId, 'workouts', workoutId);
  return updateDoc(ref, {
    exerciseName: workout.exerciseName,
    sets: workout.sets,
    reps: workout.reps,
    weight: workout.weight,
    notes: workout.notes || '',
    date: Timestamp.fromDate(workout.date),
  });
}

export async function deleteWorkout(userId, workoutId) {
  const ref = doc(db, 'users', userId, 'workouts', workoutId);
  return deleteDoc(ref);
}
