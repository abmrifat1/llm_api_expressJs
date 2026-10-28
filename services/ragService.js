import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { chat } from "./llm.js";

const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

let vectorStore = null;

// Document process and store
export async function ingestDocument(text) {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50
    });

    const chunks = await splitter.createDocuments([text]);

    if (!vectorStore) {
      vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
    } else {
      await vectorStore.addDocuments(chunks);
    }

    return { success: true, chunksAdded: chunks.length };

  } catch (error) {
    console.error("Ingest error:", error);
    throw error;
  }
}

// Generate Questing and Answer
export async function queryRAG(question) {
  if (!vectorStore) {
    throw new Error("No documents found. Please upload a document first.");
  }

  // Search Document top 3 chunks
  const relevantDocs = await vectorStore.similaritySearch(question, 3);
  const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

  // Make Prompt for LLM
  const messages = [
    {
      role: "system",
      content: `You are a helpful assistant. Answer the user's question based ONLY on the provided context. 
If the answer is not in the context, say "I don't have enough information to answer that."
Do not make up information.

Context:
${context}`
    },
    {
      role: "user",
      content: question
    }
  ];

  // Call chat function
  const result = await chat({ messages, temperature: 0.2 });

  return {
    answer: result.reply,
    sources: relevantDocs.map(doc => doc.pageContent.substring(0, 100) + "..."),
    usage: result.usage
  }

}