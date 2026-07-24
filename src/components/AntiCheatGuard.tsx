/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Maximize2, ShieldAlert } from 'lucide-react';

interface AntiCheatGuardProps {
  fullscreenRequired?: boolean;
  maxWarningsAllowed?: number;
  warningsCount: number;
  onWarning: (type: 'tab_switch' | 'fullscreen_exit' | 'right_click') => void;
  children: React.ReactNode;
}

export const AntiCheatGuard: React.FC<AntiCheatGuardProps> = ({
  fullscreenRequired = true,
  maxWarningsAllowed = 3,
  warningsCount,
  onWarning,
  children,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // Request fullscreen
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setShowWarningModal(false);
    } catch (e) {
      console.warn('Fullscreen request bypassed or denied:', e);
    }
  };

  useEffect(() => {
    // Disable right-click, copy, paste, select
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onWarning('right_click');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+C, Ctrl+V, Alt+Tab
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'c') ||
        (e.ctrlKey && e.key === 'v') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        onWarning('tab_switch');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningMessage('تم اكتشاف مغادرة شاشة الاختبار أو فتح تبويب آخر! تم تسجيل هذه الملاحظة.');
        setShowWarningModal(true);
        onWarning('tab_switch');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && fullscreenRequired) {
        setIsFullscreen(false);
        setWarningMessage('تم الخروج من وضع الشاشة الكاملة! يلزم العودة للشاشة الكاملة لمتابعة الاختبار.');
        setShowWarningModal(true);
        onWarning('fullscreen_exit');
      } else {
        setIsFullscreen(true);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [fullscreenRequired, onWarning]);

  return (
    <div className="relative min-h-screen select-none bg-[#0D0D0D] text-gray-100">
      {children}

      {/* Warning Dialog Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-yellow-500/50 bg-[#181818] p-6 text-center shadow-2xl shadow-yellow-500/10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400">
              <ShieldAlert size={36} />
            </div>

            <h3 className="mb-2 text-xl font-bold text-yellow-400">تحذير أمان الاختبار!</h3>
            <p className="mb-4 text-sm text-gray-300 leading-relaxed">{warningMessage}</p>

            <div className="mb-6 rounded-xl bg-red-950/40 p-3 border border-red-800/40 text-xs font-semibold text-red-300">
              عدد التحذيرات الحالية: <span className="text-red-400 font-bold">{warningsCount}</span> من أصل{' '}
              <span className="text-gray-200">{maxWarningsAllowed}</span> مسموح بها.
            </div>

            {fullscreenRequired && !isFullscreen ? (
              <button
                onClick={enterFullscreen}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFD600] px-5 py-3 font-bold text-black transition-all hover:bg-yellow-300 shadow-lg shadow-yellow-500/20"
              >
                <Maximize2 size={18} /> العودة للوضع الكامل والتابعة
              </button>
            ) : (
              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full rounded-xl bg-[#FFD600] px-5 py-3 font-bold text-black transition-all hover:bg-yellow-300 shadow-lg shadow-yellow-500/20"
              >
                متابعة الاختبار
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
