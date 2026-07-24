/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { QuestionBanksView } from './views/QuestionBanksView';
import { ExamManagerView } from './views/ExamManagerView';
import { LiveMonitoringView } from './views/LiveMonitoringView';
import { StudentDashboardView } from './views/StudentDashboardView';
import { StudentExamView } from './views/StudentExamView';
import { ExamResultView } from './views/ExamResultView';
import { StudentManagementView } from './views/StudentManagementView';
import { TeacherManagementView } from './views/TeacherManagementView';
import { ResultsManagerView } from './views/ResultsManagerView';
import { SubjectsView } from './views/SubjectsView';
import { BackupView } from './views/BackupView';
import { LogsView } from './views/LogsView';
import { SettingsView } from './views/SettingsView';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0D0D0D] text-[#FFD600] font-black text-lg tracking-wide">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FFD600] border-t-transparent"></div>
          <span>جاري تشغيل منصة "البشمهندس" والاتصال بالخادم المحلي...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Active Exam Taking Mode for Student
  if (user.role === 'student' && activeExamId) {
    return (
      <StudentExamView
        examId={activeExamId}
        onFinished={(resId) => {
          setActiveExamId(null);
          setActiveResultId(resId);
        }}
        onCancel={() => setActiveExamId(null)}
      />
    );
  }

  // Active Exam Result View
  if (activeResultId) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white font-sans dir-rtl selection:bg-[#FFD600] selection:text-black" dir="rtl">
        <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />
        <main className="p-6">
          <ExamResultView resultId={activeResultId} onBack={() => setActiveResultId(null)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-sans selection:bg-[#FFD600] selection:text-black dir-rtl" dir="rtl">
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 p-3 sm:p-6 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {user.role === 'student' ? (
            <StudentDashboardView
              onStartExam={(eId) => setActiveExamId(eId)}
              onViewResult={(rId) => setActiveResultId(rId)}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && <AdminDashboardView onTabChange={setCurrentTab} />}
              {currentTab === 'monitoring' && <LiveMonitoringView />}
              {currentTab === 'question_banks' && <QuestionBanksView />}
              {currentTab === 'exams' && <ExamManagerView />}
              {currentTab === 'results' && <ResultsManagerView onViewResult={(rId) => setActiveResultId(rId)} />}
              {currentTab === 'students' && <StudentManagementView />}
              {currentTab === 'teachers' && user.role === 'admin' && <TeacherManagementView />}
              {currentTab === 'subjects' && <SubjectsView />}
              {currentTab === 'backups' && user.role === 'admin' && <BackupView />}
              {currentTab === 'logs' && user.role === 'admin' && <LogsView />}
              {currentTab === 'settings' && user.role === 'admin' && <SettingsView />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
