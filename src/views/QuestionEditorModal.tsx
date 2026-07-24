/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, HelpCircle, Image, FileText, Sparkles, CheckCircle, Calculator } from 'lucide-react';
import { QuestionType, DifficultyLevel, QuestionOption } from '../types';
import { api } from '../services/api';
import { LaTeXMath } from '../components/LaTeXMath';

interface QuestionEditorModalProps {
  bankId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({ bankId, isOpen, onClose, onSuccess }) => {
  const [type, setType] = useState<QuestionType>('mcq');
  const [text, setText] = useState('');
  const [chapter, setChapter] = useState('الوحدة الأولى');
  const [lesson, setLesson] = useState('الدرس الأول');
  const [topic, setTopic] = useState('موضوع عام');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [score, setScore] = useState(1);
  const [estimatedTimeSeconds, setEstimatedTimeSeconds] = useState(60);
  const [hints, setHints] = useState('');
  const [explanation, setExplanation] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  // Options for MCQ / True False / Matching
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: 'opt-1', text: 'الخيار الأول', isCorrect: true },
    { id: 'opt-2', text: 'الخيار الثاني', isCorrect: false },
    { id: 'opt-3', text: 'الخيار الثالث', isCorrect: false },
    { id: 'opt-4', text: 'الخيار الرابع', isCorrect: false },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, field: keyof QuestionOption, value: any) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
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
    if (!text) return alert('برجاء كتابة نص السؤال');

    setIsSubmitting(true);
    try {
      const correctOpt = options.find((o) => o.isCorrect)?.id || options[0]?.id;

      await api.createQuestion({
        bankId,
        type,
        text,
        chapter,
        lesson,
        topic,
        difficulty,
        score,
        estimatedTimeSeconds,
        hints,
        explanation,
        mediaUrl,
        options,
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
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#181818]/95 backdrop-blur-2xl p-6 shadow-2xl my-8">
        <button onClick={onClose} className="absolute left-4 top-4 rounded-xl bg-white/5 border border-white/10 p-2 text-white/50 hover:text-white transition-all">
          <X size={20} />
        </button>

        <h3 className="text-xl font-black text-[#FFD600] mb-4 flex items-center gap-2">
          <Sparkles size={22} /> إنشاء سؤال جديد في بنك الأسئلة
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Question Type Grid */}
          <div>
            <label className="block text-white/70 mb-2 font-bold">نوع السؤال (12 نوع مدعوم)</label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-[11px]">
              {[
                { id: 'mcq', label: 'اختيار من متعدد (MCQ)' },
                { id: 'tf', label: 'صواب / خطأ (T/F)' },
                { id: 'multi', label: 'متعدد الإجابات' },
                { id: 'matching', label: 'مطابقة وتوصيل' },
                { id: 'ordering', label: 'ترتيب متسلسل' },
                { id: 'fill', label: 'إكمال الفراغ' },
                { id: 'equation', label: 'معادلة (LaTeX)' },
                { id: 'image', label: 'سؤال صور' },
                { id: 'paragraph', label: 'مقال / قطعة' },
                { id: 'case_study', label: 'دراسة حالة' },
                { id: 'audio', label: 'سؤال صوتي' },
                { id: 'video', label: 'سؤال فيديو' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setType(item.id as QuestionType)}
                  className={`rounded-xl p-2.5 border transition-all text-center ${
                    type === item.id
                      ? 'bg-[#FFD600] text-black border-[#FFD600] font-black shadow-[0_0_15px_rgba(255,214,0,0.2)]'
                      : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-white/80 font-bold">نص السؤال (يدعم صيغ Math LaTeX بالرمز $...$)</label>
              <span className="text-[10px] text-[#FFD600]">مثال LaTeX: $R = \rho \frac{"{L}"}{"{A}"}$</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="اكتب نص السؤال هنا..."
              required
              className="w-full rounded-2xl bg-[#0D0D0D] p-3 text-sm text-white placeholder-white/30 border border-white/10 focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600]/40 focus:outline-none transition-all"
            />
            {text.includes('$') && (
              <div className="mt-2 rounded-xl bg-white/5 p-3 border border-[#FFD600]/30 text-[#FFD600]">
                <span className="text-[10px] text-white/40 block mb-1">معاينة معادلة LaTeX:</span>
                <LaTeXMath math={text.replace(/\$/g, '')} />
              </div>
            )}
          </div>

          {/* Image Upload for Question */}
          <div className="rounded-2xl bg-white/5 p-4 border border-white/10 space-y-2">
            <label className="text-white/80 font-bold flex items-center gap-2">
              <Image size={16} className="text-[#FFD600]" /> مرفق صورة السؤال (رفع ملف صورة من الجهاز)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
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
                className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FFD600] file:text-black hover:file:bg-yellow-300 cursor-pointer"
              />
              <span className="text-xs text-white/40 font-bold">أو</span>
              <input
                type="text"
                value={mediaUrl.startsWith('data:') ? '' : mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="رابط الصورة (URL)"
                className="w-full rounded-xl bg-[#0D0D0D] p-2 text-xs text-white border border-white/10 focus:border-[#FFD600]"
              />
            </div>

            {mediaUrl && (
              <div className="mt-2 relative inline-block">
                <img src={mediaUrl} alt="صورة السؤال المرفقة" className="max-h-40 rounded-xl border border-white/20 object-contain bg-black/40 p-1" />
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="absolute top-1 left-1 rounded-lg bg-red-600 p-1 text-white hover:bg-red-700 shadow-md"
                  title="حذف الصورة"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-white/60 mb-1">المستوى</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full rounded-xl bg-[#0D0D0D] p-2.5 text-white border border-white/10"
              >
                <option value="easy">سهل</option>
                <option value="medium">متوسط</option>
                <option value="hard">صعب</option>
              </select>
            </div>

            <div>
              <label className="block text-white/60 mb-1">الدرجة المخصصة</label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                min={1}
                className="w-full rounded-xl bg-[#0D0D0D] p-2.5 text-white border border-white/10"
              />
            </div>

            <div>
              <label className="block text-white/60 mb-1">الوقت التقديري (ثانية)</label>
              <input
                type="number"
                value={estimatedTimeSeconds}
                onChange={(e) => setEstimatedTimeSeconds(Number(e.target.value))}
                min={10}
                className="w-full rounded-xl bg-[#0D0D0D] p-2.5 text-white border border-white/10"
              />
            </div>

            <div>
              <label className="block text-white/60 mb-1">الفصل / الباب</label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full rounded-xl bg-[#0D0D0D] p-2.5 text-white border border-white/10"
              />
            </div>
          </div>

          {/* Options Section */}
          <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[#FFD600] font-bold">خيارات الإجابة والحل الصحيح</label>
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1 rounded-lg bg-[#FFD600]/20 px-2.5 py-1 text-[#FFD600] hover:bg-[#FFD600]/30 transition-all font-bold"
              >
                <Plus size={14} /> إضافة خيار
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={opt.id || idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={Boolean(opt.isCorrect)}
                    onChange={() => handleSetCorrectOption(idx)}
                    className="h-4 w-4 accent-[#FFD600] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                    placeholder={`خيار ${idx + 1}`}
                    required
                    className="flex-1 rounded-xl bg-[#0D0D0D] p-2.5 text-white border border-white/10 focus:border-[#FFD600] transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="rounded-xl bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-white/60 mb-1">التفسير والإجابة الشارحة (تظهر للطالب بعد التصحيح)</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder="اكتب التفسير والشرح هنا..."
              className="w-full rounded-2xl bg-[#0D0D0D] p-3 text-white border border-white/10 focus:border-[#FFD600] transition-all"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 font-bold text-white/70 hover:bg-white/10 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#FFD600] px-6 py-2.5 font-extrabold text-black hover:bg-yellow-300 shadow-[0_0_15px_rgba(255,214,0,0.25)] transition-all"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ السؤال'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
