import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.gemini_api,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const MODEL = "gemini-2.0-flash";

// ---- System prompt: one-step-per-turn + single-line JSON ----
const SYSTEM_PROMPT = `
You are an interactive, turn-based problem solver.

Output FORMAT (strict):
- Respond with EXACTLY ONE JSON object per reply (not more).
- JSON schema: {"step":"START"|"THINK"|"RESULT","content":"string"}
- "content" MUST be a single line (no newlines), <= 200 characters.
- No code fences, no prose outside the JSON object.

Turn protocol:
- On the first turn, reply with START.
- On subsequent turns, reply with exactly one next step (THINK...), and finally RESULT.
- Do NOT anticipate multiple steps in one reply. Wait for the user to say "CONTINUE" to produce the next step.

Example interaction:
User: Solve 12 * 3 - 5 * 2 + 8
Assistant: {"step":"START","content":"I will solve it using order of operations."}
User: CONTINUE (next single step)
Assistant: {"step":"THINK","content":"12*3=36; expression becomes 36 - 5*2 + 8"}
User: CONTINUE (next single step)
Assistant: {"step":"THINK","content":"5*2=10; expression becomes 36 - 10 + 8"}
User: CONTINUE (next single step)
Assistant: {"step":"THINK","content":"36 - 10 = 26; now 26 + 8 = 34"}
User: CONTINUE (next single step)
Assistant: {"step":"RESULT","content":"34"}
`.trim();

// --- helper: get first JSON object from any messy model output ---
function extractFirstJsonObject(text) {
  // strip code fences if any
  const cleaned = text.replace(/```[\s\S]*?```/g, "").trim();
  // find the first {...} block (content disallows newlines, but we still keep flexible)
  const match = cleaned.match(/\{[\s\S]*?\}/);
  return match ? match[0] : null;
}

async function CoT(userQuery) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userQuery },
  ];

  let done = false;

  while (!done) {
    const res = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      // optional stops: if shim supports it, this helps prevent multi-objects
      stop: ["}\n{", "}\n\n{"],
      messages,
    });

    const raw = res.choices?.[0]?.message?.content ?? "";
    const firstJson = extractFirstJsonObject(raw);

    if (!firstJson) {
      console.error("❌ No valid JSON found in response:", raw);
      break;
    }

    let stepObj;
    try {
      stepObj = JSON.parse(firstJson);
    } catch (e) {
      console.error("❌ Failed to parse JSON:", firstJson);
      break;
    }

    // pretty logs
    const tag =
      stepObj.step === "START"
        ? "🚀 START"
        : stepObj.step === "THINK"
        ? "💭 THINK"
        : stepObj.step === "RESULT"
        ? "✅ RESULT"
        : "ℹ️ STEP";
    console.log(`${tag}: ${stepObj.content}`);

    if (stepObj.step === "RESULT") {
      done = true; // stop BOTH loops
      break;
    }

    // push assistant step as context
    messages.push({ role: "assistant", content: JSON.stringify(stepObj) });

    // ask explicitly for only the NEXT single step
    messages.push({
      role: "user",
      content:
        "CONTINUE (Return ONLY the next single step as one JSON object. Do not include multiple steps.)",
    });
  }
}

// example
CoT("Hey, can you solve 14 * 6 - 12 * 3 / 7 * 21?");
