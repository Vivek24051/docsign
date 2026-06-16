import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DocumentModel from "@/lib/models/Document";
import { logAudit } from "@/lib/audit";
import { apiError } from "@/lib/response";

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

  const downloadUrl = document.signedUrl || document.originalUrl;

  const fileResponse = await fetch(downloadUrl);
  if (!fileResponse.ok) return apiError("File not available", 500);

  const fileBuffer = await fileResponse.arrayBuffer();
  const filename = `${document.title}${document.signedUrl ? "_signed" : ""}.pdf`;

  await logAudit({ userId: user.id, documentId: id, action: "document.download", request });

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": fileBuffer.byteLength.toString(),
    },
  });
}
