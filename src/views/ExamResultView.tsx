/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, HelpCircle, Printer, ArrowRight, QrCode, FileText, Check, Sparkles, RotateCcw } from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { Result } from '../types';

interface ExamResultViewProps {
  resultId: string;
  onBack: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({ resultId, onBack }) => {
  const [result, setResult] = useState<Result | null>(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadResult();
  }, [resultId]);

  const loadResult = async () => {
    setIsLoading(true);
    try {
      const results = await api.getResults();
      const found = results.find((r) => r.id === resultId) || results[0];
      setResult(found);

      if (found) {
        const qr = await QRCode.toDataURL(
          `البشمهندس EXAM VERIFICATION\n الطالب: ${found.studentName}\n النتيجة: ${found.percentage}%\n الحالة: ${found.passStatus}`,
          { margin: 1, width: 120 }
        );
        setQrCodeData(qr);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetAttempt = async () => {
    if (!result) return;
    if (!confirm(`هل أنت متأكد من السماح للطالب (${result.studentName}) بإعادة هذا الامتحان وتصفير محاولته القديمة؟`)) return;

    setIsResetting(true);
    try {
      await api.resetStudentAttempt(result.examId, result.studentId || result.studentCode);
      alert('تم فتح الامتحان للطالب بنجاح والسماح له بإعادة المحاولة!');
      onBack();
    } catch (e: any) {
      alert(e.message || 'فشل فتح الامتحان للطالب');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading || !result) {
    return (
      <div className="flex h-96 items-center justify-center text-yellow-400 font-bold">
        جاري حساب وقراءة النتيجة والتقرير التفصيلي...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-2xl bg-gray-900 border border-gray-800 px-4 py-2 text-xs font-bold text-gray-300 hover:text-white"
        >
          <ArrowRight size={16} /> العودة للرئيسية
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAttempt}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 text-xs font-bold text-yellow-400 hover:bg-yellow-500/20"
          >
            <RotateCcw size={16} /> {isResetting ? 'جاري الفتح...' : 'السماح بإعادة المحاولة للطالب'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-2xl bg-[#FFD600] px-5 py-2.5 text-xs font-extrabold text-black hover:bg-yellow-300 shadow-lg shadow-yellow-500/10"
          >
            <Printer size={16} /> طباعة الشهادة والتقرير
          </button>
        </div>
      </div>

      {/* Main Printable Certificate & Score Card */}
      <div id="certificate-print-area" className="rounded-3xl border border-yellow-500/40 bg-[#181818] p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFD600] font-black text-black text-3xl shadow-lg shadow-yellow-500/20">
              ب
            </div>
            <div>
              <h1 className="text-2xl font-black text-yellow-400">شهادة تقييم اختبار - البشمهندس</h1>
              <p className="text-xs text-gray-400 font-semibold">منصة إدارة الامتحانات الرقمية المحليّة (LAN)</p>
            </div>
          </div>

          {qrCodeData && (
            <div className="flex items-center gap-3 rounded-2xl bg-gray-900 p-2.5 border border-gray-800 text-right">
              <img src={qrCodeData} alt="QR Verify" className="h-16 w-16 rounded-lg" />
              <div className="text-[10px] text-gray-400">
                <span className="font-bold text-yellow-400 block">رمز توثيق الشهادة</span>
                تاريخ الاصدار: {new Date(result.completedAt).toLocaleDateString('ar-EG')}
              </div>
            </div>
          )}
        </div>

        {/* Pass/Fail Header Banner */}
        <div
          className={`rounded-2xl p-6 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            result.passStatus === 'passed'
              ? 'bg-green-950/30 border-green-700/50 text-green-300'
              : 'bg-red-950/30 border-red-700/50 text-red-300'
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-widest block mb-1">
              {result.passStatus === 'passed' ? 'مبروك! لقد اجتزت الاختبار بنجاح' : 'لم تتجاوز درجة النجاح المطلوبة'}
            </span>
            <h2 className="text-3xl font-black text-gray-100">{result.examTitle}</h2>
            <p className="text-xs opacity-80 mt-1">
              الطالب: {result.studentName} ({result.studentCode}) • المادة: {result.subjectName}
            </p>
          </div>

          <div className="text-center md:text-left bg-black/40 p-4 rounded-2xl border border-white/10 min-w-32">
            <span className="text-4xl font-black font-mono text-yellow-400">{result.percentage}%</span>
            <span className="text-xs font-bold text-gray-300 block">تقدير: {result.gradeLetter}</span>
          </div>
        </div>

        {/* Detailed Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="rounded-2xl bg-gray-900 p-4 border border-gray-800">
            <span className="text-gray-400 block mb-1">الدرجة النهائية</span>
            <span className="text-xl font-bold text-yellow-300 font-mono">
              {result.score} / {result.totalPossibleScore}
            </span>
          </div>

          <div className="rounded-2xl bg-gray-900 p-4 border border-gray-800">
            <span className="text-gray-400 block mb-1">الإجابات الصحيحة</span>
            <span className="text-xl font-bold text-green-400 font-mono">{result.correctCount} سؤال</span>
          </div>

          <div className="rounded-2xl bg-gray-900 p-4 border border-gray-800">
            <span className="text-gray-400 block mb-1">الإجابات الخاطئة</span>
            <span className="text-xl font-bold text-red-400 font-mono">{result.wrongCount} سؤال</span>
          </div>

          <div className="rounded-2xl bg-gray-900 p-4 border border-gray-800">
            <span className="text-gray-400 block mb-1">الوقت المستغرق</span>
            <span className="text-xl font-bold text-gray-200 font-mono">
              {Math.floor(result.timeSpentSeconds / 60)} دقيقة
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
