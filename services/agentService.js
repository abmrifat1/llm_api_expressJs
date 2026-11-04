import OpenAI from "openai";
import { evaluate } from 'mathjs';

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

// Define Tools
const tools = [
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Perform basic mathematical calculations. Use this for any math-related question.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The mathematical expression to evaluate (e.g., '2 + 2', '15 * 4')",
          },
        },
        required: ["expression"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "get_current_time",
      description: "Get the current date and time of the server.",
      parameters: {
        type: "object",
        properties: {}
      },
    },
  },
];

// Execute function
function executeTools(toolName, args) {
  if (toolName === 'calculate') {
    try {
      const result = evaluate(args.expression);
      return { result: result };
    } catch (error) {
      return { error: "Invalid mathematical expression." };
    }
  }

  if (toolName === 'get_current_time') {
    return {
      time: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
      timeZone: "Asia/Dhaka"
    }
  }
}