---
name: Vitest JSX transform quirk
description: Why .tsx test files fail to parse under vitest v4 in this repo and how to write tests that work
---
Vitest v4 here bundles rolldown-vite (oxc transformer). With tsconfig `"jsx": "preserve"`, JSX in test files is NOT transformed — neither `esbuild.jsx` config nor @vitejs/plugin-react v4 fixes it (oxc ignores esbuild options).

**Why:** oxc replaces esbuild in rolldown-vite; plugin-react only sets esbuild options.

**How to apply:** write client tests as `.test.ts` using `createElement` from React instead of JSX, or upgrade plugin-react to an oxc-aware version. Tests live in `client/src/__tests__/`, run via `npm test` (vitest.config.ts).
