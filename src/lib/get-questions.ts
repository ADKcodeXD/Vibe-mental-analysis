import type { Locale } from '../i18n-config';

export const getQuestions = async (assessmentId: string, locale: Locale) => {
  try {
    const module = await import(`../data/assessments/${assessmentId}/${locale}.json`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load questions for ${assessmentId} in ${locale}`, error);
    // Fallback to zh if locale not found for the assessment
    try {
      const module = await import(`../data/assessments/${assessmentId}/zh.json`);
      return module.default;
    } catch (e) {
      return null;
    }
  }
};

export const getAssessmentRegistry = async () => {
  const module = await import('../data/assessments/registry.json');
  return module.default;
};
