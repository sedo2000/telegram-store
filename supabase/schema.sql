-- =========================================
-- Telegram Store Database
-- =========================================

create extension if not exists "pgcrypto";


-- =========================================
-- Products
-- =========================================

create table if not exists products (
  id uuid primary key default gen_random_uuid(),

  product_key text unique,

  name text not null,

  description text,

  price numeric(12,2) not null default 0,

  image_url text,

  telegram_chat_id bigint,

  telegram_message_id bigint,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- =========================================
-- Prevent duplicate Telegram messages
-- =========================================

create unique index if not exists
products_telegram_message_unique
on products (
  telegram_chat_id,
  telegram_message_id
)
where telegram_chat_id is not null
and telegram_message_id is not null;


-- =========================================
-- Updated timestamp
-- =========================================

create or replace function update_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


drop trigger if exists products_updated_at
on products;


create trigger products_updated_at
before update on products
for each row
execute function update_products_updated_at();


-- =========================================
-- Enable Row Level Security
-- =========================================

alter table products enable row level security;


-- =========================================
-- Public can read products
-- =========================================

drop policy if exists "Public can read products"
on products;

create policy "Public can read products"
on products
for select
using (true);


-- =========================================
-- Temporary development policies
-- =========================================

drop policy if exists "Development insert products"
on products;

create policy "Development insert products"
on products
for insert
with check (true);


drop policy if exists "Development update products"
on products;

create policy "Development update products"
on products
for update
using (true)
with check (true);


drop policy if exists "Development delete products"
on products;

create policy "Development delete products"
on products
for delete
using (true);
