# EstateIQ Broker Console

EstateIQ is a WhatsApp AI dashboard for real estate brokers. Brokers can publish rent and sale properties, track buyer or tenant requirements, preview AI-ranked matches, and receive high-intent leads for callbacks or site visits.

## Run

```bash
npm run dev -- --host 127.0.0.1 --port 4173
```

Open:

```text
http://127.0.0.1:4173
```

No install step is required after dependencies are present. The local server serves the dashboard, property image uploads, and Supabase-backed property APIs.

Property photos can be selected from your computer in the Add property form. The local dev server saves them into `property-images/` and stores a relative path like `/property-images/listing.jpg` in Supabase.

For WhatsApp image sending, deploy the app/backend to a public HTTPS URL and set:

```text
PUBLIC_BASE_URL=https://your-public-domain.example
```

Meta cannot fetch images from `localhost` or a private Windows folder, so this public base URL is required before uploaded property photos can be sent as WhatsApp image messages.

## Supabase Setup

Run the schema in:

```text
supabase-schema.sql
```

The schema creates:

- `shops` for broker or agency profiles.
- `properties` for rent and sale listings.
- `leads` with `matched_property_ids` and lead intent.
- `whatsapp_messages` for inbound and outbound message history.

For a prototype, enable insert/select access for the anon role through Supabase RLS policies. For production, connect users to `shop_id` through auth and keep writes scoped to the owner.

Then add your project credentials in:

```text
src/supabase-config.js
```

```js
export const SUPABASE_URL = "https://your-project.supabase.co";
export const SUPABASE_ANON_KEY = "your-anon-key";
```

## Included

- Broker dashboard with pipeline value, active properties, site visits, inquiry trend, and locality demand.
- Property listing form for rent/sale type, locality, city, price, BHK, area, furnishing, availability, amenities, and image.
- Properties grid with search, rent/sale filters, edit, pause, and delete actions.
- WhatsApp lead inbox with requirement, matched properties, intent score, visit/callback CTA, and conversation trail.
- AI match simulator that ranks properties by locality, budget, rent/sale intent, BHK, furnishing, and demand.
- WhatsApp AI backend using Meta WhatsApp Cloud API, Supabase, and Gemini.

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
PUBLIC_BASE_URL=https://your-public-domain.example
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

For production, expose the backend through HTTPS and set the same `WHATSAPP_VERIFY_TOKEN` in Meta's webhook setup. The backend matches broker names from `shops`, fetches active properties, uses Gemini to write Hinglish broker captions, sends WhatsApp image messages, and saves leads when customers show callback or site visit intent.

Seed sample properties:

```bash
npm run seed:samples
```

This inserts realistic rent and sale listings into the `properties` table for `EstateIQ Demo Realty`.

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
PUBLIC_BASE_URL
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
