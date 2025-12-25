const express = require("express");
const Photo = require("../db/photoModel");
const router = express.Router();
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../db/userModel");
const requireAuth = require("../middleware/auth");
const upload = require("../middleware/upload");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

router.use(requireAuth);


// GET /api/photo/photosOfUser/:id
router.get("/photosOfUser/:id", asyncHandler(async (req, res) => {
  const user_id = req.params.id;
  const user = await User.findById(user_id).lean();
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const photos = await Photo.find({ user_id: user_id })
                            .populate({ path: 'comments.user_id', select: '_id first_name last_name' })
                            .sort({ date_time: -1 });

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
    })),
    likes: photo.likes?.length || 0,
    isLiked: photo.likes?.some(id => id.equals(req.session.user._id)) || false
  }));

  res.json(result);
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
    comments: [],
    likes: []
  });
  await newPhoto.save();

  res.status(201).json({
    _id: newPhoto._id,
    user_id: newPhoto.user_id,
    file_name: newPhoto.file_name,
    date_time: newPhoto.date_time
  });
}));

// DELETE /api/photo/:photo_id
router.delete("/:photo_id", asyncHandler(async (req, res) => {
  const { photo_id } = req.params;
  const user_id = req.session.user._id;

  const photo = await Photo.findById(photo_id);
  if (!photo) {
    return res.status(404).json({ error: "Photo not found" });
  }

  if (!photo.user_id.equals(user_id)) {
    return res.status(403).json({ error: "You can only delete your own photos" });
  }

  const filePath = path.join(__dirname, "..", "uploads", photo.file_name);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await Photo.deleteOne({ _id: photo_id });

  res.json({ message: "Photo deleted successfully" });
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


// DELETE /api/photo/commentsOfPhoto/:photo_id/:comment_id
router.delete("/commentsOfPhoto/:photo_id/:comment_id", asyncHandler(async (req, res) => {
  const { photo_id, comment_id } = req.params;
  const user_id = req.session.user._id;

  const photo = await Photo.findById(photo_id);
  if (!photo) {
    return res.status(404).json({ error: "Photo not found" });
  }

  const comment = photo.comments.id(comment_id);
  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  if (!comment.user_id.equals(user_id)) {
    return res.status(403).json({ error: "You can only delete your comments" });
  }

  photo.comments.pull(comment_id);
  await photo.save();

  res.json({ message: "Comment deleted successfully" });
}));


// PUT /api/photo/commentsOfPhoto/:photo_id/:comment_id
router.put("/commentsOfPhoto/:photo_id/:comment_id", asyncHandler(async (req, res) => {
  const { photo_id, comment_id } = req.params;
  const user_id = req.session.user._id;
  const commentText = req.body.comment;

  if (!commentText?.trim()) {
    return res.status(400).json({ error: "Comment cant be empty"});
  }

  const photo = await Photo.findById(photo_id);
  if (!photo) {
    return res.status(404).json({ error: "Photo not found" });
  }

  const comment = photo.comments.id(comment_id);
  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  if (!comment.user_id.equals(user_id)) {
    return res.status(403).json({ error: "You can only edit your comments" });
  }
  
  comment.comment = commentText;
  await photo.save();

  res.json({
    _id: comment._id,
    comment: comment.comment,
    date_time: comment.date_time,
    user_id: comment.user_id
  });
}));

// POST /api/photo/like/:photo_id
router.post("/like/:photo_id", asyncHandler(async (req, res) => {
  const { photo_id } = req.params;
  const user_id = req.session.user._id;

  const photo = await Photo.findById(photo_id);
  if (!photo) {
    return res.status(404).json({ error: "Photo not found"});
  }

  const likeIndex = photo.likes.findIndex(id => id.equals(user_id));
  
  if (likeIndex === -1) {
    photo.likes.push(user_id);
  } else {
    photo.likes.splice(likeIndex, 1);
  }

  await photo.save();

  res.json({ likes: photo.likes.length, isLiked: likeIndex === -1 });
}));


router.get("/download/:photo_id", asyncHandler(async (req, res) => {
  const { photo_id } = req.params;

  const photo = await Photo.findById(photo_id);
  if (!photo) {
    return res.status(404).json({ error: "Photo not found" });
  }

  const filePath = path.join(__dirname, '..', 'images', photo.file_name);

  // Kiểm tra file tồn tại
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // Set header để force download
  res.download(filePath, photo.file_name);
}));

module.exports = router;
