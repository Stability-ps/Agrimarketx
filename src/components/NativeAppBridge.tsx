"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

export function NativeAppBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let disposed = false;
    const cleanups: Array<() => void> = [];

    async function initialiseNativeShell() {
      const [{ App }, { SplashScreen }, { StatusBar, Style }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/splash-screen"),
        import("@capacitor/status-bar")
      ]);

      if (disposed) {
        return;
      }

      await StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);
      await SplashScreen.hide().catch(() => undefined);

      const backListener = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack || window.history.length > 1) {
          window.history.back();
          return;
        }

        if (Capacitor.getPlatform() === "android") {
          void App.exitApp();
        }
      });
      cleanups.push(() => void backListener.remove());

      const deepLinkListener = await App.addListener("appUrlOpen", ({ url }) => {
        try {
          const incoming = new URL(url);
          const production = new URL("https://agrimarketx.co.za");

          if (incoming.host !== production.host) {
            return;
          }

          const next = `${incoming.pathname}${incoming.search}${incoming.hash}`;
          window.location.assign(next || "/marketplace");
        } catch {
          // Ignore malformed external URLs.
        }
      });
      cleanups.push(() => void deepLinkListener.remove());
    }

    void initialiseNativeShell();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, []);

  return null;
}
