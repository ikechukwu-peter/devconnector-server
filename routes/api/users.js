const express = require("express");

const router = express.Router();
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

const User = require("../../models/User");

router.post("/register", async (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    // Return any errors with 400 status
    return res.status(400).json(errors);
  }

  const { name, email, password, confirmPassword } = req.body;

  const avatar = gravatar.url(email, {
    s: "200",
    r: "pg",
    d: "mm",
  });
  try {
    const newUser = await User.create({
      name,
      email,
      password,
      confirmPassword,
      avatar,
    });

    res.status(200).json({
      status: "success",
      user: newUser,
    });
  } catch (err) {
    res.status(400).json({
      email: "An account with that email already exist",
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { errors, isValid } = validateLoginInput(req.body);

  // Check Validation
  if (!isValid) {
    // Return any errors with 400 status
    return res.status(400).json(errors);
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        email: "User not found",
      });
    }
    if (!(await user.correctPassword(password, user.password))) {
      return res.status(400).json({
        password: "Password incorrect",
      });
    } else {
      //JWT Payload
      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 11300 },
        (err, token) => {
          res.status(200).json({
            status: "success",
            token: "Bearer " + token,
          });
        }
      );
    }
  } catch (err) {
    res.status(404).json({
      email: "User does not exist",
    });
  }
});

router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { id, name, email } = req.user;
    res.json({ id, name, email });
  }
);
module.exports = router;
