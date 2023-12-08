const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
// const asyncHandler = require('express-async-handler')
var morgan = require("morgan");
const helmet = require("helmet"); // helmet help hidden info when request api, hacker do not know what
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const ffmpeg = require("fluent-ffmpeg");
// const { createClient } = require("redis");
// const Redis = require("redis");
require("express-async-errors");
// const socketIo = require("socket.io");
// const socketManager = require("./src/api/v1/utils/socketRT");
const CommentServices = require("./src/api/v1/services/comment");
// const redisClient = Redis.createClient();

const app = express();
const httpServer = require("http").createServer(app); // Tạo HTTP server

const serviceAccount = require("./src/config/service-firebase-admin.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "prj-cv-film.appspot.com", // Thay thế bằng ID ứng dụng Firebase của bạn
  // databaseURL: "https://movie-the-stone-d9f38-default-rtdb.firebaseio.com",
});

const authRoute = require("./src/api/v1/routes/auth");
const userRoute = require("./src/api/v1/routes/user");
const movieRoute = require("./src/api/v1/routes/movie");
const categoryRoute = require("./src/api/v1/routes/category");
const commentRoute = require("./src/api/v1/routes/comment");
const notifyRoute = require("./src/api/v1/routes/notification");
const infoShotflixRoute = require("./src/api/v1/routes/infoShotflix");
const uploadRouter = require("./src/api/v1/controllers/uploadController");
const AppError = require("./src/api/v1/utils/appError");

// const clientRedis = createClient();
dotenv.config();
const PORT = process.env.PORT || 5000;

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URL, {
  dbName: "movieDB",
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
app.use(express.static(path.join(__dirname, "public")));

const allowedOrigins = [
  "http://localhost:3001",
  "http://localhost:3002",
  "https://fe-shotflix.vercel.app/",
  "https://fe-shotflix.vercel.app",
  "https://fe-shotflix-ar.vercel.app",
  "https://fe-shotflix-ar.vercel.app/",
  "http://14.225.207.61:3001",
  "http://14.225.207.61:3001/",
  "http://shotflix.vn",
  "http://shotflix.vn/",
  "http://www.shotflix.vn",
  "http://www.shotflix.vn/",
  "https://www.shotflix.vn",
  "https://www.shotflix.vn/",
  "https://shotflix.vn",
  "https://shotflix.vn/",
  // "https://afraid-goats-switch.loca.lt",
];
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};

const credentials = (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Credentials", true);
  }
  next();
};

app.use(credentials);
app.use(cors(corsOptions));
app.use(helmet()); // Set security HTTP headers
// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} // :method :url :status :response-time ms - :res[content-length]

// SOCKET
// const io = require("socket.io")(httpServer, {
//   cors: {
//     origin: "*",
//     // origin: "https://fe-shotflix.vercel.app",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   },
// });
// global._io = io;
// global._io.on("connection", CommentServices.connection);

const limiter = rateLimit({
  max: 50,
  windowMs: 100 * 60 * 1000,
  // message: "Too many requests from this IP, please try again in an hour!",
  handler: function (req, res) {
    res.status(429).send({
      status: 500,
      message: "Too many requests!",
    });
  },
}); // Limit requests from same API
// app.use("/api", limiter);

// Body parser, reading data from body into req.body
// app.use(express.json({ limit: "10kb" }));
// app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(xss()); // Data sanitization against XSS
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
); // Prevent parameter pollution

//ROUTES
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/movie", movieRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/comment", commentRoute);
app.use("/api/v1/notify", notifyRoute);
app.use("/api/v1/info_shotflix", infoShotflixRoute);
app.use("/upload", uploadRouter);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

//catch errors
app.use((req, res, next) => {
  res.status(400).json({
    code: 400,
    mes: "Not foundd",
  });
});
app.use((err, req, res, next) => {
  res.json({
    code: err.status || 500,
    mes: err.message || "error in last middleware",
  });
});

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
