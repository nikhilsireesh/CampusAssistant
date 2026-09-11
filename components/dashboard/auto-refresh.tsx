"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Silently re-fetches the current server-rendered page on an interval.
 *
 * Server components only render once per navigation — if another user
 * (e.g. a student submitting a ticket while an admin is already sitting on
 * the dashboard) changes data in the background, an already-open tab has
 * no way to know unless something asks the server again. This is a small,
 * invisible client component that does exactly that via `router.refresh()`,
 * which re-runs the page's server-side data fetching without a full reload
 * or lost scroll position. Pauses while the tab isn't visible.
 */
export function AutoRefresh({ intervalMs = 12000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
