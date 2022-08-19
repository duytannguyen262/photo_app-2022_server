const jwt = require("jsonwebtoken");

const User = require("../models/user");

const refreshToken = async (req, res, next) => {
  const { cookies } = req;
  if (!cookies?.jwt) return res.status(401).json({ message: "No token" });
  const refreshToken = cookies.jwt;
  const foundUser = await User.findOne({ refreshToken });
  if (!foundUser) return res.status(401).json({ message: "No user" });

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || foundUser.id !== decoded.userId)
      return res.status(401).json({ message: "Error verifying refresh token" });
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXP }
    );
    res.status(200).json({ accessToken });
  });
};

module.exports = { refreshToken };
