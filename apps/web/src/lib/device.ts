/** Stable per-device id for ticket restore + duplicate-join detection. */

const KEY = "queueless_device_id";

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // private mode fallback — session-only
    if (!(window as any).__qlDevice) {
      (window as any).__qlDevice = crypto.randomUUID();
    }
    return (window as any).__qlDevice as string;
  }
}
