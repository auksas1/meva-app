# AutoDamage Mobile UI Kit

An interactive, theme-toggleable recreation of the **AutoDamage by MEVA AI** mobile app. Built as Babel-transpiled JSX inside an iOS device frame, wired to a single stateful router.

## Open

Open `index.html`. Use the **Light / Dark** pill in the page header (or the sun/moon button in the in-app header) to flip themes. Dark is the default.

## Full flow

1. **Analyze tab** — tap the big "Take a photo" scan tile (or "Choose from Gallery" to add 2 sample photos).
2. Tap **Analyze N photos** — a glassy circular-progress overlay simulates validation + sequential upload.
3. **Choose vehicle** — assign the session to an existing vehicle or create one (pre-filled from the AI guess).
4. **Results** — top KPI card (estimate · photos · damages · severity), vehicle card, photo result cards, deduplicated parts ledger, repair log.
5. Tap any photo → **Photo detail** with a full-bleed hero image, severity + score badges, recommendation panel with an AI sparkle.
6. **History tab** — list of vehicles with worst-severity badge + session count.
7. **Settings tab** — branded `BrandStamp`, account card, theme toggle (segmented), backend URL field with connection-status dot, capture quality segmented, developer tools.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page shell. Loads Inter + React + Babel, mounts `AD_App` inside an `IOSDevice`. |
| `ios-frame.jsx` | Starter iOS device chrome (status bar, dynamic island, home indicator). |
| `Primitives.jsx` | Token Proxy (`AD_T`), `Icon`, all reusable components: `PrimaryButton`, `SecondaryButton`, `DangerButton`, `LinkButton`, `Card`, `StatusBadge`, `EmptyState`, `EstimateLineItem`, `Field`, `Input`, `Segmented`, `AppHeader`, `TabBar`, `BrandStamp`, plus `scoreColor`/`severityLabel`. |
| `Screens.jsx` | Per-screen compositions: `AnalyzeHome`, `PickVehicle`, `ResultsSummary` (+ `StatBlock` / `SectionHeader` / `PhotoResultCard` / `RepairCard` / `DataRow`), `ResultDetail`, `VehicleList`, `Settings`, `Login`, `CameraScreen`, `UploadOverlay`. |
| `App.jsx` | Stateful router (3 tabs × nested routes), sample data, theme prop drilling. |

## Theming

The `AD_T` token bag is a `Proxy` that reads `window.AD_DARK` on every property access. Toggling the boolean and re-rendering (via a `key` on the device wrapper) instantly swaps colors across the whole tree without prop-drilling theme context.

```js
const T = new Proxy({}, { get(_, k) { return (window.AD_DARK ? T_DARK : T_LIGHT)[k]; } });
```

## Lifting to React Native

These components are styled with inline `style={{}}` (web) — not `StyleSheet.create(...)`. To roll any of them into the real Expo app:

1. Translate `<button>` → `Pressable`, `<div>` → `View`, `<span>` → `Text`.
2. Replace inline styles with `StyleSheet.create({...})` and pass `themedStyles(T)` from a `ThemeContext`.
3. Swap `<Icon>` for `<Ionicons name="..." />` from `@expo/vector-icons`.
4. Swap `backdrop-filter: blur(...)` for `<BlurView intensity={n} tint="dark" />` from `expo-blur`.
5. Keep data flow, API contracts, AsyncStorage, navigation, validation, and the analysis pipeline **untouched** — the redesign is cosmetic only.

## What's mocked

- Camera screen shows a still cover photo behind the reticle (no live camera stream in HTML).
- Sample analysis results live in `App.jsx` as constants; in production these come from `services/api.ts`.
- `react-navigation` stack push transitions are replaced with simple route-state swaps.

## Component dependency map

```
PrimaryButton, SecondaryButton, DangerButton, LinkButton
Card ← (everywhere)
StatusBadge ← PhotoResultCard, ResultDetail, VehicleList
EmptyState ← AnalyzeHome, VehicleList, ResultsSummary (no-repairs)
EstimateLineItem ← ResultsSummary, ResultDetail
Field + Input + Segmented ← Login, Settings
AppHeader, TabBar ← App shell
BrandStamp ← Settings, Login
Icon ← all of the above
```
