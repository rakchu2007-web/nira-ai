export interface Message {
  id: string;
  sender: 'user' | 'thozhi';
  text: string;
  timestamp: string;
  isPrivacyWarning?: boolean;
  audioUrl?: string;
  isAudioLoading?: boolean;
  matchedSchemeIds?: string[];
  suggestedQuestions?: string[];
}

export type SchemeCategory =
  | 'women'
  | 'education'
  | 'employment'
  | 'entrepreneurship'
  | 'farmers'
  | 'social_security';

export interface GovernmentScheme {
  id: string;
  nameTa: string;
  nameEn: string;
  category: SchemeCategory;
  categoryTa: string;
  categoryIcon: string;
  simpleExplanationTa: string;
  whyRelevantTa: string;
  basicEligibilityTa: string[];
  benefitsTa: string;
  requiredDocumentsTa: string[];
  howToApplyTa: string;
  officialSource: string;
  sourceName: string;
  sourceVerified: boolean;
  nextStepTa: string;
  tags: string[];
}

export type FontSize = 'normal' | 'large' | 'xlarge';

export interface AppSettings {
  fontSize: FontSize;
  highContrast: boolean;
  autoReadAloud: boolean;
  stepByStepMode: boolean;
}

export type NavigatorStep = 1 | 2 | 3 | 4;

export interface UserAnswers {
  state?: string;
  gender?: 'female' | 'male' | 'other';
  ageGroup?: 'under_18' | '18_35' | '35_60' | 'above_60';
  occupation?: 'student' | 'unemployed' | 'self_employed' | 'farmer' | 'wage_earner' | 'homemaker';
  income?: 'below_2_5_lakh' | 'above_2_5_lakh';
  maternalStatus?: 'pregnant' | 'has_infant' | 'has_girl_child' | 'none';
  disability?: boolean;
}
