# ChamaYetu — Real Data & Functionality Wiring Plan

**Audience:** any Claude/agent picking up this repo in a future session.
**Goal of this doc:** replace all mock data and dead buttons in `artifacts/mobile` with real Supabase-backed functionality, in safe, independently-shippable phases. UI/screens are considered done — do not restyle unless a phase explicitly says to add a new screen.

**Repo root:** `learninghub44/Mobile-Onboarding-UX`
**App workspace:** `artifacts/mobile` (Expo Router, React Native + web)
**Backend:** `artifacts/api-server` (Express, proxies Groq only, port 8080)
**DB:** Supabase Postgres — schema lives in `supabase/schema.sql` (source of truth, run manually in Supabase SQL editor — this repo has no migration runner wired to Supabase; `lib/db` + Drizzle target a *different* Postgres via `DATABASE_URL` and is currently unused by the mobile app)

Read `supabase/schema.sql` and `context/AppContext.tsx` before starting any phase — they define the current real data contract.

---

## Ground truth: what's real vs. mock today

| Area | State |
|---|---|
| Auth (email/password), session persistence | **Real** — `supabase.auth` in `AppContext.tsx` |
| Organizations, org switching, org stats (balance/contributions/loans/members count) | **Real**, but `fetchUserOrgs()` silently falls back to `DEMO_ORGS` on any error or empty result — this masks broken queries and empty states. Must fix in Phase 1. |
| Groq AI chat | **Real** — proxied through `api-server/src/routes/ai.ts`, key never in client |
| Dashboard recent activity, upcoming meeting, team members | **Mock** — `data/mockData.ts` → `TRANSACTIONS`, `MEETINGS`, `MEMBERS` |
| Finance tab (transactions list, loan cards, monthly chart) | **Mock** — `TRANSACTIONS`, `LOANS`, `MONTHLY_CONTRIBUTIONS` |
| Members tab (roster, search, filters) | **Mock** — `MEMBERS` |
| AI tab (context fed to Groq about the org) | **Mock** — builds prompt context from `TRANSACTIONS`, `LOANS`, `MEETINGS` instead of the real org |
| Profile tab (org list balances, settings) | **Partial** — org data via context is real; every `SettingItem` below "Preferences"/"Support" is `onPress={() => {}}` |
| Google / Apple sign-in buttons | **Fake** — no `onPress` handler at all |
| "Forgot your password?" link | **Fake** — `onPress={() => {}}` |
| Quick Actions on dashboard (Contribute / Loan / Expense / Invite) | **Fake** — all `onPress={() => {}}` |
| Organization creation / join flow | **Missing entirely** — no screen, no route |
| Write access to `loans` and `meetings` tables | **Missing** — RLS has SELECT policies only, no INSERT/UPDATE, so nobody can create a loan or meeting even from a wired UI |
| Tables for repayments, expenses, income, investments, fines, announcements, notifications, reports, audit_logs, attachments, invitations, roles, permissions, currencies, exchange_rates | **Not in schema** |

---

## Phase 0 — Foundations (do this first, blocks everything else)

**Objective:** stop masking failures, give every screen a single reliable way to read/write org-scoped data.

1. **Fix `fetchUserOrgs()` in `context/AppContext.tsx`:**
   - Remove the silent `DEMO_ORGS` fallback on query error. On error, set an `orgsError` field in `AppState` and let the UI show a real error state.
   - Keep `DEMO_ORGS` only as literal fallback content for a **new user with zero orgs**, and only if the product decision is "show a demo/sample org" — otherwise remove it and route zero-org users to the org creation flow (see Phase 3).
   - This is a product decision — flag it to Chris rather than guessing silently.

2. **Create `lib/queries/` folder** — one file per domain, each exporting typed fetch/insert/update functions that always filter by `org_id`. Do not call `supabase.from(...)` directly inside screen components going forward; route through these.
   - `lib/queries/transactions.ts`
   - `lib/queries/loans.ts`
   - `lib/queries/meetings.ts`
   - `lib/queries/members.ts`

3. **Create `lib/format.ts`** — move `formatCurrency`, `formatDate`, `getGreeting` out of `data/mockData.ts` into here (pure functions, no data). Update all imports.

4. **Add a `useOrgQuery` pattern** (either a tiny custom hook or wire up `@tanstack/react-query`, which is already a dependency in `package.json` but currently unused — confirm before adding a new library). Every tab should get `{ data, isLoading, error, refetch }` from real queries scoped to `currentOrg.id`, with pull-to-refresh wired to `refetch`.

5. **Delete `data/mockData.ts` only after every consumer is migrated** (Phases 1–4). Grep for `from '@/data/mockData'` before deleting — must return zero results.

**Acceptance:** app builds and typechecks (`pnpm --filter @workspace/mobile run typecheck`) with the new query layer in place and mock data still present but unused by dashboard.

---

## Phase 1 — Wire real data: read paths (screens render real Supabase data)

Do these in order; each is independently testable against a Supabase project with at least one seeded org.

