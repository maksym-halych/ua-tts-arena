-- Model folders that an admin added. The folder name identifies the model.
create table public.models (
  name text primary key,
  -- Items with an MP3 copy when the model was added.
  item_ids text[] not null,
  paused_at timestamptz,
  added_at timestamptz not null default now()
);

-- One row for each signed-in rater. The id is the Supabase Auth user id.
-- There is no foreign key to auth.users, so votes stay if an account is deleted.
create table public.raters (
  id uuid primary key,
  email text not null,
  excluded_at timestamptz,
  excluded_reason text,
  created_at timestamptz not null default now()
);

-- A comparison that a rater has not voted on yet. Each rater has at most one.
-- The row is deleted when the vote is recorded. It is the only link between
-- the neutral audio URLs and the model names.
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  rater_id uuid not null unique references public.raters (id),
  item_id text not null,
  model_a text not null references public.models (name),
  model_b text not null references public.models (name),
  required_listen_ms integer not null,
  a_served_at timestamptz,
  b_served_at timestamptz,
  expires_at timestamptz not null,
  check (model_a <> model_b)
);

create table public.votes (
  id bigint generated always as identity primary key,
  rater_id uuid not null references public.raters (id),
  item_id text not null,
  winner text not null references public.models (name),
  loser text not null references public.models (name),
  chosen_side text not null check (chosen_side in ('a', 'b')),
  decision_ms integer not null,
  -- Whether the rater saw the model names after each vote at this time.
  models_shown boolean not null,
  created_at timestamptz not null default now(),
  excluded_at timestamptz,
  excluded_reason text,
  check (winner <> loser)
);

-- One vote for each rater, item and model pair, in either order.
create unique index votes_one_per_combination
  on public.votes (rater_id, item_id, least(winner, loser), greatest(winner, loser));
create index votes_rater_created on public.votes (rater_id, created_at);
create index votes_winner on public.votes (winner);
create index votes_loser on public.votes (loser);
create index votes_item on public.votes (item_id);

-- One row only: the primary key can have only the value true.
create table public.settings (
  id boolean primary key default true check (id),
  show_models_after_vote boolean not null default true,
  leaderboard_public boolean not null default true
);
insert into public.settings default values;

-- Votes that the leaderboard uses. Excluding a vote or a rater removes votes
-- from this view, and restoring puts them back. Nothing is deleted.
create view public.counted_votes with (security_invoker = true) as
  select v.*
  from public.votes v
  join public.raters r on r.id = v.rater_id
  where v.excluded_at is null and r.excluded_at is null;

create view public.pair_tallies with (security_invoker = true) as
  select winner, loser, count(*)::integer as wins
  from public.counted_votes
  group by winner, loser;

create view public.item_tallies with (security_invoker = true) as
  select item_id, count(*)::integer as votes
  from public.counted_votes
  group by item_id;

create view public.daily_tallies with (security_invoker = true) as
  select (created_at at time zone 'utc')::date as day, count(*)::integer as votes
  from public.counted_votes
  group by 1;

-- The browser has no direct database access. Only the app's server uses the
-- database, with the secret key. Row level security with no policies blocks the
-- other roles, and the revoke removes their default grants as a second barrier.
alter table public.models enable row level security;
alter table public.raters enable row level security;
alter table public.rounds enable row level security;
alter table public.votes enable row level security;
alter table public.settings enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
