# FriendQuiz

A mobile-friendly "How well do you know me?" quiz app using React, Vite and Firebase Realtime Database.

## Run

```bash
npm install
npm run dev
```

Then open the Vite local URL.

## Firebase

The Firebase config is already included in `src/firebase.js`.

For a quick prototype, the included `database.rules.json` allows public read/write access. **Do not use those open rules for a public production app.** Add Firebase Authentication and restrictive rules before launch.

## Routes

- `/` Home
- `/create` Create quiz
- `/quiz/:id` Play quiz
- `/result/:id` Result
- `/leaderboard/:id` Leaderboard
