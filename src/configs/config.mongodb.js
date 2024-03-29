"use strict";

const dev = {
  app: {
    port: process.env.DEV_APP_PORT || 8000,
  },
  db: {
    host: "localhost",
    port: 27017,
    name: process.env.DEV_DB_NAME || "movieDB",
  },
};

const pro = {
  app: {
    port: process.env.PRO_APP_PORT || 8000,
  },
  db: {
    host: "localhost",
    port: 27017,
    name: process.env.PRO_DB_NAME || "movieDB",
  },
};

const config = { dev, pro };
const env = process.env.NODE_ENV || "dev";

module.exports = config[env];
