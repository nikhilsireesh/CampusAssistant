import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  MessageSquareText,
  Ticket,
  BookOpenCheck,
  Building2,
  LineChart,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "AI Campus Assistant",
    description:
      "Ask questions in plain language and get grounded answers from the official campus knowledge base — powered by Gemini with a reliable rule-based fallback.",
  },
  {
    icon: Ticket,
    title: "Smart Request Routing",
    description:
      "Every request is automatically categorized and routed to the right department — Accounts, Examinations, Hostel, Placements and more.",
  },
  {
    icon: LineChart,
    title: "Ticket Tracking",
    description:
      "Track every request from submission to resolution with a clear status timeline, admin responses and resolution notes.",
  },
  {
    icon: BookOpenCheck,
    title: "Knowledge Base",
    description:
      "A searchable library of official campus policies on attendance, fees, exams, scholarships, hostel life and more.",
  },
  {
    icon: Building2,
    title: "Direct Line to Admin",
    description:
      "Every request goes straight to the college administration — no runaround between departments, just a direct line to the people who can act on it.",
  },
  {
    icon: ShieldCheck,
    title: "Admin Insights",
    description:
      "Administrators get real-time analytics on ticket volume, category trends, and AI resolution rates to spot recurring issues early.",
  },
];

export default async function LandingPage() {
  const session = await getSession();
  const primaryHref = session ? homeForRole(session.role) : "/login";
  const primaryLabel = session ? "Go to dashboard" : "Sign in";

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4.5" />
            </div>
            <span>MIC Campus Assistant</span>
          </div>
          <Button
            render={
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="size-4" />
              </Link>
            }
          />
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <Image
            src="/campus-front.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-background" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,color-mix(in_oklch,var(--color-primary)_35%,transparent),transparent_45%),radial-gradient(circle_at_85%_25%,color-mix(in_oklch,var(--color-secondary)_30%,transparent),transparent_45%)]" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center text-white">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              DVR &amp; Dr. HS MIC College of Technology
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              MIC CAMPUS ASSISTANT
            </h1>
            <p className="max-w-xl text-lg text-white/90">
              One intelligent place for everything campus.
            </p>
            <p className="max-w-2xl text-balance text-white/75">
              Ask questions, submit requests, track issues and connect with the right
              department — all from one place.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                size="lg"
                render={
                  <Link href={primaryHref}>
                    {session ? "Go to dashboard" : "Get started"}
                    <ArrowRight className="size-4" />
                  </Link>
                }
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mb-1.5 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} DVR &amp; Dr. HS MIC College of Technology</p>
          <p>MIC Campus Assistant — student support, reimagined.</p>
        </div>
      </footer>
    </div>
  );
}
