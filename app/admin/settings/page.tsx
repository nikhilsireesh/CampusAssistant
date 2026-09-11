import { requireRole } from "@/lib/auth/guards";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { isDatabaseConfigured } from "@/lib/db";
import { getUserById } from "@/lib/services/user-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { Database, Wand2, CheckCircle2, XCircle } from "lucide-react";

export default async function AdminSettingsPage() {
  const session = await requireRole("admin");
  const user = await getUserById(session.userId);

  const geminiOn = isGeminiConfigured();
  const dbOn = isDatabaseConfigured();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Environment status and your account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-primary" />
              <span className="text-sm font-medium">Neon PostgreSQL</span>
            </div>
            <Badge variant={dbOn ? "default" : "destructive"} className="gap-1">
              {dbOn ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
              {dbOn ? "Connected" : "Not configured"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Wand2 className="size-4 text-primary" />
              <span className="text-sm font-medium">Gemini AI ({process.env.GEMINI_MODEL || "gemini-3.6-flash"})</span>
            </div>
            <Badge variant={geminiOn ? "default" : "outline"} className="gap-1">
              {geminiOn ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
              {geminiOn ? "Connected" : "Fallback mode"}
            </Badge>
          </div>
          {!geminiOn && (
            <p className="text-xs text-muted-foreground">
              Set <code className="rounded bg-muted px-1 py-0.5">GEMINI_API_KEY</code> in your environment to enable
              AI-enhanced responses. The assistant continues to work using the knowledge base and rule-based
              classification while this is unset.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Your Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
          <EditProfileForm name={session.name} phone={user?.phone ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
