# Underdawg Backend

Modular monolith. **TypeScript + Fastify 4 + Drizzle ORM (postgres-js) + Zod + Pino.** ESM (`"type": "module"`, `.js` import specifiers).

Schema implements the **P0 ERD** (`doc.md` scope) from the Eraser workspace `hVBdEbbY44RGeMWAWXxO`. Service folders follow the **"Backend Services Required"** table in `UNDERDAWG_CREATOR_FLOW_COMPLETE.md`.

---

## Folder structure

```
src/
  config/         env (zod-validated), constants (HTTP codes, API prefix)
  db/
    client.ts     drizzle + postgres-js pool
    migrate.ts    migration runner (tsx)
    schema/       P0 ERD, split by domain
      enums.ts        all pgEnums
      identity.ts     users, auth_credentials, sessions, niches, skills, user_niches, user_skills
      portfolio.ts    portfolios, portfolio_pieces, public_page_configs, open_to, rates, past_clients, platform_connections
      content.ts      posts, media_assets, tags, post_tags, post_mentions, comments, reactions, saves, reshares, post_shares, follows
      community.ts    communities, members, posts, events, rsvps, polls(+options/votes), qna(+answers), challenges(+entries/votes/results)
      analytics.ts    analytics_events, reputation_scores
  middlewares/    error-handler, not-found (global)
  plugins/        security (helmet), cors, swagger, db, auth (bearer-session preHandler)
  utils/          errors (AppError hierarchy), logger, crypto (scrypt hash + session tokens), route (typedRouter helper)
  modules/        one folder per service — see mapping below
  routes/index.ts route registry (health unprefixed; services under /api/v1)
  app.ts          buildApp(): plugins + routes + zod compilers
  server.ts       listen + graceful shutdown
```

### Per-service files (full layering)

Each `src/modules/<service>/` contains:

| File | Responsibility |
|------|----------------|
| `<svc>.types.ts` | domain types — re-exports Drizzle inferred types + `z.infer` DTOs |
| `<svc>.validator.ts` | Zod request schemas (body / params / querystring) |
| `<svc>.repository.ts` | DB access (Drizzle); `constructor(private db: DB)` |
| `<svc>.service.ts` | business logic; throws `AppError`s |
| `<svc>.controller.ts` | request handlers (arrow-field class) |
| `<svc>.middleware.ts` | service-scoped guards (ownership / resource-load) |
| `<svc>.routes.ts` | route wiring via `typedRouter(app)`; exports `<svc>Routes` |

## Services ↔ ERD ↔ doc

| Service (doc) | Tables |
|---|---|
| `user` (User Service) | users, auth_credentials, sessions, niches, skills, user_niches, user_skills |
| `portfolio` | portfolios, portfolio_pieces, public_page_configs, open_to, rates, past_clients |
| `platform` (Platform Integration) | platform_connections |
| `content` (Content Service) | posts, media_assets, tags, post_tags, post_mentions, comments, reactions, saves, reshares, post_shares, follows |
| `community` (Community + Challenge data) | communities, community_members, community_posts, community_events, event_rsvps, polls, poll_options, poll_votes, qna_questions, qna_answers |
| `challenge` (Challenge Service) | challenges, challenge_entries, challenge_votes, challenge_results |
| `analytics` (Analytics Service) | analytics_events |
| `reputation` (Reputation Service) | reputation_scores |

> Chat is **Firebase**, not Postgres (per ERD) — only `firebase_thread_id` references are stored (e.g. `post_shares`). Merch / gigs / finance etc. are later phases, out of P0 scope.

## Auth

Email + password registration; password hashed with **scrypt** (`node:crypto`, no external deps). Login issues an opaque **session token** (`Authorization: Bearer <token>`); stored as SHA-256 hash in `sessions`. The `app.authenticate` preHandler validates it and populates `req.user`. (Google/Apple/phone providers are modeled in `auth_credentials` but not yet implemented.)

## Run

```bash
npm install
cp .env.example .env            # set DATABASE_URL to a real Postgres
npm run db:generate             # generate SQL migration from schema (already done: drizzle/0000_init_p0.sql)
npm run db:migrate              # apply migrations
npm run dev                     # tsx watch, http://localhost:3000
```

- API base: `/api/v1`
- Health: `GET /health` (liveness), `GET /ready` (readiness — checks DB)
- Swagger UI (dev only): `GET /docs`

## Scripts

`dev` · `build` · `start` · `typecheck` · `lint` / `lint:fix` · `format` · `db:generate` · `db:migrate` · `db:push` · `db:studio`

## Notes

- Routes are registered through `typedRouter(app)` (`utils/route.ts`) so the request generic is inferred from each controller handler even when a `preHandler` (auth) is present — Fastify's built-in shorthands lose that inference under those conditions.
- Runtime request validation comes from the global Zod `validatorCompiler` (set in `app.ts`); responses are not schema-serialized (postgres-js returns `Date` objects, which the Zod response serializer would reject).
