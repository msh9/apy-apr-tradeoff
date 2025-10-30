# Setup Checklist

## Environment

- Install Node.js v22.17.1 (or compatible with package requirement `>=20.11.0`).
- Use npm 11.6.1; record any alternative package managers in this file if adopted later.

## First-Time Repository Setup

- Run `npm install` to pull Lit, Vite, Vitest, and linting dependencies.
- Verify tooling with `npm run lint` and `npm run test` (tests will intentionally fail once implementation is missing).
- Start the dev server with `npm run dev` to confirm Vite launches (component wiring will be added in later steps).

## Pre-Commit Reminders

- Lint and test locally before opening a PR.
- Update docs when inputs/outputs shift or new calculator flows are added.
