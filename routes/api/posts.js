const express = require("express");

const router = express.Router();
const passport = require("passport");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const validatePostInput = require("../../validation/post");

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }
    try {
      const { text, name, avatar } = req.body;
      const user = req.user.id;
      const post = await Post.create({ text, name, avatar, user });
      res.json(post);
    } catch (err) {
      res.status(500).json({ errors: err.message });
    }
  }
);

//Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    res.status(404).json({ nopostsfound: "No Posts found!" });
  }
});

//Find a specific post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.json(post);
  } catch (err) {
    res.status(404).json({ nopostfound: "No post found with that ID" });
  }
});

//Update post
// router.put(
//   "/:id",
//   passport.authenticate("jwt", { session: false }),
//   async (req, res) => {
//     const { errors, isValid } = validatePostInput(req.body);

//     if (!isValid) {
//       // Return any errors with 400 status
//       return res.status(400).json(errors);
//     }
//     try {
//       const { text } = req.body;
//       const postUpdate = await Post.findByIdAndUpdate(req.params.id, text, {
//         new: true,
//       });
//       console.log(postUpdate);

//       return res.json(postUpdate);
//     } catch (err) {
//       return res
//         .status(400)
//         .json({ nopost: "Unable to update post, try again later" });
//     }
//   }
// );

//Deleting post
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      const post = await Post.findById(req.params.id);

      if (!profile || post.user.toString() !== req.user.id) {
        return res.status(401).json({ notauthorized: "Not authorized" });
      }
      await post.remove();
      return res.status(204).json({ success: true });
    } catch (err) {
      return res.status(404).json({ postnotfound: "No Post found" });
    }
  }
);

//liking

router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      const post = await Post.findById(req.params.id);
      if (!profile) {
        return res.status(404).json({ nouser: "User not found" });
      }
      if (
        post.likes.filter((like) => like.user.toString() === req.user.id)
          .length > 0
      ) {
        return res
          .status(400)
          .json({ alreadyliked: "User already liked this post" });
      }
      post.likes.unshift({ user: req.user.id });
      await post.save();
      return res.status(200).json(post);
    } catch (err) {
      return res.status(404).json({ postnotfound: "No Post found" });
    }
  }
);

//Unlike
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      // Check if the post has not yet been liked
      if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
        return res.status(400).json({ msg: "Post has not yet been liked" });
      }

      // remove the like
      post.likes = post.likes.filter(
        ({ user }) => user.toString() !== req.user.id
      );

      await post.save();

      return res.json(post.likes);
    } catch (err) {
      console.error(err.message);
      res.status(500).json("Server error");
    }
  }
);

//Add a commnet

router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }
    try {
      let post = await Post.findById(req.params.id);
      //new expericence obj
      const newComment = {
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id,
      };
      await post.comments.unshift(newComment);

      //Save to DB
      await post.save();
      return res.json(post);
    } catch (err) {
      res.status(404).json(err);
    }
  }
);

//Delete comment
router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then((post) => {
        if (
          post.comments.filter(
            (comment) => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(400)
            .json({ commentnotexist: "Comment does not exist" });
        }

        // Get remove index
        const removeIndex = post.comments
          .map((item) => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice out of array
        post.comments.splice(removeIndex, 1);

        // Save
        post.save().then((post) => res.json(post));
      })
      .catch((err) => res.status(404).json({ notfound: "Comment not found" }));
  }
);
module.exports = router;
