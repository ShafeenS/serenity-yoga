// controllers/organiserController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { UserModel } from "../models/userModel.js";
import { BookingModel } from "../models/bookingModel.js";
import bcrypt from "bcryptjs";

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString("en-GB", {
  weekday: "short", year: "numeric", month: "short",
  day: "numeric", hour: "2-digit", minute: "2-digit",
}) : "";

const fmtDateOnly = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", {
  year: "numeric", month: "short", day: "numeric",
}) : "";

// ── DASHBOARD HOME ──────────────────────────────────────────────
export const dashboardPage = async (req, res, next) => {
  try {
    const [courses, users] = await Promise.all([
      CourseModel.list(),
      UserModel.list(),
    ]);
    const sessions = await Promise.all(courses.map(c => SessionModel.listByCourse(c._id)));
    const totalSessions = sessions.reduce((a, s) => a + s.length, 0);
    const students = users.filter(u => u.role === "student");
    res.render("organiser/dashboard", {
      title: "Organiser Dashboard",
      stats: {
        courses: courses.length,
        sessions: totalSessions,
        students: students.length,
      },
    });
  } catch (err) { next(err); }
};

// ── COURSES ──────────────────────────────────────────────────────
export const coursesPage = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();
    const cards = await Promise.all(courses.map(async (c) => {
      const sessions = await SessionModel.listByCourse(c._id);
      return {
        id: c._id,
        title: c.title,
        level: c.level,
        type: c.type,
        startDate: fmtDateOnly(c.startDate),
        endDate: fmtDateOnly(c.endDate),
        sessionsCount: sessions.length,
      };
    }));
    res.render("organiser/courses", {
      title: "Manage Courses",
      courses: cards,
      flash: req.query.flash,
    });
  } catch (err) { next(err); }
};

export const newCoursePage = (req, res) => {
  res.render("organiser/course-form", {
    title: "Add New Course",
    action: "/organiser/courses",
    course: {},
    error: req.query.error,
  });
};

export const createCourse = async (req, res, next) => {
  try {
    const { title, description, level, type, allowDropIn, startDate, endDate, price } = req.body;
    if (!title || !level || !type)
      return res.redirect("/organiser/courses/new?error=Title%2C+level+and+type+are+required");
    await CourseModel.create({
      title: title.trim(),
      description: description?.trim() || "",
      level, type,
      allowDropIn: allowDropIn === "on" || allowDropIn === "true",
      startDate: startDate || null,
      endDate: endDate || null,
      price: price?.trim() || "",
      sessionIds: [],
    });
    res.redirect("/organiser/courses?flash=Course+created");
  } catch (err) { next(err); }
};

export const editCoursePage = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) return res.status(404).render("error", { title: "Not found", message: "Course not found" });
    res.render("organiser/course-form", {
      title: "Edit Course",
      action: `/organiser/courses/${course._id}?_method=PUT`,
      course: {
        ...course,
        id: course._id,
        isLevelBeginner: course.level === 'beginner',
        isLevelIntermediate: course.level === 'intermediate',
        isLevelAdvanced: course.level === 'advanced',
        isTypeWeekly: course.type === 'WEEKLY_BLOCK',
        isTypeWeekend: course.type === 'WEEKEND_WORKSHOP',
      },
      error: req.query.error,
      isEdit: true,
    });
  } catch (err) { next(err); }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { title, description, level, type, allowDropIn, startDate, endDate, price } = req.body;
    await CourseModel.update(req.params.id, {
      title: title.trim(), description: description?.trim() || "",
      level, type,
      allowDropIn: allowDropIn === "on" || allowDropIn === "true",
      startDate: startDate || null,
      endDate: endDate || null,
      price: price?.trim() || "",
    });
    res.redirect("/organiser/courses?flash=Course+updated");
  } catch (err) { next(err); }
};

export const deleteCourse = async (req, res, next) => {
  try {
    await SessionModel.deleteByCourse(req.params.id);
    await CourseModel.delete(req.params.id);
    res.redirect("/organiser/courses?flash=Course+deleted");
  } catch (err) { next(err); }
};

