import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import DocumentModel from "@/lib/models/Document";
import { logAudit } from "@/lib/audit";
import { apiSuccess, apiError } from "@/lib/response";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return apiError("No file provided");
    if (file.type !== "application/pdf") return apiError("Only PDF files are allowed");
    if (file.size > 20 * 1024 * 1024) return apiError("File size must be under 20MB");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { url } = await uploadToCloudinary(buffer, {
      folder: `docsign/${user.id}/originals`,
      resourceType: "raw",
    });

    const title = file.name.replace(/\.pdf$/i, "");

    await connectDB();
    const document = await DocumentModel.create({
      userId: user.id,
      title,
      originalUrl: url,
      fileSize: file.size,
      status: "UPLOADED",
    });

    await logAudit({
      userId: user.id,
      documentId: document.id,
      action: "document.upload",
      metadata: { title, fileSize: file.size },
      request,
    });

    return apiSuccess({ document: document.toJSON() }, 201);
  } catch {
    return apiError("Upload failed. Please try again.", 500);
  }
}
