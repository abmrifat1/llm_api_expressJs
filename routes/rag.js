// routes/rag.js
import express from "express";
import { ingestDocument, queryRAG } from "../services/ragService.js";
import { chatLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// POST /api/rag/upload
router.post("/upload", chatLimiter, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "`text` is required." });

    const result = await ingestDocument(text);
    res.json({
      message: "Document ingested successfully.",
      ...result
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to ingest document." });
  }
});

// POST /api/rag/query
router.post("/query", chatLimiter, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "`question` is required." });

    const result = await queryRAG(question);
    res.json(result);
  } catch (err) {
    console.error("RAG Query error:", err);
    res.status(500).json({ error: err.message || "Failed to query RAG." });
  }
});

export default router;