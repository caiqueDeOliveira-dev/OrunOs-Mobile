-- 0009_knowledge_engine.sql
-- Knowledge Engine (Modulo 3) - hub de docs auto-gerados.
--
-- Fonte de verdade: tabela `documents` (changelog, ADR, diario, roadmap, notas).
-- O desktop grava device-scoped (sem user autenticado); mobile le com user_id.
-- Aplicar via pg + DIRECT_URL (nao usar supabase CLI). Seguro de rodar repetido.

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_id text,
  kind text not null default 'note',
  title text not null,
  content text not null,
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_documents_kind on documents(kind);
create index if not exists idx_documents_updated on documents(updated_at desc);
