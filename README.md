# GymLog — Workout Tracker with Reminders

A React Native (Expo) app for logging gym workouts, built with Firebase
Authentication and Firestore, plus local notification reminders.

## Features

- **Auth** — Email/password sign up & log in (Firebase Authentication)
- **Home** — list of logged workouts with a weekly count and day streak
- **Add Workout** — log exercise, sets, reps, weight, date, and notes
- **Workout Detail** — view, edit, or delete a logged workout
- **Profile** — account info, daily workout reminder notification, sign out
- **CRUD** — full create/read/update/delete against Firestore
- **Device feature** — local notifications (`expo-notifications`) for a daily
  workout reminder, with a "send in 5s" test button for live demos

## Tech stack

- React Native + Expo (SDK 57)
- React Navigation (bottom tabs + native stack)
- Firebase JS SDK (Authentication + Firestore)
- expo-notifications / expo-device
- @react-native-community/datetimepicker

## Project structure

```
App.js
src/
  components/     Reusable UI (buttons, text fields, cards)
  context/        AuthContext (Firebase auth state)
  navigation/      RootNavigator, AppNavigator (tabs + stacks)
  screens/        AuthScreen, HomeScreen, AddEditWorkoutScreen,
                  WorkoutDetailScreen, ProfileScreen
  services/       firebase.js, workouts.js (CRUD), userProfile.js,
                  notifications.js
  theme/          colors, spacing, typography
```

## 1. Set up a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and
   create a new project.
2. Add a **Web app** to the project (the `</>` icon on the project overview
   page). You don't need Firebase Hosting.
3. Copy the `firebaseConfig` object it gives you.
4. Paste those values into `src/services/firebaseConfig.js`, replacing the
   placeholders.
5. In the console, enable:
   - **Authentication → Sign-in method → Email/Password**
   - **Firestore Database → Create database** (start in production mode is
     fine, since we set explicit security rules below)

### Firestore security rules

In **Firestore Database → Rules**, replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /workouts/{workoutId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

This keeps every user's data private to that user.

### Data model

```
users (collection)
  └── {userId} (doc)
        ├── email
        ├── displayName
        ├── reminderEnabled: boolean
        ├── reminderTime: "18:00"
        ├── reminderDays: ["Mon", "Wed", "Fri"]
        └── workouts (subcollection)
              └── {workoutId} (doc)
                    ├── exerciseName: string
                    ├── sets: number
                    ├── reps: number
                    ├── weight: number
                    ├── notes: string
                    ├── date: timestamp
                    └── createdAt: timestamp
```

## 2. Install dependencies

```bash
npm install
```

## 3. Run the app

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (Android or iOS), or
press `a` / `i` in the terminal to launch an emulator if you have one set up.

> Local notifications work in Expo Go for the SDK version pinned in this
> project. If a future Expo Go release drops support, run
> `npx expo run:android` (or `run:ios`) to build a development client.

## Demoing the notification feature live

Local (non-push) notifications are used, so no backend/APNs/FCM setup is
needed:

1. Go to **Profile** and toggle **Daily reminder** on (grant the permission
   prompt).
2. Tap **Reminder time** and set it to a minute or two in the future.
3. Background the app (or just wait) — the notification will fire at that
   time.
4. For an instant demo, tap **Send test reminder in 5s**, which schedules a
   one-off notification 5 seconds out regardless of the daily reminder
   setting.

## Notes on CRUD mapping

| Operation | Where |
|---|---|
| Create | Add tab → `addWorkout()` → `addDoc` on `users/{uid}/workouts` |
| Read | Home tab → `subscribeToWorkouts()` → `onSnapshot` query ordered by date |
| Update | Workout Detail → Edit → `updateWorkout()` → `updateDoc` |
| Delete | Workout Detail → Delete → `deleteWorkout()` → `deleteDoc` |
