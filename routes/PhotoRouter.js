const express = require("express");
const Photo = require("../db/photoModel");
const router = express.Router();
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../db/userModel");

router.get("/photosOfUser/:id", asyncHandler(async (req, res) => {
  const user_id = req.params.id;
  const user = await User.findById(user_id).lean();
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const photos = await Photo.find({ user_id: user_id }).select('_id user_id file_name date_time comments').lean();

  const user_ids = new Set();
  photos.forEach(photo => {
    if (photo.comments) {
      photo.comments.forEach(comment => user_ids.add(comment.user_id.toString()))
    }
  })

  const users = await User.find({ _id: { $in: Array.from(user_ids) } }).select('_id first_name last_name').lean();
  const userMap = {};
  users.forEach(user => { userMap[user._id.toString()] = user });

  const result = photos.map(photo => ({
    _id: photo._id,
    user_id: photo.user_id,
    file_name: photo.file_name,
    date_time: photo.date_time,
    comments: (photo.comments || []).map(comment => ({
      _id: comment._id,
      comment: comment.comment,
      date_time: comment.date_time,
      user: userMap[comment.user_id.toString()] || null
    }))
  }))

  res.json(result);
}));


module.exports = router;
