"use client";

import { Grid3X3 } from "lucide-react";
import { useRef } from "react";

export function MarketplaceCategoriesButton() {
  const scrollYRef = useRef(0);

  function rememberScrollPosition() {
    scrollYRef.current = window.scrollY;
  }

  return (
    <button
      type="button"
      className="grid h-11 w-11 touch-manipulation place-items-center rounded-full border border-slate-200 bg-white text-brand-green shadow-sm transition active:scale-95 lg:hidden"
      aria-label="Browse categories"
      onPointerDown={rememberScrollPosition}
      onTouchStart={rememberScrollPosition}
      onMouseDown={rememberScrollPosition}
      onClick={() => {
        rememberScrollPosition();
        document.dispatchEvent(new CustomEvent("agrimarketx:open-categories", { detail: { scrollY: scrollYRef.current } }));
      }}
    >
      <Grid3X3 size={20} />
    </button>
  );
}
