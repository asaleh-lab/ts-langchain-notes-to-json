import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ChatPromptTemplate } from "@langchain/core/prompts";
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
const note = readFileSync(join(process.cwd(), "data", "shift_note.txt"), "utf8");

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You extract people and tasks from kitchen shift notes. Be terse.",
  ],
  [
    "human",
    "Shift note:\n{note}\n\nList each person and what they need to do.",
  ],
]);

const messages = await prompt.invoke({ note });
console.log("Filled prompt:");
console.log(messages.toString());
console.log("---");

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey,
});
const response = await llm.invoke(messages);
console.log(
  typeof response.content === "string"
    ? response.content
    : String(response.content)
);
