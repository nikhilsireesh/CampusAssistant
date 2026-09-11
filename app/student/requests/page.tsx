import { Suspense } from "react";
import { requireRole } from "@/lib/auth/guards";
import { listTicketsForStudent } from "@/lib/services/ticket-service";
import { TicketCard } from "@/components/tickets/ticket-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { NewTicketDialog } from "@/components/tickets/new-ticket-dialog";
import { Ticket } from "lucide-react";

export default async function StudentRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const session = await requireRole("student");
  const { status, category } = await searchParams;
  const tickets = await listTicketsForStudent(session.userId, { status, category, pageSize: 100 });

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Requests</h1>
          <p className="text-sm text-muted-foreground">Track every request you&apos;ve submitted.</p>
        </div>
        <Suspense>
          <NewTicketDialog />
        </Suspense>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No requests yet"
          description="Requests you submit yourself or that are created by the AI Assistant will show up here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} href={`/student/requests/${t.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
