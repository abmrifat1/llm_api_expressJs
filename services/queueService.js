import { Queue } from "bullmq";
import Redis from "ioredis";

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
})

// Queue for processing RAG doc
export const ragQueue = new Queue('rag-ingestion', {
  connection: redisConnection
});

console.log("BullMQ RAG Queue initialized.");
