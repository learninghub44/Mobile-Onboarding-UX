---
name: Groq security pattern
description: How Groq API calls are routed securely through the api-server to avoid exposing the key in the mobile bundle.
---

## Rule
The `GROQ_API_KEY` secret lives ONLY on the api-server. Mobile app code must never hold it. All Groq calls go through `POST /api/ai/chat` on the api-server, which is a thin proxy.

**Why:** React Native app bundles can be decompiled. Any secret embedded via `process.env.EXPO_PUBLIC_*` or `Constants.expoConfig.extra` is readable by anyone who inspects the bundle. The api-server is a trusted server process.

**How to apply:**
- api-server route: `artifacts/api-server/src/routes/ai.ts` — reads `process.env.GROQ_API_KEY`, accepts `{ messages, systemPrompt }`, calls `api.groq.com/openai/v1/chat/completions`, returns `{ content }`.
- Mobile client: `artifacts/mobile/lib/groq.ts` — POSTs to `${EXPO_PUBLIC_API_SERVER_URL}/api/ai/chat`.
- Model used: `llama-3.3-70b-versatile` (Groq's fastest large model).

**Deploying outside Replit:** `EXPO_PUBLIC_API_SERVER_URL` must be set to wherever `artifacts/api-server` is actually deployed (e.g. a Render/Railway URL), not derived from `EXPO_PUBLIC_DOMAIN`/Replit's dev-proxy path. The old pattern (`https://${EXPO_PUBLIC_DOMAIN}/api-server`) only worked inside Replit's own routing and silently fell back to `http://localhost:8080` everywhere else, breaking AI chat outside Replit. `package.json`'s `dev` script still derives a sane default for Replit dev, but production builds must set this explicitly.
