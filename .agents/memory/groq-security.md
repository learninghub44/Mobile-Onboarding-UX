---
name: Groq security pattern
description: How Groq API calls are routed securely through the api-server to avoid exposing the key in the mobile bundle.
---

## Rule
The `GROQ_API_KEY` secret lives ONLY on the api-server. Mobile app code must never hold it. All Groq calls go through `POST /api/ai/chat` on the api-server, which is a thin proxy.

**Why:** React Native app bundles can be decompiled. Any secret embedded via `process.env.EXPO_PUBLIC_*` or `Constants.expoConfig.extra` is readable by anyone who inspects the bundle. The api-server is a trusted server process.

**How to apply:**
- api-server route: `artifacts/api-server/src/routes/ai.ts` — reads `process.env.GROQ_API_KEY`, accepts `{ messages, systemPrompt }`, calls `api.groq.com/openai/v1/chat/completions`, returns `{ content }`.
- Mobile client: `artifacts/mobile/lib/groq.ts` — constructs the URL as `https://${process.env.EXPO_PUBLIC_DOMAIN}/api-server/api/ai/chat` and POSTs to it.
- Model used: `llama-3.3-70b-versatile` (Groq's fastest large model).
