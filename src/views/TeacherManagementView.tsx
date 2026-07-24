/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Trash2, Mail, Phone, ShieldCheck, Key, Lock, UserX, X } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export const TeacherManagementView: React.FC = () => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('مدرسة البشمهندس الثانوية');
  const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
  const [notes, setNotes] = useState('');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeachers();
      setTeachers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username) return;

    try {
      await api.createTeacher({
        fullName,
        username,
        password,
        email,
        phone,
        school,
        role,
        notes,
      });

      setShowAddModal(false);
      setFullName('');
      setUsername('');
      setPassword('123456');
      setEmail('');
      setPhone('');
      setNotes('');
      setMsg({ type: 'success', text: 'تم تسجيل المعلم / المشرف الجديد بنجاح' });
      await loadTeachers();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'فشل إضافة المعلم' });
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحساب للمعلم/المشرف (${name})؟`)) return;
    try {
      await api.deleteTeacher(id);
      setMsg({ type: 'success', text: 'تم حذف حساب المعلم بنجاح' });
      await loadTeachers();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'فشل حذف المعلم' });
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#FFD600] flex items-center gap-2">
            <UserCheck size={28} /> إدارة المعلمين والمشرفين
          </h1>
          <p className="text-xs text-white/60 mt-1">
            تسجيل المعلمين والمراقبين الجدد، منح صلاحيات إدارة بنوك الأسئلة ومراقبة الامتحانات المباشرة.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-2xl bg-[#FFD600] text-black hover:bg-yellow-400 font-extrabold px-5 py-2.5 text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#FFD600]/10 self-start md:self-auto"
        >
          <Plus size={18} /> إضافة معلم / مشرف جديد
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

      {/* Search & Filter */}
      <div className="rounded-3xl border border-white/10 bg-[#141414] p-5">
        <div className="relative">
          <Search size={18} className="absolute right-3.5 top-3.5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم المعلم، اسم المستخدم، البريد الإلكتروني..."
            className="w-full rounded-2xl bg-[#0D0D0D] pr-10 pl-4 py-2.5 text-xs text-white placeholder-white/30 border border-white/10 focus:border-[#FFD600] focus:outline-none"
          />
        </div>
      </div>

      {/* Teachers Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-white/50 text-xs font-bold">جاري تحميل قائمة المعلمين والمشرفين...</div>
      ) : filteredTeachers.length === 0 ? (
        <div className="p-12 text-center text-white/50 space-y-2 border border-white/10 rounded-3xl bg-[#141414]">
          <p className="font-bold text-sm text-white">لا يوجد معلمون مطبقون لشروط البحث</p>
          <p className="text-xs">اضغط على زر "إضافة معلم / مشرف جديد" لإضافة معلمين للمنصة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeachers.map((tch) => (
            <div
              key={tch.id}
              className="rounded-3xl border border-white/10 bg-[#141414] p-6 space-y-4 hover:border-[#FFD600]/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-black border ${
                      tch.role === 'admin'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}
                  >
                    <ShieldCheck size={13} /> {tch.role === 'admin' ? 'مدير منصة (Admin)' : 'معلم / مراقب (Teacher)'}
                  </span>

                  <span className="font-mono text-xs text-[#FFD600] font-black bg-[#FFD600]/10 px-2 py-0.5 rounded-lg border border-[#FFD600]/20">
                    @{tch.username}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">{tch.fullName}</h3>
                  <p className="text-xs text-white/50 mt-0.5">{tch.school || 'منصة البشمهندس التعليمية'}</p>
                </div>

                <div className="space-y-1.5 text-xs text-white/70 font-mono pt-1">
                  {tch.email && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Mail size={14} className="text-[#FFD600]" /> {tch.email}
                    </div>
                  )}
                  {tch.phone && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Phone size={14} className="text-[#FFD600]" /> {tch.phone}
                    </div>
                  )}
                </div>

                {tch.notes && <p className="text-xs text-white/50 italic bg-white/5 p-2 rounded-xl border border-white/5">{tch.notes}</p>}
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                <span className="text-[10px] text-white/40 font-mono">
                  تاريخ التسجيل: {new Date(tch.createdAt).toLocaleDateString('ar-EG')}
                </span>

                <button
                  onClick={() => handleDeleteTeacher(tch.id, tch.fullName)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all"
                  title="حذف حساب المعلم"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TEACHER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#141414] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-[#FFD600] flex items-center gap-2">
                <UserCheck size={20} /> تسجيل حساب معلم أو مشرف جديد
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-white/70 font-bold block">الاسم الثلاثي للمعلم *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: أ.د. محمد أحمد علي"
                  required
                  className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-white/70 font-bold block">اسم المستخدم (Username) *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="teacher_math"
                    required
                    className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 font-bold block">كلمة المرور *</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="123456"
                    required
                    className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-white/70 font-bold block">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.edu"
                    className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 font-bold block">رقم الهاتف / واتساب</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-white/70 font-bold block">نوع الصلاحية الدور (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'teacher' | 'admin')}
                  className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none"
                >
                  <option value="teacher">معلم / مراقب اختيارات (Teacher)</option>
                  <option value="admin">مدير منصة كامل الصلاحيات (Admin)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-white/70 font-bold block">الملاحظات / التخصص</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مدرس خبير في مادة الرياضيات والفيزياء"
                  className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-xs text-white border border-white/10 focus:border-[#FFD600] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-white font-bold hover:bg-white/10"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[#FFD600] text-black font-extrabold px-6 py-2.5 hover:bg-yellow-400"
                >
                  تسجيل المعلم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
