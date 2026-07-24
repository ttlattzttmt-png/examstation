/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Database,
  FileSpreadsheet,
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  HardDriveUpload,
  History,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return null; // Students get full screen exam / student view
  }

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'monitoring', label: 'المراقبة الحية', icon: Activity, badge: 'LIVE' },
    { id: 'question_banks', label: 'بنوك الأسئلة', icon: Database },
    { id: 'exams', label: 'إدارة الامتحانات', icon: FileSpreadsheet },
    { id: 'results', label: 'النتائج والتقارير', icon: BarChart3 },
    { id: 'students', label: 'إدارة الطلاب', icon: GraduationCap },
    { id: 'teachers', label: 'المدرسين', icon: Users },
    { id: 'subjects', label: 'المواد والدراسة', icon: BookOpen },
    { id: 'backups', label: 'النسخ الاحتياطي', icon: HardDriveUpload },
    { id: 'logs', label: 'سجل النظام', icon: History },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-l border-white/5 bg-[#0A0A0A] p-4 text-white/80 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                isActive
                  ? 'bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/20 shadow-[0_0_15px_rgba(255,214,0,0.1)]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-[#FFD600]' : 'text-white/40 group-hover:text-white'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${
                  isActive ? 'bg-[#FFD600] text-black' : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
