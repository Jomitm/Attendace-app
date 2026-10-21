# AI Enhancement Plan — CRWI Attendance App (fully-free revision)

Status: proposal (no code written yet). Grounded in an audit of `api/_ai-provider.js` / `_ai-provider.cjs` and web research (sources at bottom).

> **Rev 2 (fully-free constraint):** user requires **fully free options only** — no card, no paid credits. Research verdict: **Hugging Face no longer qualifies.** Free HF accounts get **$0 monthly inference credits**; routed inference bills per compute-time after credits, and the old "few hundred free requests/hour" cookbook claim is stale and contradicted by current billing docs. HF chat/inference is therefore moved OUT of this plan; the free chain below replaces it. (HF remains acceptable only for optional local/self-hosted model serving — not used here.)

---

## 1. Where the AI system stands today

The app already has a resilient, provider-agnostic AI layer:

- **One shared provider** — `api/_ai-provider.js` (ESM) + `_ai-provider.cjs` mirror (used by the Vite dev plugin). Every AI surface goes through it: chat (`/api/ai-insights`), performance coach, hero select, briefing, task classify, tool plans, SSE streaming.
- **Provider chain**: OpenRouter free models (5-model chain with documented churn/retry notes) → optional xAI `grok-3-mini`.
- **Protocol**: OpenAI-compatible `/chat/completions`, 15 s per-call timeout, 9 s chain budget, retry + 1.5 s backoff on 429/5xx, `sanitizeHistory`, `trimMetrics`, per-user daily chat quota (`ai_usage` collection).
- **Gaps**:
  - Free OpenRouter models churn constantly (slugs retire, 429 storms) — the fallback chain erodes over time.
  - No embeddings → task search, policy Q&A and duplicate detection are keyword-based only.
  - Every non-trivial call depends on one API key; if OpenRouter has an outage, only a tiny xAI model catches it.

## 2. Why Hugging Face fits *this* codebase

Key finding from research: **HF offers an OpenAI-compatible router** — `https://router.huggingface.co/v1/chat/completions` — which means our `callOnce()`/`buildProviders()` integration is a drop-in new provider entry, zero protocol work. Other findings that shape the plan:

