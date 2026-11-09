import { Worker } from "bullmq";
import { ingestDocument } from "../services/ragService.js";
import Redis from "ioredis";

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
})

// Queue consumer (Worker)
export const ragWorker = new Worker(
  "rag-ingestion",
  async (job) => {
    console.log(`Processing job ${job.id}: Ingesting document...`);

    const { text } = job.data;

    const result = await ingestDocument(text);

    console.log(`Job ${job.id} completed. Chunks added: ${result.chunksAdded}`);
    return result;
  },
  {
    connection: redisConnection,
    concurrency: 2
  }
);

ragWorker.on("completed", (job) => {
  console.log(` Job ${job.id} has completed successfully!`);
});

ragWorker.on("failed", (job, err) => {
  console.error(` Job ${job.id} has failed with error: ${err.message}`);
});