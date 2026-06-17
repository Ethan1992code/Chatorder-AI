create or replace function public.process_creem_webhook(
  p_event_id text,
  p_event_type text,
  p_user_id uuid default null,
  p_plan text default null,
  p_status text default null,
  p_creem_customer_id text default null,
  p_creem_subscription_id text default null,
  p_creem_product_id text default null,
  p_current_period_start timestamptz default null,
  p_current_period_end timestamptz default null,
  p_next_transaction_date timestamptz default null,
  p_cancel_at_period_end boolean default false,
  p_canceled_at timestamptz default null,
  p_last_transaction_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_event_id uuid;
  resolved_user_id uuid := p_user_id;
begin
  insert into public.processed_webhook_events (event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing
  returning id into claimed_event_id;

  if claimed_event_id is null then
    return false;
  end if;

  if p_status is null then
    return true;
  end if;

  if resolved_user_id is null and p_creem_subscription_id is not null then
    select user_id into resolved_user_id
    from public.subscriptions
    where creem_subscription_id = p_creem_subscription_id;
  end if;

  if resolved_user_id is null and p_creem_customer_id is not null then
    select user_id into resolved_user_id
    from public.subscriptions
    where creem_customer_id = p_creem_customer_id
    order by updated_at desc
    limit 1;
  end if;

  if resolved_user_id is null then
    raise exception 'Unable to resolve user for Creem subscription event %', p_event_id;
  end if;

  if p_plan is null and not exists (
    select 1 from public.subscriptions where user_id = resolved_user_id
  ) then
    raise exception 'Unable to resolve plan for Creem subscription event %', p_event_id;
  end if;

  insert into public.subscriptions as existing (
    user_id,
    plan,
    status,
    creem_customer_id,
    creem_subscription_id,
    creem_product_id,
    current_period_start,
    current_period_end,
    next_transaction_date,
    cancel_at_period_end,
    canceled_at,
    last_transaction_id
  )
  values (
    resolved_user_id,
    coalesce(p_plan, 'free'),
    p_status,
    p_creem_customer_id,
    p_creem_subscription_id,
    p_creem_product_id,
    p_current_period_start,
    p_current_period_end,
    p_next_transaction_date,
    p_cancel_at_period_end,
    p_canceled_at,
    p_last_transaction_id
  )
  on conflict (user_id) do update set
    plan = coalesce(p_plan, existing.plan),
    status = case
      when excluded.status = 'active' and existing.status = 'paid'
        then existing.status
      else excluded.status
    end,
    creem_customer_id = coalesce(excluded.creem_customer_id, existing.creem_customer_id),
    creem_subscription_id = coalesce(excluded.creem_subscription_id, existing.creem_subscription_id),
    creem_product_id = coalesce(excluded.creem_product_id, existing.creem_product_id),
    current_period_start = coalesce(excluded.current_period_start, existing.current_period_start),
    current_period_end = coalesce(excluded.current_period_end, existing.current_period_end),
    next_transaction_date = coalesce(excluded.next_transaction_date, existing.next_transaction_date),
    cancel_at_period_end = excluded.cancel_at_period_end,
    canceled_at = case
      when excluded.status in ('active', 'paid') then null
      else coalesce(excluded.canceled_at, existing.canceled_at)
    end,
    last_transaction_id = coalesce(excluded.last_transaction_id, existing.last_transaction_id);

  return true;
end;
$$;

revoke all on function public.process_creem_webhook(
  text, text, uuid, text, text, text, text, text, timestamptz, timestamptz,
  timestamptz, boolean, timestamptz, text
) from public, anon, authenticated;

grant execute on function public.process_creem_webhook(
  text, text, uuid, text, text, text, text, text, timestamptz, timestamptz,
  timestamptz, boolean, timestamptz, text
) to service_role;
