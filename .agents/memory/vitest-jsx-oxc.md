---
name: Vitest JSX transform quirk
description: Why .tsx test files fail to parse under vitest v4 in this repo and how to write tests that work
---
Vitest v4 here bundles rolldown-vite (oxc transformer). With tsconfig `"jsx": "preserve"`, JSX in test files is NOT transformed — neither `esbuild.jsx` config nor @vitejs/plugin-react v4 fixes it (oxc ignores esbuild options).

**Why:** oxc replaces esbuild in rolldown-vite; plugin-react only sets esbuild options.

**How to apply:** vitest.config.ts now sets `oxc: { jsx: { runtime: "automatic" } }`, which makes oxc transform JSX in vitest runs — so tests can import `.tsx` component files. Test files themselves are still written as `.test.ts` with `createElement`. Tests live in `client/src/__tests__/`, run via `npm test`.
