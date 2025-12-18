const express = require("express");
const User = require("../db/userModel");
const router = express.Router();
const asyncHandler = require("../middleware/asyncHandler");

router.get("/list", asyncHandler(async (req, res) => {
  const users = await User.find().select("_id first_name last_name").lean();
  res.json(users);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const user_id = req.params.id;
  const user = await User.findById(user_id).select("_id first_name last_name location description occupation").lean();

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  res.json(user);
}));

module.exports = router;