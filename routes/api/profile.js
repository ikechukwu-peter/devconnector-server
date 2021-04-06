const express = require("express");
const router = express.Router();
const passport = require("passport");
const axios = require("axios");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");
const config = require("config");

//Get profile
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = await Profile.findOne({ user: req.user.id }).populate(
        "user",
        ["name", "avatar"]
      );

      if (!user) {
        return res
          .status(404)
          .json({ noprofile: "There is no profile  for this user " });
      }
      res.json(user);
    } catch (err) {
      res.status(404).json(err);
    }
  }
);

//Get all profiles
router.get("/all", async (req, res) => {
  const errors = {
    noprofiles: "No Profiles",
  };
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    if (!profiles) {
      return res.status(400).json(errors.noprofiles);
    }
    res.status(200).json(profiles);
  } catch (err) {
    res.status(404).json(err.message);
  }
});
//Get all profiles
router.get("/", async (req, res) => {
  const errors = {
    noprofiles: "No Profiles",
  };
  try {
    const profiles = await Profile.find();
    if (!profiles) {
      return res.status(400).json(errors.noprofiles);
    }
    res.status(200).json(profiles);
  } catch (err) {
    res.status(404).json(err.message);
  }
});
//Get handle
router.get("/handle/:handle", async (req, res) => {
  const errors = {};
  try {
    const profile = await Profile.findOne({
      handle: req.params.handle,
    });
    if (!profile) {
      errors.noprofile = "There is no profile for this user";
      return res.status(404).json(errors);
    }
    return res.json(profile);
  } catch (err) {
    res.json(err);
  }
});

//Get with Id
router.get("/user/:user_id", async (req, res) => {
  const errors = {};
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    });

    if (!profile) {
      errors.profile = "There is no profile for this user";
      return res.status(404).json(errors);
    }
    return res.json(profile);
  } catch (err) {
    res.json({ profile: "There is no profile for this user" });
  }
});

//Create and Update profile
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;
    // Skills - Spilt into array
    if (typeof req.body.skills !== "undefined") {
      profileFields.skills = req.body.skills.split(",");
    }

    // Social
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;
    try {
      let profile = await Profile.findOne({
        user: req.user.id,
      });

      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json({
          profile,
        });
      } else {
        // Create

        // Check if handle exists
        profile = await Profile.findOne({ handle: profileFields.handle });

        if (profile) {
          errors.handle = "That handle already exists";
          res.status(400).json(errors);
        }

        // Save Profile

        profile = await Profile.create(profileFields);
        return res.json({
          profile,
        });
      }
    } catch (err) {
      res.status(500).json({
        errors: "Internal server error, pleae try again!",
      });
    }
  }
);
//Experience
router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      //new expericence obj
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description,
      };
      await profile.experience.unshift(newExp);
      //Save to DB
      profile.save();
      return res.json({ profile });
    } catch (err) {
      res.status(404).json({ noprofile: "There is no profile" });
    }
  }
);

//Education

router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      //new eductaion
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description,
      };
      await profile.education.unshift(newEdu);

      //Save to DB
      profile.save();
      return res.json(profile);
    } catch (err) {
      res.status(404).json({ noprofile: "There is no profile for this user!" });
    }
  }
);

// To be written using async await
//DELETING Experience
router.delete(
  "/experience/:exp_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then((profile) => {
        // Get remove index
        const removeIndex = profile.experience
          .map((item) => item.id)
          .indexOf(req.params.exp_id);

        // Splice out of array
        profile.experience.splice(removeIndex, 1);

        // Save
        profile.save().then((profile) => res.json(profile));
      })
      .catch((err) => res.status(404).json(err));
  }
);

// To be written using async await
router.delete(
  "/education/:edu_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then((profile) => {
        // Get remove index
        const removeIndex = profile.education
          .map((item) => item.id)
          .indexOf(req.params.exp_id);

        // Splice out of array
        profile.education.splice(removeIndex, 1);

        // Save
        profile.save().then((profile) => res.json(profile));
      })
      .catch((err) => res.status(404).json(err));
  }
);

router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      await Profile.findOneAndRemove({ user: req.user.id });
      await User.findOneAndRemove({ _id: req.user.id });
      return res.json({ success: true });
    } catch (err) {
      res.status(404).json(err);
    }
  }
);

router.get("/github/:username", async (req, res) => {
  try {
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    );
    const headers = {
      "user-agent": "node.js",
      Authorization: `token  ${config.get("gitHubToken")}`,
    };

    const gitHubResponse = await axios.get(uri, { headers });
    return res.json(gitHubResponse.data);
  } catch (err) {
    console.log(err.message);
    return res.status(404).json({ errors: "No Github profile found" });
  }
});
module.exports = router;