- **One token, many hosts**: HF bills usage-based through its Inference Providers router (no HF markup). 8B-class models run ~$0.02/M input + $0.05/M output — pennies at this app's volume (≤600-token responses, ~5 chat questions/user/day).
- **SSE streaming is supported** (`stream: true`) — our streaming endpoint works unchanged.
- **Embeddings**: `feature-extraction` API exists but is *not* on the OpenAI-compatible endpoint — chat only; embeddings need the HF task API (fine: a tiny helper endpoint).
- **Limits/costs (be honest in planning)**:
  - Free accounts have **$0 monthly credits** — routed inference requires purchased credit add-ons or PRO ($9/mo, includes $2 compute credits).
  - HF's own `hf-inference` service bills per **compute-time** (e.g. 10 s ≈ $0.0012), is CPU-focused (great for embeddings/clustering, mediocre for chat latency), and cold-start 503s are a known legacy-serverless behavior.
  - Model availability must be verified live in the [catalog](https://huggingface.co/inference/models) — e.g. Mistral-7B-Instruct-v0.3 showed no providers at research time, while `Qwen/Qwen2.5-7B-Instruct-1M` and `meta-llama/Llama-3.1-8B-Instruct` are routable.

**Conclusion**: HF is a strong **second/third leg** for the chain (reliability) and the natural **embedding backbone** for RAG-lite features — it is *not* a full replacement for the free OpenRouter path, and shouldn't be sold as "$0".

## 3. Phased plan

### Phase 0 — Drop-in chat provider (≈1 day, low risk)
**Goal**: HF becomes a standing fallback so the chat never degrades to rule-based answers because OpenRouter churns.

1. New env vars (`.env.example`, Vercel secrets): `HF_API_KEY` (user-access token), optional `HF_MODEL_CHAIN` (comma-separated, e.g. `Qwen/Qwen2.5-7B-Instruct-1M, meta-llama/Llama-3.1-8B-Instruct`).
2. Add a `huggingface` provider in `buildProviders()` in **both** `api/_ai-provider.js` and `api/_ai-provider.cjs` (keep mirrors in sync per AGENTS.md gotcha):
   - `url: 'https://router.huggingface.co/v1/chat/completions'`, `Authorization: Bearer ${HF_API_KEY}`, no extra headers needed.
   - Default model chain verified live against the catalog on implementation day.
3. Ordering: OpenRouter free models stay first (free), HF second, xAI last. `AI_MODEL_CHAIN` override continues to work.
4. Verify: `npm run build`, hit `/api/ai-insights` health/status path with and without `OPENROUTER_API_KEY`; confirm 3-provider chain logs which model served each answer.

**Acceptance**: kill the OpenRouter key locally → chat still answers via HF; latency ≤ existing coach budget (client caps at 30 s).

### Phase 1 — Reliability & cost controls (≈1–2 days)
1. **Per-provider circuit breaker** on top of the existing retry logic: after N consecutive hard failures (401/402/404) skip that provider for a cooldown (e.g. 10 min) instead of burning the 9 s chain budget on dud keys/retired slugs.
2. **Provider telemetry**: log (`provider/model/latency/status`) on every call; tag `ai_usage` quota docs with the model served — you'll see in one glance whether the free chain is degraded.
3. **Explicit cost ceiling**: HF credits I/O tracked like the existing chat quota; a small guard returns the deterministic fallback if monthly spend estimate exceeds a configurable cap (env `AI_MONTHLY_USD_CAP`).
4. Unit tests: provider-chain construction with mixed keys, circuit-breaker cooldown, ordering enforcement (mirror the existing `api-router.test.mjs` style).

### Phase 2 — Embeddings + RAG-lite (≈2–3 days, the real enhancement)
`feature-extraction` (e.g. `sentence-transformers/all-MiniLM-L6-v2`) is a *different endpoint shape* from chat, so it gets its own surface:

1. New underscore handler `api/_ai-embed.js` + `ROUTES` entry in `api/index.js` + `vercel.json` rewrite (the AGENTS.md three-file rule; keeps us inside the 12-function limit). Server-side only; caches embeddings in a Firestore `embeddings` collection keyed by item type + content hash, so nothing re-embeds unless text changed.
2. Features unlocked:
   - **Semantic task search in the CRWI Assistant** — "find that report task from a couple weeks ago" works without exact keywords; compare user query embedding vs. flattened `work_plans` tasks (we already flatten them in `getMyFlatTasks`).
   - **Duplicate postponed-task linting** — embedding similarity between a new day-plan task and existing open tasks flags near-duplicates before the count inflation we just fixed recurs.
   - **Grounded answers over minutes & policies** — chat answers cite the top-k matching `minutes`/`policies` documents (small-scale RAG; ~hundreds of docs, cosine similarity computed in-request, no vector DB needed at this size).
3. Offline fallback: keep the existing keyword heuristic when `HF_API_KEY`/credits are exhausted (`source: 'heuristic'` contract already exists).

**Acceptance**: ask the Assistant three semantic questions (paraphrased task name, policy paraphrase, "what did we decide in Monday's meeting") and get correct grounded answers; embedding cache hit rate >80% after first build.

### Phase 3 — Optional scale (only if measured latency/quality demands it)
> **Superseded by Rev 2:** items below relied on paid HF billing and no longer apply under the fully-free constraint. The fully-free equivalent of "scale up" is: raise Gemini/Groq reliance if their free limits allow, or accept the heuristic fallback when free chains are exhausted.
1. If router latency proves flaky for the coach narrative: a **dedicated HF Inference Endpoint** for one small instruct model ($/hour — needs a volume case; decide from Phase-1 telemetry, not speculation).
2. Consider HF **PRO** for the $2/mo credits + higher limits, vs. credit add-ons — $9/mo is trivial next to the feature value, but treat as a business decision.
3. Keep OpenRouter free chain as primary; do not migrate wholesale.

## 4. Risks & honest caveats
- **$0 free credits**: unlike OpenRouter's `:free` models, HF routed inference bills for real. Framing in this plan: reliability hedge + embeddings enabler, with a spend cap.
- `hf-inference` (HF's own compute) is CPU-oriented and per-compute-time billed — fine for MiniLM embeddings, wrong for chat.
- Slug/model availability churns — verify the chosen chain in the live catalog on implementation day (same discipline as our existing OpenRouter probe notes).
- Any new provider must land in **both** mirrors (`_ai-provider.js` + `_ai-provider.cjs`), or the Vite dev AI proxy diverges from production.

## 5. Sequencing recommendation
Phase 0 immediately (small, unblocks reliability), Phase 1 next week alongside normal work, Phase 2 as the feature sprint. Re-verify model selection immediately before each phase's implementation.

---

# Rev 2 — The fully-free provider stack (replaces HF phases)

## What replaces HF as the second/third leg of the chain

Research matched free tiers to this app's realistic load (~5 chat questions/user/day, ≤600-token outputs, plus periodic briefings/hero picks):

| Provider | OpenAI-compatible? | Free state (verified current docs) | Timestamps 1 and 2 |
|---|---|---|---|
| **Groq** | Yes (`/openai/v1/chat/completions`) | Free tier exists **without a payment method**; limits are per-model/org — read the account Limits page on signup day | chat (llama-3.x-8b/70b class), best latency fallback |
| **Google Gemini API** | Yes (`generativelanguage.googleapis.com/v1beta/openai/`) | Genuine free tier, no card; daily quotas reset midnight PT, per-model RPM/TPM/RPD vary by model | chat (gemini flash class) **+ embeddings** (text-embedding models have free per-request RPD limits) |
| **Mistral La Plateforme** | Yes | "Free mode" default for prototyping; no fixed public quota — check the dashboard | opportunistic third |
| OpenRouter `:free` | Yes | **Cap now 50 req/day** without a ≥$10 credit purchase (1,000/day after) — covers only ~10 users/day; keep as narrow fallback, not the pool | last resort |
| ~~HF~~ | — | **Excluded** — $0 credits on free accounts; bills per compute-time | — |

The existing `buildProviders()` chain becomes: **OpenRouter free models → Groq → Gemini → xAI**, with the same Retry+backoff/timeout plumbing reused as-is (all three new providers are plain `/chat/completions`).

## Rev 2 phases

### Phase 0R — Free-chain expansion (~1 day)
1. Env: `GROQ_API_KEY`, `GEMINI_API_KEY` (+ optional `MISTRAL_API_KEY`) in `.env.example` + Vercel secrets.
2. New provider entries in `buildProviders()` in **both** mirrors (`_ai-provider.js` + `_ai-provider.cjs`). Gemini via its OpenAI-compat inlet at `https://generativelanguage.googleapis.com/v1beta/openai/`.
3. Chain order documented above; no client changes.

### Phase 1R — Same as Phase 1 (briefness + circuit breaker + telemetry + spend-free flags)
Unchanged, except the "cost cap" item becomes a **rate-limit budget tracker**: per-provider counters of free-quota usage in `ai_usage` (readable RPD/RPM from limits pages at setup time), so the chain degrades gracefully to the next provider instead of hammering 429s.

### Phase 2R — Embeddings, fully free
- **Gemini free-tier embeddings** (OpenAI-compat `emb` inlet or native API) replaces the HF feature-extraction idea; embeddings RPD is small but workable for a one-time backfill + content-hash cache (most requests become cache hits).
- Everything else from Phase 2 (semantic task search, duplicate-postponed linting, grounded minutes/policies answers) is unchanged.

### Fallback ladder (no card at all, end to end)
OpenRouter `:free` (50/day) → Groq free → Gemini free → heuristic offline → rule-based answers (already implemented).

Updated sequencing: Phase 0R immediately, 1R next, 2R last. Re-verify each provider's live limit page on implementation day — all of these tiers are "not guaranteed capacity" by their own docs.

## Sources
- Inference Providers overview — https://huggingface.co/docs/inference-providers/index
- Chat completion (router, SSE) — https://huggingface.co/docs/inference-providers/tasks/chat-completion
- Pricing & billing — https://huggingface.co/docs/inference-providers/pricing
- hf-inference provider page — https://huggingface.co/docs/inference-providers/providers/hf-inference
- Feature extraction — https://huggingface.co/docs/inference-providers/tasks/feature-extraction
- Model catalog — https://huggingface.co/inference/models
- HF pricing (PRO) — https://huggingface.co/pricing
