# ts-langchain-notes-to-json

This repo demonstrates how to turn plain text into structured data. The example we will use is converting casual notes written at the end of a shift in the kitchen into a structured JSON that other parts of an application can deal with. In our case we need a list of actions and owners.

**Article:** [Turn plain-text notes into JSON with LangChain and Flask](https://wysiwygs.de/blog/plain-text-notes-to-json-langchain-flask/)

## Setup

```powershell
npm install
copy .env.example .env
```

Put your OpenAI API key in `.env`.

## Test with one chat call

```powershell
npm run chat-once
```

## Let's fill the prompt template with the notes

```powershell
npm run prompt-template
```

## Now the parser comes in

```powershell
npm run parse-json
```

## Serve it with a small Node server

```powershell
npm run app
```

Open http://127.0.0.1:5000
