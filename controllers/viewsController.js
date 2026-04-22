// controllers/viewsController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { bookCourseForUser, bookSessionForUser } from "../services/bookingService.js";
import { BookingModel } from "../models/bookingModel.js";

const fmtDate = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });
const fmtDateOnly = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric", month: "short", day: "numeric",
  });

export const homePage = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();
    const cards = await Promise.all(
      courses.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        const nextSession = sessions[0];
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: c.type,
          allowDropIn: c.allowDropIn,
          startDate: c.startDate ? fmtDateOnly(c.startDate) : "",
          endDate: c.endDate ? fmtDateOnly(c.endDate) : "",
          nextSession: nextSession ? fmtDate(nextSession.startDateTime) : "TBA",
          sessionsCount: sessions.length,
          description: c.description,
        };
      })
    );
    res.render("home", { title: "Home", courses: cards });
  } catch (err) { next(err); }
};

export const courseDetailPage = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await CourseModel.findById(courseId);
    if (!course)
      return res.status(404).render("error", { title: "Not found", message: "Course not found" });

    const sessions = await SessionModel.listByCourse(courseId);
    const rows = sessions.map((s) => ({
      id: s._id,
      start: fmtDate(s.startDateTime),
      end: fmtDate(s.endDateTime),
      capacity: s.capacity,
      booked: s.bookedCount ?? 0,
      remaining: Math.max(0, (s.capacity ?? 0) - (s.bookedCount ?? 0)),
      isFull: (s.bookedCount ?? 0) >= (s.capacity ?? 0),
    }));

    res.render("course", {
      title: course.title,
      course: {
        id: course._id,
        title: course.title,
        level: course.level,
        type: course.type,
        allowDropIn: course.allowDropIn,
        startDate: course.startDate ? fmtDateOnly(course.startDate) : "",
        endDate: course.endDate ? fmtDateOnly(course.endDate) : "",
        description: course.description,
        price: course.price || "Contact us for pricing",
      },
      sessions: rows,
      sessionsCount: rows.length,
      hasSessions: rows.length > 0,
    });
  } catch (err) { next(err); }
};

export const postBookCourse = async (req, res, next) => {
  try {
    if (!req.user) return res.redirect("/auth/login");
    const courseId = req.params.id;
    const booking = await bookCourseForUser(req.user._id, courseId);
    res.redirect(`/bookings/${booking._id}?status=${booking.status}`);
  } catch (err) {
    res.status(400).render("error", { title: "Booking failed", message: err.message });
  }
};

export const postBookSession = async (req, res, next) => {
  try {
    if (!req.user) return res.redirect("/auth/login");
    const sessionId = req.params.id;
    const booking = await bookSessionForUser(req.user._id, sessionId);
    res.redirect(`/bookings/${booking._id}?status=${booking.status}`);
  } catch (err) {
    const message =
      err.code === "DROPIN_NOT_ALLOWED"
        ? "Drop-ins are not allowed for this course."
        : err.message;
    res.status(400).render("error", { title: "Booking failed", message });
  }
};

export const bookingConfirmationPage = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await BookingModel.findById(bookingId);
    if (!booking)
      return res.status(404).render("error", { title: "Not found", message: "Booking not found" });

    const status = req.query.status || booking.status;
    res.render("booking_confirmation", {
      title: "Booking Confirmation",
      booking: {
        id: booking._id,
        type: booking.type,
        status,
        createdAt: booking.createdAt ? fmtDate(booking.createdAt) : "",
      },
      isConfirmed: status === "CONFIRMED",
      isWaitlisted: status === "WAITLISTED",
    });
  } catch (err) { next(err); }
};

export const myBookingsPage = async (req, res, next) => {
  try {
    if (!req.user) return res.redirect("/auth/login");
    const bookings = await BookingModel.listByUser(req.user._id);
    const rows = await Promise.all(bookings.map(async (b) => {
      const course = b.courseId ? await (await import("../models/courseModel.js")).CourseModel.findById(b.courseId) : null;
      return {
        id: b._id,
        type: b.type,
        status: b.status,
        courseTitle: course?.title || "Unknown course",
        courseId: b.courseId,
        createdAt: b.createdAt ? fmtDate(b.createdAt) : "",
        isCancelled: b.status === "CANCELLED",
        isConfirmed: b.status === "CONFIRMED",
        isWaitlisted: b.status === "WAITLISTED",
      };
    }));
    res.render("my-bookings", { title: "My Bookings", bookings: rows });
  } catch (err) { next(err); }
};
