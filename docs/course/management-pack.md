# QueueLess — Management Pack

**Student:** Farah Abdisamad (Abdisamed Mohamed Farah)  
**Project:** QueueLess — Digital Campus Queue  
**Course:** BIC2263 Software Project Management  
**Tracker end date:** 31/10/26  
**Live app:** https://thequeueless.pages.dev  
**Live API:** https://queueless.zamdevio.workers.dev  
**Repo:** https://github.com/zamdevio/queueless  

**How to submit:** Copy this file into a new Google Doc (or paste section by section into the lecturer template). Delete this preamble and the “Evidence” appendix if the lecturer wants template-only content. Keep the seven numbered sections in order.

**Evidence rule:** numbers below come from the live product, `maintainer/shipped/README.md`, and health gates — no invented metrics.

---

## 1. Project Charter & Overview

*This section corresponds to the INITIATION phase of the SDLC and defines the project foundation.*

### Project Objective

QueueLess is a lightweight digital queue management web app that replaces uncertain physical waiting: customers join from a phone, receive a ticket number, watch position / now-serving / ETA, and get called — while staff run a PIN-protected operator dashboard on a free-tier Cloudflare stack (Workers + Durable Objects + Pages, no external database).

| Category | Definition |
|----------|------------|
| **Primary Goal** | Deliver a working MVP where a visitor can join a campus/service queue in under a minute and an operator can call the next customer without paper lists or shared spreadsheets. |
| **Target Users** | (1) Customers/visitors at counters — campus services, clinic desks, small retail/food pickup. (2) Operators/staff running the live queue at the service point. |
| **Key Deliverables** | 1) Customer SPA (join → ticket → position/ETA → call dialog → leave). 2) Operator SPA (PIN login, call next, skip/remove/reset, capacity, stats, history export). 3) Public board page. 4) Cloudflare Worker API + `QueueDO` / `RateLimitDO`. 5) In-app docs (Guide · Development · About). 6) This Management Pack. |
| **Project Sponsor** | Course module BIC2263 (Software Project Management) — individual student project; no external budget. Host: free Cloudflare tier. |
| **Success Metrics** | 1) Customer can join → see position → get called → leave, with no account. 2) Operator can PIN-login, call next, skip/remove, export history. 3) Public board updates live via SSE. 4) Health gates green: `pnpm typecheck && pnpm build && pnpm test && pnpm knip`. 5) Rate limits enforced (login 10/min/IP, join 5/min/IP/queue). 6) Live deploy reachable at the URLs above. |

---

## 2. Requirements & Scope Backlog

*This section corresponds to the PROJECT SCOPE and REQUIREMENTS Core Components. It is the core input for the PLANNING phase.*

Priority: **H** = must for course MVP · **M** = shipped polish · **L** = parked / out of scope.  
Status vocabulary from lecturer template: New, Backlog, Development, QA, Done.

### 2.1 Customer

| Req. ID | Feature/Requirement Name | Description / User Story | Priority | Status |
|---------|--------------------------|--------------------------|----------|--------|
| REQ-001 | Join queue | As a visitor, I want to join a queue with an optional display name and receive a ticket number so I can take a place in line without standing there. | High | Done |
| REQ-002 | Position, now-serving, ETA | As a customer, I want to see my position, the number being served, and a simple estimated wait so I know when to come back. | High | Done |
| REQ-003 | Call dialog | As a customer, I want a clear dialog when my number is called so I know to head to the counter. | High | Done |
| REQ-004 | Leave queue | As a customer, I want to leave the queue before I am called (with a confirm step) so staff are not waiting for a no-show. | High | Done |
| REQ-005 | Mark served + rejoin | As a customer, I want to confirm I have been served and join again afterwards if needed. | High | Done |
| REQ-006 | Device ticket restore | As a customer, I want my ticket restored after reload via a private device id so I do not lose my place. | Medium | Done |
| REQ-007 | Privacy-aware waiting list | As a customer, I want the public waiting list to show ticket numbers only by default; names appear only if staff enable them. | Medium | Done |
| REQ-008 | Join toast with ETA | As a customer, I want my join confirmation to include an estimated wait when service-time data exists. | Medium | Done |

