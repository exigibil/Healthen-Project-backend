const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
require("dotenv").config();

const authRouter = require("./routes/api/auth");
const foodRouter = require("./routes/api/food");

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Documentation',
    version: '1.0.0',
    description: 'API documentation for your project',
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Food server',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/api/*.js'], 
};

const swaggerSpec = swaggerJSDoc(options);

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

// Rutele API
app.use("/food/users", authRouter);
app.use("/food", foodRouter);

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;


// http://localhost:8000/api-docs/#/