import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { signToken, setAuthCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { apiError } from "@/lib/response";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0].message);

    const { name, email, password } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) return apiError("An account with this email already exists");

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userObj = user.toJSON() as any;
    const token = signToken({ userId: userObj.id, email: userObj.email, role: userObj.role });
    const cookieOptions = setAuthCookie(token);

    await logAudit({ userId: userObj.id, action: "user.register", request });

    const response = NextResponse.json(
      { success: true, data: { user: userObj } },
      { status: 201 }
    );
    response.cookies.set(cookieOptions);
    return response;
  } catch {
    return apiError("Registration failed. Please try again.", 500);
  }
}
