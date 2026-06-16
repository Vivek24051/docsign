import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { logAudit } from "@/lib/audit";
import { apiSuccess, apiError } from "@/lib/response";

const schema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message);

    const { token, password } = parsed.data;

    await connectDB();
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) return apiError("Invalid or expired reset token.", 400);

    user.password = await bcrypt.hash(password, 12);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    await logAudit({ userId: user.id, action: "user.password_reset", request });

    return apiSuccess({ message: "Password reset successful. Please log in." });
  } catch {
    return apiError("Failed to reset password.", 500);
  }
}
