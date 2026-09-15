# Caching Strategies

This document describes the caching and persistence behavior currently implemented in the frontend, including client-side state caches, persisted UI state, and edge caching behavior.

## Summary

| Surface                      | Strategy                                                              | Scope                                       | Freshness / invalidation                                            |
| ---------------------------- | --------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| User profile                 | In-memory `Map` cache plus in-flight request dedupe                   | Per user id, per browser runtime            | Reused until explicit cache clear or page reload                    |
| Following / My-List          | In-memory Zustand store with optimistic updates and explicit re-fetch | Current signed-in user, per browser runtime | Revalidated on page load and after follow/unfollow mutations        |
| Fridge list                  | Zustand TTL cache plus optimistic single-entity patch                 | Shared app session, per browser runtime     | Fresh for 1 minute, or immediately stale after `invalidate()`       |
| Profile action stats         | In-memory stale-while-revalidate cache                                | Per user id, per browser runtime            | Cached value shown immediately, background fetch always revalidates |
| Fridge detail page           | Next.js fetch cache with ISR                                          | Server / edge                               | `revalidate: 3600`                                                  |
| Latest fridge report section | Explicitly uncached fetch                                             | Client                                      | `cache: 'no-store'`                                                 |
| Static page routes           | CDN cache headers for CloudFront and other shared caches              | Edge                                        | `s-maxage=86400`, `stale-while-revalidate=86400`                    |
| Amplify build artifacts      | Build cache for dependencies and Next build cache                     | CI / hosting pipeline                       | Reused between builds                                               |
| Map view                     | Zustand `persist` to `localStorage`                                   | Browser                                     | Survives reload until overwritten or cleared                        |
| Leaflet marker icons         | In-memory icon memoization                                            | Browser runtime                             | Reused until page reload                                            |
| MUI App Router styles        | MUI App Router cache provider                                         | Current render tree                         | Managed by MUI / Next integration                                   |

## 1. User Profile Cache

File: `src/store/useAuthStore.ts`

Strategy:

- `userProfileCache` is a module-level `Map<string, AppUserProfile>`.
- `inFlightProfileRequests` deduplicates concurrent requests for the same user.
- Auth bootstrap reads from cache immediately, then fetches if needed.

Why:

- Avoid repeated `/v1/users/:id` calls while the app is open.
- Avoid duplicate profile fetches during auth bootstrapping or React double effects.
- Allow direct cache patching after successful user mutations.

Coherency rules:

- `clearUserProfileCache(userId)` removes both cached data and any in-flight dedupe entry.
- `updateCachedUserProfile(userId, updates)` patches both the module cache and active store state when the target user is currently signed in.
- The store drops stale async results if auth has changed before commit.

Mutation paths that patch this cache:

- Settings notification preference updates in `src/app/settings/page.tsx`
- Email link/update flow in `src/features/auth/utils/updateUserEmail.ts`
- Neighbor to Volunteer promotion in `src/features/auth/utils/promoteNeighborToVolunteer.ts`

Notes:

- This cache is memory-only. It is not persisted to `localStorage`.
- It remains valid until explicit clear, sign-out state reset, or full page reload.

## 2. Following / My-List Cache

File: `src/store/useFollowingStore.ts`

Strategy:

- The store keeps the current user's followed fridge notifications in memory.
- There is no TTL. Fetching is explicit.
- The store keeps `ownerUserId` so cached data is never reused across users.
- `isFetching` deduplicates concurrent fetches.

Why:

- My-List is user-scoped data, so correctness is primarily about ownership rather than timed freshness windows.
- Removing TTL keeps the contract simpler while still preserving shared in-memory state across screens.

Coherency rules:

- `fetch()` resets to empty/idle when no authenticated user exists.
- If the signed-in user changes, the store clears notifications before reusing the store for the next user.
- Auth-change guards prevent stale async responses from being fetched or committed under the wrong user.
- `reset()` clears the store on sign-out and account deletion flows.

Mutation behavior:

File: `src/features/fridge-notifications/hooks/useFridgeNotifications.ts`

- Follow and unfollow mutations optimistically patch the shared following store.
- After the optimistic patch, the hook calls `useFollowingStore.getState().fetch()` in the background.
- The optimistic write keeps the UI responsive; the background fetch restores server truth if the backend shape differs.

Notes:

- This is intentionally a minimal contract: in-memory state, optimistic updates, explicit re-fetch, auth-safe ownership.
- No browser persistence is used for My-List.

## 3. Fridge List Cache

File: `src/store/useFridgeStore.ts`

Strategy:

- `fridges` are cached in Zustand state.
- `lastUpdated` acts as a TTL marker.
- `FRIDGE_CACHE_TTL_MS` is currently 1 minute.
- `isFetching` deduplicates concurrent fetches.

Why:

- The browse surface is shared, frequently revisited, and more expensive to rebuild from scratch.
- The TTL avoids repeated list fetches across quick navigations.
- Existing cached data stays on screen during background refreshes.

Coherency rules:

- If cached data is fresh, `fetchFridges()` returns without hitting the network.
- If cached data is stale or invalidated, `fetchFridges()` refetches.
- `invalidate()` sets `lastUpdated` to `null` without clearing the visible list.
- `updateFridgeReport(id, report)` applies an optimistic patch to a single fridge.

Hybrid mutation pattern:

File: `src/app/fridge/[id]/report/page.tsx`

