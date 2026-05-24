# AutoDamage Design System (by MEVA AI)

A design system for **AutoDamage** — an AI-powered vehicle damage detection app. Users photograph damaged areas, the AI returns structured detections (zones, parts, cost), and results are organised as **sessions** under **vehicles** with a per-session **repair log**.

This system documents the **proposed redesign** of the existing Expo / React Native app: a dark-first, automotive-diagnostic aesthetic with cobalt accent, clear severity language, and a properly layered component set. The original utilitarian palette (faithful to the current `mobile/src` code) is preserved under `--meva-*` legacy tokens for reference.

## Brand naming

- **Product name** — `AutoDamage`
- **Company / supporting label** — `by MEVA AI` (small, never larger than the product name)
- **App icon** — rounded square tile, scan-gradient cobalt, `AD` monogram in 800-weight Inter

## Sources used to build this system

| Source | Path / link | Status |
|---|---|---|
| Mobile codebase (Expo SDK 54, RN 0.81, TS 5.9) | local mount: `mobile/` | Read fully (read-only) |
| App config | `mobile/app.json` | Read |
| Sprint notes | `mobile/README.md` | Read |
| All screens | `mobile/src/screens/**` | Read |
| Shared component | `mobile/src/components/SessionDetailView.tsx` | Read |
| Navigation | `mobile/src/navigation/**` | Read |
| Constants | `mobile/src/constants/config.ts` | Read |
| App icon | `mobile/assets/icon.png` | Copied — **Expo placeholder, not a real brand mark** |

No Figma file, brand guide, marketing site, or web app was attached. The redesign brief in this README is an opinionated proposal informed by the codebase + a written brief.

---

## Index

```
.
├── README.md                  ← you are here
├── SKILL.md                   ← agent-skill entry point
├── colors_and_type.css        ← all design tokens (--ad-* primary, --meva-* legacy)
├── assets/
│   ├── logo-mark.svg          ← substituted "AD" monogram
│   ├── logo-wordmark.svg      ← substituted two-tone "AutoDamage" wordmark
│   ├── icon.png …             ← Expo template icons (placeholders, not branded)
├── preview/                   ← Design System tab cards
│   ├── _card.css
│   ├── colors-*.html
│   ├── type-*.html
│   ├── spacing-scale.html, radii.html, elevation.html
│   ├── components-*.html      ← buttons, inputs, segmented, info-box, photo card, repair card, status badge, empty state
│   └── brand-*.html
└── ui_kits/mobile/
    ├── README.md
    ├── index.html             ← interactive AutoDamage prototype (light + dark)
    ├── ios-frame.jsx          ← starter component
    ├── Primitives.jsx         ← tokens + Icon + PrimaryButton + SecondaryButton +
    │                            DangerButton + Card + StatusBadge + EmptyState +
    │                            EstimateLineItem + Field + Input + Segmented +
    │                            AppHeader + TabBar + BrandStamp
    ├── Screens.jsx            ← AnalyzeHome, PickVehicle, ResultsSummary,
    │                            ResultDetail, VehicleList, Settings, Login, Camera,
    │                            UploadOverlay (+ PhotoResultCard, RepairCard, StatBlock)
    └── App.jsx                ← stateful router
```

---

## Content fundamentals

The product voice stays **direct, second-person, terse** — but with a more confident technical edge than the original copy.

- **Product framing language** — "AI Damage Scan", "AI vehicle inspection", "AI detected: …". The word **AI** appears as an explicit signal in primary surfaces (analyze hero, settings stamp, scan overlay).
- **Sentence case** for everything except short overlines (`AI VEHICLE INSPECTION`, `ANALYSIS COMPLETE`, `SPENT`).
- **Severity vocabulary** stays `Minor / Moderate / Significant` bucketed at 0.33 / 0.66. Always paired with the score percentage. Never displayed as a sentence ("This damage is significant") — only as a label or badge.
- **Currency** — `€` prefix, no space, never `EUR`. Integers only on totals (`Math.round`).
- **No emoji.** Iconography is line-icons + the AI ↔ damage symbol set (`sparkles`, `shield`, `scan`).
- **Em dash `—`** is the only "missing value" placeholder. Never "N/A".
- **Approximate** estimates are not prefixed with `~` anymore — the redesign uses an explicit "Estimated total" label above the big number instead.
- **CTAs are verbs** — "Take a photo", "Choose from Gallery", "Analyze 2 photos" (count-aware), "Sign in", "Save", "Check".
- **Submit button is count-aware**: text becomes `"Analyze 2 photos"` when photos are queued, falls back to `"Submit / Analyze"` when empty.
- **Privacy footnote** under the submit button: *"Photos are sent to the MEVA AI service for analysis."* — shield icon, small caption.
- **Empty states** are full-card units (icon tile + title + body), not bare strings.

