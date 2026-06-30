"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, MoreHorizontal, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildMarketplaceSearchSuggestions,
  marketplaceSuggestionHref,
  type MarketplaceListingSuggestion
} from "@/lib/marketplace-search";
import { locationSuggestionItems } from "@/lib/provinces";

type MoreCategoryGroup = {
  title: string;
  items: {
    label: string;
    href: string;
    count: number;
    active: boolean;
  }[];
};

const OPEN_CATEGORIES_EVENT = "agrimarketx:open-categories";

export function MoreCategoriesMenu({
  groups,
  currentCategory = "all",
  locationCounts = {},
  categoryCounts = {},
  listingSuggestions = []
}: {
  groups: MoreCategoryGroup[];
  currentCategory?: string;
  locationCounts?: Record<string, number>;
  categoryCounts?: Record<string, number>;
  listingSuggestions?: MarketplaceListingSuggestion[];
}) {
  const router = useRouter();
  const activeGroup = groups.find((group) => group.items.some((item) => item.active));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>(activeGroup ? [activeGroup.title] : []);
  const locations = useMemo(() => locationSuggestionItems(), []);
  const scrollYRef = useRef(0);
  const lastKnownScrollYRef = useRef(0);
  const openRef = useRef(false);
  const shouldRestoreScrollRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    function rememberWindowScroll() {
      if (!openRef.current && window.scrollY > 0) {
        lastKnownScrollYRef.current = window.scrollY;
      }
    }

    rememberWindowScroll();
    window.addEventListener("scroll", rememberWindowScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", rememberWindowScroll);
    };
  }, []);

  useEffect(() => {
    function openCategories(event: Event) {
      const customEvent = event as CustomEvent<{ scrollY?: number }>;
      const requestedScrollY = typeof customEvent.detail?.scrollY === "number" ? customEvent.detail.scrollY : window.scrollY;
      scrollYRef.current = requestedScrollY > 0 ? requestedScrollY : lastKnownScrollYRef.current;
      shouldRestoreScrollRef.current = true;
      setOpen(true);
    }

    document.addEventListener(OPEN_CATEGORIES_EVENT, openCategories);

    return () => {
      document.removeEventListener(OPEN_CATEGORIES_EVENT, openCategories);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.classList.add("agrimarketx-categories-open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.scrollTo(0, scrollYRef.current);

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCategories(true);
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("agrimarketx-categories-open");
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (shouldRestoreScrollRef.current) {
        const scrollY = scrollYRef.current;
        window.requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });
      }
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const filteredGroups = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) {
      return groups;
    }

    return groups
      .map((group) => {
        const groupMatches = group.title.toLowerCase().includes(searchTerm);
        const matchingItems = group.items.filter((item) => item.label.toLowerCase().includes(searchTerm));

        return groupMatches ? group : { ...group, items: matchingItems };
      })
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const searchSuggestions = useMemo(() => (
    buildMarketplaceSearchSuggestions({
      query,
      currentCategory,
      locations,
      locationCounts,
      categoryCounts,
      listingSuggestions,
      includeCounts: true
    })
  ), [categoryCounts, currentCategory, listingSuggestions, locationCounts, locations, query]);

  function toggleGroup(title: string) {
    setExpanded((current) => (
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    ));
  }

  function closeCategories(restoreScroll = true) {
    const scrollY = scrollYRef.current;
    shouldRestoreScrollRef.current = restoreScroll;
    setOpen(false);

    if (restoreScroll) {
      window.setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 80);
    }
  }

  function chooseSuggestion(href: string) {
    closeCategories(false);
    router.push(href as never);
  }

  return (
    <>
      <button
        type="button"
        className="grid w-full cursor-pointer justify-items-center gap-1 rounded-md p-1 text-center text-[10px] font-bold leading-tight text-brand-navy outline-none hover:bg-green-50 hover:text-brand-green focus-visible:ring-2 focus-visible:ring-green-100 sm:p-1.5 sm:text-[11px] lg:gap-2 lg:p-2 lg:text-xs"
        onPointerDown={() => {
          scrollYRef.current = window.scrollY;
        }}
        onClick={() => {
          shouldRestoreScrollRef.current = true;
          setOpen(true);
        }}
        aria-expanded={open}
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-green-50 text-brand-green sm:h-11 sm:w-11 lg:h-12 lg:w-12">
          <MoreHorizontal size={20} />
        </span>
        More Categories
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex h-[100dvh] flex-col overflow-hidden bg-white text-brand-navy animate-[categorySheetIn_180ms_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="marketplace-categories-title"
        >
          <div className="shrink-0 border-b border-slate-200 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid h-11 w-11 touch-manipulation place-items-center rounded-full border border-slate-200 bg-white text-brand-navy outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-green-100"
                onClick={() => closeCategories(true)}
                aria-label="Close categories"
              >
                <X size={22} />
              </button>
              <div className="min-w-0">
                <h2 id="marketplace-categories-title" className="text-xl font-black">Categories</h2>
                <p className="text-xs font-medium text-slate-500">Browse all agricultural marketplace sections</p>
              </div>
            </div>
            <label className="mt-3 flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 focus-within:border-brand-green focus-within:ring-2 focus-within:ring-green-100">
              <Search size={18} className="shrink-0 text-brand-green" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search categories"
                className="min-w-0 flex-1 bg-transparent py-2 font-medium text-brand-navy outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            {query.trim() ? (
              <section className="mb-3 overflow-hidden rounded-xl border border-green-100 bg-green-50/70">
                <div className="border-b border-green-100 px-4 py-2">
                  <p className="text-xs font-black uppercase tracking-wide text-brand-green">Search suggestions</p>
                </div>
                <div className="grid gap-1 p-2">
                  {searchSuggestions.length > 0 ? searchSuggestions.map((item) => (
                    <button
                      key={`${item.kind}-${item.category ?? ""}-${item.subcategory ?? ""}-${item.query}`}
                      type="button"
                      className="flex min-h-11 touch-manipulation items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 outline-none transition active:scale-[0.99] active:bg-green-50 active:text-brand-green focus-visible:ring-2 focus-visible:ring-green-100"
                      onClick={() => chooseSuggestion(marketplaceSuggestionHref(item, currentCategory))}
                    >
                      <span className="min-w-0 truncate">{item.label}</span>
                      {typeof item.count === "number" && item.count > 0 ? (
                        <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-brand-green">{item.count}</span>
                      ) : null}
                    </button>
                  )) : (
                    <p className="rounded-lg bg-white px-3 py-3 text-sm font-semibold text-slate-500">No suggestions yet. Try a broader word.</p>
                  )}
                </div>
              </section>
            ) : null}

            <div className="grid gap-2">
              {filteredGroups.map((group) => {
                const isExpanded = expanded.includes(group.title) || Boolean(query.trim());
                const parentItem = group.items[0];
                const childItems = group.items.slice(1);
                const totalCount = group.items.reduce((sum, item) => sum + item.count, 0);

                return (
                  <section key={group.title} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      className={`flex min-h-14 w-full touch-manipulation items-center justify-between gap-3 px-4 py-3 text-left outline-none transition active:bg-green-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-100 ${
                        group.items.some((item) => item.active) ? "bg-green-50 text-brand-green" : "text-brand-navy"
                      }`}
                      onClick={() => toggleGroup(group.title)}
                      aria-expanded={isExpanded}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">{group.title}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-slate-500">{totalCount} listings</span>
                      </span>
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>

                    {isExpanded ? (
                      <div className="border-t border-slate-100 bg-slate-50 px-2 py-2">
                        {parentItem ? (
                          <Link
                            href={parentItem.href as never}
                            className={`mb-1 flex min-h-11 touch-manipulation items-center justify-between rounded-lg px-3 py-2 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-green-100 ${
                              parentItem.active ? "bg-brand-green text-white" : "bg-white text-brand-green"
                            }`}
                            onClick={() => closeCategories(false)}
                            aria-current={parentItem.active ? "page" : undefined}
                          >
                            <span>View all {group.title}</span>
                            <span className={parentItem.active ? "text-white/85" : "text-slate-400"}>({parentItem.count})</span>
                          </Link>
                        ) : null}

                        <div className="grid gap-1">
                          {childItems.map((item) => (
                            <Link
                              key={`${group.title}-${item.label}`}
                              href={item.href as never}
                              className={`flex min-h-11 touch-manipulation items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold outline-none transition active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-green-100 ${
                                item.active
                                  ? "bg-brand-green text-white"
                                  : "bg-white text-slate-700 active:bg-green-50 active:text-brand-green"
                              }`}
                              onClick={() => closeCategories(false)}
                              aria-current={item.active ? "page" : undefined}
                            >
                              <span className="min-w-0 truncate">{item.label}</span>
                              <span className={item.active ? "text-white/85" : "text-slate-400"}>({item.count})</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>

            {filteredGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="font-bold">No category found</p>
                <p className="mt-1 text-sm text-slate-500">Try a broader agricultural term.</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
