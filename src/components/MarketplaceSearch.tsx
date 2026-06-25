"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  marketplaceCategories,
  marketplacePopularSearches,
  marketplaceSuggestionItems,
  marketplaceTrendingSearches,
  type MarketplaceCategory
} from "@/lib/marketplace-categories";
import { locationSuggestionItems } from "@/lib/provinces";

type Suggestion = {
  label: string;
  query: string;
  category?: MarketplaceCategory;
  subcategory?: string | null;
  count?: number;
  kind: "category" | "location" | "combined";
};

function highlight(text: string, query: string) {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return text;
  }

  const index = text.toLowerCase().indexOf(cleanQuery.toLowerCase());
  if (index < 0) {
    return text;
  }

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-green-100 px-0.5 text-brand-green">{text.slice(index, index + cleanQuery.length)}</mark>
      {text.slice(index + cleanQuery.length)}
    </>
  );
}

function recentSearches() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem("agrimarketx_recent_searches") ?? "[]").slice(0, 5) as string[];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const cleanQuery = query.trim();
  if (!cleanQuery || typeof window === "undefined") {
    return;
  }

  const searches = [cleanQuery, ...recentSearches().filter((item) => item.toLowerCase() !== cleanQuery.toLowerCase())].slice(0, 5);
  window.localStorage.setItem("agrimarketx_recent_searches", JSON.stringify(searches));
}

