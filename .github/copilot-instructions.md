# Copilot / AI assistant instructions — SimplySoph

Keep suggestions focused and actionable for this repository. Prefer small, safe edits and follow existing conventions.

Key project overview
- Full-stack monorepo: a React client (client/) and an Express + tRPC server (server/). The client talks to the server via tRPC at the path `/api/trpc` (see `client/src/main.tsx` and `server/_core/index.ts`).
- DB: MySQL accessed via Drizzle ORM. Schema lives in `drizzle/schema.ts`. Use `drizzle-kit` for migration generation (see `package.json` script `db:push`).
- Auth: OAuth-based auth flows are in `server/_core/oauth` with session cookie name defined in `shared/const.ts` (COOKIE_NAME). Server middleware loads context from `server/_core/context.ts`.

Developer workflows and commands (concrete)
- Start local dev server (dev server + Vite frontend): prefer PowerShell on Windows:
  - In PowerShell: `$env:NODE_ENV = 'development'; pnpm dev`
  - The `dev` script runs: `NODE_ENV=development tsx watch server/_core/index.ts` (Unix shells may run this directly).
- Build for production: `pnpm build`. This runs Vite build and bundles server with esbuild; output is `dist/` and `start` runs `node dist/index.js`.
- Typecheck: `pnpm check` (runs `tsc --noEmit`).
- Tests: `pnpm test` (vitest).
- DB migrations: `pnpm run db:push` (generates and migrates via `drizzle-kit`). Ensure DB env variables are present (`.env`) before running.

Important code patterns & conventions (do not change lightly)
- API surface: all APIs live under `/api/` and tRPC router is `appRouter` in `server/routers.ts`. Add new endpoints via `publicProcedure` / `protectedProcedure` / `router` helpers exported from `server/_core/trpc`.
- Admin guard: use the `adminProcedure` pattern (see `server/routers.ts`) or `protectedProcedure` to enforce auth/roles. Client expects `UNAUTHED_ERR_MSG` to trigger redirect (see `client/src/main.tsx`).
- Lazy imports in routers: DB calls are often loaded dynamically (e.g. `await import('./db')`) — preserve this pattern when adding heavy modules to avoid cold-start costs.
- DB naming: drizzle schema uses camelCase column names and numeric auto-increment `id` as primary keys (see `drizzle/schema.ts`). Follow these shapes when writing SQL or ORM code.
- File upload / body limits: server bodies are configured to 50MB in `server/_core/index.ts` — keep upload handlers consistent.

Integration points & external services
- Storage/S3 helpers in `server/storage.ts` and AWS SDK dependencies in `package.json`.
- OAuth flow: registered under `/api/oauth/*` via `registerOAuthRoutes` in `server/_core/index.ts`. Respect OAuth callback paths and session cookie handling.

Formatting, linting, and tests
- Use `pnpm` (project uses `pnpm` and a patched `wouter` in `patches/`).
- Format with Prettier: `pnpm run format`.
- Run fast unit tests with `pnpm test` (vitest). Add tests under client or server `__tests__` where appropriate.

Quick examples to reference in changes
- Client tRPC usage: `client/src/main.tsx` shows httpBatchLink to `/api/trpc` and superjson transformer — keep transformer and credentials: 'include'.
- Server bootstrapping: `server/_core/index.ts` demonstrates using Vite in dev and static serving in production; prefer using `setupVite` for local dev changes.
- DB schema: `drizzle/schema.ts` is authoritative for table shapes and types.

When editing code, prefer minimal, incremental PRs
- Small focused changes are easier to review: one route, one UI change, one migration per PR.
- If changing environment variables or scripts that affect developer startup (e.g., `dev` script), mention PowerShell compatibility and update README instead of changing scripts silently.

If anything is unclear or you need credentials / env values, ask the maintainers rather than hard-coding secrets.

— End of file —
