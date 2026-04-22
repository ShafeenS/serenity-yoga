// tests/routes.api.test.js
import request from "supertest";
import { app } from "../index.js";
import { resetDb, seedMinimal } from "./helpers.js";
import { UserModel } from "../models/userModel.js";

describe("JSON API routes", () => {
  let data;
  let student;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
    data = await seedMinimal();
    student = await UserModel.create({
      name: "API Student",
      email: "api@student.local",
      role: "student",
    });
  });

  // ── COURSES ──────────────────────────────────────────────────
  test("GET /api/courses returns JSON array of courses", async () => {
    const res = await request(app).get("/api/courses");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(res.body.courses)).toBe(true);
    expect(res.body.courses.some((c) => c.title === "Test Course")).toBe(true);
  });

  test("POST /api/courses creates a new course", async () => {
    const res = await request(app).post("/api/courses").send({
      title: "API Created Course",
      level: "advanced",
      type: "WEEKEND_WORKSHOP",
      allowDropIn: false,
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      description: "Created via API in tests.",
    });
    expect(res.status).toBe(201);
    expect(res.body.course.title).toBe("API Created Course");
  });

  test("GET /api/courses/:id returns course with sessions", async () => {
    const res = await request(app).get(`/api/courses/${data.course._id}`);
    expect(res.status).toBe(200);
    expect(res.body.course._id).toBe(data.course._id);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBe(2);
  });

  test("GET /api/courses/:id with bad id returns 404", async () => {
    const res = await request(app).get("/api/courses/notarealid");
    expect(res.status).toBe(404);
  });

  // ── SESSIONS ─────────────────────────────────────────────────
  test("POST /api/sessions creates a session", async () => {
    const res = await request(app).post("/api/sessions").send({
      courseId: data.course._id,
      startDateTime: new Date("2026-03-01T18:30:00").toISOString(),
      endDateTime: new Date("2026-03-01T19:45:00").toISOString(),
      capacity: 16,
    });
    expect(res.status).toBe(201);
    expect(res.body.session.courseId).toBe(data.course._id);
  });

  test("GET /api/sessions/by-course/:courseId returns sessions", async () => {
    const res = await request(app).get(`/api/sessions/by-course/${data.course._id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBeGreaterThanOrEqual(2);
  });

  // ── BOOKINGS ─────────────────────────────────────────────────
  test("POST /api/bookings/course creates a CONFIRMED or WAITLISTED booking", async () => {
    const res = await request(app).post("/api/bookings/course").send({
      userId: student._id,
      courseId: data.course._id,
    });
    expect(res.status).toBe(201);
    expect(res.body.booking.type).toBe("COURSE");
    expect(["CONFIRMED", "WAITLISTED"]).toContain(res.body.booking.status);
  });

  test("POST /api/bookings/session creates a session booking", async () => {
    const res = await request(app).post("/api/bookings/session").send({
      userId: student._id,
      sessionId: data.sessions[0]._id,
    });
    expect(res.status).toBe(201);
    expect(res.body.booking.type).toBe("SESSION");
    expect(["CONFIRMED", "WAITLISTED"]).toContain(res.body.booking.status);
  });

  test("POST /api/bookings/session rejects drop-in when not allowed", async () => {
    // Create a no-dropin course with a session
    const { CourseModel } = await import("../models/courseModel.js");
    const { SessionModel } = await import("../models/sessionModel.js");
    const noDropin = await CourseModel.create({
      title: "No Drop-in Course", level: "beginner",
      type: "WEEKLY_BLOCK", allowDropIn: false,
    });
    const sess = await SessionModel.create({
      courseId: noDropin._id,
      startDateTime: new Date("2026-06-01T10:00:00").toISOString(),
      endDateTime: new Date("2026-06-01T11:00:00").toISOString(),
      capacity: 10, bookedCount: 0,
    });
    const res = await request(app).post("/api/bookings/session").send({
      userId: student._id,
      sessionId: sess._id,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/drop.in/i);
  });

  test("DELETE /api/bookings/:id cancels a booking", async () => {
    const create = await request(app).post("/api/bookings/session").send({
      userId: student._id,
      sessionId: data.sessions[1]._id,
    });
    expect(create.status).toBe(201);
    const bookingId = create.body.booking._id;

    const del = await request(app).delete(`/api/bookings/${bookingId}`);
    expect(del.status).toBe(200);
    expect(del.body.booking.status).toBe("CANCELLED");
  });
});
