# MEVA AutoDamage — Mobile Frontend


## What the app does

The user takes (or picks) photos of vehicle damage, the app validates them locally, uploads them sequentially to the backend, the backend's AI service detects damage and returns structured results, the app shows the results, and analyses are saved as a **session** under a **vehicle** in the History tab.

Flow at a glance:

```
Analyze tab
  → Take Photo / Choose from Gallery (multi-select)
  → Selected thumbnails (remove with X)
  → Submit / Analyze
  → Validate all photos (size, dimensions)
  → Upload sequentially (1 of N…)
  → Pick vehicle (existing or new — AI guess pre-fills new form)
  → ResultsSummary (cards per photo)
  → tap photo → ResultDetail (image + score + damage zones + parts + cost + recommendation)
  → session saved to History under chosen Vehicle

History tab
  → VehicleList (cars the user has analyzed)
    → VehicleDetail (vehicle info + sessions for this car)
      → HistorySession (same view as ResultsSummary, fully editable)
        → ResultDetail
        → Edit vehicle / Add photos / Add repair record / Edit/Delete repair

Settings tab
  → Backend URL editor + "Check connection" button
  → Image quality (Low/Medium/High → 0.5/0.7/0.9)
  → About
  → Dev tools (Add test session / Clear all data)
```

---

## Tech stack

- **Expo SDK 54** managed workflow, **React Native 0.81**, **React 19.1**, **TypeScript 5.9**
- **React Navigation v7** — bottom tabs + native stacks per tab
- **expo-camera** (photo capture), **expo-image-picker** (multi-select gallery)
- **@react-native-async-storage/async-storage** (vehicles, sessions, settings)
- **@expo/vector-icons** (Ionicons)

No state management library — local `useState` + a single React Context for the in-progress photo list (`src/state/selectedPhotos.tsx`). All persistent data lives in AsyncStorage; everything else is per-screen state or props.

---

## Project structure

```
mobile/
├── App.tsx                         # Entry — renders <AppNavigator />
├── app.json                        # Expo config
├── package.json
├── tsconfig.json
└── src/
    ├── components/
    │   └── SessionDetailView.tsx   # Shared view for ResultsSummary + HistorySession
    ├── constants/
    │   └── config.ts               # Defaults: backend URL, image quality, validation thresholds
    ├── navigation/
    │   ├── AppNavigator.tsx        # Boot: hydrate settings, run migrations, render tabs
    │   ├── MainTabs.tsx            # Bottom tabs: Analyze | History | Settings
    │   ├── AnalyzeStack.tsx        # Native stack for Analyze tab
    │   ├── HistoryStack.tsx        # Native stack for History tab
    │   ├── SettingsStack.tsx
    │   └── types.ts                # All route param types
    ├── screens/
    │   ├── analyze/
    │   │   ├── AnalyzeHomeScreen.tsx
    │   │   ├── CameraScreen.tsx
    │   │   ├── PickVehicleScreen.tsx       # Modal after upload — assign session to vehicle
    │   │   ├── AddPhotosScreen.tsx          # Append photos to existing session
    │   │   ├── ResultsSummaryScreen.tsx
    │   │   └── ResultDetailScreen.tsx
    │   ├── history/
    │   │   ├── VehicleListScreen.tsx
    │   │   ├── VehicleDetailScreen.tsx
    │   │   └── HistorySessionScreen.tsx
    │   ├── edit/
    │   │   ├── EditVehicleScreen.tsx
    │   │   └── EditRepairScreen.tsx
    │   └── SettingsScreen.tsx
    ├── services/
    │   ├── api.ts                  # uploadImage / getAnalysis / healthCheck + types
    │   ├── validation.ts           # validateImage(uri) — size + dimensions
    │   ├── storage.ts              # Settings persistence (URL, quality)
    │   ├── vehicleStorage.ts       # Vehicle CRUD (AsyncStorage)
    │   └── historyStorage.ts       # Session CRUD + repair CRUD + legacy migration
    ├── state/
    │   └── selectedPhotos.tsx      # Provider for the pending photo list before Submit
    └── types/
        └── analysis.ts             # Shared types: AnalyzedPhoto, AnalysisSession, Vehicle, RepairRecord
```

---

## What's done (Sprint 3)

| Task | Status | Notes |
|---|---|---|
| T3.1 Camera screen | ✅ | Permission gate, flash toggle, front/back, capture, preview, retake |
| T3.2 Gallery upload | ✅ | Multi-select, deduplication by URI |
| T3.3 Image validation | ✅ | Min 640×480, max 10 MB; runs at Submit, blocks upload on failure |
| T3.4 Bottom tabs | ✅ | Analyze \| History \| Settings (Camera lives in Analyze stack) |
| T3.5 Results screens | ✅ | Summary + Detail. **No bounding boxes** — list view only (per CLAUDE.md) |
| T3.6 History | ✅ | Restructured: Vehicles → sessions → photo detail |
| T3.7 Settings | ✅ | URL config + healthcheck + image quality + About + dev tools |
| T3.8 API service | ✅ | `uploadImage`, `getAnalysis`, `healthCheck`, `setBaseUrl`, `getBaseUrl`, 30s timeout, typed errors |
| T3.9 Full flow | ✅ | Validate → upload → pick vehicle → results → saved to History |
| **+** Vehicle entity | ✅ | History grouped by Vehicle, sessions reference `vehicleId` |
| **+** Repair log | ✅ | Per-session list of work performed (date, mechanic, cost, notes) |
| **+** Add photos to session | ✅ | Append more photos to an existing session later |
| **+** Parts dedup | ✅ | Same part across photos counted once at highest reported cost |
| **+** Migration | ✅ | Legacy sessions auto-converted to Vehicle entity on first launch |

