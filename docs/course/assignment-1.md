# Assignment 1 — Idea proposal: QueueLess

This document supports the course **project idea** submission (shared project-ideas sheet / idea proposal). It is **not** a claim that the application is built or deployed.

---

## Why QueueLess for this course

QueueLess is a focused, demoable digital queue system for real waiting-line pain. Scope fits a team project period: clear users, a small MVP, visible concurrency challenges, and responsible data practices — without needing a large platform first.

---

## Target users

| Role | Who | Need |
|------|-----|------|
| Customer / visitor | People waiting at a counter, clinic desk, campus service, café pickup, etc. | Join once, know position and wait, leave the physical line until called |
| Operator / staff | Person calling numbers at the service point | See the live queue, call next, skip/remove, keep flow moving |
| (Later) Business admin | Owner configuring queues | Stretch — not MVP |

---

## Problem

Physical queues waste time and create uncertainty. People stand in line without knowing how long they will wait, and staff manage order with paper, verbal shouting, or ad-hoc tools that do not update everyone at once.

---

## Proposed solution

A lightweight web app:

1. Customer opens a QueueLess page (link or QR).
2. Joins the queue and receives a queue number.
3. Sees position, currently serving number, and a simple ETA.
4. Gets status updates until served (or leaves).
5. Staff use an operator view to call next, skip, or remove entries and see basic stats.

Prefer **anonymous customer tickets** (token + number) — no customer PII. Staff use **real accounts with roles** for the operator side.

---

## Smallest working version (MVP)

**Customer:** join → number → position → now-serving → ETA → leave/cancel.  
**Operator:** view queue → call next → skip → remove → reset/end session.  
**System:** shared live queue state, basic validation, basic abuse protection, simple error handling.

Explicitly **out of MVP:** multi-location orgs, heavy analytics, push notification platforms, full auth product, multi-counter complexity — see [`../product/scope.md`](../product/scope.md).

---

## Feasibility

| Factor | Assessment |
|--------|------------|
| Team size / period | One vertical (join + call-next) is buildable early; polish and realtime can iterate |
| Tech familiarity | React SPA + HTTP API is standard; Cloudflare Workers keep hosting simple |
| Risk | Concurrent join/serve needs careful shared-state design (Durable Objects + D1 + SSE) |
| Dependencies | No paid SaaS required for a free-tier Cloudflare path later |

---

## Demo potential

A short live demo can show: customer joins on one device, staff calls next on another, position updates for waiting customers. Fake/sample data is enough for classroom demos.

---

## Data safety

- Prefer anonymous tickets; avoid PII unless a later requirement forces it.
- Do not store payment data or government IDs.
- Use sample data in development.
- Rate-limit join/abuse paths when the API exists.
- Document retention: MVP queue state is ephemeral/session-scoped unless a later design adds history.

---

## Stretch potential

Multiple counters/queues, richer analytics, notifications, QR generation tooling, capacity limits, monitoring, audit events, localization, accessibility hardening — after MVP proves value.

---

## What Assignment 1 does **not** require

Do not assume the idea proposal needs: a deployed app, GitHub submission, a working React app, Cloudflare production setup, a live demo, or an upload to the course platform. Those may appear in later work; they are not the current deliverable.
