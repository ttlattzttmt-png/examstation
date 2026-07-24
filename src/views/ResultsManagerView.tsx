/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Search,
  Filter,
  Award,
  RotateCcw,
  Eye,
  Trash2,
  Printer,
  CheckCircle2,
  XCircle,
  Sparkles,
  Medal,
  ShieldCheck,
  GraduationCap,
  Download,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { Result } from '../types';

interface ResultsManagerViewProps {
  onViewResult?: (resultId: string) => void;
}

export const ResultsManagerView: React.FC<ResultsManagerViewProps> = ({ onViewResult }) => {
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState('ALL');
  const [selectedPassFilter, setSelectedPassFilter] = useState('ALL');

  // Certificate Modal State
  const [certificateResult, setCertificateResult] = useState<Result | null>(null);

  // Answer Details Modal State
  const [reviewResult, setReviewResult] = useState<Result | null>(null);

  // Status messages
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setIsLoading(true);
    try {
      const data = await api.getResults();
      setResults(data);
    } catch (err: any) {
      console.error('Failed to fetch results:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAttempt = async (result: Result) => {
    const confirmMsg = `هل أنت متأكد من السماح للطالب (${result.studentName} - ${result.studentCode}) بإعادة امتحان (${result.examTitle})؟\n\nسيتم مسح النتيجة الحالية والجلسة السابقة ليتكمن الطالب من التقديم من جديد.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.resetStudentAttempt(result.examId, result.studentId || result.studentCode);
      setActionMsg({ type: 'success', text: res.message || 'تم إعادة فتح الامتحان للطالب بنجاح!' });
      await loadResults();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'حدث خطأ أثناء إعادة فتح المحاولة' });
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه النتيجة نهائياً؟')) return;
    try {
      await api.deleteResult(resultId);
      setActionMsg({ type: 'success', text: 'تم حذف النتيجة بنجاح' });
      await loadResults();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'فشل حذف النتيجة' });
    }
  };

  // Get unique exam titles for filter dropdown
  const uniqueExams = Array.from(new Set(results.map((r) => r.examTitle)));

  // Filtered Results
  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.examTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subjectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesExam = selectedExamFilter === 'ALL' || r.examTitle === selectedExamFilter;
    const matchesPass = selectedPassFilter === 'ALL' || r.passStatus === selectedPassFilter;

    return matchesSearch && matchesExam && matchesPass;
  });

  // Calculate statistics
  const totalResults = results.length;
  const passedCount = results.filter((r) => r.passStatus === 'passed').length;
  const passRate = totalResults > 0 ? Math.round((passedCount / totalResults) * 100) : 0;
  const avgPercentage = totalResults > 0 ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalResults) : 0;
  const honorsCount = results.filter((r) => r.percentage >= 85).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#FFD600] flex items-center gap-2">
            <BarChart3 size={28} /> لوحة النتائج وإصدار الشهادات
          </h1>
          <p className="text-xs text-white/60 mt-1">
            متابعة نتائج الامتحانات كاملة، طباعة شهادات التقدير والنجاح، والسماح للطلاب بإعادة الامتحانات بكبسة زر.
          </p>
        </div>

        <button
          onClick={loadResults}
          className="self-start md:self-auto rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2 text-white"
        >
          <RotateCcw size={16} /> تحديث القائمة
        </button>
      </div>

      {/* Action Banner Message */}
      {actionMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between animate-fade-in ${
            actionMsg.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 space-y-1">
          <span className="text-xs text-white/50 font-bold block">إجمالي الاختبارات والمحاولات</span>
          <p className="text-2xl font-black text-white">{totalResults}</p>
        </div>

        <div className="rounded-3xl border border-green-500/20 bg-green-950/10 p-5 space-y-1">
          <span className="text-xs text-green-400/70 font-bold block">نسبة النجاح العامة</span>
          <p className="text-2xl font-black text-green-400">{passRate}% ({passedCount} طالب)</p>
        </div>

        <div className="rounded-3xl border border-[#FFD600]/20 bg-[#FFD600]/5 p-5 space-y-1">
          <span className="text-xs text-[#FFD600]/70 font-bold block">متوسط الدرجات</span>
          <p className="text-2xl font-black text-[#FFD600]">{avgPercentage}%</p>
        </div>

        <div className="rounded-3xl border border-purple-500/20 bg-purple-950/10 p-5 space-y-1">
          <span className="text-xs text-purple-400/70 font-bold block">طلاب لوحة الشرف (85%+)</span>
          <p className="text-2xl font-black text-purple-300">{honorsCount} طالب متميز</p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search size={18} className="absolute right-3.5 top-3.5 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الطالب، الكود، اسم الامتحان..."
              className="w-full rounded-2xl bg-[#0D0D0D] pr-10 pl-4 py-2.5 text-xs text-white placeholder-white/30 border border-white/10 focus:border-[#FFD600] focus:outline-none"
            />
          </div>

          {/* Exam Filter */}
          <div className="relative">
            <select
              value={selectedExamFilter}
              onChange={(e) => setSelectedExamFilter(e.target.value)}
              className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none"
            >
              <option value="ALL">جميع الامتحانات والمواد</option>
              {uniqueExams.map((examTitle) => (
                <option key={examTitle} value={examTitle}>
                  {examTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedPassFilter}
              onChange={(e) => setSelectedPassFilter(e.target.value)}
              className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none"
            >
              <option value="ALL">جميع الحالات (ناجح ورواسب)</option>
              <option value="passed">الناجحون فقط (Passed)</option>
              <option value="failed">الراسبون فقط (Failed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-3xl border border-white/10 bg-[#141414] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-white/50 text-xs font-bold">جاري تحميل البيانات من السيرفر...</div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-white/60 font-bold text-sm">لا توجد نتائج مطابقة لشروط البحث والفلترة</p>
            <p className="text-xs text-white/40">تأكد من تقديم الطلاب للامتحانات أو قم بتغيير الفلتر.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-white/5 text-white/70 font-bold border-b border-white/10">
                <tr>
                  <th className="p-4">اسم الطالب / الكود</th>
                  <th className="p-4">الاختبار / المادة</th>
                  <th className="p-4">النتيجة والتقدير</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">تاريخ الإنجاز</th>
                  <th className="p-4 text-center">الإجراءات والشهادات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredResults.map((res) => (
                  <tr key={res.id} className="hover:bg-white/[0.02] transition-all">
                    <td className="p-4">
                      <div className="font-extrabold text-white text-sm">{res.studentName}</div>
                      <div className="font-mono text-[11px] text-[#FFD600]">{res.studentCode}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-white/90">{res.examTitle}</div>
                      <div className="text-[11px] text-white/50">{res.subjectName || 'عام'}</div>
                    </td>

                    <td className="p-4 font-mono">
                      <div className="font-black text-sm text-[#FFD600]">
                        {res.score} / {res.totalPossibleScore} ({res.percentage}%)
                      </div>
                      <span className="text-[10px] text-white/60 font-bold">التقدير: {res.gradeLetter}</span>
                    </td>

                    <td className="p-4">
                      {res.passStatus === 'passed' ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-green-500/10 px-2.5 py-1 text-[11px] font-extrabold text-green-400 border border-green-500/30">
                          <CheckCircle2 size={13} /> ناجح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 px-2.5 py-1 text-[11px] font-extrabold text-red-400 border border-red-500/30">
                          <XCircle size={13} /> راسب
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-mono text-white/60 text-[11px]">
                      {new Date(res.completedAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Certificate Button */}
                        {res.passStatus === 'passed' && (
                          <button
                            onClick={() => setCertificateResult(res)}
                            title="طباعة شهادة تقدير ونجاح"
                            className="rounded-xl bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/30 hover:bg-[#FFD600] hover:text-black px-3 py-1.5 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Award size={15} /> الشهادة
                          </button>
                        )}

                        {/* Reset Attempt / Allow Retake Button */}
                        <button
                          onClick={() => handleResetAttempt(res)}
                          title="إتاحة إعادة الامتحان للطالب ومسح النتيجة"
                          className="rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white px-3 py-1.5 font-bold text-xs transition-all flex items-center gap-1.5"
                        >
                          <RotateCcw size={14} /> إعادة المحاولة
                        </button>

                        {/* View Answers Review */}
                        <button
                          onClick={() => setReviewResult(res)}
                          title="عرض تفاصيل الإجابات والدرجات"
                          className="rounded-xl bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 px-2.5 py-1.5 transition-all"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Delete Result */}
                        <button
                          onClick={() => handleDeleteResult(res.id)}
                          title="حذف النتيجة نهائياً"
                          className="rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white px-2.5 py-1.5 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRINTABLE CERTIFICATE MODAL */}
      {certificateResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 relative border-4 border-[#FFD600]">
            {/* Modal Actions */}
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                <Medal className="text-yellow-600" /> شهادة اجتياز وتقدير رسمية
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-xl bg-slate-900 text-white font-bold px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-800"
                >
                  <Printer size={16} /> طباعة الشهادة (Print)
                </button>
                <button
                  onClick={() => setCertificateResult(null)}
                  className="rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 p-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* CERTIFICATE DESIGN (STYLISH & OFFICIAL) */}
            <div className="border-8 border-double border-yellow-600 p-8 text-center space-y-6 rounded-2xl bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 relative overflow-hidden">
              {/* Background Watermark Pattern */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <GraduationCap size={400} />
              </div>

              {/* Certificate Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-1.5 text-xs font-black text-yellow-700 border border-yellow-500/20">
                  <ShieldCheck size={16} /> منصة البشمهندس التعليمية للاختبارات الإلكترونية
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-wide font-serif pt-2">
                  شهــادة شكر وتقدير واجتياز
                </h2>
                <p className="text-xs text-slate-500 font-bold">CERTIFICATE OF EXCELLENCE & ACHIEVEMENT</p>
              </div>

              {/* Certificate Body */}
              <div className="space-y-4 py-4">
                <p className="text-sm text-slate-700 font-semibold">تشهد إدارة المنصة التعليمية والمعلمون بأن الطالب / الطالبة:</p>
                <h3 className="text-2xl font-black text-amber-900 border-b-2 border-yellow-500 inline-block px-8 pb-1">
                  {certificateResult.studentName}
                </h3>
                <p className="text-xs font-mono text-slate-500">كود الطالب: {certificateResult.studentCode}</p>

                <p className="text-sm text-slate-700 leading-relaxed max-w-xl mx-auto pt-2">
                  قد أتم بنجاح واقتدار كافة متطلبات اختبار{' '}
                  <strong className="text-slate-900 font-extrabold">"{certificateResult.examTitle}"</strong> في مادة{' '}
                  <span className="text-amber-800 font-bold">{certificateResult.subjectName || 'العلوم والفيزياء'}</span> وحصل على تقدير ممتاز
                  بدرجة:
                </p>

                {/* Score Badge */}
                <div className="inline-flex items-center gap-4 bg-amber-100/80 border border-amber-300 px-6 py-3 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-amber-800 font-bold block">الدرجة النهائية</span>
                    <span className="text-xl font-black text-amber-900">
                      {certificateResult.score} / {certificateResult.totalPossibleScore}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-amber-300" />
                  <div>
                    <span className="text-[10px] text-amber-800 font-bold block">النسبة المئوية</span>
                    <span className="text-xl font-black text-green-700">{certificateResult.percentage}%</span>
                  </div>
                  <div className="h-8 w-px bg-amber-300" />
                  <div>
                    <span className="text-[10px] text-amber-800 font-bold block">التقدير العام</span>
                    <span className="text-xl font-black text-amber-900">{certificateResult.gradeLetter}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Footer / Stamp */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold">
                <div>
                  <p className="text-[11px] text-slate-400">تاريخ الإصدار:</p>
                  <p className="font-mono text-slate-800">
                    {new Date(certificateResult.completedAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-14 w-14 rounded-full border-2 border-yellow-600 bg-amber-50 flex items-center justify-center text-yellow-700 font-black text-[10px] shadow-sm">
                    ختم الاعتماد
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1">الختم الرقمي المعتمد</span>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">اعتماد إدارة المنصة:</p>
                  <p className="font-black text-slate-900 text-sm">البشمهندس / المدير</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANSWERS REVIEW MODAL */}
      {reviewResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-[#FFD600] flex items-center gap-2">
                <Eye size={18} /> مراجعة إجابات الطالب ({reviewResult.studentName})
              </h3>
              <button onClick={() => setReviewResult(null)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {reviewResult.answersReview ? (
                Object.entries(reviewResult.answersReview).map(([qId, ans]: [string, any], idx) => (
                  <div key={qId} className="p-4 rounded-2xl bg-[#0D0D0D] border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">سؤال {idx + 1}: {ans.questionText}</span>
                      <span className={`font-mono font-bold ${ans.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {ans.scoreObtained} / {ans.maxScore}
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1">
                      <p className="text-white/70">
                        إجابة الطالب:{' '}
                        <span className="font-mono text-[#FFD600]">
                          {typeof ans.studentAnswer === 'object' ? JSON.stringify(ans.studentAnswer) : ans.studentAnswer || 'لم يجب'}
                        </span>
                      </p>
                      {ans.explanation && <p className="text-white/40 italic">التفسير: {ans.explanation}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/50 text-center py-4">لا توجد تفاصيل إضافية مسجلة لهذه الإجابة.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
