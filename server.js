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
const helmet = require("helmet");
// helmet help hidden info when request api, hacker do not know what
//technology backend used
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

// Cấu hình Socket.IO
// io.on("connection", (socket) => {
//   console.log("A user connected");

//   // Xử lý bình luận ở đây
//   socket.on("comment", (data) => {
//     // Xử lý bình luận và gửi lại cho tất cả người dùng khác
//     io.emit("newComment", data);
//   });

//   // // Xử lý bình luận ở đây
//   // socket.on("ping", (n) => {
//   //   console.log(n);
//   // });

//   socket.on("disconnect", () => {
//     console.log("A user disconnected");
//   });
// });

// Khởi tạo và cấu hình socketManager
// socketManager.initializeSocket(io);

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
const uploadRouter = require("./src/api/v1/controllers/uploadController");
const AppError = require("./src/api/v1/utils/appError");

// const clientRedis = createClient();
dotenv.config();

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URL, {
  dbName: "movieDB",
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
app.use(express.static(path.join(__dirname, "public")));

// 1) GLOBAL MIDDLEWARES
// Implement CORS
// const corsOptions = {
//   origin: "*",
//   credentials: true,
//   // optionSuccessStatus: 200,
// };
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
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

// app.options("*", cors());
// app.options('/api/v1/tours/:id', cors());

// app.all("/", function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, DELETE, OPTIONS"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Range, Authorization, X-Requested-Width"
//   );
//   res.setHeader("Access-Control-Allow-Credentials", true);
//   next();
// });

// Middleware cho CORS
// Cấu hình CORS
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, DELETE, OPTIONS"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Range, Authorization, X-Requested-Width"
//   );
//   res.setHeader("Access-Control-Allow-Credentials", true);
//   next();
// });

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// :method :url :status :response-time ms - :res[content-length]
// app.use(morgan("combined"))

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

// Limit requests from same API
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
});
// app.use("/api", limiter);

// Body parser, reading data from body into req.body
// app.use(express.json({ limit: "10kb" }));
// app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
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
);
//ROUTES
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/movie", movieRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/comment", commentRoute);
app.use("/api/v1/notify", notifyRoute);
app.use("/upload", uploadRouter);
app.use("/hello", (req, res) => {
  res.send("hello");
});
app.use("/test", (req, res) => {
  res.status(200).json({
    mes: "ok",
  });
});

// video streaming

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/video", (req, res) => {
  const videoPath = __dirname + "/videos/" + "sauchiatay.mp4";
  console.log(videoPath);
  // Kiểm tra sự tồn tại của tệp video
  if (!fs.existsSync(videoPath)) {
    res.status(404).send("Video not found");
    return;
  }
  const videoSize = fs.statSync(videoPath).size;

  const range = req.headers.range;
  console.log(">>> range <<<", range);
  if (!range) {
    res.status(400).send("requires range header");
  }

  const CHUNK_SIZE = 10 ** 6; //1mb
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;

  // Tạo header cho response
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  // Thiết lập header và status code
  res.writeHead(206, headers);

  try {
    // Đọc tệp video và stream đến client
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
  } catch (err) {
    console.error("Error streaming video:", err);
    res.status(500).send("Error streaming video");
  }
});

// app.get("/video/:videoName", (req, res) => {
//   const range = req.headers.range;
//   if (!range) {
//     res.status(400).send("requires range header");
//     return;
//   }

//   const videoName = req.params.videoName;
//   const videoPath = __dirname + "/videos/" + videoName; // Đường dẫn đến tệp video

//   if (!fs.existsSync(videoPath)) {
//     res.status(404).send("File not found");
//     return;
//   }

//   const videoSize = fs.statSync(videoPath).size;

//   const CHUNK_SIZE = 10 ** 6; //1mb
//   const start = Number(range.replace(/\D/g, ""));
//   const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
//   const contentLength = end - start + 1;
//   const headers = {
//     "Content-Range": `bytes ${start}-${end}/${videoSize}`,
//     "Accept-Ranges": "bytes",
//     "Content-Length": contentLength,
//     "Content-Type": "video/mp4",
//   };
//   res.writeHead(206, headers);
//   const videoStream = fs.createReadStream(videoPath, { start, end });
//   videoStream.pipe(res);
// });

// app.get('/handler', asyncHandler(async (req, res, next) => {
// 	res.status(200).json({
//         mes: 'ok'
//     })
//     // next()
// }))

//catch errors
app.use((req, res, next) => {
  res.status(400).json({
    code: 400,
    mes: "Not found",
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

// app.use(globalErrorHandler);

// app.listen(3000, () => {
//   console.log("API is running on port 3000");
// });

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  httpServer.listen(8000, () => console.log(`Server running on port 8000`));
});
