/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, Image, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { QuestionType, DifficultyLevel, QuestionOption } from '../types';
import { api } from '../services/api';

interface QuestionEditorModalProps {
  bankId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({ bankId, isOpen, onClose, onSuccess }) => {
  const [type, setType] = useState<QuestionType>('mcq');
  const [text, setText] = useState('');
  const [score, setScore] = useState(1);
  const [mediaUrl, setMediaUrl] = useState('');

  // Options
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: 'opt-1', text: 'الخيار الأول', isCorrect: true },
    { id: 'opt-2', text: 'الخيار الثاني', isCorrect: false },
    { id: 'opt-3', text: 'الخيار الثالث', isCorrect: false },
    { id: 'opt-4', text: 'الخيار الرابع', isCorrect: false },
  ]);

  // Optional Advanced Details
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [chapter, setChapter] = useState('الوحدة الأولى');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [explanation, setExplanation] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    if (newType === 'tf') {
      setOptions([
        { id: 'opt-tf-1', text: 'صواب (True)', isCorrect: true },
        { id: 'opt-tf-2', text: 'خطأ (False)', isCorrect: false },
      ]);
    } else if (newType === 'mcq' && options.length < 2) {
      setOptions([
        { id: 'opt-1', text: 'الخيار الأول', isCorrect: true },
        { id: 'opt-2', text: 'الخيار الثاني', isCorrect: false },
        { id: 'opt-3', text: 'الخيار الثالث', isCorrect: false },
        { id: 'opt-4', text: 'الخيار الرابع', isCorrect: false },
      ]);
    }
  };

  const handleOptionTextChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index].text = val;
    setOptions(updated);
  };

  const handleSetCorrectOption = (index: number) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setOptions(updated);
  };

  const handleAddOption = () => {
    setOptions([
      ...options,
      { id: `opt-${Date.now()}`, text: `خيار ${options.length + 1}`, isCorrect: false },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return alert('برجاء كتابة نص السؤال');

    setIsSubmitting(true);
    try {
      const correctOpt = options.find((o) => o.isCorrect)?.id || options[0]?.id;

      await api.createQuestion({
        bankId,
        type,
        text,
        chapter,
        difficulty,
        score,
        explanation,
        mediaUrl,
        options: type === 'paragraph' ? [] : options,
        correctAnswer: correctOpt,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ السؤال');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#FFD600]/20 bg-[#141414] p-5 sm:p-7 shadow-2xl my-6 text-white font-sans">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 rounded-xl bg-white/5 border border-white/10 p-2 text-white/50 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-black text-[#FFD600] mb-5 flex items-center gap-2">
          <Sparkles size={22} /> إضافة سؤال جديد
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold">
          {/* 1. Simplified Question Type */}
          <div>
            <label className="block text-white/70 mb-2 font-bold text-xs">نوع السؤال</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'mcq', label: 'اختيار من متعدد' },
                { id: 'tf', label: 'صواب / خطأ' },
                { id: 'paragraph', label: 'سؤال مقالي' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleTypeChange(item.id as QuestionType)}
                  className={`rounded-2xl py-3 px-2 border text-center font-extrabold transition-all text-xs ${
                    type === item.id
                      ? 'bg-[#FFD600] text-black border-[#FFD600] shadow-[0_0_15px_rgba(255,214,0,0.25)]'
                      : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Question Text */}
          <div>
            <label className="block text-white/90 font-bold mb-1.5 text-xs">1. نص السؤال *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="اكتب نص السؤال هنا..."
              required
              className="w-full rounded-2xl bg-[#0A0A0A] p-3.5 text-sm text-white placeholder-white/30 border border-white/10 focus:border-[#FFD600] focus:outline-none transition-all"
            />
          </div>

          {/* 3. Question Image (File or URL) */}
          <div className="rounded-2xl bg-white/5 p-4 border border-white/10 space-y-3">
            <label className="text-white/90 font-bold flex items-center gap-2 text-xs">
              <Image size={16} className="text-[#FFD600]" /> 2. صورة السؤال (اختياري - رفع ملف أو وضع رابط)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        if (evt.target?.result) {
                          setMediaUrl(evt.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-xs text-gray-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FFD600] file:text-black hover:file:bg-yellow-300 cursor-pointer"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={mediaUrl.startsWith('data:') ? '' : mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="أو ألصق رابط الصورة المباشر (URL)"
                  className="w-full rounded-xl bg-[#0A0A0A] p-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600]"
                />
              </div>
            </div>

            {mediaUrl && (
              <div className="relative inline-block mt-1">
                <img src={mediaUrl} alt="معاينة الصورة" className="max-h-36 rounded-xl border border-white/20 object-contain bg-black p-1" />
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="absolute -top-2 -left-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700 shadow-lg"
                  title="حذف الصورة"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* 4. Options & Mark Correct Answer (For MCQ and T/F) */}
          {type !== 'paragraph' && (
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[#FFD600] font-extrabold text-xs">3. الخيارات وتحديد الإجابة الصحيحة *</label>
                {type === 'mcq' && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-1 rounded-xl bg-[#FFD600]/20 px-3 py-1.5 text-[#FFD600] hover:bg-[#FFD600]/30 transition-all font-bold text-xs"
                  >
                    <Plus size={14} /> إضافة خيار
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => (
                  <div
                    key={opt.id || idx}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      opt.isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 bg-[#0A0A0A]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSetCorrectOption(idx)}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                        opt.isCorrect
                          ? 'bg-green-500 border-green-500 text-black font-black'
                          : 'border-white/30 hover:border-[#FFD600]'
                      }`}
                      title="حدد كإجابة صحيحة"
                    >
                      {opt.isCorrect && <Check size={14} strokeWidth={3} />}
                    </button>

                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      placeholder={`الخيار ${idx + 1}`}
                      required
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                    />

                    {type === 'mcq' && options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1.5 text-red-400 hover:text-red-300 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Score */}
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-4 border border-white/10">
            <div>
              <label className="block text-white/90 font-bold text-xs">4. درجة السؤال</label>
              <p className="text-[11px] text-white/40">الدرجة المخصصة لهذا السؤال في تصحيح الاختبار</p>
            </div>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(Math.max(1, Number(e.target.value)))}
              min={1}
              required
              className="w-24 rounded-xl bg-[#0A0A0A] p-2.5 text-center text-sm font-bold text-[#FFD600] border border-white/10 focus:border-[#FFD600]"
            />
          </div>

          {/* Collapsible Advanced Section */}
          <div className="border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-[#FFD600] transition-all"
            >
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span>خيارات إضافية (المستوى، الفصل، الشرح)</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/60 mb-1">المستوى</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                      className="w-full rounded-xl bg-[#0A0A0A] p-2 text-white border border-white/10"
                    >
                      <option value="easy">سهل</option>
                      <option value="medium">متوسط</option>
                      <option value="hard">صعب</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/60 mb-1">الفصل / الباب</label>
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      className="w-full rounded-xl bg-[#0A0A0A] p-2 text-white border border-white/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 mb-1">التفسير والشرح للطالب</label>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    rows={2}
                    placeholder="شرح إجابة السؤال بعد التصحيح..."
                    className="w-full rounded-xl bg-[#0A0A0A] p-2 text-white border border-white/10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 font-bold text-white/70 hover:bg-white/10 transition-all text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#FFD600] px-7 py-3 font-black text-black hover:bg-yellow-300 shadow-[0_0_20px_rgba(255,214,0,0.3)] transition-all text-xs"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ السؤال الآن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
