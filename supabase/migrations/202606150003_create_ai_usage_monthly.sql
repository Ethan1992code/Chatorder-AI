create table if not exists public.ai_usage_monthly (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_month text not null check (
    usage_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  ),
  generate_reply_count integer not null default 0 check (
    generate_reply_count >= 0
  ),
  pending_generate_reply_count integer not null default 0 check (
    pending_generate_reply_count >= 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, usage_month)
);

alter table public.ai_usage_monthly enable row level security;

drop policy if exists "Users can view their own AI usage"
  on public.ai_usage_monthly;

create policy "Users can view their own AI usage"
  on public.ai_usage_monthly
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.ai_usage_monthly to authenticated;
revoke all on public.ai_usage_monthly from anon;
revoke insert, update, delete on public.ai_usage_monthly from authenticated;

create or replace function public.reserve_generate_reply_usage(
  p_user_id uuid,
  p_usage_month text,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reserved_id uuid;
begin
  if p_limit <= 0 then
    raise exception 'Generate reply limit must be positive';
  end if;

  insert into public.ai_usage_monthly (
    user_id,
    usage_month,
    pending_generate_reply_count
  )
  values (p_user_id, p_usage_month, 1)
  on conflict (user_id, usage_month) do update set
    pending_generate_reply_count =
      public.ai_usage_monthly.pending_generate_reply_count + 1,
    updated_at = now()
  where
    public.ai_usage_monthly.generate_reply_count +
    public.ai_usage_monthly.pending_generate_reply_count < p_limit
  returning id into reserved_id;

  return reserved_id is not null;
end;
$$;

create or replace function public.confirm_generate_reply_usage(
  p_user_id uuid,
  p_usage_month text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  confirmed_id uuid;
begin
  update public.ai_usage_monthly
  set
    generate_reply_count = generate_reply_count + 1,
    pending_generate_reply_count = pending_generate_reply_count - 1,
    updated_at = now()
  where user_id = p_user_id
    and usage_month = p_usage_month
    and pending_generate_reply_count > 0
  returning id into confirmed_id;

  return confirmed_id is not null;
end;
$$;

create or replace function public.release_generate_reply_usage(
  p_user_id uuid,
  p_usage_month text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  released_id uuid;
begin
  update public.ai_usage_monthly
  set
    pending_generate_reply_count = pending_generate_reply_count - 1,
    updated_at = now()
  where user_id = p_user_id
    and usage_month = p_usage_month
    and pending_generate_reply_count > 0
  returning id into released_id;

  return released_id is not null;
end;
$$;

revoke all on function public.reserve_generate_reply_usage(uuid, text, integer)
  from public, anon, authenticated;
revoke all on function public.confirm_generate_reply_usage(uuid, text)
  from public, anon, authenticated;
revoke all on function public.release_generate_reply_usage(uuid, text)
  from public, anon, authenticated;

grant execute on function public.reserve_generate_reply_usage(uuid, text, integer)
  to service_role;
grant execute on function public.confirm_generate_reply_usage(uuid, text)
  to service_role;
grant execute on function public.release_generate_reply_usage(uuid, text)
  to service_role;
