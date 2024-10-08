import { supabase } from '../supabaseClient';

export const getFirmDescription = async (firmName) => {
  console.log(`[getFirmDescription] Starting to fetch description for firm: ${firmName}`);

  const startTime = Date.now();
  const { data, error } = await supabase
    .from('firms')
    .select('description')
    .eq('name', firmName)
    .single();

  const endTime = Date.now();
  console.log(`[getFirmDescription] Supabase query execution time: ${endTime - startTime}ms`);

  if (error) {
    console.error(`[getFirmDescription] Error fetching firm description for ${firmName}:`, error);
    return '';
  }

  if (!data) {
    console.warn(`[getFirmDescription] No data returned for firm: ${firmName}`);
    return '';
  }

  console.log(`[getFirmDescription] Successfully fetched description for firm: ${firmName}`);
  console.log(`[getFirmDescription] Description length: ${data.description ? data.description.length : 0} characters`);

  return data.description || '';
};

export const insertFirmContext = async (prompt, firmName) => {
  console.log(`[insertFirmContext] Starting context insertion for firm: ${firmName}`);
  console.log(`[insertFirmContext] Original prompt length: ${prompt.length} characters`);

  if (prompt.includes('{&firm_context_function&}')) {
    console.log(`[insertFirmContext] Found placeholder in prompt for firm: ${firmName}`);
    
    const startTime = Date.now();
    const firmDescription = await getFirmDescription(firmName);
    const endTime = Date.now();
    
    console.log(`[insertFirmContext] Time taken to fetch firm description: ${endTime - startTime}ms`);
    console.log(`[insertFirmContext] Firm description length: ${firmDescription.length} characters`);

    const updatedPrompt = prompt.replace('{&firm_context_function&}', firmDescription);
    console.log(`[insertFirmContext] Updated prompt length: ${updatedPrompt.length} characters`);
    
    console.log(`[insertFirmContext] Context insertion complete for firm: ${firmName}`);
    return updatedPrompt;
  }

  console.log(`[insertFirmContext] No placeholder found in prompt for firm: ${firmName}`);
  return prompt;
};

// Add a new function for logging purposes
export const logPromptDetails = (prompt) => {
  console.log(`[logPromptDetails] Prompt details:`);
  console.log(`  - Total length: ${prompt.length} characters`);
  console.log(`  - Word count: ${prompt.split(/\s+/).length} words`);
  console.log(`  - Contains placeholder: ${prompt.includes('{&firm_context_function&}')}`);
  
  const lines = prompt.split('\n');
  console.log(`  - Number of lines: ${lines.length}`);
  console.log(`  - First 50 characters: "${prompt.substring(0, 50)}..."`);
  console.log(`  - Last 50 characters: "...${prompt.substring(prompt.length - 50)}"`);
};