### 1a. Finance tab (`app/(tabs)/finance.tsx`)
- Replace `TRANSACTIONS` → `lib/queries/transactions.ts: getTransactions(orgId, { type?, limit? })`, ordered `created_at desc`.
- Replace `LOANS` → `lib/queries/loans.ts: getLoans(orgId)`.
- Replace `MONTHLY_CONTRIBUTIONS` → compute client-side from the last 6 months of `contribution`-type transactions grouped by month (no SQL aggregation function exists yet — flag as a Phase 5 optimization if this gets slow with real volume).
- Add empty state ("No transactions yet — add your first contribution") using the existing `ErrorFallback.tsx` conventions if present, otherwise create a minimal `EmptyState` component (do not fabricate spec'd illustration assets — text + icon is fine for now).

### 1b. Members tab (`app/(tabs)/members.tsx`)
- Replace `MEMBERS` → `lib/queries/members.ts: getOrgMembers(orgId)`, joining `organization_members` with `profiles` for name/phone (schema currently has `member_name`/`member_initials` denormalized on `transactions`/`loans` but `organization_members` itself only has `user_id` — you will need to join `profiles` for display name; confirm `profiles.name` is populated for every member, since `register()` upsert can fail silently today — fix that too, see Phase 2).
- Keep existing search/filter UI logic; just swap the data source.

### 1c. Dashboard tab (`app/(tabs)/index.tsx`)
- Recent Activity → `getTransactions(orgId, { limit: 4 })`.
- Upcoming Meeting → `lib/queries/meetings.ts: getUpcomingMeeting(orgId)` (status = 'upcoming', order by `scheduled_at asc`, limit 1). Handle the "no upcoming meeting" case — the current code assumes `MEETINGS[0]` always exists and will crash on a real empty org.
- Team Members → `getOrgMembers(orgId, { limit: 6 })`.
- `contributionProgress`/`contributionTarget`/`contributionCurrent` on `FinancialCard` are currently hardcoded (`0.63`, `140000`, `88000`) — these need a real source. Simplest real definition: target = organization's configured monthly contribution goal (**does not exist in schema yet** — add `organizations.monthly_contribution_target bigint` in Phase 5, or compute "current" as this-month's contributions with no target/progress bar until the field exists). Flag this to Chris rather than inventing a number.

### 1d. AI tab (`app/(tabs)/ai.tsx`)
- Replace the mock-derived context block sent to Groq with real `currentOrg` data + a small real summary (recent transactions, active loan count/balance, next meeting) pulled via the same query functions as above. Keep the existing prompt-formatting logic, just swap the inputs.
- Respect the AI Safety rules from the original spec (`attached_assets/...txt`): the assistant must never be given write access — it only reads summarized data and drafts text. Do not wire any Groq tool-call/function-call path that executes a mutation directly.

**Acceptance:** with a seeded test org (real Supabase rows, zero mock imports left in these 4 files), all four tabs render correctly for both a populated org and a freshly created empty org (no crashes, proper empty states).

---

## Phase 2 — Wire real functionality: write paths & dead buttons

