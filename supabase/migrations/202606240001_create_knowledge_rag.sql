create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source_key text,
  source_url text,
  content_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (char_length(content) > 0),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(content, ''))
  ) stored,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists knowledge_documents_user_id_idx
  on public.knowledge_documents (user_id);

create index if not exists knowledge_chunks_user_id_idx
  on public.knowledge_chunks (user_id);

create index if not exists knowledge_chunks_document_id_idx
  on public.knowledge_chunks (document_id);

create index if not exists knowledge_chunks_search_vector_idx
  on public.knowledge_chunks using gin (search_vector);

create or replace function public.set_knowledge_document_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists knowledge_documents_set_updated_at
  on public.knowledge_documents;

create trigger knowledge_documents_set_updated_at
before update on public.knowledge_documents
for each row
execute function public.set_knowledge_document_updated_at();

create or replace function public.match_knowledge_chunks(
  p_user_id uuid,
  p_query text,
  p_limit integer default 3
)
returns table (
  document_id uuid,
  chunk_id uuid,
  title text,
  content text,
  rank real
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    d.id as document_id,
    c.id as chunk_id,
    d.title,
    c.content,
    ts_rank_cd(
      c.search_vector,
      plainto_tsquery('simple', coalesce(p_query, ''))
    ) as rank
  from public.knowledge_chunks c
  join public.knowledge_documents d on d.id = c.document_id
  where c.user_id = p_user_id
    and d.user_id = p_user_id
    and c.search_vector @@ plainto_tsquery('simple', coalesce(p_query, ''))
  order by rank desc, c.created_at desc
  limit greatest(1, least(coalesce(p_limit, 3), 8));
$$;

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

drop policy if exists "Users can view their own knowledge documents"
  on public.knowledge_documents;
drop policy if exists "Users can view their own knowledge chunks"
  on public.knowledge_chunks;

create policy "Users can view their own knowledge documents"
  on public.knowledge_documents
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view their own knowledge chunks"
  on public.knowledge_chunks
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.knowledge_documents to authenticated;
grant select on public.knowledge_chunks to authenticated;
revoke all on public.knowledge_documents from anon;
revoke all on public.knowledge_chunks from anon;
revoke insert, update, delete on public.knowledge_documents from authenticated;
revoke insert, update, delete on public.knowledge_chunks from authenticated;

revoke all on function public.match_knowledge_chunks(uuid, text, integer)
  from anon, authenticated;
grant execute on function public.match_knowledge_chunks(uuid, text, integer)
  to service_role;
