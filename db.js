const mongoose = require("mongoose"),
  { mongodbUrl } = require("./app/config");
const setup = require("./app/scripts/setup");

mongoose.Promise = global.Promise;
const connect = async () => {
  mongoose.connect(mongodbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = mongoose.connection;
  db.on("error", () => {
    console.log("could not connect");
  });
  db.once("open", () => {
    setup();
    console.log("Successfully connected to database");
  });
};
module.exports = { connect };
