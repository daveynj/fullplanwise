---
name: Local production-build check
description: How to curl the production build locally when the server port is hardcoded to 5000.
---

The server always binds port 5000, so `npm start` conflicts with the dev workflow. Stop the dev server with `pkill -f "tsx server/[i]ndex.ts"`, then run `npm start` as a background task, curl, kill it, and restart the "Start application" workflow.

**Why:** plain `pkill -f "tsx server/index.ts"` also matches the agent's own shell command line and kills the tool call (exit -1). The `[i]` bracket stops the pattern from matching itself.

**How to apply:** Any time a task asks for curl output from `npm run build && npm start`.

Also: server/rate-limit-concurrency.test.ts uses the real DB and occasionally fails under the full parallel suite; it passes on rerun alone.
