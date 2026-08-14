-- Orun Home satellite (0012_home_satellite.sql)
--
-- Traz o modelo hub-and-spoke para o banco compartilhado OrunOS1
-- (desktop + mobile). É a versão "home" da 0007_ecosystem.sql do Orun-Core:
-- desktop/mobile são hubs (leem/escrevem tudo); TV, Shield e Home são
-- satélites que reportam heartbeat e processam apenas os comandos endereçados
-- ao próprio tipo — cegos entre si por design.
--
-- AUTOCONTIDA: cria a função set_updated_at() se ainda não existir e ignora
-- falhas do Realtime (opcional), para rodar sozinha em QUALQUER banco do
-- ecossistema. Idempotente: pode ser re-executada sem erro — inclusive onde
-- a 0007 já rodou com a lista antiga de tipos (o bloco do $$ migra os checks).
--
-- Só roda no Supabase; nada aqui altera o schema SQLite local dos apps.

-- Função de updated_at automático (idempotente; mesmo corpo de 0001_schema.sql).
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Registro + heartbeat de todos os dispositivos do ecossistema.
create table if not exists devices (
  id uuid primary key,
  tipo text not null check (tipo in ('desktop', 'mobile', 'tv', 'shield', 'home')),
  nome text not null default 'Dispositivo Orun',
  versao text,
  online boolean not null default false,
  ultimo_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_devices_tipo_online on devices (tipo, online);

-- Fila de comandos hub -> satélite. device_id nulo = broadcast para qualquer
-- satélite do tipo `target` (ex.: power.off para todos os Shields).
create table if not exists commands (
  id uuid primary key,
  target text not null check (target in ('tv', 'shield', 'home')),
  device_id uuid references devices(id) on delete cascade,
  action text not null,
  params jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'acknowledged', 'done', 'failed')),
  response jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_commands_pending on commands (target, status, created_at);

-- Migra o satélite 'home': garante os checks com o novo tipo mesmo em bancos
-- onde uma versão antiga das tabelas já existe. Idempotente.
do $$
begin
  begin
    alter table devices drop constraint devices_tipo_check;
    alter table devices add constraint devices_tipo_check
      check (tipo in ('desktop', 'mobile', 'tv', 'shield', 'home'));
  exception when others then
    null;
  end;
  begin
    alter table commands drop constraint commands_target_check;
    alter table commands add constraint commands_target_check
      check (target in ('tv', 'shield', 'home'));
  exception when others then
    null;
  end;
end $$;

-- updated_at auto-touch (drop + create para ser idempotente).
drop trigger if exists trg_devices_updated_at on devices;
create trigger trg_devices_updated_at before update on devices
  for each row execute function set_updated_at();
drop trigger if exists trg_commands_updated_at on commands;
create trigger trg_commands_updated_at before update on commands
  for each row execute function set_updated_at();

-- RLS: mesmo modelo de 0002_rls.sql — authenticated (sessão mobile/tablet)
-- tem acesso total; anon não lê nada (default deny). Desktop/TV/Shield/Home
-- rodam com service_role no próprio processo principal e ignoram RLS.
alter table devices enable row level security;
alter table commands enable row level security;

drop policy if exists "authenticated_full_access" on devices;
create policy "authenticated_full_access" on devices
  for all to authenticated using (true) with check (true);
drop policy if exists "authenticated_full_access" on commands;
create policy "authenticated_full_access" on commands
  for all to authenticated using (true) with check (true);

-- Realtime (opcional): publica as duas tabelas para hubs reajarem a heartbeats
-- e a acks por websocket. Falhas são ignoradas — o polling do SyncService
-- continua cobrindo mesmo sem Realtime habilitado no projeto.
do $$
begin
  begin
    alter publication supabase_realtime add table devices;
    alter publication supabase_realtime add table commands;
  exception when others then
    null;
  end;
end $$;
