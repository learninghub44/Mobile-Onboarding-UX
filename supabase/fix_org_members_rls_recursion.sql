-- ============================================================
-- Fix: "infinite recursion detected in policy for relation
-- organization_members"
--
-- Run this once in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project>/sql
--
-- Root cause: several RLS policies on organization_members
-- subqueried organization_members from within their own policy,
-- which makes Postgres re-evaluate the same policy while
-- evaluating it -- infinite recursion. Because almost every other
-- table (organizations, transactions, loans, meetings) checks
-- membership via organization_members, this broke all of them.
--
-- Fix: SECURITY DEFINER helper functions that check membership
-- while bypassing RLS internally, so policies no longer query the
-- table they're protecting.
--
-- Safe to run multiple times.
-- ============================================================

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

-- organizations
drop policy if exists "Org members can view organization" on public.organizations;
create policy "Org members can view organization"
  on public.organizations for select using (
    public.is_org_member(id)
  );

-- organization_members
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

-- transactions
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

-- loans
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

-- meetings
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
