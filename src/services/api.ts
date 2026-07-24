/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Subject,
  QuestionBank,
  Question,
  Exam,
  ExamSession,
  Result,
  LiveStudentMonitor,
  ActivityLog,
  BackupItem,
  Announcement,
} from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let msg = 'حدث خطأ في الاتصال بالخادم المحلي';
    try {
      const errData = await res.json();
      if (errData.error) msg = errData.error;
    } catch (_) {}
    throw new Error(msg);
  }

  return res.json();
}

export const api = {
  // Network
  getNetworkInfo: () => fetchJson<{ hostIp: string; port: number; lanUrl: string; qrCodeDataUrl: string }>(`/api/network-info`),

  // Auth
  login: (identifier: string, password_hash: string, role?: string) =>
    fetchJson<{ user: User; token: string }>(`/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ identifier, password: password_hash, role }),
    }),

  registerStudent: (data: { fullName: string; password: string; phone: string; grade?: string }) =>
    fetchJson<{ user: User; token: string }>(`/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard Stats
  getDashboardStats: () =>
    fetchJson<{
      studentsCount: number;
      teachersCount: number;
      questionBanksCount: number;
      questionsCount: number;
      examsCount: number;
      finishedExamsCount: number;
      liveSessionsCount: number;
      passRate: number;
      averageScore: number;
      highestScore: number;
      lowestScore: number;
      networkStatus: string;
      serverCapacity: string;
    }>(`/api/stats/dashboard`),

  // Students
  getStudents: () => fetchJson<User[]>(`/api/students`),
  createStudent: (studentData: Partial<User> & { password?: string }) =>
    fetchJson<{ success: boolean; id: string }>(`/api/students`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),
  deleteStudent: (id: string) => fetchJson<{ success: boolean }>(`/api/students/${id}`, { method: 'DELETE' }),

  // Teachers
  getTeachers: () => fetchJson<User[]>(`/api/teachers`),
  createTeacher: (teacherData: Partial<User> & { password?: string }) =>
    fetchJson<{ success: boolean; id: string }>(`/api/teachers`, {
      method: 'POST',
      body: JSON.stringify(teacherData),
    }),
  deleteTeacher: (id: string) => fetchJson<{ success: boolean }>(`/api/teachers/${id}`, { method: 'DELETE' }),

  // Subjects
  getSubjects: () => fetchJson<Subject[]>(`/api/subjects`),
  createSubject: (data: { code: string; nameAr: string; name?: string; description?: string }) =>
    fetchJson<{ success: boolean; id: string }>(`/api/subjects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSubject: (id: string, data: Partial<Subject>) =>
    fetchJson<{ success: boolean }>(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSubject: (id: string) => fetchJson<{ success: boolean }>(`/api/subjects/${id}`, { method: 'DELETE' }),

  // Question Banks
  getQuestionBanks: () => fetchJson<QuestionBank[]>(`/api/question-banks`),
  createQuestionBank: (data: Partial<QuestionBank>) =>
    fetchJson<{ success: boolean; id: string }>(`/api/question-banks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateQuestionBank: (id: string, data: Partial<QuestionBank>) =>
    fetchJson<{ success: boolean }>(`/api/question-banks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Questions
  getQuestions: (bankId?: string) => fetchJson<Question[]>(`/api/questions${bankId ? `?bankId=${bankId}` : ''}`),
  createQuestion: (questionData: Partial<Question>) =>
    fetchJson<{ success: boolean; id: string }>(`/api/questions`, {
      method: 'POST',
      body: JSON.stringify(questionData),
    }),
  deleteQuestion: (id: string) => fetchJson<{ success: boolean }>(`/api/questions/${id}`, { method: 'DELETE' }),
  importQuestions: (bankId: string, questions: Partial<Question>[]) =>
    fetchJson<{ success: boolean; importedCount: number }>(`/api/questions/import`, {
      method: 'POST',
      body: JSON.stringify({ bankId, questions }),
    }),

  // Exams
  getExams: () => fetchJson<Exam[]>(`/api/exams`),
  createExam: (data: Partial<Exam>) =>
    fetchJson<{ success: boolean; id: string }>(`/api/exams`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExam: (id: string, data: Partial<Exam>) =>
    fetchJson<{ success: boolean }>(`/api/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteExam: (id: string) => fetchJson<{ success: boolean }>(`/api/exams/${id}`, { method: 'DELETE' }),

  // Student Exam Session
  startExam: (examId: string, studentId: string, password?: string) =>
    fetchJson<{
      session: ExamSession;
      exam: {
        title: string;
        durationMinutes: number;
        calculatorAllowed: boolean;
        fullscreenRequired: boolean;
        negativeMarking: boolean;
      };
    }>(`/api/exams/${examId}/start`, {
      method: 'POST',
      body: JSON.stringify({ studentId, password }),
    }),

  syncExamSession: (
    sessionId: string,
    syncData: {
      answers: Record<string, any>;
      flaggedQuestions: string[];
      currentQuestionIndex: number;
      remainingSeconds: number;
      warningsCount: number;
      fullscreenViolationsCount: number;
    }
  ) =>
    fetchJson<{ success: boolean; syncedAt: string }>(`/api/exam-sessions/${sessionId}/sync`, {
      method: 'POST',
      body: JSON.stringify(syncData),
    }),

  submitExamSession: (sessionId: string, answers: Record<string, any>) =>
    fetchJson<{
      success: boolean;
      result: {
        id: string;
        score: number;
        totalPossibleScore: number;
        percentage: number;
        gradeLetter: string;
        passStatus: 'passed' | 'failed';
        correctCount: number;
        wrongCount: number;
        skippedCount: number;
        showResultImmediately: boolean;
        showAnswers: boolean;
        answersReview?: Record<string, any>;
      };
    }>(`/api/exam-sessions/${sessionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Live Monitoring
  getLiveMonitoring: () => fetchJson<LiveStudentMonitor[]>(`/api/monitoring/live`),
  sendMonitoringAction: (sessionId: string, action: 'pause' | 'resume' | 'extend_time' | 'force_submit', timeExtendMinutes?: number) =>
    fetchJson<{ success: boolean }>(`/api/monitoring/${sessionId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, timeExtendMinutes }),
    }),

  // Results & Reports
  getResults: () => fetchJson<Result[]>(`/api/results`),
  deleteResult: (id: string) => fetchJson<{ success: boolean }>(`/api/results/${id}`, { method: 'DELETE' }),
  resetStudentAttempt: (examId: string, studentId: string) =>
    fetchJson<{ success: boolean; message: string }>(`/api/exams/${examId}/reset-attempt`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),

  // Backups
  getBackups: () => fetchJson<BackupItem[]>(`/api/backups`),
  createBackup: () => fetchJson<{ success: boolean; filename: string }>(`/api/backups/create`, { method: 'POST' }),

  // Logs & Announcements
  getLogs: () => fetchJson<ActivityLog[]>(`/api/logs`),
  getAnnouncements: () => fetchJson<Announcement[]>(`/api/announcements`),
};
