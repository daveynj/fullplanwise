---
name: GLM flash models burn the token budget on hidden reasoning
description: z-ai/glm-5.3-flash (and likely other GLM flash models) on OpenRouter have mandatory reasoning that consumes max_tokens, truncating JSON output unless reasoning effort is set low
---

`z-ai/glm-5.3-flash` on OpenRouter is a reasoning model with **mandatory** reasoning — `reasoning: {enabled: false}` returns 400 "Reasoning is mandatory for this endpoint". By default its hidden reasoning tokens (thousands) count against `max_tokens`, so the visible JSON content is truncated mid-string (`finish_reason: "length"`) and parsing fails even though the API call succeeds and credits are consumed.

**Why:** This broke production lesson generation after a model swap: OpenRouter logs showed spend, but every job failed with "Unterminated string in JSON" because the response was cut off.

**How to apply:** Every `/chat/completions` payload to a GLM flash model must include `reasoning: { effort: 'low' }` (drops reasoning to ~5 tokens, verified). Also give tiny-budget calls (e.g. health checks) headroom — a few reasoning tokens are always spent. Symptom to recognize: successful API response + JSON parse error at a position near the end of content + `finish_reason: "length"`. Diagnose with a direct curl inspecting `usage.completion_tokens_details.reasoning_tokens` and `message.reasoning`.