### 2.2 Operator

| Req. ID | Feature/Requirement Name | Description / User Story | Priority | Status |
|---------|--------------------------|--------------------------|----------|--------|
| REQ-009 | Operator demo mode | As a visitor, I want to preview the operator layout without a PIN so I can evaluate the product; real actions require sign-in. | Medium | Done |
| REQ-010 | PIN sign-in | As an operator, I want to sign in with a PIN so only staff can mutate the queue. | High | Done |
| REQ-011 | Call next + rich history | As an operator, I want to call the next customer and see history as `# · name · joined · called · state · country`. | High | Done |
| REQ-012 | Skip / remove | As an operator, I want to skip or remove a waiting ticket (with confirm) so no-shows do not block the line. | High | Done |
| REQ-013 | Mark served (current ticket) | As an operator, I want to mark the current now-serving ticket as served — both when the queue is empty and when more tickets are waiting. | High | Done |
| REQ-014 | Capacity limit | As an operator, I want to set max waiting so the line cannot grow without bound. | High | Done |
| REQ-015 | Reset queue | As an operator, I want to reset the whole queue (with confirm) when a session ends. | High | Done |
| REQ-016 | History export | As an operator, I want to export history as CSV / JSON / Markdown for records and coursework evidence. | Medium | Done |
| REQ-017 | Board names toggle | As an operator, I want a setting to show display names on the public board — off by default for privacy. | Medium | Done |

### 2.3 System

| Req. ID | Feature/Requirement Name | Description / User Story | Priority | Status |
|---------|--------------------------|--------------------------|----------|--------|
| REQ-018 | Live queue state | As a system, I want one Durable Object per `queueId` so concurrent joins/calls are serialized correctly. | High | Done |
| REQ-019 | SSE + HTTP split | As a system, I want live updates over SSE and mutations over HTTP so the board stays fresh without polling. | High | Done |
| REQ-020 | Rate limits | As a system, I want login limited to 10 fails/min/IP and join to 5/min/IP/queue so abuse is contained. | High | Done |
| REQ-021 | CORS allow-list | As a system, I want CORS origins from worker env so only the SPA can call the API. | High | Done |
| REQ-022 | No external database | As a system, I want all live state in Durable Objects (no D1/KV/R2) so the free-tier path stays simple. | High | Done |
| REQ-023 | Multi-queue URLs | As a system, I want multiple queues via URL `queueId` (default UI queue `main`) so different counters can be isolated. | High | Done |
| REQ-024 | Public board page | As a system, I want a read-only live board for counter monitors. | Medium | Done |
| REQ-025 | Operator list pagination | As an operator, I want custom page sizes (5/10/15/20) on waiting/history lists. | Medium | Done |

### 2.4 Out of scope (explicit)

| Item | Why out |
|------|---------|
| Multi-counter / multi-location orgs | Course MVP: one line per `queueId` |
| Full RBAC / OAuth customer accounts | Skipped for course MVP — PIN + session only |
| D1 / external history DB | Contradicts DO-only architecture lock |
| SMS / push notifications | No paid SaaS; not required for demo |
| Billing / SaaS onboarding | Outside course period |

### 2.5 Intention vs shipped (honest deltas)

| Early idea (`docs/product/scope.md`) | Shipped reality |
|--------------------------------------|-----------------|
| D1 as ticket/session/account store | **No D1** — Durable Objects only |
| Staff accounts + roles | **PIN + signed session**; demo mode for unauthenticated preview |
| Join rate limit “when API exists” | **Implemented** — `RateLimitDO` 5/min/IP/queue |

---

## 3. The Practical Project-Management Pack (Delivery Roadmap)

*This section combines SCHEDULE & TIME and COST & BUDGET Core Components into a simplified roadmap/WBS.*

