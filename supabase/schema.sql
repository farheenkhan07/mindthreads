-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Rooms
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  tags text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Thoughts (user input history)
create table public.thoughts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  original_text text not null,
  room_id uuid references public.rooms(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- Threads
create table public.threads (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Replies
create table public.replies (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz default now() not null
);

-- Messages (live chat)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz default now() not null
);

-- Room members
create table public.room_members (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  last_seen_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  unique(room_id, user_id)
);

-- Indexes
create index on public.rooms(slug);
create index on public.threads(room_id);
create index on public.replies(thread_id);
create index on public.messages(room_id);
create index on public.messages(created_at desc);
create index on public.room_members(room_id, last_seen_at desc);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_rooms_updated_at before update on public.rooms
  for each row execute procedure public.update_updated_at();

create trigger update_threads_updated_at before update on public.threads
  for each row execute procedure public.update_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.thoughts enable row level security;
alter table public.threads enable row level security;
alter table public.replies enable row level security;
alter table public.messages enable row level security;
alter table public.room_members enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Rooms policies (public read, authenticated create)
create policy "Rooms are viewable by everyone" on public.rooms for select using (true);
create policy "Authenticated users can create rooms" on public.rooms for insert with check (auth.role() = 'authenticated');

-- Thoughts policies
create policy "Thoughts are viewable by everyone" on public.thoughts for select using (true);
create policy "Anyone can create thoughts" on public.thoughts for insert with check (true);

-- Threads policies
create policy "Threads are viewable by everyone" on public.threads for select using (true);
create policy "Authenticated users can create threads" on public.threads for insert with check (auth.uid() is not null);
create policy "Users can update own threads" on public.threads for update using (auth.uid() = user_id);

-- Replies policies
create policy "Replies are viewable by everyone" on public.replies for select using (true);
create policy "Authenticated users can create replies" on public.replies for insert with check (auth.uid() is not null);

-- Messages policies
create policy "Messages are viewable by everyone" on public.messages for select using (true);
create policy "Authenticated users can send messages" on public.messages for insert with check (auth.uid() is not null);

-- Room members policies
create policy "Room members are viewable by everyone" on public.room_members for select using (true);
create policy "Authenticated users can join rooms" on public.room_members for insert with check (auth.uid() = user_id);
create policy "Users can update own membership" on public.room_members for update using (auth.uid() = user_id);

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.room_members;

-- Seed some starter rooms
insert into public.rooms (name, slug, description, tags) values
  ('French', 'french', 'Everything about French language, culture, food, and travel.', ARRAY['language','culture','travel','france']),
  ('Canada PR', 'canada-pr', 'Permanent residency process, Express Entry, PNP, and life in Canada.', ARRAY['immigration','canada','pr','express-entry']),
  ('Frontend Jobs', 'frontend-jobs', 'Job hunting tips, portfolio advice, and opportunities for frontend devs.', ARRAY['jobs','frontend','tech','hiring']),
  ('Mom Life', 'mom-life', 'Parenting, motherhood, self-care, and everything in between.', ARRAY['parenting','family','wellness','community']),
  ('Moving to Toronto', 'moving-to-toronto', 'Neighbourhoods, cost of living, transit, and settling in Toronto.', ARRAY['toronto','canada','moving','city-life']),
  ('Mental Health', 'mental-health', 'A safe space to talk about anxiety, depression, and self-care.', ARRAY['mentalhealth','wellness','selfcare','support']),
  ('Startups', 'startups', 'Building products, fundraising, co-founders, and startup life.', ARRAY['startup','business','tech','entrepreneurship']),
  ('Cooking', 'cooking', 'Recipes, meal prep, kitchen hacks, and food obsessions.', ARRAY['food','recipes','cooking','kitchen']);
