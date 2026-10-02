# MEVA — Mobile

Expo / React Native client. Setup, running and accounts: see the [root README](../README.md).

Typecheck: `npx tsc --noEmit`.

## Data stored on the device

Vehicles and analyses live on the backend. Only these stay in `AsyncStorage`:

| Key | Contents |
|---|---|
| `meva.auth.token`, `meva.auth.user` | Current session |
| `meva.history.<userId>` | `AnalysisSession[]` (photos grouped per scan + repair records), per signed-in user |
| `meva.backend_url`, `meva.image_quality` | Settings |

Types: `src/types/analysis.ts`. The app never decides where damage is; it only shows backend results.
