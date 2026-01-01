const bcrypt = require("bcrypt");
const db = require("../db");

// Sign In Controller
exports.signIn = (req, res) => {
    const { email, password } = req.body;

    // 1. Check if email exists
    const checkUserQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkUserQuery, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = results[0];

        // 2. Compare entered password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }

        // 3. Remove password before sending user data
        const { password: pwd, ...userData } = user;

        res.json({
            message: "Login successful",
            user: userData
        });
    });
};
