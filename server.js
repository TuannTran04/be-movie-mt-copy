const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const fs = require('fs')
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
// const asyncHandler = require('express-async-handler')
var morgan = require("morgan");
const helmet = require("helmet");
// helmet help hidden info when request api, hacker do not know what
//technology backend used
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const serviceAccount = require("./src/config/service-firebase-admin.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "movie-the-stone.appspot.com", // Thay thế bằng ID ứng dụng Firebase của bạn
});
const authRoute = require("./src/api/v1/routes/auth");
const userRoute = require("./src/api/v1/routes/user");
const movieRoute = require("./src/api/v1/routes/movie");
const categoryRoute = require("./src/api/v1/routes/category");
const uploadRouter = require("./src/api/v1/controllers/uploadController");
const AppError = require("./src/api/v1/utils/appError");
const {createClient} = require('redis')

const clientRedis = createClient();
dotenv.config();
require("express-async-errors");

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URL, {
  dbName: "movieDB",
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
app.use(express.static(path.join(__dirname, "public")));
// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

app.options("*", cors());
// app.options('/api/v1/tours/:id', cors());

// Serving static files
// app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// :method :url :status :response-time ms - :res[content-length]
// app.use(morgan("combined"))

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

app.get('/',(req,res)=> {
  res.sendFile(__dirname + "/index.html")
})
app.get("/video", (req,res)=>{
  console.log(req.body)
  const range = req.headers.range
  if(!range) {
    res.status(400).send("requires range header")
  }
  const videoPath = __dirname + "/videos/" + "riengminhanh.mp4";
  const videoSize = fs.statSync(__dirname + "/videos/"+"riengminhanh.mp4").size;


  
  const CHUNK_SIZE = 10 ** 6; //1mb
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1)
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range":`bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges":"bytes",
    "Content-Length":contentLength,
    "Content-Type":"video/mp4"
  };
  res.writeHead(206,headers)
  const videoStream = fs.createReadStream(videoPath ,{start,end})
  videoStream.pipe(res)
})
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
app.get("/video/:videoName", async (req, res) => {
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("requires range header");
    return;
  }

  const videoName = req.params.videoName // Thay thế bằng tên tệp video trên Firebase Storage
  const bucket = admin.storage().bucket();
  const videoFile = bucket.file(videoName);

  try {
    const [fileExists] = await videoFile.exists();
    if (!fileExists) {
      res.status(404).send("File not found");
      return;
    }

    const [metadata] = await videoFile.getMetadata();
    const videoSize = metadata.size;

    const CHUNK_SIZE = 10 ** 6; //1mb
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);

    const stream = videoFile.createReadStream({ start, end });
    stream.on("error", (err) => {
      console.error("Error streaming video:", err);
      res.status(500).end();
    });

    stream.pipe(res);
  } catch (error) {
    console.error("Error getting video metadata:", error);
    res.status(500).end();
  }
});

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

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(8000, () => console.log(`Server running on port 8000`));
});
