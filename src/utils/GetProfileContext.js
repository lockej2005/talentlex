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
    return null;
  }
  
  if (!data) {
    console.warn('No profile data found for user:', userId);
    return null;
  }

  return {
    education: data.education || 'N/A',
    sub_categories: data.sub_categories || 'N/A',
    undergraduate_grades: data.undergraduate_grades || 'N/A',
    work_experience: data.work_experience || 'N/A'
  };
};