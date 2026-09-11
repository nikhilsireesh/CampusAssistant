import { requireRole } from "@/lib/auth/guards";
import { getStudentProfile } from "@/lib/services/user-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { notFound } from "next/navigation";

export default async function StudentProfilePage() {
  const session = await requireRole("student");
  const profile = await getStudentProfile(session.userId);
  if (!profile) notFound();

  const readOnlyFields = [
    { label: "Student ID", value: profile.studentId },
    { label: "Email", value: profile.email },
    { label: "Department", value: profile.department },
    { label: "Program", value: profile.program },
    { label: "Year", value: profile.year },
    { label: "Section", value: profile.section },
    { label: "Admission Year", value: String(profile.admissionYear) },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your academic and contact information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Academic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {readOnlyFields.map((f) => (
            <div key={f.label} className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="text-sm font-medium">{f.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Contact Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EditProfileForm name={profile.name} phone={profile.phone} />
        </CardContent>
      </Card>
    </div>
  );
}
