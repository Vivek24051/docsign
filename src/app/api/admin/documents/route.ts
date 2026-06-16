import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DocumentModel from "@/lib/models/Document";
import { apiSuccess, apiError } from "@/lib/response";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") return apiError("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  await connectDB();

  const [documents, total, stats] = await Promise.all([
    DocumentModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .select("-signatures.signatureData")
      .lean(),
    DocumentModel.countDocuments(),
    DocumentModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const docs = documents.map((d) => ({ ...d, id: (d._id as { toString(): string }).toString() }));

  return apiSuccess({ documents: docs, total, page, limit, stats });
}
