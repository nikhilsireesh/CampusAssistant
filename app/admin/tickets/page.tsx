import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { listAllTickets } from "@/lib/services/ticket-service";
import { TicketCard } from "@/components/tickets/ticket-card";
import { StatusFilterTabs } from "@/components/tickets/status-filter-tabs";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { Button } from "@/components/ui/button";
import { Ticket, ChevronLeft, ChevronRight } from "lucide-react";

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireRole("admin");
  const { status, page } = await searchParams;
  const currentPage = page ? Number(page) : 1;
  const { rows, total, pageSize } = await listAllTickets({ status, page: currentPage, pageSize: 24 });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All Tickets</h1>
        <p className="text-sm text-muted-foreground">{total} total requests across the campus.</p>
      </div>

      <StatusFilterTabs basePath="/admin/tickets" activeStatus={status} />

      {rows.length === 0 ? (
        <EmptyState icon={Ticket} title="No tickets found" description="Try a different status filter." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((t) => (
              <TicketCard key={t.id} ticket={t} href={`/admin/tickets/${t.id}`} />
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                render={
                  <Link href={`/admin/tickets?${status ? `status=${status}&` : ""}page=${currentPage - 1}`}>
                    <ChevronLeft className="size-4" /> Prev
                  </Link>
                }
              />
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                render={
                  <Link href={`/admin/tickets?${status ? `status=${status}&` : ""}page=${currentPage + 1}`}>
                    Next <ChevronRight className="size-4" />
                  </Link>
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