---

## Visual foundations

### Color
- **Primary** — `#2562ee` (light) / `#3b7bff` (dark). "Deep electric blue" / cobalt. Used for primary CTAs, links, active tab, focus ring, FAB.
- **Scan gradient** — `linear-gradient(135deg, #2562ee → #1d4ed8)` — reserved for the AnalyzeHome hero CTA and the brand stamp's app-icon tile. Not used anywhere else.
- **Severity** — Tailwind-style ramps:
  - Success `#22c55e` + soft `#dcfce7` / dark soft `#163325`
  - Warning `#f59e0b` + soft `#fef3c7` / `#3a2a13`
  - Severe `#ef4444` + soft `#fee2e2` / `#3b1d1d`
- **Backgrounds**
  - Light app bg `#f7f8fb` · surface-1 `#fff` · surface-2 `#f1f3f8` · surface-3 `#e8ecf3`
  - Dark app bg `#0a0e16` (near-black with navy hint) · surface-1 `#121823` · surface-2 `#1a2230` · surface-3 `#232b3b`
- **Hairlines** `#e6e9f0` / `#232b3a` — always 1px; cards rely on hairline + soft shadow, not heavy borders.
- **No saturated solid card fills.** Soft tints (`primarySubtle`, severity-soft) only on the recommendation panel and status pills.

### Type
- **Inter** — Google Font, weights 400/500/600/700/800.
- Hierarchy: display 28, h1 24 (tracking -1.5%), h2 18, card title 16, body 15, meta 13, caption 12, overline 11 (uppercase + 8% tracking).
- Tabular numbers (`font-variant-numeric: tabular-nums`) for: damage score %, KPI numbers, currency.

### Spacing
- 4-multiple scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56.
- Screen padding **20**, section gap **24**, card padding **16** (12–20 contextually).

### Radii
- 8 (chips/pills) · 12 (buttons, inputs) · 16 (cards) · 20 (hero scan tile) · 999 (badges/FAB).

### Elevation
- `shadow-1` (cards, inputs): `0 1px 2px rgba(15,22,40,0.04), 0 1px 3px rgba(15,22,40,0.04)`
- `shadow-2` (elevated cards, hover): `0 4px 14px rgba(15,22,40,0.06), 0 1px 3px rgba(15,22,40,0.04)`
- `shadow-pop` (overlay modal): `0 14px 36px rgba(15,22,40,0.12), 0 2px 6px rgba(15,22,40,0.05)`
- FAB and primary CTA both carry a primary-tinted glow: `0 10px 24px rgba(37,98,238,0.35)`.
- Dark mode multiplies opacities; the same recipe still applies.

### Imagery
- The only product imagery is **user-captured photos** (damage shots).
- Photos render at 76px (result card thumb), 92px (selected strip), 100% width with 4:3 aspect (detail view). Each thumb gets a subtle 1px hairline border in light mode.
- The detail view overlays severity (left badge) + score % (right badge) on the photo with `backdrop-filter: blur(8px)` chips.

### Animation / interaction
- **Buttons** — press scales to `0.98` with an 80ms ease.
- **Inputs** — focus ring 3px in `primarySubtle`, border to `primary`. No motion.
- **Cards** — no hover lift; cursor: pointer when clickable.
- **Upload overlay** — circular SVG progress ring around the photo count, glassy `Card` with `backdrop-filter: blur(10px)` over the scrim.
- **Camera reticle** — corner brackets in cobalt instead of a circular target.

