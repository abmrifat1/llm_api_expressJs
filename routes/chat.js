import express from "express";
import { chat, chatStream } from "../services/llm";
import { chatLimiter } from "../middleware/rateLimit";

const router = express.Router();

// POST /api/chat — Non-Streaming JSON Response
router.post("/chat", chatLimiter, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(!messages) || messages.length === 0) {
      return res.status(400).json({
        error: "`messages` must be a non-empty array.",
      })
    }

    const result = await chat({ messages });
    res.json(result);
  } catch (error) {
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

    if (!Array.isArray(!messages) || messages.length === 0) {
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

  } catch (error) {
    console.error("Stream error:", err);
    res.write(`data: ${JSON.stringify({ error: "Stream failed." })}\n\n`);
    res.end();
  }
});

export default router;
