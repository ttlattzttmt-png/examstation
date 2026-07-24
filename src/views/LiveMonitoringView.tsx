/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Pause, Play, Plus, CheckCircle, RefreshCw, AlertTriangle, Monitor, Clock } from 'lucide-react';
import { api } from '../services/api';
import { LiveStudentMonitor } from '../types';

export const LiveMonitoringView: React.FC = () => {
  const [sessions, setSessions] = useState<LiveStudentMonitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMonitoring();
    const interval = setInterval(loadMonitoring, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadMonitoring = async () => {
    try {
      const data = await api.getLiveMonitoring();
      setSessions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (sessionId: string, action: 'pause' | 'resume' | 'extend_time' | 'force_submit', timeExtendMinutes?: number) => {
    try {
      await api.sendMonitoringAction(sessionId, action, timeExtendMinutes);
      await loadMonitoring();
    } catch (e: any) {
      alert(e.message || 'فشل تنفيذ الإجراء');
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-gray-800 bg-[#181818] p-6">
        <div>
          <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2">
            <Activity size={28} className="text-red-500 animate-pulse" /> غرفة المراقبة الحية للامتحانات (LAN Live)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            متابعة فورية للطلاب المتصلين حالياً على خادم الشبكة المحلية، ورصد محاولات الغش وتمديد الوقت أو إيقاف الجلسات.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 text-xs font-bold text-yellow-400">
            <Monitor size={16} /> طلاب نشطون الآن: {sessions.length}
          </span>
          <button
            onClick={loadMonitoring}
            className="flex items-center gap-1 rounded-2xl bg-gray-900 border border-gray-800 p-2 text-gray-400 hover:text-white"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Student Sessions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-gray-800 bg-[#181818] p-12 text-center text-gray-500 text-sm">
            لا توجد امتحانات جارية حالياً على خادم الشبكة المحلية. بمجرد بدء أي طالب للاختبار سيظهر ملفه هنا فوراً.
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.sessionId}
              className={`rounded-3xl border p-5 space-y-4 transition-all ${
                s.warningsCount > 0
                  ? 'border-red-500/50 bg-red-950/10 shadow-lg shadow-red-500/5'
                  : 'border-gray-800 bg-[#181818]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-100">{s.studentName}</h3>
                  <p className="text-[11px] text-gray-400 font-mono">{s.studentCode} • {s.ipAddress}</p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                    s.status === 'in_progress'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}
                >
                  {s.status === 'in_progress' ? 'يجيب الآن' : 'موقوف موقتاً'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400 font-semibold">
                  <span>التقدم: السؤال {s.currentQuestion} من {s.totalQuestions}</span>
                  <span className="font-mono text-yellow-400">{s.progressPercentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-900 overflow-hidden">
                  <div className="h-full bg-[#FFD600] transition-all duration-500" style={{ width: `${s.progressPercentage}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold bg-gray-900/60 p-3 rounded-2xl border border-gray-800">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <Clock size={14} className="text-yellow-400" />
                  <span>الوقت المتبقي:</span>
                  <span className="font-mono font-bold text-yellow-300">{formatSeconds(s.remainingSeconds)}</span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-300">
                  <ShieldAlert size={14} className={s.warningsCount > 0 ? 'text-red-400' : 'text-gray-500'} />
                  <span>التحذيرات:</span>
                  <span className={`font-bold ${s.warningsCount > 0 ? 'text-red-400 font-black' : 'text-gray-400'}`}>
                    {s.warningsCount}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-bold">
                {s.status === 'in_progress' ? (
                  <button
                    onClick={() => handleAction(s.sessionId, 'pause')}
                    className="flex items-center justify-center gap-1 rounded-xl bg-yellow-500/10 text-yellow-400 p-2 hover:bg-yellow-500/20 border border-yellow-500/30"
                  >
                    <Pause size={14} /> إيقاف
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(s.sessionId, 'resume')}
                    className="flex items-center justify-center gap-1 rounded-xl bg-green-500/10 text-green-400 p-2 hover:bg-green-500/20 border border-green-500/30"
                  >
                    <Play size={14} /> استئناف
                  </button>
                )}

                <button
                  onClick={() => handleAction(s.sessionId, 'extend_time', 5)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-gray-900 text-gray-200 p-2 hover:bg-gray-800 border border-gray-800"
                >
                  <Plus size={14} /> +5 دقائق
                </button>

                <button
                  onClick={() => {
                    if (confirm(`هل أنت متأكد من إنهاء وتسليم امتحان الطالب ${s.studentName} فوراً؟`)) {
                      handleAction(s.sessionId, 'force_submit');
                    }
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl bg-red-950/40 text-red-400 p-2 hover:bg-red-900/60 border border-red-800/40"
                >
                  <CheckCircle size={14} /> إنهاء
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
