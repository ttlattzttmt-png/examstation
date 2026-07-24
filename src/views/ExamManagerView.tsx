/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, Play, ShieldAlert, Sparkles, Clock, CheckCircle2, Lock, Shuffle, Settings2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { Exam, QuestionBank } from '../types';

export const ExamManagerView: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('sub-phys');
  const [bankId, setBankId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [randomQuestionCount, setRandomQuestionCount] = useState(20);
  const [allowedAttempts, setAllowedAttempts] = useState(3);

  // Anti-Cheat & Rules
  const [fullscreenRequired, setFullscreenRequired] = useState(true);
  const [randomizationEnabled, setRandomizationEnabled] = useState(true);
  const [calculatorAllowed, setCalculatorAllowed] = useState(true);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [showResultImmediately, setShowResultImmediately] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [examPassword, setExamPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [examsData, banksData] = await Promise.all([api.getExams(), api.getQuestionBanks()]);
      setExams(examsData);
      setBanks(banksData);
      if (banksData.length > 0) setBankId(banksData[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !bankId) return alert('يرجى كتابة عنوان الاختبار واختيار بنك الأسئلة');

    try {
      await api.createExam({
        title,
        description,
        subjectId,
        bankId,
        durationMinutes,
        passingPercentage,
        randomQuestionCount,
        allowedAttempts,
        fullscreenRequired,
        randomizationEnabled,
        calculatorAllowed,
        negativeMarking,
        showResultImmediately,
        showAnswers,
        passwordProtected,
        examPassword,
      });

      setShowCreateModal(false);
      setTitle('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء الاختبار');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-gray-800 bg-[#181818] p-6">
        <div>
          <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2">
            <FileSpreadsheet size={28} /> إدارة الامتحانات والنماذج العشوائية
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            إنشاء الاختبارات مع التوليد العشوائي المأمن وتفعيل حماية الشاشة الكاملة والحاسبة العلمية وتحديد وقت الامتحان.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-[#FFD600] px-5 py-3 text-xs font-extrabold text-black hover:bg-yellow-300 shadow-lg shadow-yellow-500/10"
        >
          <Plus size={18} /> إنشاء اختبار جديد
        </button>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((exam) => (
          <div key={exam.id} className="rounded-3xl border border-gray-800 bg-[#181818] p-6 space-y-4 hover:border-yellow-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-[10px] font-extrabold text-yellow-400 border border-yellow-500/20">
                {exam.mode === 'official' ? 'رسمي' : 'تدريب'}
              </span>
              <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                <Clock size={14} className="text-yellow-400" /> {exam.durationMinutes} دقيقة
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-gray-100 line-clamp-1">{exam.title}</h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{exam.description || 'اختبار رقمي محمي بالكامل'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-gray-300 bg-gray-900/60 p-3 rounded-2xl border border-gray-800">
              <div>
                <span className="text-gray-500 block">عدد الأسئلة/النموذج</span>
                <span className="font-bold text-yellow-400">{exam.randomQuestionCount || exam.questionCount || 20} سؤال</span>
              </div>
              <div>
                <span className="text-gray-500 block">نسبة النجاح</span>
                <span className="font-bold text-green-400">{exam.passingPercentage}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
              <span className="flex items-center gap-1">
                <Shuffle size={14} className="text-yellow-400" /> توليد عشوائي لكل طالب
              </span>
              <span className="flex items-center gap-1">
                <ShieldAlert size={14} className="text-yellow-400" /> شاشة كاملة
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-yellow-500/40 bg-[#181818] p-6 shadow-2xl my-8">
            <h3 className="text-xl font-black text-yellow-400 mb-4 flex items-center gap-2">
              <Sparkles size={22} /> معالج إنشاء اختبار جديد
            </h3>

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-300 mb-1">عنوان الاختبار</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: اختبار الفيزياء الكهربية - الترم الأول 2026"
                  required
                  className="w-full rounded-2xl bg-gray-900 p-3 text-sm text-white border border-gray-800 focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">بنك الأسئلة المصدر</label>
                  <select
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    className="w-full rounded-2xl bg-gray-900 p-3 text-white border border-gray-800"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.questionCount || 0} سؤال)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">مدة الاختبار (بالدقائق)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min={5}
                    required
                    className="w-full rounded-2xl bg-gray-900 p-3 text-white border border-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">عدد الأسئلة للنموذج العشوائي</label>
                  <input
                    type="number"
                    value={randomQuestionCount}
                    onChange={(e) => setRandomQuestionCount(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-2xl bg-gray-900 p-3 text-white border border-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">نسبة النجاح (%)</label>
                  <input
                    type="number"
                    value={passingPercentage}
                    onChange={(e) => setPassingPercentage(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full rounded-2xl bg-gray-900 p-3 text-white border border-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">المحاولات المسموحة</label>
                  <input
                    type="number"
                    value={allowedAttempts}
                    onChange={(e) => setAllowedAttempts(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-2xl bg-gray-900 p-3 text-white border border-gray-800"
                  />
                </div>
              </div>

              {/* Rules & Anti-Cheat Toggles */}
              <div className="rounded-2xl bg-gray-900 p-4 border border-gray-800 space-y-3">
                <label className="text-yellow-400 font-bold block">قواعد الأمان والمراقبة والآلة الحاسبة</label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fullscreenRequired}
                      onChange={(e) => setFullscreenRequired(e.target.checked)}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    <span>إلزام الطالب بالشاشة الكاملة ومنع مغادرة النافذة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randomizationEnabled}
                      onChange={(e) => setRandomizationEnabled(e.target.checked)}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    <span>توليد عشوائي متطور للأسئلة والخيارات لكل طالب</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calculatorAllowed}
                      onChange={(e) => setCalculatorAllowed(e.target.checked)}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    <span>السماح بفتح الحاسبة العلمية الذكية داخل الاختبار</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showResultImmediately}
                      onChange={(e) => setShowResultImmediately(e.target.checked)}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    <span>إظهار النتيجة والدرجة فور تسليم الاختبار</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl bg-gray-800 px-5 py-2.5 font-bold text-gray-300 hover:bg-gray-700"
                >
                  إلغاء
                </button>
                <button type="submit" className="rounded-xl bg-[#FFD600] px-6 py-2.5 font-extrabold text-black hover:bg-yellow-300">
                  حفظ ونشر الاختبار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
