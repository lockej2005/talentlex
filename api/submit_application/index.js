const { OpenAI } = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle POST request
  if (req.method === 'POST') {
    const { applicationText, firm, question, work_experience = '', education = '', sub_category = '', system_prompt, model } = req.body;

    if (!applicationText || !firm || !question || !system_prompt || !model) {
      res.status(400).json({ error: "Missing required data" });
      return;
    }

    try {
      const user_prompt = `Firm: ${firm}
      Question: ${question}
      Application decision:
      This application was rejected.

      Open-Text Answer:
      ${applicationText}

      Work Experience:
      ${work_experience}

      Education:
      This applicant studied at ${education} for a ${sub_category}.
      `;

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_prompt }
        ]
      });

      const ai_feedback = completion.choices[0].message.content;

      const usage = {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      };

      res.status(200).json({
        success: true,
        feedback: ai_feedback,
        usage: usage,
        model: model,
        system_prompt: system_prompt,
        user_prompt: user_prompt
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};