const express = require("express");
const router = express.Router();
const User = require("../db/userModel");
const asyncHandler = require("../middleware/asyncHandler");

// POST /api/admin/login
router.post("/login", asyncHandler(async (req, res) => {
    const { login_name, password } = req.body;

    const user = await User.findOne({ login_name: login_name, password: password }).lean();

    if (!user) {
        return res.status(400).json({ error: "Invalid login name or password" });
    }

    if (req.session.user) {
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({ error: "Failed to regenerate session" });
            }
        });
        req.session.user = {
            _id: user._id,
            login_name: user.login_name,
            first_name: user.first_name,
            last_name: user.last_name
        };
        return res.json({
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            login_name: user.login_name
        });
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


// POST /api/admin/logout
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


// GET /api/admin/check
router.get("/check", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.session.user);
});

module.exports = router;