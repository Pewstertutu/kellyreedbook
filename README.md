# NoStartPro

A static roadside guide with conservative symptom checks and optional anonymous usage counts. Netlify publishes only `public/`; the functions and database schema are not public downloads. The old `/autodiag` and `/autodiag.html` routes redirect to the homepage.

## Content and commercial links

The guide is educational and has not been verified as reviewed by a qualified technician. It excludes high-voltage EV/hybrid work and hazardous diagnostic procedures. Obtain an automotive professional’s review before presenting it as professionally reviewed. Update the content date only when the content changes.

The Amazon selection uses the owner-provided https://link.amazon/B0d0Xe9hZ URL. Specific tool examples link to Amazon searches so visitors can verify the exact model, price, and compatibility. These search URLs do not carry an unverified Associates ID. Affiliate eligibility and commissions cannot be verified from the code. The disclosure remains visible. No donation or contact destination was supplied, so neither is fabricated or shown.

## Usage measurement

Counts are off by default, require the visitor’s explicit opt-in, and respect Do Not Track. The preference lasts for the current page visit and is not stored. Events are aggregated by UTC day, event, and symptom in Netlify Database. The application does not persist visitor identifiers, IP addresses, free text, or vehicle details. The platform may process request metadata for hosting and rate limiting. The API accepts only known dimensions, rejects extra fields, limits payload size, checks Origin, and limits requests by IP/domain. Counts reflect actions, not unique people or confirmed repairs; repeat actions, forged requests, and ad blockers can affect them. Amazon clicks do not establish a purchase or attributed commission.

Netlify applies the migration during deployment. The live database flow must be checked after deployment; local UI tests mock count responses and do not apply migrations.

There is deliberately no public analytics endpoint. To review totals as an authorized project owner:

```sh
netlify db connect --query "SELECT day, event, symptom, count FROM usage_counts ORDER BY day DESC, event, symptom LIMIT 250"
```

Compare `symptom_selected`, `check_completed`, `flow_completed`, `helpful`, `not_helpful`, and `amazon_click` counts. `unselected` applies only to Amazon clicks before a symptom is chosen. Helpfulness means the user found a next step; it does not mean the vehicle was repaired. Do not treat flow counts as unique-visitor conversion rates.

## Validation

```sh
npm install
npx playwright install chromium
npm test
npm run typecheck
```

Tests cover all diagnostic paths, invalid analytics payloads, mobile layout, focus, consent, back/restart, and graceful analytics failure. Browser tests serve static files through Playwright request routing without starting a development server. No build step is needed. For later schema changes, update `db/schema.ts` and generate a named migration with Drizzle Kit; Netlify applies it on deploy.