| Milestone / Release | Target Date | Description & Key Features Included | Status |
|---------------------|-------------|--------------------------------------|--------|
| Milestone 0: Scaffold + control plane | 2026-10-04 | pnpm workspace, docs split, maintainer focus system, architecture lock (DO + SSE + PIN). | Completed |
| Milestone 1: Queue core | 2026-10-05 | `QueueDO` join/call/skip/remove/reset/settings, SSE board, Hono routes, CORS, operator PIN + rate limit. | Completed |
| Milestone 2: Live deploy | 2026-10-05 | Worker + Durable Objects + Pages live on free Cloudflare; SPA + auth + SEO/PWA. | Completed |
| Milestone 3: Production-ready v1 | 2026-10-05 | Capacity, ticket meta, call dialog, docs, toasts, rolling ETA, operator stats. | Completed |
| Milestone 4: Ops hardening | 2026-10-06 | RateLimitDO, D1 removed, device restore, pagination, export, board page, confirm dialogs, action locks. | Completed |
| Milestone 5: Demo + privacy polish | 2026-10-07 | Operator demo mode; Slice A privacy lists + richer history; Slice B Mark served; Slice C board names toggle + join ETA toast + Guide rate-limits. | Completed |
| Milestone 6: Course pack + polish | 2026-10-07 | This Management Pack; worker `/` hides `ALLOWED_ORIGINS`; ENV=production; LICENSE MIT; SSE reconnect fix. | Completed |
| Project Closure | 31/10/26 | Formal acceptance, retrospective, handover (repo + live URLs + docs). | Planned |

**Budget / cost:** zero cash. Hosting is Cloudflare free tier (Workers + Pages + Durable Objects). One secret (`OPERATOR_PIN`). No paid APIs.

---

## 4. Resource & Team Management

*This section corresponds to the RESOURCE & TEAM Core Component and defines who is involved in the SDLC.*

**Team model:** The lecturer tracker lists **QueueLess — Digital Campus Queue** under a **single student**: Farah Abdisamad. This is an **individual project**, not a 4–5 person group. Course materials describe rotating team roles; for this submission one person covers the SDLC roles below.

| Name | Core Project Role (from SDLC Roles) | Primary Responsibilities |
|------|--------------------------------------|--------------------------|
| Farah Abdisamad | Project Manager (Delivery Plan) | Plans milestones against the 31/10/26 tracker end date, keeps `maintainer/phases/focus.md` to max-3 focus, tracks risks and change control. |
| Farah Abdisamad | Product Owner (Value & Priorities) | Owns MVP cut (anonymous tickets, operator loop), prioritises add-on slices A→B→C, accepts shipped receipts. |
| Farah Abdisamad | Technical Lead (Architecture & Standards) | Locks stack: Hono Worker, `QueueDO` per `queueId`, SSE + HTTP, PIN sessions, DO-only (no D1), TypeScript + health gates. |
| Farah Abdisamad | Developer (Build) | Implements SPA views, worker routes, Durable Objects, rate limits, export, board privacy toggle. |
| Farah Abdisamad | UX/UI Designer (User Journeys) | Customer join→call→leave flow, operator dashboard, public board, in-app docs, demo mode. |
| Farah Abdisamad | QA/Test Lead (Quality Assurance) | Vitest worker tests (10), DO unit tests for serve/settings, `pnpm typecheck && build && test && knip`, policies script. |
| Farah Abdisamad | DevOps Engineer (CI/CD, Environments) | Free Cloudflare deploy path, `wrangler.jsonc` env, secrets via `wrangler secret put`, Pages + Worker URLs. |
| Farah Abdisamad | Security/Data Lead (Compliance) | PIN + HMAC session, login/join rate limits, hashed IP meta, privacy-default board names, no customer PII store. |

**Environments:** local `pnpm web:dev` (:5173) + `pnpm worker:dev` (:8787) · production Pages + Worker (URLs above).

---

## 5. Risk & Issues Register

*This section corresponds to the RISK Core Component and the RISK & ISSUES Management Process.*

