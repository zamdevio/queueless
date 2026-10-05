import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { registerPwaInstallPrompt } from "./lib/pwa";
import "./styles.css";
import "./views.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerPwaInstallPrompt();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // ignore registration errors (e.g. local http)
    });
  });
}
