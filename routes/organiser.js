// routes/organiser.js
import { Router } from "express";
import { requireOrganiser } from "../middlewares/auth.js";
import {
  dashboardPage,
  coursesPage, newCoursePage, createCourse, editCoursePage, updateCourse, deleteCourse,
  sessionsPage, addSession, deleteSession,
  classListPage,
  usersPage, addOrganiser, deleteUser,
} from "../controllers/organiserController.js";

const router = Router();
router.use(requireOrganiser); // all organiser routes need organiser role

router.get("/", dashboardPage);

// Courses
router.get("/courses", coursesPage);
router.get("/courses/new", newCoursePage);
router.post("/courses", createCourse);
router.get("/courses/:id/edit", editCoursePage);
router.post("/courses/:id", (req, res, next) => {
  // HTML forms can't send PUT, so we use ?_method=PUT trick
  if (req.query._method === "PUT") return updateCourse(req, res, next);
  next();
});
router.post("/courses/:id/delete", deleteCourse);

// Sessions
router.get("/courses/:courseId/sessions", sessionsPage);
router.post("/courses/:courseId/sessions", addSession);
router.post("/courses/:courseId/sessions/:sessionId/delete", deleteSession);

// Class list
router.get("/courses/:courseId/sessions/:sessionId/list", classListPage);

// Users
router.get("/users", usersPage);
router.post("/users/add-organiser", addOrganiser);
router.post("/users/:id/delete", deleteUser);

export default router;
