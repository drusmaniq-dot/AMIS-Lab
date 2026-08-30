"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface PublicationItem {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  type: "PATENT" | "JOURNAL" | "CONFERENCE" | "BOOK_CHAPTER" | "OTHER";
  doiOrLink: string | null;
  keywords: string[];
}

export interface PublicationsExplorerDict {
  tabPatents: string;
  tabJournal: string;
  tabConference: string;
  tabBooks: string;
  searchPlaceholder: string;
  filterAuthor: string;
  filterYear: string;
  allAuthors: string;
  allYears: string;
  viewMore: string;
  showLess: string;
  noResults: string;
  clearFilters: string;
  viewPublication: string;
  empty: string;
}

const TAB_TYPES = ["PATENT", "JOURNAL", "CONFERENCE", "BOOK_CHAPTER"] as const;
type TabType = (typeof TAB_TYPES)[number];

const VISIBLE_PER_YEAR = 3;

export function PublicationsExplorer({
  publications,
  labMemberAliases,
  dict,
}: {
  publications: PublicationItem[];
  labMemberAliases: string[];
  dict: PublicationsExplorerDict;
}) {
  const [tab, setTab] = useState<TabType>("JOURNAL");
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState("all");
  const [year, setYear] = useState("all");
  const [keyword, setKeyword] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  const tabLabels: Record<TabType, string> = {
    PATENT: dict.tabPatents,
    JOURNAL: dict.tabJournal,
    CONFERENCE: dict.tabConference,
    BOOK_CHAPTER: dict.tabBooks,
  };

  const tabPubs = useMemo(() => publications.filter((p) => p.type === tab), [publications, tab]);

  // Only lab members are offered as filter options — publications now carry full real
  // co-author lists (hundreds of external names), which aren't useful to filter by.
  const authors = useMemo(
    () => labMemberAliases.filter((alias) => tabPubs.some((p) => p.authors.includes(alias))),
    [tabPubs, labMemberAliases]
  );
  const years = useMemo(() => Array.from(new Set(tabPubs.map((p) => p.year))).sort((a, b) => b - a), [tabPubs]);
  const keywordOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of tabPubs) for (const k of p.keywords) counts.set(k, (counts.get(k) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
      .slice(0, 12);
  }, [tabPubs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabPubs.filter((p) => {
      if (author !== "all" && !p.authors.includes(author)) return false;
      if (year !== "all" && String(p.year) !== year) return false;
      if (keyword && !p.keywords.includes(keyword)) return false;
      if (q) {
        const haystack = `${p.title} ${p.authors.join(" ")} ${p.venue}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tabPubs, author, year, keyword, search]);

  const grouped = useMemo(() => {
    const map = new Map<number, PublicationItem[]>();
    for (const p of filtered) {
      if (!map.has(p.year)) map.set(p.year, []);
      map.get(p.year)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  const hasActiveFilters = Boolean(search || author !== "all" || year !== "all" || keyword);

  function resetFilters() {
    setSearch("");
    setAuthor("all");
    setYear("all");
    setKeyword(null);
  }

  function toggleYear(yr: number) {
    setExpandedYears((s) => {
      const next = new Set(s);
      if (next.has(yr)) next.delete(yr);
      else next.add(yr);
      return next;
    });
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        setTab(v as TabType);
        resetFilters();
        setExpandedYears(new Set());
      }}
    >
      <TabsList variant="line" className="h-auto flex-wrap">
        {TAB_TYPES.map((t) => (
          <TabsTrigger key={t} value={t}>
            {tabLabels[t]}
          </TabsTrigger>
        ))}
      </TabsList>

      {TAB_TYPES.map((t) => (
        <TabsContent key={t} value={t} className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <Input
              placeholder={dict.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={author} onValueChange={(v) => setAuthor(v ?? "all")}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder={dict.filterAuthor} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.allAuthors}</SelectItem>
                {authors.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={(v) => setYear(v ?? "all")}>
              <SelectTrigger className="sm:w-32">
                <SelectValue placeholder={dict.filterYear} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.allYears}</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                {dict.clearFilters}
              </Button>
            )}
          </div>

          {keywordOptions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {keywordOptions.map((k) => (
                <Badge
                  key={k}
                  variant={keyword === k ? "default" : "secondary"}
                  className="cursor-pointer select-none"
                  onClick={() => setKeyword((cur) => (cur === k ? null : k))}
                >
                  {k}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-8">
            {tabPubs.length === 0 && <p className="text-muted-foreground">{dict.empty}</p>}
            {tabPubs.length > 0 && grouped.length === 0 && <p className="text-muted-foreground">{dict.noResults}</p>}
            {grouped.map(([yr, pubs]) => {
              const expanded = expandedYears.has(yr);
              const visible = expanded ? pubs : pubs.slice(0, VISIBLE_PER_YEAR);
              return (
                <div key={yr}>
                  <h3 className="text-lg font-bold text-primary">{yr}</h3>
                  <ul className="mt-3 space-y-4">
                    {visible.map((p) => (
                      <li key={p.id} className="border-b pb-4">
                        <p className="font-semibold">{p.title}</p>
                        <p className="text-sm text-muted-foreground">{p.authors.join(", ")}</p>
                        <p className="text-sm italic text-muted-foreground">{p.venue}</p>
                        {p.doiOrLink && (
                          <Link
                            href={p.doiOrLink}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-1 inline-block text-sm text-accent underline-offset-4 hover:underline"
                          >
                            {dict.viewPublication}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                  {pubs.length > VISIBLE_PER_YEAR && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0"
                      onClick={() => toggleYear(yr)}
                    >
                      {expanded ? dict.showLess : `${dict.viewMore} (${pubs.length - VISIBLE_PER_YEAR})`}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
