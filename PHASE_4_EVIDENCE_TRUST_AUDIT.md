# Phase 4 — Trust, Authority & Proof: Evidence Audit

**Status: AUDIT-ONLY. No production code changes.** This document inventories exactly what trust/proof
EmmaTech can *publicly substantiate today* from **this repository** (the website + its `/api` layer).

> Scope note: RAPHA's detection/model/performance evidence lives in the **separate RAPHA backend repo**,
> which is not present here (and the Azure backend is currently unavailable). Where evidence is not in this
> repository, it is reported as **absent here**, not inferred from the existence of a capability.

Core principle applied throughout: a public proof point requires a defined metric, a measurement method, a
source, a time period, a scope, and no misleading generalization. No fake metrics were created.

---

## A. Evidence register

| ID | Evidence | Metric / result | Methodology | Dataset / population | Date | Source | Public-safe? | Class | Recommended use |
|----|----------|-----------------|-------------|----------------------|------|--------|--------------|-------|-----------------|
| E1 | Automated test suite (website + API) | **579 passed / 9 skipped** (60 files) | `vitest run` in CI/local | This repo's unit + integration tests | current | `npm test` / `src/**`, `api/**/*.test.ts` | Yes (as "extensive automated tests for the website & API") | **A** | "The website and its API layer are covered by an extensive automated test suite" — NOT a RAPHA reliability claim |
| E2 | Auth/authorization tests | installer endpoint 401/403/200; session, enrollment, api-keys, rate-limit, password, OTP, OAuth tests | Vitest handler tests w/ mocked deps | `api/**/*.test.ts` (session, installer, enrollment, api-keys, ratelimit, oauth…) | current | repo | Yes (as "authN/authZ are tested") | **A** | Support a `/security` statement: access controls are tested |
| E3 | Download-token expiry/tamper tests | expired/tampered/wrong-secret tokens rejected | Vitest unit | `api/_lib/downloadToken.test.ts` | current | repo | Yes (conceptual) | **A** | Support "authorized, expiring downloads" statement |
| E4 | HMAC session + signed download tokens | `createHmac` (×9), `timingSafeEqual` (×10) | Implemented code | `api/_lib/session.ts`, `downloadToken.ts` | current | repo | Yes (conceptual, no secrets) | **A** | Deployment-security / data-control description |
| E5 | Private Blob delivery (Phase 3) | `get(access:'private')`; `BLOB_READ_WRITE_TOKEN` server-only | Implemented code | `api/organization/[action].ts`, `config.ts` | current | repo | Yes (conceptual) | **A** | "Agent package served via authenticated, server-side access" |
| E6 | Structured logging + correlation IDs | JSON logs, `requestId` (×58) | Implemented code | `api/_lib/log.ts` + call sites | current | repo | Yes (conceptual) | **A** | Auditability/observability statement (website/API tier) |
| E7 | Dependency pinning | caret-ranged, explicit devDeps (e.g., `esbuild ^0.25.10`, `@vercel/blob ^2.8.0`) | `package.json` / lockfile | repo | current | repo | Yes | **B** (state as "pinned/managed deps", not "CVE-free") | Secure-software-practices statement |
| E8 | GitGuardian secret scanning | PR check **passing** on all Phase 2–4 PRs | GitHub check (external) | PRs | ongoing | GitHub checks | Yes (as "automated secret scanning in CI") | **A** | Secure-software-practices statement |
| E9 | NVIDIA Inception participation | Program badge shown in footer | N/A (program membership) | `src/assets/nvidia-inception-badge.png`, `Footer.tsx` | already live | repo/site | Yes (if membership is current & badge use permitted) | **A** | External authority / recognition |
| E10 | RAPHA detection validation (200/200, detection rate, precision/recall/F1) | — | — | — | — | **Not in this repo** | n/a | **D** | Do not state publicly; lives in backend repo |
| E11 | Performance / load (req/s, ~250–400/worker, latency) | — | — | — | — | **Not in this repo** | n/a | **D** | Do not state publicly without full context |
| E12 | Trivy / CVE remediation / FastAPI-Starlette updates | — | — | — | — | **Not in this repo** (backend) | n/a | **D** | Backend evidence; not substantiable here |
| E13 | Prometheus/Grafana observability | — | — | — | — | **Not in this repo** (backend) | n/a | **D** | Backend architecture; not substantiable here |
| E14 | Customer / pilot outcomes | — | — | — | — | **None** | n/a | **D** | See §H |

