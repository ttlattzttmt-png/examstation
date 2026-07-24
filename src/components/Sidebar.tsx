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
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, isOpenMobile, onCloseMobile }) => {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return null; // Students get full screen exam / student view
  }

  const allNavItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'monitoring', label: 'المراقبة الحية', icon: Activity, badge: 'LIVE' },
    { id: 'question_banks', label: 'بنوك الأسئلة', icon: Database },
    { id: 'exams', label: 'إدارة الامتحانات', icon: FileSpreadsheet },
    { id: 'results', label: 'النتائج والتقارير', icon: BarChart3 },
    { id: 'students', label: 'إدارة الطلاب', icon: GraduationCap },
    { id: 'teachers', label: 'المدرسين والمشرفين', icon: Users, adminOnly: true },
    { id: 'subjects', label: 'المواد والدراسة', icon: BookOpen },
    { id: 'backups', label: 'النسخ الاحتياطي', icon: HardDriveUpload, adminOnly: true },
    { id: 'logs', label: 'سجل النظام', icon: History, adminOnly: true },
    { id: 'settings', label: 'إعدادات المنصة', icon: Settings, adminOnly: true },
  ];

  const navItems = allNavItems.filter((item) => {
    if (user?.role === 'teacher' && item.adminOnly) {
      return false;
    }
    return true;
  });

  const content = (
    <div className="space-y-1.5 flex-1 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              if (onCloseMobile) onCloseMobile();
            }}
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
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-l border-white/5 bg-[#0A0A0A] p-4 text-white/80 min-h-[calc(100vh-4rem)] flex-col justify-between">
        {content}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative z-10 w-72 bg-[#0D0D0D] p-5 text-white/80 h-full flex flex-col justify-between border-l border-white/10 shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                <span className="font-black text-[#FFD600] text-lg">قائمة التنقل</span>
                <button onClick={onCloseMobile} className="text-white/50 hover:text-white p-1">✕</button>
              </div>
              {content}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
