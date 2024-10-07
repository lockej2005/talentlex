import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function getFirmContext(firmId) {
  const { data, error } = await supabase
    .from('firms')
    .select('description')
    .eq('id', firmId)
    .single();

  if (error) {
    console.error('Error fetching firm context:', error);
    return "No firm context available.";
  }

  return data.description || "No firm context available.";
}

async function processSystemPrompt(systemPrompt, firmId) {
  const functionRegex = /\{&([^&]+)&\}/g;
  
  const replacements = await Promise.all(
    Array.from(systemPrompt.matchAll(functionRegex)).map(async ([full, functionName]) => {
      if (functionName === "firm_context") {
        return [full, await getFirmContext(firmId)];
      }
      return [full, full];  // Return the original string if no match
    })
  );

  let processedPrompt = systemPrompt;
  for (const [original, replacement] of replacements) {
    processedPrompt = processedPrompt.replace(original, replacement);
  }

  return processedPrompt;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const {
      applicationText,
      firm,
      firmId,
      question,
      work_experience = '',
      education = '',
      sub_category = '',
      system_prompt,
      model
    } = req.body;

    if (!applicationText || !firm || !firmId || !question || !system_prompt || !model) {
      res.status(400).json({ error: "Missing required data" });
      return;
    }

    try {
      // Process the system prompt
      const processedSystemPrompt = await processSystemPrompt(system_prompt, firmId);

      const userPrompt = `Firm: ${firm}
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

      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: processedSystemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      const aiFeedback = completion.choices[0].message.content;

      const usage = {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      };

      res.status(200).json({
        success: true,
        feedback: aiFeedback,
        usage: usage,
        model: model,
        system_prompt: processedSystemPrompt,
        user_prompt: userPrompt
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}