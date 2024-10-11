import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_application } = req.body;

    if (!user_application) {
      return res.status(400).json({ error: 'user_application is required' });
    }

    // Get embedding for the user application
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: user_application,
    });

    const [{ embedding }] = embeddingResponse.data;

    // Fetch all examples from examples_vector
    const { data: examples, error } = await supabase
      .from('examples_vector')
      .select('id, application_text, vector');

    if (error) {
      console.error('Error fetching examples:', error);
      throw error;
    }

    // Process results locally
    const results = examples.map(example => {
      const exampleEmbedding = JSON.parse(example.vector);
      const similarity = dotProduct(embedding, exampleEmbedding);
      return {
        id: example.id,
        application_text: example.application_text,
        similarity
      };
    });

    // Sort results by similarity (highest first) and take top 10
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, 10);

    return res.status(200).json(topResults);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request' });
  }
}

function dotProduct(vecA, vecB) {
  return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
}