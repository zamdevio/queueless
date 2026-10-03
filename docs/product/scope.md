# Scope — QueueLess

## MVP (in scope)

### Customer

- Join a queue
- Receive a queue number
- View position in line
- View currently serving number
- View estimated waiting time (simple heuristic OK)
- Leave / cancel when appropriate

### Operator

- View the active queue
- Call next customer
- Skip a customer
- Remove / cancel a queue entry
- Reset / end the queue session
- Basic queue statistics (counts, optional average wait)

### System

- Real-time queue updates over **SSE** (server → client)
- Queue mutations over **HTTP** (Hono on the Worker)
- **Durable Object** for live queue coordination per `queueId`
- **D1** as the durable ticket / session / account store
- Staff **accounts + roles** (operator vs admin — exact set TBD)
- Customers prefer **anonymous tickets** (no customer accounts in MVP)
- Rolling-average ETA from recent serves
- **Multiple queues** addressed by `queueId` in the URL (not multi-counter)
- Basic validation, error handling, rate limiting / abuse protection
- Clear separation of customer vs operator surfaces

## Explicitly out of scope (MVP)

- Multi-business SaaS onboarding and billing
- Customer accounts / collecting names, phones, or other customer PII by default
- Multiple locations with org hierarchy
- Multiple counters per queue (one line per `queueId` is enough for MVP)
- Advanced analytics warehouses
- Native mobile apps
- Payment integration
- Guaranteed SMS/push notification providers
- Perfect ML wait-time prediction

## Future / stretch (parked)

- Multiple counters within a venue
- Historical analytics beyond rolling ETA inputs
- Notifications (web push / other)
- QR-code generation helpers
- Queue capacity limits (productized)
- Operational monitoring and audit events
- Multi-location support
- Accessibility and localization depth
- Production hardening beyond MVP needs

Promote stretch items only via `maintainer/phases/focus.md` when an MVP Focus slot frees.
