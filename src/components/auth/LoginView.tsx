import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { EmployeePosition, UserRole } from '../../types';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LogIn,
  CheckCircle2,
  Sparkles,
  UtensilsCrossed,
  ChefHat,
  Coffee,
  AlertCircle,
  HelpCircle,
  Clock,
  Phone,
  User,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const LoginView: React.FC = () => {
  const { users } = useAppStore();

  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPosition, setRegPosition] = useState<EmployeePosition>('Garson');
  const [regRole, setRegRole] = useState<UserRole>('employee');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const res = store.login(email, password);
      setIsSubmitting(false);
      if (!res.success) {
        setLoginError(res.error || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
        haptics.alert();
      }
    }, 250);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessMsg(null);

    const res = store.registerEmployee({
      name: regName,
      email: regEmail,
      password: regPassword,
      position: regPosition,
      role: regRole,
      phone: regPhone,
    });

    if (!res.success) {
      setRegError(res.error || 'Kayıt başarısız oldu.');
      haptics.alert();
      return;
    }

    haptics.success();
    setRegSuccessMsg(
      `"${regName}" sisteme başarıyla kaydedildi! Şimdi bu e-posta ve şifre ile giriş yapabilirsiniz.`
    );

    // Populate login fields and switch to login tab or auto-login
    setEmail(regEmail);
    setPassword(regPassword);

    setTimeout(() => {
      // Auto login as newly registered employee
      store.login(regEmail, regPassword);
    }, 900);
  };

  const positionOptions: EmployeePosition[] = [
    'Garson',
    'Komi',
    'Barista',
    'Mutfak',
    'Şef',
    'Kasiyer',
    'Temizlik',
    'Müdür',
  ];

  return (
    <div className="min-h-screen bg-[#07090D] text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-[#D8FF4F] selection:text-black">
      {/* Background Ambience Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-[#D8FF4F]/8 blur-[120px] rounded-full" />
        <div className="absolute -bottom-32 right-1/4 w-[450px] h-[350px] bg-blue-500/6 blur-[130px] rounded-full" />
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md mx-auto my-auto relative z-10 py-6">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 shadow-xl shadow-black/60 relative group">
            <div className="absolute inset-0 bg-[#D8FF4F]/20 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
            <UtensilsCrossed className="w-7 h-7 text-[#D8FF4F] relative z-10" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D8FF4F]/10 border border-[#D8FF4F]/20 text-[#D8FF4F] text-[11px] font-mono font-bold tracking-wide uppercase mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Restoran Operasyon Portalı</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              CETEM <span className="text-[#D8FF4F]">FLOW</span>
            </h1>
            <p className="text-xs text-[#8E98A8] max-w-xs mx-auto mt-1">
              Vardiya, kanıtlı görevler, arıza ve salon operasyonlarının merkezi yönetim platformu.
            </p>
          </div>
        </div>

        {/* Tab Switcher (Giriş Yap vs Yeni Çalışan Kaydet) */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/10 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setActiveMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'login'
                ? 'bg-[#D8FF4F] text-black shadow-md font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Giriş Yap</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setActiveMode('register');
              setRegError(null);
              setRegSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'register'
                ? 'bg-[#D8FF4F] text-black shadow-md font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Yeni Çalışan Ekle</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="p-5 rounded-2xl glass-card space-y-4">
          {activeMode === 'login' ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white tracking-tight">Sisteme Giriş Yapın</h2>
                <p className="text-[11px] text-[#8E98A8]">
                  Kayıtlı e-posta ve şifrenizle vardiyanıza veya yönetim paneline bağlanın.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{loginError}</p>
                    <p className="text-[10px] text-rose-400/80 mt-0.5">
                      Lütfen e-posta adresinizi ve şifrenizi kontrol edip tekrar deneyin.
                    </p>
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 flex items-center justify-between">
                  <span>E-posta Adresi</span>
                  <span className="text-[10px] text-zinc-500 font-mono">personel@cetemflow.com</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="personel@cetemflow.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#D8FF4F] focus:ring-1 focus:ring-[#D8FF4F] text-xs text-white placeholder:text-zinc-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-300">
                  <label className="font-medium">Şifre</label>
                  <span className="text-[10px] text-zinc-500 font-mono">Güvenli Giriş</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#D8FF4F] focus:ring-1 focus:ring-[#D8FF4F] text-xs text-white placeholder:text-zinc-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button (2x Padding ratio: py-2.5 px-5) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-5 rounded-xl bg-[#D8FF4F] hover:bg-[#cbf738] active:scale-[0.98] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#D8FF4F]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Giriş Yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <span>Giriş Yap</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white tracking-tight">Yeni Çalışan Kaydı</h2>
                <p className="text-[11px] text-[#8E98A8]">
                  Personelin adını, giriş mailini ve şifresini belirleyin. Kaydedilen çalışan hemen bu bilgilerle sisteme giriş yapabilir.
                </p>
              </div>

              {regSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <p className="font-semibold">{regSuccessMsg}</p>
                </div>
              )}

              {regError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <p className="font-semibold">{regError}</p>
                </div>
              )}

              {/* Ad Soyad */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">Personel Adı Soyadı</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Örn: Barış Yıldız"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#D8FF4F] text-xs text-white placeholder:text-zinc-600 outline-none"
                  />
                </div>
              </div>

              {/* E-posta */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">Giriş E-posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="baris@restoran.com"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#D8FF4F] text-xs text-white placeholder:text-zinc-600 outline-none"
                  />
                </div>
              </div>

              {/* Şifre */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300 flex justify-between">
                  <span>Giriş Şifresi</span>
                  <span className="text-[10px] text-zinc-500">En az 4 karakter</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#D8FF4F] text-xs text-white placeholder:text-zinc-600 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Pozisyon & Rol Seçimi */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-300">Pozisyon</label>
                  <select
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value as EmployeePosition)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D1016] border border-white/10 text-xs text-white outline-none focus:border-[#D8FF4F]"
                  >
                    {positionOptions.map((pos) => (
                      <option key={pos} value={pos} className="bg-[#0D1016] text-white">
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-300">Yetki Rolü</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D1016] border border-white/10 text-xs text-white outline-none focus:border-[#D8FF4F]"
                  >
                    <option value="employee" className="bg-[#0D1016] text-white">
                      Saha Personeli
                    </option>
                    <option value="supervisor" className="bg-[#0D1016] text-white">
                      Süpervizör
                    </option>
                    <option value="manager" className="bg-[#0D1016] text-white">
                      Yönetici / Müdür
                    </option>
                  </select>
                </div>
              </div>

              {/* Telefon (Opsiyonel) */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">Telefon (İsteğe Bağlı)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+90 555 123 4567"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#D8FF4F] text-xs text-white placeholder:text-zinc-600 outline-none"
                  />
                </div>
              </div>

              {/* Register Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-5 rounded-xl bg-[#D8FF4F] hover:bg-[#cbf738] active:scale-[0.98] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#D8FF4F]/20 transition-all cursor-pointer mt-2"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Çalışanı Kaydet ve Giriş Yap</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer Security / Info Banner */}
        <div className="mt-4 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#8E98A8]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Güvenli Restoran Operasyon Altyapısı</span>
          </div>
          <p className="text-[10px] text-zinc-600">
            Kayıtlı {users.length} personel hesabı mevcut · Çevrimdışı yerel depolama desteği
          </p>
        </div>
      </div>
    </div>
  );
};
