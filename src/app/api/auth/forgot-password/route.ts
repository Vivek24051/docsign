import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";
import { apiSuccess, apiError } from "@/lib/response";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message);

    const { email } = parsed.data;

    await connectDB();
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return apiSuccess({ message: "If an account exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch {
      console.log(`[DEV] Password reset link: ${resetUrl}`);
    }

    await logAudit({ userId: user.id, action: "user.password_reset_request", request });

    return apiSuccess({ message: "If an account exists, a reset link has been sent." });
  } catch {
    return apiError("Failed to process request.", 500);
  }
}
