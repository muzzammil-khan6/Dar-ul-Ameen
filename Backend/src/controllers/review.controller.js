const Review = require("../models/review.model");
const Booking = require("../models/booking.model");

// POST /api/reviews - Create review (Student)
async function createReview(req, res) {
  try {
    const studentId = req.user._id.toString();
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({
        message: "Booking ID, rating (1-5), and comment are required",
      });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      booking.student.toString() !== studentId &&
      !req.user.role.includes("admin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to review this booking" });
    }

    // Only on completed booking
    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "Reviews can only be given for completed bookings",
      });
    }

    // One review per booking
    const existing = await Review.findOne({ booking: bookingId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this booking" });
    }

    const review = await Review.create({
      booking: bookingId,
      student: booking.student,
      teacher: booking.teacher,
      rating: numRating,
      comment: comment.trim(),
    });

    return res.status(201).json({
      message: "Review submitted successfully!",
      review,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to submit review", error: error.message });
  }
}

module.exports = {
  createReview,
};
