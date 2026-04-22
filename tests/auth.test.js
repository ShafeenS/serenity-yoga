// tests/auth.test.js
import request from "supertest";
import { app } from "../index.js";
import { resetDb } from "./helpers.js";

describe("Authentication routes", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
  });

  test("POST /auth/register creates account and redirects", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "newuser@test.local",
      password: "securepass1",
      confirmPassword: "securepass1",
    });
    expect([302, 301]).toContain(res.status);
    // Should redirect home, not back to register with error
    expect(res.headers.location).not.toMatch(/error/);
  });

  test("POST /auth/register rejects mismatched passwords", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Bad User",
      email: "bad@test.local",
      password: "password1",
      confirmPassword: "password2",
    });
    expect([302, 301]).toContain(res.status);
    expect(res.headers.location).toMatch(/error/);
  });

  test("POST /auth/register rejects short password", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Short Pass",
      email: "short@test.local",
      password: "abc",
      confirmPassword: "abc",
    });
    expect([302, 301]).toContain(res.status);
    expect(res.headers.location).toMatch(/error/);
  });

  test("POST /auth/register rejects duplicate email", async () => {
    // Register once
    await request(app).post("/auth/register").send({
      name: "First", email: "dup@test.local",
      password: "password123", confirmPassword: "password123",
    });
    // Try again with same email
    const res = await request(app).post("/auth/register").send({
      name: "Second", email: "dup@test.local",
      password: "password123", confirmPassword: "password123",
    });
    expect([302, 301]).toContain(res.status);
    expect(res.headers.location).toMatch(/error/);
  });

  test("POST /auth/login with wrong password redirects with error", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "newuser@test.local",
      password: "wrongpassword",
    });
    expect([302, 301]).toContain(res.status);
    expect(res.headers.location).toMatch(/error/);
  });

  test("POST /auth/login with unknown email redirects with error", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "nobody@test.local",
      password: "whatever",
    });
    expect([302, 301]).toContain(res.status);
    expect(res.headers.location).toMatch(/error/);
  });
});
