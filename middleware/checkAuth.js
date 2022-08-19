const jwt = require("jsonwebtoken");
const HttpError = require("../models/httpError");

module.exports = (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) {
      throw new HttpError("Token authentication failed");
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.userData = { userId: decoded.userId };
      next();
    });
  } catch (err) {
    const error = new HttpError("Error at checkAuth", err.message);
    return next(error);
  }
};
