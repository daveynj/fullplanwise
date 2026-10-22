---
name: esbuild lazy imports
description: Why the server build uses --splitting and how to keep heavy libraries off the start-up path.
---

esbuild (bundle + esm) hoists the `import` statements of external packages to the top of the output file, even when the module that uses them is only loaded with a dynamic `import()`. Without `--splitting`, every "lazy" local module still loaded its heavy packages (vite, jspdf, dompurify) at start-up.

**Why:** autoscale cold starts — every second before the server listens is a second a visitor waits.

**How to apply:** keep `--splitting` in the build script. To make a heavy package lazy, either `await import('pkg')` it directly where used, or put the code in a local module that is only dynamically imported. Also avoid awaiting database queries before `server.listen` — the first Neon connection costs 1–2 s.
