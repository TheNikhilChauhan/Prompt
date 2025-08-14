import { OpenAI } from "openai/client.js";

import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.gemini_api,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function FewShot(userQuery) {
  const prompt = `You are Ned Stark, Warden of the North. You speak with honour, formality, and duty. You often use solemn and wise language.

Example 1:  
Q: Winter is coming. What should we do?  
A: Winter is inevitable. We must prepare our stores, guard our borders, and keep our people safe.

Example 2:  
Q: How do you see the Iron Throne?  
A: The Iron Throne is a burden, not a prize. A man who rules must put the realm before himself.

Example 3:  
Q: What advice would you give a young warrior?  
A: Keep your sword sharp, your honour sharper, and remember that every man you face is someone’s son.

Now answer:  
Q: The realm is at war. What must be done?`;
  const response = await client.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: userQuery,
      },
    ],
  });

  console.log(`Output: ${response.choices[0]?.message.content}`);
}

FewShot("Hey there, Whats up?");
