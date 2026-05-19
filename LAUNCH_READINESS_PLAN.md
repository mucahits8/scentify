# Scentify Launch Readiness (7-Day)

## 1) Core product-critical flows
- Auth: sign-up/sign-in/sign-out with real Supabase session.
- Profile hydration: load `users` and `user_scent_dna` on login.
- Onboarding writeback: save preferences + DNA + owned collection rows.
- Collection writeback: add/update status in `collections`.
- Rating writeback: persist in `ratings` and sync to collection view.

## 2) Catalog media plan (no manual one-by-one hunt)
- Build media manifest from Supabase catalog:
  - `npm run media:manifest`
  - Output: `assets/media-manifest.json`
- Use one source of truth per entity:
  - Perfume bottle image (`perfumes.image_url`)
  - Brand hero/cover image (recommended: add in `brands`)
  - Perfumer portrait (recommended: add in dedicated `perfumers` table)
- Maintain a simple QA rule set:
  - portrait ratio for perfumers
  - landscape for brand hero
  - bottle/product framing for perfumes
  - minimum width target (>=1200px)

## 3) Data quality and scale
- Minimum launch seed:
  - 300+ perfumes with image
  - 40+ brands
  - 60+ perfumers
- Required fields for each perfume:
  - `name`, `brand`, `families`, `scent_vector`, `perfumers`, `image_url`
- Add automated checks:
  - missing image counts
  - missing slug/brand_slug
  - empty families/perfumers

## 4) Ops checklist before production
- Supabase:
  - RLS verified for all user-scoped tables
  - backups enabled
  - rate limits and alerting configured
- Mobile:
  - crash reporting
  - analytics events for onboarding/completion/collection actions
  - release build smoke test on iOS + Android
- Product QA:
  - full auth flow
  - onboarding completion
  - add/remove/update collection status
  - rating persistence
  - app cold-start session restore

## 5) Week execution order
1. Lock auth + onboarding + collection persistence.
2. Finish catalog media pass using manifest workflow.
3. Add missing brand/perfumer assets and wire detail pages to real media.
4. Run full QA script and fix blockers.
5. Prep App Store/Play Store release candidate.
