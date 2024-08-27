import axios from 'axios';
import { supabase } from '../supabaseClient';
import { subtractCreditsAndUpdateUser } from './CreditManager';

export const logToSupabase = async (data) => {
  try {
    const { error } = await supabase
      .from('due_diligence_log')
      .insert([
        {
          background_info: data.backgroundInfo,
          facts: data.facts,
          point1_title: data.results[0]?.title || null,
          point1_body: data.results[0]?.explanation || null,
          point1_url: data.results[0]?.source || null,
          point2_title: data.results[1]?.title || null,
          point2_body: data.results[1]?.explanation || null,
          point2_url: data.results[1]?.source || null,
          point3_title: data.results[2]?.title || null,
          point3_body: data.results[2]?.explanation || null,
          point3_url: data.results[2]?.source || null,
          point4_title: data.results[3]?.title || null,
          point4_body: data.results[3]?.explanation || null,
          point4_url: data.results[3]?.source || null,
          point5_title: data.results[4]?.title || null,
          point5_body: data.results[4]?.explanation || null,
          point5_url: data.results[4]?.source || null,
          point6_title: data.results[5]?.title || null,
          point6_body: data.results[5]?.explanation || null,
          point6_url: data.results[5]?.source || null,
        }
      ]);

    if (error) throw error;
    console.log('Logged to Supabase successfully');
  } catch (error) {
    console.error('Error logging to Supabase:', error);
    throw error;
  }
};

export const fetchDueDiligenceResults = async (backgroundInfo, facts, user) => {
  try {
    const response = await axios.post('/api/due_diligence', {
      prompt: `Background Information: ${backgroundInfo}\n\nFacts: ${facts}`
    });

    if (response.data && response.data.due_diligence_points) {
      const { due_diligence_points, usage } = response.data;

      // Deduct credits
      const { success, cost, newBalance, error } = await subtractCreditsAndUpdateUser(user.id, usage.total_tokens);

      if (!success) {
        throw new Error(error || 'Failed to deduct credits');
      }

      return {
        results: due_diligence_points,
        searchQueries: response.data.search_queries,
        searchResults: response.data.scraped_contents,
        creditsUsed: cost,
        newBalance
      };
    } else if (response.data && response.data.error) {
      throw new Error(response.data.error);
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching results:', error);
    throw error;
  }
};