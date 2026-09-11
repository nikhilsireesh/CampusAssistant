import { Sparkles } from "lucide-react";

export const SUGGESTED_QUESTIONS = [
  "What is the minimum attendance requirement?",
  "When are my semester exams?",
  "I paid my fees but the payment is not updated.",
  "How do I apply for a bonafide certificate?",
  "How can I check scholarship information?",
  "I have a hostel maintenance issue.",
];

export function SuggestedQuestions({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {SUGGESTED_QUESTIONS.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onSelect(q)}
          className="flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          {q}
        </button>
      ))}
    </div>
  );
}
