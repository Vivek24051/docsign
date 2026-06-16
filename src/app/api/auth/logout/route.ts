import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (user) {
    await logAudit({ userId: user.id, action: "user.logout", request });
  }

  const response = NextResponse.json({ success: true, data: null });
  response.cookies.set({ name: "auth_token", value: "", maxAge: 0, path: "/" });
  return response;
}
