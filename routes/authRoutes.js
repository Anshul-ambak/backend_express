const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken"); 

const router = express.Router();

// Generate access and refresh tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// Register User
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
  
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
  
      const { accessToken, refreshToken } = generateTokens(user);

      console.log(refreshToken);
  
    //   Store the refresh token in the database
      await RefreshToken.create({
        token: refreshToken,
        userId: user.id,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, // Set to true in production (for HTTPS)
        path: "/",
      });
  
  
      res.json({ accessToken, refreshToken });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
    
  router.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies.refreshToken; // Read refresh token from cookies

    if (!refreshToken) {
        return res.status(403).json({ message: "Refresh token required" });
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        // Check if the refresh token exists in the database
        const storedRefreshToken = await RefreshToken.findOne({
            where: { userId: user.id, token: refreshToken },
        });

        if (!storedRefreshToken) {
            return res.status(403).json({ message: "Invalid or expired refresh token" });
        }

        // Generate new tokens
        const { accessToken, newRefreshToken } = generateTokens(user);

        // Update the refresh token in the database
        await storedRefreshToken.update({ token: newRefreshToken });

        // Send new refresh token in HTTP-only cookie
        res.cookie("jwt", newRefreshToken, {
            httpOnly: true,
            secure: true, // Use true in production (HTTPS)
            sameSite: "Strict",
            path: "/",
        });

        res.json({ accessToken });
    } catch (err) {
        res.status(403).json({ message: "Invalid or expired refresh token" });
    }
});

  
  router.post("/logout", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });
  
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(403).json({ message: "Invalid user" });
      }
  
      // Remove the refresh token from the database
      await RefreshToken.destroy({ where: { userId: user.id, token: refreshToken } });
  
      res.json({ message: "Logged out successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error logging out" });
    }
  });
  

module.exports = router;
