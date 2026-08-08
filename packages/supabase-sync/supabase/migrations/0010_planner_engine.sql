-- 0010_planner_engine.sql
-- Planner Engine (Modulo 4) - orquestrador serial.
--
-- Task simples (title, agent, status, priority, dependencies) persistida no
-- Supabase para o mobile enxergar. O desktop grava device-scoped; mobile le.
-- Aplicar via pg + DIRECT_URL. Seguro de rodar repetido.

create table if not exists planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_id text,
  goal_id text,
  title text not null,
  description text,
  agent text,
  status text not null default 'pending',
  priority int not null default 3,
  dependencies jsonb not null default '[]'::jsonb,
  result text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_planner_tasks_goal on planner_tasks(goal_id);
create index if not exists idx_planner_tasks_status on planner_tasks(status);
