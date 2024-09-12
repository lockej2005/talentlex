// hooks/useUserActivity.js

import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

const useUserActivity = () => {
  useEffect(() => {
    const updateLastActive = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('Error fetching user:', authError);
        return;
      }

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ last_active: new Date().toISOString() })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating last_active:', error);
        }
      }
    };

    // Update on component mount
    updateLastActive();

    // Optionally, update at regular intervals (e.g., every 5 minutes)
    const interval = setInterval(updateLastActive, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);
};

export default useUserActivity;
