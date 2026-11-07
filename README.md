# CoBuy demo

AI purchasing agent for independent restaurants. Hackathon stage prototype following Rose Tea Cafe (Oakland, Pittsburgh). All data is illustrative.

## Run

```bash
npm install
cp .env.example .env.local     # then paste your OpenRouter key into .env.local
npm run dev                    # http://localhost:3000
```

Check that both AI routes and their fallbacks work (with the dev server running):

```bash
npm run check:api
```

## Demo flow

1. **Invoices** (`/invoices`): upload `public/sample-invoice.png`. Line items are extracted by a vision model and appear one by one, then the "CoBuy noticed…" card appears.
2. **Matches** (`/matches`): 5 restaurants, 4 names for the same fryer oil, with the AI's reason for each match and the look-alikes it rejected.
3. **Group offer** (`/offer`): click **Join**. The pool goes from 34 to 42 jugs and unlocks the 9% tier.
4. **Overview** (`/overview`): three months later.
5. **Supplier view** (`/supplier`): pooled demand as a wholesaler sees it.

The printable invoice lives at `/sample-invoice` (regenerate the PNG with the script in `scripts/`).

## Presenter controls (bottom of the sidebar)

- **Use cached AI**: skips the network and returns saved known-good responses after about 1.5 s, so it still looks live. Turn this on if the Wi-Fi is bad.
- **Reset demo**: clears everything back to step 1.

Even with the toggle off, any AI failure (no key, timeout over 12 s, bad JSON, a wrong fryer-oil match) automatically falls back to the cached response. Every number on stage comes from `/data`, not from the model.

## Config

| Env var | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | Server-side only; never sent to the browser |
| `EXTRACT_MODEL` | OpenRouter model id for invoice reading (must support images) |
| `MATCH_MODEL` | OpenRouter model id for product matching |

## Layout

- `data/`: seed data (invoice, catalog, neighbors, offers, dashboard, supplier) and `cached/` AI responses
- `lib/`: types and zod schemas, offer math, demo state store, OpenRouter client
- `app/api/extract`, `app/api/match`: AI routes with cache fallback
- `app/(app)/*`: the five demo screens
