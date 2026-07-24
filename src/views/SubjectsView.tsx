/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Code,
  FileText,
  Calculator,
  Atom,
  FlaskConical,
  Laptop,
  Globe,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Subject } from '../types';

export const SubjectsView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form inputs
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSubjects();
      setSubjects(data);
    } catch (err: any) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSubject(null);
    setCode(`SUB-${Math.floor(100 + Math.random() * 900)}`);
    setNameAr('');
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setCode(sub.code);
    setNameAr(sub.nameAr);
    setName(sub.name);
    setDescription(sub.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !code) {
      setMsg({ type: 'error', text: 'من فضلك أدخل كود واسم المادة باللغة العربية' });
      return;
    }

    try {
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, {
          code,
          nameAr,
          name: name || nameAr,
          description,
        });
        setMsg({ type: 'success', text: 'تم تحديث المادة الدراسية بنجاح' });
      } else {
        await api.createSubject({
          code,
          nameAr,
          name: name || nameAr,
          description,
        });
        setMsg({ type: 'success', text: 'تم إضافة المادة الدراسية الجديدة بنجاح' });
      }

      setIsModalOpen(false);
      await loadSubjects();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ المادة' });
    }
  };

  const handleDelete = async (id: string, nameAr: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف مادة (${nameAr})؟`)) return;
    try {
      await api.deleteSubject(id);
      setMsg({ type: 'success', text: 'تم حذف المادة بنجاح' });
      await loadSubjects();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'فشل حذف المادة' });
    }
  };

  // Icon selector based on subject code/name
  const getSubjectIcon = (nameAr: string, code: string) => {
    if (nameAr.includes('رياضيات') || nameAr.includes('Math') || code.includes('MATH')) {
      return <Calculator size={24} className="text-[#FFD600]" />;
    }
    if (nameAr.includes('فيزياء') || code.includes('PHYS')) {
      return <Atom size={24} className="text-cyan-400" />;
    }
    if (nameAr.includes('كيمياء') || code.includes('CHEM')) {
      return <FlaskConical size={24} className="text-purple-400" />;
    }
    if (nameAr.includes('حاسب') || nameAr.includes('برمجة') || code.includes('CS')) {
      return <Laptop size={24} className="text-green-400" />;
    }
    if (nameAr.includes('إنجليزية') || nameAr.includes('لغات') || code.includes('ENG')) {
      return <Globe size={24} className="text-blue-400" />;
    }
    return <BookOpen size={24} className="text-amber-400" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#FFD600] flex items-center gap-2">
            <BookOpen size={28} /> إدارة المواد الدراسية والصفوف
          </h1>
          <p className="text-xs text-white/60 mt-1">
            إضافة وتعديل المواد التعليمية المتاحة في المنصة (مثل الرياضيات، الفيزياء، الكيمياء، الحاسب الآلي، وغيرها).
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="rounded-2xl bg-[#FFD600] text-black hover:bg-yellow-400 font-extrabold px-5 py-2.5 text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#FFD600]/10 self-start md:self-auto"
        >
          <Plus size={18} /> إضافة مادة دراسية جديدة
        </button>
      </div>

      {/* Message Banner */}
      {msg && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between animate-fade-in ${
            msg.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Quick Subject Add Preset Bar */}
      <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 space-y-3">
        <span className="text-xs font-bold text-white/60 block">إضافة سريعة لمواد جاهزة بنقرة واحدة:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setCode('MATH-101');
              setNameAr('الرياضيات العامة والتفاضل');
              setName('Mathematics');
              setDescription('الجبر والهندسة والتفاضل والتكامل للمرحلة الثانوية والجامعية');
              setIsModalOpen(true);
            }}
            className="rounded-2xl bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/30 hover:bg-[#FFD600] hover:text-black px-3.5 py-2 text-xs font-extrabold transition-all flex items-center gap-1.5"
          >
            <Calculator size={15} /> + الرياضيات (Math)
          </button>

          <button
            onClick={() => {
              setCode('PHYS-101');
              setNameAr('الفيزياء الكلاسيكية والحديثة');
              setName('Physics');
              setDescription('الكهربية والمغناطيسية والفيزياء الحديثة');
              setIsModalOpen(true);
            }}
            className="rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black px-3.5 py-2 text-xs font-extrabold transition-all flex items-center gap-1.5"
          >
            <Atom size={15} /> + الفيزياء (Physics)
          </button>

          <button
            onClick={() => {
              setCode('CHEM-101');
              setNameAr('الكيمياء العضوية والتحليلية');
              setName('Chemistry');
              setDescription('الكيمياء العضوية وغير العضوية والمعايرة');
              setIsModalOpen(true);
            }}
            className="rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500 hover:text-black px-3.5 py-2 text-xs font-extrabold transition-all flex items-center gap-1.5"
          >
            <FlaskConical size={15} /> + الكيمياء (Chemistry)
          </button>

          <button
            onClick={() => {
              setCode('ENG-101');
              setNameAr('اللغة الإنجليزية والقواعد');
              setName('English Language');
              setDescription('قواعد اللغة الإنجليزية واللغويات والمفردات والترجمة');
              setIsModalOpen(true);
            }}
            className="rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-black px-3.5 py-2 text-xs font-extrabold transition-all flex items-center gap-1.5"
          >
            <Globe size={15} /> + اللغة الإنجليزية (English)
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-white/50 text-xs font-bold">جاري تحميل المواد الدراسية...</div>
      ) : subjects.length === 0 ? (
        <div className="p-12 text-center text-white/50 space-y-2 border border-white/10 rounded-3xl bg-[#141414]">
          <p className="font-bold text-sm text-white">لا توجد مواد دراسية مسجلة بعد</p>
          <p className="text-xs">اضغط على زر "إضافة مادة دراسية جديدة" للبدء.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="rounded-3xl border border-white/10 bg-[#141414] p-6 space-y-4 hover:border-[#FFD600]/40 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform">
                    {getSubjectIcon(sub.nameAr, sub.code)}
                  </div>
                  <span className="font-mono text-xs text-[#FFD600] font-black bg-[#FFD600]/10 px-2.5 py-1 rounded-xl border border-[#FFD600]/20">
                    {sub.code}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-[#FFD600] transition-colors">{sub.nameAr}</h3>
                  <p className="text-xs font-mono text-white/40">{sub.name}</p>
                </div>

                <p className="text-xs text-white/60 leading-relaxed line-clamp-2">{sub.description || 'لا يوجد وصف مضاف لهذه المادة.'}</p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-white/40 font-mono">
                  {new Date(sub.createdAt).toLocaleDateString('ar-EG')}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(sub)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all"
                    title="تعديل المادة"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id, sub.nameAr)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all"
                    title="حذف المادة"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT SUBJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#141414] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-[#FFD600] flex items-center gap-2">
                <BookOpen size={20} /> {editingSubject ? 'تعديل بيانات المادة الدراسية' : 'إضافة مادة دراسية جديدة'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-white/70 font-bold block">كود المادة الدراسية (Code)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="مثال: MATH-101 أو PHYS-101"
                  required
                  className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70 font-bold block">اسم المادة باللغة العربية *</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: الرياضيات والتفاضل / الفيزياء الحديثة"
                  required
                  className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70 font-bold block">اسم المادة بالإنجليزية (اخشياري)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: Mathematics / Physics"
                  className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70 font-bold block">الوصف أو المنهج الدراسي</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="نبذة عن المنهج والفصول المسجلة..."
                  className="w-full rounded-2xl bg-[#0D0D0D] p-3 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-white font-bold hover:bg-white/10"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[#FFD600] text-black font-extrabold px-6 py-2.5 hover:bg-yellow-400"
                >
                  {editingSubject ? 'حفظ التعديلات' : 'إضافة المادة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
