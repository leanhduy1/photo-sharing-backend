const express = require("express");
const Photo = require("../db/photoModel");
const router = express.Router();
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../db/userModel");
const requireAuth = require("../middleware/auth");
const upload = require("../middleware/upload");
const mongoose = require("mongoose");


router.use(requireAuth);


// GET /api/photo/photosOfUser/:id
router.get("/photosOfUser/:id", asyncHandler(async (req, res) => {
  const user_id = req.params.id;
  const user = await User.findById(user_id).lean();
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const photos = await Photo.find({ user_id: user_id }).populate({ path: 'comments.user_id', select: '_id first_name last_name' }).sort({ date_time: -1 });

  const result = photos.map(photo => ({
    _id: photo._id,
    user_id: photo.user_id,
    file_name: photo.file_name,
    date_time: photo.date_time,
    comments: photo.comments.map(comment => ({
      _id: comment._id,
      comment: comment.comment,
      date_time: comment.date_time,
      user: comment.user_id || null
    }))
  }));

  res.json(result);
}));


// POST /api/photo/commentsOfPhoto/:photo_id
router.post("/commentsOfPhoto/:photo_id", asyncHandler(async (req, res) => {
  const { photo_id } = req.params;
  const { comment } = req.body;
  const user_id = req.session.user._id;

  if (!comment || !comment.trim()){
    return res.status(400).json({ error: "Comment cannot be empty"});
  }

  const photo = await Photo.findById(photo_id);
  if (!photo) {
    return res.status(404).json({ error: "Photo not found"});
  }

  const newComment = {
    comment: comment,
    user_id: user_id,
    date_time: new Date()
  }
  photo.comments.push(newComment);
  await photo.save();

  addedComment = photo.comments[photo.comments.length - 1];
  const user = await User.findById(user_id).select('_id first_name last_name').lean();

  res.status(201).json({
    _id: addedComment._id,
    comment: addedComment.comment,
    date_time: addedComment.date_time,
    user: user
  });
}));


// POST /api/photo/new 
router.post("/new", upload.single('photo'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No photo uploaded" });
  }

  newPhoto = new Photo({
    user_id: req.session.user._id,
    file_name: req.file.filename,
    date_time: new Date(),
    comments: []
  });
  await newPhoto.save();

  res.status(201).json({
    _id: newPhoto._id,
    user_id: newPhoto.user_id,
    file_name: newPhoto.file_name,
    date_time: newPhoto.date_time
  });
}));

module.exports = router;
