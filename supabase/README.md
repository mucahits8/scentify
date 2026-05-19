# Scentify Supabase

This folder contains the database schema, RLS policies, and edge-function contracts for Scentify V1.

## Migrations

Run migrations with the Supabase CLI after linking the project:

```bash
supabase db push
```

The migrations are ordered to support a clean bootstrap:

1. `001_users.sql`
2. `002_perfumes.sql`
3. `003_collections.sql`
4. `004_ratings.sql`
5. `005_dna_profiles.sql`
6. `006_daily_recommendations.sql`
7. `007_catalog_enrichment.sql`
8. `008_brand_perfumer_media.sql`
9. `009_media_fallback_fill.sql`
10. `010_media_empty_string_fix.sql`

## Seed note

For V1, seed `perfumes` first, then user-dependent tables only after test users exist.

Recommended seed order:

1. extensions and schema migrations
2. perfume catalog
3. test auth users
4. profile and preference rows
5. collection, rating, and recommendation fixtures

If you keep a large catalog in JSON or CSV, prefer a repeatable script or `supabase db seed` entry rather than manual inserts.

## Catalog import

The current fragrance dataset can be imported from `fra_cleaned.csv` with the provided script:

```bash
npm run catalog:import -- /Users/mucahit/Desktop/fra_cleaned.csv
```

Required environment for import:

```bash
export EXPO_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Dry-run without writing:

```bash
npm run catalog:import -- /Users/mucahit/Desktop/fra_cleaned.csv --dry-run
```

## Media workflow

Build a catalog-wide media manifest:

```bash
npm run media:manifest
```

Export a CSV template you can bulk-fill:

```bash
npm run media:template
```

Sync derived perfumers from `perfumes.perfumers`:

```bash
npm run catalog:sync-perfumers
```

Import media updates from CSV or JSON:

```bash
npm run media:import -- ./assets/media-template.csv
```

Auto-enrich brand/perfumer media from Wikipedia:

```bash
npm run media:auto:wiki
```

Auto-fetch perfume images from each perfume `source_url` page:

```bash
npm run media:auto:perfumes -- 1200 6
```
