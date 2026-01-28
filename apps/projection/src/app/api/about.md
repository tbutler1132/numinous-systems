# api/

Next.js API routes for server-side functionality.

## Routes

### Authentication (`/api/auth/`)

- **POST /login** - Validate token and set auth cookie
- **GET /check** - Check current authentication status
- **POST /logout** - Clear auth cookie

### Dashboard (`/api/dashboard/`)

- **GET /status** - Get observation store status and statistics
- **POST /ingest** - Upload and ingest a CSV file

## Authentication Flow

1. User enters token on `/dashboard/login`
2. Token is validated via `POST /api/auth/login`
3. On success, httpOnly cookie is set for 30 days
4. Middleware protects private routes by checking cookie
5. Client uses `GET /api/auth/check` to verify status

## Notes

- All routes use `force-dynamic` to disable Next.js caching
- Auth routes are excluded from middleware protection (see `middleware.ts` matcher)
- Dev mode bypasses auth unless `?locked` param is present
