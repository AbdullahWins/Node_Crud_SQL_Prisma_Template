const express = require("express");
const router = express.Router();

// Import routes
const adminRoutes = require("../adminRoutes");
const userRoutes = require("../userRoutes");
const gfRoutes = require("../girlFriendRoutes");

// Routes
router.use(adminRoutes);
router.use(userRoutes);
router.use(gfRoutes);

module.exports = router;
