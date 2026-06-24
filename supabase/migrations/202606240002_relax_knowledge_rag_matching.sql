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
  with cleaned_terms as (
    select distinct regexp_replace(term, '[^a-zA-Z0-9]+', '', 'g') as term
    from unnest(regexp_split_to_array(lower(coalesce(p_query, '')), '\s+')) as term
  ),
  useful_terms as (
    select term
    from cleaned_terms
    where char_length(term) >= 3
      and term not in (
        'the',
        'and',
        'for',
        'with',
        'what',
        'does',
        'this',
        'that',
        'you',
        'your',
        'our',
        'are',
        'can',
        'about'
      )
    limit 12
  ),
  query_text as (
    select coalesce(string_agg(term, ' | '), '') as value
    from useful_terms
  ),
  query_value as (
    select to_tsquery('simple', value) as value
    from query_text
    where value <> ''
  ),
  matched as (
    select
      d.id as document_id,
      c.id as chunk_id,
      d.title,
      c.content,
      ts_rank_cd(c.search_vector, q.value) as rank,
      c.created_at
    from public.knowledge_chunks c
    join public.knowledge_documents d on d.id = c.document_id
    cross join query_value q
    where c.user_id = p_user_id
      and d.user_id = p_user_id
      and c.search_vector @@ q.value
    order by rank desc, c.created_at desc
    limit greatest(1, least(coalesce(p_limit, 3), 8))
  ),
  fallback as (
    select
      d.id as document_id,
      c.id as chunk_id,
      d.title,
      c.content,
      0::real as rank,
      c.created_at
    from public.knowledge_chunks c
    join public.knowledge_documents d on d.id = c.document_id
    where c.user_id = p_user_id
      and d.user_id = p_user_id
      and not exists (select 1 from matched)
    order by c.created_at desc
    limit greatest(1, least(coalesce(p_limit, 3), 8))
  )
  select
    result.document_id,
    result.chunk_id,
    result.title,
    result.content,
    result.rank
  from (
    select * from matched
    union all
    select * from fallback
  ) result
  order by result.rank desc, result.created_at desc
  limit greatest(1, least(coalesce(p_limit, 3), 8));
$$;

revoke all on function public.match_knowledge_chunks(uuid, text, integer)
  from anon, authenticated;
grant execute on function public.match_knowledge_chunks(uuid, text, integer)
  to service_role;
