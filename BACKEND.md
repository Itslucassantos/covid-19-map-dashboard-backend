# BACKEND — COVID-19 Map Dashboard API

Fonte: PDF "PSP-2025-PBP-10-PROJETO 8". Complementa o [FRONTEND.md](FRONTEND.md).

## 1. Responsabilidade

Segundo o PDF, o backend deve: **buscar** dados de uma API pública de COVID-19, **armazenar** em banco e **expor uma API REST** para o front. Front e back são independentes (`web/` e `api/`).

## 2. Stack

Mesmo padrão do projeto de referência `fc-clean-architecture` (Full Cycle), adaptado para PostgreSQL:

- **Node.js + Express + TypeScript** (CommonJS, decorators habilitados para o `sequelize-typescript`)
- **Sequelize + sequelize-typescript** como ORM; **PostgreSQL** em dev/produção e **SQLite em memória** nos testes (o PDF diz que o banco é opcional no nível 1, mas ele é necessário para o histórico do nível 3)
- Validação de entidades: **yup**, dentro do domínio, com o padrão **Notification** (acumula erros e lança `NotificationError`)
- Agendamento da coleta: `node-cron`
- HTTP client: `fetch` nativo
- `dotenv`, `uuid`, `cors`, `helmet`, `express-rate-limit`
- Testes: **Jest + @swc/jest** + **Supertest** (unit, integration e e2e)
- Lint: ESLint + Prettier (o `tslint` do projeto de referência está descontinuado)

### Convenções (obrigatórias)

- **Tudo em inglês**: código, arquivos e pastas, rotas, query params, campos JSON, tabelas e colunas (snake_case: `countries`, `daily_stats`; models Sequelize em PascalCase com `CountryModel`), variáveis de ambiente, branches, comentários, testes e **commits** (Conventional Commits, ex.: `feat: add country history endpoint`). Nunca adicionar o Claude como coautor.
- **A API não traduz nada**: responde dados e códigos de erro estáveis em inglês (`COUNTRY_NOT_FOUND`). O idioma da interface (`en` padrão, `pt-BR` opcional) e o tema claro/escuro são responsabilidade do frontend.
- Nomes de países seguem o inglês vindo da fonte de dados; o front pode localizar via `Intl.DisplayNames` usando o `iso2`.

## 3. Fonte dos dados

**Decisão: API Ninjas** (`GET https://api.api-ninjas.com/v1/covid19`, header `X-Api-Key`; chave gratuita, uso comercial só no plano pago). A fonte fica isolada atrás de `CovidDataGateway`, então dá para trocar ou complementar depois sem tocar no resto.

O que a API oferece (conforme a documentação):

- `country=<name>` → série temporal por dia, `{ country, region, cases: { "YYYY-MM-DD": { total, new } } }`. Países com divisão administrativa (ex.: Canadá, EUA) retornam **um item por região**.
- `date=YYYY-MM-DD` → foto de **todos os países** naquele dia.
- `type=cases|deaths` (padrão `cases`): **uma chamada por tipo**.
- `region` / `county` para detalhar.

Limitações que moldam o backend:

| Limitação                                                | Efeito                                                                                                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Só **cases** e **deaths** (sem `recovered` nem `active`) | As métricas Recovered e Active do design não têm fonte (ver seção 10)                                                                    |
| Sem coordenadas, `iso2`, população ou bandeira           | Precisamos de um **dataset de países** (iso2, nome, lat/lng, população) no repositório, ou da API Ninjas `/v1/country` + `/v1/geocoding` |
| Sem endpoint global                                      | `GlobalStats` = soma de todos os países (e de todas as regiões) no dia                                                                   |
| Nome do país é texto livre                               | Mapear nome da API ↔ `iso2` do dataset (aliases para divergências, ex.: "US" vs "United States")                                         |
| Países com regiões                                       | Somar as regiões para obter o total do país                                                                                              |
| Limites do plano gratuito não documentados               | Importação inicial com pausas/retry e cache local; tratar `429`                                                                          |

Ponto a validar assim que houver chave: até que data a série vai, o formato exato da resposta por data, e os limites de requisições.

## 4. Arquitetura

**Clean Architecture** com **TypeScript**, seguindo a organização do projeto de referência `/home/lucas-santos/Downloads/courses/Full Cycle/fc-clean-architecture`: pastas por **contexto** (`country`, `global`, `history`, `sync`) dentro de cada camada, um arquivo por responsabilidade e testes ao lado do código.

Regra de dependência: o código aponta para dentro (`infrastructure` → `usecase` → `domain`). O `domain` não conhece Express, Sequelize, yup (apenas via interface de validator) nem a API externa.

| Camada         | Pasta                | Responsabilidade                                                                                  |
| -------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| Domain         | `src/domain`         | Entidades, value objects, factories, validators, interfaces de repositório e de gateway, eventos  |
| Use case       | `src/usecase`        | Um caso de uso por pasta, com seus DTOs de entrada/saída                                          |
| Infrastructure | `src/infrastructure` | Sequelize (models + repositórios), gateway da API de COVID, cron, API Express (rotas, presenters) |

