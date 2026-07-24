/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Search, Upload, Download, Trash2, QrCode, ShieldCheck, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { User } from '../types';

export const StudentManagementView: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [grade, setGrade] = useState('Grade 12');
  const [className, setClassName] = useState('12/A');

  const [selectedStudentQr, setSelectedStudentQr] = useState<{ name: string; id: string; qrData: string } | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !studentId) return;

    try {
      await api.createStudent({
        fullName,
        studentId,
        nationalId,
        phone,
        parentPhone,
        grade,
        className,
      });

      setShowAddModal(false);
      setFullName('');
      setStudentId('');
      await loadStudents();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الطالب');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try {
      await api.deleteStudent(id);
      await loadStudents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateStudentQr = async (student: User) => {
    try {
      const qrData = await QRCode.toDataURL(
        `البشمنهدس STUDENT CARD\n اسم الطالب: ${student.fullName}\n كود الطالب: ${student.studentId}\n الرقم القومي: ${student.nationalId}`,
        { margin: 1, width: 200 }
      );
      setSelectedStudentQr({
        name: student.fullName,
        id: student.studentId || '',
        qrData,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-gray-800 bg-[#181818] p-6">
        <div>
          <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2">
            <GraduationCap size={28} /> دليل وإدارة الطلاب
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            إضافة الطلاب وتوليد بطاقات الدخول الذكية ببطاقات QR Code، مع إمكانية البحث والتوزيع على الفصول.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#FFD600] px-5 py-3 text-xs font-extrabold text-black hover:bg-yellow-300 shadow-lg shadow-yellow-500/10"
          >
            <Plus size={18} /> إضافة طالب جديد
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute right-4 top-3.5 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم الطالب، كود الطالب، أو الفصل..."
          className="w-full rounded-2xl bg-gray-900 pr-12 pl-4 py-3 text-sm text-white border border-gray-800 focus:border-yellow-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-gray-800 bg-[#181818] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-900 text-gray-400 font-bold border-b border-gray-800">
              <tr>
                <th className="p-4">اسم الطالب</th>
                <th className="p-4">كود الطالب / ID</th>
                <th className="p-4">الرقم القومي</th>
                <th className="p-4">الصف / الفصل</th>
                <th className="p-4">الهاتف</th>
                <th className="p-4">بطاقة QR</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-900/50 transition-all">
                  <td className="p-4 font-bold text-gray-100">{s.fullName}</td>
                  <td className="p-4 font-mono text-yellow-400 font-bold">{s.studentId || s.username}</td>
                  <td className="p-4 font-mono text-gray-400">{s.nationalId || '-'}</td>
                  <td className="p-4">{s.grade || 'الثانوي'} / {s.className || '1'}</td>
                  <td className="p-4 font-mono text-gray-400">{s.phone || '-'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleGenerateStudentQr(s)}
                      className="flex items-center gap-1 text-[11px] font-bold text-yellow-400 hover:underline"
                    >
                      <QrCode size={14} /> كارت QR
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDeleteStudent(s.id)}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-red-950/60 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-yellow-500/40 bg-[#181818] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">إضافة طالب جديد</h3>
            <form onSubmit={handleAddStudent} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-gray-300 mb-1">الاسم بالكامل</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: أحمد محمود السعيد"
                  required
                  className="w-full rounded-xl bg-gray-900 p-3 text-white border border-gray-800"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">كود الطالب / الرقم التعريفي</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="مثال: STU-2026-005"
                  required
                  className="w-full rounded-xl bg-gray-900 p-3 text-white border border-gray-800"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">الرقم القومي (اختياري)</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="3010..."
                  className="w-full rounded-xl bg-gray-900 p-3 text-white border border-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 mb-1">الصف</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full rounded-xl bg-gray-900 p-3 text-white border border-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">الفصل</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full rounded-xl bg-gray-900 p-3 text-white border border-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl bg-gray-800 px-4 py-2 font-bold text-gray-300"
                >
                  إلغاء
                </button>
                <button type="submit" className="rounded-xl bg-[#FFD600] px-5 py-2 font-extrabold text-black">
                  حفظ الطالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Preview Card */}
      {selectedStudentQr && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-sm rounded-3xl border border-yellow-500/40 bg-[#181818] p-6 text-center shadow-2xl">
            <h3 className="text-lg font-black text-yellow-400 mb-1">بطاقة دخول الطالب</h3>
            <p className="text-xs font-bold text-gray-200">{selectedStudentQr.name}</p>
            <p className="text-xs font-mono text-gray-400 mb-4">كود الطالب: {selectedStudentQr.id}</p>

            <img src={selectedStudentQr.qrData} alt="QR" className="mx-auto h-48 w-48 rounded-2xl border-2 border-yellow-500/30 p-2 bg-[#0D0D0D] mb-4" />

            <button onClick={() => setSelectedStudentQr(null)} className="w-full rounded-xl bg-gray-800 py-2.5 text-xs font-bold text-gray-300">
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
