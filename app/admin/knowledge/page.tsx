import { requireRole } from "@/lib/auth/guards";
import { AdminKnowledgeManager } from "@/components/knowledge/admin-knowledge-manager";

export default async function AdminKnowledgePage() {
  await requireRole("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="text-sm text-muted-foreground">
          Manage the articles the AI Assistant uses to answer student questions.
        </p>
      </div>
      <AdminKnowledgeManager />
    </div>
  );
}
