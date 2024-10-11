import { supabase } from '../supabaseClient';

export const getFirmContext = async (firmName) => {
  console.log(`[getFirmContext] Starting to fetch context for firm: ${firmName}`);
  const startTime = performance.now();

  const { data, error } = await supabase
    .from('firms')
    .select('firm_context')
    .eq('name', firmName)
    .single();

  const endTime = performance.now();
  console.log(`[getFirmContext] Time taken: ${endTime - startTime}ms`);

  if (error) {
    console.error(`[getFirmContext] Error fetching firm context:`, error);
    return '';
  }

  if (!data) {
    console.warn(`[getFirmContext] No data found for firm: ${firmName}`);
    return '';
  }

  console.log(`[getFirmContext] Successfully fetched context for firm: ${firmName}`);
  return data.firm_context || '';
};

export const insertFirmContext = async (prompt, firmName) => {
  console.log(`[insertFirmContext] Starting context insertion for firm: ${firmName}`);
  console.log(`[insertFirmContext] Original prompt length: ${prompt.length}`);

  if (prompt.includes('{&firm_context_function&}')) {
    console.log(`[insertFirmContext] Found placeholder in prompt`);
    const firmContext = await getFirmContext(firmName);
    const updatedPrompt = prompt.replace('{&firm_context_function&}', firmContext);
    console.log(`[insertFirmContext] Updated prompt length: ${updatedPrompt.length}`);
    return updatedPrompt;
  }

  console.log(`[insertFirmContext] No placeholder found in prompt`);
  return prompt;
};

export const insertTopExamples = async (prompt, applicationText) => {
  console.log(`[insertTopExamples] Starting top examples insertion`);
  console.log(`[insertTopExamples] Original prompt length: ${prompt.length}`);

  if (prompt.includes('{&top_examples_retrieval&}')) {
    console.log(`[insertTopExamples] Found placeholder in prompt`);
    try {
      const response = await fetch('/api/search_examples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_application: applicationText }),
      });

      if (!response.ok) {
        console.error(`[insertTopExamples] Error fetching top examples:`, response.statusText);
        throw new Error('Failed to fetch top examples');
      }

      const similarExamples = await response.json();
      console.log(`[insertTopExamples] Received similar examples:`, JSON.stringify(similarExamples, null, 2));

      if (!Array.isArray(similarExamples) || similarExamples.length === 0) {
        console.warn(`[insertTopExamples] No similar examples found or invalid response`);
        return prompt.replace('{&top_examples_retrieval&}', '');
      }

      const examplesText = similarExamples
        .map(example => `Example (similarity: ${example.similarity.toFixed(4)}):\n${example.application_text}`)
        .join('\n\n');

      console.log(`[insertTopExamples] Processed examples text:`, examplesText);

      const updatedPrompt = prompt.replace('{&top_examples_retrieval&}', examplesText);
      console.log(`[insertTopExamples] Updated prompt length: ${updatedPrompt.length}`);
      return updatedPrompt;
    } catch (error) {
      console.error(`[insertTopExamples] Error processing top examples:`, error);
      return prompt.replace('{&top_examples_retrieval&}', '');
    }
  }

  console.log(`[insertTopExamples] No placeholder found in prompt`);
  return prompt;
};

export const logPromptDetails = (prompt) => {
  console.log(`[logPromptDetails] Prompt length: ${prompt.length}`);
  console.log(`[logPromptDetails] Prompt contains firm context placeholder: ${prompt.includes('{&firm_context_function&}')}`);
  console.log(`[logPromptDetails] Prompt contains top examples placeholder: ${prompt.includes('{&top_examples_retrieval&}')}`);
  console.log(`[logPromptDetails] First 100 characters: ${prompt.substring(0, 100)}`);
  console.log(`[logPromptDetails] Last 100 characters: ${prompt.substring(prompt.length - 100)}`);
};