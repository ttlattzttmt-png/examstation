/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Clock, CheckCircle2, Award, FileSpreadsheet, Lock, Sparkles, Megaphone, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Exam, Result, Announcement } from '../types';

interface StudentDashboardViewProps {
  onStartExam: (examId: string) => void;
  onViewResult: (resultId: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onStartExam, onViewResult }) => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      const [examsData, resultsData, announcementsData] = await Promise.all([
        api.getExams(),
        api.getResults(),
        api.getAnnouncements(),
      ]);

      setExams(examsData.filter((e) => e.isActive));
      if (user) {
        setResults(
          resultsData.filter(
            (r) =>
              r.studentId === user.id ||
              (user.studentId && r.studentCode === user.studentId) ||
              r.studentCode === user.username ||
              r.studentName === user.fullName
          )
        );
      }
      setAnnouncements(announcementsData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-[#181818] via-[#1f1a00] to-[#181818] p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-400 border border-yellow-500/20 mb-2">
              <Shield size={14} /> مرحباً بك في منبر "البشمهندس" التعليمي
            </span>
            <h2 className="text-3xl font-black text-yellow-400">مرحباً {user?.fullName}</h2>
            <p className="text-xs text-gray-300 mt-1 font-mono">
              كود الطالب: {user?.studentId || user?.username} • {user?.grade || 'المرحلة الثانوية'}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-gray-900/80 p-4 rounded-2xl border border-gray-800 text-xs">
            <div>
              <p className="text-gray-400">الاختبارات المجتازة</p>
              <p className="text-xl font-black text-green-400">{results.filter((r) => r.passStatus === 'passed').length}</p>
            </div>
            <div className="h-8 w-px bg-gray-800" />
            <div>
              <p className="text-gray-400">معدل الدرجات</p>
              <p className="text-xl font-black text-yellow-400">
                {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="rounded-3xl border border-yellow-500/20 bg-[#181818] p-5">
          <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <Megaphone size={18} /> التنبيهات والإعلانات العامة
          </h3>
          <div className="space-y-2">
            {announcements.map((ann) => (
              <div key={ann.id} className="rounded-2xl bg-gray-900 p-3.5 border border-gray-800 text-xs leading-relaxed">
                <span className="font-bold text-gray-200 block mb-1">{ann.title}</span>
                <p className="text-gray-400">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Exams */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-yellow-400 flex items-center gap-2">
          <FileSpreadsheet size={22} /> الامتحانات المتاحة الآن للتقديم
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-gray-800 bg-[#181818] p-8 text-center text-gray-500 text-xs">
              لا توجد امتحانات متاحة حالياً للتقديم. سيتغير هذا فور إضافة معلمك لاختبار جديد.
            </div>
          ) : (
            exams.map((exam) => {
              const prevResult = results.find((r) => r.examId === exam.id);
              const isCompleted = Boolean(prevResult);

              return (
                <div
                  key={exam.id}
                  className="rounded-3xl border border-gray-800 bg-[#181818] p-6 space-y-4 hover:border-yellow-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-[10px] font-extrabold text-yellow-400 border border-yellow-500/20">
                        {exam.subjectName || 'الفيزياء والعلوم'}
                      </span>
                      <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                        <Clock size={14} className="text-yellow-400" /> {exam.durationMinutes} دقيقة
                      </span>
                    </div>

                    <h4 className="text-base font-black text-gray-100">{exam.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{exam.description || 'امتحان رقمي محمي ومولد عشوائياً'}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-gray-400">
                      محاولة واحدة • النجاح: <span className="font-bold text-green-400">{exam.passingPercentage}%</span>
                    </div>

                    {isCompleted && prevResult ? (
                      <button
                        onClick={() => onViewResult(prevResult.id)}
                        className="flex items-center gap-2 rounded-2xl bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2.5 text-xs font-bold hover:bg-green-500/30"
                      >
                        <CheckCircle2 size={16} /> النتيجة ({prevResult.percentage}%)
                      </button>
                    ) : (
                      <button
                        onClick={() => onStartExam(exam.id)}
                        className="flex items-center gap-2 rounded-2xl bg-[#FFD600] px-5 py-2.5 text-xs font-extrabold text-black hover:bg-yellow-300 shadow-lg shadow-yellow-500/20"
                      >
                        <Play size={16} /> ابدأ الامتحان الآن
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Completed Results History */}
      {results.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-black text-yellow-400 flex items-center gap-2">
            <Award size={22} /> سجل نتائجك واختباراتك السابقة
          </h3>

          <div className="space-y-2">
            {results.map((res) => (
              <div
                key={res.id}
                onClick={() => onViewResult(res.id)}
                className="flex items-center justify-between rounded-2xl border border-gray-800 bg-[#181818] p-4 hover:border-gray-700 cursor-pointer transition-all"
              >
                <div>
                  <h4 className="text-sm font-bold text-gray-200">{res.examTitle}</h4>
                  <p className="text-xs text-gray-500">{new Date(res.completedAt).toLocaleDateString('ar-EG')}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-xl px-3 py-1 text-xs font-bold font-mono ${
                      res.passStatus === 'passed' ? 'bg-green-950/40 text-green-400 border border-green-800/40' : 'bg-red-950/40 text-red-400 border border-red-800/40'
                    }`}
                  >
                    {res.percentage}% ({res.gradeLetter}) - {res.passStatus === 'passed' ? 'ناجح' : 'راسب'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
