import { requireRole } from "@/lib/auth/guards";
import { listDepartments } from "@/lib/services/department-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone } from "lucide-react";

export default async function AdminDepartmentsPage() {
  await requireRole("admin");
  const departments = await listDepartments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
        <p className="text-sm text-muted-foreground">Tickets are routed to these departments automatically.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <Card key={d.id} className="border-border/70 shadow-sm">
            <CardContent className="space-y-3 px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4.5" />
                </div>
                <Badge variant={d.isActive ? "default" : "outline"}>{d.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
              </div>
              <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                {d.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {d.email}
                  </div>
                )}
                {d.contact && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3.5" /> {d.contact}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
