# COVID-19 Map Dashboard — Backend

REST API that stores COVID-19 data for every country and serves it to an interactive world-map dashboard.

> **Frontend repository:** [covid-19-map-dashboard-front-end](https://github.com/Itslucassantos/covid-19-map-dashboard-front-end)

> **Project video:** [Watch the demo on Google Drive](https://drive.google.com/file/d/1ivxAJFSLdCYf5vN8-E1i2BlGt-Rjezah/view?usp=drive_link)

The backend and the frontend are independent projects. The frontend never talks to the external COVID-19 data source: it only consumes this API.

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
  - [Layers and the dependency rule](#layers-and-the-dependency-rule)
  - [Folder structure](#folder-structure)
  - [Naming conventions](#naming-conventions)
  - [Design patterns](#design-patterns)
  - [Request flow](#request-flow)
- [Data model](#data-model)
- [Data source and seeding](#data-source-and-seeding)
- [REST API](#rest-api)
- [Errors](#errors)
- [Security and operations](#security-and-operations)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Manual testing with Postman](#manual-testing-with-postman)
- [Connecting the frontend](#connecting-the-frontend)
- [Known limitations](#known-limitations)
- [Conventions for contributors](#conventions-for-contributors)
- [License](#license)

## Overview

The API does three things:

1. **Fetches** historical COVID-19 data from a public API ([API Ninjas](https://api-ninjas.com/api/covid19)).
2. **Stores** it in PostgreSQL (per-country totals, a global total and a daily time series).
3. **Exposes** it through a small, read-only REST API that powers the map markers, the country detail panel, the global counters and the history charts of the frontend.

Ingestion is a one-off job (`npm run seed`). The upstream series ends on **2023-03-09**, so there is no new data to poll and the API does not run a scheduler. To refresh the database, run the seed again.

## Tech stack

| Concern         | Choice                                                             |
| --------------- | ------------------------------------------------------------------ |
| Runtime         | Node.js 24 + TypeScript (CommonJS, decorators enabled)             |
| HTTP framework  | Express 5                                                          |
| ORM             | Sequelize + `sequelize-typescript`                                 |
| Database        | PostgreSQL 17 (dev), in-memory SQLite (tests)                      |
| Migrations      | Umzug                                                              |
| Validation      | `yup`, used inside the domain through the **Notification** pattern |
| HTTP client     | Native `fetch`                                                     |
| Security        | `helmet`, `cors`, `express-rate-limit`                             |
| Tests           | Jest + `@swc/jest` + Supertest                                     |
| Lint and format | ESLint (typescript-eslint) + Prettier                              |
| CI              | GitHub Actions (lint, typecheck + tests, build)                    |

## Architecture

The project follows **Clean Architecture**, organised as follows: one folder per **context** (`country`, `global`, `history`, `sync`) inside each layer, one file per responsibility, and tests next to the code they cover.

### Layers and the dependency rule

```
┌────────────────────────────────────────────────────────┐
│ infrastructure   Express, Sequelize, API Ninjas, jobs  │
│   ┌────────────────────────────────────────────────┐   │
│   │ usecase      application logic, one per folder │   │
│   │   ┌────────────────────────────────────────┐   │   │
│   │   │ domain   entities, value objects,      │   │   │
│   │   │          validators, ports (interfaces)│   │   │
│   │   └────────────────────────────────────────┘   │   │
│   └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
          dependencies only point inwards
```

| Layer              | Folder               | Responsibility                                                                                                      |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Domain**         | `src/domain`         | Entities, value objects, factories, validators, repository and gateway **interfaces**, domain errors                |
| **Use case**       | `src/usecase`        | One use case per folder, each with its input/output DTOs. Depends only on domain interfaces                         |
| **Infrastructure** | `src/infrastructure` | Everything that touches the outside world: Sequelize models and repositories, API Ninjas gateway, Express app, jobs |

The domain knows nothing about Express, Sequelize or the external API. Ports (`CountryRepositoryInterface`, `CovidDataGateway`, ...) are declared in the domain and implemented in infrastructure, so the data source or the database can be replaced without touching business logic.

### Folder structure

```
.
├── .github/workflows/ci.yaml        # lint, typecheck + tests, build
├── docs/postman/                    # Postman collection with the manual test cases
├── docker-compose.yml               # PostgreSQL for local development
├── src/
│   ├── domain/
│   │   ├── @shared/                 # building blocks reused by every context
│   │   │   ├── entity/              #   Entity base class (id + notification)
│   │   │   ├── notification/        #   Notification + NotificationError
│   │   │   ├── repository/          #   generic RepositoryInterface
│   │   │   └── validator/           #   ValidatorInterface + yup helper
│   │   ├── country/
│   │   │   ├── entity/              #   Country
│   │   │   ├── value-object/        #   CovidStats (cases, deaths, per-million, ...)
│   │   │   ├── factory/             #   CountryFactory
│   │   │   ├── validator/           #   yup validator + validator factory
│   │   │   ├── repository/          #   CountryRepositoryInterface
│   │   │   ├── error/               #   CountryNotFoundError
│   │   │   ├── country-name-resolver.ts   # maps source names/aliases to iso2
│   │   │   └── country-reference.ts       # shape of a dataset entry
│   │   ├── global/                  #   GlobalStats entity, validator, repository interface
│   │   ├── history/                 #   DailyStat entity, validator, repository interface
│   │   └── sync/
│   │       ├── gateway/             #   CovidDataGateway (port of the external API)
│   │       └── repository/          #   CovidDataSeedRepository (bulk save for the seed)
│   ├── usecase/
│   │   ├── country/{find,list}/
│   │   ├── global/find/
│   │   ├── history/{find-country,find-global}/
│   │   └── sync/seed-covid-data/
│   └── infrastructure/
│       ├── api/
│       │   ├── express.ts           # app factory: middlewares, routes, 404 and error handler
│       │   ├── server.ts            # entry point: config, database, listen, graceful shutdown
│       │   ├── config.ts            # environment validation (yup)
│       │   ├── logger.ts            # structured JSON logger
│       │   ├── routes/              # country.route.ts, global.route.ts, days-query.ts
│       │   ├── middlewares/         # request-id, request-logger, error-handler
│       │   └── __tests__/           # end-to-end tests (Supertest)
│       ├── country/
│       │   ├── dataset/             # countries.data.ts (static dataset) + country-aliases.ts
│       │   └── repository/sequelize/    # country.model.ts, country.repository.ts
│       ├── global/repository/sequelize/
│       ├── history/repository/sequelize/
│       ├── sync/repository/sequelize/   # bulk seed repository
│       ├── covid-data/gateway/api-ninjas/   # api-ninjas.gateway.ts
│       ├── database/                # sequelize setup, migrator, migrations/
│       └── job/seed.ts              # one-off ingestion job
└── package.json, tsconfig*.json, jest.config.ts, .swcrc, eslint.config.mjs, .prettierrc
```

### Naming conventions

- **Everything is in English**: code, files and folders, routes, query params, JSON fields, tables and columns, environment variables, branches, comments, tests and commits.
- **Files** use `kebab-case` plus a suffix that states the role:

  | Suffix                      | Role                                               |
  | --------------------------- | -------------------------------------------------- |
  | `*.usecase.ts`              | Use case                                           |
  | `*.dto.ts`                  | Input/output DTOs of a use case                    |
  | `*.repository.ts`           | Sequelize repository implementation                |
  | `*-repository.interface.ts` | Repository port, declared in the domain            |
  | `*.model.ts`                | Sequelize model (`CountryModel`, `DailyStatModel`) |
  | `*.factory.ts`              | Entity factory                                     |
  | `*.route.ts`                | Express router                                     |
  | `*.yup.validator.ts`        | yup implementation of a validator                  |
  | `*.spec.ts`                 | Tests (see [Testing](#testing))                    |

- **Classes**: PascalCase. **Default exports** for classes (`export default class FindCountryUseCase`).
- **Use case DTOs**: `InputFindCountryDto` / `OutputFindCountryDto`, living next to the use case.
- **Database**: tables and columns in `snake_case` (`countries`, `global_stats`, `daily_stats`, `today_cases`); models in PascalCase with `tableName` and `underscored`.
- **Migrations**: `YYYYMMDDNNNNNN-description.ts`, applied in order by Umzug.
- **Git**: Conventional Commits (`feat: add country history endpoint`).

### Design patterns

- **Use case**: a class whose constructor receives repositories/gateways by interface and which exposes a single `execute(input): Promise<output>`.
- **Repository**: interface in the domain (`extends RepositoryInterface<T>`); Sequelize implementation in infrastructure that converts model ↔ entity.
- **Gateway** (`CovidDataGateway`): isolates the external API. API Ninjas is one implementation; another source can be plugged in without touching use cases.
- **Entity + Factory**: entities extend `Entity` (id + `notification`), validate themselves in the constructor and throw `NotificationError` when there are errors. Creation goes through factories.
- **Notification**: accumulates every validation error instead of failing on the first one.
- **Value object**: `CovidStats` groups the metrics of a country and is immutable.
- **Presentation/DTO mapping**: use cases return plain DTOs; the history use cases share `history.mapper.ts`.
- **App factory**: `createApp(options)` receives repositories and config, which keeps the app trivially testable with fake or in-memory dependencies.
- **Centralised error handling**: domain errors are converted to stable error codes by a single middleware.

### Request flow

```
HTTP request
  → request-id → request-logger → helmet → cors → rate limit → json
  → route (validates iso2 / days)
  → use case.execute()
  → repository interface → Sequelize repository → PostgreSQL
  → DTO → JSON response
  (errors → error-handler → { error: { code, requestId } })
```

## Data model

| Table          | Purpose                                         | Key columns                                                                                                                                                        |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `countries`    | One row per country + its latest statistics     | `iso2` (PK), `iso3`, `name`, `lat`, `lng`, `population`, `cases`, `deaths`, `today_cases`, `today_deaths`, `cases_per_million`, `deaths_per_million`, `updated_at` |
| `global_stats` | A single row with the world totals              | `cases`, `deaths`, `today_cases`, `today_deaths`, `affected_countries`, `updated_at`                                                                               |
| `daily_stats`  | Time series for every country and for the world | `country_iso2` (`NULL` = global), `date`, `cases`, `deaths` (cumulative), `new_cases`, `new_deaths`; unique on (`country_iso2`, `date`)                            |

`recovered` and `active` exist in the API payload but are always `null`: the data source only provides cases and deaths. `cases_per_million` and `deaths_per_million` are computed by the backend from the population.

## Data source and seeding

**Source:** [API Ninjas COVID-19 API](https://api-ninjas.com/api/covid19) (`GET /v1/covid19`, header `X-Api-Key`). It only returns `cases` and `deaths`, has no coordinates, ISO codes or population, and has no global endpoint. The backend therefore compensates with:

- A **static country dataset** (`src/infrastructure/country/dataset/countries.data.ts`) with `iso2`, `iso3`, name, coordinates and population.
- A **name resolver** and an **alias table** (`country-aliases.ts`) that map the source's free-text country names to `iso2` (for example `US`, `Korea, South`, `Turkey`).
- **Region summing**: countries with administrative divisions come back as one series per region and are summed into a country total.
- A **computed global series**: the sum of every country, day by day.

`npm run seed` fetches one `cases` and one `deaths` series per country (with a pause between calls), merges them, computes the global series and saves everything in a single operation.

Data rules applied by the seed:

- Negative daily values (the source corrects totals retroactively) are stored as `0`; only real increases count as new cases/deaths. Cumulative totals are kept as received.
- Countries the source has no data for (mostly territories such as Hong Kong, Puerto Rico or Greenland) are reported as `skippedCountries` and do not fail the job. Only real errors (network, rate limit) go to `failedCountries` and set a non-zero exit code.

## REST API

Base path `/api`. JSON only. The API is **read-only** (`GET`).

| Endpoint                                   | Description                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `GET /api/health`                          | Health check                                                                |
| `GET /api/global`                          | World totals                                                                |
| `GET /api/global/history?days=30`          | World time series                                                           |
| `GET /api/countries`                       | Every country with its main metrics (lightweight, used for the map markers) |
| `GET /api/countries/:iso2`                 | Country detail (case-insensitive `iso2`)                                    |
| `GET /api/countries/:iso2/history?days=30` | Country time series                                                         |

`days` accepts integers from 1 to 365 (default 30). `iso2` must be exactly two letters.

Example — `GET /api/countries/BR`:

```json
{
  "iso2": "BR",
  "iso3": "BRA",
  "name": "Brazil",
  "lat": -10,
  "lng": -55,
  "population": 211998573,
  "cases": 37076053,
  "deaths": 699276,
  "recovered": null,
  "active": null,
  "todayCases": 0,
  "todayDeaths": 0,
  "casesPerMillion": 174888.22,
  "deathsPerMillion": 3298.49,
  "updatedAt": "2023-03-09T00:00:00.000Z"
}
```

Example — `GET /api/countries/BR/history?days=2`:

```json
{
  "iso2": "BR",
  "history": [
    { "date": "2023-03-08", "cases": 37076053, "deaths": 699276, "newCases": 0, "newDeaths": 0 },
    { "date": "2023-03-09", "cases": 37076053, "deaths": 699276, "newCases": 0, "newDeaths": 0 }
  ]
}
```

Dates are returned in ascending order. Read endpoints send `Cache-Control: public, max-age=300`.

## Errors

The API never translates anything: it returns a single envelope with a stable, English error code. The frontend is responsible for localising messages.

```json
{ "error": { "code": "COUNTRY_NOT_FOUND", "requestId": "e42ef02a-69cd-4aae-b62f-27fe03d331a5" } }
```

| Code                | HTTP | When                                                  |
| ------------------- | ---- | ----------------------------------------------------- |
| `VALIDATION_ERROR`  | 400  | Invalid `iso2` or `days`                              |
| `COUNTRY_NOT_FOUND` | 404  | The `iso2` is valid but has no data                   |
| `NOT_FOUND`         | 404  | Unknown route or method                               |
| `RATE_LIMITED`      | 429  | More than 120 requests per minute from the same IP    |
| `INTERNAL_ERROR`    | 500  | Unexpected error (details are logged, never returned) |

`requestId` always equals the `X-Request-Id` response header.

## Security and operations

- **CORS** limited to the configured origins (see [Connecting the frontend](#connecting-the-frontend)); only `GET`, `HEAD` and `OPTIONS` are allowed.
- **helmet** security headers.
- **Rate limit**: 120 requests per minute per IP, with standard `RateLimit-*` headers.
- **Request ID**: every response carries `X-Request-Id`, reused in logs and error bodies.
- **Structured logs**: one JSON line per request with `requestId`, method, path, status and duration.
- **Graceful shutdown** on `SIGINT`/`SIGTERM`: stops accepting connections, finishes in-flight requests, closes the database (10 s timeout).
- **Config validation** at startup; `.env` is never committed, only `.env.example`.
- The external API key (`API_NINJAS_KEY`) is used only by the seed job and never reaches the frontend.

## Getting started

Requirements: Node.js 24, npm and Docker (for PostgreSQL).

```bash
# 1. Install dependencies
npm ci

# 2. Create the environment file and set API_NINJAS_KEY
cp .env.example .env

# 3. Start PostgreSQL
docker compose up -d

# 4. Create the tables
npm run migrate

# 5. Import the data (takes a few minutes: one request per country and metric)
npm run seed

# 6. Start the API on http://localhost:3333
npm run dev
```

Get a free API key at [api-ninjas.com](https://api-ninjas.com). Then check `http://localhost:3333/api/health`.

For a production-like run: `npm run build`, then `npm run migrate:prod`, `npm run seed:prod` and `npm start`.

## Environment variables

| Variable         | Default                                       | Description                                     |
| ---------------- | --------------------------------------------- | ----------------------------------------------- |
| `PORT`           | `3333`                                        | HTTP port                                       |
| `DATABASE_URL`   | — (required)                                  | PostgreSQL connection string                    |
| `CORS_ORIGIN`    | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list of allowed browser origins |
| `API_NINJAS_KEY` | empty                                         | API Ninjas key, required only to run the seed   |

## Scripts

| Script                              | Description                                  |
| ----------------------------------- | -------------------------------------------- |
| `npm run dev`                       | API with hot reload (nodemon + ts-node)      |
| `npm run build` / `npm start`       | Compile to `dist/` / run the compiled server |
| `npm test`                          | Typecheck + the whole Jest suite             |
| `npm run typecheck`                 | `tsc --noEmit`                               |
| `npm run lint` / `npm run format`   | ESLint / Prettier                            |
| `npm run migrate`                   | Apply pending migrations                     |
| `npm run migrate:undo`              | Revert the last migration                    |
| `npm run seed`                      | Import the COVID-19 data                     |
| `npm run migrate:prod`, `seed:prod` | Same as above, against the compiled code     |

## Testing

Tests live next to the code they cover and use an in-memory SQLite database, so they need neither Docker nor an API key.

| Pattern                 | Scope                                                          |
| ----------------------- | -------------------------------------------------------------- |
| `*.spec.ts`             | Entities, factories, validators, repositories, gateway         |
| `*.unit.spec.ts`        | Use case with mocked repositories                              |
| `*.integration.spec.ts` | Use case + Sequelize (in-memory SQLite)                        |
| `*.e2e.spec.ts`         | HTTP routes through Supertest (`infrastructure/api/__tests__`) |

```bash
npm test
```

The GitHub Actions workflow runs `lint`, `test` and `build` on every push and pull request to `main` and `develop`.

## Manual testing with Postman

Import [docs/postman/covid-19-map-api.postman_collection.json](docs/postman/covid-19-map-api.postman_collection.json). It contains every endpoint, validation and error case, plus checks for helmet, CORS and rate limit headers. Run it with the database seeded and the API running (`npm run dev`). Variables: `baseUrl` (`http://localhost:3333/api`) and `corsOrigin` (`http://localhost:5173`).

To exercise the rate limit, run the `Health` request 130 times in the Collection Runner without delay: the last ones return `429` with `RATE_LIMITED`.

## Connecting the frontend

The frontend lives in [Itslucassantos/covid-19-map-dashboard-front-end](https://github.com/Itslucassantos/covid-19-map-dashboard-front-end).

1. Start the API (`npm run dev`), which listens on `http://localhost:3333`.
2. Point the frontend's API base URL to `http://localhost:3333/api`.
3. Start the frontend dev server. CORS is already configured for the Vite defaults, `http://localhost:5173` and `http://127.0.0.1:5173`. For another origin (for example `vite preview` on port 4173), set `CORS_ORIGIN` as a comma-separated list:

   ```
   CORS_ORIGIN=http://localhost:5173,http://localhost:4173
   ```

Browsers can read the `X-Request-Id` and `RateLimit-*` headers from cross-origin responses, since they are exposed by the CORS configuration.

## Known limitations

- The data ends on **2023-03-09**. `todayCases` and `todayDeaths` refer to that last day, not to the current date.
- **Recovered** and **Active** have no source and are always `null`; the frontend should hide those metrics.
- About 54 territories and dependencies have no data in the source and therefore no marker (for example Hong Kong, Macau, Puerto Rico, Greenland, Turkmenistan).
- Country names follow the English names of the dataset; the frontend can localise them with `Intl.DisplayNames` using the `iso2`.
- Negative daily corrections from the source are reported as `0` new cases, so the sum of `newCases` can differ slightly from the difference between cumulative totals.

## Conventions for contributors

- Keep dependencies pointing inwards (`infrastructure` → `usecase` → `domain`).
- One use case per folder, with its DTOs and its tests.
- New persisted fields need a **new migration**; never edit an applied migration. `sequelize.sync()` is only used in tests.
- The API must stay free of translated text: return data and stable error codes.
- Write code, comments, tests and commit messages in English, using Conventional Commits.
- Before opening a PR: `npm run lint && npm test && npm run build`.

## License

[MIT](LICENSE)