### Transparency / blur
- `backdrop-filter: blur(8–12px)` used in: severity badges on photo, camera scan controls, the upload-overlay scrim.
- The scan-tile hero uses a subtle grid pattern at 18% opacity for an "active scanning" feel.

### Layout
- **One column** per screen. Photo strip scrolls horizontally.
- **Fixed elements:** bottom tab bar, FAB on VehicleList, modal overlays.
- **Cards do most of the work** — every section of a content screen sits on a card. The card is the visual unit, not the screen.

---

## Iconography

- **One icon family**: Ionicons (codebase uses `@expo/vector-icons`). For HTML, use the SVG re-draws in `ui_kits/mobile/Primitives.jsx`'s `<Icon>` or the `ionicons` CDN web component.
- **Stroke** — `1.8` default, `2.2` for accent / active states.
- **Sizes** — 14 (overline icons), 18 (chevron), 20 (button), 22 (in-row), 24 (tab), 26 (control), 56 (empty-state tile inner).
- **AutoDamage-specific icons** beyond the original set: `sparkles` (AI / recommendation), `shield` (privacy / repaired).
- **No PNG icons.** No emoji. Unicode separators (`·`, `—`) still allowed in copy.

---

## What changed vs. the original codebase (proposal)

| Area | Original (`mobile/src`) | Proposed redesign |
|---|---|---|
| Theme | Light only | **Dark-first**, light optional, both supported via `--ad-*` tokens |
| Brand color | Flat `#1f6feb` | Cobalt `#2562ee` + scan gradient for hero / brand stamp |
| Severity | Inline colored % | StatusBadge pill (soft fill + dot) reused everywhere |
| Buttons | Two side-by-side filled buttons | Hero scan tile + outlined secondary; count-aware Submit |
| Cards | Flat `#f7f7f7` info-box | Real cards (hairline + soft shadow + 16px radius) on every screen |
| Tab bar | Color-on-color | Pill highlight behind active tab icon |
| Submit / Analyze | Filled green button always visible | Disabled muted state until photos are present; primary cobalt when ready; privacy footnote below |
| Photo card | Thumb + plain % | Thumb with overlay score chip + severity pill + meta line |
| Result detail | Score number + plain rows | Hero photo with overlaid badges + cards per section + Recommendation panel with AI sparkle |
| Empty state | One-line gray text | Tiled `EmptyState` component (icon → title → body → optional action) |
| Settings | Plain rows | Cards per section + theme toggle as a Segmented control + connection-status dot |

---

## Mobile UI Kit

`ui_kits/mobile/index.html` is the interactive proposal. It demonstrates the redesigned analyze flow, vehicle picker, results, photo detail, history list, settings, camera, login, and upload overlay — all responsive, both themes, both nav states.

For full instructions on the kit's structure and how to compose new screens, see `ui_kits/mobile/README.md`.

### Production constraint

The `mobile/` folder is mounted **read-only** in this project — these proposed components are not committed to your codebase from here. To roll the redesign into production:

1. Lift the `--ad-*` token values from `colors_and_type.css` into a new `mobile/src/theme/tokens.ts`.
2. Translate the JSX primitives in `Primitives.jsx` into React Native `StyleSheet`s, using `Pressable` + `View` + `Text` in place of `<button>` / `<div>` / `<span>`.
3. Replace the inline-style screens in `Screens.jsx` with component compositions per-screen file in `mobile/src/screens/**`.
4. Add a `useColorScheme()` + `ThemeContext` to flip between the light/dark token sets.
5. Keep all data flow, API, navigation, AsyncStorage, and analysis behavior **unchanged** — this redesign is cosmetic.

---

## Flagged / still needed

1. **Real logo + app icon.** `assets/logo-mark.svg` and `assets/logo-wordmark.svg` are substitutes. Please attach the real brand assets or confirm.
2. **Brand typeface.** The system uses Inter as a stand-in. If MEVA has a brand typeface, swap `--ad-font`.
3. **Photography style.** No marketing / hero photography exists; severity is conveyed only via real user-uploaded damage photos.
4. **Web / backoffice surfaces.** Only mobile is covered. If a portal or marketing site exists, ping me and I'll extend.
