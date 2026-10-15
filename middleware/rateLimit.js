import rateLimit from "express-rate-limit"

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1m
  max: 20, // 20 req per IP per minute
  message: {
    error: "Too many requests. Please wait a moment and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});