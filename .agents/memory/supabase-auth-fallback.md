---
name: Supabase auth fallback
description: AppContext strategy — real Supabase auth with graceful demo-data fallback when tables don't exist yet.
---

## Rule
`AppContext` always uses Supabase auth (`signInWithPassword`, `signUp`, `signOut`, `onAuthStateChange`). For organization data, it calls `fetchUserOrgs(userId)` which queries `organization_members` joined with `organizations`. If those tables don't exist or return empty, it silently falls back to `DEMO_ORGS` so the app remains usable before the schema is applied.

**Why:** The user may register/login before running `supabase/schema.sql`. Supabase auth is a separate managed service that works immediately. The data tables (transactions, loans, meetings, etc.) are application-level and require the schema migration. Crashing on missing tables gives a terrible first-run experience.

**How to apply:** All Supabase data queries in `context/AppContext.tsx` are wrapped in `try/catch` returning `DEMO_ORGS` on any error. The `profiles.upsert` in `register()` is also try/catch — auth succeeds even if the profiles table is missing.

**Schema location:** `supabase/schema.sql` in the workspace root. User runs it in Supabase SQL Editor. After running it and creating at least one org, real data replaces demo data automatically on next login.
