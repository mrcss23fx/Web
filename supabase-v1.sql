-- =========================================================
-- Bitácora · versión 1: operaciones que llegan solas desde MT5
-- Pega TODO este archivo en Supabase → SQL Editor → Run,
-- DESPUÉS de supabase.sql. Se puede ejecutar más de una vez.
-- =========================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. Operaciones (una fila por posición de MT5)
create table if not exists public.trades (
  user_id         uuid not null references auth.users(id) on delete cascade,
  id              text not null,              -- 'mt5:<cuenta>:<posición>'
  source          text not null default 'mt5' check (source in ('mt5','tradingview','manual')),
  account         text,
  broker          text,
  symbol          text not null check (char_length(symbol) between 1 and 32),
  side            text not null check (side in ('buy','sell')),
  volume          numeric,
  open_time       timestamptz,
  close_time      timestamptz,
  open_price      numeric,
  close_price     numeric,
  sl              numeric,                    -- stop con el que entraste
  tp              numeric,                    -- objetivo con el que entraste
  sl_moved        boolean not null default false, -- moviste el stop en contra
  profit          numeric,
  commission      numeric,
  swap            numeric,
  currency        text,
  balance_at_open numeric,
  risk_money      numeric,                    -- lo que perdías si tocaba el stop
  risk_pct        numeric,
  r               numeric,                    -- resultado en R (sale de cerrar)
  status          text not null default 'open' check (status in ('open','closed')),
  capture_entry   text,                       -- ruta de la foto en media/
  capture_exit    text,
  review          jsonb not null default '{}'::jsonb, -- cómo te sentías, por qué entraste...
  updated_at      timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists trades_user_time_idx on public.trades(user_id, open_time desc);
alter table public.trades enable row level security;
drop policy if exists "trades: solo el dueño" on public.trades;
create policy "trades: solo el dueño" on public.trades
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. Claves del programa puente (se guarda solo su huella, nunca la clave)
create table if not exists public.bridge_keys (
  key_hash   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen  timestamptz,
  last_info  jsonb not null default '{}'::jsonb   -- cuenta, bróker, versión del programa
);
alter table public.bridge_keys enable row level security;
drop policy if exists "bridge_keys: ver la mía" on public.bridge_keys;
create policy "bridge_keys: ver la mía" on public.bridge_keys for select using (user_id = auth.uid());
drop policy if exists "bridge_keys: borrar la mía" on public.bridge_keys;
create policy "bridge_keys: borrar la mía" on public.bridge_keys for delete using (user_id = auth.uid());

-- 3. Bandeja de capturas: el programa puente deja aquí la foto y la app,
--    al abrirse, la pasa a tu carpeta de fotos y la borra de aquí.
create table if not exists public.bridge_inbox (
  id         bigserial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  trade_id   text not null,
  kind       text not null check (kind in ('entry','exit')),
  png_b64    text not null check (char_length(png_b64) <= 1400000),
  created_at timestamptz not null default now()
);
create index if not exists bridge_inbox_user_idx on public.bridge_inbox(user_id);
alter table public.bridge_inbox enable row level security;
drop policy if exists "inbox: ver la mía" on public.bridge_inbox;
create policy "inbox: ver la mía" on public.bridge_inbox for select using (user_id = auth.uid());
drop policy if exists "inbox: borrar la mía" on public.bridge_inbox;
create policy "inbox: borrar la mía" on public.bridge_inbox for delete using (user_id = auth.uid());

-- 4. Crear (o cambiar) tu clave de conexión. Devuelve la clave UNA sola vez.
create or replace function public.create_bridge_key()
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare k text;
begin
  if auth.uid() is null then raise exception 'Necesitas iniciar sesión'; end if;
  k := 'bt_' || encode(extensions.gen_random_bytes(20), 'hex');
  delete from public.bridge_keys where user_id = auth.uid();
  insert into public.bridge_keys(key_hash, user_id)
    values (encode(extensions.digest(k, 'sha256'), 'hex'), auth.uid());
  return k;
end $$;

-- 5. Recibir una operación del programa puente (lo llama MT5 con tu clave)
create or replace function public.bridge_ingest(p_key text, p_trade jsonb)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid;
  tid text;
  st  text;
  pending int;
begin
  if p_key is null or char_length(p_key) > 100 then raise exception 'Clave no válida'; end if;
  select user_id into uid from public.bridge_keys
    where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
  if uid is null then raise exception 'Clave no válida'; end if;

  update public.bridge_keys set last_seen = now(),
    last_info = jsonb_build_object('account', p_trade->>'account', 'broker', p_trade->>'broker', 'version', p_trade->>'version')
    where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');

  -- Solo un latido para saber que el programa está conectado
  if coalesce(p_trade->>'ping', '') = '1' then return 'ok'; end if;

  if coalesce(p_trade->>'account', '') = '' or coalesce(p_trade->>'position', '') = '' then
    raise exception 'Faltan datos de la operación';
  end if;
  tid := 'mt5:' || left(p_trade->>'account', 20) || ':' || left(p_trade->>'position', 30);
  st  := case when p_trade->>'status' = 'closed' then 'closed' else 'open' end;

  insert into public.trades as t (user_id, id, source, account, broker, symbol, side, volume,
      open_time, close_time, open_price, close_price, sl, tp, sl_moved, profit, commission, swap,
      currency, balance_at_open, risk_money, risk_pct, r, status, updated_at)
  values (uid, tid, 'mt5', p_trade->>'account', left(p_trade->>'broker', 80),
      left(p_trade->>'symbol', 32),
      case when p_trade->>'side' = 'sell' then 'sell' else 'buy' end,
      (p_trade->>'volume')::numeric,
      to_timestamp((p_trade->>'open_time')::bigint),
      case when p_trade ? 'close_time' then to_timestamp((p_trade->>'close_time')::bigint) end,
      (p_trade->>'open_price')::numeric, (p_trade->>'close_price')::numeric,
      nullif((p_trade->>'sl')::numeric, 0), nullif((p_trade->>'tp')::numeric, 0),
      coalesce((p_trade->>'sl_moved')::boolean, false),
      (p_trade->>'profit')::numeric, (p_trade->>'commission')::numeric, (p_trade->>'swap')::numeric,
      left(p_trade->>'currency', 8), (p_trade->>'balance')::numeric,
      nullif((p_trade->>'risk_money')::numeric, 0), nullif((p_trade->>'risk_pct')::numeric, 0),
      (p_trade->>'r')::numeric, st, now())
  on conflict (user_id, id) do update set
      volume      = coalesce(excluded.volume, t.volume),
      close_time  = coalesce(excluded.close_time, t.close_time),
      close_price = coalesce(excluded.close_price, t.close_price),
      -- el stop, el objetivo y el riesgo con los que entraste no se pisan
      sl          = coalesce(t.sl, excluded.sl),
      tp          = coalesce(t.tp, excluded.tp),
      risk_money  = coalesce(t.risk_money, excluded.risk_money),
      risk_pct    = coalesce(t.risk_pct, excluded.risk_pct),
      balance_at_open = coalesce(t.balance_at_open, excluded.balance_at_open),
      sl_moved    = t.sl_moved or excluded.sl_moved,
      profit      = coalesce(excluded.profit, t.profit),
      commission  = coalesce(excluded.commission, t.commission),
      swap        = coalesce(excluded.swap, t.swap),
      r           = coalesce(excluded.r, t.r),
      status      = case when t.status = 'closed' then 'closed' else excluded.status end,
      updated_at  = now();

  -- Capturas (máximo 40 pendientes por persona para no llenar la base)
  select count(*) into pending from public.bridge_inbox where user_id = uid;
  if pending < 40 then
    if coalesce(p_trade->>'capture_entry', '') <> '' then
      insert into public.bridge_inbox(user_id, trade_id, kind, png_b64) values (uid, tid, 'entry', p_trade->>'capture_entry');
    end if;
    if coalesce(p_trade->>'capture_exit', '') <> '' then
      insert into public.bridge_inbox(user_id, trade_id, kind, png_b64) values (uid, tid, 'exit', p_trade->>'capture_exit');
    end if;
  end if;
  return 'ok';
end $$;

revoke all on function public.bridge_ingest(text, jsonb) from public;
grant execute on function public.bridge_ingest(text, jsonb) to anon, authenticated;
revoke all on function public.create_bridge_key() from public;
grant execute on function public.create_bridge_key() to authenticated;

-- 6. Aceptaciones legales (mayor de 18, aviso de riesgo, privacidad, datos de salud)
create table if not exists public.consents (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('adult','risk','privacy','health')),
  version     text not null,
  granted     boolean not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, kind, version)
);
alter table public.consents enable row level security;
drop policy if exists "consents: solo el dueño" on public.consents;
create policy "consents: solo el dueño" on public.consents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 7. Tiempo real: la operación aparece en la app nada más cerrarla
do $$ begin
  begin alter publication supabase_realtime add table public.trades; exception when others then null; end;
end $$;

-- 8. Borrar tu cuenta y todos tus datos (derecho de supresión)
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Necesitas iniciar sesión'; end if;
  delete from auth.users where id = auth.uid();   -- borra en cascada todo lo tuyo
end $$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
