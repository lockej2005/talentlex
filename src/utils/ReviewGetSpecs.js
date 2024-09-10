import { supabase } from '../supabaseClient';

export const getReviewSpecs = async (firm, question) => {
  // First, try to get the specs from the questions table
  let { data: questionData, error: questionError } = await supabase
    .from('questions')
    .select('review_system_prompt, review_model')
    .eq('firm', firm)
    .eq('question', question)
    .single();

  if (questionError) {
    console.error('Error fetching question data:', questionError);
    questionData = { review_system_prompt: null, review_model: null };
  }

  // If either prompt or model is null, fetch from the firms table
  if (!questionData.review_system_prompt || !questionData.review_model) {
    const { data: firmData, error: firmError } = await supabase
      .from('firms')
      .select('review_system_prompt, review_model')
      .eq('name', firm)
      .single();

    if (firmError) {
      console.error('Error fetching firm data:', firmError);
      throw new Error('Unable to fetch review specifications');
    }

    // Use firm data as fallback
    questionData.review_system_prompt = questionData.review_system_prompt || firmData.review_system_prompt;
    questionData.review_model = questionData.review_model || firmData.review_model;
  }

  if (!questionData.review_system_prompt || !questionData.review_model) {
    throw new Error('Unable to find review specifications');
  }

  return {
    system_prompt: questionData.review_system_prompt,
    model: questionData.review_model
  };
};