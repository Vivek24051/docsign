import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DocumentModel from "@/lib/models/Document";
import { apiSuccess, apiError } from "@/lib/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  await connectDB();

  const document = await DocumentModel.findOne({ verificationCode: code })
    .populate("userId", "name email")
    .select("title status verificationCode createdAt signatures userId");

  if (!document) return apiError("Document not found or verification code is invalid", 404);

  const doc = document.toJSON();

  return apiSuccess({
    document: {
      ...doc,
      user: doc.userId,   // populate renames field to userId, page expects user
      userId: undefined,
      isValid: doc.status === "COMPLETED",
      signedAt: doc.signatures?.[0]?.signedAt || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signatures: (doc.signatures || []).map((s: any) => ({
        page: s.page,
        signedAt: s.signedAt,
      })),
    },
  });
}
