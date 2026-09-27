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

      // The single Android launch splash stays up (capped by
      // launchShowDuration) until the web app has hydrated, so the WebView
      // never shows a blank page while the remote site is loading.
      await SplashScreen.hide().catch(() => undefined);
      await StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);

      const leaveFromCurrentPage = () => {
        if (window.location.pathname !== "/" && window.location.pathname !== "/marketplace") {
          window.location.replace("/marketplace");
          return;
        }

        if (Capacitor.getPlatform() === "android") {
          void App.exitApp();
        }
      };

      const backListener = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
          return;
        }

        // The WebView's canGoBack skips entries that were pushed without a
        // user gesture, while history.length also counts forward entries.
        // Try a JS back step and only fall back if the URL did not change,
        // so Back can neither exit early nor become a no-op trap.
        if (window.history.length > 1) {
          const before = window.location.href;
          window.history.back();
          window.setTimeout(() => {
            if (window.location.href === before) {
              leaveFromCurrentPage();
            }
          }, 350);
          return;
        }

        leaveFromCurrentPage();
      });
      cleanups.push(() => void backListener.remove());

      const deepLinkListener = await App.addListener("appUrlOpen", ({ url }) => {
        try {
          const incoming = new URL(url);
          const production = new URL("https://agrimarketx.co.za");

          if (incoming.host !== production.host) {
            return;
          }

          const next = `${incoming.pathname}${incoming.search}${incoming.hash}` || "/marketplace";
          const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

          if (next !== current) {
            window.location.assign(next);
          }
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
