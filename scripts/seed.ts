import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import * as schema from "../lib/db/schema";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = neon(connectionString);
const db = drizzle(client, { schema });

const {
  users,
  students,
  departments,
  knowledgeBase,
  tickets,
  ticketMessages,
  ticketEvents,
  announcements,
  chatConversations,
  chatMessages,
  aiInteractions,
} = schema;

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding MIC Campus Assistant database...\n");

  console.log("Clearing existing data...");
  await db.execute(sql`TRUNCATE TABLE
    ai_interactions, chat_messages, chat_conversations,
    notifications, ticket_events, ticket_messages, tickets,
    knowledge_base, announcements, students, users, departments
    RESTART IDENTITY CASCADE`);
  await db.execute(sql`DROP SEQUENCE IF EXISTS ticket_seq`);

  // ------------------------------------------------------------------
  // Departments (kept as an organizational/reporting tag on tickets —
  // every request is handled by admin directly, there is no staff role)
  // ------------------------------------------------------------------
  console.log("Creating departments...");
  const departmentRows = await db
    .insert(departments)
    .values([
      { name: "Academic Office", description: "Handles attendance, certificates and general academic queries.", email: "academics@mictech.edu.in", contact: "08414-252120" },
      { name: "Accounts", description: "Handles fee payments, refunds and financial queries.", email: "accounts@mictech.edu.in", contact: "08414-252121" },
      { name: "Examination Cell", description: "Handles examination schedules, hall tickets and results.", email: "exams@mictech.edu.in", contact: "08414-252122" },
      { name: "Scholarship Cell", description: "Handles scholarship applications and disbursement queries.", email: "scholarships@mictech.edu.in", contact: "08414-252123" },
      { name: "Hostel Administration", description: "Handles hostel accommodation, maintenance and mess issues.", email: "hostel@mictech.edu.in", contact: "08414-252124" },
      { name: "Placement Cell", description: "Handles placement drives, training and internship coordination.", email: "placements@mictech.edu.in", contact: "08414-252125" },
      { name: "Admissions", description: "Handles new admissions and counselling queries.", email: "admissions@mictech.edu.in", contact: "08414-252126" },
      { name: "Library", description: "Handles library resources, book issues and fines.", email: "library@mictech.edu.in", contact: "08414-252127" },
      { name: "IT Support", description: "Handles student portal, Wi-Fi and technical issues.", email: "itsupport@mictech.edu.in", contact: "08414-252128" },
      { name: "Student Affairs", description: "Handles general student welfare, transport and miscellaneous requests.", email: "studentaffairs@mictech.edu.in", contact: "08414-252129" },
    ])
    .returning();

  const dept = Object.fromEntries(departmentRows.map((d) => [d.name, d]));

  // ------------------------------------------------------------------
  // Demo accounts — two roles only: student and admin. Every request a
  // student raises is handled directly by admin.
  // ------------------------------------------------------------------
  console.log("Creating users...");

  const [adminUser] = await db
    .insert(users)
    .values({
      email: "admin@mictech.edu.in",
      passwordHash: await hash("Admin@123"),
      name: "Dr.T.Vamsee Kiran",
      role: "admin",
      phone: "9000000001",
    })
    .returning();

  const [studentUser] = await db
    .insert(users)
    .values({
      email: "student@mictech.edu.in",
      passwordHash: await hash("Student@123"),
      name: "Nikhil",
      role: "student",
      phone: "9000000003",
    })
    .returning();

  await db.insert(students).values({
    userId: studentUser.id,
    studentId: "22B91A0501",
    department: "Computer Science",
    program: "B.Tech",
    year: "3rd Year",
    section: "A",
    admissionYear: 2022,
  });

  const extraStudentDefs = [
    { email: "priya.sharma@mictech.edu.in", name: "Nikhil", studentId: "23B91A1205", department: "Information Technology", year: "2nd Year", section: "B", admissionYear: 2023 },
    { email: "rahul.reddy@mictech.edu.in", name: "Nikhil", studentId: "21B91A0410", department: "Electronics & Communication", year: "4th Year", section: "A", admissionYear: 2021 },
    { email: "sneha.patel@mictech.edu.in", name: "Nikhil", studentId: "22B91A0522", department: "Computer Science", year: "3rd Year", section: "B", admissionYear: 2022 },
    { email: "arjun.verma@mictech.edu.in", name: "Nikhil", studentId: "23B91A0233", department: "Mechanical Engineering", year: "2nd Year", section: "A", admissionYear: 2023 },
  ];
  const extraStudents: { user: typeof studentUser }[] = [];
  for (const s of extraStudentDefs) {
    const [u] = await db
      .insert(users)
      .values({ email: s.email, passwordHash: await hash("Student@123"), name: s.name, role: "student", phone: "9000000020" })
      .returning();
    await db.insert(students).values({
      userId: u.id,
      studentId: s.studentId,
      department: s.department,
      program: "B.Tech",
      year: s.year,
      section: s.section,
      admissionYear: s.admissionYear,
    });
    extraStudents.push({ user: u });
  }

  // ------------------------------------------------------------------
  // Knowledge base
  // ------------------------------------------------------------------
  console.log("Seeding knowledge base...");
  await db.insert(knowledgeBase).values([
    {
      title: "Minimum Attendance Requirement",
      category: "Attendance",
      content:
        "Students are expected to maintain the minimum attendance percentage prescribed by the institution and applicable academic regulations. Students with attendance shortages may be required to follow the college's condonation or shortage procedures. Attendance is calculated per subject and reviewed each semester by the Academic Office.",
      keywords: "attendance, minimum attendance, shortage, condonation, percentage",
      department: "Academic Office",
      priority: 10,
    },
    {
      title: "Semester Examination Information",
      category: "Examinations",
      content:
        "Semester examination schedules, hall tickets, examination regulations and results are managed through the examination section. Students should monitor official examination notifications on the college portal and notice boards for the latest schedule and any changes.",
      keywords: "exam, semester exam, hall ticket, results, examination schedule",
      department: "Examination Cell",
      priority: 10,
    },
    {
      title: "Semester Fee Payment",
      category: "Fees",
      content:
        "Students can pay applicable semester fees through the authorized college fee payment system. Payment issues, such as a payment not reflecting after being made, should be reported to the accounts section along with the transaction reference number so it can be verified and corrected.",
      keywords: "fee, fees payment, semester fee, transaction, unpaid, refund",
      department: "Accounts",
      priority: 10,
    },
    {
      title: "Scholarship Information",
      category: "Scholarships",
      content:
        "Scholarship eligibility, application deadlines and document requirements depend on the specific scholarship scheme a student is applying under. Students should contact the scholarship section for scheme-specific information and to check the status of a submitted application.",
      keywords: "scholarship, stipend, fee reimbursement, eligibility, scheme",
      department: "Scholarship Cell",
      priority: 9,
    },
    {
      title: "Certificate Requests",
      category: "Certificates",
      content:
        "Students can submit requests for bonafide certificates, study certificates and other academic documents through the designated academic/administrative process. Processing times vary depending on the type of certificate and current request volume.",
      keywords: "certificate, bonafide, study certificate, transfer certificate, document request",
      department: "Academic Office",
      priority: 8,
    },
    {
      title: "Hostel Facilities",
      category: "Hostel",
      content:
        "Hostel-related requests including accommodation allotment, maintenance, food/mess issues and room-related concerns should be directed to the hostel administration. Urgent maintenance issues are prioritized.",
      keywords: "hostel, room, mess, warden, accommodation, maintenance",
      department: "Hostel Administration",
      priority: 8,
    },
    {
      title: "Placement Assistance",
      category: "Placements",
      content:
        "Placement-related information includes company drives, eligibility criteria, registration procedures, training sessions and other placement activities, all managed by the placement cell. Students should keep their placement profile updated to be considered for drives.",
      keywords: "placement, job, company drive, internship, eligibility, training",
      department: "Placement Cell",
      priority: 9,
    },
    {
      title: "New Admissions & Counselling",
      category: "Admissions",
      content:
        "Queries related to new admissions, counselling schedules, seat allotment and required documents for enrollment should be directed to the Admissions office, which maintains the current academic year's admission procedures.",
      keywords: "admission, counselling, seat allotment, enrollment, new student",
      department: "Admissions",
      priority: 6,
    },
    {
      title: "Library Services",
      category: "Library",
      content:
        "The library offers book lending, reference materials and digital resources. Queries about book issue limits, renewal, overdue fines or reserving a title should be directed to the library desk.",
      keywords: "library, book, borrow, fine, reissue, renewal",
      department: "Library",
      priority: 5,
    },
    {
      title: "Campus Transportation",
      category: "Transportation",
      content:
        "College transport routes and bus pass queries are coordinated by Student Affairs. Route changes and timing updates are communicated through official college announcements.",
      keywords: "bus, transport, route, van, bus pass",
      department: "Student Affairs",
      priority: 5,
    },
    {
      title: "Student Portal & Technical Issues",
      category: "Technical Support",
      content:
        "For issues logging into the student portal, resetting your password, or other technical difficulties with college digital systems, contact IT Support. Have your registered email/student ID ready when reaching out.",
      keywords: "portal, login, password reset, technical issue, website, app",
      department: "IT Support",
      priority: 6,
    },
    {
      title: "General College Information",
      category: "General Information",
      content:
        "DVR & Dr. HS MIC College of Technology offers undergraduate and postgraduate engineering programs. For general information about departments, facilities or how to reach a specific office, students can check the college website or ask the MIC Campus Assistant.",
      keywords: "college information, campus, general, contact, about college",
      department: "Student Affairs",
      priority: 4,
    },
  ]);

  // ------------------------------------------------------------------
  // Sample tickets — every request goes straight to admin. These show
  // the full lifecycle: unaccepted, accepted (In Progress), resolved
  // (awaiting the student's confirmation), waiting on the student, and
  // fully closed.
  // ------------------------------------------------------------------
  console.log("Seeding sample tickets...");
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1`);

  async function nextTicketNumber(prefix: string) {
    const result = await db.execute<{ val: string }>(sql`SELECT nextval('ticket_seq') AS val`);
    const val = Number((result.rows[0] as unknown as { val: string }).val);
    return `${prefix}-2026-${String(val).padStart(4, "0")}`;
  }

  const seedTickets = [
    {
      prefix: "FEE",
      category: "Fees" as const,
      department: "Accounts",
      subject: "Payment not reflecting after semester fee payment",
      description:
        "I paid my semester fee three days ago via the college portal but my dashboard still shows the fee as unpaid. Transaction ref: TXN88213409.",
      status: "In Progress" as const,
      student: studentUser,
      accepted: true,
      response: "We are checking the payment transaction with the bank gateway and will update you shortly.",
    },
    {
      prefix: "ATT",
      category: "Attendance" as const,
      department: "Academic Office",
      subject: "Attendance shortage clarification",
      description:
        "My attendance dashboard shows 68% for Data Structures but I believe I attended more classes than reflected. Could you please clarify the condonation process?",
      status: "Open" as const,
      student: extraStudents[0].user,
      accepted: false,
      response: null,
    },
    {
      prefix: "EXM",
      category: "Examinations" as const,
      department: "Examination Cell",
      subject: "Hall ticket not generated for upcoming semester exam",
      description:
        "I am unable to download my hall ticket for the upcoming semester examinations. The portal shows 'not available' for my roll number.",
      status: "In Progress" as const,
      student: extraStudents[1].user,
      accepted: true,
      response: null,
    },
    {
      prefix: "SCH",
      category: "Scholarships" as const,
      department: "Scholarship Cell",
      subject: "Scholarship document query",
      description:
        "I submitted my scholarship application along with income certificate last month. Could you confirm if all documents were received and are in order?",
      status: "Resolved" as const,
      student: extraStudents[2].user,
      accepted: true,
      response: "All your documents have been verified and your application has been forwarded for approval.",
      resolution: "Documents verified and application forwarded for approval.",
    },
    {
      prefix: "HOST",
      category: "Hostel" as const,
      department: "Hostel Administration",
      subject: "Hostel maintenance request - room fan not working",
      description:
        "The ceiling fan in my hostel room (Block C, Room 214) has not been working for the past two days. Requesting urgent maintenance.",
      status: "Waiting for Student" as const,
      student: extraStudents[3].user,
      accepted: true,
      response: "A maintenance technician has been scheduled. Could you confirm your availability tomorrow morning?",
    },
    {
      prefix: "PLC",
      category: "Placements" as const,
      department: "Placement Cell",
      subject: "Unable to register for campus placement drive",
      description:
        "I tried registering for the upcoming placement drive but the portal shows a validation error on my resume upload.",
      status: "Closed" as const,
      student: studentUser,
      accepted: true,
      response: "The upload issue was a file size limit — please use a PDF under 2MB. Registration is now confirmed.",
      resolution: "File size limit issue identified and resolved; student's registration confirmed.",
    },
  ];

  for (const t of seedTickets) {
    const ticketNumber = await nextTicketNumber(t.prefix);
    const isResolvedOrLater = t.status === "Resolved" || t.status === "Waiting for Student" || t.status === "Closed";

    const [ticket] = await db
      .insert(tickets)
      .values({
        ticketNumber,
        studentId: t.student.id,
        category: t.category,
        departmentId: dept[t.department].id,
        subject: t.subject,
        description: t.description,
        status: t.status,
        assignedAdminId: t.accepted ? adminUser.id : undefined,
        resolution: "resolution" in t ? t.resolution : undefined,
        createdByAi: true,
        aiConfidence: 0.86,
        resolvedAt: isResolvedOrLater ? new Date() : undefined,
      })
      .returning();

    await db.insert(ticketEvents).values([
      { ticketId: ticket.id, eventType: "created", description: "Request submitted", actorId: t.student.id },
      { ticketId: ticket.id, eventType: "routed", description: `Routed to admin — ${t.department}`, actorId: t.student.id },
    ]);

    if (t.accepted) {
      await db.insert(ticketEvents).values({
        ticketId: ticket.id,
        eventType: "accepted",
        description: `Accepted by ${adminUser.name} and is now being worked on`,
        actorId: adminUser.id,
      });
    }
    if (t.status !== "Open") {
      await db.insert(ticketEvents).values({
        ticketId: ticket.id,
        eventType: "status_change",
        description: `Status changed to ${t.status}`,
        actorId: adminUser.id,
      });
    }

    if (t.response) {
      await db.insert(ticketMessages).values({
        ticketId: ticket.id,
        authorId: adminUser.id,
        message: t.response,
      });
    }

    if (t.status === "Closed") {
      await db.insert(ticketEvents).values({
        ticketId: ticket.id,
        eventType: "status_change",
        description: "Closed by student — issue confirmed resolved",
        actorId: t.student.id,
      });
    }
  }

  // ------------------------------------------------------------------
  // Announcements
  // ------------------------------------------------------------------
  console.log("Seeding announcements...");
  await db.insert(announcements).values([
    {
      title: "Semester End Examination Schedule Released",
      content: "The semester end examination schedule has been published on the examination portal. Students are advised to download their hall tickets at the earliest.",
      category: "Examinations",
      audience: "student",
      createdByAdminId: adminUser.id,
    },
    {
      title: "Last Date for Semester Fee Payment Extended",
      content: "The last date for semester fee payment without late fine has been extended. Please complete your payment through the official college portal.",
      category: "Fees",
      audience: "student",
      createdByAdminId: adminUser.id,
    },
    {
      title: "Scholarship Application Window Open",
      content: "The scholarship application window for this academic year is now open. Eligible students should submit applications through the Scholarship Cell before the deadline.",
      category: "Scholarships",
      audience: "student",
      createdByAdminId: adminUser.id,
    },
    {
      title: "Campus Placement Drive Announcement",
      content: "Several companies will be visiting campus this month for placement drives. Final-year students should update their placement profiles and register through the Placement Cell.",
      category: "Placements",
      audience: "student",
      createdByAdminId: adminUser.id,
    },
    {
      title: "Hostel Mess Menu Updated",
      content: "The hostel mess menu has been revised based on student feedback. The updated menu is displayed on hostel notice boards.",
      category: "Hostel",
      audience: "student",
      createdByAdminId: adminUser.id,
    },
  ]);

  // ------------------------------------------------------------------
  // Sample chat history + AI interactions (for admin analytics demo data)
  // ------------------------------------------------------------------
  console.log("Seeding sample AI chat history...");
  const sampleChats: { userId: number; question: string; answer: string; category: string; requiresTicket: boolean }[] = [
    {
      userId: studentUser.id,
      question: "What is the minimum attendance requirement?",
      answer:
        "Students are expected to maintain the minimum attendance percentage prescribed by the institution. If you're short, you may need to follow the condonation procedure through the Academic Office.",
      category: "Attendance",
      requiresTicket: false,
    },
    {
      userId: extraStudents[0].user.id,
      question: "How do I check my attendance percentage?",
      answer: "Your attendance percentage is available on your student portal dashboard under the Attendance tab, updated per subject each semester.",
      category: "Attendance",
      requiresTicket: false,
    },
    {
      userId: extraStudents[1].user.id,
      question: "When are my semester exams?",
      answer: "Semester examination schedules are published by the Examination Cell on the official portal. Please check the latest notification for exact dates.",
      category: "Examinations",
      requiresTicket: false,
    },
    {
      userId: extraStudents[2].user.id,
      question: "How can I check scholarship information?",
      answer: "Scholarship eligibility and deadlines depend on the specific scheme. Please contact the Scholarship Cell for scheme-specific details.",
      category: "Scholarships",
      requiresTicket: false,
    },
    {
      userId: extraStudents[3].user.id,
      question: "How do I apply for a bonafide certificate?",
      answer: "You can request a bonafide certificate through the Academic Office's certificate request process.",
      category: "Certificates",
      requiresTicket: false,
    },
  ];

  for (const chat of sampleChats) {
    const [conversation] = await db
      .insert(chatConversations)
      .values({ userId: chat.userId, title: chat.question })
      .returning();
    await db.insert(chatMessages).values([
      { conversationId: conversation.id, role: "user", content: chat.question },
      { conversationId: conversation.id, role: "assistant", content: chat.answer, category: chat.category },
    ]);
    await db.insert(aiInteractions).values({
      conversationId: conversation.id,
      model: "gemini-3.6-flash",
      intent: `${chat.category.toLowerCase()}_question`,
      category: chat.category,
      confidence: 0.9,
      requiresTicket: chat.requiresTicket,
      fallbackUsed: false,
    });
  }

  console.log("\n✅ Seed complete.");
  console.log("\nDemo accounts:");
  console.log("  Student: student@mictech.edu.in / Student@123");
  console.log("  Admin:   admin@mictech.edu.in / Admin@123");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
