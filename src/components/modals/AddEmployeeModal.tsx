import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { EmployeePosition, UserRole } from '../../types';
import {
  X,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Briefcase,
  Shield,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const AddEmployeeModal: React.FC = () => {
  const { activeModal } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState<EmployeePosition>('Garson');
  const [role, setRole] = useState<UserRole>('employee');

  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{
    name: string;
    email: string;
    password: string;
    id: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'add_employee') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = store.registerEmployee({
      name,
      email,
      password,
      position,
      role,
      phone,
    });

    if (!res.success) {
      setError(res.error || 'Çalışan kaydedilemedi.');
      haptics.alert();
      return;
    }

    haptics.success();
    if (res.user) {
      setCreatedUser({
        name: res.user.name,
        email: res.user.email,
        password,
        id: res.user.id,
      });
    }
  };

  const handleCopyCredentials = () => {
    if (!createdUser) return;
    const text = `CETEM Flow Giriş Bilgileriniz:\nE-posta: ${createdUser.email}\nŞifre: ${createdUser.password}\nUygulamaya girip vardiyanızı başlatabilirsiniz.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    haptics.success();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchToNewUser = () => {
    if (!createdUser) return;
    haptics.tap();
    store.closeModal();
    // Switch to the newly created employee so the presenter can immediately show the employee's perspective
    store.switchUser(createdUser.id);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl glass-panel-elevated border border-white/15 p-5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D8FF4F]/10 border border-[#D8FF4F]/25 text-[#D8FF4F]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Yeni Çalışan Kaydet</h3>
              <p className="text-[10px] text-[#8E98A8]">
                Restoran kadrosuna yeni personel ekleyin
              </p>
            </div>
          </div>
          <button
            onClick={() => store.closeModal()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {createdUser ? (
          /* Success Screen */
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Çalışan Başarıyla Eklendi!</h4>
                <p className="text-xs text-emerald-300 mt-0.5 font-medium">
                  "{createdUser.name}" sisteme kaydedildi.
                </p>
              </div>
              <p className="text-[11px] text-[#8E98A8]">
                Bu çalışan artık belirlediğiniz e-posta ve şifre ile sisteme anında giriş yapabilir.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-[10px] uppercase font-sans text-zinc-500">Giriş E-postası:</span>
                <span className="font-bold text-white">{createdUser.email}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-[10px] uppercase font-sans text-zinc-500">Giriş Şifresi:</span>
                <span className="font-bold text-[#D8FF4F]">{createdUser.password}</span>
              </div>
            </div>

            {/* Actions (2x padding: py-2.5 px-5, py-2 px-4) */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleCopyCredentials}
                className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Bilgiler Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Giriş Bilgilerini Kopyala (WhatsApp / SMS)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSwitchToNewUser}
                className="w-full py-2.5 px-5 rounded-xl bg-[#D8FF4F] hover:bg-[#cbf738] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#D8FF4F]/20 transition-all cursor-pointer"
              >
                <span>Hemen Bu Çalışan Olarak Giriş Yap</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={() => store.closeModal()}
                className="w-full py-2 text-center text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Kapat ve Yönetici Paneline Dön
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="py-3 space-y-3">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Ad Soyad */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Personel Adı Soyadı *</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Barış Yıldız"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#D8FF4F]"
                />
              </div>
            </div>

            {/* E-posta */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Giriş E-postası *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="baris@restoran.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#D8FF4F]"
                />
              </div>
            </div>

            {/* Şifre */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-300">
                <label className="font-medium">Giriş Şifresi *</label>
                <span className="text-[10px] text-[#D8FF4F] font-mono">Varsayılan: 123456</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white font-mono placeholder:text-zinc-600 outline-none focus:border-[#D8FF4F]"
                />
              </div>
            </div>

            {/* Pozisyon ve Yetki Rolü */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">Pozisyon</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as EmployeePosition)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#0D1016] border border-white/10 text-xs text-white outline-none focus:border-[#D8FF4F]"
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
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#0D1016] border border-white/10 text-xs text-white outline-none focus:border-[#D8FF4F]"
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

            {/* Telefon */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300">Telefon Numarası</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 555 123 4567"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#D8FF4F]"
                />
              </div>
            </div>

            {/* Submit (2x padding: py-2.5 px-5) */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-5 rounded-xl bg-[#D8FF4F] hover:bg-[#cbf738] active:scale-[0.98] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#D8FF4F]/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Çalışanı Sisteme Kaydet</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
