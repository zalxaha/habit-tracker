"use client";

import { useEffect, useState } from "react";

export default function RegisterSW() {
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e);
      setShowInstall(true);
    };
    const onInstalled = () => {
      setShowInstall(false);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Already running standalone? don't bother prompting.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) setInstalled(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!showInstall || installed) return null;

  async function handleInstall() {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setShowInstall(false);
  }

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-gold text-ink-900 text-sm font-medium px-4 py-2.5 shadow-lg shadow-black/30"
    >
      Pasang aplikasi
    </button>
  );
}
