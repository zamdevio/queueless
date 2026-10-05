import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";

export function OperatorLogin() {
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    setBusy(true);
    try {
      await login(pin.trim());
      toast.success("Signed in as operator");
      setPin("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="join-panel operator-login">
      <h2>Operator sign in</h2>
      <p className="join-hint">Enter the operator PIN for this deployment.</p>
      <form onSubmit={onSubmit} className="login-form">
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          disabled={busy}
          aria-label="Operator PIN"
        />
        <button type="submit" className="btn-primary" disabled={busy || !pin.trim()}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
