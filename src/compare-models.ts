import { readFileSync } from "node:fs";
import { join } from "node:path";

import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { config } from "dotenv";
import { z } from "zod";

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

const shiftBriefSchema = z.object({
  title: z.string().describe("One-line summary of the shift"),
  actions: z.array(z.string()).describe("Tasks that still need to happen"),
  owners: z.array(z.string()).describe("People responsible"),
});

const parser = StructuredOutputParser.fromZodSchema(shiftBriefSchema);
const prompt = await ChatPromptTemplate.fromMessages([
  [
    "system",
    "Extract a shift brief. Reply with JSON only.\n{format_instructions}",
  ],
  ["human", "Shift note:\n{note}"],
]).partial({ format_instructions: parser.getFormatInstructions() });

for (const name of ["gpt-4o-mini", "gpt-3.5-turbo"] as const) {
  const brief = await prompt
    .pipe(new ChatOpenAI({ model: name, temperature: 0, apiKey }))
    .pipe(parser)
    .invoke({ note });
  console.log(name);
  console.log(brief);
  console.log("---");
}
