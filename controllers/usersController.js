const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/httpError");
const User = require("../models/user");

const getUsers = async (req, res) => {
  res.json({ users: await User.find() });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { name, email, password, confirmPassword } = req.body;

  let foundUser;
  try {
    foundUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong creating the user, please try again.",
      500
    );
    return next(error);
  }

  if (foundUser) {
    const error = new HttpError("User already exists, please try again.", 422);
    return next(error);
  }

  if (confirmPassword !== password) {
    const error = new HttpError("Password does not match Confirm password.");
    return next(error);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  //Saving new User to mongoDB
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  });
  try {
    await newUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong saving the user, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ user: newUser });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  const foundUser = await User.findOne({ email: email });

  if (!foundUser) {
    const error = new HttpError("No user was found, please try again", 401);
    return next(error);
  }
  const isPasswordValid = await bcrypt.compare(password, foundUser.password);

  if (!isPasswordValid) {
    const error = new HttpError("Password is incorrect.");
    return next(error);
  }

  let token;
  let refreshToken;
  try {
    token = jwt.sign({ userId: foundUser.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXP,
    });
    refreshToken = jwt.sign(
      { userId: foundUser.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXP }
    );
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  res
    .cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    })
    .send({
      token,
      userId: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
    });
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;
