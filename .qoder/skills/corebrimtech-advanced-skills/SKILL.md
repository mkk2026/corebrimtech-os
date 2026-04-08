---
name: corebrimtech-advanced-skills
description: CoreBrimTech OS engineering standards and best practices for frontend, backend, database, AI integration, system architecture, and testing. Use when writing or reviewing code for the CoreBrimTech OS project to ensure adherence to established patterns and quality standards.
---

# CoreBrimTech OS — Advanced Skills

Engineering standards and best practices for the CoreBrimTech OS project.

---

## SKILL: Frontend Engineering (React/UI)

### Component Architecture
- Always prefer **composition over inheritance** — build small, focused, reusable components
- Every component must have a **single responsibility** — if it does two things, split it
- Co-locate component logic, styles, and tests in the same folder
- Use **named exports** for components, never default exports in shared/component libraries
- Separate **presentational components** (pure UI, no logic) from **container components** (data fetching, state)

### State Management
- Local state first (`useState`, `useReducer`) — don't reach for global state prematurely
- Use **context only for genuinely global state** (auth, theme, locale) — not for feature state
- For complex async state (server data, caching, pagination) use a dedicated data-fetching library — do not manage this manually
- Never store **derived state** — compute it from existing state instead
- Colocate state as close to where it is used as possible

### Performance
- **Memoize selectively** — `useMemo` and `useCallback` only when profiling confirms a bottleneck, not by default
- Lazy-load routes and heavy components using dynamic imports
- Virtualize long lists — never render 1000+ DOM nodes at once
- Avoid **prop drilling beyond 2 levels** — restructure or use context
- Images must always have explicit width/height to prevent layout shift

### TypeScript (Frontend)
- Every component must have **explicit prop types** — no implicit `any`
- Use **discriminated unions** for component variants instead of multiple boolean props
- Type event handlers explicitly: `React.ChangeEvent<HTMLInputElement>`, not `any`
- Use `unknown` instead of `any` when type is truly unknown, then narrow it

### Code Quality
- No inline styles — use CSS modules, styled-components, or Tailwind consistently
- No `console.log` in committed code
- All async operations inside components must handle **loading, error, and empty states**
- Forms must have **validation, error display, and loading state** — never just a submit handler

---

## SKILL: Backend Engineering (API/Server)

### API Design
- Follow **RESTful conventions strictly** — correct HTTP verbs, meaningful status codes, consistent resource naming
- Every endpoint must validate **all inputs** before touching business logic or the database
- Return **consistent error shapes** across all endpoints:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "...", "field": "email" } }
  ```
- **Never expose internal error messages** (stack traces, DB errors) to clients in production
- Version APIs from day one — `/api/v1/` — never make breaking changes without a new version

### Authentication & Authorization
- Never roll your own auth crypto — use proven libraries
- **JWT:** Short expiry (15 min access tokens), long-lived refresh tokens stored in httpOnly cookies
- Always check **both authentication** (who are you) **and authorization** (are you allowed) on every protected endpoint
- Use **middleware for auth checks** — never inline auth logic in route handlers
- Hash passwords with bcrypt (min cost factor 12) or argon2 — never MD5/SHA1

### Error Handling
- Use a **centralized error handler** — never scatter try/catch everywhere
- Distinguish between **operational errors** (expected: validation, not found) and **programmer errors** (unexpected: null pointer, type errors)
- Operational errors → return structured error response
- Programmer errors → log full stack trace, return generic 500, alert on-call
- Every async route handler must be wrapped — unhandled promise rejections crash the server

### Performance
- **Never do N+1 queries** — always check query count when fetching related data
- Use **database indexes** on every field used in WHERE, JOIN, or ORDER BY clauses
- Paginate all list endpoints — never return unbounded result sets
- Cache expensive computations and frequent reads — invalidate on write
- Use **connection pooling** — never create a new DB connection per request

### Security
- Sanitize all inputs — validate type, length, format, range
- Use **parameterized queries only** — never string-interpolate SQL
- Set security headers: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`
- Rate-limit all public endpoints — especially auth endpoints
- Never log sensitive data (passwords, tokens, PII) even at debug level

---

## SKILL: Database & Migrations

### Schema Design
- Every table needs: `id` (UUID preferred over auto-increment), `created_at`, `updated_at`
- Use **foreign key constraints** — always enforce referential integrity at the DB level, not just application level
- **Normalize first** — denormalize only when profiling proves it is necessary
- Use **appropriate column types** — don't store numbers as strings, don't store JSON when a proper relation works better
- Index **every foreign key column** by default

### Migrations
- Every schema change goes through a **migration file** — never modify the DB directly in production
- Migrations must be **reversible** — always write both `up` and `down`
- **Never drop a column in the same migration** that removes it from code — deprecate first, remove in a later release
- Test migrations against a **copy of production data** before applying
- Migrations run in CI before deployment — a failed migration blocks the deploy

### Query Discipline
- **Explain and analyze** slow queries before optimizing — never guess
- Select only the columns you need — never `SELECT *` in production code
- Use **transactions** for any operation that touches multiple tables
- For bulk operations, use batch inserts/updates — never loop single inserts
- Set **query timeouts** — never allow a single query to hold a connection indefinitely

