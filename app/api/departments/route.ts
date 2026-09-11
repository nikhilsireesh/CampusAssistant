import { requireApiSession } from "@/lib/auth/api-guards";
import { listDepartments } from "@/lib/services/department-service";
import { apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async () => {
  await requireApiSession();
  const departments = await listDepartments();
  return apiSuccess({ departments });
});
