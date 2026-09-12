// Admin-only AI model selection.
//
// The site owner's admin account can pick which OpenRouter text model
// generates their lessons. This is the single source of truth for the
// curated allowlist: the server validates PUT /api/user/preferred-model
// against it and the admin UI renders the dropdown from it.
//
// Only models verified to return valid, non-truncated lesson JSON belong
// here. GLM-5 series models are reasoning models and get
// `reasoning: { effort: 'low' }` added to their payloads (see
// server/services/openRouter.ts); the others receive no reasoning parameter.

export interface SelectableModel {
  id: string;
  label: string;
}

export const DEFAULT_MODEL_ID = 'z-ai/glm-5.3-flash';

export const SELECTABLE_MODELS: SelectableModel[] = [
  { id: 'z-ai/glm-5.3-flash', label: 'GLM 5.3 Flash (Z.AI)' },
  { id: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5 (Anthropic)' },
  { id: 'anthropic/claude-opus-5', label: 'Claude Opus 5 (Anthropic)' },
  { id: 'openai/gpt-4o', label: 'GPT-4o (OpenAI)' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Google)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (Meta)' },
];

export function isSelectableModel(value: unknown): value is string {
  return typeof value === 'string' && SELECTABLE_MODELS.some((m) => m.id === value);
}
