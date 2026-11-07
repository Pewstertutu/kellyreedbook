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

## Discoverability and launch materials

Seven static symptom guides under `public/guides/` contain readable, symptom-specific information without JavaScript. Each has a unique title, description, production canonical URL, social metadata, related-guide links, and a call to action opening the matching interactive flow via `?symptom=...`. Unknown symptom values are ignored. Shared links include the selected symptom only, never answers, notes, or incoming UTM parameters. Native sharing falls back to clipboard copying and then manual text selection.

`public/sitemap.xml` lists the homepage and seven guides. `public/robots.txt` references the sitemap. Submit it through verified Google Search Console and Bing Webmaster Tools accounts after deployment; no verification token is fabricated, and a sitemap does not guarantee indexing. The canonical production origin is `https://kellyreedbook.netlify.app`; update canonical URLs, social tags, sharing scripts, sitemap, QR, and launch copy together if the domain changes. Link-preview caches may need refreshing in the relevant social platform after deployment.

The public `/launch/` page provides downloadable 1200×630 social artwork, its editable SVG, a 640×640 QR image, a one-page printable flyer, post drafts, a short-video script, repair-shop and creator outreach drafts, search and social ad copy, and a fixed-destination UTM link generator. Launch and flyer pages are marked `noindex,follow`; they remain public and contain no private business information. The flyer QR opens the homepage with non-personal campaign labels. Downloads and automatic copying work in supported browsers; the copy fallback selects text for manual copying.

Campaign links contain public UTM labels. Existing anonymous counts do not store these labels or attribute ROI; no advertising pixels or third-party analytics were added. Do not infer unique visitors, sales, or campaign conversion rates from aggregate actions. Source/campaign fields must not contain personal information.

Preparation does not publish posts, send outreach, submit search-engine verification, buy ads, or create advertising accounts. Use the drafts in your own channels, personalize outreach, respect community rules, and choose an explicit ad budget and stop criteria in the ad platform. Obtain a qualified automotive review before broader promotion. No partner endorsement, repair guarantee, professional certification, savings claim, or affiliate eligibility is implied. The proposed first milestone is 100 helpful responses, which are action counts rather than verified unique people or repairs.
