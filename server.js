require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sequelize = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require('cookie-parser');


const app = express();

// Set up CORS
app.use(cors({
  origin: 'http://localhost:5173', // Allow only your frontend
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));

// Parse incoming requests with JSON payload
app.use(bodyParser.json());
app.use(cookieParser()); 


// Route handling
app.use("/user", userRoutes);
app.use("/auth", authRoutes);


// Sync Sequelize and start server
sequelize.sync()
  .then(() => {
    console.log("Database connected successfully!");
    app.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

