# Fridge Finder: Exhaustive Modernization & Refactor Plan

This document outlines the strategic overhaul of the Fridge Finder frontend. We are moving from a JavaScript-based, Atomic Design Pages Router application to a strictly-typed, feature-driven, and high-performance Next.js App Router architecture.

---

## 1. Core Architectural Principles

- **Type Safety First**: 100% TypeScript coverage. No `.js` or `.jsx` files. Every API response and component prop must be strictly typed.
- **Domain-Driven Features**: Group code by business functionality (Features) rather than technical size (Atoms).
- **Reactive State Machine**: Centralize all async state in Zustand using a standardized status pattern to eliminate "loading flicker" and race conditions.
- **Declarative UI**: Move away from imperative Leaflet manipulations toward declarative React components.
- **Zero-Boilerplate Error Handling**: Use `StateBoundary` components to handle standard UI states (Loading/Error/Empty) globally.

---

## 2. Technical Stack & Dependencies

### Language & Runtime

- **TypeScript 5.x**: Strict mode enabled.
- **Next.js 15+**: App Router implementation.

### State & Data

- **Zustand 5.x**: For high-performance, boilerplate-free state management.
- **Zod**: For schema validation and automatic TypeScript type inference.
- **React Hook Form**: For performant form management with native Zod integration.

### UI & UX

- **MUI 7.x**: Modular usage with standard theme overrides.
- **React Leaflet 5.x**: Declarative map components.
- **react-leaflet-cluster**: For marker performance.

---

## 3. Modular Directory Structure

The new structure organizes code by **Feature**, ensuring that all logic related to a specific domain stays together.

```text
src/
├── app/                  # Next.js App Router (Layouts, Pages, API Routes)
├── features/             # Business Logic Modules
│   ├── fridge-map/       # Map, Clustering, Marker Layers
│   │   ├── components/
│   │   ├── hooks/        # useMapSync, useGeolocation
│   │   ├── store/        # useMapStore.ts
│   │   └── types/
│   ├── fridge-list/      # List view, Search, Sorting
│   │   ├── components/
│   │   └── store/        # useSearchStore.ts
│   └── fridge-management/# Forms (Add/Report), Admin Tools
│       ├── components/
│       ├── schemas/      # Zod validation schemas
│       └── services/     # API interaction logic
├── components/           # Generic / Shared UI (Button, Modal, StateBoundary)
├── lib/                  # Legacy shared code (To be removed)
├── hooks/                # Global Hooks (useWindowHeight, useGeolocation)
├── utils/                # Utility functions (geo, formatters)
├── store/                # Global UI State (useUIStore.ts, useNotificationStore.ts)
└── types/                # Core domain TypeScript interfaces (Fridge, Report)
```

---

## 4. Implementation Roadmap

### Phase 1: Infrastructure & Type Foundation (COMPLETED)

1.  [x] **TypeScript Init**: Create `tsconfig.json`. Install `@types/react`, `@types/leaflet`, etc.
2.  [x] **Domain Interfaces**: Create `src/types/domain.ts`.
3.  [x] **API Client**: Implement `src/lib/api-client.ts`.
4.  [x] **Utility Refactor**: Moved geo logic to `src/utils/geo.ts` and created global hooks in `src/hooks`.

### Phase 2: Centralized State (Zustand) (COMPLETED)

1.  [x] **useFridgeStore.ts**:
    - **Status Machine**: Implement `status: 'idle' | 'loading' | 'success' | 'error' | 'empty'`.
    - **Data**: Store master `fridge[]` and `lastUpdated` timestamp.
    - **Actions**: `fetchFridges()`, `updateFridge()`, `getFridgeById()`.
2.  [x] **useMapStore.ts**:
    - **Viewport**: Manage `center`, `zoom`, and `bounds`.
    - **Selection**: Manage `selectedFridgeId` to sync the map popup with the list highlight.

### Phase 3: Global UI Boundaries (COMPLETED)

1.  [x] **StateBoundary.tsx**: Create a component that consumes the `status` from Zustand.
2.  [x] **Skeleton Library**: Create generic skeletons for cards, lists, and map overlays in `src/components/shared/skeletons`.

### Phase 4: Feature Refactoring & Components (COMPLETED)

1.  [x] **The "Big Component" Split**:
    - Refactor `Map.jsx` into modular layers in `src/features/fridge-map`.
2.  [x] **Form Overhaul**:
    - Replaced `Formik` with `React Hook Form`.
    - Integrated with Zod for zero-effort TypeScript inference in forms.
    - Refactored Reporting and Contact forms.
3.  [x] **Browse Page Integration**:
    - Updated `browse.page.tsx` to use Zustand and StateBoundary.

### Phase 5: App Router Migration & Cleanup (COMPLETED)

1.  [x] **Layouts**: Implement `src/app/layout.tsx` using `@mui/material-nextjs`.
2.  [x] **Core Pages**:
    - [x] `src/app/page.tsx` (Home)
    - [x] `src/app/browse/page.tsx`
    - [x] `src/app/fridge/[id]/page.tsx`
    - [x] `src/app/user/contact/page.tsx`
    - [x] `src/app/user/fridge/report/[fridgeId]/page.tsx`
3.  [x] **Pamphlet Pages**:
    - [x] `src/app/pamphlet/about/page.tsx` (Migrated core pamphlet page)
4.  [x] **Legacy Cleanup**:
    - [x] Moved legacy `src/pages` to `src/pages_legacy`.
    - [x] Converted core atoms and molecules to TypeScript.
    - [x] Removed dependency on `React.FC` and arrow function components.

### Conclusion

The codebase has been successfully modernized to a feature-based, strictly typed architecture using the Next.js App Router and Zustand for centralized state management. Performance has been optimized with marker clustering and declarative React-Leaflet patterns. Validation is now handled by Zod, and forms by React Hook Form for maximum efficiency.

---

## 5. Performance Standards

- **Lighthouse Score**: Target 90+ across all metrics.
- **Bundle Size**: Utilize Next.js dynamic imports for Leaflet to keep initial JS < 100kb.
- **Interactions**: Use `Zustand` selectors to ensure components only re-render when their specific data slice changes.
- **Map Rendering**: Marker clustering is mandatory for datasets > 50 points.

---

## 6. Coding Conventions

- **Never use React.FC**: Use regular `function` components with explicit return types (`React.ReactElement` or `React.ReactNode`).
- **Avoid const arrow functions for components**: Prefer `function ComponentName() { ... }`.
- **Naming**: PascalCase for components (`FridgeCard.tsx`), camelCase for hooks (`useFridges.ts`).
- **Exports**: Prefer named exports over default exports for better IDE autocomplete and refactoring.
- **Logic**: Keep components "thin". Move business logic to hooks or Zustand actions.
- **Comments**: Only use comments to explain **why** a specific hack or complex geo-logic exists, not **what** the code is doing.

---

## 7. Build System & Optimization

- **Turbopack**: Enabled for faster development cycles.
- **Dependency Management**: Removed legacy packages like `formik`, `yup`, and `prop-types`.
- **Scripts**:
  - `npm run build`: Standard Next.js production build.
  - `npm run type-check`: Validates TypeScript across the entire codebase.
  - `npm run lint`: Uses `next lint` for integrated ESLint checks.
  - `npm run format`: Prettier-based code formatting.
- **MUI Optimization**: Configured `@mui/material-nextjs` and Next.js compiler for efficient Emotion SSR.
