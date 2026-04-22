// routes/views.js
import { Router } from "express";
import {
  homePage,
  courseDetailPage,
  postBookCourse,
  postBookSession,
  bookingConfirmationPage,
  myBookingsPage,
} from "../controllers/viewsController.js";
import { coursesListPage } from "../controllers/coursesListController.js";
import { BookingModel } from "../models/bookingModel.js";
import { SessionModel } from "../models/sessionModel.js";

const router = Router();

router.get("/", homePage);
router.get("/about", (req, res) => res.render("about", { title: "About Us" }));
router.get("/courses", coursesListPage);
router.get("/courses/:id", courseDetailPage);
router.post("/courses/:id/book", postBookCourse);
router.post("/sessions/:id/book", postBookSession);
router.get("/bookings/:bookingId", bookingConfirmationPage);

// Cancel a booking (student)
router.post("/bookings/:bookingId/cancel", async (req, res, next) => {
  try {
    if (!req.user) return res.redirect("/auth/login");
    const booking = await BookingModel.findById(req.params.bookingId);
    if (!booking) return res.redirect("/my-bookings");
    // Only let users cancel their own bookings
    if (booking.userId !== req.user._id)
      return res.status(403).render("error", { title: "Forbidden", message: "Not your booking." });
    if (booking.status === "CONFIRMED") {
      for (const sid of booking.sessionIds) {
        await SessionModel.incrementBookedCount(sid, -1);
      }
    }
    await BookingModel.cancel(req.params.bookingId);
    res.redirect("/my-bookings");
  } catch (err) { next(err); }
});

router.get("/my-bookings", myBookingsPage);

export default router;
