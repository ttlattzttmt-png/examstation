/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HardDriveUpload, Download, Plus, CheckCircle, Database, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../services/api';
import { BackupItem } from '../types';

export const BackupView: React.FC = () => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const data = await api.getBackups();
      setBackups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      await api.createBackup();
      alert('تم إنشاء نسخة احتياطية جديدة من قاعدة بيانات SQLite بنجاح في مجلد الخادم المحلي /backups');
      await loadBackups();
    } catch (e: any) {
      alert(e.message || 'فشل إنشاء النسخة الاحتياطية');
    } finally {
      setIsCreating(false);
    }
  };

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-gray-800 bg-[#181818] p-6">
        <div>
          <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2">
            <HardDriveUpload size={28} /> نظام النسخ الاحتياطي المحلي (SQLite Backups)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            جميع بيانات الامتحانات والطلاب والنتائج محفوظة محلياً بالكامل على خادم الحاسوب. يمكنك حفظ أو تنزيل لقطات احتياطية فورية.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="flex items-center gap-2 rounded-2xl bg-[#FFD600] px-5 py-3 text-xs font-extrabold text-black hover:bg-yellow-300 shadow-lg shadow-yellow-500/10"
        >
          <Plus size={18} /> {isCreating ? 'جاري إنشاء النسخة...' : 'إنشاء نسخة احتياطية الآن'}
        </button>
      </div>

      <div className="rounded-3xl border border-gray-800 bg-[#181818] p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-300">سجل النسخ الاحتياطية المحفوظة في /backups ({backups.length})</h3>

        <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
          {backups.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              لا توجد لقطات احتياطية محفوظة بعد. اضغط "إنشاء نسخة احتياطية الآن" لحفظ حالة الخادم الحالية.
            </div>
          ) : (
            backups.map((bk) => (
              <div key={bk.id} className="flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-900 p-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                    <Database size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-gray-200 block">{bk.filename}</span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      تاريخ الإنشاء: {new Date(bk.timestamp).toLocaleString('ar-EG')} • الحجم: {formatSize(bk.filesizeBytes)}
                    </span>
                  </div>
                </div>

                <span className="rounded-full bg-green-950/40 border border-green-800/40 text-green-400 font-bold px-3 py-1">
                  سليمة ومحفوظة
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
