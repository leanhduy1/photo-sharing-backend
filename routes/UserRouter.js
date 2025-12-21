const express = require("express");
const User = require("../db/userModel");
const router = express.Router();
const asyncHandler = require("../middleware/asyncHandler");
const requireAuth = require("../middleware/auth");

router.post("/", asyncHandler(async (req, res) => {
  const {
    login_name,
    password,
    first_name,
    last_name,
    location,
    description,
    occupation
  } = req.body;
  
  if (!login_name || !login_name.trim()) {
    return res.status(400).json({ error: "login_name is required"});
  }
  
  if (!password || !password.trim()) {
    return res.status(400).json({ error: "password is required"});
  }
  
  if (!first_name || !first_name.trim()) {
    return res.status(400).json({ error: "first_name is required"});
  }

  if (!last_name || !last_name.trim()) {
    return res.status(400).json({ error: "last_name is required"});
  }

  const existingUser = await User.findOne({ login_name: login_name.trim() }).lean();
  if (existingUser) {
    return res.status(400).json({ error: "login_name already exists"});
  }

  const newUser = new User({
    login_name: login_name.trim(),
    password: password.trim(),
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    location: location?.trim() || "",
    description: description?.trim() || "",
    occupation: occupation?.trim() || ""
  });

  await newUser.save();

  res.json({
    _id: newUser._id,
    login_name: newUser.login_name,
    first_name: newUser.first_name,
    last_name: newUser.last_name
  });
}));

router.use(requireAuth);

router.get("/list", asyncHandler(async (req, res) => {
  const users = await User.find().select("_id first_name last_name").lean();
  res.json(users);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const user_id = req.params.id;
  const user = await User.findById(user_id).select("_id first_name last_name location description occupation").lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
}));

module.exports = router;