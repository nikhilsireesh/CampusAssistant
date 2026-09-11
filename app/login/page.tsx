import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/guards";
import { GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";

export default async function LoginChooserPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold">Sign in to MIC Campus Assistant</h1>
        <p className="text-sm text-muted-foreground">Choose how you&apos;d like to sign in</p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <PortalCard
          href="/login/student"
          icon={GraduationCap}
          title="Student"
          description="Ask the AI assistant, submit requests and track their status."
        />
        <PortalCard
          href="/login/admin"
          icon={ShieldCheck}
          title="Admin"
          description="Manage tickets, respond to students and view campus-wide analytics."
        />
      </div>

      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to home
      </Link>
    </div>
  );
}

function PortalCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof GraduationCap;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
    >
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" />
      </div>
      <div>
        <h2 className="font-semibold">{title} sign in</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <span className="flex items-center gap-1 text-sm font-medium text-primary">
        Continue <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}
