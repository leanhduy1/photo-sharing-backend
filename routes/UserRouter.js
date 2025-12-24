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

router.get("/search", asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) {
    return res.status(400).json({ error: "Search query 'q' is required" });
  }

  const keyword = q.trim();

  const users = await User.find({
    $or: [
      { first_name: { $regex: keyword, $options: 'i' } },
      { last_name: { $regex: keyword, $options: 'i' } }
    ]
  }).select("_id first_name last_name").lean();
  
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

router.put("/password", asyncHandler(async (req, res) => {
  const { old_password, new_password } = req.body;
  const user_id = req.session.user._id;

  if (!old_password?.trim()) {
    return res.status(400).json({ error: "old_password is required"}); 
  }

  if (!new_password?.trim()) {
    return res.status(400).json({ error: "new_password is required"}); 
  }

  const user = await User.findById(user_id);

  if (old_password !== user.password) {
    return res.status(400).json({ error: "Current password incorrect"}); 
  }
  
  if (old_password === new_password) {
    return res.status(400).json({ error: "New password must be different from current password"}); 
  }

  user.password = new_password.trim();
  await user.save();

  res.json({ message: "Password updated successfully" });
}));

router.put("/", asyncHandler(async (req, res) => {
  const user_id = req.session.user._id;
  const { first_name, last_name, location, occupation, description } = req.body;

  if (!first_name?.trim()) {
    return res.status(400).json({ error: "first_name is required"}); 
  }

  if (!last_name?.trim()) {
    return res.status(400).json({ error: "last_name is required"}); 
  }

  const updatedUser = await User.findByIdAndUpdate(
    user_id,
    {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      location: location?.trim() || '',
      occupation: occupation?.trim() || '',
      description: description?.trim() || '',
    },
    { new: true }  
  ).select("_id first_name last_name location occupation description");

  if (!updatedUser) {
    return res.status(404).json({ error: "User not found" });
  }

  req.session.user.first_name = updatedUser.first_name;
  req.session.user.last_name = updatedUser.last_name;

  res.json(updatedUser);
}));



module.exports = router;