// routes/auth.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/userModel.js";

const router = Router();

// GET /auth/login
router.get("/login", (req, res) => {
  if (req.user) return res.redirect("/");
  res.render("auth/login", { title: "Log In", error: req.query.error });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findByEmail(email?.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.redirect("/auth/login?error=Invalid+email+or+password");
    }
    req.session.userId = user._id;
    res.redirect(user.role === "organiser" ? "/organiser" : "/");
  } catch (err) {
    console.error(err);
    res.redirect("/auth/login?error=Something+went+wrong");
  }
});

// GET /auth/register
router.get("/register", (req, res) => {
  if (req.user) return res.redirect("/");
  res.render("auth/register", { title: "Register", error: req.query.error });
});

// POST /auth/register
router.post("/register", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password)
    return res.redirect("/auth/register?error=All+fields+are+required");
  if (password !== confirmPassword)
    return res.redirect("/auth/register?error=Passwords+do+not+match");
  if (password.length < 8)
    return res.redirect("/auth/register?error=Password+must+be+at+least+8+characters");
  try {
    const existing = await UserModel.findByEmail(email.trim().toLowerCase());
    if (existing) return res.redirect("/auth/register?error=Email+already+registered");
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "student",
    });
    req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.redirect("/auth/register?error=Registration+failed");
  }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// GET /auth/logout (convenience link)
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

export default router;
