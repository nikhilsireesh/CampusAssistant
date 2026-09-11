import { Suspense } from "react";
import { requireRole } from "@/lib/auth/guards";
import { ChatWindow } from "@/components/assistant/chat-window";

export default async function AssistantPage() {
  await requireRole("student");
  return (
    <Suspense>
      <ChatWindow />
    </Suspense>
  );
}
