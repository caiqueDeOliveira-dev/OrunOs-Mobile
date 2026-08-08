-- 0011_app_events.sql
-- Analytics / Dashboard (Modulo 6) - log granular de eventos de uso.
--
-- Cada acao relevante (chat, planner, agent hub, skills, knowledge) vira um
-- evento persistente. O desktop grava local (SQLite) e espelha aqui via
-- sync_outbox; mobile le para dashboards.
-- Nome `app_events` (nao colide com `usage_events`, que ja e a tabela de
-- custo por provider do schema 0001). Aplicar via pg + DIRECT_URL. Seguro
-- de rodar repetido.

create table if not exists app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_id text,
  type text not null,
  agent text,
  detail text,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists idx_app_events_type on app_events(type);
create index if not exists idx_app_events_created on app_events(created_at);
