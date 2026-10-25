-- Freistaat: Schema, RLS und Seed-Daten
-- Einmalig im Supabase SQL Editor ausführen.
--
-- Wichtig: Die Seed-Daten entsprechen dem Stand der Website vom 25.10.2026.
-- Der Basisbestand (base_citizens, base_signatures) bildet die bisherigen
-- Simulationszahlen ab; echte Konten und Stimmen kommen hinzu.

begin;

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table if not exists public.parties (
  id text primary key,
  name text not null,
  short_name text not null,
  color text not null,
  leader text not null,
  members integer not null default 0 check (members >= 0),
  program text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.people (
  id text primary key,
  name text not null,
  initials text not null,
  party_id text references public.parties (id) on delete set null,
  statement text,
  created_at timestamptz not null default now()
);

create table if not exists public.elections (
  id text primary key,
  slug text not null unique,
  title text not null,
  office text not null,
  description text not null,
  type text not null check (type in ('person', 'rat', 'referendum')),
  seats integer check (seats is null or seats >= 0),
  eligible_voters integer not null default 0 check (eligible_voters >= 0),
  turnout integer check (turnout is null or turnout >= 0),
  candidacy_ends_at timestamptz not null,
  voting_ends_at timestamptz not null,
  parties text[] not null default '{}',
  results_public boolean not null default false,
  created_at timestamptz not null default now(),
  constraint elections_dates_check check (candidacy_ends_at < voting_ends_at)
);

create table if not exists public.candidacies (
  election_id text not null references public.elections (id) on delete cascade,
  person_id text not null references public.people (id) on delete cascade,
  list_position integer,
  sort_order integer not null default 0,
  primary key (election_id, person_id)
);

create table if not exists public.published_results (
  election_id text not null references public.elections (id) on delete cascade,
  option_id text not null,
  votes integer not null check (votes >= 0),
  primary key (election_id, option_id)
);

create table if not exists public.initiatives (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  text text not null,
  author_name text not null,
  status_override text check (status_override in ('rejected')),
  base_signatures integer not null default 0 check (base_signatures >= 0),
  threshold integer not null check (threshold > 0),
  created_at timestamptz not null default now(),
  ends_at timestamptz not null,
  referendum_slug text references public.elections (slug) on delete set null
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  discord_id text unique,
  display_name text not null,
  avatar_url text,
  role text not null default 'citizen' check (role in ('citizen', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  election_id text not null references public.elections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  option_id text not null,
  created_at timestamptz not null default now(),
  unique (election_id, user_id)
);

create table if not exists public.initiative_signatures (
  initiative_id text not null references public.initiatives (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (initiative_id, user_id)
);

create table if not exists public.site_settings (
  key text primary key,
  value integer not null
);

create index if not exists votes_election_id_idx on public.votes (election_id);
create index if not exists initiative_signatures_initiative_id_idx
  on public.initiative_signatures (initiative_id);
create index if not exists candidacies_person_id_idx on public.candidacies (person_id);

-- ---------------------------------------------------------------------------
-- Öffentliche Sichten (nur Aggregate, keine User-IDs)
-- ---------------------------------------------------------------------------

create or replace view public.initiative_overview
with (security_invoker = false)
as
select
  i.id,
  i.slug,
  i.title,
  i.summary,
  i.text,
  i.author_name,
  i.status_override,
  i.threshold,
  i.created_at,
  i.ends_at,
  i.referendum_slug,
  (i.base_signatures + coalesce(s.signatures, 0))::int as signatures
from public.initiatives i
left join (
  select initiative_id, count(*)::int as signatures
  from public.initiative_signatures
  group by initiative_id
) s on s.initiative_id = i.id;

create or replace view public.citizen_count
with (security_invoker = false)
as
select (
  coalesce((select value from public.site_settings where key = 'base_citizens'), 0)
  + (select count(*)::int from public.profiles where role = 'citizen')
) as citizens;

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------

create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = p_role
  );
$$;

create or replace function public.can_vote()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role in ('citizen', 'admin')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, discord_id, display_name, avatar_url)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'provider_id', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'user_name', ''),
      split_part(coalesce(new.email, 'Bürger'), '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.validate_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  election public.elections%rowtype;
begin
  select * into election from public.elections where id = new.election_id;
  if not found then
    raise exception 'election_not_found';
  end if;

  if election.type <> 'referendum' and now() < election.candidacy_ends_at then
    raise exception 'candidacy_phase';
  end if;

  if now() >= election.voting_ends_at then
    raise exception 'voting_closed';
  end if;

  if election.type = 'rat' then
    if not (new.option_id = any (election.parties)) then
      raise exception 'invalid_option';
    end if;
  else
    if not exists (
      select 1
      from public.candidacies c
      where c.election_id = new.election_id and c.person_id = new.option_id
    ) then
      raise exception 'invalid_option';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_initiative_signature()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  initiative public.initiatives%rowtype;
  collected integer;
begin
  select * into initiative from public.initiatives where id = new.initiative_id;
  if not found then
    raise exception 'initiative_not_found';
  end if;

  if initiative.status_override = 'rejected' then
    raise exception 'initiative_rejected';
  end if;

  if now() >= initiative.ends_at then
    raise exception 'initiative_expired';
  end if;

  select count(*)::int into collected
  from public.initiative_signatures
  where initiative_id = new.initiative_id;

  if initiative.base_signatures + collected >= initiative.threshold then
    raise exception 'threshold_reached';
  end if;

  return new;
end;
$$;

create or replace function public.publish_election(p_election_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'not_authorized';
  end if;

  if not exists (select 1 from public.elections where id = p_election_id) then
    raise exception 'election_not_found';
  end if;

  if exists (
    select 1 from public.elections
    where id = p_election_id and voting_ends_at > now()
  ) then
    raise exception 'voting_open';
  end if;

  delete from public.published_results where election_id = p_election_id;

  insert into public.published_results (election_id, option_id, votes)
  select election_id, option_id, count(*)::int
  from public.votes
  where election_id = p_election_id
  group by option_id;

  update public.elections set results_public = true where id = p_election_id;
end;
$$;

-- Trigger für neue Auth-Konten
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists validate_vote_before_insert on public.votes;
create trigger validate_vote_before_insert
  before insert on public.votes
  for each row execute function public.validate_vote();

drop trigger if exists validate_initiative_signature_before_insert
  on public.initiative_signatures;
create trigger validate_initiative_signature_before_insert
  before insert on public.initiative_signatures
  for each row execute function public.validate_initiative_signature();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.parties enable row level security;
alter table public.people enable row level security;
alter table public.elections enable row level security;
alter table public.candidacies enable row level security;
alter table public.published_results enable row level security;
alter table public.initiatives enable row level security;
alter table public.profiles enable row level security;
alter table public.votes enable row level security;
alter table public.initiative_signatures enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "parties public read" on public.parties;
create policy "parties public read" on public.parties
  for select to anon, authenticated using (true);

drop policy if exists "people public read" on public.people;
create policy "people public read" on public.people
  for select to anon, authenticated using (true);

drop policy if exists "elections public read" on public.elections;
create policy "elections public read" on public.elections
  for select to anon, authenticated using (true);

drop policy if exists "candidacies public read" on public.candidacies;
create policy "candidacies public read" on public.candidacies
  for select to anon, authenticated using (true);

drop policy if exists "published results public read" on public.published_results;
create policy "published results public read" on public.published_results
  for select to anon, authenticated using (true);

drop policy if exists "initiatives public read" on public.initiatives;
create policy "initiatives public read" on public.initiatives
  for select to anon, authenticated using (true);

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "votes own read" on public.votes;
create policy "votes own read" on public.votes
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "votes own insert" on public.votes;
create policy "votes own insert" on public.votes
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_vote());

drop policy if exists "signatures own read" on public.initiative_signatures;
create policy "signatures own read" on public.initiative_signatures
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "signatures own insert" on public.initiative_signatures;
create policy "signatures own insert" on public.initiative_signatures
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_vote());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.parties, public.people, public.elections,
  public.candidacies, public.published_results, public.initiatives
  to anon, authenticated;

grant select on public.initiative_overview, public.citizen_count
  to anon, authenticated;

grant select on public.profiles to authenticated;
grant select, insert on public.votes to authenticated;
grant select, insert on public.initiative_signatures to authenticated;

grant execute on function public.has_role(text) to authenticated;
grant execute on function public.can_vote() to authenticated;
grant execute on function public.publish_election(text) to authenticated;

revoke all on public.site_settings from anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.validate_vote() from public, anon, authenticated;
revoke all on function public.validate_initiative_signature()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed-Daten
-- ---------------------------------------------------------------------------

insert into public.site_settings (key, value)
values ('base_citizens', 24)
on conflict (key) do nothing;

insert into public.parties (id, name, short_name, color, leader, members, program)
values
  ('freie-buerger', 'Freie Bürger', 'FB', '#c9a86a', 'Tim', 9,
   'Weniger Regeln, mehr Eigenverantwortung. Transparente Abstimmungen und eine schlanke Verwaltung.'),
  ('soziale-liste', 'Soziale Liste', 'SL', '#7f9bb3', 'André', 7,
   'Gemeinschaftliche Projekte, faire Zugänge und ein starker Rat für alle Bürger.'),
  ('unabhaengige', 'Unabhängige', 'UNA', '#9c8fb3', 'Jakob', 4,
   'Überparteiliche Anträge, wechselnde Mehrheiten und keine Fraktionsdisziplin.')
on conflict (id) do nothing;

insert into public.people (id, name, initials, party_id, statement)
values
  ('tim', 'Tim', 'T', 'freie-buerger',
   'Für einen Rat, der Entscheidungen erklärt, statt sie nur zu treffen.'),
  ('jascha', 'Jascha', 'J', 'freie-buerger',
   'Bildung, Transparenz und ein offenes Ohr für alle Bürger.'),
  ('mia', 'Mia', 'M', 'freie-buerger',
   'Kurze Wege, klare Regeln und verlässliche Abstimmungen.'),
  ('andre', 'André', 'A', 'soziale-liste',
   'Mehr Beteiligung, klarere Regeln und offene Ausschüsse.'),
  ('lea', 'Lea', 'L', 'soziale-liste',
   'Soziale Projekte gehören ins Zentrum der Simulation.'),
  ('jonas', 'Jonas', 'J', 'soziale-liste',
   'Wir wollen Debatten, die zu Entscheidungen führen.'),
  ('jakob', 'Jakob', 'J', 'unabhaengige',
   'Unabhängig, direkt und ohne Fraktionszwang.'),
  ('sam', 'Sam', 'S', 'unabhaengige',
   'Neue Ideen für eine lebendige Simulation.'),
  ('lorenz', 'Lorenz', 'L', null,
   'Ruhe, Verfahrenstreue und nachvollziehbare Urteile.'),
  ('spritzk1ng', 'Spr1tzk1ng', 'S', 'unabhaengige',
   'Frische Perspektiven und kurze Wege zur Basis.'),
  ('ja', 'Ja', 'J', null, null),
  ('nein', 'Nein', 'N', null, null)
on conflict (id) do nothing;

insert into public.elections (
  id, slug, title, office, description, type, seats, eligible_voters,
  turnout, candidacy_ends_at, voting_ends_at, parties, results_public
)
values
  (
    'wahl-ministerpraesident-2026', 'ministerpraesident-2026',
    'Wahl des Ministerpräsidenten', 'Ministerpräsident',
    'Die Bürger wählen das Staatsoberhaupt des Freistaats. Gewählt ist, wer die meisten Stimmen erhält.',
    'person', null, 24, null,
    '2026-10-17T18:00:00Z', '2026-10-24T18:00:00Z', '{}', false
  ),
  (
    'wahl-rat-2026', 'rat-2026',
    'Wahl des Rats der Republik', 'Rat der Republik',
    'Fünf Sitze werden nach den Listen der Parteien vergeben. Jede Stimme zählt für eine Liste.',
    'rat', 5, 24, null,
    '2026-10-18T18:00:00Z', '2026-10-31T18:00:00Z',
    array['freie-buerger', 'soziale-liste', 'unabhaengige'], false
  ),
  (
    'wahl-kultusminister-2026', 'kultusminister-2026',
    'Wahl des Kultusministers', 'Kultusminister',
    'Das Amt verantwortet Bildung, Veranstaltungen und die Regeln des Miteinanders.',
    'person', null, 24, null,
    '2026-10-23T18:00:00Z', '2026-10-30T18:00:00Z', '{}', false
  ),
  (
    'wahl-oberster-gerichtshof-2026', 'oberster-gerichtshof-2026',
    'Wahl des Obersten Gerichtshofs', 'Oberster Gerichtshof',
    'Die Wahl ist abgeschlossen. Der Gerichtshof prüft Beschlüsse und Streitfälle der Simulation.',
    'person', null, 7, 2,
    '2026-10-10T18:00:00Z', '2026-10-14T18:00:00Z', '{}', true
  ),
  (
    'volksabstimmung-titelverlust', 'titelverlust',
    'Volksabstimmung: Titelverlust bei Rücktritt', 'Volksabstimmung',
    'Wer vom Amt des Ministerpräsidenten zurücktritt, soll den Titel sofort verlieren. Die Abstimmung geht auf ein qualifiziertes Bürgerbegehren zurück.',
    'referendum', null, 24, null,
    '2026-10-20T18:00:00Z', '2026-10-27T18:00:00Z', '{}', false
  )
on conflict (id) do nothing;

insert into public.candidacies (election_id, person_id, list_position, sort_order)
values
  ('wahl-ministerpraesident-2026', 'tim', null, 1),
  ('wahl-ministerpraesident-2026', 'andre', null, 2),
  ('wahl-ministerpraesident-2026', 'jakob', null, 3),
  ('wahl-ministerpraesident-2026', 'jascha', null, 4),

  ('wahl-rat-2026', 'tim', 1, 1),
  ('wahl-rat-2026', 'jascha', 2, 2),
  ('wahl-rat-2026', 'mia', 3, 3),
  ('wahl-rat-2026', 'andre', 1, 4),
  ('wahl-rat-2026', 'lea', 2, 5),
  ('wahl-rat-2026', 'jonas', 3, 6),
  ('wahl-rat-2026', 'jakob', 1, 7),
  ('wahl-rat-2026', 'sam', 2, 8),

  ('wahl-kultusminister-2026', 'jascha', null, 1),
  ('wahl-kultusminister-2026', 'jakob', null, 2),

  ('wahl-oberster-gerichtshof-2026', 'lorenz', null, 1),

  ('volksabstimmung-titelverlust', 'ja', null, 1),
  ('volksabstimmung-titelverlust', 'nein', null, 2)
on conflict (election_id, person_id) do nothing;

insert into public.published_results (election_id, option_id, votes)
values ('wahl-oberster-gerichtshof-2026', 'lorenz', 2)
on conflict (election_id, option_id) do nothing;

insert into public.initiatives (
  id, slug, title, summary, text, author_name, status_override,
  base_signatures, threshold, created_at, ends_at, referendum_slug
)
values
  (
    'initiative-wahlsystem', 'wahlsystem-eine-stimme',
    'Neues Wahlsystem: eine Stimme pro Person',
    'Mehrfachstimmen sollen abgeschafft werden. Jede Person erhält bei jeder Wahl genau eine Stimme.',
    'Bei allen Wahlen des Freistaats soll jede wahlberechtigte Person genau eine Stimme erhalten. Mehrfachstimmen und Stimmübertragungen werden abgeschafft. Die Wahlleitung prüft die Einhaltung vor der Auszählung.

Das Begehren richtet sich an den Rat. Wird die Schwelle erreicht, wird automatisch eine Volksabstimmung angesetzt.',
    'Jascha', null, 7, 12,
    '2026-10-12T10:00:00Z', '2026-10-26T18:00:00Z', null
  ),
  (
    'initiative-titelverlust', 'titelverlust',
    'Titelverlust bei Rücktritt',
    'Wer vom Amt des Ministerpräsidenten zurücktritt, verliert den Titel sofort.',
    'Tritt eine Person vom Amt des Ministerpräsidenten zurück, so verliert sie mit sofortiger Wirkung den Titel „Ministerpräsident“. Eine erneute Bewerbung bleibt möglich.

Die Schwelle wurde erreicht. Das Begehren ist qualifiziert und wird als Volksabstimmung zur Entscheidung vorgelegt.',
    'André', null, 14, 12,
    '2026-10-05T09:00:00Z', '2026-10-20T18:00:00Z', 'titelverlust'
  ),
  (
    'initiative-spitznamen', 'spitznamen-minister',
    'Minister dürfen ihre Spitznamen anpassen',
    'Amtsträger sollen ihren Anzeigenamen im Discord selbst ändern dürfen.',
    'Minister und Ministerinnen sollen ihren Anzeigenamen im Discord ohne Zustimmung der Wahlleitung anpassen dürfen. Die Amtsbezeichnung bleibt davon unberührt.

Die Frist ist abgelaufen, ohne dass die Schwelle erreicht wurde.',
    'Spr1tzk1ng', null, 3, 12,
    '2026-09-28T14:00:00Z', '2026-10-12T18:00:00Z', null
  ),
  (
    'initiative-ministerbefragung', 'ministerbefragung',
    'Öffentliche Ministerbefragung',
    'Jeden Monat soll eine öffentliche Fragerunde mit einem Minister stattfinden.',
    'Einmal im Monat findet eine öffentliche Fragerunde statt. Die Fragen werden vorab im Discord gesammelt, die Antworten im Anschluss veröffentlicht.

Das Begehren sammelt noch Unterschriften.',
    'Lea', null, 4, 12,
    '2026-10-15T16:00:00Z', '2026-11-02T18:00:00Z', null
  )
on conflict (id) do nothing;

commit;
