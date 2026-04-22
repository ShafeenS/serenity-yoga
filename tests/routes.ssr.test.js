// tests/routes.ssr.test.js
import request from "supertest";
import { app } from "../index.js";
import { resetDb, seedMinimal } from "./helpers.js";

describe("SSR view routes", () => {
  let data;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
    data = await seedMinimal();
  });

  test("GET / (home) renders HTML with course listing", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Serenity Yoga|Upcoming Courses/i);
  });

  test("GET /courses lists courses page with Test Course", async () => {
    const res = await request(app).get("/courses");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Test Course/);
  });

  test("GET /courses with level filter still returns HTML", async () => {
    const res = await request(app).get("/courses?level=beginner");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Test Course/);
  });

  test("GET /courses/:id renders course detail page", async () => {
    const res = await request(app).get(`/courses/${data.course._id}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Test Course/);
  });

  test("GET /courses/:id shows session table", async () => {
    const res = await request(app).get(`/courses/${data.course._id}`);
    expect(res.text).toMatch(/Sessions/i);
  });

  test("GET /courses/nonexistent returns 404", async () => {
    const res = await request(app).get("/courses/doesnotexist123");
    expect(res.status).toBe(404);
  });

  test("GET /auth/login renders login page", async () => {
    const res = await request(app).get("/auth/login");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Sign in|Log in/i);
  });

  test("GET /auth/register renders register page", async () => {
    const res = await request(app).get("/auth/register");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Register|Create account/i);
  });

  test("GET /my-bookings redirects unauthenticated user to login", async () => {
    const res = await request(app).get("/my-bookings");
    expect([302, 301]).toContain(res.status);
    expect(res.headers.location).toMatch(/login/);
  });

  test("GET /organiser redirects unauthenticated user", async () => {
    const res = await request(app).get("/organiser");
    expect([302, 301, 403]).toContain(res.status);
  });

  test("GET /nonexistent returns 404 HTML", async () => {
    const res = await request(app).get("/this-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/html/);
  });
});
