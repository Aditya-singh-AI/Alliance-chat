const express = require("express");
const http = require("http");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/dbConnect");
const initializeSocket = require("./services/socketService");

const authRoute = require("./routes/authRoute");
const chatRoute = require("./routes/chatroute");
const statusRoute = require("./routes/statusRoute");

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
const io = initializeSocket(server);

// CORS
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Attach Socket.IO instance and online users map to every request
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);
app.use("/api/status", statusRoute);

// JSON parse error handler
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid JSON in request body." });
  }
  next(err);
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
