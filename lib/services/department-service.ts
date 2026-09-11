import "server-only";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function listDepartments() {
  return db.select().from(departments).orderBy(departments.name);
}

export async function getDepartmentByName(name: string) {
  const [dept] = await db.select().from(departments).where(eq(departments.name, name));
  return dept ?? null;
}

export async function getDepartmentById(id: number) {
  const [dept] = await db.select().from(departments).where(eq(departments.id, id));
  return dept ?? null;
}
