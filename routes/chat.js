import express from "express";
import { chat, chatStream } from "../services/llm.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { extractData, reviewCode } from "../services/promptService.js";
const router = express.Router();

// POST /api/chat — Non-Streaming JSON Response
router.post("/chat", chatLimiter, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "`messages` must be a non-empty array.",
      })
    }

    const result = await chat({ messages });
    res.json(result);
  } catch (err) {
    console.error("Chat error:", err);

    if (err.status === 401) {
      return res.status(401).json({ error: "Invalid API key." });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Upstream rate limit hit." });
    }
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

// POST /api/chat/stream — Server-Sent Events (SSE) Streaming
router.post("/chat/stream", chatLimiter, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "`messages` must be a non-empty array.",
      })
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await chatStream({ messages });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

  } catch (err) {
    console.error("Stream error:", err);
    res.write(`data: ${JSON.stringify({ error: "Stream failed." })}\n\n`);
    res.end();
  }
});

// POST /api/chat/extract - Structured JSON Extraction
router.post("/chat/extract", chatLimiter, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "`text` is required." });

    const result = await extractData(text);

    let cleanJson = result.reply.replace(/```json/g, "").replace(/```/g, "").trim();

    res.json({
      extractedData: JSON.parse(cleanJson),
      usage: result.usage
    });
  } catch (err) {
    console.error("Extraction error:", err);
    res.status(500).json({ error: "Failed to extract data." });
  }
});

// POST /api/chat/review-code - Code Review Assistant
router.post("/chat/review-code", chatLimiter, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "`code` is required." });

    const result = await reviewCode(code);
    res.json({
      review: result.reply,
      usage: result.usage
    });
  } catch (err) {
    console.error("Code Review error:", err);
    res.status(500).json({ error: "Failed to review code." });
  }
});

export default router;
