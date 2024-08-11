import { OpenAI } from 'openai';
import goodwin_prompt from './goodwin_prompt.js';
import white_and_case_prompt from './white_and_case_prompt.js';
import jones_day_prompt from './jones_day_prompt.js';
import sidley_austin_prompt from './sidley_austin_prompt.js';
import dechert_prompt from './dechert_prompt.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { applicationText, firm, question } = req.body;

    if (!applicationText || !firm || !question) {
      res.status(400).json({ error: "Missing required data" });
      return;
    }

    if (!["Goodwin", "White & Case", "Jones Day", "Sidley Austin", "Dechert"].includes(firm)) {
      res.status(200).json({
        success: true,
        feedback: "Coming Soon... Only Goodwin, White & Case, Jones Day, Sidley Austin, and Dechert are active right now."
      });
      return;
    }

    try {
      let system_prompt, model;

      switch (firm) {
        case "Goodwin":
          system_prompt = goodwin_prompt;
          model = "ft:gpt-4-1106-preview:personal::8G69twhK";
          break;
        case "White & Case":
          system_prompt = white_and_case_prompt;
          model = "gpt-4o";
          break;
        case "Jones Day":
          system_prompt = jones_day_prompt;
          model = "gpt-4o";
          break;
        case "Sidley Austin":
          system_prompt = sidley_austin_prompt;
          model = "gpt-4o";
          break;
        case "Dechert":
          system_prompt = dechert_prompt;
          model = "gpt-4o";
          break;
        default:
          throw new Error("Invalid firm specified");
      }

      const user_prompt = `Firm: ${firm}
      Question: ${question}
      New application to be analyzed:

      ${applicationText}`;

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_prompt }
        ]
      });

      const ai_feedback = completion.choices[0].message.content;

      res.status(200).json({
        success: true,
        feedback: ai_feedback
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while processing your request." });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}