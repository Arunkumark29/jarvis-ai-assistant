const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

// ===================== SIGNUP =====================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password are required" });
    }

    // Check for duplicate email
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "email already registered" });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    // Respond with user info
    const user = { id: result.insertId, name, email };
    return res.status(201).json({ message: "registered successfully", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal server error" });
  }
});

// ===================== SIGNIN =====================
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    // Check if user exists
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Remove password before sending response
    delete user.password;

    return res.json({ message: "Login successful", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal server error" });
  }
});

module.exports = router;
