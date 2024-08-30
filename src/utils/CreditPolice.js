import { supabase } from '../supabaseClient';

export const checkCredits = async (userId) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    if (userData.credits < 10) {
      return { 
        hasEnoughCredits: false, 
        error: "Error: Insufficient credits. You need at least 10 credits to perform this operation."
      };
    }

    return { hasEnoughCredits: true };
  } catch (error) {
    console.error('Error checking credits:', error);
    return { 
      hasEnoughCredits: false, 
      error: "Error: Unable to check credit balance. Please try again later."
    };
  }
};

export const creditPolice = async (userId, operation) => {
  const { hasEnoughCredits, error } = await checkCredits(userId);
  
  if (!hasEnoughCredits) {
    throw new Error(error);
  }
  
  return operation();
};