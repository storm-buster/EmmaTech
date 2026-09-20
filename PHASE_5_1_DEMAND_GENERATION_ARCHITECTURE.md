# Phase 5.1 — Demand Generation Infrastructure & Attribution Architecture

**AUDIT + ARCHITECTURE. No application code changed** (Option A — see §O). This documents what exists
today vs. what is proposed/future. It does **not** build the community bot, add a provider, or invent
demand/traffic data. Optimizes for **qualified demand**, not raw traffic.

Legend: **[IMPLEMENTED]** exists in the repo · **[PARTIAL]** scaffolding only · **[PROPOSED]** recommended next · **[FUTURE]** later phase · **[NOT IMPLEMENTED]**.

## A. Current analytics inventory
- **[PARTIAL] Event abstraction:** `src/analytics/events.ts` — `trackEvent(name, props)` with 5 names (`request_access_click`, `request_access_start`, `request_access_submit`, `private_deployment_view`, `sign_in_click`). It pushes to `window.dataLayer` **if present**, else a dev-only `console.debug` no-op.
- **[NOT IMPLEMENTED] Provider:** `index.html` contains **no** GTM/GA/Plausible/PostHog/Segment script; no `dataLayer` bootstrap. → In production `trackEvent` is a **no-op** (events go nowhere).
- **[NOT IMPLEMENTED]:** UTM parsing (`utm_` = 0), `document.referrer` capture (0), first-party attribution, conversion tracking with attribution, consent handling (0). "cookie" usages = the server `et_session` auth cookie only.
- **Emission reality:** actual `trackEvent()` call sites are only `Navigation.tsx` (`request_access_click`, `sign_in_click`) and `PrivateDeployment.tsx` (`private_deployment_view`). **`request_access_start`/`request_access_submit` are defined but never emitted** (RequestAccessPage does not call `trackEvent`).

**Verdict:** analytics = **PARTIAL** (unwired scaffold). Attribution = **NOT IMPLEMENTED**.

## B. Current conversion-funnel inventory
Funnel = Home → `/rapha` → `/private-deployment` → `/request-access` → `POST /api/access-requests` → `access_requests` table.
- Navigation is measurable in principle (pathname router) but **not measured** (no provider; no `page_view`).
- Request Access is **not measured** client-side (no emission) and, even if it were, carries **no attribution**.
- **Attribution does NOT survive to submission:** `POST /api/access-requests` + `validateAccessRequestInput` accept a fixed field set (name, work_email, org, industry, qualification free-text); **no** source/utm/referrer/landing fields. `access_requests` (migration 0006) stores contact PII + qualification + `status` lifecycle — **no acquisition metadata**.
- **A lead cannot currently be connected to its originating source.**

## C. Attribution model (proposed, first-party, minimal)
Capture four coarse, non-identifying views; attach to the conversion only:
- **FIRST TOUCH** — earliest known source (persist once in `localStorage`, e.g. `et_attr_first`).
- **LAST TOUCH** — most recent source before conversion (per-visit, `sessionStorage` `et_attr_last`).
- **SESSION** — current-session source.
- **CONVERSION** — the source snapshot sent with `request_access_submitted`.
Goal: answer *"How did this organization arrive at EmmaTech?"* with **no unnecessary personal data**, **no cross-site cookies**, **no fingerprinting**. Store only coarse labels (source/medium/campaign/content) + referrer **domain** (not full URL) + landing **path** + timestamps.

## D. UTM convention (examples only — not real campaigns)
`utm_source` (origin), `utm_medium` (channel type), `utm_campaign` (initiative), `utm_content` (variant/opaque id); optional `utm_term`.
| Channel | source | medium | campaign (example) | content (example) |
|---|---|---|---|---|
| Google/search | google | organic/cpc | — | — |
| Reddit | reddit | community | cyber_deception_discussion | `c_<opaque>` |
| Hacker News | hacker_news | community | show_hn_rapha | `c_<opaque>` |
| LinkedIn | linkedin | social | founder_post | li_<opaque> |
| X | x | social | launch_thread | x_<opaque> |
| GitHub | github | referral | readme_link | gh_<opaque> |
| Newsletter | newsletter | email | monthly_2026_xx | nl_<opaque> |
| Founder/community outreach | founder | outreach | direct_reply | o_<opaque> |
| Technical resource | resource | content | evaluate_deception_guide | res_<opaque> |
| Event/campaign | `<real event>` | event | `<real campaign>` | — |
**Rule:** UTM params are **request-time only** — never in canonical URLs, `og:url`, or sitemap URLs (Phase 2 canonical/sitemap must stay clean).

