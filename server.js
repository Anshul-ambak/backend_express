require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sequelize = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/user", userRoutes);
app.use("/auth", authRoutes);

sequelize.sync().then(() => {
  app.listen(3000, () => console.log("Server running on port 3000"));
});
