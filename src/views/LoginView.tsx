/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, Lock, UserCheck, ShieldCheck, ArrowRight, UserPlus, Phone, Check } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login Form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register Form
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGrade, setRegGrade] = useState('الصف الثالث الثانوي');
  const [regPassword, setRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [netInfo, setNetInfo] = useState<{ hostIp: string; lanUrl: string } | null>(null);

  useEffect(() => {
    api.getNetworkInfo().then(setNetInfo).catch(console.error);
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const data = await api.login(identifier, password);
      login(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول، تأكد من صحة رقم الهاتف وكلمة المرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regPhone.trim()) {
      setErrorMsg('يرجى كتابة رقم الهاتف، فهو إجباري لتسجيل الدخول مستقبلاً');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await api.registerStudent({
        fullName: regFullName,
        phone: regPhone.trim(),
        password: regPassword,
        grade: regGrade,
      });

      const generatedCode = data.user.studentId || data.user.username;
      setSuccessMsg(`تم إنشاء الحساب بنجاح! كود الطالب المولد تلقائياً هو: (${generatedCode}). جاري الدخول...`);
      setTimeout(() => {
        login(data.user, data.token);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0D0D0D] p-4 text-gray-100 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#FFD600]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#FFD600]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl space-y-4 relative z-10">
        <div className="rounded-3xl border border-white/10 bg-[#181818]/90 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFD600] font-black text-black text-3xl shadow-[0_0_20px_rgba(255,214,0,0.3)]">
              ب
            </div>
            <h2 className="text-2xl font-black text-[#FFD600] tracking-tight">البشمهندس</h2>
            <p className="text-xs text-white/50 font-semibold mt-1">منصة الامتحانات المحليّة الذكية (Offline LAN)</p>
          </div>

          {netInfo && (
            <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#FFD600]/10 p-3 border border-[#FFD600]/20 text-xs font-semibold text-[#FFD600]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD600] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD600]"></span>
                </span>
                <Wifi size={14} /> خادم متصل بالشبكة المحلية
              </div>
              <span className="font-mono">{netInfo.hostIp}:3000</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#0D0D0D] p-1.5 mb-6 border border-white/5 text-xs font-bold">
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`rounded-xl py-2.5 transition-all flex items-center justify-center gap-2 ${
                mode === 'login' ? 'bg-[#FFD600] text-black font-extrabold shadow-[0_0_15px_rgba(255,214,0,0.2)]' : 'text-white/50 hover:text-white'
              }`}
            >
              <UserCheck size={16} /> تسجيل الدخول برقم الهاتف
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`rounded-xl py-2.5 transition-all flex items-center justify-center gap-2 ${
                mode === 'register' ? 'bg-[#FFD600] text-black font-extrabold shadow-[0_0_15px_rgba(255,214,0,0.2)]' : 'text-white/50 hover:text-white'
              }`}
            >
              <UserPlus size={16} /> إنشاء حساب طالب جديد
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-500/10 p-3 border border-red-500/30 text-xs font-semibold text-red-400">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-xl bg-green-500/10 p-3 border border-green-500/30 text-xs font-semibold text-green-400 flex items-center gap-2">
              <Check size={16} /> {successMsg}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">
                  رقم الهاتف (أو اسم المستخدم / كود الطالب)
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute right-3.5 top-3.5 text-white/40" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="أدخل رقم الهاتف المسجل (مثال: 010...)"
                    required
                    className="w-full rounded-2xl bg-[#0D0D0D] pr-10 pl-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600]/40 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <Lock size={18} className="absolute right-3.5 top-3.5 text-white/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-2xl bg-[#0D0D0D] pr-10 pl-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600]/40 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD600] py-3.5 font-extrabold text-black hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(255,214,0,0.3)] text-sm mt-2"
              >
                {isSubmitting ? 'جاري التحقق...' : 'دخول المنصة الآن'} <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">الاسم بالكامل (اسم الطالب الثلاثي)</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="مثال: أحمد محمد علي"
                  required
                  className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-sm text-white placeholder-white/30 border border-white/10 focus:border-[#FFD600] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">
                    رقم الهاتف <span className="text-[#FFD600] font-black">(إجباري للدخول)</span>
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    required
                    className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-sm text-white placeholder-white/30 border border-white/10 focus:border-[#FFD600] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-sm text-white placeholder-white/30 border border-white/10 focus:border-[#FFD600] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">الصف / المرحلة الدراسية</label>
                <select
                  value={regGrade}
                  onChange={(e) => setRegGrade(e.target.value)}
                  className="w-full rounded-2xl bg-[#0D0D0D] px-4 py-2.5 text-sm text-white border border-white/10 focus:border-[#FFD600]"
                >
                  <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                  <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                </select>
                <span className="text-[10px] text-white/40 mt-1 block">
                  * سيتولّد كود الطالب (اسم المستخدم) تلقائياً من المنصة فور إنهاء التسجيل.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD600] py-3.5 font-extrabold text-black hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(255,214,0,0.3)] text-sm mt-3"
              >
                {isSubmitting ? 'جاري تسجيل الحساب...' : 'إنشاء الحساب والدخول فوراً'} <ArrowRight size={18} />
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 text-center text-[11px] text-white/40">
            <p className="flex items-center justify-center gap-1 font-semibold">
              <ShieldCheck size={14} className="text-[#FFD600]" /> بياناتك مشفّرة ومحفوظة بالكامل داخل جهاز الخادم المحلي (SQLite)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