### 2a. Quick Actions (dashboard)
- **Contribute** → opens a simple amount+note form, inserts into `transactions` (`type: 'contribution'`, `member_id: auth.uid()`). Requires an INSERT RLS policy (see Phase 5).
- **Expense** → same pattern, `type: 'expense'`, gate to admin/treasurer role client-side *and* via RLS.
- **Loan** → opens a loan request form, inserts into `loans` with `status: 'pending'` (schema currently defaults `status` to `'active'` — add a `'pending'` status path so a member-submitted request needs treasurer/admin approval before becoming active; this is a schema default change, see Phase 5).
- **Invite** → see Phase 3 (needs `invitations` table, doesn't exist yet — stub the button to a "coming soon" toast rather than fabricating a fake flow, until Phase 3 lands).

### 2b. Auth screen fixes (`app/(auth)/login.tsx`, `register.tsx`)
- **Forgot password**: wire to `supabase.auth.resetPasswordForEmail(email)` with a simple "check your email" confirmation screen/toast. Needs a redirect URL configured in the Supabase Auth settings (coordinate with Chris — this touches Supabase dashboard config, not just code). **Transactional email provider is Resend** — if Supabase's built-in email (rate-limited, not for production volume) isn't sufficient, configure Supabase Auth's SMTP settings to send through Resend, or send custom auth emails (invite emails, meeting reminders, etc. from Phase 3/5) directly via the Resend API from `api-server` rather than the client. Never call Resend directly from the mobile app — proxy through `api-server` the same way Groq is proxied, so the `RESEND_API_KEY` never ships in the client bundle.
- **Google/Apple buttons**: either (a) wire to `supabase.auth.signInWithOAuth({ provider: 'google' | 'apple' })` — requires the OAuth provider to be enabled in the Supabase dashboard first (external dependency, confirm with Chris before writing code that will silently fail), or (b) if OAuth isn't being enabled soon, hide these buttons behind a feature flag instead of shipping dead UI. Do not leave a button that does nothing.
- **register.tsx profile upsert**: currently wrapped in a silent `try/catch` that swallows failure — a user can end up authenticated with no `profiles` row, which will break the Phase 1c member-list join. Fix: make this a hard requirement of successful registration (roll back / surface an error) rather than a best-effort side effect.

### 2c. Profile settings
- `Edit Profile` → real form updating `profiles.name`/`phone`, no schema changes needed.
- `Notifications`, `Security`, `Biometric Login`, `Dark Mode`, `Language` → each needs a real, persisted preference. Cheapest correct approach: a `user_preferences` jsonb column or table (Phase 5), not device-only `AsyncStorage`, since preferences should follow the user across devices — but if Chris wants device-only for v1, `AsyncStorage` is acceptable; confirm before building.
- `Default Currency` on Profile is org-level, not user-level — should route to org settings (needs the org edit screen from Phase 3), not a personal preference.

**Acceptance:** no `onPress={() => {}}` remains anywhere in `app/(auth)` or `app/(tabs)` except items explicitly deferred to a later phase and stubbed with a visible "coming soon" affordance (never a silent no-op).

---

## Phase 3 — Missing core flows (spec requires these, currently absent)

1. **Organization Setup Wizard** (new route group, e.g. `app/(org-setup)/`): name, type, country, base currency (ISO 4217 dropdown, not free text), timezone, logo upload (Supabase Storage), description, contribution schedule, meeting schedule, role assignment, invite first members, completion summary. This is the single biggest missing piece relative to the original spec.
2. **Create Organization vs. Join Organization** — post-auth branch when a user has zero orgs. Join needs an `invitations` table (Phase 5) with an invite-code or email-link flow. Invite emails go out via **Resend**, sent from `api-server` (never from the client), same proxy pattern as the Groq route.
3. **Profile Setup step** — currently `register()` only captures name/email/password; the spec calls for a distinct profile-setup step (phone, avatar) between registration and org creation.

**Acceptance:** a brand-new user can go signup → profile setup → create-or-join org → wizard → dashboard with zero hardcoded/demo data anywhere in the path.

---

## Phase 4 — Empty/loading/error states, theming (spec-required polish)

- Skeleton loaders for each tab's initial fetch (spec: "never show blank screens").
- Standard error states: No Internet, Session Expired, Server Error, Organization Not Found — one reusable component, several message variants.
- Light/Dark/System theme switching (currently `constants/colors.ts` is a single static palette) — wire to the Dark Mode setting from Phase 2c.

This phase is UI-adjacent but is about making real data states *usable*, not restyling — keep the existing visual design language, just add the missing state handling the spec calls for.

---

## Phase 5 — Schema & RLS expansion (backend work required before parts of Phases 2–3 can ship)

Update `supabase/schema.sql` (append, don't rewrite existing tables — this file has already been run against a live project, so new work must be additive `alter table` / new `create table` statements the next time, not edits to existing `create table` blocks):

1. **Missing INSERT/UPDATE RLS policies** on `loans` and `meetings` (currently SELECT-only — nobody can create a loan or meeting today even with a wired UI). Mirror the existing `transactions` insert-policy pattern (admin/treasurer for loans, admin/secretary for meetings).
2. **New tables** needed by Phases 2–3: `invitations`, `repayments`, `expenses` (or fold into `transactions.type`, already partially handled — confirm with Chris whether `expenses`/`income` stay as `transactions.type` values or become first-class tables per the original spec), `announcements`, `notifications`, `audit_logs`.
3. **Multi-currency fields** per spec: `transactions` needs `original_amount`, `original_currency`, `exchange_rate`, `base_currency_equivalent`, `exchange_rate_source`, `exchange_rate_date` if organizations are expected to record in multiple currencies (currently every transaction is implicitly in the org's single currency). Confirm this is in scope for v1 before building — it's a significant schema change.
4. `organizations.monthly_contribution_target` (or a separate `contribution_schedules` table) to back the real progress bar from Phase 1c.
5. `user_preferences` if going the persisted-preferences route from Phase 2c.

**This phase should be scoped and confirmed with Chris before writing SQL** — it's the one phase that changes the live database, not just app code.

---

## Working agreement for agents picking this up

- **Real data only.** Never introduce new hardcoded arrays as a substitute for a query, even temporarily — use a loading/empty state instead.
- **One phase per session where possible.** Phases are ordered by dependency; don't start Phase 2 write-paths against a table that doesn't have RLS insert policies yet (Phase 5 items are prerequisites, called out inline above).
- **Confirm before touching Supabase dashboard config** (OAuth providers, redirect URLs) or writing schema-changing SQL — these aren't reversible by `git revert`.
- **Terse commits, push after each logical batch**, matching existing repo convention.
- Update this file's checkboxes... actually, keep a running `## Progress Log` section appended below by whichever agent completes a phase, noting date, what shipped, what was deferred and why.

## Progress Log

_(append entries here as phases complete — do not delete prior entries)_