`npx tsc --noEmit` passes.

---

## Backend contract

All HTTP calls go through `src/services/api.ts`. The base URL is configurable in Settings (persisted to AsyncStorage).

### `POST /analysis/analyze`

**Request:** `multipart/form-data` with field `file` (single image, JPEG or PNG).

**Response (200):**
```ts
{
  // Required — frontend will fail if these are missing
  id: number,
  image_filename: string,
  damage_score: number,         // 0.0 – 1.0
  damage_zones: [
    {
      label: string,            // e.g. "Dent", "Scratch", "Crack"
      confidence: number,       // 0.0 – 1.0
      bbox: [number, number, number, number]  // NORMALIZED [x1,y1,x2,y2] in 0–1
    }
  ],
  status: string,               // e.g. "completed"
  created_at: string,           // ISO-8601

  // Optional — frontend reads if present, shows "—" if absent
  vehicle_brand?: string,       // "Toyota"
  vehicle_model?: string,       // "Corolla"
  vehicle_year?: number,        // 2018
  affected_parts?: [
    { name: string, estimated_cost?: number }   // "Front bumper", 420
  ],
  total_estimated_cost?: number,  // 600 — sum for THIS photo only
  repair_recommendation?: string  // "Moderate damage — body shop inspection recommended."
}
```

The matching TypeScript type is `AnalysisResponse` in `src/services/api.ts`.

**Error responses:** standard FastAPI shape `{ "detail": "..." }`. Frontend reads `detail` and shows it in an Alert.

### `GET /analysis/{id}`
Same response shape. Currently the mobile app does not use this endpoint after upload (sessions are cached locally in AsyncStorage), but the function is implemented and ready.

### `GET /health`
```json
{ "status": "ok" }
```
Used by Settings → "Check connection". Anything else (or non-200) is treated as failure.

### Behavioral expectations from backend
- **Bbox stays normalized 0–1.** Frontend multiplies by display dimensions. Switching to pixel coords silently breaks future bounding-box overlays (currently disabled per CLAUDE.md).
- **One image per request.** Mobile uploads sequentially; do not require batching.
- **≤30 s per request.** Mobile aborts at 30 s via `AbortController`.
- **CORS for web.** When testing via `npm run web`, mobile makes cross-origin calls. Backend needs `CORSMiddleware` with permissive origins for dev.
- **Bind to 0.0.0.0** (not 127.0.0.1) so emulators and phones can reach it.

### Network targets

| Client | Backend URL |
|---|---|
| Android emulator | `http://10.0.2.2:8000` |
| iOS simulator / web | `http://localhost:8000` |
| Physical phone (Expo Go) | `http://<your LAN IP>:8000` |

---

## AI output requirements

The AI must produce, per image, the structure of `damage_zones` above. Mandatory fields:

- `label`: short string for damage type — keep label set small and consistent (Dent, Scratch, Crack, Bumper damage, Broken light, etc.) so frontend's "damage breakdown" grouping looks tidy.
- `confidence`: 0–1, must be calibrated enough that thresholding at e.g. 0.5 yields meaningful detections.
- `bbox`: normalized, **always** `[x1, y1, x2, y2]` with `x1 < x2`, `y1 < y2`.

`damage_score` is the AI's overall severity for the image (0–1). The frontend buckets it into Minor / Moderate / Significant at 33% and 66%.

Optional but high-value (frontend ready to display, currently shows "—" without):
- **Vehicle make/model/year detection** — even rough guesses help the user (they can correct via Edit).
- **Parts mapping** — translating damage zones into part names (`affected_parts`). Backend likely needs a part lookup table or AI taxonomy.
- **Cost estimation** — backend's job (using a parts price table), not the AI's. AI provides parts; backend prices them. **Mobile does not estimate cost client-side.**
- **Recommendation text** — short human-readable string; frontend displays as-is.

The frontend **does not** do any AI/detection work. CLAUDE.md is firm on this: *"The frontend must not decide where damage is. It only displays backend results."*

---

## Data the mobile app stores locally

All persistent data is in `AsyncStorage`. Keys and shapes:

### `meva.vehicles` — `Vehicle[]`
```ts
type Vehicle = {
  id: string;              // generated client-side
  brand?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  notes?: string;
  createdAt: string;       // ISO
};
```
Created at upload time (PickVehicle modal) or manually from the History tab. `vehicleDisplayName(v)` returns `"Toyota Corolla 2018"` or fallback `"Unnamed vehicle"`.

