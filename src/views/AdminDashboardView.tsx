/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Database,
  FileSpreadsheet,
  BarChart3,
  Wifi,
  Activity,
  PlusCircle,
  Upload,
  HardDriveUpload,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { NetworkInfoModal } from '../components/NetworkInfoModal';

interface AdminDashboardViewProps {
  onTabChange: (tab: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onTabChange }) => {
  const [stats, setStats] = useState<any>(null);
  const [showNetModal, setShowNetModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex h-96 items-center justify-center text-yellow-400 font-bold">
        جاري تحميل مؤشرات المنصة...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#FFD600]/20 bg-gradient-to-r from-[#0A0A0A] via-[#1c1800] to-[#0A0A0A] p-8 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFD600]/10 px-3.5 py-1 border border-[#FFD600]/20 text-xs font-extrabold text-[#FFD600] mb-3 shadow-[0_0_10px_rgba(255,214,0,0.1)]">
              <ShieldCheck size={14} /> خادم محلي مستقر 100% (SECURE LAN SERVER)
            </div>
            <h2 className="text-3xl font-black text-[#FFD600] tracking-tight">منصة "البشمهندس" للامتحانات الرقمية</h2>
            <p className="mt-2 text-sm text-white/70 max-w-xl leading-relaxed">
              نظام إدارة الاختبارات الرقمية عالي السرعة على الشبكة المحلية (LAN)، يضمن الأمان وتوليد نماذج عشوائية مخصصة لكل طالب لمنع الغش تماماً.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowNetModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#FFD600] px-5 py-3 font-extrabold text-black hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(255,214,0,0.25)] text-sm"
            >
              <Wifi size={18} /> عرض عنوان الشبكة ورمز QR
            </button>
            <button
              onClick={() => onTabChange('monitoring')}
              className="flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 px-5 py-3 font-bold text-red-400 hover:bg-red-500/20 transition-all text-sm"
            >
              <Activity size={18} className="animate-pulse" /> المراقبة الحية ({stats.liveSessionsCount})
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/5 bg-[#181818]/90 backdrop-blur-md p-5 shadow-xl hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">إجمالي الطلاب</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/20">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-white italic">{stats.studentsCount}</div>
          <p className="text-[11px] text-white/40 mt-2 font-mono">سعة الخادم الحالية: {stats.serverCapacity}</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#181818]/90 backdrop-blur-md p-5 shadow-xl hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">بنوك الأسئلة والمخزن</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/20">
              <Database size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-white italic">{stats.questionsCount}</div>
          <p className="text-[11px] text-white/40 mt-2">موزعة على {stats.questionBanksCount} بنك أسئلة</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#181818]/90 backdrop-blur-md p-5 shadow-xl hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">الامتحانات والنتائج</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/20">
              <FileSpreadsheet size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-white italic">{stats.examsCount}</div>
          <p className="text-[11px] text-white/40 mt-2">{stats.finishedExamsCount} اختبار تم تصحيحه بنجاح</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#181818]/90 backdrop-blur-md p-5 shadow-xl hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">نسبة النجاح العامة</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/20">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-[#FFD600] italic">{stats.passRate}%</div>
          <p className="text-[11px] text-white/40 mt-2">متوسط الدرجات: {stats.averageScore}%</p>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="rounded-3xl border border-white/5 bg-[#181818]/90 backdrop-blur-md p-6 shadow-xl">
        <h3 className="text-lg font-black text-[#FFD600] mb-4 flex items-center gap-2">
          <PlusCircle size={20} /> الإجراءات السريعة
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onTabChange('exams')}
            className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-5 hover:border-[#FFD600]/40 hover:bg-white/10 transition-all text-center group shadow-md"
          >
            <FileSpreadsheet size={28} className="text-[#FFD600] group-hover:scale-110 transition-transform mb-2" />
            <span className="text-sm font-bold text-white/90">إنشاء اختبار جديد</span>
            <span className="text-[11px] text-white/40 mt-1">توليد عشوائي وقياسي</span>
          </button>

          <button
            onClick={() => onTabChange('question_banks')}
            className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-5 hover:border-[#FFD600]/40 hover:bg-white/10 transition-all text-center group shadow-md"
          >
            <Upload size={28} className="text-[#FFD600] group-hover:scale-110 transition-transform mb-2" />
            <span className="text-sm font-bold text-white/90">استيراد أسئلة (Excel)</span>
            <span className="text-[11px] text-white/40 mt-1">دعم قوالب XLSX و CSV</span>
          </button>

          <button
            onClick={() => onTabChange('students')}
            className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-5 hover:border-[#FFD600]/40 hover:bg-white/10 transition-all text-center group shadow-md"
          >
            <GraduationCap size={28} className="text-[#FFD600] group-hover:scale-110 transition-transform mb-2" />
            <span className="text-sm font-bold text-white/90">إضافة أو استيراد طلاب</span>
            <span className="text-[11px] text-white/40 mt-1">أكواد وبطاقات دخول QR</span>
          </button>

          <button
            onClick={() => onTabChange('backups')}
            className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-5 hover:border-[#FFD600]/40 hover:bg-white/10 transition-all text-center group shadow-md"
          >
            <HardDriveUpload size={28} className="text-[#FFD600] group-hover:scale-110 transition-transform mb-2" />
            <span className="text-sm font-bold text-white/90">نسخة احتياطية SQLite</span>
            <span className="text-[11px] text-white/40 mt-1">حفظ محلي آمن في ثوانٍ</span>
          </button>
        </div>
      </div>

      <NetworkInfoModal isOpen={showNetModal} onClose={() => setShowNetModal(false)} />
    </div>
  );
};
