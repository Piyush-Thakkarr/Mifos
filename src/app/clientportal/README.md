# Client Portal Module

This module provides a lightweight client-facing portal integrated with the Mifos web app. It is designed as a lazy-loaded Angular feature module and communicates with a Django middleware backend.

## Purpose

- Expose a dedicated `/clientportal` area for external clients.
- Provide a simple login flow that authenticates against a Django backend using fixed credentials for Day 1:
  - username: `client`
  - password: `password`
- After login, navigate to a dashboard that consumes data from the Django backend (placeholder implementation on Day 1).

## Folder Structure

- `clientportal.module.ts` — Angular feature module definition.
- `clientportal-routing.module.ts` — routing configuration for this module.
- `pages/login/` — login page components and templates.
- `pages/dashboard/` — dashboard page components and templates.
- `services/` — Angular services for calling the Django backend.
- `models/` — TypeScript interfaces and types used by the module.
- `styles/` — SCSS styles specific to this module.

## Routing

The module is lazy-loaded from the main app routing via the path `/clientportal`.

Internal routes:
- `/clientportal/login`
- `/clientportal/dashboard`

## Django Integration

- The module reads the Django base URL from `environment.djangoApiUrl`.
- All HTTP requests to Django are sent with `withCredentials: true` to allow session cookies.
- `AuthService` under `services/` exposes:
  - `login(username, password)` → `POST {djangoApiUrl}/auth/login`
  - `dashboard()` → `GET {djangoApiUrl}/dashboard` (placeholder)

## Read-only / Adapter Notes

- Core and shared Mifos modules are treated as upstream and not modified.
- The only core files touched for integration are:
  - `src/environments/environment.ts` and `environment.prod.ts` — adding `djangoApiUrl` key.
  - `src/app/app-routing.module.ts` — adding the lazy-loaded `/clientportal` route.

## Manual Steps (if needed)

If for any reason app routing cannot be modified automatically, the following route must be added manually to `AppRoutingModule` inside the `routes` array, before the wildcard route:

```ts
{
  path: 'clientportal',
  loadChildren: () => import('./clientportal/clientportal.module').then(m => m.ClientportalModule)
}
```

On Day 1 this route has been added programmatically; this snippet is provided here for reference.
