import "server-only";
import { db } from "@/lib/db";
import { users, students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  return user ?? null;
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function getStudentProfile(userId: number) {
  const [row] = await db
    .select({
      id: students.id,
      userId: students.userId,
      studentId: students.studentId,
      department: students.department,
      program: students.program,
      year: students.year,
      section: students.section,
      admissionYear: students.admissionYear,
      name: users.name,
      email: users.email,
      phone: users.phone,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.userId, userId));
  return row ?? null;
}

export async function listAllStudents() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      studentId: students.studentId,
      department: students.department,
      program: students.program,
      year: students.year,
      section: students.section,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .orderBy(users.name);
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

export async function updateUserProfile(userId: number, input: UpdateProfileInput) {
  const [updated] = await db
    .update(users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated ?? null;
}
