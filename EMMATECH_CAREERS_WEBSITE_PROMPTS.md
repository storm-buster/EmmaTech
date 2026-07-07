# EmmaTech — Careers Page: Website Update Prompt Pack

Copy-paste prompts to add a **Careers / Join Us** page to **emmatech.in**. Works with an
AI site builder (v0, Lovable, Bolt, Cursor), a developer brief, or a CMS (Webflow/
WordPress). Fill every `[FILL IN]` before using — those are decisions only you can make.

**How to use:**
1. Paste **§1 (Company Context)** first so the tool has consistent brand/voice.
2. Paste **§2 (Master Page Prompt)** to generate the page shell.
3. Paste the **§4 role blocks** you want to list (they're both content and prompts).
4. Use **§5** to wire nav/footer/homepage and the application flow.

---

## 0. Decisions to fill in first
- **Location model:** `[FILL IN — e.g. Remote (India) / Hybrid Bengaluru / On-site]`
- **Work auth / timezone overlap:** `[FILL IN — e.g. IST ±3h]`
- **Comp philosophy:** `[FILL IN — e.g. "below-market cash + meaningful founding equity (0.5%–3%)"]`
- **How to apply:** `[FILL IN — email avinash@emmatech.in / Google Form / Ashby / Lever]`
- **Start date / urgency:** `[FILL IN]`

---

## 1. Company Context (paste this into the tool first)

> You are helping build the Careers page for **EmmaTech** (emmatech.in), an early-stage
> deep-tech cybersecurity startup. Our product, **RAPHA**, is an autonomous cyber-defense
> and threat-detection platform: it ingests network/host telemetry, scores it with ML +
> rule-based detection, and delivers real-time, forensic-grade alerts to security teams —
> currently as a multi-tenant, detect-and-alert SaaS in pilot with design partners.
>
> Stage: pre-seed / founding team formation. Voice: **confident, technical, mission-driven,
> no fluff** — we speak to serious engineers and security people, not to buzzword-chasers.
> Aesthetic: modern security/deep-tech — dark theme, sharp typography, subtle motion,
> trustworthy. Values: **rigor, ownership, speed, defensive integrity, low ego.**
> Audience for this page: senior engineers, ML/security researchers, and founding-level
> operators who want outsized impact and equity, not a cushy corporate role.

---

## 2. Master Page Prompt — build the Careers page

> Create a **Careers page at `/careers`** for emmatech.in matching our existing site's
> theme and navigation. Sections, in order:
> 1. **Hero** — headline "Build the future of autonomous cyber-defense," one-line
>    sub-hook, and two CTAs: "View open roles" (scrolls to list) and "Don't see your role?"
>    (opens general application).
> 2. **Why EmmaTech / Mission** — 3–4 short cards: the problem (threats move faster than
>    human defenders), our approach (autonomous detection + forensic integrity), the
>    opportunity (founding-team equity, real ownership), and how we work (small, senior,
>    high-trust, ship fast).
> 3. **What it's like to join at the founding stage** — honest paragraph on equity,
>    ambiguity, breadth of impact, and direct work with the founder.
> 4. **Open Roles** — a filterable list grouped by **Engineering & ML**, **Security
>    Research**, **Product & Design**, **Go-to-Market**, and **Founding / Operations**.
>    Each role is a card (title, type, location, 1-line summary) linking to a detail view
>    or expanding inline.
> 5. **Our values** — the 5 values from the context block as concise items.
> 6. **Benefits / What we offer** — founding equity, flexible/remote work `[FILL IN]`,
>    top-tier hardware, learning budget, direct impact, `[FILL IN others]`.
> 7. **General application CTA** — "We're always looking for exceptional people. Pitch us."
> 8. **Application section** — per §5 (form or email).
>
> Requirements: responsive, accessible (semantic headings, keyboard-navigable, good
> contrast on the dark theme), SEO meta title "Careers — EmmaTech" and description
> "Join EmmaTech and help build RAPHA, an autonomous cyber-defense platform. Founding-team
> roles in ML, security research, engineering, product, and go-to-market." Reuse existing
> header/footer components. Keep copy tight; no lorem ipsum.

---

## 3. Reusable component prompts

**Role card component**
> Create a reusable `RoleCard` component: role title, employment type badge (Full-time /
> Contract / Internship), location badge, department tag, a one-line summary, and an
> "Apply" / "Learn more" button. On click, expand to show the full description or route to
> `/careers/[role-slug]`. Match the dark deep-tech theme.

**Role detail template**
> Create a role detail layout with: title + tags, "About the role," "What you'll do,"
> "What we're looking for," "Bonus points," "Why this role matters," and an "Apply for this
> role" CTA that prefills the role name in the application form.

---

## 4. Open Roles (ready-to-use content — paste the ones you want)

> For each role below: render it as a `RoleCard` and a role detail page. Keep the copy as
> written; only adjust `[FILL IN]` fields. Location/type default to the §0 values unless
> noted.

### 4.1 Founding Engineer (Full-Stack / Platform) — Engineering & ML
- **Type:** Full-time · Founding · **Location:** `[FILL IN]`
- **Summary:** Own large parts of the RAPHA platform end-to-end, from API to infra.
- **What you'll do:** Build and scale the multi-tenant control plane (Python/FastAPI),
  data pipelines, and the customer-facing console; make architecture decisions that stick;
  ship to real design partners weekly.
- **Looking for:** 4+ yrs building production backend/full-stack systems; strong Python;
  comfort with APIs, databases, Docker, and cloud; thrive with ambiguity and ownership.
- **Bonus:** SaaS multi-tenancy, security products, FastAPI, React/Next, distributed systems.
- **Why it matters:** You'll be employee #`[FILL IN]` — your code and decisions define the product.

### 4.2 Senior ML Engineer — Threat Detection — Engineering & ML
- **Type:** Full-time · **Location:** `[FILL IN]`
- **Summary:** Own the detection models at the heart of RAPHA.
- **What you'll do:** Design, train, and productionize models for network/host anomaly and
  attack detection; build the feature pipeline (flow/telemetry → features); set up
  evaluation, drift monitoring, and retraining; push the boundary beyond today's RF/XGB
  ensemble.
- **Looking for:** 4+ yrs applied ML in production; strong feature engineering and model
  evaluation; Python/scikit-learn/XGBoost or deep learning; ability to reason about
  false-positive/false-negative trade-offs in an adversarial setting.
- **Bonus:** Cybersecurity/anomaly detection, streaming/online learning, MLOps, imbalanced
  data, sequence models.
- **Why it matters:** Detection quality *is* the product. You own it.

### 4.3 Security Detection Engineer / Threat Researcher — Security Research
- **Type:** Full-time · **Location:** `[FILL IN]`
- **Summary:** Turn attacker behavior into detections RAPHA can act on.
- **What you'll do:** Research attack techniques (MITRE ATT&CK), author and tune detection
  logic and rules, build attack simulations to red-team our own models, and reduce false
  positives from the field.
- **Looking for:** Hands-on offensive or detection-engineering experience; deep networking/
  host telemetry knowledge; scripting (Python); an adversarial, break-it mindset.
- **Bonus:** Zeek/Suricata, threat intel, malware/traffic analysis, CTF background.

### 4.4 Backend / Platform Engineer (Scale) — Engineering & ML
- **Type:** Full-time · **Location:** `[FILL IN]`
- **Summary:** Take the control plane from single-instance pilot to scalable multi-tenant SaaS.
- **What you'll do:** Introduce Postgres/Redis, harden multi-tenancy and auth, add
  observability, and design for horizontal scale and reliability.
- **Looking for:** Strong backend fundamentals; APIs, relational DBs, caching, queues;
  security-conscious engineering; Python.
- **Bonus:** K8s, event streaming (Kafka), zero-trust/mTLS, SOC2 experience.

### 4.5 Data Engineer — Telemetry & ML Data — Engineering & ML
- **Type:** Full-time · **Location:** `[FILL IN]`
- **Summary:** Build the pipelines that turn raw telemetry into training-ready data.
- **What you'll do:** Own ingestion, the Parquet/lakehouse dataset, labeling workflows, and
  feature stores; ensure data quality and lineage for model training.
- **Looking for:** Data pipeline experience; Python, pandas/PyArrow, SQL; batch + streaming.
- **Bonus:** Feature stores, dbt/Spark, security/network data.

### 4.6 DevSecOps / SRE / Cloud Infrastructure Engineer — Engineering & ML
- **Type:** Full-time · **Location:** `[FILL IN]`
- **Summary:** Own how RAPHA is deployed, observed, and secured.
- **What you'll do:** Build CI/CD, containerized deploys, monitoring/alerting, secrets
  management, and the security posture of our own infrastructure.
- **Looking for:** Docker + one major cloud; IaC (Terraform); CI/CD; a security-first
  instinct.
- **Bonus:** K8s, SOC2/ISO groundwork, hardening, on-call design.

### 4.7 Frontend Engineer — Product Console — Product & Design
- **Type:** Full-time · **Location:** `[FILL IN]`
- **Summary:** Build the dashboard security teams live in.
- **What you'll do:** Create the tenant console — alerts, forensic timelines, policy and
  key management — with clarity and speed.
- **Looking for:** Strong React/Next + TypeScript; data-dense UI; taste for clean UX.
- **Bonus:** Data viz, real-time UIs, design-system work.

### 4.8 Founding Product Manager / Product Lead — Product & Design
- **Type:** Full-time · Founding · **Location:** `[FILL IN]`
- **Summary:** Own what we build and why, working directly with design partners.
- **What you'll do:** Run discovery with pilot customers, shape the roadmap, write crisp
  specs, and close the loop between detection quality and customer value.
- **Looking for:** PM experience in technical/B2B/security or dev-tools products; strong
  written communication; comfort talking to engineers and CISOs alike.

### 4.9 Founding Designer (Product + Brand) — Product & Design
- **Type:** Full-time · Founding · **Location:** `[FILL IN]`
- **Summary:** Define how EmmaTech looks and how RAPHA feels to use.
- **What you'll do:** Own product UX and the brand/marketing surface (site, decks, docs).
- **Looking for:** Strong product design portfolio; systems thinking; can go zero-to-one.
- **Bonus:** Dev-tool/security product design, motion, front-end literacy.

### 4.10 Founding GTM — Sales & Business Development — Go-to-Market
- **Type:** Full-time · Founding · **Location:** `[FILL IN]`
- **Summary:** Land design partners and turn pilots into paying customers.
- **What you'll do:** Own outbound, pilot conversations, and early deals; build the sales
  motion from scratch; feed customer signal back to product.
- **Looking for:** B2B/security/SaaS sales or founding-GTM experience; technical enough to
  earn a security team's trust; hunter mentality.

### 4.11 Solutions / Sales Engineer / DevRel — Go-to-Market
- **Type:** Full-time · **Location:** `[FILL IN]`
- **Summary:** Get customers integrated and successful, fast.
- **What you'll do:** Run technical onboarding, help customers wire telemetry into RAPHA
  and alerts into their SIEM/Slack, write docs and sample integrations, be the bridge
  between customers and engineering.
- **Looking for:** Technical customer-facing experience; APIs/scripting; clear communicator.
- **Bonus:** SIEM/SOAR ecosystems, log pipelines (Vector/Fluent Bit), security background.

### 4.12 Growth & Marketing Lead — Go-to-Market
- **Type:** Full-time · **Location:** `[FILL IN]`
- **Summary:** Tell the EmmaTech story and build the top of the funnel.
- **What you'll do:** Positioning, content, launches, and demand gen for a technical
  security audience.
- **Looking for:** B2B/dev-tool/security marketing; strong writing; data-driven.

### 4.13 Founding Operations / Chief of Staff — Founding / Operations
- **Type:** Full-time · Founding · **Location:** `[FILL IN]`
- **Summary:** Make the company run so the team can build.
- **What you'll do:** Operations, hiring ops, finance/legal coordination, and whatever else
  unblocks the founder.
- **Looking for:** High agency, generalist, extreme organization; startup/ops experience.

### 4.14 Early-Career / Internships (ML & Security) — Founding / Operations
- **Type:** Internship / New-grad · **Location:** `[FILL IN]`
- **Summary:** Learn fast, ship real work in ML or security research.
- **What you'll do:** Contribute to detection models, data pipelines, attack simulation, or
  the platform under senior mentorship.
- **Looking for:** Strong CS/ML/security fundamentals; a portfolio, projects, or CTF/Kaggle
  track record; hunger to learn.

### 4.15 Advisors — Security & GTM (part-time) — Founding / Operations
- **Type:** Advisory · **Location:** Remote
- **Summary:** Seasoned CISOs, security founders, and GTM leaders to steer us.
- **What you'll do:** Periodic guidance, intros, and pressure-testing — for equity.
- **Looking for:** Track record in cybersecurity, enterprise security buying, or scaling
  deep-tech startups.

---

## 5. Wiring it up

**Navigation + footer**
> Add "Careers" to the primary nav and footer of emmatech.in, linking to `/careers`. If
> there's a jobs count, show it (e.g. "Careers (12)").

**Homepage teaser**
> Add a short "We're hiring" band near the footer of the homepage: one line + "Join the
> founding team →" linking to `/careers`.

**Application flow** (pick per §0)
> Add an application section on each role and a general one. `[FILL IN one:]`
> - Simple: a "mailto:avinash@emmatech.in" button with the role name in the subject.
> - Form: name, email, role (prefilled), links (LinkedIn/GitHub/portfolio), short "why
>   EmmaTech" text, resume upload → submit to `[FILL IN backend / Google Form / Ashby]`.
> Include a confirmation state and a note on expected response time.

**SEO / sharing**
> Add per-page meta and Open Graph tags for `/careers` and each role page (title, desc,
> and a branded OG image), so shared job links preview well on LinkedIn/X.

---

## 6. Optional polish prompts
- "Add a subtle animated background (network graph / particle mesh) to the Careers hero,
  performance-budget-conscious, that respects `prefers-reduced-motion`."
- "Add a short founder note ('Why I started EmmaTech') above the roles — `[FILL IN text]`."
- "Add a diversity/equal-opportunity statement in the footer of the Careers page."
- "Add a 'Life at EmmaTech' strip with 3–4 photos or illustrations — `[FILL IN assets]`."
