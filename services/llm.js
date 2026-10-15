import OpenAI from "openai";

// Provider Configurations
const PROVIDERS = {
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    defaultModel: "llama-3.3-70b-versatile",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: "gpt-4o-mini",
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey: process.env.GEMINI_API_KEY,
    defaultModel: "gemini-2.0-flash",
  },
}

// Active Provider Selection
const providerName = (process.env.PROVIDER)?.toLowerCase();
const config = PROVIDERS[providerName];

console.log('providerName =>', providerName);

if (!config) {
  throw new Error(
    `Unknown PROVIDER "${providerName}". Valid options: ${Object.keys(PROVIDERS).join(", ")}`
  );
}

if (!config.apiKey) {
  throw new Error(
    `Missing API key for provider "${providerName}". ` +
    `Please set ${providerName.toUpperCase()}_API_KEY in your .env file.`
  );
}

// Client & Constants
const client = new OpenAI({
  apiKey: config?.apiKey,
  baseURL: config?.baseURL
});

const MODEL = process.env.MODEL || config?.defaultModel;
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || "1024", 10);

// Retry Wrapper for Transient Errors
async function withRetry(fn, retries = 3, baseDelays = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status;
      const isRetryAble =
        status === 408 ||
        status === 409 ||
        status === 429 ||
        (status >= 500 && status < 600) ||
        err?.code === "ECONNRESET";

      if (!isRetryAble || attempt === retries) throw err;

      const delay = baseDelayMs * attempt + Math.random() * 500;

      console.warn(
        `⚠️ Attempt ${attempt} failed (${status || err.code}). Retrying in ${Math.round(delay)}ms...`
      );

      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Non-Streaming Chat Completion
export async function chat({
  messages,
  temperature = 0.7
}) {

  return withRetry(async () => {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature,
      max_tokens: MAX_TOKENS
    });

    return {
      reply: response?.choices[0]?.message?.content,
      model: response?.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      }
    }
  });
}

// Streaming Chat Completion — Returns Async Iterator
export async function chatStream({
  messages,
  temperature = 0.7
}) {
  return client.chat.completions.create({
    model: MODEL,
    messages,
    temperature,
    max_tokens: MAX_TOKENS,
    stream: true
  })
}