# ThreadIQ Retail Console

Clean web dashboard for clothing shop owners to list inventory, track WhatsApp AI demand, and preview product recommendations.

## Run

```bash
npm run dev -- --host 127.0.0.1 --port 4174
```

Open:

```text
http://127.0.0.1:4174
```

No install step is required. The app uses a small Node static server and browser-native JavaScript.

## Supabase Setup

Create this table in your Supabase SQL editor:

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  shop_id text not null default 'demo-shop',
  name text not null,
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
```

For a prototype, enable insert/select access for the anon role through Supabase RLS policies. For production, connect users to `shop_id` through auth and keep writes scoped to the owner.

Then add your project credentials in:

```text
src/supabase-config.js
```

```js
export const SUPABASE_URL = "https://your-project.supabase.co";
export const SUPABASE_ANON_KEY = "your-anon-key";
```

The sidebar does not show database settings. Product listings now publish directly to Supabase; if the config or RLS policy is missing, the listing is not saved locally.

## Included

- Analytics dashboard with revenue, conversion, low-stock, demand trend, and category demand.
- Product listing form for name, price, category, stock, size, color, and image URL.
- Listings grid with search and category filters.
- WhatsApp AI match simulator that ranks products by customer query, stock, budget, and demand.
- Supabase-backed product publishing from the listing form.
- WhatsApp AI backend that uses Meta WhatsApp Cloud API, Supabase, and Gemini 2.0 Flash.

## WhatsApp AI Backend

Copy `.env.example` to `.env.local`, then fill in the backend secrets:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Create the extra WhatsApp AI tables with:

```text
supabase-schema.sql
```

Install dependencies once:

```bash
npm install
```

Run the WhatsApp backend:

```bash
npm run backend
```

Meta webhook URLs:

```text
GET/POST http://localhost:8787/webhooks/whatsapp
```

For production, expose the backend through HTTPS and set the same `WHATSAPP_VERIFY_TOKEN` in Meta's webhook setup. The backend matches shop names from the `shops` table, fetches active in-stock products, uses Gemini to write Hinglish salesman captions, sends WhatsApp image messages, and saves leads when customers show buying interest.

## Deploy On Railway

Railway deploys this repo as one Node service. The production start command is:

```bash
npm run start
```

The Railway config is in `railway.json` and uses `/health` as the deploy healthcheck. Railway injects `PORT`; do not set `HOST` in Railway.

Add these Railway variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN
WHATSAPP_VERIFY_TOKEN
GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
```

After Railway gives you a public domain, set Meta WhatsApp webhook callback URL to:

```text
https://your-railway-domain.up.railway.app/webhooks/whatsapp
```

Use the same `WHATSAPP_VERIFY_TOKEN` value in Meta's webhook verification field. Subscribe to the WhatsApp `messages` webhook field.

Troubleshooting URLs:

```text
https://your-railway-domain.up.railway.app/health
https://your-railway-domain.up.railway.app/health/deep
```

`/health/deep` confirms Supabase access without exposing secrets. If it returns `supabase_connection_failed`, check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Railway.
