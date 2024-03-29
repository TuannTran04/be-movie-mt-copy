"use strict";

const mongoose = require("mongoose");

// count connect
const countConnect = () => {
  const numConnection = mongoose.connections.length;
  console.log(`Number of connections mongoDB:: ${numConnection}`);
};

module.exports = { countConnect };
