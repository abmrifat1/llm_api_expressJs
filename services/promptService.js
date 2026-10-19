import { chat } from "./llm.js";

// Structured Data Extraction using Few-Shot & System Prompts
export async function extractData(textToParse) {
  const messages = [
    {
      role: 'system',
      content: `You are a strict JSON data extractor. 
Your task is to extract information from the provided text.
Output MUST be valid JSON only. Do NOT wrap in markdown tags like \`\`\`json.
If a field is missing, use null.
Schema: { "name": string, "age": number, "skills": string[] }`
    },
    {
      role: "user",
      content: `Text: "Hi, I am Khorshed, 28 years old. I code in Node.js and React."`
    },
    {
      role: "assistant",
      content: `{"name": "Khorshed", "age": 28, "skills": ["Node.js", "React"]}`
    },
    {
      role: "user",
      content: `Text: "${textToParse}"`
    }
  ];

  const result = await chat({ messages, temperature: 0.1 });
  return result;
}

// Code Review Assistant using Role Prompting & Chain-of-Thought
export async function reviewCode(codeSnippet) {
  const messages = [
    {
      role: "system",
      content: `You are a Senior Software Engineer with 6+ years of experience in Node.js and TypeScript. 
Your job is to review code. 
Think step-by-step:
1. Check for bugs or edge cases.
2. Check for security vulnerabilities.
3. Suggest performance improvements.
Provide the final output in this exact format:
### Issues Found
- [List of issues]
### Improvements
- [List of improvements]
### Refactored Code
\`\`\`javascript
[Your code here]
\`\`\``
    },
    {
      role: "user",
      content: `Please review this code:\n\n${codeSnippet}`
    }
  ];

  const result = await chat({ messages, temperature: 0.4 });
  return result;
}
