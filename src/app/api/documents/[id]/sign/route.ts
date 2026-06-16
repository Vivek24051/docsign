import { NextRequest } from "next/server";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import DocumentModel from "@/lib/models/Document";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { logAudit } from "@/lib/audit";
import { apiSuccess, apiError } from "@/lib/response";

const signSchema = z.object({
  signatures: z
    .array(
      z.object({
        page: z.number().min(0),
        x: z.number(),
        y: z.number(),
        width: z.number().min(10),
        height: z.number().min(10),
        signatureData: z.string().min(1),
        savedSignatureId: z.string().optional(),
      })
    )
    .min(1, "At least one signature is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = signSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message);

    const { signatures } = parsed.data;

    await connectDB();

    const document = await DocumentModel.findOne({ _id: id, userId: user.id });
    if (!document) return apiError("Document not found", 404);
    if (document.status === "COMPLETED") return apiError("Document already signed");

    // Fetch original PDF
    const pdfResponse = await fetch(document.originalUrl);
    if (!pdfResponse.ok) return apiError("Failed to fetch original document", 500);

    const pdfBytes = await pdfResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Embed each signature into PDF
    for (const sig of signatures) {
      if (sig.page < 0 || sig.page >= pages.length) continue;
      const page = pages[sig.page];
      const { height: pageHeight } = page.getSize();

      const base64Data = sig.signatureData.replace(/^data:image\/\w+;base64,/, "");
      const sigBuffer = Buffer.from(base64Data, "base64");
      const embeddedImage = await pdfDoc.embedPng(sigBuffer);

      // Convert top-left canvas coords → bottom-left PDF coords
      const pdfY = pageHeight - sig.y - sig.height;
      page.drawImage(embeddedImage, { x: sig.x, y: pdfY, width: sig.width, height: sig.height });
    }

    const signedPdfBytes = await pdfDoc.save();
    const { url: signedUrl } = await uploadToCloudinary(Buffer.from(signedPdfBytes), {
      folder: `docsign/${user.id}/signed`,
      resourceType: "raw",
    });

    // Update document with signed URL and embedded signatures
    document.signedUrl = signedUrl;
    document.status = "COMPLETED";
    document.signatures = signatures.map((sig) => ({
      savedSignatureId: sig.savedSignatureId
        ? new (require("mongoose").Types.ObjectId)(sig.savedSignatureId)
        : undefined,
      signatureData: sig.signatureData,
      page: sig.page,
      x: sig.x,
      y: sig.y,
      width: sig.width,
      height: sig.height,
      signedAt: new Date(),
    }));
    await document.save();

    await logAudit({
      userId: user.id,
      documentId: id,
      action: "document.sign",
      metadata: { signatureCount: signatures.length },
      request,
    });

    return apiSuccess({ message: "Document signed successfully", signedUrl });
  } catch (err) {
    console.error("Sign error:", err);
    return apiError("Failed to sign document. Please try again.", 500);
  }
}
