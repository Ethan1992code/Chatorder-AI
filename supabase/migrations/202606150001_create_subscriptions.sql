create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null default 'free' check (
    plan in ('free', 'pro_monthly', 'pro_yearly', 'business')
  ),
  status text not null default 'free' check (
    status in (
      'free',
      'active',
      'paid',
      'trialing',
      'scheduled_cancel',
      'canceled',
      'past_due',
      'expired',
      'paused'
    )
  ),
  creem_customer_id text,
  creem_subscription_id text,
  creem_product_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_transaction_date timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  last_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (creem_subscription_id)
);

create index if not exists subscriptions_creem_customer_id_idx
  on public.subscriptions (creem_customer_id);

create table if not exists public.processed_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.set_subscription_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.set_subscription_updated_at();

alter table public.subscriptions enable row level security;
alter table public.processed_webhook_events enable row level security;

drop policy if exists "Users can view their own subscription"
  on public.subscriptions;

create policy "Users can view their own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.subscriptions to authenticated;
revoke all on public.subscriptions from anon;
revoke insert, update, delete on public.subscriptions from authenticated;
revoke all on public.processed_webhook_events from anon, authenticated;