## E. Community attribution model (future bot → website)
`community post → tagged URL (UTM) → EmmaTech → /rapha → /request-access`. The bot mints
`https://www.emmatech.in/<path>?utm_source=reddit&utm_medium=community&utm_campaign=<name>&utm_content=<opaque>`.
The website captures source **without knowing the bot internals**. `utm_content` is an **opaque, non-guessable** internal id (do not expose the internal campaign mapping publicly). Must respect platform rules; no tracking that violates them.

## F. Event taxonomy (minimal; maps onto existing + proposed)
| Event | Purpose | Required props | Optional | Privacy | Emit at |
|---|---|---|---|---|---|
| `page_view` | traffic/landing | `path` | source,medium,campaign | no PII | router (App) |
| `rapha_view` | product interest | `path` | source | no PII | `/rapha` mount |
| `private_deployment_view` *(exists)* | commercial interest | — | source | no PII | `/private-deployment` |
| `resource_view` | content engagement | `slug` | source | no PII | resource mount |
| `security_view` / `docs_view` | trust/docs interest | `path`/`doc_id` | — | no PII | mount |
| `request_access_started` | funnel entry | — | source,landing_path | no PII | RequestAccessPage mount |
| `request_access_submitted` | **conversion** | — | source,medium,campaign,content | **no PII** (coarse only) | on successful submit |
| `request_access_success`/`_error` | outcome | `ok`/`error_code` | — | no PII | after API response |
| `external_link_click` | outbound | `domain` | — | domain only | link handler |
Keep it small; do not add meaningless events. Existing `request_access_click`/`sign_in_click` can remain as CTA-intent events.

## G. Request Access attribution design (conversion)
Associate with `request_access_submitted` and the lead record only: `source`, `medium`, `campaign`, `content`, `landing_path`, `referrer_domain`, `first_touch_at`, `last_touch_at`. **Do NOT** store: passwords, session secrets, API keys, tokens, full referrer URLs, or raw browser history. All fields coarse + optional.

## H. Proposed `access_requests` additions ([PROPOSED] — migration NOT implemented here)
Additive, nullable, no backfill; **migration 0007** (recommended, not run):
```
utm_source       text NULL
utm_medium       text NULL
utm_campaign     text NULL
utm_content      text NULL      -- opaque campaign id (no PII)
referrer_domain  text NULL      -- domain only, never full URL
landing_path     text NULL
first_touch_at   timestamptz NULL
last_touch_at    timestamptz NULL
```
Plus: extend `CreateAccessRequestInput` (types.ts) + `validateAccessRequestInput` (bounded, sanitized, all optional); optional index `access_requests_utm_source_idx` for source rollups. Privacy: coarse acquisition metadata (no new PII beyond a campaign label + referrer domain). **Recommend proposal-first**; implement in the next PR with the privacy-policy update (§J).

## I. First-party persistence strategy ([PROPOSED])
On landing: parse UTM (precedence §9) → derive a coarse source; write `first_touch` once to `localStorage`, update `last_touch`/session in `sessionStorage`. On successful Request Access submit, read the snapshot and include it in the POST body. First-party only; **no cross-site cookies, no fingerprinting, no device IDs**. Compatible with the current SPA (a small `src/analytics/attribution.ts` util + a capture call in the router + form).

## J. Privacy / consent considerations
- Current `PrivacyPolicy.tsx`: discloses only the `et_session` auth cookie and explicitly states **"we do not use advertising or third-party cookies."** No analytics/UTM/attribution/consent disclosure exists.
- **Any** attribution storage (even first-party `localStorage` + lead metadata) would require a **privacy-policy update** and a **legal review** (this audit makes **no legal/compliance determination**). Favor minimal first-party, non-PII data; consider whether a consent mechanism is needed before adding any provider.
- Adding a third-party analytics provider (GA/GTM) would contradict the current "no third-party cookies" statement and requires policy + consent review first.

