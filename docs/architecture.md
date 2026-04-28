# Architecture Notes

## Goal

Keep current UX and interaction speed, while reducing future rewrite risk for:

- persistent storage
- multi-user auth
- analytics and data collection
- long-term maintainability

## Current Layering

### 1) UI Layer

- `src/routes/*`
- `src/components/packlog/*`

UI triggers domain operations through `usePacklog()` and does not directly read/write storage.

### 2) Store Layer

- `src/lib/packlog-store.tsx`

The store owns mutation commands and selectors for trips/library.

### 3) Repository Layer

- `src/lib/packlog-repository.ts`

Repository interface:

- `load()`
- `save(state)`
- `clear()`

Current adapters:

- browser local storage (`packlog.snapshot.v1`)
- Supabase snapshot sync (`packlog_snapshots` table)

Backend is selected by env (`VITE_DATA_BACKEND`).

### 4) Schema Layer

- `src/lib/packlog-schema.ts`

All persisted snapshot payloads are validated with zod and include a version field:

- `version: 1`
- `updatedAt: ISO datetime`
- `trips`
- `library`

This gives a migration anchor for future schema changes.

## Data Collection Strategy (No Login Yet)

Before auth is added, keep collection lightweight and privacy-safe:

1. Persist only app state snapshots locally.
2. Optional event telemetry can be added as anonymous events:
   - `trip_created`
   - `item_toggled`
   - `review_sealed`
3. Never mix telemetry schema with domain schema.
4. Once login is introduced, attach `userId/workspaceId` at repository boundary.

## Suggested Database Tables (Future)

When moving backend-first, use these entities as stable boundaries:

- `users`
- `trips`
- `trip_containers`
- `trip_items`
- `gear_library`
- `gear_reviews`
- `community_templates`
- `community_template_items`

Keep field naming aligned with current domain types to minimize mapping code.
Reference draft DDL: `docs/database-schema.sql`.

## Migration Plan

1. Introduce remote repository implementation:
   - `createApiPacklogRepository()`
2. Keep store API unchanged.
3. Use feature flag / env switch to choose repository implementation.
4. Add one-time migration from local snapshot to server records.

This lets front-end screens remain stable while backend architecture evolves.
