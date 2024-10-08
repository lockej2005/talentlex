import { supabase } from '../supabaseClient';
import { subtractCreditsAndUpdateUser } from './CreditManager';
import { creditPolice } from './CreditPolice';
import { getProfileContext } from './GetProfileContext';
import { insertFirmContext, logPromptDetails } from './PromptFunctions';

export const getCurrentUser = async () => {
  console.log('[getCurrentUser] Fetching current user');
  const { data: { user } } = await supabase.auth.getUser();
  console.log('[getCurrentUser] User fetched:', user ? user.id : 'No user found');
  return user;
};

export const getUserData = async (userId) => {
  console.log(`[getUserData] Fetching data for user: ${userId}`);
  const { data, error } = await supabase
    .from('user_drafts')
    .select('application_text, feedback')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error(`[getUserData] Error fetching user data:`, error);
    throw error;
  }
  console.log(`[getUserData] Data fetched successfully for user: ${userId}`);
  return data;
};

export const saveUserData = async (userId, applicationText, feedback) => {
  console.log(`[saveUserData] Saving data for user: ${userId}`);
  const { error } = await supabase
    .from('user_drafts')
    .upsert({ 
      user_id: userId, 
      application_text: applicationText, 
      feedback: feedback 
    });

  if (error) {
    console.error(`[saveUserData] Error saving user data:`, error);
    throw error;
  }
  console.log(`[saveUserData] Data saved successfully for user: ${userId}`);
};

export const insertApplication = async (applicationData) => {
  console.log(`[insertApplication] Inserting application for user: ${applicationData.email}`);
  const { data, error } = await supabase
    .from('applications')
    .insert(applicationData);

  if (error) {
    console.error(`[insertApplication] Error inserting application:`, error);
    throw error;
  }
  console.log(`[insertApplication] Application inserted successfully for user: ${applicationData.email}`);
  return data;
};

export const insertDraftGeneration = async (draftData) => {
  console.log(`[insertDraftGeneration] Inserting draft generation for user: ${draftData.email}`);
  const { data, error } = await supabase
    .from('draft_generations')
    .insert(draftData);

  if (error) {
    console.error(`[insertDraftGeneration] Error inserting draft generation:`, error);
    throw error;
  }
  console.log(`[insertDraftGeneration] Draft generation inserted successfully for user: ${draftData.email}`);
  return data;
};

export const getDraftSpecs = async (firmName, question) => {
  console.log(`[getDraftSpecs] Getting draft specs for firm: ${firmName}, question: ${question}`);
  let { data, error } = await supabase
    .from('questions')
    .select('draft_system_prompt, draft_model')
    .eq('question', question)
    .single();

  if (error || !data) {
    console.log(`[getDraftSpecs] No question-specific prompt found. Falling back to firm-level prompt.`);
    ({ data, error } = await supabase
      .from('firms')
      .select('draft_system_prompt, draft_model')
      .eq('name', firmName)
      .single());

    if (error) {
      console.error(`[getDraftSpecs] Error fetching firm-level prompt:`, error);
      throw error;
    }
  }

  console.log(`[getDraftSpecs] Retrieved system prompt before context insertion:`);
  logPromptDetails(data.draft_system_prompt);

  const updatedPrompt = await insertFirmContext(data.draft_system_prompt, firmName);

  console.log(`[getDraftSpecs] Updated system prompt after context insertion:`);
  logPromptDetails(updatedPrompt);

  return {
    system_prompt: updatedPrompt,
    model: data.draft_model
  };
};

export const getReviewSpecs = async (firmName, question) => {
  console.log(`[getReviewSpecs] Getting review specs for firm: ${firmName}, question: ${question}`);
  let { data, error } = await supabase
    .from('questions')
    .select('review_system_prompt, review_model')
    .eq('question', question)
    .single();

  if (error || !data) {
    console.log(`[getReviewSpecs] No question-specific prompt found. Falling back to firm-level prompt.`);
    ({ data, error } = await supabase
      .from('firms')
      .select('review_system_prompt, review_model')
      .eq('name', firmName)
      .single());

    if (error) {
      console.error(`[getReviewSpecs] Error fetching firm-level prompt:`, error);
      throw error;
    }
  }

  console.log(`[getReviewSpecs] Retrieved system prompt before context insertion:`);
  logPromptDetails(data.review_system_prompt);

  const updatedPrompt = await insertFirmContext(data.review_system_prompt, firmName);

  console.log(`[getReviewSpecs] Updated system prompt after context insertion:`);
  logPromptDetails(updatedPrompt);

  return {
    system_prompt: updatedPrompt,
    model: data.review_model
  };
};

