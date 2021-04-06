const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
//const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A user must have a name!"],
    minlength: [2, "Name must be between 2 and 30 characters"],
    maxlength: [30, "Name must be between 2 and 30 characters"],
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Email already exist!"],
    lowercase: true,
    //validate: [validator.isEmail, "Please provide a valid email"],
  },

  password: {
    type: String,
    required: [true, "A user must have a password!"],
    minlength: [8, "Password must be atleast 8 characters"],
  },
  confirmPassword: {
    type: String,
    required: true,
    // validate: {
    //   // This only works on CREATE and SAVE!!!
    //   validator: function (el) {
    //     return el === this.password;
    //   },
    //   message: "Passwords does not match!",
    // },
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  avatar: {
    type: String,
  },
});

userSchema.pre(
  "save",
  async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
    next();
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
module.exports = User = mongoose.model("users", userSchema);
