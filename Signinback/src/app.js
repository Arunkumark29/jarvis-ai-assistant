require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN, 
    credentials: true,
  })
);
app.use(express.json());

// Test route
app.get("/", (_req, res) => res.json({ status: "ok" }));

// Auth routes
app.use("/api", authRoutes);

/**
 * SSE route: GET /api/gemini/stream?text=...
 * Streams Gemini output to the browser using Server-Sent Events.
 */
app.get("/api/gemini/stream", async (req, res) => {
  try {
    const { text } = req.query;
    if (!text) {
      res.status(400).json({ success: false, error: "Text is required" });
      return;
    }

    // --- SSE headers ---
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    // If you ever add compression middleware, disable it for this route.

    // Flush headers so client starts receiving immediately
    if (res.flushHeaders) res.flushHeaders();

    // Call Gemini streaming endpoint
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent" +
      `?key=${process.env.GEMINI_API_KEY}`;

    const outbound = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
      }),
    });

    // If the upstream fails, propagate
    if (!outbound.ok) {
      const errText = await outbound.text().catch(() => "");
      res.write(`data: [ERROR] Upstream ${outbound.status} ${errText}\n\n`);
      res.end();
      return;
    }

    const upstreamBody = outbound.body;

    // ----- Two compatible ways to read, depending on stream type -----
    if (typeof upstreamBody.getReader === "function") {
      // Web ReadableStream (Node 18+/native fetch path)
      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Send chunk to client as SSE
        res.write(`data: ${chunk}\n\n`);
      }
    } else if (Symbol.asyncIterator in upstreamBody) {
      // Node.js Readable stream (fallback)
      for await (const chunk of upstreamBody) {
        res.write(`data: ${chunk.toString("utf8")}\n\n`);
      }
    } else {
      // Last resort: read as text (no streaming)
      const all = await outbound.text();
      res.write(`data: ${all}\n\n`);
    }

    // Signal completion
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Gemini SSE Error:", error);
    try {
      res.write(`data: [ERROR] ${error.message || String(error)}\n\n`);
    } finally {
      res.end();
    }
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
