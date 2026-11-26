const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 25, // Maintain up to 25 socket connections
      minPoolSize: 5,  // Maintain at least 5 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log("Connected to MongoDB with optimized connection pool");
  } catch (error) {
    console.error("Error connecting to DB:", error);
  }
};

module.exports = connectDB;
