/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
  nationalId?: string;
  phone?: string;
  parentPhone?: string;
  email?: string;
  school?: string;
  grade?: string;
  className?: string;
  section?: string;
  gender?: 'male' | 'female';
  birthDate?: string;
  photoUrl?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  description?: string;
  createdAt: string;
}

export interface Teacher {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  subjectIds: string[];
  permissions: string[];
  assignedGrades: string[];
  createdAt: string;
}

export interface QuestionBank {
  id: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  chapter: string;
  lesson: string;
  topic: string;
  description?: string;
  questionCount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType =
  | 'mcq'
  | 'tf'
  | 'multi'
  | 'fill'
  | 'matching'
  | 'ordering'
  | 'image'
  | 'paragraph'
  | 'case_study'
  | 'equation'
  | 'audio'
  | 'video';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  matchTarget?: string; // For matching type
  orderIndex?: number;
  imageUrl?: string;
}

export interface Question {
  id: string;
  bankId: string;
  bankTitle?: string;
  type: QuestionType;
  text: string;
  subject: string;
  chapter: string;
  lesson: string;
  topic: string;
  difficulty: DifficultyLevel;
  estimatedTimeSeconds: number;
  score: number;
  tags: string[];
  hints?: string;
  explanation?: string;
  options: QuestionOption[];
  correctAnswer?: string | string[] | Record<string, string>;
  mediaUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExamMode = 'official' | 'practice' | 'quiz' | 'placement' | 'final' | 'mock';

export interface SmartDistribution {
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  chapters?: string[];
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName?: string;
  bankId: string;
  bankTitle?: string;
  createdBy: string;
  mode: ExamMode;
  durationMinutes: number;
  passingPercentage: number;
  startDate: string;
  endDate: string;
  allowedAttempts: number;
  showResultImmediately: boolean;
  showAnswers: boolean;
  negativeMarking: boolean;
  calculatorAllowed: boolean;
  fullscreenRequired: boolean;
  randomizationEnabled: boolean;
  autoSubmit: boolean;
  passwordProtected: boolean;
  examPassword?: string;
  randomQuestionCount: number;
  smartDistribution?: SmartDistribution;
  isActive: boolean;
  createdAt: string;
  questionCount?: number;
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  matchingPairs?: Record<string, string>;
  orderedItemIds?: string[];
  visited: boolean;
  flagged: boolean;
  timeSpentSeconds: number;
}

export type ExamSessionStatus = 'in_progress' | 'submitted' | 'paused' | 'auto_submitted' | 'terminated';

export interface ExamSession {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  startTime: string;
  endTime?: string;
  status: ExamSessionStatus;
  currentQuestionIndex: number;
  remainingSeconds: number;
  warningsCount: number;
  fullscreenViolationsCount: number;
  answers: Record<string, StudentAnswer>;
  flaggedQuestions: string[];
  assignedQuestions: Question[];
  watermarkText: string;
  ipAddress: string;
  lastActivity: string;
  score?: number;
  totalScore?: number;
  passStatus?: 'passed' | 'failed' | 'pending';
}

export interface Result {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  examId: string;
  examTitle: string;
  subjectName: string;
  score: number;
  totalPossibleScore: number;
  percentage: number;
  gradeLetter: string;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeSpentSeconds: number;
  completedAt: string;
  passStatus: 'passed' | 'failed';
  answersReview?: Record<string, {
    questionText: string;
    scoreObtained: number;
    maxScore: number;
    isCorrect: boolean;
    studentAnswer: any;
    correctAnswer: any;
    explanation?: string;
  }>;
}

export interface LiveStudentMonitor {
  sessionId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  examTitle: string;
  status: ExamSessionStatus;
  currentQuestion: number;
  totalQuestions: number;
  remainingSeconds: number;
  progressPercentage: number;
  warningsCount: number;
  fullscreenOk: boolean;
  ipAddress: string;
  lastActiveFormatted: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface BackupItem {
  id: string;
  filename: string;
  filesizeBytes: number;
  timestamp: string;
  type: 'manual' | 'auto_daily' | 'auto_weekly';
}

export interface SystemSettings {
  platformName: string;
  platformNameAr: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  defaultExamRules: {
    durationMinutes: number;
    passingPercentage: number;
    allowedAttempts: number;
    fullscreenRequired: boolean;
    negativeMarking: boolean;
    showResultImmediately: boolean;
  };
  security: {
    maxWarningsAllowed: number;
    autoSubmitOnMaxWarnings: boolean;
    watermarkEnabled: boolean;
    disableCopyPaste: boolean;
  };
  language: 'ar' | 'en';
  serverIp?: string;
  serverPort?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: 'all' | 'student' | 'teacher';
  createdBy: string;
  createdAt: string;
  isPinned: boolean;
}
