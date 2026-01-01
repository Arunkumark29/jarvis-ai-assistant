const express = require("express");
const router = express.Router();
const { generateContent } = require("../controllers/geminiController");

// POST /api/gemini/chat
router.post("/chat", generateContent);

module.exports = router;
