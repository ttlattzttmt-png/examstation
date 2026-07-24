/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, Plus, Search, Upload, FileText, Trash2, Edit, Layers, Copy, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import { QuestionBank, Question, Subject } from '../types';
import { QuestionEditorModal } from './QuestionEditorModal';
import { QuestionBankImportModal } from './QuestionBankImportModal';

export const QuestionBanksView: React.FC = () => {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showCreateBankModal, setShowCreateBankModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Create Bank Form State
  const [newBankTitle, setNewBankTitle] = useState('');
  const [newBankSubjectId, setNewBankSubjectId] = useState('sub-math');
  const [newBankChapter, setNewBankChapter] = useState('الوحدة الأولى');
  const [newBankDescription, setNewBankDescription] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBanksAndSubjects();
  }, []);

  useEffect(() => {
    if (selectedBankId) {
      loadQuestions(selectedBankId);
    }
  }, [selectedBankId]);

  const loadBanksAndSubjects = async () => {
    setIsLoading(true);
    try {
      const [banksData, subjectsData] = await Promise.all([
        api.getQuestionBanks(),
        api.getSubjects(),
      ]);
      setBanks(banksData);
      setSubjects(subjectsData);
      if (banksData.length > 0 && !selectedBankId) {
        setSelectedBankId(banksData[0].id);
      }
      if (subjectsData.length > 0) {
        setNewBankSubjectId(subjectsData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestions = async (bankId: string) => {
    try {
      const data = await api.getQuestions(bankId);
      setQuestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankTitle) return;

    try {
      const res = await api.createQuestionBank({
        title: newBankTitle,
        subjectId: newBankSubjectId,
        chapter: newBankChapter,
        description: newBankDescription,
      });
      setShowCreateBankModal(false);
      setNewBankTitle('');
      await loadBanksAndSubjects();
      setSelectedBankId(res.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
      await api.deleteQuestion(qId);
      if (selectedBankId) loadQuestions(selectedBankId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentBank = banks.find((b) => b.id === selectedBankId);

  const filteredQuestions = questions.filter(
    (q) => q.text.toLowerCase().includes(searchTerm.toLowerCase()) || q.chapter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-white/5 bg-[#181818]/90 backdrop-blur-md p-6 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-[#FFD600] flex items-center gap-2">
            <Database size={28} /> بنوك الأسئلة المركزية
          </h2>
          <p className="text-xs text-white/50 mt-1">
            إدارة آلاف الأسئلة وتصنيفها حسب المادة، الفصل، والدرجة، مع التوليد العشوائي الذكي للامتحانات.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateBankModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#FFD600] px-5 py-3 text-xs font-extrabold text-black hover:bg-yellow-300 shadow-[0_0_15px_rgba(255,214,0,0.2)] transition-all"
          >
            <Plus size={18} /> إنشاء بنك أسئلة جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Banks List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white/70 px-1">بنوك الأسئلة المتاحة ({banks.length})</h3>

          <div className="space-y-2 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
            {banks.map((bank) => {
              const isSelected = bank.id === selectedBankId;
              return (
                <div
                  key={bank.id}
                  onClick={() => setSelectedBankId(bank.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                    isSelected
                      ? 'bg-[#FFD600]/10 border-[#FFD600]/40 text-[#FFD600] shadow-[0_0_15px_rgba(255,214,0,0.1)]'
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white/90">{bank.title}</span>
                    <span className="text-[10px] font-mono bg-[#FFD600]/20 text-[#FFD600] px-2 py-0.5 rounded-full font-bold">
                      {bank.questionCount || 0} سؤال
                    </span>
                  </div>
                  <p className="text-xs text-white/40 line-clamp-1">{bank.subjectName || 'مادة عامة'} • {bank.chapter}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Questions inside selected Bank */}
        <div className="lg:col-span-2 space-y-4">
          {currentBank ? (
            <div className="rounded-3xl border border-white/5 bg-[#181818]/90 backdrop-blur-md p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-black text-[#FFD600]">{currentBank.title}</h3>
                  <p className="text-xs text-white/40">{currentBank.description || 'لا يوجد وصف إضافي'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-bold text-white/90 hover:bg-white/10 transition-all"
                  >
                    <Upload size={16} className="text-[#FFD600]" /> استيراد Excel
                  </button>

                  <button
                    onClick={() => setShowAddQuestionModal(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#FFD600] px-4 py-2 text-xs font-extrabold text-black hover:bg-yellow-300 shadow-[0_0_15px_rgba(255,214,0,0.2)] transition-all"
                  >
                    <Plus size={16} /> إضافة سؤال
                  </button>
                </div>
              </div>

              {/* Search Questions */}
              <div className="relative">
                <Search size={16} className="absolute right-3.5 top-3 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث في أسئلة هذا البنك..."
                  className="w-full rounded-2xl bg-[#0D0D0D] pr-10 pl-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600]/40 focus:outline-none transition-all"
                />
              </div>

              {/* Questions List */}
              <div className="space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-12 text-white/30 text-xs">
                    لا توجد أسئلة مضافة بعد في هذا البنك. اضغط على "إضافة سؤال" أو قم باستيراد ملف Excel.
                  </div>
                ) : (
                  filteredQuestions.map((q, idx) => (
                    <div key={q.id} className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-2 backdrop-blur-md">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-[#FFD600]">س {idx + 1}</span>
                          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-white/70 font-semibold uppercase">
                            {q.type}
                          </span>
                          <span className="rounded-md bg-[#FFD600]/10 text-[#FFD600] px-2 py-0.5 text-[10px] font-bold">
                            {q.difficulty === 'easy' ? 'سهل' : q.difficulty === 'medium' ? 'متوسط' : 'صعب'} ({q.score} درجات)
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-white/90 leading-relaxed">{q.text}</p>

                      {q.mediaUrl && (
                        <div className="my-2 max-w-xs rounded-xl overflow-hidden border border-white/10 bg-black/40 p-1">
                          <img src={q.mediaUrl} alt="صورة السؤال" className="max-h-32 object-contain rounded-lg" />
                        </div>
                      )}

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          {q.options.map((opt: any, oIdx: number) => (
                            <div
                              key={oIdx}
                              className={`rounded-xl p-2 border ${
                                opt.isCorrect
                                  ? 'bg-green-500/10 border-green-500/30 text-green-300 font-bold'
                                  : 'bg-white/5 border-white/5 text-white/50'
                              }`}
                            >
                              • {opt.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-white/40 text-xs">
              حدد بنك أسئلة لعرض الأسئلة وإدارتها
            </div>
          )}
        </div>
      </div>

      {/* Create Bank Modal */}
      {showCreateBankModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-yellow-500/40 bg-[#181818] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">إنشاء بنك أسئلة جديد</h3>
            <form onSubmit={handleCreateBank} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-300 mb-1">اسم بنك الأسئلة</label>
                <input
                  type="text"
                  value={newBankTitle}
                  onChange={(e) => setNewBankTitle(e.target.value)}
                  placeholder="مثال: بنك أسئلة الفيزياء - الكهربية والمقاومات"
                  required
                  className="w-full rounded-xl bg-gray-900 p-3 text-white border border-gray-800 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">المادة الدراسية</label>
                <select
                  value={newBankSubjectId}
                  onChange={(e) => setNewBankSubjectId(e.target.value)}
                  className="w-full rounded-xl bg-gray-900 p-3 text-white border border-gray-800 focus:border-yellow-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">الوصف المختصر</label>
                <textarea
                  value={newBankDescription}
                  onChange={(e) => setNewBankDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl bg-gray-900 p-3 text-white border border-gray-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBankModal(false)}
                  className="rounded-xl bg-gray-800 px-4 py-2 font-bold text-gray-300 hover:bg-gray-700"
                >
                  إلغاء
                </button>
                <button type="submit" className="rounded-xl bg-[#FFD600] px-5 py-2 font-extrabold text-black hover:bg-yellow-300">
                  إنشاء البنك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {selectedBankId && (
        <QuestionEditorModal
          bankId={selectedBankId}
          isOpen={showAddQuestionModal}
          onClose={() => setShowAddQuestionModal(false)}
          onSuccess={() => {
            loadQuestions(selectedBankId);
            loadBanksAndSubjects();
          }}
        />
      )}

      {/* Import Modal */}
      {selectedBankId && (
        <QuestionBankImportModal
          bankId={selectedBankId}
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            loadQuestions(selectedBankId);
            loadBanksAndSubjects();
          }}
        />
      )}
    </div>
  );
};
