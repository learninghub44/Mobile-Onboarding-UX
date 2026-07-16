-- ============================================================
-- ChamaYetu — Supabase Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project>/sql
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────
-- Extends auth.users with display name and phone.
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ─── Organizations ────────────────────────────────────────────
create table if not exists public.organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            text not null default 'Chama',   -- Chama | SACCO | Investment Group
  currency        text not null default 'KES',
  currency_symbol text not null default 'KSh',
  created_by      uuid references auth.users,
  created_at      timestamptz not null default now()
);

alter table public.organizations enable row level security;
create policy "Authenticated users can create organizations"
  on public.organizations for insert with check (created_by = auth.uid());
create policy "Creator can update organization"
  on public.organizations for update using (created_by = auth.uid());
-- Note: the "members can view org" SELECT policy is created further down,
-- after organization_members and its helper functions exist (it depends
-- on public.is_org_member(), defined below).

-- ─── Organization Members ─────────────────────────────────────
create table if not exists public.organization_members (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations on delete cascade,
  user_id             uuid not null references auth.users on delete cascade,
  role                text not null default 'member'
                        check (role in ('admin', 'treasurer', 'secretary', 'member')),
  status              text not null default 'active'
                        check (status in ('active', 'inactive', 'pending')),
  contribution_status text not null default 'up_to_date'
                        check (contribution_status in ('up_to_date', 'behind', 'ahead')),
  total_contributions bigint not null default 0,
  joined_at           timestamptz not null default now(),
  unique (org_id, user_id)
);

-- Backfill constraints for tables created before this change (create table
-- if not exists above won't retrofit an already-existing table). Any row
-- with a value outside the allowed set is coerced to a safe default first
-- so the constraint can actually be added.
update public.organization_members
  set role = 'member'
  where role not in ('admin', 'treasurer', 'secretary', 'member');

update public.organization_members
  set status = 'active'
  where status not in ('active', 'inactive', 'pending');

update public.organization_members
  set contribution_status = 'up_to_date'
  where contribution_status not in ('up_to_date', 'behind', 'ahead');

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organization_members_role_check'
  ) then
    alter table public.organization_members
      add constraint organization_members_role_check
      check (role in ('admin', 'treasurer', 'secretary', 'member'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'organization_members_status_check'
  ) then
    alter table public.organization_members
      add constraint organization_members_status_check
      check (status in ('active', 'inactive', 'pending'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'organization_members_contribution_status_check'
  ) then
    alter table public.organization_members
      add constraint organization_members_contribution_status_check
      check (contribution_status in ('up_to_date', 'behind', 'ahead'));
  end if;
end $$;

alter table public.organization_members enable row level security;

-- SECURITY DEFINER helper functions -- policies on organization_members
-- must NOT subquery organization_members directly (a policy that queries
-- its own table re-triggers RLS evaluation on itself, causing Postgres to
-- report "infinite recursion detected in policy for relation
-- organization_members"). These functions run with the privileges of
-- their owner, bypassing RLS internally, so policies can safely call them
-- instead of querying the table directly.
create or replace function public.is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = check_org_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin_or_treasurer(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = check_org_id
      and user_id = auth.uid()
      and role in ('admin', 'treasurer')
  );
$$;

-- Members of an org can view it (depends on is_org_member() above).
drop policy if exists "Org members can view organization" on public.organizations;
create policy "Org members can view organization"
  on public.organizations for select using (
    public.is_org_member(id)
  );

drop policy if exists "Members can view their own membership" on public.organization_members;
create policy "Members can view their own membership"
  on public.organization_members for select using (user_id = auth.uid());

drop policy if exists "Admins can view all memberships in their orgs" on public.organization_members;
create policy "Admins can view all memberships in their orgs"
  on public.organization_members for select using (
    public.is_org_admin_or_treasurer(org_id)
  );

drop policy if exists "Users can insert their own membership" on public.organization_members;
create policy "Users can insert their own membership"
  on public.organization_members for insert with check (
    user_id = auth.uid()
  );

drop policy if exists "Admins and treasurers can invite members into their org" on public.organization_members;
create policy "Admins and treasurers can invite members into their org"
  on public.organization_members for insert with check (
    public.is_org_admin_or_treasurer(org_id)
  );

drop policy if exists "Admins and treasurers can update membership roles and status" on public.organization_members;
create policy "Admins and treasurers can update membership roles and status"
  on public.organization_members for update using (
    public.is_org_admin_or_treasurer(org_id)
  )
  with check (
    public.is_org_admin_or_treasurer(org_id)
  );

-- ─── Transactions ─────────────────────────────────────────────
create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations on delete cascade,
  type            text not null,   -- contribution|loan|expense|repayment|income
  title           text not null,
  description     text,
  amount          bigint not null, -- positive for inflows, negative for outflows (stored in minor currency units ×100)
  currency        text not null,
  currency_symbol text not null,
  member_id       uuid references auth.users,
  member_name     text,
  status          text not null default 'completed',  -- completed|pending|failed
  created_at      timestamptz not null default now()
);

alter table public.transactions enable row level security;
drop policy if exists "Org members can view transactions" on public.transactions;
create policy "Org members can view transactions"
  on public.transactions for select using (
    public.is_org_member(org_id)
  );
drop policy if exists "Members can insert their own transactions" on public.transactions;
create policy "Members can insert their own transactions"
  on public.transactions for insert with check (
    member_id = auth.uid()
    and public.is_org_member(org_id)
  );

-- ─── Loans ───────────────────────────────────────────────────
create table if not exists public.loans (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations on delete cascade,
  member_id       uuid references auth.users,
  member_name     text not null,
  member_initials text,
  amount          bigint not null,
  balance         bigint not null,
  interest_rate   numeric not null default 10,
  disbursed_at    timestamptz,
  due_at          timestamptz,
  status          text not null default 'active',  -- active|overdue|settled
  created_at      timestamptz not null default now()
);

alter table public.loans enable row level security;
drop policy if exists "Org members can view loans" on public.loans;
create policy "Org members can view loans"
  on public.loans for select using (
    public.is_org_member(org_id)
  );
drop policy if exists "Members can insert loans for themselves" on public.loans;
create policy "Members can insert loans for themselves"
  on public.loans for insert with check (
    member_id = auth.uid()
    and public.is_org_member(org_id)
  );

-- ─── Meetings ────────────────────────────────────────────────
create table if not exists public.meetings (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations on delete cascade,
  title        text not null,
  scheduled_at timestamptz not null,
  location     text,
  status       text not null default 'upcoming',  -- upcoming|completed|cancelled
  created_at   timestamptz not null default now()
);

alter table public.meetings enable row level security;
drop policy if exists "Org members can view meetings" on public.meetings;
create policy "Org members can view meetings"
  on public.meetings for select using (
    public.is_org_member(org_id)
  );
drop policy if exists "Org members can insert meetings" on public.meetings;
create policy "Org members can insert meetings"
  on public.meetings for insert with check (
    public.is_org_member(org_id)
  );

-- ─── Auto-update updated_at on profiles ───────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ─── Optional: seed a demo org for the first admin ────────────
-- After running the schema, sign up in the app, then run:
--
-- insert into public.organizations (name, type, created_by)
--   values ('Umoja Investment Group', 'Investment Group', '<your-user-id>');
--
-- insert into public.organization_members (org_id, user_id, role)
--   values ('<org-id>', '<your-user-id>', 'admin');
