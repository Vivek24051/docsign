import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import SavedSignature from "@/lib/models/SavedSignature";
import { logAudit } from "@/lib/audit";
import { apiSuccess, apiError } from "@/lib/response";

const saveSchema = z.object({
  name: z.string().min(1, "Signature name is required"),
  signatureData: z.string().min(1, "Signature data is required"),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  await connectDB();
  const signatures = await SavedSignature.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .lean();

  const sigs = signatures.map((s) => ({ ...s, id: (s._id as { toString(): string }).toString() }));
  return apiSuccess({ signatures: sigs });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  await connectDB();
  const signature = await SavedSignature.create({ userId: user.id, ...parsed.data });

  await logAudit({ userId: user.id, action: "signature.save", request });

  return apiSuccess({ signature: signature.toJSON() }, 201);
}
