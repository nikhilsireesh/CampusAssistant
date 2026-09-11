"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

const MAX_LENGTH = 1000;

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value.slice(0, MAX_LENGTH));
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
        }}
        onKeyDown={handleKeyDown}
        placeholder="Ask about attendance, fees, exams, hostel..."
        rows={1}
        maxLength={MAX_LENGTH}
        disabled={disabled}
        aria-label="Message the MIC Campus Assistant"
        className="max-h-[120px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
      />
      <div className="flex flex-col items-end gap-1">
        <Button size="icon" onClick={submit} disabled={disabled || !value.trim()} aria-label="Send message">
          {disabled ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