```
api/
├── src/
│   ├── domain/
│   │   ├── @shared/
│   │   │   ├── entity/entity.abstract.ts              # id + notification
│   │   │   ├── notification/                          # notification.ts, notification.error.ts
│   │   │   ├── repository/repository-interface.ts     # create, update, find, findAll
│   │   │   └── validator/validator.interface.ts
│   │   ├── country/
│   │   │   ├── entity/country.ts                      # (+ country.spec.ts)
│   │   │   ├── value-object/covid-stats.ts            # cases, deaths, recovered, active...
│   │   │   ├── factory/country.factory.ts
│   │   │   ├── validator/country.yup.validator.ts
│   │   │   └── repository/country-repository.interface.ts
│   │   ├── global/
│   │   │   ├── entity/global-stats.ts
│   │   │   └── repository/global-stats-repository.interface.ts
│   │   ├── history/
│   │   │   ├── entity/daily-stat.ts                   # scope: country iso2 | global
│   │   │   └── repository/daily-stat-repository.interface.ts
│   │   └── sync/
│   │       └── gateway/covid-data-gateway.interface.ts  # porta da API externa
│   ├── usecase/
│   │   ├── country/
│   │   │   ├── find/       # find.country.usecase.ts, find.country.dto.ts,
│   │   │   │               # find.country.unit.spec.ts, find.country.integration.spec.ts
│   │   │   └── list/       # list.country.usecase.ts, list.country.dto.ts, ...
│   │   ├── global/find/    # find.global-stats.usecase.ts, ...dto.ts, ...spec.ts
│   │   ├── history/
│   │   │   ├── find-country/   # find.country-history.usecase.ts, ...
│   │   │   └── find-global/    # find.global-history.usecase.ts, ...
│   │   └── sync/sync-covid-data/  # sync.covid-data.usecase.ts, ...
│   └── infrastructure/
│       ├── country/repository/sequelize/    # country.model.ts, country.repository.ts, country.repository.spec.ts
│       ├── global/repository/sequelize/
│       ├── history/repository/sequelize/
│       ├── covid-data/gateway/api-ninjas/   # api-ninjas.gateway.ts (+ spec com resposta fake)
│       ├── job/                             # sync-covid-data.job.ts (node-cron)
│       └── api/
│           ├── express.ts                   # app, middlewares, rotas, setup do banco
│           ├── server.ts                    # listen + dotenv
│           ├── routes/                      # country.route.ts, global.route.ts, history.route.ts
│           ├── presenters/                  # country.presenter.ts ...
│           ├── middlewares/                 # error-handler.ts, request-id.ts, rate-limit.ts
│           └── __tests__/                   # country.e2e.spec.ts ...
├── package.json, tsconfig.json, jest.config.ts, .swcrc, .env.example
```

Padrões herdados do projeto de referência:

- **Default exports** (`export default class FindCountryUseCase`); nomes de arquivo em `kebab-case` com sufixo de papel: `*.usecase.ts`, `*.dto.ts`, `*.repository.ts`, `*.model.ts`, `*.factory.ts`, `*.route.ts`, `*.presenter.ts`, `*-repository.interface.ts`.
- **Use case** = classe com construtor recebendo o repositório (ou gateway) pela interface e um método `execute(input): Promise<output>`. DTOs `InputFindCountryDto` / `OutputFindCountryDto` ficam no `.dto.ts` ao lado.
- **Listas**: o use case usa um `OutputMapper.toOutput(entities)` interno para montar o DTO.
- **Entidade** estende `Entity` (id + `notification`), valida no construtor e lança `NotificationError` quando há erros. Criação via **Factory**.
- **Repositório**: interface no domínio (`extends RepositoryInterface<T>`); implementação Sequelize em `infrastructure/<context>/repository/sequelize/`, convertendo model ↔ entidade.
- **Composição**: as rotas instanciam use case + repositório (como no exemplo); como evolução, centralizar isso numa função de composição em `infrastructure/api/express.ts` para não repetir `new` em cada rota.
- **Presenters** em `infrastructure/api/presenters` formatam a saída da API.
- **Testes** ao lado do código: `*.spec.ts` (entidades, factories), `*.unit.spec.ts` (use case com repositório mockado), `*.integration.spec.ts` (use case + Sequelize SQLite em memória), `*.e2e.spec.ts` (Supertest nas rotas).
- Erros do domínio (`NotificationError`, "Country not found") são convertidos pelo middleware de erro nos códigos de erro estáveis da seção 6.

## 5. Modelo de dados

Entidades do domínio e tabelas (snake_case, em inglês, nomeadas nos models com `tableName` e `underscored`):