- After a successful report submission, the page applies `updateFridgeReport()` so the local list reflects the new report immediately.
- It then calls `invalidate()` so the next authoritative list fetch bypasses the TTL.
- This is a deliberate hybrid: optimistic UX now, canonical data on next fetch.

## 4. Profile Action Stats Cache

File: `src/app/profile/page.tsx`

Strategy:

- `statsCache` is a module-level in-memory `Map<string, UserActionStats>`.
- The current cached stats are shown immediately when available.
- A background fetch always revalidates.

Why:

- Profile stats are cheap to display from memory and benefit from avoiding empty/loading flashes.
- Background revalidation preserves freshness without blocking initial render.

Coherency rules:

- The hook compares previous and next stats before mutating state or cache.
- Cache lifetime is the current browser runtime only.

This is effectively a small client-side stale-while-revalidate pattern.

## 5. Persisted UI State

### Map View Persistence

File: `src/store/useMapStore.ts`

Strategy:

- Zustand `persist` stores part of the map state in `localStorage` under `ff-map-storage`.
- Persisted fields: `center` and `zoom`.
- Not persisted: `userLocation` and `selectedFridgeId`.

Why:

- Preserve the user's browsing context between reloads.
- Avoid persisting ephemeral or privacy-sensitive state.

This is persistence rather than network caching, but it affects how state is reused across sessions.

### Auth Return-Path and Email Handoff Storage

Files:

- `src/features/auth/hooks/useEmailAuth.ts`
- `src/features/auth/hooks/useLinkEmail.ts`
- `src/app/auth/callback/page.tsx`
- `src/app/auth/link-email/page.tsx`

Strategy:

- `localStorage` is used to carry return paths and email values through auth callbacks.

Notes:

- This is not a data cache, but it is persistent client storage used to avoid losing transient auth flow state.

## 6. Server and Edge Caching

### Fridge Detail Page ISR

File: `src/app/fridge/[id]/page.tsx`

Strategy:

- The fridge detail fetch uses `next: { revalidate: 3600 }`.
- Next.js can reuse the server-fetched result for up to 1 hour before revalidating.

Why:

- Individual fridge detail pages are good candidates for server-side caching because they change less frequently than interactive client state.

### Latest Fridge Report Is Explicitly Uncached

File: `src/features/fridge-details/components/FridgeReportSection.tsx`

Strategy:

- The latest report fetch uses `cache: 'no-store'`.

Why:

- This surface is expected to be highly current.
- The implementation chooses freshness over reuse.

### Static Route Cache-Control Headers for CloudFront

File: `next.config.js`

Strategy:

- Most static page routes receive:
  - `public`
  - `s-maxage=86400`
  - `max-age=0`
  - `stale-while-revalidate=86400`
- These headers exclude `/fridge/*`, `/_next/*`, and `/api`.

What this means:

- CloudFront and other shared caches can keep those routes for 24 hours.
- After that, stale responses may still be served while the CDN revalidates in the background for another 24 hours.
- Browsers always revalidate with the CDN because `max-age=0`.

Why:

- Route content mostly changes on deploy rather than continuously from user actions.
- This hides cold-start latency for static routes.

### CDN Warmup Script

File: `scripts/warm-cdn.mjs`

Strategy:

- After deployment, the script hits a small set of important routes twice and logs `x-cache`, `x-nextjs-cache`, and `cache-control` headers.

Why:

- Prime CloudFront for critical entry routes.
- Confirm cache behavior after deploy.

## 7. Build-Time Caching

File: `amplify.yml`

Strategy:

- Amplify caches:
  - `.next/cache/**/*`
  - `node_modules/**/*`

Why:

- Reduce install and build time between deployments.

Notes:

- This is CI/build caching, not runtime request caching.

## 8. Rendering and Asset Micro-Caches

### MUI App Router Cache Provider

File: `src/app/layout.tsx`

Strategy:

- The app uses `AppRouterCacheProvider` from MUI's Next.js integration.

Why:

- This caches style rendering work needed for App Router + Emotion integration.
- It is framework-level rendering infrastructure rather than application data caching.

### Leaflet Marker Icon Memoization

File: `src/features/fridge-map/components/layers/MarkerLayer.tsx`

Strategy:

- `iconCache` memoizes `Leaflet.Icon` instances by a hash of icon inputs.

Why:

- Avoid recreating identical marker icons for every render.

Notes:

- This is a pure in-memory performance cache. It has no invalidation beyond page reload.

## 9. Current Rules of Thumb

The codebase currently follows these practical rules:

- Use optimistic patching for user-triggered mutations when the desired next state is known locally.
- Invalidate or re-fetch shared collection data when server-side drift is likely.
- Prefer direct cache patching for narrow user-profile mutations.
- Scope user-owned caches to the authenticated user and guard async commits against auth changes.
- Use explicit `no-store` for highly freshness-sensitive fetches.
- Use CDN caching for static routes whose content changes primarily on deploy.

## 10. When Adding a New Cache

Before adding a new cache, decide these five things explicitly:

1. Scope: Is the data global, route-scoped, or user-scoped?
2. Lifetime: Does it live for one render, one session, one runtime, or across reloads?
3. Freshness contract: TTL, explicit invalidate, background revalidate, or no cache?
4. Mutation policy: optimistic patch, invalidate, or refetch-only?
5. Auth safety: can a sign-out or account switch cause stale writes?
