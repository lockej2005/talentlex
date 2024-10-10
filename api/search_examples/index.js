import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_application } = req.body;

    if (!user_application) {
      return res.status(400).json({ error: 'user_application is required' });
    }

    // Get embedding for the user's application
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: user_application,
    });

    const [{ embedding }] = embeddingResponse.data;

    // Perform vector similarity search
    const { data: examples, error } = await supabase
      .from('example_vectors')
      .select('id, application_text, vector')
      .order('vector <-> $1', { ascending: true })
      .limit(10)
      .values([embedding]);

    if (error) {
      throw error;
    }

    // Extract application_text from similar examples
    const topExamples = examples.map(example => example.application_text);

    return res.status(200).json({ similar_examples: topExamples });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request' });
  }
}