import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.gemini_api,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const System_Prompt = `
You are a step by sept problem solver.
Always respond in JSON with the structure: 
{
    "step": "START" | "THINK" | "RESULT",
    "content": "string"
}

Rules:
- START: Give a short intro about the problem.
- THINK: Show intermediate reasoning or calculations (1 step at a time).
- RESULT: Give the final answer clearly.
Do not skip steps. Only output valid JSON.

Example:
User: Can you solve the given query
ASSISTANT: {"step": "START", "content": "The user wants me solve ...the given query"}
User: CONTINUE (next single step)
ASSISTANT: {"step": "THINK", "content": "This is typical math problem where we use bodmas"}
User: CONTINUE (next single step)
ASSISTANT: {"step": "THINK", "content": "Lets break down the problem step by step"}
User: CONTINUE (next single step)
ASSISTANT: {"step": "THINK", "content": "First lets solve the query/equation"}
User: CONTINUE (next single step)
ASSISTANT: {"step": "THINK", "content": "Now the equation looks like this"}
User: CONTINUE (next single step)
keep on performing in the same manner and use english words professionally and solve the query or equation step by step until you get the result
`;

async function Cot(userQuery) {
  const messages = [
    { role: "system", content: System_Prompt },
    { role: "user", content: userQuery },
  ];

  let finalAnswerFound = false;

  while (!finalAnswerFound) {
    const response = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: messages,
    });

    const rawContent = response.choices[0]?.message.content;

    let jsonMatches = rawContent.match(/\{[\s\S]*?\}/g); // Find all {...} blocks

    if (!jsonMatches) {
      console.error("❌ No JSON object found:", rawContent);
      break;
    }

    for (let match of jsonMatches) {
      let parsedContent;
      try {
        parsedContent = JSON.parse(match);
      } catch (error) {
        console.error("❌ Failed to parse JSON chunk:", match);
        continue;
      }

      //display the output
      if (parsedContent.step === "START") {
        console.log(`🚀 Start: ${parsedContent.content}`);
      } else if (parsedContent.step === "THINK") {
        console.log(`🤔💭 THINK: ${parsedContent.content}`);
      } else if (parsedContent.step === "RESULT") {
        console.log(`✅ RESULT: ${parsedContent.content}`);
        finalAnswerFound = true;
        break;
      }

      //add model's last step as context for the next turn
      messages.push({
        role: "assistant",
        content: JSON.stringify(parsedContent),
      });

      //user message telling model to continue
      messages.push({
        role: "user",
        content: "Continue to the next step",
      });
    }
  }
}

Cot("Hey, can you solve 10 * 6 - 20 * 3 / 7 * 2?");
