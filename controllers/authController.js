const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = async (user) => {
  const token = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
  await RefreshToken.create({ token, userId: user.id });
  return token;
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  res.json({ accessToken, refreshToken });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

  const storedToken = await RefreshToken.findOne({ where: { token: refreshToken } });
  if (!storedToken) return res.status(403).json({ message: "Invalid refresh token" });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ message: "Token expired" });

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  });
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  await RefreshToken.destroy({ where: { token: refreshToken } });
  res.json({ message: "Logged out" });
};