export function MarketplaceSearch({
  q = "",
  category = "all",
  subcategory = "",
  locationCounts = {}
}: {
  q?: string;
  category?: string;
  subcategory?: string;
  locationCounts?: Record<string, number>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLFormElement>(null);
  const currentCategory = marketplaceCategories.some(([value]) => value === category) ? category : "all";
  const suggestions = useMemo<Suggestion[]>(
    () =>
      marketplaceSuggestionItems().map((item) => ({
        ...item,
        kind: "category" as const
      })),
    []
  );
  const locations = useMemo(() => locationSuggestionItems(), []);

  function countForLocation(location: (typeof locations)[number]) {
    if (location.type === "province") {
      return locationCounts[location.province.toLowerCase()] ?? 0;
    }

    return locationCounts[`${String(location.town).toLowerCase()}::${location.province.toLowerCase()}`] ?? 0;
  }

  function browseHref() {
    const params = new URLSearchParams();
    if (currentCategory !== "all") {
      params.set("category", currentCategory);
    }
    if (subcategory.trim()) {
      params.set("subcategory", subcategory.trim());
    }

    return `/marketplace${params.toString() ? `?${params.toString()}` : ""}`;
  }

  useEffect(() => {
    setRecent(recentSearches());
  }, []);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const filteredSuggestions = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const categoryPriority = currentCategory !== "all";
    const locationMatches = locations
      .map((location) => ({
        location,
        count: countForLocation(location),
        matches: `${location.label} ${location.query} ${location.aliases.join(" ")}`.toLowerCase().includes(cleanQuery)
      }))
      .filter((item) => cleanQuery && item.matches)
      .sort((a, b) => b.count - a.count || Number(a.location.type === "town") - Number(b.location.type === "town"))
      .slice(0, 5)
      .map<Suggestion>(({ location, count }) => ({
        label: `${location.label}${count ? ` (${count} listings)` : ""}`,
        query: location.query,
        count,
        kind: "location"
      }));

    const rankedCategories = suggestions
      .filter((item) => {
        if (!cleanQuery) {
          return categoryPriority ? item.category === currentCategory : true;
        }

        return `${item.label} ${item.query}`.toLowerCase().includes(cleanQuery);
      })
      .sort((a, b) => {
        if (!categoryPriority) {
          return 0;
        }

        return Number(b.category === currentCategory) - Number(a.category === currentCategory);
      });

    const bestLocation = locationMatches[0];
    const combinedSuggestions = bestLocation
      ? rankedCategories
          .filter((item) => cleanQuery && `${item.label} ${item.query}`.toLowerCase().split(/\s+/).some((word) => cleanQuery.includes(word)))
          .slice(0, 4)
          .map<Suggestion>((item) => ({
            label: `${item.query} in ${bestLocation.label.replace(/\s+\(\d+ listings\)$/, "")}`,
            query: `${item.query} ${bestLocation.query}`,
            category: item.category,
            subcategory: item.subcategory,
            count: bestLocation.count,
            kind: "combined"
          }))
      : [];

    const merged = [...combinedSuggestions, ...locationMatches, ...rankedCategories];
    const seen = new Set<string>();

    return merged
      .filter((item) => {
        const key = `${item.kind}-${item.category ?? ""}-${item.subcategory ?? ""}-${item.query}`;
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, 10);
  }, [currentCategory, locationCounts, locations, query, suggestions]);

  function hrefFor(item: Suggestion) {
    const params = new URLSearchParams();
    params.set("q", item.query);
    if (item.category) {
      params.set("category", item.category);
    } else if (currentCategory !== "all") {
      params.set("category", currentCategory);
    }
    if (item.subcategory) {
      params.set("subcategory", item.subcategory);
    }
    return `/marketplace?${params.toString()}`;
  }

  function submitSearch() {
    const cleanQuery = query.trim();
    if (cleanQuery) {
      saveRecentSearch(cleanQuery);
    }
  }

  function clearSearch() {
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    router.push(browseHref() as never);
  }

  function chooseSuggestion(item: Suggestion) {
    saveRecentSearch(item.query);
    setOpen(false);
    router.push(hrefFor(item) as never);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (query.trim()) {
        clearSearch();
      } else {
        setOpen(false);
      }
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, filteredSuggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && filteredSuggestions[activeIndex]) {
      event.preventDefault();
      chooseSuggestion(filteredSuggestions[activeIndex]);
    }
  }

  return (
    <form
      ref={wrapperRef}
      action="/marketplace"
      className="relative flex min-w-0 max-w-full rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-brand-green focus-within:ring-2 focus-within:ring-green-100"
      onSubmit={submitSearch}
    >
      <input type="hidden" name="category" value={currentCategory} disabled={currentCategory === "all"} />
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      <input
        className="h-12 min-w-0 flex-1 rounded-l-xl bg-transparent pl-11 pr-2 text-sm outline-none placeholder:text-slate-400 sm:h-14 sm:pl-12 sm:pr-3 sm:text-base"
        name="q"
        placeholder="Search livestock, feed, equipment, crops, services..."
        value={query}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          setOpen(true);
          setActiveIndex(-1);

          if (!nextValue.trim() && q.trim()) {
            router.push(browseHref() as never);
          }
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {query.trim() ? (
        <button
          className="grid h-9 w-9 place-items-center self-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-brand-navy"
          type="button"
          onClick={clearSearch}
          aria-label="Clear search"
        >
          <X size={17} />
        </button>
      ) : null}
      <button className="grid w-12 shrink-0 place-items-center rounded-r-xl bg-brand-green text-white sm:w-14" type="submit" aria-label="Search marketplace">
        <Search size={21} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[70vh] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-soft animate-in fade-in slide-in-from-top-1">
          {query.trim() ? (
            <div className="grid gap-1">
              {filteredSuggestions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-500">No suggestions yet. Press Enter to search “{query}”.</p>
              ) : null}
              {filteredSuggestions.map((item, index) => (
                <button
                  key={`${item.kind}-${item.category ?? ""}-${item.subcategory ?? ""}-${item.label}-${item.query}`}
                  type="button"
                  className={`rounded-md px-3 py-2 text-left text-sm font-semibold ${index === activeIndex ? "bg-green-50 text-brand-green" : "text-slate-700 hover:bg-green-50 hover:text-brand-green"}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => chooseSuggestion(item)}
                >
                  {highlight(item.label, query)}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <SuggestionBlock title="Popular searches" items={marketplacePopularSearches} />
              <SuggestionBlock title="Trending searches" items={marketplaceTrendingSearches} />
              {recent.length > 0 ? <SuggestionBlock title="Recent searches" items={recent} /> : null}
              <div>
                <p className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500">Popular categories</p>
                <div className="mt-2 grid gap-1">
                  {marketplaceCategories.map(([value, label]) => (
                    <a key={value} href={`/marketplace?category=${value}`} className="rounded-md px-2 py-1.5 text-sm font-semibold text-slate-700 hover:bg-green-50 hover:text-brand-green">
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}

function SuggestionBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2 grid gap-1">
        {items.map((item) => (
          <a key={item} href={`/marketplace?q=${encodeURIComponent(item)}`} className="rounded-md px-2 py-1.5 text-sm font-semibold text-slate-700 hover:bg-green-50 hover:text-brand-green">
            {item}
          </a>
        ))}
      </div>
    </div>
  );
}
