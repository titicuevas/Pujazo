"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaClient() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silencioso: la app sigue funcionando sin SW
      });
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (standalone) {
      setHidden(true);
      return;
    }

    const dismissed = sessionStorage.getItem("pujazo.pwaHintDismissed") === "1";
    if (dismissed) {
      setHidden(true);
      return;
    }

    const onBip = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setHidden(false);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    // iOS / navegadores sin beforeinstallprompt: mostrar tip genérico en móvil
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile && !dismissed) {
      setHidden(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (hidden) return null;

  async function onInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setHidden(true);
    sessionStorage.setItem("pujazo.pwaHintDismissed", "1");
  }

  function onDismiss() {
    setHidden(true);
    sessionStorage.setItem("pujazo.pwaHintDismissed", "1");
  }

  return (
    <div
      role="region"
      aria-label="Instalar Pujazo"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-lime/30 bg-[color:var(--panel-strong)] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.35)] sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm sm:rounded-lg sm:border sm:pb-3"
    >
      <p className="text-sm font-semibold text-ink">Instala Pujazo en el móvil</p>
      <p className="mt-1 text-xs leading-relaxed text-mist">
        {deferred
          ? "Acceso directo como app. Tus datos siguen solo en este dispositivo."
          : "En iPhone: Compartir → “Añadir a pantalla de inicio”. En Android: menú del navegador → Instalar app."}
      </p>
      <div className="mt-3 flex gap-2">
        {deferred ? (
          <button
            type="button"
            className="cta-primary flex-1 px-3 py-2 text-sm"
            onClick={() => void onInstall()}
          >
            Instalar
          </button>
        ) : null}
        <button
          type="button"
          className="cta-secondary flex-1 px-3 py-2 text-sm"
          onClick={onDismiss}
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
