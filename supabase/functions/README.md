# Edge Function Contracts

This document defines the expected request/response shapes for Scentify V1 edge functions.

All functions should:

- verify the `Authorization: Bearer <jwt>` header when the endpoint is user-scoped
- use the Supabase service role only when server-side writes must bypass RLS
- return consistent JSON envelopes with `data`, `error`, and `meta` where useful

## `POST /functions/v1/calculate-dna`

Purpose: calculate or recalculate the user's Scent DNA profile.

Request body:

```json
{
  "loved_perfume_ids": ["uuid"],
  "disliked_perfume_ids": ["uuid"],
  "owned_perfume_ids": ["uuid"],
  "preferred_styles": ["Fresh"],
  "avoid_notes": ["Heavy Oud"]
}
```

Response:

```json
{
  "data": {
    "fresh": 82,
    "woody": 61,
    "profile_tags": ["Clean", "Fresh", "Woody"]
  }
}
```

## `POST /functions/v1/get-recommendations`

Purpose: score perfumes against the user's DNA and context.

Request body:

```json
{
  "limit": 20,
  "occasion": "Daily",
  "weather": { "temp": 26.4, "condition": "Clear" },
  "exclude_owned": true
}
```

Response:

```json
{
  "data": [
    {
      "perfume_id": "uuid",
      "match_score": 97,
      "reason": "Matches your fresh + woody profile"
    }
  ]
}
```

## `GET /functions/v1/daily-pick`

Purpose: return one top recommendation for the current day.

Response:

```json
{
  "data": {
    "perfume_id": "uuid",
    "match_score": 98,
    "reason": "Perfect for warm weather"
  }
}
```

## `POST /functions/v1/search-perfumes`

Purpose: search perfume catalog by name, brand, note, family, or impression tags.

Request body:

```json
{ "query": "bleu", "limit": 20 }
```

## `GET /functions/v1/trending`

Purpose: return trending or featured perfumes. This can be public.

## `POST /functions/v1/rate-perfume`

Purpose: create or update a user rating.

Request body:

```json
{
  "perfume_id": "uuid",
  "score": 4.5,
  "impression_tags": ["Clean", "Elegant"],
  "review_text": "..."
}
```

## `POST /functions/v1/collection/add`

Purpose: add a perfume to the user's collection or wishlist.

Request body:

```json
{
  "perfume_id": "uuid",
  "status": "owned",
  "size": "50ml",
  "purchase_date": "2026-04-29",
  "notes": "..."
}
```

## `DELETE /functions/v1/collection/remove`

Purpose: remove a perfume from the user's collection.

Request body:

```json
{ "perfume_id": "uuid" }
```

## `GET /functions/v1/collection`

Purpose: fetch the authenticated user's collection, optionally filtered by status.

Query params:

- `status`
- `limit`

## `GET /functions/v1/weather-recommendation`

Purpose: combine weather and DNA for a context-aware recommendation.

Expected behavior:

- fetch current weather from OpenWeatherMap using server-side credentials
- return a short explanation plus one or more matching perfumes

