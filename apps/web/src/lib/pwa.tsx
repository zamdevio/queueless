import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface PwaContextType {
  canInstall: boolean;
  isInstalled: boolean;
  /** True when installed but running in a browser tab (not standalone). */
  canOpenApp: boolean;
  install: () => Promise<void>;
  openApp: () => void;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const ios = (window.navigator as any).standalone === true;
  const chromium = window.matchMedia("(display-mode: standalone)").matches;
  const edge = (window.navigator as any).msLaunchUri !== undefined && ios;
  return ios || chromium || edge;
}

/** Installed marker: standalone OR previously confirmed install prompt. */
function readInstalledFlag(): boolean {
  try {
    return localStorage.getItem("queueless_pwa_installed") === "1";
  } catch {
    return false;
  }
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installedFlag, setInstalledFlag] = useState(readInstalledFlag);
  const [standalone, setStandalone] = useState(isStandalone);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setStandalone(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem("queueless_pwa_installed", "1");
      } catch {
        // ignore
      }
      setInstalledFlag(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const mq = window.matchMedia("(display-mode: standalone)");
    const onMq = () => setStandalone(mq.matches);
    mq.addEventListener("change", onMq);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const isInstalled = standalone || installedFlag;
  const canInstall = Boolean(deferredPrompt) && !isInstalled;
  /** Installed but user is in a browser tab → offer Open PWA */
  const canOpenApp = isInstalled && !standalone;

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch {
      // ignore
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const openApp = useCallback(() => {
    // Best-effort: browsers typically relaunch the installed PWA when
    // the page is already installed; location reload in standalone.
    if (standalone) {
      window.location.reload();
      return;
    }
    // No universal "launch PWA" API; reload + prompt user to use installed app icon.
    toastOpenHint();
    window.location.reload();
  }, [standalone]);

  return (
    <PwaContext.Provider value={{ canInstall, isInstalled, canOpenApp, install, openApp }}>
      {children}
    </PwaContext.Provider>
  );
}

function toastOpenHint() {
  // lightweight console hint; UI shows Open button in sidebar
  console.info("QueueLess: open the installed app from your home screen / taskbar.");
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error("usePwa must be used within PwaProvider");
  }
  return context;
}
