import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const VerificationCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Update the verified status in profiles table
          await supabase
            .from('profiles')
            .update({ verified: true })
            .eq('email', user.email);
          
          // Redirect back to TalentLex Search
          navigate('/talentlex-search');
        }
      } catch (error) {
        console.error('Verification error:', error);
      }
    };

    handleVerification();
  }, [navigate]);

  return (
    <div>
      <h1>Verifying your email...</h1>
      <p>Please wait while we complete the verification process.</p>
    </div>
  );
};

export default VerificationCallback;