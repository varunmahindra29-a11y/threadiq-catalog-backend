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

alter table products add column if not exists description text;
alter table products add column if not exists shop_id uuid references shops(id);

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

insert into shops (name, slug, owner_name, owner_whatsapp, tone)
values ('Raj Fashion', 'raj-fashion', 'Raj Fashion Owner', null, 'friendly, confident, local fashion salesman')
on conflict (slug) do update set
  name = excluded.name,
  tone = excluded.tone;

with raj as (
  select id as shop_id from shops where slug = 'raj-fashion'
)
insert into products
  (shop_id, name, description, category, price, stock, sizes, colors, image_url, status, inquiries, orders)
select
  raj.shop_id,
  item.name,
  item.description,
  item.category,
  item.price,
  item.stock,
  item.sizes,
  item.colors,
  item.image_url,
  'active',
  item.inquiries,
  item.orders
from raj,
(values
  (
    'Black Embroidered Party Kurta',
    'Black festive kurta with subtle embroidery, perfect for birthday parties, family functions, and evening events.',
    'Ethnic',
    1499::numeric,
    12,
    array['M','L','XL']::text[],
    array['Black']::text[],
    'https://images.unsplash.com/photo-1614251056216-f748f76cd228?auto=format&fit=crop&w=1200&q=80',
    32,
    8
  ),
  (
    'White Minimal Linen Shirt',
    'Clean white linen-look shirt for smart casual looks, dates, office wear, and summer styling.',
    'Shirts',
    1199::numeric,
    18,
    array['S','M','L','XL']::text[],
    array['White']::text[],
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
    27,
    6
  ),
  (
    'Blue Washed Denim Jacket',
    'Classic blue denim jacket that works over tees, shirts, and kurtas for a bold streetwear layer.',
    'Jackets',
    2499::numeric,
    9,
    array['M','L','XL']::text[],
    array['Blue']::text[],
    'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1200&q=80',
    24,
    5
  ),
  (
    'Rust Festive Kurta Set',
    'Warm rust kurta set for festive days, mehendi functions, and traditional party looks.',
    'Ethnic',
    1799::numeric,
    10,
    array['S','M','L']::text[],
    array['Rust','Orange']::text[],
    'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=80',
    21,
    4
  ),
  (
    'Sage Relaxed Trousers',
    'Relaxed sage trousers with a clean fall, easy to pair with white, black, or printed shirts.',
    'Trousers',
    1399::numeric,
    14,
    array['30','32','34','36']::text[],
    array['Sage','Green']::text[],
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80',
    19,
    3
  ),
  (
    'White Street Sneakers',
    'Minimal white sneakers for everyday outfits, party casual looks, and college styling.',
    'Footwear',
    1999::numeric,
    20,
    array['7','8','9','10']::text[],
    array['White']::text[],
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80',
    30,
    9
  )
) as item(name, description, category, price, stock, sizes, colors, image_url, inquiries, orders)
where not exists (
  select 1 from products p where p.shop_id = raj.shop_id and p.name = item.name
);
