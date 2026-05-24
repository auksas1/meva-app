# `mobile_patch/` — Drop-in redesign for the Expo app

A self-contained patch that ports the AutoDamage design system into your `mobile/` codebase. Foundation (theme + components) is fully native React Native; screens are refactored to compose the new components.

## What's inside

```
mobile_patch/
└── src/
    ├── theme/
    │   ├── tokens.ts           ← --ad-* tokens as TS objects (light + dark)
    │   ├── ThemeContext.tsx    ← ThemeProvider, useTheme(), AsyncStorage persistence
    │   └── index.ts            ← barrel
    ├── components/
    │   ├── PrimaryButton.tsx
    │   ├── SecondaryButton.tsx
    │   ├── DangerButton.tsx
    │   ├── LinkButton.tsx
    │   ├── Card.tsx
    │   ├── StatusBadge.tsx
    │   ├── EmptyState.tsx
    │   ├── EstimateLineItem.tsx
    │   ├── Field.tsx
    │   ├── SectionHeader.tsx
    │   ├── ScanTile.tsx        ← the AI Damage Scan hero CTA
    │   ├── BrandStamp.tsx      ← "AD" tile + AutoDamage / by MEVA AI label
    │   ├── severity.ts         ← scoreColor / severityLabel helpers
    │   └── SessionDetailView.tsx   ← REPLACES the existing file
    ├── screens/
    │   ├── analyze/
    │   │   ├── AnalyzeHomeScreen.tsx       ← REPLACES
    │   │   ├── ResultDetailScreen.tsx      ← REPLACES
    │   │   └── CameraScreen.tsx            ← REPLACES (new reticle)
    │   ├── auth/
    │   │   ├── LoginScreen.tsx             ← REPLACES
    │   │   └── RegisterScreen.tsx          ← REPLACES
    │   ├── history/
    │   │   └── VehicleListScreen.tsx       ← REPLACES
    │   └── SettingsScreen.tsx              ← REPLACES
    └── navigation/
        └── MainTabs.tsx                    ← REPLACES (themed icons + active pill)
```

## Integration in 5 steps

### 1. Copy files in

```bash
# from your repo root (the folder that contains `mobile/`)
cp -R mobile_patch/src/. mobile/src/
```

Existing files with the same paths are **overwritten** — they're cosmetic-only refactors that keep the original data flow, navigation, AsyncStorage, and API behavior intact. The new `theme/` and `components/*` files are net new.

### 2. Wire the theme provider

In `mobile/App.tsx`, wrap `<AppNavigator />` in `<ThemeProvider>`:

```tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
      <ThemedStatusBar />
    </ThemeProvider>
  );
}
```

### 3. Install Inter (optional but recommended)

```bash
npx expo install expo-font @expo-google-fonts/inter
```

Then in `App.tsx` add the font loader before rendering — example block at the bottom of this README.

### 4. Add the navigator background

In `src/navigation/AppNavigator.tsx`, wrap `NavigationContainer` so it adopts the theme background:

```tsx
import { useTheme } from '../theme';
// ...
const { tokens } = useTheme();
const navTheme = {
  dark: useTheme().isDark,
  colors: {
    background: tokens.bg,
    card: tokens.surface1,
    text: tokens.fg1,
    border: tokens.hairline,
    primary: tokens.primary,
    notification: tokens.severe,
  },
  fonts: DefaultTheme.fonts,   // import { DefaultTheme } from '@react-navigation/native'
};
return <NavigationContainer theme={navTheme}>{/* ... */}</NavigationContainer>;
```

### 5. Type check + run

```bash
cd mobile
npx tsc --noEmit
npx expo start --clear
```

Everything else (`historyStorage`, `vehicleStorage`, `api`, navigation param types, route names) is unchanged.

## Things this patch does **not** touch

- `src/services/**` (api, storage, validation, auth)
- `src/state/selectedPhotos.tsx`
- `src/navigation/{AppNavigator, AnalyzeStack, HistoryStack, SettingsStack, types}.tsx`
- `src/constants/config.ts`
- `src/types/analysis.ts`

If you want changes to any of those, ask.

## Inter font loader (optional)

```tsx
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';

const [fontsLoaded] = useFonts({
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
});
if (!fontsLoaded) return null;
```

And in `tokens.ts`, swap the `font` field to `'Inter_400Regular'` etc. (or use `Platform.select`).

## Pending screens (not refactored in this patch)

These were either light on visuals or weren't called out in the brief — refactor as needed using the same component patterns:

- `screens/analyze/PickVehicleScreen.tsx`
- `screens/analyze/PickSessionScreen.tsx`
- `screens/analyze/AddPhotosScreen.tsx`
- `screens/history/VehicleDetailScreen.tsx`
- `screens/history/HistorySessionScreen.tsx` (already uses the refactored `SessionDetailView`)
- `screens/edit/EditVehicleScreen.tsx`
- `screens/edit/EditRepairScreen.tsx`

For each: import `useTheme()`, build a `styles(tokens)` factory, swap raw colors for `tokens.primary` / `tokens.fg2` / `tokens.surface1` / etc, and replace bare `<View>` cards with `<Card>` from `components/Card`. The structure stays identical.