| Risk ID | Risk Description | Prob. | Impact | Mitigation Plan | Status |
|---------|------------------|-------|--------|-----------------|--------|
| R-001 | Operator PIN brute-force login | Medium | High | `RateLimitDO`: 10 failed logins / 60s / IP → HTTP 429 + `Retry-After`; HMAC session TTL 12h. | Open (monitored) |
| R-002 | CORS misconfig after Pages deploy (API unreachable from SPA) | Medium | High | `ALLOWED_ORIGINS` in `wrangler.jsonc`; in-app Guide CORS section; redeploy worker when origin changes. | Open (ops step) |
| R-003 | Free-tier Cloudflare limits (CPU / DO usage) | Low | Medium | Stateless HTTP mutations; DO holds only live queue state; no external DB egress. | Accepted |
| R-004 | DO concurrency bugs (double call-next / serve) | Low | High | All mutations serialized in one DO per `queueId`; UI action locks; unit tests for serve + settings semantics. | Mitigated |
| R-005 | Public join spam from one network | Medium | Medium | Join rate limit 5/min/IP/queue; `maxWaiting` capacity → 409 when full. | Mitigated |
| R-006 | Name leakage on public board | Low | Medium | Board + student waiting list **numbers-only by default**; operator must enable `showNamesOnBoard`. | Mitigated |
| R-007 | SSE reconnect storms / client churn | Medium | Medium | Student view subscribes with `[queueId]` only; identity-stable snapshot updates; EventSource closed on unmount. | Mitigated |
| R-008 | Lost tickets if DO storage write fails | Low | Medium | Persist on every mutation; DO storage is source of truth between writes. | Mitigated |
| R-009 | Scope creep (D1, RBAC, multi-counter) | Medium | Medium | Explicit out-of-scope table; focus max-3 discipline in maintainer phases. | Controlled |
| R-010 | Solo contributor bus-factor = 1 | High | Medium | Repo docs, `AGENT.md`, in-app Development guide, this pack as handover. | Accepted (course context) |

**Known issues / debt (honest):**

| Item | Note |
|------|------|
| `docs/product/scope.md` early text still mentions D1 + roles | Superseded by architecture overview + pack §2.5 |
| `maintainer/systems/queue.md` “D1 binding exists” line | Stale — D1 removed; DO-only is current |
| `docs/architecture/overview.md` “join not rate-limited” | Stale — join IS rate-limited |
| knip hint on `scripts/test-worker-policies.ts` ignore | Cosmetic config debt |

---

## 6. Change Control Log

*This section corresponds to the CHANGE MANAGEMENT Core Component and the CHANGE CONTROL Management Process.*

| Change ID | Feature Affected | Requested By | Description of Change / Scope Expansion | Impact Analysis | Decision |
|-----------|------------------|--------------|----------------------------------------|-----------------|----------|
| C-001 | Runtime / data store | Project owner (architecture lock) | Drop planned D1 database; keep all live state in Durable Objects. | Scope: reduces infra. Schedule: no delay. Cost: none (free tier simpler). Risk: lower ops surface. Quality: fewer moving parts. | Approved |
| C-002 | Operator auth | Project owner | Replace full accounts/RBAC with operator PIN + signed session for course MVP. | Scope: reduces. Schedule: faster MVP. Cost: none. Risk: weaker multi-role model (accepted). Quality: adequate for single-operator demo. | Approved |
| C-003 | Login abuse control | Project owner | Add dedicated `RateLimitDO` for login failures (10/min/IP). | Scope: small add. Schedule: same day. Cost: none. Risk: lower. Quality: higher. | Approved |
| C-004 | Join abuse control | Project owner | Extend rate limit to join (5/min/IP/queue) + capacity 409. | Scope: small add. Schedule: same day. Cost: none. Risk: lower. Quality: higher. | Approved |
| C-005 | Ticket privacy (Slice A) | Product decision | Student waiting list number-only; operator history richer (name, joined, called, country). | Scope: UI only. Schedule: +1 day polish. Cost: none. Risk: lower (privacy). Quality: better operator value. | Approved |
| C-006 | Operator Mark served (Slice B) | Product decision | Allow operator to mark current now-serving ticket served — empty queue **and** when next tickets exist; DO clears `nowServing` + records service sample. | Scope: DO behaviour + button. Schedule: same day. Cost: none. Risk: low (tests added). Quality: queue state more correct. | Approved |
| C-007 | Board names gate (Slice C) | Product decision | `showNamesOnBoard` default **false**; operator toggle; student list follows same gate; join toast ETA; Guide rate-limits section. | Scope: settings + docs. Schedule: same day. Cost: none. Risk: lower (privacy default). Quality: clearer product story. | Approved |
| C-008 | SSE subscribe fix | Defect found in QA | Student view resubscribed on every ticket identity change (~1k `/stream` requests). | Scope: bugfix. Schedule: same day. Cost: none. Risk: lower. Quality: single connection per page. | Approved |
| C-009 | Full RBAC / multi-counter / notifications | Lecturer backlog / future | Not built for course MVP. | Scope: would expand significantly. Schedule: beyond 31/10/26 tracker. Cost: higher. Risk: scope creep. | Deferred |

