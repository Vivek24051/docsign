import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DocumentModel from "@/lib/models/Document";
import AuditLog from "@/lib/models/AuditLog";
import { logAudit } from "@/lib/audit";
import { apiSuccess, apiError } from "@/lib/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  await connectDB();

  const document = await DocumentModel.findOne({ _id: id, userId: user.id });
  if (!document) return apiError("Document not found", 404);

  const auditLogs = await AuditLog.find({ documentId: id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("userId", "name email")
    .lean();

  await logAudit({ userId: user.id, documentId: id, action: "document.view", request });

  return apiSuccess({ document: document.toJSON(), auditLogs });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  await connectDB();

  const document = await DocumentModel.findOne({ _id: id, userId: user.id });
  if (!document) return apiError("Document not found", 404);

  const title = document.title;
  await document.deleteOne();

  await logAudit({
    userId: user.id,
    documentId: id,
    action: "document.delete",
    metadata: { title },
    request,
  });

  return apiSuccess({ message: "Document deleted" });
}
