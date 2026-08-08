require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes = require('./routes/notificationRoutes');
const { startNotificationScheduler } = require("./services/notificationScheduler");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static("uploads"));

app.use(
  '/api/notifications',
  notificationRoutes,
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // startNotificationScheduler();
});