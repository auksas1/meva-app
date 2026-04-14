# Mobile

React Native + Expo (TypeScript) client for AutoDamage.

## To get started:
```
cd mobile
npm install
npx expo start
```

Then from the Metro menu press:
- `w` — open in a web browser at http://localhost:8081
- `a` — launch on an Android emulator (requires Android Studio)
- `i` — launch on an iOS simulator (macOS only)
- Or scan the QR code with **Expo Go** on your phone (same Wi-Fi as your PC)

Stop Metro with `Ctrl+C`.

## Prerequisites
- **Node.js 20 LTS** (22 also works). Node 21 runs but triggers `EBADENGINE` warnings from transitive deps.
- **Expo Go** app on your phone for on-device testing — https://expo.dev/client
- *(Optional)* Android Studio + an AVD for the Android emulator path

## Scripts
```
npm start          # same as npx expo start
npm run android    # start + open Android
npm run ios        # start + open iOS (macOS only)
npm run web        # start + open in browser
```

## Type checking
```
npx tsc --noEmit
```

## Project structure
```
mobile/
├── App.tsx                     # Entry point — renders <AppNavigator />
├── src/
│   ├── screens/                # Screen components (one file per route)
│   │   └── HomeScreen.tsx
│   ├── navigation/             # React Navigation setup
│   │   └── AppNavigator.tsx    # Native-stack root navigator
│   ├── components/             # Reusable UI components
│   └── services/               # API clients, storage, business logic
├── assets/                     # Icons, splash, images
├── app.json                    # Expo config
└── tsconfig.json
```

## Tech stack
- **Expo** (managed workflow) + **React Native** + **TypeScript**
- **React Navigation** — `@react-navigation/native`, `native-stack`, `bottom-tabs`
- `react-native-screens`, `react-native-safe-area-context`

## Notes
- The backend lives in [../backend/](../backend/) — see its README for running the API locally.
- When the API is wired up, HTTP clients go in `src/services/`.
