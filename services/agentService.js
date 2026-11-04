import OpenAI from "openai";
import { evaluate } from 'mathjs';
import { chat } from "./llm.js";

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
  {
    type: "function",
    function: {
      name: "generate_creative_text",
      description: "Generate a creative piece like a poem, short story, or joke based on a specific topic.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic or subject to write about.",
          },
          format: {
            type: "string",
            enum: ["poem", "story", "joke"],
            description: "The format of the creative text.",
          }
        },
        required: ["topic"],
      },
    },
  }
];

// Execute function
async function executeTools(toolName, args) {
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

  if (toolName === "generate_creative_text") {
    try {
      const prompt = `Write a beautiful ${args.format || 'poem'} about: ${args.topic}`;

      const result = await chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8
      });

      return { creative_text: result.reply };
    } catch (error) {
      return { error: "Failed to generate creative text." };
    }
  }

  return {
    error: "Tool not found."
  };
}

// ReAct Pattern
export async function runAgent(userMessage) {
  const messages = [
    {
      role: "system",
      content: "You are a helpful AI assistant. Use the provided tools if necessary to answer the user's query accurately."
    },
    {
      role: "user",
      content: userMessage
    },
  ];

  const maxIterations = 3;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: messages,
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.1,
    });

    const responseMessage = response.choices[0].message;
    messages.push(responseMessage);

    // if tools is not call
    if (!responseMessage.tool_calls) {
      return {
        answer: responseMessage.content,
        iteration: iteration,
        usage: response.usage
      }
    }

    for (const toolCall of responseMessage.tool_calls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log(`Agent is using tool: ${functionName} (${JSON.stringify(functionArgs)})`);

      const toolResult = await executeTools(functionName, functionArgs);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return { error: "Agent exceeded maximum iterations without a final answer." };
}