"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MoreCategoryGroup = {
  title: string;
  items: {
    label: string;
    href: string;
    count: number;
    active: boolean;
  }[];
};

export function MoreCategoriesMenu({ groups }: { groups: MoreCategoryGroup[] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className="grid w-full cursor-pointer justify-items-center gap-1 rounded-md p-1 text-center text-[10px] font-bold leading-tight text-brand-navy hover:bg-green-50 hover:text-brand-green sm:p-1.5 sm:text-[11px] lg:gap-2 lg:p-2 lg:text-xs"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-green-50 text-brand-green sm:h-11 sm:w-11 lg:h-12 lg:w-12">
          <MoreHorizontal size={20} />
        </span>
        More Categories
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-20 mt-3 max-h-[70vh] w-[min(92vw,920px)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-left shadow-soft lg:right-0">
          <div className="mb-3">
            <h3 className="font-bold text-brand-navy">More agricultural categories</h3>
            <p className="text-xs font-medium text-slate-500">Browse deeper categories without changing the main marketplace menu.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => (
              <section key={group.title}>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-green">{group.title}</h4>
                <div className="grid gap-1">
                  {group.items.map((item) => (
                    <Link
                      key={`${group.title}-${item.label}`}
                      href={item.href as never}
                      className={`flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm font-semibold transition ${
                        item.active
                          ? "bg-brand-green text-white hover:bg-brand-green hover:text-white"
                          : "text-slate-700 hover:bg-green-50 hover:text-brand-green"
                      }`}
                      onClick={() => setOpen(false)}
                      aria-current={item.active ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                      <span className={item.active ? "text-white/85" : "text-slate-400"}> ({item.count})</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