export const submitApplication = async (applicationData) => {
  console.log(`[submitApplication] Starting application submission for user: ${applicationData.userId}, firm: ${applicationData.firmName}`);
  const userProfile = await getProfileContext(applicationData.userId);
  console.log(`[submitApplication] Retrieved user profile:`, userProfile);
  
  const { system_prompt, model } = await getReviewSpecs(applicationData.firmName, applicationData.question);
  
  console.log(`[submitApplication] Final system prompt before API call:`);
  logPromptDetails(system_prompt);

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
    console.error(`[submitApplication] API call failed:`, errorData);
    throw new Error(errorData.message || 'Network response was not ok');
  }

  const result = await response.json();
  console.log(`[submitApplication] Application submitted successfully. Response:`, result);
  return result;
};

export const createApplicationDraft = async (draftData) => {
  console.log(`[createApplicationDraft] Starting draft creation for user: ${draftData.userId}, firm: ${draftData.firmName}`);
  const userProfile = await getProfileContext(draftData.userId);
  console.log(`[createApplicationDraft] Retrieved user profile:`, userProfile);

  const { system_prompt, model } = await getDraftSpecs(draftData.firmName, draftData.question);

  console.log(`[createApplicationDraft] Final system prompt before API call:`);
  logPromptDetails(system_prompt);

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
    console.error(`[createApplicationDraft] API call failed:`, errorData);
    throw new Error(errorData.message || 'Failed to generate draft');
  }

  const result = await response.json();
  console.log(`[createApplicationDraft] Draft created successfully. Response:`, result);
  return result;
};

export const calculateAndUpdateScores = async (userId, firmId) => {
  console.log(`[calculateAndUpdateScores] Starting score calculation for user: ${userId}, firm: ${firmId}`);
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

    console.log(`[calculateAndUpdateScores] Sending data to backend for score calculation`);
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
      console.error(`[calculateAndUpdateScores] Failed to calculate scores:`, errorText);
      throw new Error(`Failed to calculate scores: ${errorText}`);
    }

    const scoreData = await response.json();
    console.log(`[calculateAndUpdateScores] Scores calculated successfully:`, scoreData);

    console.log(`[calculateAndUpdateScores] Updating firm_user_table with new scores`);
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

    if (updateError) {
      console.error(`[calculateAndUpdateScores] Error updating firm_user_table:`, updateError);
      throw updateError;
    }

    console.log(`[calculateAndUpdateScores] Scores updated successfully`);
    return scoreData;
  } catch (error) {
    console.error('Error calculating and updating scores:', error);
    throw error;
  }
};

export const handleApplicationSubmit = async (user, applicationText, selectedFirm, selectedQuestion) => {
  console.log(`[handleApplicationSubmit] Starting application submission process for user: ${user.id}`);
  
  if (!user) {
    throw new Error('Please log in to submit your application.');
  }

  return await creditPolice(user.id, async () => {
    const startTime = Date.now();

    const userAgent = navigator.userAgent;
    const screenSize = `${window.screen.width}x${window.screen.height}`;

    console.log(`[handleApplicationSubmit] Submitting application`);
    const data = await submitApplication({
      userId: user.id,
      applicationText,
      firmId: selectedFirm.id,
      firmName: selectedFirm.name,
      question: selectedQuestion.value,
      email: user.email
    });

    console.log(`[handleApplicationSubmit] Inserting application data`);
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

    console.log(`[handleApplicationSubmit] Calculating and updating scores`);
    // Calculate and update scores
    const scoreData = await calculateAndUpdateScores(user.id, selectedFirm.id);

    console.log(`[handleApplicationSubmit] Subtracting credits and updating user`);
    // Subtract credits only once, after all operations are complete
    const { success, cost, newBalance, error } = await subtractCreditsAndUpdateUser(user.id, data.usage.total_tokens);

    if (!success) {
      console.error(`[handleApplicationSubmit] Error subtracting credits:`, error);
      throw new Error(error);
    }

    console.log(`[handleApplicationSubmit] Application submission process completed. Total time: ${responseTime}s`);

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
  console.log(`[saveDraft] Saving draft for user: ${userId}, firm: ${firm}`);
  const { data, error } = await supabase
    .from('saved_drafts')
    .insert({
      user_id: userId,
      title: title,
      draft: draft,
      firm: firm,
      question: question
    });

  if (error) {
    console.error(`[saveDraft] Error saving draft:`, error);
    throw error;
  }
  console.log(`[saveDraft] Draft saved successfully for user: ${userId}`);
  return data;
};

export const handleDraftCreation = async (user, selectedFirm, selectedQuestion, additionalInfo, setApplicationText, setTotalTokens) => {
  console.log(`[handleDraftCreation] Starting draft creation for user: ${user.id}, firm: ${selectedFirm.name}`);
  
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
    console.error(`[handleDraftCreation] Not all required fields are filled`);
    throw new Error('Please fill out all the required information fields before generating a draft.');
  }

  try {
    console.log(`[handleDraftCreation] Creating application draft`);
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

    console.log(`[handleDraftCreation] Inserting draft generation data`);
    await insertDraftGeneration(draftGenerationData);

    console.log(`[handleDraftCreation] Draft creation completed successfully`);
    return { success: true, draft: data.draft, usage: data.usage };
  } catch (error) {
    console.error('Error in handleDraftCreation:', error);
    throw error;
  }
};