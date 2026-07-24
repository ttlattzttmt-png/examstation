/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, LogOut, User as UserIcon, Shield, Clock, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NetworkInfoModal } from './NetworkInfoModal';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange, onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#0A0A0A]/80 px-4 sm:px-6 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          {user && user.role !== 'student' && onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="flex md:hidden rounded-xl bg-white/5 p-2 text-white/80 hover:bg-white/10"
              title="القائمة"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFD600] font-black text-black shadow-[0_0_15px_rgba(255,214,0,0.3)] text-lg tracking-tighter">
              ب
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-[#FFD600] tracking-tight">البشمهندس</h1>
              <p className="text-[9px] sm:text-[10px] font-semibold text-white/40 uppercase tracking-wider">منصة الامتحانات (LAN)</p>
            </div>
          </div>

          <button
            onClick={() => setShowNetworkModal(true)}
            className="hidden md:flex items-center gap-2 rounded-xl bg-[#FFD600]/10 px-3.5 py-1.5 border border-[#FFD600]/20 text-xs font-bold text-[#FFD600] hover:bg-[#FFD600]/20 transition-all shadow-[0_0_10px_rgba(255,214,0,0.05)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD600] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD600]"></span>
            </span>
            <Wifi size={14} /> خادم LAN نشط | إظهار QR
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 border border-white/10 text-xs font-mono text-white/80">
            <Clock size={14} className="text-[#FFD600]" /> {timeString}
          </div>

          {user && (
            <div className="flex items-center gap-3 border-r border-white/5 pr-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FFD600] to-yellow-600 text-black font-extrabold text-sm shadow-[0_0_10px_rgba(255,214,0,0.2)]">
                  {user.fullName.slice(0, 1)}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white/90">{user.fullName}</p>

                  <span className="inline-flex items-center gap-1 text-[10px] text-[#FFD600] font-semibold uppercase tracking-wider">
                    <Shield size={10} /> {user.role === 'admin' ? 'مدير المنصة' : user.role === 'teacher' ? 'مدرس' : 'طالب'}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="تسجيل الخروج"
                className="rounded-xl bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <NetworkInfoModal isOpen={showNetworkModal} onClose={() => setShowNetworkModal(false)} />
    </>
  );
};
