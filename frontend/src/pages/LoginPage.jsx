import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import ArtacomLogo from '../components/ArtacomLogo';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen bg-surface font-body-lg text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Left side: Brand Area */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-[48px] text-on-primary">
        <div>
          <div className="font-display font-bold text-display tracking-tight text-white mb-xl">
            Artacom Finance
          </div>
          <h1 className="font-display text-[44px] leading-[52px] font-bold text-white max-w-[480px] mt-[100px]">
            Monitoring Layanan & Kewajiban Finance Terpadu.
          </h1>
          <p className="font-body-lg text-body-lg text-primary-fixed mt-md max-w-[420px]">
            Kelola seluruh kontrak layanan IT, jadwal jatuh tempo pembayaran provider, serta riwayat finansial perusahaan Anda secara terpusat, akurat, dan efisien.
          </p>
        </div>
        <div className="font-body-md text-body-md text-primary-fixed flex items-start">
          <span className="opacity-90">"Solusi visibilitas penuh untuk kontrol arus kas dan kepatuhan kewajiban finansial perusahaan." — Ops & Finance Lead</span>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-md bg-surface-container-lowest">
        <main className="w-full max-w-[420px] flex flex-col gap-lg">
          <header className="flex flex-col gap-sm pb-md">
            <div className="mb-md">
              <ArtacomLogo className="h-12 w-auto" dark={false} />
            </div>
            <h1 className="font-display text-display text-on-surface font-bold tracking-tight">
              Selamat datang kembali
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Masuk untuk melanjutkan ke portal Finance & Payment Monitoring.
            </p>
          </header>

          {error && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container font-body-md text-body-md border border-error/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="username">
                Username / Email
              </label>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow"
                  id="username"
                  name="username"
                  placeholder="admin"
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    className="peer appearance-none w-4 h-4 border border-outline-variant rounded bg-surface-container-lowest checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary-fixed focus:outline-none transition-colors cursor-pointer"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="material-symbols-outlined absolute text-[12px] text-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                    check
                  </span>
                </div>
                <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Ingat saya
                </span>
              </label>
            </div>

            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary font-label-md text-label-md font-semibold py-3 rounded-lg hover:bg-surface-tint active:bg-on-primary-fixed-variant transition-colors flex items-center justify-center mt-sm shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
              type="submit"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
