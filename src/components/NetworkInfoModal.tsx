/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Wifi, Server, Users, X } from 'lucide-react';
import { api } from '../services/api';

interface NetworkInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkInfoModal: React.FC<NetworkInfoModalProps> = ({ isOpen, onClose }) => {
  const [netInfo, setNetInfo] = useState<{ hostIp: string; port: number; lanUrl: string; qrCodeDataUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getNetworkInfo().then(setNetInfo).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !netInfo) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(netInfo.lanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#181818]/95 backdrop-blur-2xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute left-4 top-4 rounded-xl bg-white/5 border border-white/10 p-2 text-white/50 hover:text-white transition-all">
          <X size={20} />
        </button>

        <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/20">
            <Wifi size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#FFD600]">اتصال الشبكة المحلية (LAN)</h3>
            <p className="text-xs text-white/50">امسح رمز QR أو انسخ الرابط لربط أجهزة الطلاب فوراً</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center my-4">
          {netInfo.qrCodeDataUrl ? (
            <div className="rounded-2xl border-2 border-[#FFD600]/30 bg-[#0D0D0D] p-4 shadow-[0_0_20px_rgba(255,214,0,0.15)]">
              <img src={netInfo.qrCodeDataUrl} alt="LAN QR Code" className="h-52 w-52 rounded-lg" />
            </div>
          ) : (
            <div className="flex h-52 w-52 items-center justify-center rounded-2xl bg-white/5 text-white/40">
              <QrCode size={64} />
            </div>
          )}
          <span className="mt-3 text-xs font-semibold text-white/50">افتح كاميرا الهاتف للربط المباشر بالشبكة</span>
        </div>

        <div className="mb-6 rounded-2xl bg-[#0D0D0D] p-4 border border-white/10">
          <label className="mb-1 block text-xs font-bold text-white/50">عنوان خادم الامتحانات المحلي (Host URL)</label>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-lg font-black text-[#FFD600]">{netInfo.lanUrl}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl bg-[#FFD600] px-4 py-2 text-sm font-extrabold text-black hover:bg-yellow-300 shadow-[0_0_15px_rgba(255,214,0,0.25)] transition-all"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'تم النسخ!' : 'نسخ العنوان'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 border border-white/5">
            <Server size={18} className="text-[#FFD600]" />
            <div>
              <p className="text-white/40">عنوان IP الخادم</p>
              <p className="font-mono font-bold text-white/90">{netInfo.hostIp}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 border border-white/5">
            <Users size={18} className="text-[#FFD600]" />
            <div>
              <p className="text-white/40">السعة التزامنية</p>
              <p className="font-bold text-white/90">300+ طالب محلي</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
