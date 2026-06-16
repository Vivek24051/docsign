import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import DocumentModel from "@/lib/models/Document";
import AuditLog from "@/lib/models/AuditLog";
import { apiSuccess, apiError } from "@/lib/response";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") return apiError("Forbidden", 403);

  await connectDB();

  const [totalUsers, totalDocuments, signedDocuments, recentLogs] = await Promise.all([
    User.countDocuments(),
    DocumentModel.countDocuments(),
    DocumentModel.countDocuments({ status: "COMPLETED" }),
    AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email")
      .populate("documentId", "title")
      .lean(),
  ]);

  return apiSuccess({
    stats: {
      totalUsers,
      totalDocuments,
      signedDocuments,
      pendingDocuments: totalDocuments - signedDocuments,
    },
    recentActivity: recentLogs,
  });
}
