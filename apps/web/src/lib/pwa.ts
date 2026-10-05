/* Optional PWA install banner — lightweight, no external deps */

const STORAGE_KEY = "queueless_pwa_prompted";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function registerPwaInstallPrompt(): void {
  if (typeof window === "undefined") return;

  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;

    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // ignore
    }

    const banner = document.createElement("div");
    banner.setAttribute("role", "status");
    banner.style.cssText = [
      "position:fixed",
      "bottom:16px",
      "left:16px",
      "right:16px",
      "max-width:420px",
      "margin:0 auto",
      "padding:14px 16px",
      "background:var(--color-bg-secondary,#141414)",
      "border:1px solid var(--color-border,#2a2a2a)",
      "border-radius:12px",
      "color:var(--color-text,#ededed)",
      "font:14px/1.4 system-ui,sans-serif",
      "box-shadow:0 10px 24px rgba(0,0,0,.35)",
      "z-index:1000",
      "display:flex",
      "align-items:center",
      "gap:12px",
    ].join(";");

    const text = document.createElement("div");
    text.style.flex = "1";
    text.textContent = "Install QueueLess for a full-screen app experience.";

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;flex-shrink:0";

    const installBtn = document.createElement("button");
    installBtn.type = "button";
    installBtn.textContent = "Install";
    installBtn.style.cssText =
      "padding:8px 12px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:600;cursor:pointer";

    const dismissBtn = document.createElement("button");
    dismissBtn.type = "button";
    dismissBtn.textContent = "Later";
    dismissBtn.style.cssText =
      "padding:8px 12px;border:1px solid #2a2a2a;border-radius:8px;background:transparent;color:#a1a1aa;cursor:pointer";

    const close = () => {
      banner.remove();
    };

    installBtn.addEventListener("click", async () => {
      close();
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch {
        // ignore
      }
      deferredPrompt = null;
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    });

    dismissBtn.addEventListener("click", () => {
      close();
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    });

    actions.appendChild(installBtn);
    actions.appendChild(dismissBtn);
    banner.appendChild(text);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  });
}
