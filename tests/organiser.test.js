// tests/organiser.test.js
import request from "supertest";
import { app } from "../index.js";
import { resetDb, seedMinimal, seedOrganiser } from "./helpers.js";

describe("Organiser access control", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
    await seedMinimal();
  });

  test("GET /organiser without login returns 302 or 403", async () => {
    const res = await request(app).get("/organiser");
    expect([302, 301, 403]).toContain(res.status);
  });

  test("GET /organiser/courses without login is blocked", async () => {
    const res = await request(app).get("/organiser/courses");
    expect([302, 301, 403]).toContain(res.status);
  });

  test("GET /organiser/users without login is blocked", async () => {
    const res = await request(app).get("/organiser/users");
    expect([302, 301, 403]).toContain(res.status);
  });
});
