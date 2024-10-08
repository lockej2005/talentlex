import { supabase } from '../supabaseClient';

export const getFirmContext = async (firmName) => {
  console.log(`[getFirmContext] Starting to fetch context for firm: ${firmName}`);

  const startTime = Date.now();
  const { data, error } = await supabase
    .from('firms')
    .select('firm_context')
    .eq('name', firmName)
    .single();

  const endTime = Date.now();
  console.log(`[getFirmContext] Supabase query execution time: ${endTime - startTime}ms`);

  if (error) {
    console.error(`[getFirmContext] Error fetching firm context for ${firmName}:`, error);
    return '';
  }

  if (!data) {
    console.warn(`[getFirmContext] No data returned for firm: ${firmName}`);
    return '';
  }

  console.log(`[getFirmContext] Successfully fetched context for firm: ${firmName}`);
  console.log(`[getFirmContext] Context length: ${data.firm_context ? data.firm_context.length : 0} characters`);

  return data.firm_context || '';
};

export const insertFirmContext = async (prompt, firmName) => {
  console.log(`[insertFirmContext] Starting context insertion for firm: ${firmName}`);
  console.log(`[insertFirmContext] Original prompt length: ${prompt.length} characters`);

  if (prompt.includes('{&firm_context_function&}')) {
    console.log(`[insertFirmContext] Found placeholder in prompt for firm: ${firmName}`);
    
    const startTime = Date.now();
    const firmContext = await getFirmContext(firmName);
    const endTime = Date.now();
    
    console.log(`[insertFirmContext] Time taken to fetch firm context: ${endTime - startTime}ms`);
    console.log(`[insertFirmContext] Firm context length: ${firmContext.length} characters`);

    const updatedPrompt = prompt.replace('{&firm_context_function&}', firmContext);
    console.log(`[insertFirmContext] Updated prompt length: ${updatedPrompt.length} characters`);
    
    console.log(`[insertFirmContext] Context insertion complete for firm: ${firmName}`);
    return updatedPrompt;
  }

  console.log(`[insertFirmContext] No placeholder found in prompt for firm: ${firmName}`);
  return prompt;
};

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