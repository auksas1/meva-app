# Per-account history — backend handoff note

**Author:** Person C (mobile)
**Status:** not implemented. History is currently device-wide. This note describes what the
backend needs to add if we want history (and vehicles) tied to a logged-in account, and the
small frontend changes that follow.

---

## TL;DR

Right now "login" on mobile is **fake** — accounts are stored only on the device and the
backend has no idea who is logged in. So "show only my history" cannot be done truthfully
from the frontend. Making it real is mostly a **backend** job:

1. Add users + auth endpoints that return a token.
2. Add `user_id` to vehicles (and analyses).
3. Filter the list endpoints by the logged-in user.

Once that exists, the frontend change is tiny (store the token, send it on each request).

---

## Current state (verified in code)

| Thing | Where it lives | User-scoped? |
|-------|----------------|--------------|
| **Sessions** (an analysis = N photos) | Local only, AsyncStorage key `meva.history` — `mobile/src/services/historyStorage.ts` | No |
| **Vehicles** | Backend DB via `GET/POST/PATCH/DELETE /vehicles/` — `mobile/src/services/api.ts` | No (`user_id` does not exist) |
| **Analyses** | Backend, `POST /analysis/analyze`, `GET /analysis/?vehicle_id=…` | No |
| **Accounts / login** | Frontend-only fake, AsyncStorage keys `meva.auth.*` — `mobile/src/services/auth.ts` | n/a — backend has no users table, no auth endpoint, no token |

Key consequence: the History tab lists **vehicles from the backend**, and sessions are grouped
under them. If the backend DB is reset, vehicles disappear and History looks empty even though
local sessions still exist on the device. This is a backend-data issue, not a login issue.

---

## What the backend needs to add (for real per-account history)

1. **Users + auth**
   - `users` table (id, email, password_hash, name, created_at).
   - `POST /auth/register` and `POST /auth/login` that validate credentials and return a
     **token** (JWT or an opaque token) plus basic user info.
   - Hash passwords properly (bcrypt/argon2) — the mobile fake does **not**.

2. **Ownership on data**
   - Add `user_id` FK to `vehicles` (and ideally `analyses`).
   - On create, set `user_id` from the authenticated request (the token), not from the body.

3. **Scope the reads/writes**
   - `GET /vehicles/` and `GET /analysis/` return only rows belonging to the token's user.
   - `GET/PATCH/DELETE /vehicles/{id}` (and analysis equivalents) reject access to rows owned
     by another user (404/403).

That's the whole feature. With it, "my history" is simply "the vehicles/analyses the backend
returns for my token."

---

## Frontend follow-up (small, after the backend lands)

These are the only mobile changes needed — no per-user filtering is written on the frontend:

1. **Store the token.** Replace the bodies of `register` / `login` / `logout` /
   `getCurrentUser` in `mobile/src/services/auth.ts` with calls to the real endpoints, saving
   the token in AsyncStorage. The function signatures/return types stay the same, so the
   Login/Register screens and the Settings "Account" section don't change.
2. **Send the token.** Add an `Authorization: Bearer <token>` header in the shared `request()`
   helper in `mobile/src/services/api.ts`. Every vehicle/analysis call then gets scoped
   automatically.
3. **Sessions:** since the backend would now own per-user analyses, we can either keep the
   local `meva.history` cache as-is (still keyed per device) or migrate to reading sessions
   from the backend. Decide together — not required for a first version.

---

## Migration / edge cases to decide together

- Existing **device-local sessions** (pre-accounts): leave them unowned/local, or attach them
  to the first user who signs in?
- Existing **backend vehicles** with no `user_id`: backfill to a default user, or leave
  visible to everyone until claimed?
- Multiple devices: real accounts make history follow the user across devices — confirm that's
  the intended behavior (it's the main reason to do this at all).

---

## Why we are NOT doing a frontend-only fake

We could scope the local `meva.history` sessions by the local account id, but the **vehicles
still come from the backend and are shared**, so the History tab would still show everyone's
vehicles. The result would be inconsistent and give a false sense of privacy. Not worth it for
the demo — better to keep history device-wide until the backend supports real users.
