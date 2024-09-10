const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRouter = require("./routes/api/auth");
const foodRouter = require("./routes/api/food");

const connectionString = process.env.MONGO_URI;

mongoose.connect(connectionString, {
  dbName: "Health_DB",
})
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/food/users", authRouter);
app.use("/food", foodRouter);


module.exports = app;


