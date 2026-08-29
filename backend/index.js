require("dotenv").config();

const express = require("express");
const http = require('http');
const cors = require("cors");
const {Server} = require('socket.io');
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const configureSocket = require('./services/socketService');
const { startNotificationScheduler } = require("./services/notificationScheduler");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: {origin: '*', methods: ['GET', 'POST']}});
app.set('io', io);
configureSocket(io);

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use('/api/chats', chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static("uploads"));

app.use(
  '/api/notifications',
  notificationRoutes,
);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // startNotificationScheduler();
  });
};

startServer();
