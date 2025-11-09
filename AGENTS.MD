# AGENTS.md — Universal Common App (Next.js)

This document guides agents and contributors working on the universal job application platform (Common App for jobs). It captures project context, how to run checks, and concise conventions so agents can act deterministically.

## Background (PRD summary)

- Core problem: Job applications are fragmented and repetitive for candidates; employers get inconsistent, low-signal data.
- Candidate pain: Repetitive forms, status chaos, missed opportunities, inability to update across apps.
- Employer pain: Inconsistent formats, low SNR, fragmented comms, harder to identify quality matches.
- Vision: Standardized, centralized application once; one‑click apply everywhere. Higher‑quality, structured candidate data and better matching.

## Current repo context

- Framework: Next.js App Router.
- Data: file-backed JSON at `data/applications.json`.
- Library functions: `src/lib/applications.ts` exposes `readApplications()`, `applyToJob()`, `updateApplicationStatus()`, `getApplicationsWithCandidateInfo()`.
- Scripts (see `package.json`): `dev`, `build`, `start`, `lint`, `test`.

## Dev environment tips

- Run the app: `npm run dev` (or `pnpm dev` if you use pnpm).
- Lint quickly while coding: `npm run lint`.
- Type-check (optional): `npx tsc --noEmit`.
- Keep `data/` writable; you can override storage via `APPLICATIONS_JSON` env var.

Optional (monorepo workflows, if applicable):

- Use `pnpm dlx turbo run where <project_name>` to jump to a package.
- `pnpm install --filter <project_name>` to add a package to the workspace.
- `pnpm create vite@latest <project_name> -- --template react-ts` to scaffold a React+Vite package.
- Verify each package’s `package.json:name`; don’t rely on the top-level one.

## Testing instructions

- Continuous Integration (CI): If a CI workflow exists under `.github/workflows/`, ensure it runs `npm run lint` and `npm run test` on PRs. If not present, recommended minimal CI:
  - Node 20 LTS
  - Cache deps
  - Steps: install → lint → test → (optional) build
- Run tests locally:
  - Full suite: `npm run test` (Vitest).
  - Focused test: `npx vitest run -t "<test name>"`.
- Run linters/static analysis:
  - ESLint: `npm run lint`.
  - TypeScript (strict check, optional): `npx tsc --noEmit`.
- Updating tests:
  - Add or update tests for any behavior change you introduce.
  - Do NOT change existing tests unless explicitly requested by the user or justified by a spec change.

## PR instructions

- Title format: `[app] <Short, imperative title>` (e.g., `[app] add status update API`).
- Always run `npm run lint` and `npm run test` before pushing.
- Keep PRs small and focused; include a short “why” and “how”.
- If you change application statuses or data contracts, update `src/lib/applications.ts` types and affected tests.

## Agent operating notes

- Prefer idempotent tool calls:
  - Create/resume: `applyToJob(jobId, details?)` (returns `{ created, status }`).
  - Update status: `updateApplicationStatus(jobId, status)`.
  - Read: `readApplications()` or `getApplicationsWithCandidateInfo()`.
- Validate `jobId` is non-empty; surface a helpful error for `INVALID_JOB_ID`.
- Never fabricate application records; read first, then write.
- Minimize PII exposure in logs; prefer redaction.

## Minimal roadmap (near term)

- API routes: `POST /api/applications`, `GET /api/applications`, `PATCH /api/applications/:jobId/status`.
- UI: basic create/list/update flows under `src/app/candidate/`.
- Optional: notification stubs for offer deadlines.
