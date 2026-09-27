"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

const SPLASH_DURATION_MS = 2500;

export function StartupSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), SPLASH_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <img
        src="/agrimarketx-logo.png"
        alt=""
        style={{
          display: "block",
          width: "min(88vw, 760px)",
          height: "auto",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
