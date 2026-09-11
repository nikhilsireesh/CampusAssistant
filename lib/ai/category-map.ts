import { CATEGORIES } from "./types";

/**
 * The AI is only ever allowed to pick a *category*. The category-to-department
 * mapping is fixed here on the backend so the model can never invent or
 * misattribute a department name. This keeps ticket routing deterministic
 * and auditable, per the "AI must not fabricate departments" requirement.
 */
export const CATEGORY_TO_DEPARTMENT: Record<(typeof CATEGORIES)[number], string> = {
  Attendance: "Academic Office",
  Examinations: "Examination Cell",
  Fees: "Accounts",
  Scholarships: "Scholarship Cell",
  Certificates: "Academic Office",
  Hostel: "Hostel Administration",
  Placements: "Placement Cell",
  Admissions: "Admissions",
  Transportation: "Student Affairs",
  Library: "Library",
  "General Information": "Student Affairs",
  "Technical Support": "IT Support",
  Other: "Student Affairs",
};

/** Simple keyword table used by the rule-based fallback classifier. */
export const CATEGORY_KEYWORDS: Record<(typeof CATEGORIES)[number], string[]> = {
  Attendance: ["attendance", "absent", "present", "shortage", "condonation", "bunk"],
  Examinations: ["exam", "hall ticket", "semester exam", "results", "revaluation", "supplementary", "backlog"],
  Fees: ["fee", "fees", "payment", "paid", "transaction", "refund", "unpaid", "dues"],
  Scholarships: ["scholarship", "stipend", "fee reimbursement", "scheme"],
  Certificates: ["certificate", "bonafide", "study certificate", "transfer certificate", "tc", "document"],
  Hostel: ["hostel", "room", "mess", "warden", "accommodation", "maintenance"],
  Placements: ["placement", "job", "company", "interview", "internship", "drive", "recruit"],
  Admissions: ["admission", "counselling", "seat", "enrollment", "enroll"],
  Transportation: ["bus", "transport", "route", "van"],
  Library: ["library", "book", "borrow", "fine", "reissue"],
  "General Information": [
    "information",
    "college",
    "campus",
    "general",
    "contact",
    "location",
    "course",
    "faculty",
    "professor",
    "internal",
    "timetable",
    "syllabus",
    "class",
    "lecture",
  ],
  "Technical Support": ["portal", "login", "password", "website", "app", "technical", "error", "otp"],
  Other: [],
};

export function classifyByKeywords(message: string): (typeof CATEGORIES)[number] {
  const lower = message.toLowerCase();
  let bestCategory: (typeof CATEGORIES)[number] = "Other";
  let bestScore = 0;

  for (const category of CATEGORIES) {
    const keywords = CATEGORY_KEYWORDS[category];
    const score = keywords.reduce((acc, kw) => (lower.includes(kw) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

/** Categories that almost always require a human/administrative action. */
const ACTION_HINTS = [
  "not working",
  "not updated",
  "not reflect",
  "not credited",
  "not received",
  "still showing",
  "still unpaid",
  "still pending",
  "unpaid",
  "pending",
  "issue",
  "problem",
  "complaint",
  "request",
  "apply",
  "application",
  "shortage",
  "missing",
  "wrong",
  "error",
  "delay",
  "delayed",
  "stuck",
  "not showing",
  "help me",
  "unable",
  "cannot",
  "can't",
  "please resolve",
  "please help",
  "not working",
  "maintenance",
  "broken",
  "not generated",
  "not available",
];

export function looksLikeActionRequired(message: string): boolean {
  const lower = message.toLowerCase();
  return ACTION_HINTS.some((hint) => lower.includes(hint));
}
