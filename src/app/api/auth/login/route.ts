import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { signToken, setAuthCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { apiError } from "@/lib/response";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message);

    const { email, password } = parsed.data;

    await connectDB();

    const user = await User.findOne({ email }).select("+password");
    if (!user) return apiError("Invalid email or password", 401);

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return apiError("Invalid email or password", 401);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userObj = user.toJSON() as any;
    const token = signToken({ userId: userObj.id, email: userObj.email, role: userObj.role });
    const cookieOptions = setAuthCookie(token);

    await logAudit({ userId: userObj.id, action: "user.login", request });

    const response = NextResponse.json({ success: true, data: { user: userObj } });
    response.cookies.set(cookieOptions);
    return response;
  } catch {
    return apiError("Login failed. Please try again.", 500);
  }
}
