export const QUESTION_TYPES = [
  'mcq',
  'multi-select',
  'true-false',
  'short-answer',
  'multi-blank',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface AntiCheatOptions {
  enabled: boolean;
  tabLock: boolean;
  uiRestrictions: boolean;
  fullscreenLock: boolean;
}

export type QuizEventType =
  | 'focus_lost'
  | 'focus_regained'
  | 'fullscreen_exit'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'context_menu_attempt';

export interface QuizEvent {
  type: QuizEventType;
  timestamp: string; // ISO 8601
  details?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  number: number;
  page: number;
  type: QuestionType;
  difficulty?: 'easy' | 'medium' | 'hard';
  prompt: string;
  codeSnippet?: string;
  codeLanguage?: string;
  points: number;
  options?: QuestionOption[];
  correctAnswer: string | string[]; // option id(s), text, or one entry per blank
  explanation?: string;
}

export type TemplateMode = 'paginated' | 'single-page';

export interface QuizConfig {
  id: string;
  title: string;
  courseCode: string;
  description: string;
  templateMode: TemplateMode;
  timeLimitMinutes: number;
  questionsPerPage: number;
  antiCheat?: AntiCheatOptions;
  questions: Question[];
}

export interface AttemptState {
  quizId: string;
  templateMode: TemplateMode;
  currentPage: number;
  answers: Record<string, string | string[]>; // questionId -> answer
  flagged: Record<string, boolean>; // questionId -> isFlagged
  remainingSeconds: number;
  eventLog: QuizEvent[];
  isSubmitted: boolean;
  submittedAt?: string; // ISO 8601
}

export interface QuestionResult {
  questionId: string;
  earnedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
  userAnswer: string | string[];
  correctAnswer: string | string[];
}

export interface QuizAttemptRecord {
  id: string;
  quizId: string;
  quizTitle: string;
  courseCode: string;
  timestamp: string; // ISO 8601
  earnedScore: number;
  totalPoints: number;
  percentage: number;
  timeTakenSeconds: number;
  eventLog: QuizEvent[];
  answers: Record<string, string | string[]>;
  quizSnapshot: QuizConfig;
}
