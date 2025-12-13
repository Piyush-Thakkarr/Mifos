# Client Portal Frontend Summary (Day 1)

## Module & Path

- **Module path**: `Mifos/src/app/clientportal`
- **Purpose**: Provide a client-facing portal integrated with Mifos via a Django middleware backend.
- **Routing entry point**: Lazy-loaded from `AppRoutingModule` via `/clientportal`.

## Files Created

- **Module & routing**
  - `src/app/clientportal/clientportal.module.ts`
  - `src/app/clientportal/clientportal-routing.module.ts`

- **Pages**
  - Login page
    - `src/app/clientportal/pages/login/login.component.ts`
    - `src/app/clientportal/pages/login/login.component.html`
    - `src/app/clientportal/pages/login/login.component.scss`
  - Dashboard page (placeholder)
    - `src/app/clientportal/pages/dashboard/dashboard.component.ts`
    - `src/app/clientportal/pages/dashboard/dashboard.component.html`
    - `src/app/clientportal/pages/dashboard/dashboard.component.scss`

- **Services & models**
  - `src/app/clientportal/services/auth.service.ts`
  - `src/app/clientportal/models/index.ts`

- **Styles & docs**
  - `src/app/clientportal/styles/_clientportal.scss`
  - `src/app/clientportal/README.md`

## Routing Details

- **App-level lazy route** (`src/app/app-routing.module.ts`):

  - Added before the wildcard route:
    - `path: 'clientportal'`
    - `loadChildren: () => import('./clientportal/clientportal.module').then((m) => m.ClientportalModule)`

- **Module-level routes** (`clientportal-routing.module.ts`):

  - `''` → redirects to `login` (pathMatch `full`).
  - `'login'` → `LoginComponent`.
  - `'dashboard'` → `DashboardComponent`.

- **Hash routing**: The app continues to use `RouterModule.forRoot(routes, { useHash: true })`, so URLs are:
  - `http://localhost:4200/#/clientportal/login`
  - `http://localhost:4200/#/clientportal/dashboard`

## Login Page Behavior

- **URL**: `/clientportal/login`.
- **Form**: Reactive form with fields:
  - `username` (required, prefilled as `client`).
  - `password` (required, prefilled as `password`).
- **Submission flow**:
  - Calls `AuthService.login(username, password)`.
  - On success: navigates to `/clientportal/dashboard`.
  - On failure:
    - If backend returns `{ error: '...' }`, displays that text.
    - If status is `401`, displays `Invalid credentials`.
    - Otherwise shows `Login failed. Please try again.`.

## Dashboard Page Behavior (Placeholder)

- **URL**: `/clientportal/dashboard`.
- On init, calls `AuthService.dashboard()`.
- While loading, shows a loading message.
- On success, renders the JSON payload using the built-in `json` pipe.
- On failure, shows `Failed to load dashboard data.` or the backend `error` value.

## AuthService → Django Integration

- **Service path**: `src/app/clientportal/services/auth.service.ts`.
- **Base URL**: `environment.djangoApiUrl` (with fallback to `http://localhost:8000`).
- **Methods**:
  - `login(username, password)`
    - `POST {djangoApiUrl}/auth/login`.
    - Sends body `{ username, password }` as JSON.
    - Uses `withCredentials: true` so session cookies (`cp_session`) are sent and stored.
  - `dashboard()`
    - `GET {djangoApiUrl}/dashboard`.
    - Also uses `withCredentials: true`.
- **Http layer**:
  - Injects Angular `HttpClient`, which in this app is wired to the existing Mifos `HttpService` and interceptors via `CoreModule`.

## Environment Configuration

- **Files modified**:
  - `src/environments/environment.ts`
  - `src/environments/environment.prod.ts`

- **Key added**:

  - `djangoApiUrl: 'http://localhost:8000'`

- This is the single source of truth for the Django middleware base URL on the Angular side.

## How to Run Frontend Locally

From the `Mifos` folder:

```bash
npm install --legacy-peer-deps
npx ng build        # or: npm run build
npx ng serve
```

Then open:

- `http://localhost:4200/#/clientportal/login`

## Manual Login Test

1. Start the Django backend on `http://localhost:8000` (see backend README).
2. Start the Angular dev server (`npx ng serve`).
3. Navigate to `http://localhost:4200/#/clientportal/login`.
4. Use the prefilled credentials:
   - Username: `client`
   - Password: `password`.
5. Click **Sign in**.
6. In browser dev tools → Network:
   - Confirm `POST http://localhost:8000/auth/login` is sent with `withCredentials`.
   - Confirm response sets `cp_session` cookie.
7. Confirm Angular navigates to `/clientportal/dashboard` and renders the JSON placeholder.

## TODO / Next Steps (Frontend)

- Enhance dashboard UI beyond raw JSON (cards, charts, etc.).
- Integrate real Mifos/Fineract data via the Django `mifos_client` connector once implemented.
- Add guards (e.g., route guard based on session) for `/clientportal/dashboard`.
