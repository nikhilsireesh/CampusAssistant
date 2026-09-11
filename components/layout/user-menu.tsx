"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, Loader2 } from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({
  name,
  email,
  role,
  profileHref,
}: {
  name: string;
  email: string;
  role: string;
  profileHref: string;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push(role === "admin" ? "/login/admin" : "/login/student");
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Account menu"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{name}</span>
              <span className="text-xs font-normal text-muted-foreground">{email}</span>
              <span className="mt-0.5 text-xs font-normal capitalize text-primary">{role}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(profileHref)}>
          <UserIcon className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} disabled={loggingOut} variant="destructive">
          {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
