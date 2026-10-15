import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    provider: process.env.PROVIDER || "groq",
    model: process.env.MODEL,
  });
});


// Chat routes
app.use("/api", chatRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LLM API running at http://localhost:${PORT}`);
});