import { NextRequest } from "next/server";
import { connectDB } from "./db";
import AuditLog from "./models/AuditLog";

export type AuditAction =
  | "user.register"
  | "user.login"
  | "user.logout"
  | "user.password_reset_request"
  | "user.password_reset"
  | "document.upload"
  | "document.view"
  | "document.sign"
  | "document.download"
  | "document.delete"
  | "signature.save"
  | "signature.delete";

export async function logAudit({
  userId,
  documentId,
  action,
  metadata,
  request,
}: {
  userId?: string;
  documentId?: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
}) {
  try {
    await connectDB();
    const ipAddress =
      request?.headers.get("x-forwarded-for") ||
      request?.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request?.headers.get("user-agent") || undefined;

    await AuditLog.create({
      userId: userId || undefined,
      documentId: documentId || undefined,
      action,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch {
    // Audit log failures should never break the main flow
  }
}
