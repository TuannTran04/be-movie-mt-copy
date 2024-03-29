// // db.js
// const mongoose = require("mongoose");

// mongoose.set("strictQuery", false);

// mongoose
//   .connect(process.env.MONGODB_URL, {
//     dbName: "movieDB",
//     useUnifiedTopology: true,
//     useNewUrlParser: true,
//   })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((error) => console.error("MongoDB Connection Failure:", error));

// mongoose.connection.on("disconnected", () => {
//   console.log("Disconnected from MongoDB");
// });

// process.on("SIGINT", async () => {
//   await mongoose.connection.close();
//   console.log("Connection closed. Exiting process...");
//   process.exit(0);
// });

// module.exports = mongoose;