// ── SESSIONS ─────────────────────────────────────────────────────
export const sessionsPage = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const course = await CourseModel.findById(courseId);
    if (!course) return res.status(404).render("error", { title: "Not found", message: "Course not found" });
    const sessions = await SessionModel.listByCourse(courseId);
    const rows = sessions.map(s => ({
      id: s._id,
      start: fmtDate(s.startDateTime),
      end: fmtDate(s.endDateTime),
      startRaw: s.startDateTime ? s.startDateTime.slice(0, 16) : "",
      endRaw: s.endDateTime ? s.endDateTime.slice(0, 16) : "",
      capacity: s.capacity,
      booked: s.bookedCount ?? 0,
    }));
    res.render("organiser/sessions", {
      title: `Sessions — ${course.title}`,
      course: { id: course._id, title: course.title },
      sessions: rows,
      flash: req.query.flash,
      error: req.query.error,
    });
  } catch (err) { next(err); }
};

export const addSession = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const { startDateTime, endDateTime, capacity } = req.body;
    if (!startDateTime || !endDateTime || !capacity)
      return res.redirect(`/organiser/courses/${courseId}/sessions?error=All+fields+required`);
    const session = await SessionModel.create({
      courseId,
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      capacity: parseInt(capacity, 10),
      bookedCount: 0,
    });
    // Keep course.sessionIds in sync
    const course = await CourseModel.findById(courseId);
    await CourseModel.update(courseId, {
      sessionIds: [...(course.sessionIds || []), session._id],
    });
    res.redirect(`/organiser/courses/${courseId}/sessions?flash=Session+added`);
  } catch (err) { next(err); }
};

export const deleteSession = async (req, res, next) => {
  try {
    const { courseId, sessionId } = req.params;
    await SessionModel.delete(sessionId);
    const course = await CourseModel.findById(courseId);
    await CourseModel.update(courseId, {
      sessionIds: (course.sessionIds || []).filter(id => id !== sessionId),
    });
    res.redirect(`/organiser/courses/${courseId}/sessions?flash=Session+deleted`);
  } catch (err) { next(err); }
};

// ── CLASS LIST ────────────────────────────────────────────────────
export const classListPage = async (req, res, next) => {
  try {
    const { courseId, sessionId } = req.params;
    const [course, session] = await Promise.all([
      CourseModel.findById(courseId),
      SessionModel.findById(sessionId),
    ]);
    if (!course || !session)
      return res.status(404).render("error", { title: "Not found", message: "Course or session not found" });

    const bookings = await BookingModel.listBySession(sessionId);
    const participants = await Promise.all(
      bookings
        .filter(b => b.status !== "CANCELLED")
        .map(async (b) => {
          const user = await UserModel.findById(b.userId);
          return {
            name: user?.name || "Unknown",
            email: user?.email || "—",
            status: b.status,
            bookedAt: fmtDate(b.createdAt),
          };
        })
    );

    res.render("organiser/class-list", {
      title: `Class List — ${course.title}`,
      course: { id: course._id, title: course.title },
      session: {
        id: session._id,
        start: fmtDate(session.startDateTime),
        capacity: session.capacity,
      },
      participants,
      count: participants.length,
    });
  } catch (err) { next(err); }
};

// ── USERS ─────────────────────────────────────────────────────────
export const usersPage = async (req, res, next) => {
  try {
    const users = await UserModel.list();
    const rows = users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isSelf: u._id === req.user._id,
    }));
    res.render("organiser/users", {
      title: "Manage Users",
      users: rows,
      flash: req.query.flash,
      error: req.query.error,
    });
  } catch (err) { next(err); }
};

export const addOrganiser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.redirect("/organiser/users?error=All+fields+required");
    const existing = await UserModel.findByEmail(email.trim().toLowerCase());
    if (existing) return res.redirect("/organiser/users?error=Email+already+in+use");
    const passwordHash = await bcrypt.hash(password, 12);
    await UserModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "organiser",
    });
    res.redirect("/organiser/users?flash=Organiser+added");
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id)
      return res.redirect("/organiser/users?error=You+cannot+delete+your+own+account");
    await BookingModel.deleteByUser(req.params.id);
    await UserModel.delete(req.params.id);
    res.redirect("/organiser/users?flash=User+removed");
  } catch (err) { next(err); }
};
