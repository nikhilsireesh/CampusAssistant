import { requireRole } from "@/lib/auth/guards";
import { TicketDetailView } from "@/components/tickets/ticket-detail-view";

export default async function StudentTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("student");
  const { id } = await params;
  return <TicketDetailView ticketId={Number(id)} role="student" />;
}
