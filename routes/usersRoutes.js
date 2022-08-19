const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middleware/checkAuth");
const usersController = require("../controllers/usersController");

const router = express.Router();

router.get("/", checkAuth, usersController.getUsers);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").not().isEmpty(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signUp
);
router.post("/login", usersController.login);

module.exports = router;
