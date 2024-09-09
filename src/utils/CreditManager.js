import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://atbphpeswwgqvwlbplko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBocGVzd3dncXZ3bGJwbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNzY2MDksImV4cCI6MjAzODg1MjYwOX0.Imv3PmtGs9pGt6MvrvscR6cuv6WWCXKsSvwTZGjF4xU';
const supabase = createClient(supabaseUrl, supabaseKey);

export const subtractCredits = async (userId, cost) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    if (userData.credits < cost) {
      throw new Error('Insufficient credits');
    }

    const newCreditBalance = userData.credits - cost;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCreditBalance })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { success: true, newBalance: newCreditBalance };
  } catch (error) {
    console.error('Error subtracting credits:', error);
    return { success: false, error: error.message };
  }
};

export const subtractCreditsAndUpdateUser = async (userId, totalTokens) => {
  try {
    const cost = Math.round(totalTokens * 0.012);
    const { success, newBalance, error } = await subtractCredits(userId, cost);

    if (!success) {
      throw new Error(error || 'Failed to subtract credits');
    }

    return { success: true, cost, newBalance };
  } catch (error) {
    console.error('Error subtracting credits:', error);
    return { 
      success: false, 
      error: error.message === 'Insufficient credits' 
        ? "Error: Insufficient credits to complete this operation." 
        : "Error: Unable to process credits. Please try again later."
    };
  }
};