---

## 7. Weekly Status Dashboard

**Project Name:** QueueLess — Digital Campus Queue  
**Week Of:** 2026-10-05 – 2026-10-07 (course cycle snapshot; tracker end date 31/10/26)

| Metric | Status | Summary Notes |
|--------|--------|---------------|
| Overall Project Health | **Green** | Core system built and deployed; MVP complete; add-ons A–C shipped; pack drafted for submission. |
| Schedule / Timeline | **Green** | Initiation → Planning → Design/Dev → Testing complete on tracker; Deployment + Operations in progress toward 31/10/26. Tracker progress ≈ 83%. |
| Budget / Costs | **Green** | Zero cash cost — Cloudflare free tier only (Workers + Pages + DO + one secret). |
| Quality & QA | **Green** | `typecheck` · `build` · `test` (10 passing) · `knip` green; DO tests for serve + settings; SSE reconnect defect found and fixed. |
| Key Risks & Blockers | **Yellow** | No hard blockers. Remaining: final lecturer pack paste/submit, optional stale-doc cleanup, live E2E smoke on production after deploy. |

### Key Victories (This Week)

- Full customer loop live: join → position/ETA → call dialog → leave / mark served / rejoin.
- Operator dashboard: PIN auth, demo mode, call next, skip/remove, Mark served, capacity, stats, export.
- Public board + student waiting list privacy-default (numbers only unless operator enables names).
- Rate limits enforced (`RateLimitDO`); DO-only architecture (D1 removed).
- Live deploys: Pages SPA + Worker API; health gates green; 10 worker tests passing.

### Critical Next Decisions

1. Paste/submit this Management Pack into the lecturer Google Doc / course platform before **31/10/26**.
2. Confirm production smoke (join on live SPA → operator PIN → call next → board updates) after deploy.
3. Optionally clean stale doc lines (D1/roles/rate-limit notes) listed in §5.
4. Parked future work (RBAC, multi-counter, notifications) only if a focus slot frees after closure.

---

## Appendix — evidence map (optional; delete before submit if not wanted)

| Pack section | Source of truth |
|--------------|-----------------|
| Charter / users / metrics | `docs/product/purpose.md`, `docs/course/assignment-1.md` |
| REQ backlog | This pack §2 (live product + `docs/product/scope.md`) |
| Milestones | `maintainer/shipped/README.md`, `maintainer/phases/focus.md` |
| Roles / tooling | root `package.json`, lecturer tracker row for Farah Abdisamad |
| Risks | This pack §5, `docs/product/policies.md` |
| Change log | Architecture overview + shipped receipts |
| Status | Lecturer tracker (Deployment + Operations In Progress) + this §7 |

**Live smoke (manual):** open `https://thequeueless.pages.dev/student/main` · join · `https://thequeueless.pages.dev/operator/main` PIN login · call next · board page updates.

**Policies script:** `pnpm test:policies` against local (`:8787`) or live worker base URL.

**Health gates:** `pnpm typecheck && pnpm build && pnpm test && pnpm knip`
