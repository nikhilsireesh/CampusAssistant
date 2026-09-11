"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Plus, Trash2, AlertCircle, WifiOff } from "lucide-react";
import { ChatMessage, type DisplayMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { SuggestedQuestions } from "./suggested-questions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ConversationSummary {
  id: number;
  title: string;
  updatedAt: string;
}

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter -= 1;
  return localIdCounter;
}

export function ChatWindow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOffline, setAiOffline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (!res.ok) return;
      const json = await res.json();
      setConversations(json.data.conversations);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const prefill = searchParams.get("q");
    if (prefill) {
      router.replace("/student/assistant");
      sendMessage(prefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function openConversation(id: number) {
    setError(null);
    setActiveId(id);
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (!res.ok) return;
      const json = await res.json();
      setMessages(
        json.data.messages.map((m: { id: number; role: string; content: string; category: string | null; createdAt: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          category: m.category,
          createdAt: m.createdAt,
        }))
      );
    } catch {
      setError("Could not load that conversation.");
    }
  }

  function startNewConversation() {
    setActiveId(null);
    setMessages([]);
    setError(null);
  }

  async function clearCurrentConversation() {
    if (activeId) {
      await fetch(`/api/chat/conversations/${activeId}`, { method: "DELETE" });
      await loadConversations();
    }
    startNewConversation();
  }

  async function sendMessage(text: string) {
    setError(null);
    const userMessage: DisplayMessage = {
      id: nextLocalId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: activeId ?? undefined }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. You can try again or submit a support ticket.");
        setLoading(false);
        return;
      }

      const data = json.data as {
        conversationId: number;
        answer: string;
        category: string;
        usedFallback: boolean;
        aiEnabled: boolean;
        ticket?: { id: number; ticketNumber: string; status: string };
      };

      setActiveId(data.conversationId);
      setAiOffline(data.usedFallback);
      setMessages((prev) => [
        ...prev,
        {
          id: nextLocalId(),
          role: "assistant",
          content: data.answer,
          category: data.category,
          createdAt: new Date().toISOString(),
          ticket: data.ticket ?? null,
        },
      ]);
      loadConversations();
    } catch {
      setError("AI service is temporarily unavailable. Your request can still be submitted as a support ticket.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 lg:h-[calc(100vh-7rem)]">
      <aside className="hidden w-64 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-3 lg:flex">
        <Button variant="outline" className="justify-start" onClick={startNewConversation}>
          <Plus className="size-4" />
          New conversation
        </Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={cn(
                "block w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors",
                activeId === c.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col rounded-2xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">MIC Campus Assistant</p>
              {aiOffline && (
                <p className="flex items-center gap-1 text-[11px] text-warning-foreground">
                  <WifiOff className="size-3" /> Running in fallback mode
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearCurrentConversation} disabled={messages.length === 0}>
            <Trash2 className="size-3.5" />
            Clear
          </Button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 py-8 text-center">
              <div>
                <h2 className="text-xl font-semibold">How can I help you today?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask about attendance, exams, fees, certificates, hostel, scholarships and more.
                </p>
              </div>
              <div className="w-full max-w-xl">
                <SuggestedQuestions onSelect={sendMessage} />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 pl-11 text-sm text-muted-foreground">
                  <span className="flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </span>
                  thinking...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-border p-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
