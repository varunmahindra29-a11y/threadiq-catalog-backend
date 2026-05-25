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

insert into shops (name, slug, owner_name, owner_whatsapp, tone)
values ('EstateIQ Demo Realty', 'estateiq-demo-realty', 'EstateIQ Broker', null, 'friendly, practical, trusted real estate broker')
on conflict (slug) do update set
  name = excluded.name,
  owner_name = excluded.owner_name,
  tone = excluded.tone;

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

create index if not exists properties_shop_id_idx on properties(shop_id);
create index if not exists properties_status_type_idx on properties(status, listing_type);
create index if not exists properties_location_idx on properties(city, locality);

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

alter table leads add column if not exists matched_property_ids uuid[] default '{}';
alter table leads add column if not exists intent text default 'site_visit';

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id),
  customer_whatsapp text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  raw_payload jsonb,
  created_at timestamptz default now()
);

delete from properties
where title in (
  'Furnished 2BHK near Andheri West Metro',
  'Lake-view 3BHK in Powai',
  'Ready 2BHK in Sector 76 Noida',
  'Modern 1BHK in Golf Course Extension',
  '4BHK villa near Whitefield',
  'Compact studio in Bandra West'
);

insert into properties
  (shop_id, title, description, listing_type, property_type, locality, city, price, bhk, area_sqft, furnishing, availability, amenities, image_url, status, inquiries, visits)
select
  shops.id,
  sample.title,
  sample.description,
  sample.listing_type,
  sample.property_type,
  sample.locality,
  sample.city,
  sample.price,
  sample.bhk,
  sample.area_sqft,
  sample.furnishing,
  sample.availability,
  sample.amenities,
  sample.image_url,
  'active',
  sample.inquiries,
  sample.visits
from shops
cross join (
  values
    (
      'Furnished 2BHK near Andheri West Metro',
      'Move-in ready apartment in a gated society with parking, lift, security, and quick metro access.',
      'rent',
      'Apartment',
      'Andheri West',
      'Mumbai',
      48000::numeric,
      2::numeric,
      780::numeric,
      'Furnished',
      'Immediate',
      array['Parking','Lift','Security','Metro nearby']::text[],
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      34,
      9
    ),
    (
      'Lake-view 3BHK in Powai',
      'Premium resale apartment with balcony, clubhouse access, and two covered parking slots.',
      'sale',
      'Apartment',
      'Powai',
      'Mumbai',
      28500000::numeric,
      3::numeric,
      1280::numeric,
      'Semi-furnished',
      'Ready to move',
      array['Clubhouse','Balcony','Parking','Lake view']::text[],
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      28,
      6
    ),
    (
      'Ready 2BHK in Sector 76 Noida',
      'Compact family apartment in a maintained society with park, power backup, and covered parking.',
      'sale',
      'Apartment',
      'Sector 76',
      'Noida',
      8200000::numeric,
      2::numeric,
      1045::numeric,
      'Unfurnished',
      'Ready to move',
      array['Park','Power backup','Parking','Security']::text[],
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80',
      22,
      5
    ),
    (
      'Modern 1BHK in Golf Course Extension',
      'Bright rental apartment ideal for professionals, with gym, lift, security, and fast office access.',
      'rent',
      'Apartment',
      'Golf Course Extension',
      'Gurugram',
      32000::numeric,
      1::numeric,
      610::numeric,
      'Semi-furnished',
      'From next month',
      array['Gym','Lift','Security','Power backup']::text[],
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      26,
      7
    ),
    (
      '4BHK villa near Whitefield',
      'Independent villa with private garden, servant room, two car parks, and quiet gated community access.',
      'sale',
      'Villa',
      'Whitefield',
      'Bengaluru',
      36000000::numeric,
      4::numeric,
      2650::numeric,
      'Semi-furnished',
      'Ready to move',
      array['Private garden','Gated community','Parking','Servant room']::text[],
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
      17,
      4
    ),
    (
      'Compact studio in Bandra West',
      'Well-located studio for single occupancy with furnished setup and quick access to cafes and offices.',
      'rent',
      'Studio',
      'Bandra West',
      'Mumbai',
      42000::numeric,
      0::numeric,
      410::numeric,
      'Furnished',
      'Immediate',
      array['Furnished','Security','Prime location']::text[],
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
      31,
      8
    )
) as sample(title, description, listing_type, property_type, locality, city, price, bhk, area_sqft, furnishing, availability, amenities, image_url, inquiries, visits)
where shops.slug = 'estateiq-demo-realty';
