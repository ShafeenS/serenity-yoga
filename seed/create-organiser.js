// seed/create-organiser.js
// Run once after seeding to create a login-capable organiser account
// Usage: node seed/create-organiser.js
import bcrypt from "bcryptjs";
import { initDb, usersDb } from "../models/_db.js";
import { UserModel } from "../models/userModel.js";

await initDb();

const email = "organiser@yoga.local";
const password = "organiser123";

// Remove existing
await usersDb.remove({ email }, { multi: true });

const passwordHash = await bcrypt.hash(password, 12);
const user = await UserModel.create({
  name: "Studio Organiser",
  email,
  passwordHash,
  role: "organiser",
});

console.log("✅ Organiser account created");
console.log("   Email   :", email);
console.log("   Password:", password);
console.log("   ID      :", user._id);
process.exit(0);
