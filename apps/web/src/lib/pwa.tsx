import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface PwaContextType {
  canInstall: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const ios = (window.navigator as any).standalone === true;
  const chromium = window.matchMedia("(display-mode: standalone)").matches;
  return ios || chromium;
}

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

  return (
    <PwaContext.Provider value={{ canInstall, isInstalled, install }}>
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error("usePwa must be used within PwaProvider");
  }
  return context;
}
