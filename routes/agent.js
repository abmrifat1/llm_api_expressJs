import express from "express";
import { runAgent } from "../services/agentService.js";
import { chatLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// POST /api/agent/chat - Autonomous Agent
router.post("/chat", chatLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "`message` is required." });
    }

    const result = await runAgent(message);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error("Agent error:", err);
    res.status(500).json({ error: "Failed to run agent." });
  }
});

export default router;