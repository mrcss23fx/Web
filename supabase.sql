-- =========================================================
-- Bitácora de Trading · base de datos (Supabase / Postgres)
-- Pega TODO este archivo en Supabase → SQL Editor → Run.
-- Se puede ejecutar más de una vez sin romper nada.
-- =========================================================

create extension if not exists pgcrypto;

-- 1. Datos privados de cada usuario (registro diario, plan, lecciones...)
create table if not exists public.docs (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  col        text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, col, id)
);
alter table public.docs enable row level security;
drop policy if exists "docs: solo el dueño" on public.docs;
create policy "docs: solo el dueño" on public.docs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. Grupos
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  created_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create table if not exists public.group_members (
  group_id     uuid not null references public.groups(id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null default 'Trader' check (char_length(display_name) between 1 and 40),
  joined_at    timestamptz not null default now(),
  primary key (group_id, user_id)
);
-- Lo que cada miembro decide compartir con cada grupo (una "foto" de sus datos)
create table if not exists public.shares (
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
-- Comentarios sobre operaciones compartidas
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  author      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_user uuid not null,
  target_ref  text not null,
  body        text not null check (char_length(body) between 1 and 1000),
  created_at  timestamptz not null default now()
);
create index if not exists comments_group_idx on public.comments(group_id, created_at desc);

-- ¿Soy miembro de este grupo? (security definer evita recursión en las reglas)
create or replace function public.is_member(gid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.group_members where group_id = gid and user_id = auth.uid());
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.shares enable row level security;
alter table public.comments enable row level security;

drop policy if exists "groups: ver si soy miembro" on public.groups;
create policy "groups: ver si soy miembro" on public.groups for select using (public.is_member(id));
drop policy if exists "groups: el creador edita" on public.groups;
create policy "groups: el creador edita" on public.groups for update using (created_by = auth.uid());
drop policy if exists "groups: el creador borra" on public.groups;
create policy "groups: el creador borra" on public.groups for delete using (created_by = auth.uid());

drop policy if exists "members: ver los de mis grupos" on public.group_members;
create policy "members: ver los de mis grupos" on public.group_members for select using (public.is_member(group_id));
drop policy if exists "members: cambiar mi nombre" on public.group_members;
create policy "members: cambiar mi nombre" on public.group_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "members: salir o expulsar" on public.group_members;
create policy "members: salir o expulsar" on public.group_members for delete using (
  user_id = auth.uid() or exists(select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid()));

drop policy if exists "shares: ver las de mis grupos" on public.shares;
create policy "shares: ver las de mis grupos" on public.shares for select using (public.is_member(group_id));
drop policy if exists "shares: publicar la mía" on public.shares;
create policy "shares: publicar la mía" on public.shares for insert with check (user_id = auth.uid() and public.is_member(group_id));
drop policy if exists "shares: actualizar la mía" on public.shares;
create policy "shares: actualizar la mía" on public.shares for update using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member(group_id));
drop policy if exists "shares: borrar la mía" on public.shares;
create policy "shares: borrar la mía" on public.shares for delete using (user_id = auth.uid());

drop policy if exists "comments: ver los de mis grupos" on public.comments;
create policy "comments: ver los de mis grupos" on public.comments for select using (public.is_member(group_id));
drop policy if exists "comments: escribir" on public.comments;
create policy "comments: escribir" on public.comments for insert with check (author = auth.uid() and public.is_member(group_id));
drop policy if exists "comments: borrar los míos" on public.comments;
create policy "comments: borrar los míos" on public.comments for delete using (author = auth.uid());

-- Crear un grupo (y entrar como primer miembro)
create or replace function public.create_group(p_name text, p_display text)
returns table(id uuid, invite_code text)
language plpgsql security definer set search_path = public as $$
declare g public.groups;
begin
  if auth.uid() is null then raise exception 'Necesitas iniciar sesión'; end if;
  insert into public.groups(name, created_by) values (trim(p_name), auth.uid()) returning * into g;
  insert into public.group_members(group_id, user_id, display_name)
    values (g.id, auth.uid(), coalesce(nullif(trim(p_display), ''), 'Trader'));
  return query select g.id, g.invite_code;
end $$;

-- Unirse a un grupo con su código
create or replace function public.join_group(p_code text, p_display text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'Necesitas iniciar sesión'; end if;
  select g.id into gid from public.groups g where g.invite_code = upper(trim(p_code));
  if gid is null then raise exception 'Código no válido'; end if;
  insert into public.group_members(group_id, user_id, display_name)
    values (gid, auth.uid(), coalesce(nullif(trim(p_display), ''), 'Trader'))
    on conflict (group_id, user_id) do nothing;
  return gid;
end $$;

revoke execute on function public.create_group(text, text) from public, anon;
revoke execute on function public.join_group(text, text) from public, anon;
revoke execute on function public.is_member(uuid) from public, anon;
grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.join_group(text, text) to authenticated;
grant execute on function public.is_member(uuid) to authenticated;

-- 3. Fotos y vídeos: carpeta propia por usuario.
-- Los nombres de archivo son aleatorios e imposibles de adivinar; el enlace solo
-- lo conoce quien lo tiene (tú, y tu grupo solo si decides compartir esa foto).
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 20971520)
on conflict (id) do update set public = true, file_size_limit = 20971520;

drop policy if exists "media: subir a mi carpeta" on storage.objects;
create policy "media: subir a mi carpeta" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "media: borrar de mi carpeta" on storage.objects;
create policy "media: borrar de mi carpeta" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "media: listar mi carpeta" on storage.objects;
create policy "media: listar mi carpeta" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Tiempo real para que los cambios lleguen a tus otros dispositivos
do $$ begin
  begin alter publication supabase_realtime add table public.docs; exception when others then null; end;
  begin alter publication supabase_realtime add table public.comments; exception when others then null; end;
end $$;
