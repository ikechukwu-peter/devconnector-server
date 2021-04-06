const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config({ path: "./config.env" });
const passport = require("passport");
const cors = require("cors");
const path = require("path");

const users = require("./routes/api/users");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");

const app = express();
app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "10kb" }));
const port = process.env.PORT || 5000;
const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Mongo Connected");
  })
  .catch((err) => console.log(err));

//Passport middleware

app.use(passport.initialize());
require("./config/passport")(passport);

app.use("/api/users", users);
app.use("/api/profile", profile);
app.use("/api/posts", posts);

//Serve static files if in production

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}
app.listen(port, console.log("Listening on port 5000"));
