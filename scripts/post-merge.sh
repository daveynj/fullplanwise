#!/bin/bash
# Post-merge setup: reinstall dependencies after a task merge.
# Idempotent and non-interactive (stdin is closed).
# NOTE: intentionally does NOT run drizzle-kit push — this project's DB has a
# legacy column that makes push mis-detect renames. Schema changes are applied
# via manual SQL only.
set -e

npm install
