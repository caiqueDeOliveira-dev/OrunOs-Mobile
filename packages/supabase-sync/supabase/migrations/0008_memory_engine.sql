-- 0008_memory_engine.sql
-- Memory Engine (Módulo 2) — pgvector para memória de longo prazo.
--
-- Requisitos: extension `vector`. Aplicar via pg + DIRECT_URL (não usar supabase CLI).
-- Seguro de rodar repetido (IF NOT EXISTS / IF EXISTS).
--
-- O que muda na tabela `memories`:
--   - user_id passa a ser opcional (memórias device-scoped do desktop, sem auth.user)
--   - novas colunas: device_id, scope_agent, scope_project, source, embedding (vector 768)
--   - índice HNSW por similaridade de cosseno
--   - função match_memories() para busca semântica no ai-relay/desktop
--
-- Obs: a tabela `memories` é criada em 0004_domain_tables.sql.

create extension if not exists vector;

-- Desktop escreve memórias device-scoped (sem user autenticado); mobile mantém user_id.
alter table memories alter column user_id drop not null;

alter table memories add column if not exists device_id text;
alter table memories add column if not exists scope_agent text;
alter table memories add column if not exists scope_project text;
alter table memories add column if not exists source text not null default 'manual';
alter table memories add column if not exists embedding vector(768);

-- Busca semântica por cosseno (embeddings nomic-embed-text do desktop = 768 dims).
create index if not exists idx_memories_embedding
  on memories using hnsw (embedding vector_cosine_ops);

create or replace function match_memories(
  query_embedding vector(768),
  p_user_id uuid default null,
  p_device_id text default null,
  p_agent text default null,
  p_project text default null,
  top_k int default 5,
  threshold float default 0.2
) returns table (
  id uuid,
  key text,
  content text,
  tags jsonb,
  scope_agent text,
  scope_project text,
  source text,
  created_at timestamptz,
  updated_at timestamptz,
  distance float,
  score float
) language plpgsql as $$
begin
  return query
  select m.id, m.key, m.content, m.tags, m.scope_agent, m.scope_project, m.source,
         m.created_at, m.updated_at,
         1 - (m.embedding <=> query_embedding) as distance,
         1 - (m.embedding <=> query_embedding) as score
  from memories m
  where m.deleted_at is null
    and m.embedding is not null
    and (p_user_id is null or m.user_id = p_user_id)
    and (p_device_id is null or m.device_id = p_device_id)
    and (p_agent is null or m.scope_agent is null or m.scope_agent = p_agent)
    and (p_project is null or m.scope_project is null or m.scope_project = p_project)
    and 1 - (m.embedding <=> query_embedding) >= threshold
  order by m.embedding <=> query_embedding
  limit top_k;
end;
$$;
