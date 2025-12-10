# Repository Guidelines

## Tools and overall approach

The library is to be written as both a small reusable module exposing math functions for comparison calculations and as a web component that can be directly integrated into a page.

The web component should be built with `lit` tooling, include reasonable light/dark builtin styling and expose handles for a user to provide a CSS for styling.

## Project Structure & Module Organization

- `src/` contains source code for the project
- `tests/` mirrors `src/` folder names so every helper or component ships with a matching spec (e.g., `src/state/loan-math.js` ↔ `tests/state/loan-math.test.js`).
- `README.md` file hosts user-facing notes

## Build, Test, and Development Commands

- `npm install` — install dependencies; rerun whenever package manifests change.
- `npm run dev` — start the lightweight Vite server for hot-reload verification of Alpine components.
- `npm run build` — emit the minified bundle into `dist/` for deployment; fails if type errors or ESLint issues persist.
- `npm run lint` and `npm run lint:fix` -- run the project's code linters and linters in fix mode respectively. 
- `npm run test` — execute unit tests via Vitest

Both `npm run lint` and `npm run test` should be used to validate changes.

## Coding Style & Naming Conventions

- Use ES modules, 2-space indentation, and single quotes for strings unless template literals add clarity.
- DOM-manipulating files and web components end with `.ui.js` in the file name
- Files and code for model various account types are in the `src/accounts` folder
- Arthimatic and related functionality are in the `src/math` folder
- Run `npm run lint` (ESLint + Prettier) before opening a pull request; config enforces no implicit globals and browser-safe APIs only.

## Rounding and precision

- The project uses a javascript decimal number representation to help maintain precision when performing calculations on monetary amounts. In the general the project should maintain **20 digits* of precision when performing monetary calculations.
- The project uses "bankers rounding" When amounts must be rounded to 'usable' monetary amounts, ie values with only to digits after the decimal. Bankers rounding is described succinctly here: https://www.personalinvesting.jpmorgan.com/bankers-rounding. We need usable monetary amounts for accrual interest posting, loan payment schedule amount, credit card rewards amounts, and for display in the results UI.

## Testing Guidelines

- Write Vitest specs for every branch of amortization logic, mocking only built-in APIs like `Intl.NumberFormat` when necessary.
- Target ≥80% statement coverage on `loan-math` modules; document any exclusions inside `tests/coverage-exemptions.md`.

## Commit & Pull Request Guidelines

- Follow Conventional Commits (`feat: add adjustable-rate inputs`, `fix: correct APR rounding`), keeping scope names such as `loan-math` or `ui` for quick filtering.
- Each PR must describe the scenario, affected loan formulas, manual test steps (`npm run dev`, scenario values), and include screenshots or GIFs when UI shifts.
- Link related issues in the PR body (`Closes #12`) and reference ADR updates when altering assumptions about rates or repayment cadence.

## Documentation & Support

- Update `README.md` whenever inputs/outputs change, and extend `docs/loan-scenarios.md` with example borrower profiles whenever you add a new calculator path.
- Record sensitive configuration (e.g., API keys for rate tables) in `.env.example`, never in committed code; document expected units (percent vs decimal) inline.