## K. Demand-source taxonomy
Top level: `ORGANIC_SEARCH`, `COMMUNITY`, `SOCIAL`, `DIRECT`, `REFERRAL`, `CONTENT`, `EVENT`, `OUTBOUND`, `UNKNOWN`. Platform detail: `COMMUNITY/REDDIT`, `COMMUNITY/HACKER_NEWS`, `SOCIAL/LINKEDIN`, `SOCIAL/X`, `REFERRAL/GITHUB`, `CONTENT/EVALUATE_DECEPTION_GUIDE`, `EVENT/<real campaign>`. No fictional campaigns hardcoded.

## L. Funnel measurement model
`DISCOVERY → LANDING → RAPHA INTEREST → PRIVATE-DEPLOYMENT INTEREST → REQUEST ACCESS STARTED → REQUEST ACCESS SUBMITTED → QUALIFIED → BRIEFING → EVALUATION → DEPLOYMENT`.
- Website can measure **only through "SUBMITTED"** (early stages, via events).
- Later stages map **partially** to the existing `access_requests.status` (`submitted / under_review / approved / declined / contacted`) — there is **no** briefing/evaluation/deployment state today; do not invent later-stage data.

## M. Future Community Intelligence Agent interface ([FUTURE])
Platform-agnostic contract: the bot only needs to emit UTM-tagged links (§D/§E). The website's attribution layer consumes UTM/referrer and never depends on the bot's implementation. Internal campaign→`utm_content` mapping stays private/server-side. No bot, scraping, automation, or auto-posting in this phase.

## N. Future internal dashboard requirements ([FUTURE], not built)
Answer: sources → traffic; sources → `/rapha` views; sources → Request Access submissions; resources → conversions; campaigns → qualified demand; communities → meaningful conversations; conversion rate source→access-request. Optimize for qualified demand, not vanity metrics.

## O. Recommended implementation scope
**This PR: Option A — audit-only** (smallest safe useful step). Reasons: no provider connected; the useful unit is the full client→form→API→DB attribution chain, which requires a DB migration (Task 8 says propose-first), touches the critical `/request-access` conversion path, and needs a privacy-policy/legal review — none of which is "obviously safe/minimal."
**Recommended next PR (Phase 5.2, [PROPOSED]) — minimal first-party attribution foundation**, exact files:
- `src/analytics/attribution.ts` (new) — UTM/referrer parse, precedence, first/last-touch persistence (no PII).
- `src/analytics/events.ts` — add `page_view`, `resource_view`, `request_access_started/submitted/success/error` names.
- `src/App.tsx` (router) — capture attribution on navigation; emit `page_view`.
- `src/components/access/RequestAccessPage.tsx` — emit start/submit; include attribution snapshot in the POST.
- `src/auth/*` or the access-request client — pass attribution fields.
- `api/_lib/access-request.ts` + `api/_lib/store/types.ts` + `api/access-requests.ts` — accept/sanitize/store attribution.
- `migrations/0007_access_request_attribution.up/.down.sql` (operator-applied).
- `src/components/PrivacyPolicy.tsx` — disclose first-party attribution.
- Tests: attribution precedence, event emission, Request Access regression, no-PII/disclosure guard.
Provider selection (GA/GTM/Plausible) + consent = a **separate** product/legal decision, not bundled.

## P. Evidence / gaps
- **NOT VERIFIED / gaps:** no analytics provider; no UTM/referrer capture; no backend attribution; `request_access_start/submit` events defined but **not emitted**; conversion currently unmeasured; no consent mechanism; later-stage funnel states beyond `access_requests.status` do not exist. No Search Console integration exists in the repo (Task 16: organic-search/landing/resource/Request-Access correlation is a future connection via the attribution model + GSC export — not imported here).
- No demand/traffic numbers are asserted anywhere (none available).

---
_Audit-only; no application code changed. `main` untouched; this report does not affect the production bundle, routes, or sitemap._
