import { createClient } from "redis";

let redisClient;

export async function connectRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    redisClient.on("error", (err) => console.error('Redis Client Error', err));

    await redisClient.connect();
    console.log("Connected to Redis Cache");
  } catch (error) {
    console.error("Failed to connect to Redis:", error.message);
  }
}

export async function getCache(key) {
  if (!redisClient || !redisClient.isOpen) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Cache Get Error:", error);
    return null;
  }
}

export async function setCache(key, value, ttlSeconds = 3600) {
  if (!redisClient || !redisClient.isOpen) return;
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    })
  } catch (error) {
    console.error("Cache Set Error:", error);
  }
}