- **Country** → `countries`: `iso2` (PK), `iso3`, `name`, `lat`, `lng`, `population` (vindos do dataset de países) + value object `CovidStats` (colunas `cases`, `deaths`, `today_cases`, `today_deaths`, `cases_per_million`, `deaths_per_million`, `updated_at`; `recovered` e `active` ficam **nulos** enquanto não houver fonte)
- **GlobalStats** → `global_stats` (uma linha): soma dos países + `affected_countries`, `updated_at`
- **DailyStat** → `daily_stats`: `country_iso2` (null = global), `date`, `cases`, `deaths` — acumulados; `new_cases` e `new_deaths` guardados porque a API já os fornece; único por (`country_iso2`, `date`)

`cases_per_million` é calculado no backend (`cases / population * 1e6`).

## 6. API REST

Prefixo `/api`, JSON, todos `GET` (somente leitura).

| Endpoint                                   | Descrição                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `GET /api/health`                          | Healthcheck                                                                         |
| `GET /api/global`                          | Totais globais                                                                      |
| `GET /api/global/history?days=30`          | Série temporal global                                                               |
| `GET /api/countries`                       | Todos os países (leve: iso2, nome, lat/lng, métricas principais) para os marcadores |
| `GET /api/countries/:iso2`                 | Detalhe de um país                                                                  |
| `GET /api/countries/:iso2/history?days=30` | Série temporal do país                                                              |

Exemplo `GET /api/countries/BR`:

```json
{
  "iso2": "BR",
  "name": "Brazil",
  "lat": -14.23,
  "lng": -51.92,
  "cases": 0,
  "deaths": 0,
  "recovered": 0,
  "active": 0,
  "todayCases": 0,
  "todayDeaths": 0,
  "casesPerMillion": 0,
  "updatedAt": "2026-10-17T00:00:00Z"
}
```

Erros: envelope único `{ "error": { "code": "COUNTRY_NOT_FOUND", "requestId": "..." } }` com códigos estáveis (sem frases traduzidas — o front traduz). Principais: `VALIDATION_ERROR` (400), `COUNTRY_NOT_FOUND` (404), `RATE_LIMITED` (429), `UPSTREAM_UNAVAILABLE` (503), `INTERNAL_ERROR` (500).

Parâmetros validados na borda da API (`days` entre 1 e 365, `iso2` com 2 letras); erros viram `VALIDATION_ERROR`.

## 7. Sincronização

- **Seed inicial** (`npm run seed`): importa o histórico completo (uma série por país e por tipo: `cases` e `deaths`), soma regiões, calcula o global e grava no banco. Roda com pausa entre chamadas e retry em `429`.
- **Cron** (`node-cron`, mantido): uma vez por dia (ex.: 03:00 UTC), usa `date=<ontem>` para atualizar o snapshot de todos os países em **uma chamada** e acrescenta o dia em `daily_stats`. Frequência configurável por env (`SYNC_CRON`).
- Se a API externa falhar: mantém os dados antigos, registra o erro e a resposta continua servindo o banco com `updatedAt` visível.
- O front **nunca** chama a API externa; a chave (`API_NINJAS_KEY`) existe só no backend.

## 8. Segurança e operação

- CORS restrito à origem do front; helmet; rate limit por IP
- Variáveis em `.env` validadas na subida (`DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `API_NINJAS_KEY`, `SYNC_CRON`); `.env` nunca vai para o git, só o `.env.example`
- Cache HTTP (`Cache-Control: public, max-age=300`) nas leituras, já que os dados mudam poucas vezes ao dia
- Logs estruturados com `requestId`
- `docker-compose.yml` com PostgreSQL para dev (volume nomeado, healthcheck) e um segundo banco para testes de integração quando necessário
- **Migrations** com sequelize-cli/umzug desde o início (`npm run migrate`); `sequelize.sync()` só nos testes com SQLite em memória

## 9. Fases

1. Scaffold `api/`: package.json, tsconfig, Jest + swc, ESLint, `.env.example`, `docker-compose.yml`, migrations
2. Dataset de países + gateway da API Ninjas + seed
3. Casos de uso e rotas de países/global (Níveis 1 e 2), com testes unit, integration e e2e
4. Histórico (Nível 3) + cron diário
5. Erros, rate limit, segurança, deploy

## 10. Decisões

Tomadas:

- Fonte: **API Ninjas** por enquanto (atrás do `CovidDataGateway`)
- Cron mantido (diário) + seed inicial
- PostgreSQL via Docker Compose, migrations desde o início
- Pasta `api/` criada no repositório clonado do projeto; este arquivo será copiado para lá

Em aberto:

- **Recovered e Active**: a API Ninjas só entrega cases e deaths. Opções: (a) esconder esses dois botões por enquanto, (b) complementar com outra fonte atrás do mesmo gateway (ex.: disease.sh só para snapshot de recovered/active), (c) remover do escopo
- De onde vem o dataset de países (iso2, lat/lng, população): arquivo estático no repositório (recomendado) ou APIs Ninjas Country/Geocoding
- Chave `API_NINJAS_KEY` (criar conta gratuita e colocar no `.env` local)
