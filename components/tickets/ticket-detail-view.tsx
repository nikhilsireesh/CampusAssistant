"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextPromptDialog } from "@/components/ui/text-prompt-dialog";
import { StatusBadge } from "./status-badge";
import { CategoryBadge, DepartmentBadge } from "./category-badge";
import { TicketTimeline } from "./ticket-timeline";
import { formatDateTime } from "@/lib/utils";
import { Loader2, Send, Sparkles, Lock, ThumbsUp, ArrowUpCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TICKET_STATUSES } from "@/lib/constants/ticket";

interface TicketDetail {
  ticket: {
    id: number;
    ticketNumber: string;
    subject: string;
    description: string;
    category: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    resolution: string | null;
    createdByAi: boolean;
    departmentId: number | null;
    assignedAdminId: number | null;
  };
  student: { id: number; name: string; email: string } | null;
  assignedAdmin: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
  messages: {
    id: number;
    message: string;
    isInternal: boolean;
    createdAt: string;
    authorId: number;
    authorName: string;
    authorRole: string;
  }[];
  events: { id: number; eventType: string; description: string; createdAt: string }[];
}

export function TicketDetailView({ ticketId, role }: { ticketId: number; role: "student" | "admin" }) {
  const router = useRouter();
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<"accept" | "resolve" | "close" | "reopen" | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<"resolve" | null>(null);
  const isAdmin = role === "admin";

  const load = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}`);
    if (res.ok) {
      const json = await res.json();
      setDetail(json.data);
    }
    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    load();
    // Poll while this ticket is open so a status change or reply made by
    // the other party (student/admin) shows up here without a manual refresh.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 8000);
    return () => clearInterval(interval);
  }, [load]);

  async function sendReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim(), isInternal }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Could not send message.");
        return;
      }
      setReplyText("");
      setIsInternal(false);
      load();
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function submitStatusChange(status: string, resolution?: string) {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", status, resolution }),
    });
    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error ?? "Could not update status.");
      return;
    }
    const messages: Record<string, string> = {
      Resolved: "Ticket marked as resolved.",
      Closed: "Ticket closed. Thanks for confirming!",
      Reopened: "Ticket reopened. Admin has been notified.",
    };
    toast.success(messages[status] ?? `Status updated to ${status}`);
    load();
    router.refresh();
  }

  function changeStatus(status: string) {
    // Resolving always asks for a short note first, via the in-app dialog
    // below (native window.prompt is blocked in sandboxed environments).
    if (status === "Resolved") {
      setPendingPrompt("resolve");
      return;
    }
    submitStatusChange(status);
  }

  async function acceptTicket() {
    setActionLoading("accept");
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not accept this ticket.");
        return;
      }
      toast.success("Ticket accepted — it's now In Progress.");
      load();
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function closeTicket() {
    setActionLoading("close");
    try {
      await submitStatusChange("Closed");
    } finally {
      setActionLoading(null);
    }
  }

  async function reopenTicket() {
    setActionLoading("reopen");
    try {
      await submitStatusChange("Reopened");
    } finally {
      setActionLoading(null);
    }
  }

  function resolveTicket() {
    setPendingPrompt("resolve");
  }

  async function handlePromptConfirm(value: string) {
    setPendingPrompt(null);
    setActionLoading("resolve");
    try {
      await submitStatusChange("Resolved", value || undefined);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading ticket...</div>;
  }

  if (!detail) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Ticket not found.</div>;
  }

  const { ticket } = detail;
  const isClosed = ["Resolved", "Closed"].includes(ticket.status);
  const canAccept = isAdmin && ["Open", "Assigned", "Reopened"].includes(ticket.status);
  const canResolve = isAdmin && !isClosed;
  const canStudentReview = role === "student" && ticket.status === "Resolved";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{ticket.ticketNumber}</span>
            {ticket.createdByAi && (
              <span className="inline-flex items-center gap-1 text-primary">
                <Sparkles className="size-3.5" /> Created by AI
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={ticket.category} />
          {detail.department && <DepartmentBadge department={detail.department.name} />}
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
              {ticket.resolution && (
                <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm">
                  <p className="mb-1 font-medium text-success">Resolution</p>
                  <p className="text-foreground/90">{ticket.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                detail.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg border p-3 ${m.isInternal ? "border-warning/30 bg-warning/10" : "border-border bg-muted/40"}`}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {m.authorName}{" "}
                        <span className="font-normal capitalize text-muted-foreground">({m.authorRole})</span>
                        {m.isInternal && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-warning-foreground">
                            <Lock className="size-3" /> internal
                          </span>
                        )}
                      </span>
                      <span>{formatDateTime(m.createdAt)}</span>
                    </div>
                    <p className="text-sm">{m.message}</p>
                  </div>
                ))
              )}

              <div className="space-y-2 border-t border-border pt-4">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  {isAdmin ? (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox checked={isInternal} onCheckedChange={(v) => setIsInternal(v === true)} />
                      Internal note (student won&apos;t see this)
                    </label>
                  ) : (
                    <span />
                  )}
                  <Button onClick={sendReply} disabled={sending || !replyText.trim()}>
                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {canStudentReview && (
            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Is this resolved?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  If this solved your issue, close the ticket. If not, reopen it and admin will take
                  another look.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={closeTicket}
                    disabled={actionLoading !== null}
                    className="bg-success text-success-foreground hover:bg-success/90"
                  >
                    {actionLoading === "close" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Close ticket
                  </Button>
                  <Button variant="outline" onClick={reopenTicket} disabled={actionLoading !== null}>
                    {actionLoading === "reopen" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowUpCircle className="size-4 rotate-180" />
                    )}
                    Not resolved — reopen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Manage Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(canAccept || canResolve) && (
                  <div className="flex flex-col gap-2 border-b border-border pb-3">
                    {canAccept && (
                      <Button onClick={acceptTicket} disabled={actionLoading !== null}>
                        {actionLoading === "accept" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="size-4" />
                        )}
                        Accept request
                      </Button>
                    )}
                    {canResolve && (
                      <Button
                        onClick={resolveTicket}
                        disabled={actionLoading !== null}
                        className="bg-success text-success-foreground hover:bg-success/90"
                      >
                        {actionLoading === "resolve" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                        Resolve
                      </Button>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={ticket.status} onValueChange={(v) => v && changeStatus(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {detail.student && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-medium">{detail.student.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accepted by</span>
                <span className="font-medium">{detail.assignedAdmin?.name ?? "Not yet accepted"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDateTime(ticket.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last updated</span>
                <span className="font-medium">{formatDateTime(ticket.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketTimeline events={detail.events} />
            </CardContent>
          </Card>
        </div>
      </div>

      <TextPromptDialog
        open={pendingPrompt === "resolve"}
        title="Resolve this ticket"
        description="Describe how this was resolved. The student will see this note."
        placeholder="e.g. Verified with accounts — payment was reconciled and the portal now shows paid."
        confirmLabel="Mark as resolved"
        onConfirm={handlePromptConfirm}
        onCancel={() => setPendingPrompt(null)}
      />
    </div>
  );
}
