---
name: Expo env var pattern
description: How to pass Replit secrets to the Expo mobile bundle reliably across web and native.
---

## Rule
Pass secrets to the mobile bundle by setting `EXPO_PUBLIC_<NAME>=$SECRET_NAME` inline in the `package.json` dev script. Read them in app code with `process.env.EXPO_PUBLIC_<NAME>`. Do NOT use `Constants.expoConfig.extra` for secrets — the `extra` field from `app.config.ts` does not populate reliably in the web (Metro web bundler) context.

**Why:** Metro inlines all `EXPO_PUBLIC_` env vars it finds in the process environment at bundle time. Setting them inline in the dev script (`EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL`) works because shell expands the Replit secret into the child process env before Metro starts. `Constants.expoConfig.extra` requires the manifest to be serialized and embedded, which behaves differently on web vs native and caused a "supabaseUrl is required" crash.

**How to apply:** When a new secret needs to reach the mobile client, add `EXPO_PUBLIC_<NAME>=$SECRET_NAME` to the `dev` script in `artifacts/mobile/package.json` and read it with `process.env.EXPO_PUBLIC_<NAME>` in the app code. Then restart the `artifacts/mobile: expo` workflow.

**Current wired secrets (as of this session):**
- `EXPO_PUBLIC_SUPABASE_URL` ← `$SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` ← `$SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_DOMAIN` ← `$REPLIT_DEV_DOMAIN` (pre-existing)
