create extension if not exists pgcrypto;

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_name text,
  owner_whatsapp text,
  tone text default 'friendly, confident, helpful',
  created_at timestamptz default now()
);

alter table products
  add column if not exists shop_id uuid references shops(id);

create index if not exists products_shop_id_idx on products(shop_id);
create index if not exists products_status_stock_idx on products(status, stock);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id),
  customer_whatsapp text not null,
  customer_message text not null,
  matched_product_ids uuid[] default '{}',
  status text not null default 'new',
  created_at timestamptz default now()
);

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id),
  customer_whatsapp text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  raw_payload jsonb,
  created_at timestamptz default now()
);
