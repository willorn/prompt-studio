# Repository Guidelines

## 一、AI 行为约束（最高优先级）

- 保留注释，不要轻易删除注释
- 必须使用中文回复
- 在编码前需先分析需求与潜在边界条件，再给出实现
- 优先一次性给出完整方案，避免拆分成多轮修改

## Project Structure & Module Organization
- `src/` holds all app code: `components/` (UI atoms/molecules), `pages/` (route views), `store/` (Zustand state), `services/` (API/diff helpers), `db/` (Dexie), `styles/` & `theme/` (Tailwind tokens, CSS vars), `utils/` (shared helpers), `test/` (unit helper utils).  
- `public/` static assets; `assets/` design files; `docs/` product docs; `tests/` Playwright e2e specs; `specs/` additional test fixtures.  
- Entry points: `main.tsx` + `App.tsx`; routing in `router.tsx`; design tokens in `src/styles/tokens.js`.

## Build, Test, and Development Commands
- Install deps: `pnpm install` (repo tracked with `pnpm-lock.yaml`; `npm` works if needed).  
- Dev server: `pnpm dev` (Vite).  
- Type-check + build: `pnpm build` (runs `tsc` then `vite build`); skip type-check with `pnpm build:nocheck`.  
- Preview production build: `pnpm preview`.  
- Lint: `pnpm lint` (ESLint, zero warnings allowed).  
- Format: `pnpm format` (Prettier over `src/**/*.{ts,tsx,css}`).  
- Unit tests: `pnpm test` (Vitest); UI runner `pnpm test:ui`.  
- E2E: `pnpm test:e2e` (Playwright); headed UI `pnpm test:e2e:ui`.

## Coding Style & Naming Conventions
- TypeScript + React; prefer functional components with hooks.  
- 2-space indentation, single quotes, trailing commas per Prettier.  
- Components/files in PascalCase (`PromptEditor.tsx`); hooks start with `useX`; utility functions in camelCase.  
- Favor Tailwind utility classes; add shared styles to `src/styles/globals.css`. Keep theme values from `src/styles/tokens.js`/`themeColor.ts`.  
- Avoid inline magic numbers; centralize constants in `src/utils` or `src/styles`.

## Testing Guidelines
- Place unit specs near source (`*.test.ts`/`*.test.tsx`) or under `src/test/`.  
- Mock network/storage with `msw` or `fake-indexeddb` as needed.  
- For UI/interaction flows, add Playwright specs under `tests/` and keep them deterministic (no real network).  
- Run `pnpm test` before PRs; add snapshots only when stable and review diffs carefully.

## Commit & Pull Request Guidelines
- Use conventional-style messages: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`. Example: `feat: add prompt duplication shortcut`.  
- Each PR should include: summary of changes, linked issue/ticket, screenshots or GIFs for UI tweaks, and a list of commands/tests executed.  
- Keep PRs scoped (one feature or fix); prefer small, reviewable diffs.  
- Ensure lint/tests pass; note any intentional skips or known limitations in the PR description.
