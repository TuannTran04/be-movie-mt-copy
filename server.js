const app = require("./src/app");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

process.on("SIGINT", () => {
  server.close(() => console.log("exit server express"));
});
