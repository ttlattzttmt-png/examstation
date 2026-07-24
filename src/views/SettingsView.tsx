/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Shield, Server, Check, Palette, Clock } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [platformName, setPlatformName] = useState('البشمهندس');
  const [platformNameAr, setPlatformNameAr] = useState('منصة البشمهندس لإدارة الامتحانات الرقمية');
  const [maxWarnings, setMaxWarnings] = useState(3);
  const [defaultDuration, setDefaultDuration] = useState(45);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="rounded-3xl border border-gray-800 bg-[#181818] p-6">
        <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2 mb-1">
          <Settings size={28} /> إعدادات الخادم والمنصة
        </h2>
        <p className="text-xs text-gray-400">تخصيص قواعد الأمان وافتراضيات الاختبارات وشكل المنصة المحلي.</p>
      </div>

      {saved && (
        <div className="rounded-2xl bg-green-950/60 p-4 border border-green-800/60 text-xs font-bold text-green-300 flex items-center gap-2">
          <Check size={18} /> تم حفظ الإعدادات بنجاح في قاعدة بيانات الخادم
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-gray-800 bg-[#181818] p-6 space-y-4">
          <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
            <Palette size={18} /> هويات الخادم والعلامة التجارية
          </h3>

          <div className="space-y-3 text-xs font-semibold">
            <div>
              <label className="block text-gray-300 mb-1">اسم المنصة المختصر</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full rounded-2xl bg-gray-900 p-3 text-white border border-gray-800 focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">اسم المنصة الكامل</label>
              <input
                type="text"
                value={platformNameAr}
                onChange={(e) => setPlatformNameAr(e.target.value)}
                className="w-full rounded-2xl bg-gray-900 p-3 text-white border border-gray-800 focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-[#181818] p-6 space-y-4">
          <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
            <Shield size={18} /> قواعد الأمان والتنبيهات
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-gray-300 mb-1">الحد الأقصى لمخالفات التحذير قبل التسليم التلقائي</label>
              <input
                type="number"
                value={maxWarnings}
                onChange={(e) => setMaxWarnings(Number(e.target.value))}
                min={1}
                max={10}
                className="w-full rounded-2xl bg-gray-900 p-3 text-white border border-gray-800 focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">المدة الافتراضية للامتحان (بالدقائق)</label>
              <input
                type="number"
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Number(e.target.value))}
                min={5}
                className="w-full rounded-2xl bg-gray-900 p-3 text-white border border-gray-800 focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-2xl bg-[#FFD600] px-8 py-3.5 text-xs font-extrabold text-black hover:bg-yellow-300 shadow-lg shadow-yellow-500/20"
          >
            حفظ الإعدادات
          </button>
        </div>
      </form>
    </div>
  );
};
