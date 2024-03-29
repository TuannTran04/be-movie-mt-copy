const mongoose = require("mongoose");

const {
  db: { host, name, port },
} = require("../../../configs/config.mongodb");
const connectionString = `mongodb+srv://tuantran:0961818762tuann@cluster0.6ljlwx6.mongodb.net/?retryWrites=true&w=majority`;
// console.log(name);

const { countConnect } = require("../helpers/check.connect");

class Database {
  constructor() {
    this.connect();
  }

  // Connect
  connect(type = "mongodb") {
    mongoose
      ?.connect(connectionString, {
        dbName: name,
      })
      .then((_) =>
        console.log("connected monggodb successfully", countConnect())
      )
      .catch((err) => console.log("error connect mongodb"));
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb;
