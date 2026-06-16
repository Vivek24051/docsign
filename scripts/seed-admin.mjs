import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: "USER" },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const ADMIN_EMAIL = "admin@docsign.com";
const ADMIN_PASSWORD = "Admin@123";
const ADMIN_NAME = "Admin";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    existing.role = "ADMIN";
    await existing.save();
    console.log(`✅ Updated existing user "${ADMIN_EMAIL}" to ADMIN role`);
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: hashed, role: "ADMIN" });
    console.log(`✅ Created admin user: ${ADMIN_EMAIL}`);
  }

  console.log("─────────────────────────────");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log("─────────────────────────────");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
