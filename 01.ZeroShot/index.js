import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.gemini_api,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function zeroShot() {
  const response = await client.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [{ role: "user", content: "Hey there, My name is Nikhil" }],
  });

  console.log("Output: ", response.choices[0].message.content);
}

zeroShot();
