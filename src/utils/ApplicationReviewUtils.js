import { supabase } from '../supabaseClient';
import { subtractCreditsAndUpdateUser } from './CreditManager';

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
  const response = await fetch('/api/submit_application', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(applicationData),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return await response.json();
};

export const createApplicationDraft = async (draftData) => {
  const response = await fetch('/api/create_application', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draftData),
  });

  if (!response.ok) {
    throw new Error('Failed to generate draft');
  }

  return await response.json();
};

export const handleApplicationSubmit = async (user, applicationText, selectedFirm, selectedQuestion, setFeedback, setTotalTokens, setResponseTime) => {
  if (!user) {
    throw new Error('Please log in to submit your application.');
  }

  const startTime = Date.now();
  let localTotalTokens = 0;

  const userAgent = navigator.userAgent;
  const screenSize = `${window.screen.width}x${window.screen.height}`;

  const data = await submitApplication({
    applicationText,
    firm: selectedFirm.value,
    question: selectedQuestion.value,
    email: user.email
  });

  setFeedback(data.feedback);

  localTotalTokens += data.usage.total_tokens;
  setTotalTokens(localTotalTokens);

  await insertApplication({
    firm: selectedFirm.value,
    question: selectedQuestion.value,
    application_text: applicationText,
    feedback: data.feedback,
    email: user.email,
    device: userAgent,
    screen_size: screenSize,
    timestamp: new Date().toISOString()
  });

  const endTime = Date.now();
  setResponseTime((endTime - startTime) / 1000);

  const { success, cost, newBalance, error } = await subtractCreditsAndUpdateUser(user.id, localTotalTokens);

  if (!success) {
    throw new Error(error);
  }

  return { cost, newBalance };
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

export const handleDraftCreation = async (user, selectedFirm, selectedQuestion, additionalInfo, setApplicationText, setTotalTokens, setFeedback) => {
  if (!user) {
    throw new Error('Please log in to generate a draft.');
  }

  let requiredFields;
  if (selectedFirm.value === "Jones Day") {
    requiredFields = ['whyLaw', 'whyJonesDay', 'whyYou', 'relevantExperiences'];
  } else {
    requiredFields = ['keyReasons', 'relevantExperience', 'relevantInteraction', 'personalInfo'];
  }

  const areAllFieldsFilled = requiredFields.every((field) => additionalInfo[field]?.trim() !== '');

  if (!areAllFieldsFilled) {
    throw new Error('Please fill out all the required information fields before generating a draft.');
  }

  let localTotalTokens = 0;

  const data = await createApplicationDraft({
    firm: selectedFirm.value,
    question: selectedQuestion.value,
    ...additionalInfo
  });

  localTotalTokens += data.usage.total_tokens;
  setTotalTokens(localTotalTokens);

  setApplicationText(data.draft);

  const { success, cost, newBalance, error } = await subtractCreditsAndUpdateUser(user.id, localTotalTokens);
  
  if (!success) {
    throw new Error(error);
  }

  let draftGenerationData;
  if (selectedFirm.value === "Jones Day") {
    draftGenerationData = {
      email: user.email,
      firm: selectedFirm.value,
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
      firm: selectedFirm.value,
      question: selectedQuestion.value,
      key_reasons: additionalInfo.keyReasons,
      relevant_experience: additionalInfo.relevantExperience,
      relevant_interaction: additionalInfo.relevantInteraction,
      personal_info: additionalInfo.personalInfo,
      generated_draft: data.draft
    };
  }

  await insertDraftGeneration(draftGenerationData);

  return { cost, newBalance };
};