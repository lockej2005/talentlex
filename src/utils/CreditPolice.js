import { supabase } from '../supabaseClient';

export const checkCredits = async (userId) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('credits, hasPlus')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    if (userData.hasPlus) {
      return { hasEnoughCredits: true, hasPlus: true };
    }

    if (userData.credits < 10) {
      return { 
        hasEnoughCredits: false, 
        hasPlus: false,
        error: "Error: Insufficient credits. You need at least 10 credits to perform this operation."
      };
    }

    return { hasEnoughCredits: true, hasPlus: false, currentCredits: userData.credits };
  } catch (error) {
    console.error('Error checking credits:', error);
    return { 
      hasEnoughCredits: false, 
      hasPlus: false,
      error: "Error: Unable to check credit balance. Please try again later."
    };
  }
};

export const creditPolice = async (userId, operation) => {
  const { hasEnoughCredits, hasPlus, error, currentCredits } = await checkCredits(userId);
  
  if (!hasEnoughCredits && !hasPlus) {
    throw new Error(error);
  }
  
  try {
    const result = await operation();
    return result;
  } catch (error) {
    console.error('Error in operation:', error);
    throw error;
  }
};

export const subtractCreditsAndUpdateUser = async (userId, credits) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('credits, hasPlus')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    if (userData.hasPlus) {
      return { success: true, message: "No credits deducted for Plus users." };
    }

    const newCreditBalance = userData.credits - credits;
    if (newCreditBalance < 0) {
      return { success: false, error: "Error: Insufficient credits to complete this operation." };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCreditBalance })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { success: true, message: `${credits} credits deducted successfully.` };
  } catch (error) {
    console.error('Error subtracting credits:', error);
    return { success: false, error: "Error: Unable to subtract credits. Please try again later." };
  }
};