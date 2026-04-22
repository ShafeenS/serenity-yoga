// middlewares/auth.js
// Reads the session cookie and attaches the user to req/res.locals
import { UserModel } from "../models/userModel.js";

export const attachUser = async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (userId) {
      const user = await UserModel.findById(userId);
      if (user) {
        req.user = user;
        res.locals.user = {
          ...user,
          isOrganiser: user.role === "organiser",
          isStudent: user.role === "student",
        };
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const requireLogin = (req, res, next) => {
  if (!req.user) return res.redirect("/auth/login");
  next();
};

export const requireOrganiser = (req, res, next) => {
  if (!req.user || req.user.role !== "organiser")
    return res.status(403).render("error", { title: "Access denied", message: "Organiser access required." });
  next();
};
