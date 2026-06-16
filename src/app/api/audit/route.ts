import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import AuditLog from "@/lib/models/AuditLog";
import { apiSuccess, apiError } from "@/lib/response";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { userId: user.id };
  if (documentId) filter.documentId = documentId;

  await connectDB();

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("documentId", "title")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return apiSuccess({ logs, total, page, limit });
}
