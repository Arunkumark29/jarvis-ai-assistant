const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-safeguard-20b';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Handle AI chat content using Groq, OpenAI, or Gemini.
exports.generateContent = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: "Text input is required" });
    }

    if (GROQ_API_KEY) {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: GROQ_MODEL,
          messages: [{ role: "user", content: text }],
          max_tokens: 500,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
        }
      );

      const reply =
        response.data.choices?.[0]?.message?.content?.trim() ||
        response.data.choices?.[0]?.text?.trim() ||
        response.data.reply?.trim();

      return res.json({ success: true, reply: reply || "I could not generate a response." });
    }

    if (OPENAI_API_KEY) {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: text }],
          max_tokens: 500,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      const reply = response.data.choices?.[0]?.message?.content?.trim();
      return res.json({ success: true, reply: reply || "I could not generate a response." });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "No API key is configured. Set GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in the backend .env file.",
      });
    }

    const requestBody = {
      contents: [
        {
          parts: [{ text }],
        },
      ],
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ success: true, reply: reply || "I could not generate a response." });
  } catch (error) {
    const errorPayload = error.response?.data || error.message || String(error);
    console.error("AI Chat Error:", errorPayload);
    res.status(500).json({
      success: false,
      error: typeof errorPayload === 'object' ? JSON.stringify(errorPayload) : errorPayload,
    });
  }
};