---

## B. Historical claim audit (Task 3)

| Claim | Evidence in repo? | What it establishes | Restore publicly? |
|-------|-------------------|---------------------|-------------------|
| `43%` (attacks target SMEs) | None (unsourced external stat) | Nothing first-party | **No — keep removed** |
| `< 2s` (anomaly→redirect) | None (no perf data here) | Nothing | **No — keep removed** |
| `50+` (features monitored) | None; also classified PRIVATE (feature count) | Nothing public-safe | **No — keep removed** |
| `0 human actions required` | Design/positioning; asserted by a Hero test | Autonomy *positioning*, not a measured metric | **Keep as positioning only** (currently live, reworded "for autonomous response"); do not present as a benchmarked proof point |
| zero-day detection | None (removed Phase 2D) | Nothing (unverifiable guarantee) | **No — keep removed** |
| zero false positives | None | Nothing | **No — keep out** |
| tamper-proof | Product uses a hash chain; wording corrected to **tamper-evident** | Hash-chained, tamper-evident record (design) | **Keep as "tamper-evident"** (accurate); never "tamper-proof" |
| customer / deployment counts | None | Nothing | **No — keep out** (see §H) |

Verified in the current production bundle (`dist/`): `Isolation Forest`, `iptables`, `Cowrie`, `50+`, `<2s`, `43%`, `zero-day`, `tamper-proof`, public Blob host — **all 0**.

## C. RAPHA detection validation evidence (Task 4)
**None present in this repository.** No `normal.csv`/`attack.csv`, no `200/200`, no detection rate, no precision/recall/F1/ROC/confusion matrix, no backtest methodology, no train/test split, no false-positive measurement. This evidence resides in the separate RAPHA backend repo (unavailable). **Nothing about detection accuracy can be honestly stated publicly from this repo.** Even when the backend evidence is available, a single test dataset must not be presented as a general production accuracy claim.

## D. Test / reliability evidence (Task 5)
**E1–E3.** The website + API layer have an extensive automated suite (**579 passing**), including authentication/authorization, token expiry/tamper, data-store, and endpoint tests. This substantiates **"the website and its API are covered by extensive automated tests"** — it does **not** substantiate RAPHA *production reliability* (detection quality, uptime, throughput). The two must not be conflated.

## E. Performance evidence (Task 6)
**None present in this repository** (`req/s` = 0 matches; no load-test harness or results here). The prior engineering finding that "one worker saturates ~250–400 req/s" is **not in this repo** and, regardless, must never become a marketing number without stating exactly what was measured (single worker, hardware, concurrency, payload, file-I/O limits, environment). **Do not publish any performance figure at this time.**

## F. Security evidence (Task 7) — separated by status
- **IMPLEMENTED (in this repo, verifiable):** HMAC-signed HttpOnly sessions (E4); short-lived, scoped, signed download tokens with tested expiry (E3/E4); private-Blob server-side delivery, store credentials never in the browser (E5); structured JSON logging with correlation IDs (E6); tested authN/authZ (E2); dependency pinning (E7); automated secret scanning via GitGuardian on PRs (E8).
- **PLANNED / backend (not substantiable here):** Trivy scans, CVE remediation, FastAPI/Starlette updates, Prometheus/Grafana observability (E12/E13).
- **VERIFIED IN PRODUCTION:** none independently verified in this repo. Note: the private-Blob **production migration is still pending** (backend unavailable), so private agent delivery is code-complete but not yet production-verified.
- **Do not** claim certifications or compliance (SOC 2, ISO, etc.) — no evidence exists; security controls existing ≠ certified.

