const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Handle Gemini Chat
exports.generateContent = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: "Text input is required" });
    }

    const requestBody = {
      contents: [
        {
          parts: [{ text }]
        }
      ]
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    res.json({
      success: true,
      reply: response.data.candidates[0].content.parts[0].text
    });
  } catch (error) {
    console.error("Gemini Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};
