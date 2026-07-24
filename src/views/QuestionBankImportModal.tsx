/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';

interface QuestionBankImportModalProps {
  bankId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuestionBankImportModal: React.FC<QuestionBankImportModalProps> = ({ bankId, isOpen, onClose, onSuccess }) => {
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        // Normalize imported excel rows
        const mapped = data.map((row, idx) => ({
          text: row['Question'] || row['السؤال'] || row['question'] || `سؤال ${idx + 1}`,
          type: 'mcq',
          options: [
            { id: 'opt-1', text: String(row['Option A'] || row['الخيار أ'] || 'أ'), isCorrect: true },
            { id: 'opt-2', text: String(row['Option B'] || row['الخيار ب'] || 'ب'), isCorrect: false },
            { id: 'opt-3', text: String(row['Option C'] || row['الخيار ج'] || 'ج'), isCorrect: false },
            { id: 'opt-4', text: String(row['Option D'] || row['الخيار د'] || 'د'), isCorrect: false },
          ],
          chapter: row['Chapter'] || row['الفصل'] || 'عام',
          lesson: row['Lesson'] || row['الدرس'] || 'عام',
          difficulty: (row['Difficulty'] || 'medium').toLowerCase(),
          score: Number(row['Marks'] || row['الدرجة'] || 1),
          explanation: row['Explanation'] || row['الشرح'] || '',
        }));

        setParsedQuestions(mapped);
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف Excel، تأكد من سلامة الصيغة');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'السؤال': 'ما هي وحدة قياس الشدة الكهربية؟',
        'الخيار أ': 'أمبير',
        'الخيار ب': 'فولت',
        'الخيار ج': 'أوم',
        'الخيار د': 'وات',
        'الفصل': 'الفصل الأول',
        'الدرس': 'التيار الكهربي',
        'الدرجة': 1,
        'الشرح': 'الأمبير هو وحدة قياس شدة التيار الدولية',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب الأسئلة');
    XLSX.writeFile(wb, 'قالب_استيراد_الأسئلة_البشمهندس.xlsx');
  };

  const handleImportSubmit = async () => {
    if (parsedQuestions.length === 0) return;
    setIsSubmitting(true);

    try {
      const result = await api.importQuestions(bankId, parsedQuestions);
      alert(`تم استيراد ${result.importedCount} سؤال بنجاح لداخل بنك الأسئلة!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'فشل الاستيراد');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#181818]/95 backdrop-blur-2xl p-6 shadow-2xl my-8">
        <button onClick={onClose} className="absolute left-4 top-4 rounded-xl bg-white/5 border border-white/10 p-2 text-white/50 hover:text-white transition-all">
          <X size={20} />
        </button>

        <h3 className="text-xl font-black text-[#FFD600] mb-2 flex items-center gap-2">
          <FileSpreadsheet size={22} /> استيراد الأسئلة من ملف Excel / CSV
        </h3>
        <p className="text-xs text-white/50 mb-6">يدعم استيراد آلاف الأسئلة دفعة واحدة مع المعاينة التلقائية والتحقق من التكرار.</p>

        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10 text-xs">
          <div>
            <p className="font-bold text-white/90">تحميل قالب Excel جاهز للتعبئة</p>
            <p className="text-[11px] text-white/40">قالب يحتوي على جميع الأعمدة المطلوبة للاستيراد السليم</p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 rounded-xl bg-[#FFD600]/10 border border-[#FFD600]/30 px-3.5 py-2 font-bold text-[#FFD600] hover:bg-[#FFD600]/20 transition-all"
          >
            <Download size={16} /> تحميل القالب
          </button>
        </div>

        {/* File Dropzone */}
        <div className="mb-6 relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-8 text-center hover:border-[#FFD600]/40 transition-all cursor-pointer">
          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          <Upload size={36} className="text-[#FFD600] mb-2" />
          <p className="text-sm font-bold text-white/90">{fileName || 'اضغط هنا لرفع ملف Excel أو قم بسحبه وإسقاطه'}</p>
          <p className="text-xs text-white/40 mt-1">صيغ مدعومة: .XLSX, .XLS, .CSV</p>
        </div>

        {/* Parsed Preview Table */}
        {parsedQuestions.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white/5 p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-[#FFD600]">معاينة الأسئلة المستخرجة ({parsedQuestions.length} سؤال)</span>
              <span className="text-green-400 flex items-center gap-1"><Check size={14} /> تم التحقق من البيانات</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
              {parsedQuestions.slice(0, 5).map((q, i) => (
                <div key={i} className="rounded-xl bg-[#0D0D0D] p-2.5 border border-white/5 flex items-center justify-between">
                  <span className="text-white/80 truncate max-w-xs">{i + 1}. {q.text}</span>
                  <span className="text-[10px] bg-[#FFD600]/10 text-[#FFD600] px-2 py-0.5 rounded-md font-bold">{q.chapter}</span>
                </div>
              ))}
              {parsedQuestions.length > 5 && (
                <p className="text-center text-[11px] text-white/40 pt-1">... و {parsedQuestions.length - 5} سؤال أخر</p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 transition-all">
            إلغاء
          </button>
          <button
            onClick={handleImportSubmit}
            disabled={parsedQuestions.length === 0 || isSubmitting}
            className="rounded-xl bg-[#FFD600] px-6 py-2.5 text-xs font-extrabold text-black hover:bg-yellow-300 disabled:opacity-50 shadow-[0_0_15px_rgba(255,214,0,0.25)] transition-all"
          >
            {isSubmitting ? 'جاري الاستيراد...' : `استيراد ${parsedQuestions.length} سؤال الآن`}
          </button>
        </div>
      </div>
    </div>
  );
};
