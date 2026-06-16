import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DocumentModel from "@/lib/models/Document";
import { apiSuccess, apiError } from "@/lib/response";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { userId: user.id };
  if (status) filter.status = status;

  await connectDB();

  const [documents, total] = await Promise.all([
    DocumentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-signatures.signatureData")
      .lean(),
    DocumentModel.countDocuments(filter),
  ]);

  const docs = documents.map((d) => ({ ...d, id: (d._id as { toString(): string }).toString() }));

  return apiSuccess({ documents: docs, total, page, limit });
}
