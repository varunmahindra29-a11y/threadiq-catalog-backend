create extension if not exists pgcrypto;

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_name text,
  owner_whatsapp text,
  tone text default 'friendly, practical, trusted real estate broker',
  created_at timestamptz default now()
);

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id),
  title text not null,
  description text,
  listing_type text not null check (listing_type in ('rent', 'sale')),
  property_type text not null default 'Apartment',
  locality text not null,
  city text not null,
  price numeric not null,
  bhk numeric not null default 0,
  area_sqft numeric not null default 0,
  furnishing text,
  availability text,
  amenities text[] default '{}',
  image_url text,
  status text not null default 'active',
  inquiries int not null default 0,
  visits int not null default 0,
  created_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id),
  customer_whatsapp text not null,
  customer_message text not null,
  matched_property_ids uuid[] default '{}',
  intent text default 'site_visit',
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
values ('EstateIQ Demo Realty', 'estateiq-demo-realty', 'EstateIQ Broker', null, 'friendly, practical, trusted real estate broker')
on conflict (slug) do update set
  name = excluded.name,
  owner_name = excluded.owner_name,
  tone = excluded.tone;
