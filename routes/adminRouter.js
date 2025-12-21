const express = require("express");
const router = express.Router();
const User = require("../db/userModel");
const asyncHandler = require("../middleware/asyncHandler");

router.post("/login", asyncHandler(async (req, res) => {
    const { login_name, password } = req.body;

    if (!login_name) {
        return res.status(400).json({ error: "login_name is required" });
    }

    if (!password) {
        return res.status(400).json({ error: "password is required" })
    }

    const user = await User.findOne({ login_name: login_name, password: password }).lean();

    if (!user) {
        return res.status(400).json({ error: "Invalid login name or password" });
    }

    req.session.user = {
        _id: user._id,
        login_name: user.login_name,
        first_name: user.first_name,
        last_name: user.last_name
    };

    res.json({
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        login_name: user.login_name
    });
}));

router.post("/logout", (req, res) => {
    if (!req.session.user) {
        return res.status(400).json({ error: "No user currently logged in" });
    }

    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
    });
});

module.exports = router;