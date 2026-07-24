/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { History, Shield, Search, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { ActivityLog } from '../types';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-gray-800 bg-[#181818] p-6">
        <div>
          <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2">
            <History size={28} /> سجل تدقيق أمان الخادم والعمليات (Audit Logs)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            تسجيل كل العمليات الحساسة (تسجيل الدخول، تسليم الامتحانات، التعديلات والنسخ الاحتياطي) مع عنوان IP والطابع الزمني.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-2 rounded-2xl bg-gray-900 border border-gray-800 px-4 py-2.5 text-xs font-bold text-gray-300 hover:text-white"
        >
          <RefreshCw size={16} /> تحديث السجل
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute right-4 top-3.5 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث بالنص، الإجراء، أو اسم المستخدم..."
          className="w-full rounded-2xl bg-gray-900 pr-12 pl-4 py-3 text-sm text-white border border-gray-800 focus:border-yellow-500 focus:outline-none"
        />
      </div>

      <div className="rounded-3xl border border-gray-800 bg-[#181818] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-900 text-gray-400 font-bold border-b border-gray-800">
              <tr>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">الصلاحية</th>
                <th className="p-4">الإجراء</th>
                <th className="p-4">التفاصيل</th>
                <th className="p-4">عنوان IP</th>
                <th className="p-4">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-900/50 transition-all">
                  <td className="p-4 font-bold text-gray-100">{log.userName}</td>
                  <td className="p-4">
                    <span className="rounded-md bg-yellow-500/10 text-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-yellow-300">{log.action}</td>
                  <td className="p-4 text-gray-400 max-w-xs truncate">{log.details}</td>
                  <td className="p-4 font-mono text-gray-400">{log.ipAddress || 'LAN'}</td>
                  <td className="p-4 font-mono text-gray-500">{new Date(log.timestamp).toLocaleString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
