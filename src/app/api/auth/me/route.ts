import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/response";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);
  return apiSuccess({ user });
}
