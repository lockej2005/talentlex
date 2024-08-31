import { supabase } from '../supabaseClient';

export const getProfileContext = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required to fetch profile context');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('education, sub_categories, undergraduate_grades, work_experience')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return '';
  }
  
  if (!data) {
    console.warn('No profile data found for user:', userId);
    return '';
  }

  // Combine all profile fields into a single string
  const profileString = `Education: ${data.education || 'N/A'}. Sub-categories: ${data.sub_categories || 'N/A'}. Undergraduate grades: ${data.undergraduate_grades || 'N/A'}. Work experience: ${data.work_experience || 'N/A'}.`;
  
  return profileString;
};