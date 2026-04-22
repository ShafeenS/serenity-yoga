// index.js
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mustacheExpress from "mustache-express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";

import courseRoutes from "./routes/courses.js";
import sessionRoutes from "./routes/sessions.js";
import bookingRoutes from "./routes/bookings.js";
import viewRoutes from "./routes/views.js";
import authRoutes from "./routes/auth.js";
import organiserRoutes from "./routes/organiser.js";
import { attachUser } from "./middlewares/auth.js";
import { initDb } from "./models/_db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// View engine (Mustache)
app.engine(
  "mustache",
  mustacheExpress(path.join(__dirname, "views", "partials"), ".mustache")
);
app.set("view engine", "mustache");
app.set("views", path.join(__dirname, "views"));

// Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || "yoga-secret-key-change-in-prod",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

// Static files
app.use("/static", express.static(path.join(__dirname, "public")));

// Attach logged-in user to every request
app.use(attachUser);

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/organiser", organiserRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/", viewRoutes);

// 404 & 500
export const not_found = (req, res) =>
  res.status(404).render("error", { title: "Not found", message: "That page doesn't exist." });
export const server_error = (err, req, res, next) => {
  console.error(err);
  res.status(500).render("error", { title: "Server error", message: "Something went wrong." });
};
app.use(not_found);
app.use(server_error);

// Start server (not during tests)
if (process.env.NODE_ENV !== "test") {
  await initDb();
  await autoSeed();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`Yoga booking running on http://localhost:${PORT}`)
  );
}

// Auto-seed: if DB is empty (e.g. fresh Render deploy), create sample data + default organiser
async function autoSeed() {
  const { coursesDb, usersDb } = await import("./models/_db.js");
  const courseCount = await coursesDb.count({});
  if (courseCount > 0) return; // already seeded

  console.log("Empty DB detected — running auto-seed...");

  const { CourseModel } = await import("./models/courseModel.js");
  const { SessionModel } = await import("./models/sessionModel.js");
  const { UserModel } = await import("./models/userModel.js");
  const bcrypt = await import("bcryptjs");

  const iso = (d) => new Date(d).toISOString();

  // Default organiser
  const existing = await UserModel.findByEmail("organiser@yoga.local");
  if (!existing) {
    const passwordHash = await bcrypt.default.hash("organiser123", 12);
    await UserModel.create({
      name: "Studio Organiser",
      email: "organiser@yoga.local",
      passwordHash,
      role: "organiser",
    });
    console.log("Default organiser created: organiser@yoga.local / organiser123");
  }

  // Weekend workshop
  const workshop = await CourseModel.create({
    title: "Winter Mindfulness Workshop",
    level: "beginner",
    type: "WEEKEND_WORKSHOP",
    allowDropIn: false,
    startDate: "2026-06-14",
    endDate: "2026-06-15",
    description: "Two days of breath work, posture alignment and meditation. Suitable for all beginners.",
    price: "£180 per person",
    sessionIds: [],
  });
  const wSessions = [];
  const wBase = new Date("2026-06-14T09:00:00");
  for (let i = 0; i < 5; i++) {
    const start = new Date(wBase.getTime() + i * 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const s = await SessionModel.create({
      courseId: workshop._id, startDateTime: iso(start),
      endDateTime: iso(end), capacity: 20, bookedCount: 0,
    });
    wSessions.push(s._id);
  }
  await CourseModel.update(workshop._id, { sessionIds: wSessions });

  // Weekly block
  const weekly = await CourseModel.create({
    title: "12-Week Vinyasa Flow",
    level: "intermediate",
    type: "WEEKLY_BLOCK",
    allowDropIn: true,
    startDate: "2026-05-05",
    endDate: "2026-07-21",
    description: "Progressive sequences building strength and flexibility over 12 weeks. Drop-in welcome.",
    price: "£120 full course / £12 drop-in",
    sessionIds: [],
  });
  const wkSessions = [];
  const wkBase = new Date("2026-05-05T18:30:00");
  for (let i = 0; i < 12; i++) {
    const start = new Date(wkBase.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 75 * 60 * 1000);
    const s = await SessionModel.create({
      courseId: weekly._id, startDateTime: iso(start),
      endDateTime: iso(end), capacity: 18, bookedCount: 0,
    });
    wkSessions.push(s._id);
  }
  await CourseModel.update(weekly._id, { sessionIds: wkSessions });

  // Beginner Hatha
  const hatha = await CourseModel.create({
    title: "Beginner Hatha Yoga",
    level: "beginner",
    type: "WEEKLY_BLOCK",
    allowDropIn: true,
    startDate: "2026-05-07",
    endDate: "2026-06-25",
    description: "A gentle introduction to Hatha yoga. Focus on foundational poses and breathing techniques.",
    price: "£80 full course / £10 drop-in",
    sessionIds: [],
  });
  const hSessions = [];
  const hBase = new Date("2026-05-07T10:00:00");
  for (let i = 0; i < 8; i++) {
    const start = new Date(hBase.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const s = await SessionModel.create({
      courseId: hatha._id, startDateTime: iso(start),
      endDateTime: iso(end), capacity: 15, bookedCount: 0,
    });
    hSessions.push(s._id);
  }
  await CourseModel.update(hatha._id, { sessionIds: hSessions });

  console.log("Auto-seed complete. 3 courses created.");
}
