import { supabase } from '../supabaseClient';
import { subtractCreditsAndUpdateUser } from './CreditManager';
import { creditPolice } from './CreditPolice';
import { getProfileContext } from './GetProfileContext';
import { getReviewSpecs } from './ReviewGetSpecs';

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getUserData = async (userId) => {
  const { data, error } = await supabase
    .from('user_drafts')
    .select('application_text, feedback')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const saveUserData = async (userId, applicationText, feedback) => {
  const { error } = await supabase
    .from('user_drafts')
    .upsert({ 
      user_id: userId, 
      application_text: applicationText, 
      feedback: feedback 
    });

  if (error) throw error;
};

export const insertApplication = async (applicationData) => {
  const { data, error } = await supabase
    .from('applications')
    .insert(applicationData);

  if (error) throw error;
  return data;
};

export const insertDraftGeneration = async (draftData) => {
  const { data, error } = await supabase
    .from('draft_generations')
    .insert(draftData);

  if (error) throw error;
  return data;
};

export const submitApplication = async (applicationData) => {
  const userProfile = await getProfileContext(applicationData.userId);
  
  const { system_prompt, model } = await getReviewSpecs(applicationData.firmName, applicationData.question);

  const response = await fetch('/api/submit_application', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      applicationText: applicationData.applicationText,
      firm: applicationData.firmName,
      question: applicationData.question,
      work_experience: userProfile.work_experience,
      education: userProfile.education,
      sub_category: userProfile.sub_categories,
      system_prompt,
      model,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Network response was not ok');
  }

  return await response.json();
};

export const createApplicationDraft = async (draftData) => {
  const userProfile = await getProfileContext(draftData.userId);

  const { system_prompt, model } = await getReviewSpecs(draftData.firmName, draftData.question);

  // Map the notes to the expected fields
  const mappedData = {
    ...draftData,
    keyReasons: draftData.note_1,
    relevantExperience: draftData.note_2,
    relevantInteraction: draftData.note_3,
    personalInfo: draftData.note_4,
    userProfile,
    system_prompt,
    model
  };

  const response = await fetch('/api/create_application', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mappedData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate draft');
  }

  return await response.json();
};

export const calculateAndUpdateScores = async (userId, firmId) => {
  try {
    // Fetch firm details including prompts and models
    const { data: firmData, error: firmError } = await supabase
      .from('firms')
      .select('workexp_model, workexp_prompt, opentext_model, opentext_prompt, education_model, education_prompt, id')
      .eq('id', firmId)
      .single();

    if (firmError) throw firmError;

    // Fetch open text applications
    const { data: applicationsData, error: applicationsError } = await supabase
      .from('applications_vector')
      .select('question, application_text')
      .eq('firm_id', firmId)
      .eq('user_id', userId);

    if (applicationsError) throw applicationsError;

    // Fetch education details
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('education, sub_categories, undergraduate_grades')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Fetch work experience
    const { data: workExpData, error: workExpError } = await supabase
      .from('firm_user_table')
      .select('work_experience')
      .eq('user_id', userId)
      .eq('firm_id', firmId)
      .single();

    if (workExpError) throw workExpError;

    // Prepare data for backend
    const openTextContent = applicationsData.map(app => `Question: ${app.question}\nAnswer: ${app.application_text}`).join('\n\n');
    const educationContent = `Education: ${profileData.education || 'N/A'}\nSub-categories: ${Array.isArray(profileData.sub_categories) ? profileData.sub_categories.join(', ') : (profileData.sub_categories || 'N/A')}\nUndergraduate Grades: ${profileData.undergraduate_grades || 'N/A'}`;
    const workExpContent = workExpData.work_experience || '[]';

    // Send data to backend for score calculation
    const response = await fetch('/api/calculate_scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workexp_content: workExpContent,
        workexp_model: firmData.workexp_model || 'gpt-4o-mini',
        workexp_prompt: firmData.workexp_prompt || '',
        opentext_content: openTextContent,
        opentext_model: firmData.opentext_model || 'gpt-4o-mini',
        opentext_prompt: firmData.opentext_prompt || '',
        education_content: educationContent,
        education_model: firmData.education_model || 'gpt-4o-mini',
        education_prompt: firmData.education_prompt || ''
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to calculate scores: ${errorText}`);
    }

    const scoreData = await response.json();

    // Update firm_user_table with the new scores and justifications
    const { error: updateError } = await supabase
      .from('firm_user_table')
      .upsert({
        user_id: userId,
        firm_id: firmId,
        opentext_score: scoreData.opentext.score,
        workexp_score: scoreData.workexp.score,
        education_score: scoreData.education.score,
        weighted_score: scoreData.weighted_score,
        opentext_justification: scoreData.opentext.justification,
        workexp_justification: scoreData.workexp.justification,
        education_justification: scoreData.education.justification
      }, {
        onConflict: 'user_id,firm_id'
      });

    if (updateError) throw updateError;

    return scoreData;
  } catch (error) {
    console.error('Error calculating and updating scores:', error);
    throw error;
  }
};

export const handleApplicationSubmit = async (user, applicationText, selectedFirm, selectedQuestion) => {
  if (!user) {
    throw new Error('Please log in to submit your application.');
  }

  return await creditPolice(user.id, async () => {
    const startTime = Date.now();

    const userAgent = navigator.userAgent;
    const screenSize = `${window.screen.width}x${window.screen.height}`;

    const data = await submitApplication({
      userId: user.id,
      applicationText,
      firmId: selectedFirm.id,
      firmName: selectedFirm.name,
      question: selectedQuestion.value,
      email: user.email
    });

    await insertApplication({
      firm: selectedFirm.name,
      question: selectedQuestion.value,
      application_text: applicationText,
      feedback: data.feedback,
      email: user.email,
      device: userAgent,
      screen_size: screenSize,
      timestamp: new Date().toISOString()
    });

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    // Calculate and update scores
    const scoreData = await calculateAndUpdateScores(user.id, selectedFirm.id);

    // Subtract credits only once, after all operations are complete
    const { success, cost, newBalance, error } = await subtractCreditsAndUpdateUser(user.id, data.usage.total_tokens);

    if (!success) {
      throw new Error(error);
    }

    return {
      success: true,
      feedback: data.feedback,
      cost,
      newBalance,
      usage: data.usage,
      responseTime,
      scoreData
    };
  });
};

export const saveDraft = async (userId, title, draft, firm, question) => {
  const { data, error } = await supabase
    .from('saved_drafts')
    .insert({
      user_id: userId,
      title: title,
      draft: draft,
      firm: firm,
      question: question
    });

  if (error) throw error;
  return data;
};

export const handleDraftCreation = async (user, selectedFirm, selectedQuestion, additionalInfo, setApplicationText, setTotalTokens) => {
  if (!user) {
    throw new Error('Please log in to generate a draft.');
  }

  let requiredFields;
  if (selectedFirm.name === "Jones Day") {
    requiredFields = ['whyLaw', 'whyJonesDay', 'whyYou', 'relevantExperiences'];
  } else {
    requiredFields = ['note_1', 'note_2', 'note_3', 'note_4'];
  }

  const areAllFieldsFilled = requiredFields.every((field) => additionalInfo[field]?.trim() !== '');

  if (!areAllFieldsFilled) {
    throw new Error('Please fill out all the required information fields before generating a draft.');
  }

  try {
    const data = await createApplicationDraft({
      userId: user.id,
      firmId: selectedFirm.id,
      firmName: selectedFirm.name,
      question: selectedQuestion.value,
      ...additionalInfo
    });

    setApplicationText(data.draft);
    setTotalTokens(data.usage.total_tokens);

    let draftGenerationData;
    if (selectedFirm.name === "Jones Day") {
      draftGenerationData = {
        email: user.email,
        firm: selectedFirm.name,
        question: selectedQuestion.value,
        key_reasons: additionalInfo.whyLaw,
        relevant_experience: additionalInfo.relevantExperiences,
        relevant_interaction: additionalInfo.whyJonesDay,
        personal_info: additionalInfo.whyYou,
        generated_draft: data.draft
      };
    } else {
      draftGenerationData = {
        email: user.email,
        firm: selectedFirm.name,
        question: selectedQuestion.value,
        key_reasons: additionalInfo.note_1,
        relevant_experience: additionalInfo.note_2,
        relevant_interaction: additionalInfo.note_3,
        personal_info: additionalInfo.note_4,
        generated_draft: data.draft
      };
    }

    await insertDraftGeneration(draftGenerationData);

    return { success: true, draft: data.draft, usage: data.usage };
  } catch (error) {
    console.error('Error in handleDraftCreation:', error);
    throw error;
  }
};