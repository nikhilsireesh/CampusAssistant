"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES as ALL_CATEGORIES } from "@/lib/ai/types";

const CATEGORIES = ["All", ...ALL_CATEGORIES];

export function KnowledgeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const activeCategory = searchParams.get("category") ?? "All";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "All") params.set(key, value);
        else params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query !== (searchParams.get("q") ?? "")) updateParams({ q: query || null });
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the knowledge base..."
          className="h-10 pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={activeCategory === cat ? "default" : "outline"}
            className={cn("rounded-full")}
            onClick={() => updateParams({ category: cat === "All" ? null : cat })}
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
}
