const express = require("express");
const path = require("path");
const cors = require("cors");
const corsOptions = require("./configs/corsOptions");
const credentials = require("./api/v1/middleware/credentials");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
// const createError = require("http-errors");
// const asyncHandler = require('express-async-handler')
const { v4: uuid } = require("uuid");
const logEvents = require("./api/v1/helpers/logEvents");
const morgan = require("morgan");
const compression = require("compression");
const helmet = require("helmet"); // helmet help hidden info when request api, hacker do not know what
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
// const YAML = require("yaml");
// const fs = require("fs");
const swaggerUI = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
// const file = fs.readFileSync(path.resolve("./shotflix-swagger.yaml"), "utf8");
// const swaggerDocument = YAML.parse(file);

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Hello World",
      version: "1.0.11",
    },
    servers: [
      {
        url: "http://localhost:8000/api/v1",
        description: "Development Server",
      },
      // Thêm các servers khác nếu cần
    ],
  },
  apis: ["./openapi/*.yaml"], // files containing annotations as above
};

const openapiSpecification = swaggerJsdoc(options);
// const ffmpeg = require("fluent-ffmpeg");
// const { createClient } = require("redis");
// const Redis = require("redis");
require("express-async-errors");
// const socketIo = require("socket.io");
// const socketManager = require("./src/api/v1/utils/socketRT");
// const CommentServices = require("./v1/services/comment");
// const redisClient = Redis.createClient();
dotenv.config();
const app = express();
app.use(express.static(path.join(__dirname, "public")));

// const httpServer = require("http").createServer(app);

// INIT DATABASE
require("./api/v1/connections/init.mongodb");
const initRedis = require("./api/v1/connections/init.redis");
initRedis.initRedis();

// INIT FIREBASE
const serviceAccount = require("./configs/service-firebase-admin.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "prj-cv-film.appspot.com", // Thay thế bằng ID ứng dụng Firebase của bạn
  // databaseURL: "https://movie-the-stone-d9f38-default-rtdb.firebaseio.com",
});

// const clientRedis = createClient();

// SWAGGER UI
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(openapiSpecification));

// CORS
app.use(credentials);
app.use(cors(corsOptions));

// INIT MIDDLEWAREs
app.use(helmet()); // Set security HTTP headers
app.use(compression());
if (process.env.NODE_ENV === "dev") {
  app.use(morgan("dev"));
} // :method :url :status :response-time ms - :res[content-length] (Development logging)

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

// INIT ROUTES
app.use("/", require("./api/v1/routes/index.router"));

// CATCH ERROR
// app.use((req, res, next) => {
//   res.status(404).json({
//     status: 404,
//     message: "Not found!",
//   });
// });
// app.use((err, req, res, next) => {
//   logEvents(
//     `idError--- ${uuid()} --- ${req.url} --- ${req.method} --- ${err.message}`
//   );
//   res.status(err.status || 500).json({
//     status: err.status || 500,
//     message: err.message || "error in last middleware",
//   });
// });

// HANDLE ERROR
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;

  logEvents(
    `idError--- ${uuid()} --- ${req.url} --- ${req.method} --- ${error.message}`
  );

  console.log(error);

  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    stack: error.stack,
    message: error.message || "Internal server error",
  });
});

module.exports = app;
