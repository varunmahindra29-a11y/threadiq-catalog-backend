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

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id),
  name text not null,
  description text,
  category text not null,
  price numeric not null,
  stock int not null default 0,
  sizes text[] default '{}',
  colors text[] default '{}',
  image_url text,
  status text not null default 'active',
  inquiries int not null default 0,
  orders int not null default 0,
  created_at timestamptz default now()
);

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

insert into shops (name, slug, owner_name, owner_whatsapp, tone)
values ('Raj Fashion', 'raj-fashion', 'Raj Fashion Owner', null, 'friendly, confident, local fashion salesman')
on conflict (slug) do update set
  name = excluded.name,
  owner_name = excluded.owner_name,
  tone = excluded.tone;
