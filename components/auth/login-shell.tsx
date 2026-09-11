import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  MessageSquareText,
  Ticket,
  BookOpen,
  ShieldCheck,
  LineChart,
  Users,
} from "lucide-react";

type Portal = "student" | "admin";

const COPY: Record<
  Portal,
  {
    icon: typeof GraduationCap;
    photo: string;
    heading: string;
    description: string;
    features: { icon: typeof GraduationCap; label: string }[];
  }
> = {
  student: {
    icon: GraduationCap,
    photo: "/campus-courtyard.jpg",
    heading: "One intelligent place for everything campus.",
    description:
      "Ask questions, submit requests, track issues and connect with the right department — all from one place.",
    features: [
      { icon: MessageSquareText, label: "AI Campus Assistant" },
      { icon: Ticket, label: "Smart Request Routing" },
      { icon: BookOpen, label: "Knowledge Base" },
    ],
  },
  admin: {
    icon: ShieldCheck,
    photo: "/campus-front.jpg",
    heading: "Run campus support from one dashboard.",
    description:
      "Track every request, respond to students directly and monitor AI resolution rates in real time.",
    features: [
      { icon: Users, label: "Student Requests" },
      { icon: LineChart, label: "Live Analytics" },
      { icon: Ticket, label: "Smart Routing" },
    ],
  },
};

export function LoginShell({ portal, children }: { portal: Portal; children: React.ReactNode }) {
  const copy = COPY[portal];
  const Icon = copy.icon;
  const otherPortal: Portal = portal === "student" ? "admin" : "student";

  return (
    <div className="grid min-h-screen flex-1 grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex">
        <Image
          src={copy.photo}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-secondary/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]" />
        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <Icon className="size-6" />
          MIC Campus Assistant
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">{copy.heading}</h1>
          <p className="max-w-md text-primary-foreground/85">{copy.description}</p>
          <div className="grid max-w-md grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
            {copy.features.map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm backdrop-blur-sm"
              >
                <feature.icon className="size-4 shrink-0" />
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-primary-foreground/70">
          DVR &amp; Dr. HS MIC College of Technology
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 px-6 py-12">
        <div className="w-full max-w-md space-y-2 text-center lg:hidden">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Icon className="size-6" />
            <span className="text-lg font-semibold text-foreground">MIC Campus Assistant</span>
          </div>
        </div>
        <div className="w-full max-w-md space-y-1 text-center">
          <h2 className="text-2xl font-semibold">
            {portal === "admin" ? "Admin sign in" : "Student sign in"}
          </h2>
          <p className="text-sm text-muted-foreground">Sign in to continue to your dashboard</p>
        </div>

        {children}

        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/login/${otherPortal}`} className="hover:text-foreground">
            {otherPortal === "admin" ? "Administrator? Sign in here" : "Student? Sign in here"}
          </Link>
          <Link href="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
