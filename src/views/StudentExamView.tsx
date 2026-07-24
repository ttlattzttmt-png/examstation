/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Clock, ShieldAlert, Flag, Calculator as CalcIcon, Check, ChevronRight, ChevronLeft, Send, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AntiCheatGuard } from '../components/AntiCheatGuard';
import { WatermarkOverlay } from '../components/WatermarkOverlay';
import { CalculatorModal } from '../components/CalculatorModal';
import { FormattedQuestionText } from '../components/LaTeXMath';

interface StudentExamViewProps {
  examId: string;
  onFinished: (resultId: string) => void;
  onCancel: () => void;
}

export const StudentExamView: React.FC<StudentExamViewProps> = ({ examId, onFinished, onCancel }) => {
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [examMeta, setExamMeta] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [warningsCount, setWarningsCount] = useState(0);
  const [showCalc, setShowCalc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('تم الحفظ تلقائياً');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startExamSession();
  }, [examId]);

  // Countdown Timer
  useEffect(() => {
    if (!session || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session, remainingSeconds]);

  // Periodic Auto-Save
  useEffect(() => {
    if (!session) return;

    const saveInterval = setInterval(() => {
      syncProgress();
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [session, answers, flagged, currentIndex, remainingSeconds, warningsCount]);

  const startExamSession = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await api.startExam(examId, user.id);
      setSession(data.session);
      setExamMeta(data.exam);
      setAnswers(data.session.answers || {});
      setFlagged(data.session.flaggedQuestions || []);
      setCurrentIndex(data.session.currentQuestionIndex || 0);
      setRemainingSeconds(data.session.remainingSeconds || data.exam.durationMinutes * 60);
      setWarningsCount(data.session.warningsCount || 0);
    } catch (err: any) {
      alert(err.message || 'فشل تحميل جلسة الاختبار');
      onCancel();
    } finally {
      setIsLoading(false);
    }
  };

  const syncProgress = async () => {
    if (!session) return;
    try {
      setAutoSaveStatus('جاري الحفظ...');
      await api.syncExamSession(session.id, {
        answers,
        flaggedQuestions: flagged,
        currentQuestionIndex: currentIndex,
        remainingSeconds,
        warningsCount,
        fullscreenViolationsCount: 0,
      });
      setAutoSaveStatus('تم الحفظ تلقائياً');
    } catch (e) {
      setAutoSaveStatus('تعذر الحفظ المؤقت');
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        selectedOptionId: optionId,
        visited: true,
      },
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlagged((prev) => (prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]));
  };

  const handleWarningTriggered = (type: string) => {
    setWarningsCount((prev) => {
      const updated = prev + 1;
      if (updated >= 3) {
        alert('تجاوزت الحد الأقصى للمخالفات والتحذيرات. سيتم تسليم الاختبار تلقائياً لحفظ محاولتك.');
        handleAutoSubmit();
      }
      return updated;
    });
  };

  const handleAutoSubmit = async () => {
    if (!session || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const data = await api.submitExamSession(session.id, answers);
      onFinished(data.result.id);
    } catch (err: any) {
      alert(err.message || 'فشل تسليم الاختبار');
      setIsSubmitting(false);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D0D0D] text-yellow-400 font-bold">
        جاري تجهيز كراسة الاختبار وتوليد الأسئلة العشوائية...
      </div>
    );
  }

  const questions = session.assignedQuestions || [];
  const currentQ = questions[currentIndex];

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AntiCheatGuard
      fullscreenRequired={examMeta?.fullscreenRequired}
      maxWarningsAllowed={3}
      warningsCount={warningsCount}
      onWarning={handleWarningTriggered}
    >
      <WatermarkOverlay text={session.watermarkText} />

      <div className="min-h-screen flex flex-col justify-between max-w-6xl mx-auto p-4 relative z-10">
        {/* Top Sticky Exam Bar */}
        <header className="sticky top-2 z-40 rounded-2xl border border-yellow-500/30 bg-[#181818]/95 p-4 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-yellow-400">{session.examTitle}</h2>
            <p className="text-xs text-gray-400 font-mono">
              طالب: {session.studentName} ({session.studentCode})
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-green-400 font-semibold bg-green-950/40 px-2.5 py-1 rounded-xl border border-green-800/40">
              {autoSaveStatus}
            </span>

            {examMeta?.calculatorAllowed && (
              <button
                onClick={() => setShowCalc(true)}
                className="flex items-center gap-1.5 rounded-xl bg-yellow-500/10 px-3 py-1.5 border border-yellow-500/30 text-xs font-bold text-yellow-400 hover:bg-yellow-500/20"
              >
                <CalcIcon size={16} /> الحاسبة العلمية
              </button>
            )}

            <div className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 border border-gray-800 text-sm font-mono font-bold text-yellow-300">
              <Clock size={16} className="text-yellow-400 animate-pulse" /> {formatTime(remainingSeconds)}
            </div>
          </div>
        </header>

        {/* Main Question Body */}
        {currentQ && (
          <main className="my-6 space-y-6">
            <div className="rounded-3xl border border-gray-800 bg-[#181818] p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-xs font-extrabold text-yellow-400">
                  سؤال {currentIndex + 1} من أصل {questions.length}
                </span>

                <button
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    flagged.includes(currentQ.id)
                      ? 'bg-yellow-500 text-black font-extrabold'
                      : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
                  }`}
                >
                  <Flag size={14} /> {flagged.includes(currentQ.id) ? 'مميز بملاحظة' : 'تمييز للمراجعة'}
                </button>
              </div>

              <div className="text-lg font-bold text-gray-100 leading-relaxed">
                <FormattedQuestionText text={currentQ.text} />
              </div>

              {/* Options */}
              {currentQ.options && currentQ.options.length > 0 && (
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt: any) => {
                    const isSelected = answers[currentQ.id]?.selectedOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQ.id, opt.id)}
                        className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#FFD600]/15 border-yellow-500 text-yellow-300 shadow-md shadow-yellow-500/10'
                            : 'bg-gray-900/80 border-gray-800 text-gray-300 hover:border-gray-700'
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            isSelected ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-gray-600'
                          }`}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                        <span className="text-sm font-semibold">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Question Navigation Palette Grid */}
            <div className="rounded-3xl border border-gray-800 bg-[#181818] p-4">
              <p className="text-xs font-bold text-gray-400 mb-2">لوحة التنقل السريع بين الأسئلة</p>
              <div className="grid grid-cols-8 md:grid-cols-12 gap-2 text-xs font-mono font-bold">
                {questions.map((q: any, i: number) => {
                  const isAns = Boolean(answers[q.id]?.selectedOptionId);
                  const isCurrent = i === currentIndex;
                  const isFlag = flagged.includes(q.id);

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-9 w-full rounded-xl flex items-center justify-center border transition-all ${
                        isCurrent
                          ? 'border-yellow-400 bg-yellow-400 text-black font-black scale-105 shadow-md'
                          : isFlag
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
                          : isAns
                          ? 'bg-green-950/50 text-green-400 border-green-800'
                          : 'bg-gray-900 text-gray-400 border-gray-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </main>
        )}

        {/* Bottom Controls */}
        <footer className="sticky bottom-2 z-40 rounded-2xl border border-gray-800 bg-[#181818]/95 p-4 backdrop-blur-xl flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-bold text-gray-300 border border-gray-800 disabled:opacity-40"
          >
            <ChevronRight size={18} /> السؤال السابق
          </button>

          <button
            onClick={handleAutoSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-green-500 px-6 py-2.5 text-xs font-extrabold text-black hover:bg-green-400 shadow-lg shadow-green-500/20"
          >
            <Send size={16} /> {isSubmitting ? 'جاري التسليم...' : 'إنهاء وتسليم الاختبار'}
          </button>

          <button
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            className="flex items-center gap-1.5 rounded-xl bg-[#FFD600] px-5 py-2.5 text-xs font-extrabold text-black hover:bg-yellow-300 disabled:opacity-40"
          >
            السؤال التالي <ChevronLeft size={18} />
          </button>
        </footer>
      </div>

      <CalculatorModal isOpen={showCalc} onClose={() => setShowCalc(false)} />
    </AntiCheatGuard>
  );
};
