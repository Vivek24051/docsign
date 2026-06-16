import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import SavedSignature from "@/lib/models/SavedSignature";
import { logAudit } from "@/lib/audit";
import { apiSuccess, apiError } from "@/lib/response";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  await connectDB();
  const signature = await SavedSignature.findOne({ _id: id, userId: user.id });
  if (!signature) return apiError("Signature not found", 404);

  await signature.deleteOne();
  await logAudit({ userId: user.id, action: "signature.delete", request });

  return apiSuccess({ message: "Signature deleted" });
}
