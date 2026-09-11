import { requireRole } from "@/lib/auth/guards";
import { listAllStudents } from "@/lib/services/user-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminStudentsPage() {
  await requireRole("admin");
  const students = await listAllStudents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-muted-foreground">{students.length} enrolled students.</p>
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                  <TableCell>{s.department}</TableCell>
                  <TableCell>{s.program}</TableCell>
                  <TableCell>{s.year}</TableCell>
                  <TableCell>{s.section}</TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? "default" : "outline"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
