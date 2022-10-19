const mongoose = require("mongoose"),
  mongoUrl = process.env.MONGODB_URI;

const setup = require("./app/scripts/setup");

mongoose.Promise = global.Promise;
const connect = async () => {
  mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = mongoose.connection;
  db.on("error", () => {
    console.log("could not connect");
  });
  db.once("open", () => {
    setup()
    console.log("Successfully connected to database");
  });
};
module.exports = { connect };