### Data Integrity
- Enforce **NOT NULL constraints** wherever null is not a valid business value
- Use **CHECK constraints** for enumerable values at the DB level
- Store **timestamps in UTC always** — convert to local time only in the presentation layer
- Soft-delete with `deleted_at` timestamp for any data that may need recovery — only hard-delete when explicitly confirmed

---

## SKILL: AI/Model Integration

### Model Reference Governance (CoreBrimTech OS Rule)
- **NEVER hardcode a model ID string directly** in feature code — always reference via a centralized config:
  ```ts
  // config/models.ts — single source of truth
  export const MODELS = {
    fast: process.env.AI_MODEL_FAST,
    capable: process.env.AI_MODEL_CAPABLE,
  } as const;
  ```
- All model IDs must be **environment-variable driven** — never committed as literals in logic files
- Before adding ANY model ID, stop and get **explicit founder approval** — see AI Model Rule in master prompt
- After any model change, run verification grep and show output before declaring done

### Prompt Engineering
- Store all prompts in **dedicated prompt files or a prompts/ directory** — never inline long prompts in business logic
- Every prompt must have a **version comment** and a brief description of its purpose
- System prompts and user prompts must be **clearly separated** in code
- Test prompts against **edge cases and adversarial inputs** before shipping
- Log prompt inputs/outputs in development — never in production without PII scrubbing

### API Integration
- All AI API calls must go through a **single service layer** — never call the AI API directly from UI components or route handlers
- Implement **exponential backoff with jitter** for all AI API calls — they will fail transiently
- Set **explicit timeouts** on all AI API calls — never allow an unbounded wait
- Always handle: rate limit errors, context length errors, model unavailability, malformed responses
- **Stream responses** for long outputs — never make the user wait for a complete response before showing anything

### Cost & Safety Controls
- Log **token usage per request** — track cost from day one, not after bills arrive
- Set **max_tokens explicitly** on every call — never let the model decide
- Implement **input length validation** before sending to the API — reject oversized inputs early
- For user-generated content sent to AI APIs, **sanitize and validate** before forwarding
- Never send **credentials, secrets, or PII** to any AI model API

### Output Handling
- Never trust AI output as safe to render directly — **sanitize before rendering**
- Validate AI-generated structured data (JSON) against a schema before using it
- Always have a **fallback path** when AI output is malformed, empty, or nonsensical
- For AI-generated code: **review before executing** — never auto-execute model output

---

## SKILL: System Architecture & Cross-Cutting Concerns

### When Building Anything New
1. Check if something similar already exists in the codebase — expand before creating
2. Define the **data contract first** (inputs, outputs, types) before writing implementation
3. Identify all **consumers and dependencies** before changing shared code
4. Write the **interface before the implementation** — think API design first
5. Ask: what happens when this fails? Plan the failure path before the happy path

### Observability
- Every service must emit **structured logs** (JSON, not plain strings) with: timestamp, level, request ID, user ID (if applicable), message
- Add **timing logs** for any operation over 100ms
- Use **correlation IDs** to trace a request across services
- Errors must log: full stack trace, request context, user context (no PII)
- Never log secrets, tokens, passwords, or PII at any log level

### Environment Management
- Strict separation: `development`, `staging`, `production` — no shared resources between environments
- All environment-specific config via **environment variables** — never in committed code
- Use a `.env.example` file with all required keys (no values) committed to the repo
- Validate **all required env vars at startup** — fail fast with a clear error if any are missing
- Never use production credentials in development

### Code Review Standards (Self-Review Before Committing)
- Does this code do exactly what was asked — no more, no less?
- Are all edge cases handled (null, empty, error, timeout)?
- Is there any duplicated logic that should be abstracted?
- Are there any security implications (input validation, auth checks, data exposure)?
- Will this code be readable to a new engineer in 6 months?
- Are all AI model references approved and sourced from config, not hardcoded?

### Dependency Management
- Before adding a new dependency, ask: is this truly needed, or can it be done in ~20 lines?
- Check **last updated, weekly downloads, open issues** before adding any package
- Pin dependency versions in production — never use `*` or `latest`
- Audit dependencies regularly — `npm audit` or equivalent before every release
- Never import an entire library for one utility function — import only what you need

---

## SKILL: Testing Standards

### What to Test
- Test **behavior, not implementation** — test what the code does, not how it does it
- Unit test: pure functions, utilities, business logic
- Integration test: API endpoints, database operations, service interactions
- E2E test: critical user flows only — login, core feature, payment if applicable

### How to Write Tests
- Every test must have: **Arrange → Act → Assert** structure, clearly separated
- Test names must describe the scenario: `"returns 401 when token is expired"` not `"auth test 3"`
- One assertion per test where possible — multiple assertions make failures hard to diagnose
- Never test implementation details — if you refactor and tests break without behavior changing, the tests are wrong

### Test Data
- Use **factories or builders** for test data — never hardcode magic values
- Reset database state between tests — tests must be **order-independent**
