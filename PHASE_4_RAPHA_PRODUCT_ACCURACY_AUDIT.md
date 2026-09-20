# Phase 4 — RAPHA Product-Accuracy Audit (privacy / data-flow / product claims)

**AUDIT ONLY. No application code changed.** This report verifies whether public RAPHA
privacy/data-flow/product claims accurately describe the implementation. It makes **no legal/regulatory
determination** and does **not** infer backend behaviour from frontend copy.

## A. Scope
The claims remaining public after PR #33: "personal data never leaves the machine", "federated training",
"Federated learning", "privacy by design", and the RBI / DPDP / SEBI capability descriptions on `/compliance`.

## B. Backend availability
**BACKEND EVIDENCE UNAVAILABLE.** The RAPHA backend / detection service / telemetry collector / feature
builder / inference engine / training pipeline is **not present in this workspace** (0 `.py` files; 0
training/inference/telemetry/federated source files; the only sibling directories are website worktrees).
`api/_lib/rapha.ts` is a *client* (`RaphaServiceClient` → `{RAPHA_BASE_URL}/api/v1/service/...`), not the
backend. Therefore data-flow, model-training, and personal-data handling **cannot be verified from
implementation**. Backend-dependent conclusions below are marked **NOT VERIFIED**.

## C. Claim inventory (every occurrence)
| # | Exact wording | File:line | Route | Rendered/indexable? |
|---|---------------|-----------|-------|---------------------|
| 1 | "Per-device baseline + **federated training** means **personal data never leaves** the data fiduciary's machine. **Privacy by design**." | `src/components/ProblemSection.tsx:203` | `/compliance` | **Yes — live, indexable** |
| 2 | "**Federated learning**" (marquee badge) | `src/components/ProblemSection.tsx:218` | `/compliance` | **Yes — live, indexable** |
| 3 | "On-prem **federated training**" (perpetual plan feature) | `src/shared/plans.ts:153` | — | **No** — perpetual is `publiclyVisible:false`, excluded from `PUBLIC_PLANS`, not rendered on any public page; **string still ships in the JS bundle** |
| 4 | RBI: "…capabilities that **align with** the RBI master direction on IT governance for NBFCs." | `ProblemSection.tsx:198` | `/compliance` | Yes (posture wording after PR #33) |
| 5 | DPDP badge "Privacy Act 2023" + card (see #1) | `ProblemSection.tsx:202–203` | `/compliance` | Yes |
| 6 | SEBI: "Tamper-evident SHA-256 hash chains and exportable forensic timelines **support** SEBI's audit-trail mandate…" | `ProblemSection.tsx:208` | `/compliance` | Yes |

## D. Personal-data data-flow analysis
The backend data lifecycle **cannot be traced** (B). However, EmmaTech's **own public content** (source
tier #5/#6) explicitly documents that data crosses the machine boundary:
- `docsContent.tsx:82` — "agents … **stream telemetry to the RAPHA control plane**, and the platform performs detection".
- `docsContent.tsx:99–100` — "The agent collects telemetry from the machine it runs on and **sends it to the control plane**. **Detection is performed server-side in the control plane**; the agent does not make autonomous [decisions]".
- `docsContent.tsx:128–129` — "**Control Plane** — the server side that **ingests telemetry** … **Detection Engine** — **server-side analysis that evaluates telemetry**".
- `docsContent.tsx:241` — "**Streams behavioural telemetry** to your RAPHA tenant for detection and response".
- `SolutionSection.tsx:249` (`/rapha`) — "agents continuously **stream behavioural signals** from each protected node — system, process, and network activity".

So, per EmmaTech's own documentation, **behavioural telemetry (system/process/network activity) leaves the
protected host** and is processed server-side in the control plane. What crosses the boundary (classified
only descriptively, not legally): behavioural telemetry (RAW/DERIVED — exact fields **NOT VERIFIED**),
tenant identifiers (IDENTIFIER — `rapha_tenant_id` exists in the website's org model), and detection
results/alerts (SECURITY EVENT / MODEL OUTPUT). Whether telemetry contains "personal data" is a
classification this audit does not make — but telemetry **does** leave the machine.

## E. Federated-learning verification (Task 5)
**NOT SUBSTANTIATED.** No training pipeline, no multi-node local training, no parameter/gradient exchange,
no aggregation, and no model-update exchange exists in this workspace, and none can be inferred. On the
contrary, EmmaTech's own docs describe a **central** architecture: "Detection is performed server-side in
the control plane" and "model updates **flow from** the central control plane" (`SolutionSection.tsx:297`) —
i.e., **central model distribution**, which Task 5 explicitly states is **not** federated learning by
itself. No occurrence of "federated" is backed by evidence of an actual federated process. Status:
**NOT SUBSTANTIATED / NEEDS BACKEND EVIDENCE.**

## F. Privacy-by-design analysis (Task 6)
As worded, "privacy by design" is justified by two unsubstantiated premises — "federated training" (E:
not substantiated) and "personal data never leaves the machine" (D: contradicted by EmmaTech's own docs).
No data-minimization, retention, or local-only-processing evidence is available (backend unavailable), and
the documented architecture streams telemetry off-host. Therefore the specific claim as written is
**UNSUPPORTED**. The general principle could be **QUALIFIABLE** only with backend evidence of concrete
privacy controls (data minimization, on-device processing scope, retention limits) — none is present here.

## G. RBI analysis (Task 7)
Wording (post-PR #33): "capabilities that align with the RBI master direction on IT governance for NBFCs."
This is **product-capability posture**, not a compliance/attestation claim (good). But the referenced
capabilities (real-time monitoring, incident response, forensic audit trail) are backend features and are
**NOT VERIFIED** here. Distinction holds: *capability relevance* ≠ *RBI compliance*. Status:
**QUALIFIABLE** (wording safe as posture; underlying capability **NOT VERIFIED**). Recommendation: KEEP
wording; obtain backend capability evidence to substantiate, or soften to "relevant to" if unverifiable.

## H. DPDP analysis (Task 8)
- (A) Product/privacy capabilities: "per-device baseline", "federated training", "personal data never leaves
  the machine", "privacy by design" — **all NOT VERIFIED / contradicted** (D, E, F).
- (B) Legal compliance: the badge "Privacy Act 2023" + "Privacy by design" risk implying DPDP-aligned
  personal-data handling. The **absolute** "personal data never leaves the machine" is **UNSAFE / REQUIRES
  QUALIFICATION** — it is inconsistent with EmmaTech's own documented telemetry-streaming architecture.
  This is the highest-priority accuracy issue in this audit.

## I. SEBI analysis (Task 9)
Wording: "Tamper-evident SHA-256 hash chains and exportable forensic timelines support SEBI's audit-trail
mandate." Framed as capability-support (not "SEBI compliant") — acceptable posture. The referenced
capabilities (tamper-evident hash chain, exportable forensic timelines) appear in EmmaTech's public
conceptual model (`/rapha`, docs mention a hash-chained tamper-evident forensic record) but their
**implementation is NOT VERIFIED** (backend). Status: **QUALIFIABLE** (wording safe; capability
NOT VERIFIED). Do not imply formal SEBI compliance.

## J. Claim matrix
| Claim | Wording | Route | Source | Impl. evidence | Test evidence | Data-flow evidence | Status | Recommendation | Reason |
|-------|---------|-------|--------|----------------|---------------|--------------------|--------|----------------|--------|
| Never leaves machine | "personal data never leaves the … machine" | /compliance | ProblemSection.tsx:203 | None (backend N/A) | None | **Contradicted** by own docs (telemetry → control plane) | **UNSUPPORTED / UNSAFE** | **QUALIFY or REMOVE** | Absolute contradicted by documented architecture |
| Federated training | "federated training" | /compliance | ProblemSection.tsx:203 | None | None | Docs show central detection/model distribution | **NOT SUBSTANTIATED** | **REMOVE or QUALIFY** | No federated process evidenced |
| Federated learning | "Federated learning" (marquee) | /compliance | ProblemSection.tsx:218 | None | None | As above | **NOT SUBSTANTIATED** | **REMOVE** | Same |
| Federated training (plan) | "On-prem federated training" | (gated) | plans.ts:153 | None | None | As above | **NOT SUBSTANTIATED** | **REMOVE/QUALIFY** | In bundle though not rendered |
| Privacy by design | "Privacy by design." | /compliance | ProblemSection.tsx:203 | None | None | Premises fail (D,E) | **UNSUPPORTED (as worded)** | **QUALIFY or REMOVE** | Justified by unproven premises |
| RBI alignment | "capabilities that align with the RBI master direction" | /compliance | :198 | NOT VERIFIED | None | n/a | **QUALIFIABLE** | **KEEP** (posture) | Capability relevance, not compliance; capability NOT VERIFIED |
| DPDP privacy | badge "Privacy Act 2023" + card | /compliance | :202–203 | NOT VERIFIED | None | see D | **UNSUPPORTED (card text)** | **QUALIFY** | Card text carries the unsafe claims |
| SEBI support | "…hash chains … support SEBI's audit-trail mandate" | /compliance | :208 | NOT VERIFIED | None | n/a | **QUALIFIABLE** | **KEEP** (posture) | Capability-support wording; capability NOT VERIFIED |

## K. Public / Qualified / Private classification
- **PUBLIC-SAFE (as posture, if kept factual):** RBI "align with", SEBI "support … mandate", naming the regulations.
- **QUALIFIED ONLY (until backend evidence):** the specific data-flow and privacy properties (what stays on-device, retention, minimization), and any precise federated-architecture description.
- **PRIVATE / DO NOT PUBLISH:** proprietary model/training procedure, internal data routing, private datasets, internal infrastructure, customer-specific handling.

## L. Unsupported / unverified claims (summary)
- **UNSUPPORTED / UNSAFE (live):** "personal data never leaves the machine" (contradicted); "privacy by design" as worded.
- **NOT SUBSTANTIATED (live + gated):** "federated training", "Federated learning", "On-prem federated training".
- **NOT VERIFIED (backend unavailable):** RBI/DPDP/SEBI underlying capabilities; whether telemetry contains personal data; retention; data-minimization; the exact federated pipeline (if any).

## M. Recommended corrections (report only — for a future PR, not done here)
1. `/compliance` DPDP card: **remove the absolute** "personal data never leaves the … machine" and the unproven "federated training"; do **not** replace with a new unproven phrase. Prefer accurate wording grounded in the documented architecture (e.g., an on-device agent with telemetry processed within the customer's dedicated RAPHA tenant) — exact wording pending backend/data-flow evidence.
2. `/compliance` marquee: **remove "Federated learning"** (not substantiated).
3. `plans.ts` perpetual: **remove/qualify "On-prem federated training"** (in bundle though gated).
4. Re-examine "Privacy by design" — keep only if backed by concrete, documented controls.
5. Keep RBI/SEBI posture wording; substantiate the referenced capabilities with backend evidence or soften ("relevant to").
6. Resolve a separate **internal inconsistency**: `/rapha` says "Detection and response happen **on the node**" (`SolutionSection.tsx:296`) while `/docs` says "Detection is performed **server-side in the control plane**; the agent does not make autonomous [decisions]" (`docsContent.tsx:100`). These cannot both be the complete picture — reconcile against the actual implementation.

## N. Dead-code / stale-claim findings (Task 13)
- `TeamSection.tsx` and `CustomerSection.tsx` remain **not imported anywhere** (dead, tree-shaken; not in `dist`). `TeamSection` still contains a stale "Isolation Forest" reference (flagged in the Phase 4 evidence audit). No live federated/never-leaves/privacy claims originate from dead code.
- `src_checkpoint/` (stale duplicate tree) is present and outside the build.
- Recommend a separate dead-code cleanup PR (delete `TeamSection`, `CustomerSection`, `src_checkpoint/`); **not** modified here.

## O. Evidence gaps (NOT VERIFIED)
- Backend repository unavailable → no data-flow, telemetry-field, inference, training, retention, or federated evidence.
- No test evidence for any privacy/data-flow/federated claim in this workspace.
- Absence of evidence is **not** proof the features don't exist — these are marked **NOT VERIFIED**, not "false."

## P. Recommended next implementation PR
`phase-4-privacy-dataflow-claim-correction` — a small, accuracy-only correction that removes/qualifies the
unsafe "personal data never leaves the machine" absolute and the unsubstantiated "federated training /
Federated learning" claims on `/compliance` (and the gated `plans.ts` line), preserving legitimate
RBI/DPDP/SEBI posture wording. It should be preceded by (or paired with) backend data-flow confirmation so
any replacement wording is grounded in verified behaviour. Also recommend the dead-code cleanup PR (N).

---
_Audit-only; no application code changed. Current `main` untouched; this report does not affect the production bundle, routes, or sitemap._