### `meva.history` — `AnalysisSession[]`
```ts
type AnalysisSession = {
  id: string;
  vehicleId: string;       // FK → Vehicle.id
  createdAt: string;
  photos: AnalyzedPhoto[]; // see below
  repairs?: RepairRecord[];
};

type AnalyzedPhoto = {
  localUri: string;        // file:// or content:// URI of the captured/picked image
  result: AnalysisResponse; // exact backend response
};

type RepairRecord = {
  id: string;
  performedAt: string;     // ISO date
  performedBy?: string;    // mechanic / shop name
  workDescription?: string;
  actualCost?: number;     // EUR
  notes?: string;
};
```



## To do next

### Backend (FastAPI)
1. Implement the three endpoints above with the **required** response fields.
2. Persist `POST /analysis/analyze` results so `GET /analysis/{id}` returns them.
3. Bind to `0.0.0.0:8000`, enable CORS for dev, return errors as `{ "detail": "..." }`.
4. **Optional but valuable:** populate `affected_parts`, `total_estimated_cost`, `repair_recommendation`, and the three `vehicle_*` fields. Frontend already renders them when present.
5. Cost calculation lives in backend (e.g. parts lookup table). Don't rely on frontend.

### AI service
1. Return `damage_zones` (label/confidence/normalized bbox) + `damage_score` per image.
2. Keep label set small and stable.
3. Bbox stays normalized 0–1.
4. If model can identify vehicle make/model/year, return them; otherwise omit.
5. Mapping detected zones → `affected_parts` is preferred to be done in backend (or AI-assisted, your call), not in mobile.

### Database / data
1. Schema mirrors the response shape: an `analyses` table with the required fields, `damage_zones` as a JSON column or a related table, and (if you add it) an `affected_parts` association.
2. A **parts price table** is needed for cost estimation: `(part_name, base_cost)` or `(part_name, vehicle_class, cost)` if you want make/model-specific pricing later. Provide it as JSON or a DB seed.
3. **Vehicles** are currently only client-side. If/when you add a Vehicles table on the backend, expose CRUD endpoints and mobile will switch from AsyncStorage to the API. Schema match: `id, brand, model, year, license_plate, notes, created_at`.
4. Sessions/repair logs are local-only this sprint — defer backend persistence unless time permits.

---

## Running locally

```bash
cd mobile
npm install
npx expo start
```

Then in the Metro menu:
- `w` → web at http://localhost:8081
- `a` → Android emulator
- `i` → iOS simulator (macOS only)
- Or scan the QR with **Expo Go** on a phone on the same Wi-Fi.

Stop Metro with `Ctrl+C`.

### Prerequisites
- **Node 20 LTS** (22 also OK). Node 21 works but emits `EBADENGINE` warnings from transitive deps.
- **Expo Go** on your phone for device testing → https://expo.dev/client
- *(Optional)* Android Studio + AVD for the emulator path.

### Scripts
```
npm start          # same as npx expo start
npm run android    # start + open Android
npm run ios        # start + open iOS (macOS only)
npm run web        # start + open in browser
```

### Type check
```
npx tsc --noEmit
```

### Testing without a backend
Settings tab has a **Dev tools** section with two buttons:
- **Add test session** — creates a fake session with realistic vehicle/parts/cost/recommendation data, attached to a randomly picked or newly created Vehicle. Use this to verify History/Result screens without backend.
- **Clear history** — wipes both vehicles and sessions.

Camera capture and gallery picker still work without a backend; the Submit step is what fails (caught and shown as an alert with a hint to check the URL in Settings).

---

## Known limits / future work

- **No bounding-box overlay on Result Detail.** CLAUDE.md explicitly defers this. The data is there in `damage_zones[].bbox` — when needed, install `react-native-svg` and draw `<Rect>` per zone scaled by displayed image dims.
- **No authentication.** Single-user, single-device. Out of scope this sprint.
- **No offline queue.** Failed uploads abort the whole Submit; user retries manually.
- **Local image URIs.** Photos referenced by `file://` paths can be invalidated by Android cache cleanup. For demo this is fine; production would copy to app document directory.
- **Vehicles client-only.** No backend mirror — moving devices loses your history.
- **No date picker** on Edit Repair — user types `YYYY-MM-DD`. Could add `@react-native-community/datetimepicker` later.
- **Sprint 4 candidates:** auto-services / online parts links in Recommendation, vehicle photo, repair receipts attachments, cross-device sync.

---

## Architecture invariants (don't break these)


1. Mobile **never fakes detection results.** The backend / AI is the only source of truth for damage_zones, damage_score, brand/model.
2. Mobile **does compute cosmetic aggregations:** severity label from score, damage breakdown grouping, parts dedup across photos, total estimate sum. These are pure presentation, not domain decisions.
3. Mobile **trusts user overrides** of vehicle info (Edit Vehicle). What the user types takes precedence over what AI returned.
4. Mobile **uploads one image at a time, sequentially.** Don't add batched endpoints expecting client to use them.
5. Mobile **does not retry failed uploads automatically.** A failure aborts the session and shows an Alert. User retries via Submit.

If your work needs to violate one of these, talk to mobile dev first.