## G. External authority evidence (Task 8)
- **NVIDIA Inception (E9):** badge + "Inception Program" footer section already live. Public-safe **if** membership is current and badge usage terms are met — recommend confirming both before relying on it further. Exact supported wording: *"EmmaTech is a member of the NVIDIA Inception program."* Nothing stronger (no NVIDIA endorsement/partnership implied).
- No awards, hackathon selections, publications, conference talks, or independent media mentions found in the repo. **Do not fabricate logos/endorsements.**

## H. Customer / pilot proof status (Task 9)
**No public customer proof currently substantiated.** References to "design partners," "pilot customers," and "the first pilot" appear only in **recruiting copy** (`src/data/careersData.ts`) and **dead/unrendered** components (`TeamSection.tsx`: *"Next: … the first pilot"* — i.e., not yet occurred). There are no testimonials, case studies, named customers, deployment counts, or measured customer outcomes. **Do not create placeholder customer proof.**

## I. Public / Qualified / Private proof matrix (Task 11)
- **PUBLIC (safe now):** the automated-testing fact (framed as website/API coverage), the implemented security-control descriptions (E2–E8, conceptual), NVIDIA Inception membership (E9), and the already-published conceptual RAPHA workflow (Detect→Decide→Redirect→Observe→Preserve).
- **QUALIFIED (private briefing):** RAPHA detection benchmark results + methodology, deployment/evaluation results, performance/load numbers with full context, technical evaluation results — **once available from the backend and reviewed**.
- **PRIVATE (never public):** customer identities without written permission, sensitive attack datasets, internal architecture, private infrastructure/URLs, proprietary model details (e.g., the algorithm name, features, thresholds), confidential evaluation material.

## J. Recommended first public trust asset (Task 12)
**Recommendation: a modest `/security` page** (not `/trust`, not a RAPHA validation page yet).
- **Why:** the only evidence class that is currently **A — publication-ready** and public-safe is the **security & software-practice** posture (E2–E8) plus the NVIDIA Inception fact. A `/security` page can be built entirely from verified, conceptual facts without any detection/performance/customer claims.
- **What supports it:** tested authN/authZ, session/token model, private-Blob server-side delivery, structured logging/auditability (website/API tier), dependency pinning, automated secret scanning, and a **responsible-disclosure / security-contact** statement (`avinash@emmatech.in` already public).
- **What remains missing (so do NOT build a RAPHA validation/proof page yet):** all detection metrics (C), all performance numbers (E), production verification (F), and any customer proof (H).
- Defer `/trust` (broad authority), any benchmark/validation page, and case studies until backend evidence exists and is reviewed. This audit does **not** create `/security` — it establishes that it is the first defensible candidate.

## K. Exact evidence gaps
1. RAPHA detection accuracy (dataset, methodology, precision/recall/F1, FP rate) — **not in this repo**.
2. Performance/load numbers **with measurement context** — **not in this repo**.
3. Independent/production verification of security controls; Trivy/CVE/observability evidence — **backend/not here**.
4. Any customer/pilot outcome — **none**.
5. Confirmation that NVIDIA Inception membership is current and badge usage is permitted.
6. Production verification of the pending private-Blob migration (backend unavailable).

## L. Low-risk implementation made
**None in this PR** (audit-only). One hygiene item is **reported for a separate follow-up, not implemented here**: the dead, unrendered components `TeamSection.tsx` and `CustomerSection.tsx` (and the stale `src_checkpoint/` directory) still contain a private term ("Isolation Forest") and stale status text. They are **tree-shaken and not shipped** (verified: `dist/` contains 0 occurrences), so they are not a live exposure — but deleting them would reduce future accidental-exposure surface. Recommended as a small dead-code-cleanup PR, kept out of this evidence audit to preserve focus.

---

### Tests
Audit-only; no production code changes. For reference, the current tree passes: `tsc -b` 0 errors · Vitest **579 passed / 9 skipped / 0 failed** · `npm run build` success (19 prerendered routes + 17-URL sitemap) · lint 7 errors / 4 warnings (pre-existing baseline). Adding this Markdown report does not affect the build, bundle, routes, or sitemap.
