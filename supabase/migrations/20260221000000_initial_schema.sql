-- =============================================================
-- NewsSwipe — Initial Database Schema
-- Migration: 20260221000000_initial_schema.sql
-- Run this in the Supabase SQL editor (or via supabase db push)
-- =============================================================

-- ─────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────
create extension if not exists "pgcrypto";   -- provides gen_random_uuid()


-- ─────────────────────────────────────────
-- 1. ENUMS
-- ─────────────────────────────────────────
create type article_category as enum (
  'news',
  'culture',
  'sport',
  'technology'
);

create type interaction_action as enum (
  'swipe_left',
  'swipe_right',
  'bookmarked'
);


-- ─────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────

-- 2a. articles
create table public.articles (
  id              uuid         primary key default gen_random_uuid(),
  external_id     text         unique,                          -- from NewsAPI / SerpApi
  title           text         not null,
  source_name     text,                                        -- e.g. "BBC News"
  source_logo_url text,
  image_url       text,
  article_url     text         not null,
  category        article_category,
  language        text         not null default 'en',
  published_at    timestamptz,
  created_at      timestamptz  not null default now(),
  is_active       boolean      not null default true
);

comment on table public.articles is
  'Cached news articles fetched from external APIs (NewsAPI, SerpApi, etc.).';


-- 2b. user_interactions
create table public.user_interactions (
  id             uuid         primary key default gen_random_uuid(),
  user_id        uuid         references auth.users (id) on delete cascade,
  article_id     uuid         not null references public.articles (id) on delete cascade,
  action         interaction_action not null,
  interacted_at  timestamptz  not null default now(),
  session_id     text                                          -- anonymous tracking pre-login
);

comment on table public.user_interactions is
  'Records every swipe/bookmark event, keyed to auth.users or a session_id for anonymous users.';


-- 2c. user_preferences
create table public.user_preferences (
  user_id                uuid      primary key references auth.users (id) on delete cascade,
  preferred_categories   text[]    not null default '{news,culture,sport,technology}',
  disliked_source_ids    text[]    not null default '{}',
  onboarding_completed   boolean   not null default false,
  updated_at             timestamptz
);

comment on table public.user_preferences is
  'One-row-per-user preferences; created after the user completes onboarding.';


-- ─────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────

-- Feed queries: filter by category, order newest first
create index idx_articles_category_published
  on public.articles (category, published_at desc);

-- Feed queries: only serve active articles, newest first
create index idx_articles_active_published
  on public.articles (is_active, published_at desc);

-- Interaction look-ups: "has this user already seen this article?"
create index idx_user_interactions_user_article
  on public.user_interactions (user_id, article_id);


-- ─────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table public.articles          enable row level security;
alter table public.user_interactions enable row level security;
alter table public.user_preferences  enable row level security;


-- ── articles ──────────────────────────────

-- Anyone (including anonymous visitors) can read active articles
create policy "articles: public read"
  on public.articles
  for select
  using (true);

-- Only the service_role (backend / edge functions) may insert / update / delete
create policy "articles: service_role insert"
  on public.articles
  for insert
  with check (auth.role() = 'service_role');

create policy "articles: service_role update"
  on public.articles
  for update
  using  (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "articles: service_role delete"
  on public.articles
  for delete
  using (auth.role() = 'service_role');


-- ── user_interactions ─────────────────────

-- Authenticated users can insert their own interactions
create policy "user_interactions: insert own"
  on public.user_interactions
  for insert
  with check (auth.uid() = user_id);

-- Authenticated users can read their own interactions
create policy "user_interactions: select own"
  on public.user_interactions
  for select
  using (auth.uid() = user_id);

-- Users may update/delete their own rows (e.g. un-bookmark)
create policy "user_interactions: update own"
  on public.user_interactions
  for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_interactions: delete own"
  on public.user_interactions
  for delete
  using (auth.uid() = user_id);


-- ── user_preferences ─────────────────────

-- Users can read only their own preference row
create policy "user_preferences: select own"
  on public.user_preferences
  for select
  using (auth.uid() = user_id);

-- Users can insert their own preference row
create policy "user_preferences: insert own"
  on public.user_preferences
  for insert
  with check (auth.uid() = user_id);

-- Users can update only their own preference row
create policy "user_preferences: update own"
  on public.user_preferences
  for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────
-- 5. HELPER: auto-update updated_at
-- ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute procedure public.set_updated_at();


-- ─────────────────────────────────────────
-- END OF MIGRATION
-- =============================================================
