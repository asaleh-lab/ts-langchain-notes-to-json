import { createServer, type IncomingMessage } from "node:http";
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
const chain = prompt
  .pipe(new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0, apiKey }))
  .pipe(parser);

const SAMPLE = readFileSync(join(process.cwd(), "data", "shift_note.txt"), "utf8");

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPage(note: string, brief: unknown): string {
  const briefBlock =
    brief === undefined
      ? ""
      : `<pre>${escapeHtml(JSON.stringify(brief, null, 2))}</pre>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Shift notes</title>
</head>
<body>
<form method="post">
  <textarea name="note" rows="8" cols="60">${escapeHtml(note)}</textarea><br>
  <button>Parse</button>
</form>
${briefBlock}
</body>
</html>`;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: string | Buffer) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

const server = createServer((req, res) => {
  void (async () => {
    const pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    if (pathname !== "/") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    try {
      let note = SAMPLE;
      let brief: unknown;
      if (req.method === "POST") {
        const body = await readBody(req);
        note = new URLSearchParams(body).get("note") ?? "";
        brief = await chain.invoke({ note });
      }
      const html = renderPage(note, brief);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(error instanceof Error ? error.message : "Server error");
    }
  })();
});

server.listen(5000, "127.0.0.1", () => {
  console.log("Serving on http://127.0.0.1:5000");
});
