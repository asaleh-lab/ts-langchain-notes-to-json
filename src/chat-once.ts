import { ChatOpenAI } from "@langchain/openai";
import { config } from "dotenv";

config();

function requireOpenAIKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "OPENAI_API_KEY is missing. Copy .env.example to .env and set your key."
    );
    process.exit(1);
  }
  return apiKey;
}

const apiKey = requireOpenAIKey();
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey,
});

const response = await llm.invoke(
  "Reply with one short sentence: what is a kitchen shift note?"
);
console.log(
  typeof response.content === "string"
    ? response.content
    : String(response.content)
);
