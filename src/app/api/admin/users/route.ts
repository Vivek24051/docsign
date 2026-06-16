import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
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

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select("id name email role createdAt").lean(),
    User.countDocuments(),
  ]);

  // Attach document counts
  const userIds = users.map((u) => u._id);
  const docCounts = await DocumentModel.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(docCounts.map((d) => [d._id.toString(), d.count]));

  const usersWithCount = users.map((u) => ({
    ...u,
    id: (u._id as { toString(): string }).toString(),
    _count: { documents: countMap.get((u._id as { toString(): string }).toString()) || 0 },
  }));

  return apiSuccess({ users: usersWithCount, total, page, limit });
}
