---
name: autodamage-design
description: Use this skill to generate well-branded interfaces and assets for AutoDamage (by MEVA AI), an AI-powered vehicle damage detector. Contains design tokens, dark-first color system, typography (Inter), iconography (Ionicons), reusable components (PrimaryButton, Card, StatusBadge, EmptyState, etc), and a full mobile UI kit recreating the analyze → results → repair-log flow.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

- `colors_and_type.css` is the single source of truth for design tokens — use `--ad-*` (the redesigned AutoDamage system) for new work. `--meva-*` tokens are kept for legacy reference only.
- `ui_kits/mobile/Primitives.jsx` exports the full component set: `PrimaryButton`, `SecondaryButton`, `DangerButton`, `LinkButton`, `Card`, `StatusBadge`, `EmptyState`, `EstimateLineItem`, `Field`, `Input`, `Segmented`, `AppHeader`, `TabBar`, `BrandStamp`, and an `<Icon>` set that mirrors the Ionicons used in the codebase.
- `ui_kits/mobile/Screens.jsx` shows how to compose those primitives into real screens — read it before designing new screens.
- `ui_kits/mobile/index.html` is the live interactive prototype, fully theme-toggleable.

## When to use this skill

If creating visual artifacts (slides, mocks, throwaway prototypes), import `colors_and_type.css` for tokens and either lift JSX components from `Primitives.jsx` or copy patterns out of `preview/*.html` cards. Default to **dark mode** for product surfaces unless told otherwise.

If working on production code (the actual `mobile/src` codebase), do not copy these JSX/HTML files in directly — they're prototypes. Instead, translate the patterns into React Native: `Pressable + View + Text + StyleSheet`, with a `ThemeContext` carrying the `--ad-*` token bag.

## Voice & content rules

- **Product**: AutoDamage. **Company**: MEVA AI (small supporting label, never larger than AutoDamage).
- Second-person, terse, technical-confident. No emoji. No exclamation marks.
- Sentence case; ALL-CAPS only for short overlines (max ~4 words).
- Severity vocab: `Minor / Moderate / Significant` at 0.33 / 0.66 score buckets.
- Currency: `€` prefix, integer totals, no `EUR`.
- Missing-value placeholder: `—` em dash, never "N/A".
- Surface "AI" branding intentionally — "AI Damage Scan", "AI vehicle inspection", "AI detected: ...".

## Quick token reference

- **Cobalt primary** (light) `#2562ee` · (dark) `#3b7bff`
- **Scan gradient** `linear-gradient(135deg,#2562ee,#1d4ed8)` — hero CTA + brand-tile only
- **Severity** success `#22c55e` · warning `#f59e0b` · severe `#ef4444` (+ soft variants)
- **Surfaces (dark)** bg `#0a0e16` · card `#121823` · inset `#1a2230` · hairline `#232b3a`
- **Surfaces (light)** bg `#f7f8fb` · card `#fff` · inset `#f1f3f8` · hairline `#e6e9f0`
- **Type**: Inter — 24/700/-1.5% titles · 15/400 body · 11/600/+8% overline
- **Radii**: 8 chips · 12 buttons/inputs · 16 cards · 20 hero · pill badges
- **Shadows**: shadow-1 default · shadow-2 elevated · shadow-pop modal · primary-tinted glow on the cobalt CTAs and FAB

## Flagged substitutions

- **Logo / icon** — `assets/logo-*.svg` are substitutes; real brand assets pending.
- **Font** — Inter as a stand-in; swap `--ad-font` when a brand face is supplied.

If the user invokes this skill without other guidance, ask what they want to build, then design or code accordingly. Default output for design questions is an HTML artifact (deck, mock, prototype) loading `colors_and_type.css` and composing primitives from the kit.
