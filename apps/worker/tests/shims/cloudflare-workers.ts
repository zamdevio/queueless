/**
 * Minimal shim for `cloudflare:workers` in unit tests.
 * Production runtime provides the real module via the Workers runtime.
 */

export class DurableObject {
  readonly ctx: DurableObjectState;
  readonly env: unknown;

  constructor(ctx: DurableObjectState, env: unknown) {
    this.ctx = ctx;
    this.env = env;
  }
}
