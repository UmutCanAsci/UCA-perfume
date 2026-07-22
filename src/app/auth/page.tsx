"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useScentSphere } from "@/components/ScentSphereContext";

export default function AuthPage() {
  const { handleLogin, handleSignUp, activeUser, dict, language } = useScentSphere();
  const router = useRouter();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!username.trim() || !password) {
      setErrorMsg(language === "tr" ? "Lütfen kullanıcı adı ve şifrenizi girin." : "Please enter both username and password.");
      return;
    }

    if (!isLoginMode && !email.trim()) {
      setErrorMsg(language === "tr" ? "Lütfen e-posta adresinizi girin." : "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        // ── Login: verify credentials against the database ──
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernameOrEmail: username.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || (language === "tr" ? "Giriş başarısız." : "Login failed."));
        }
        // Sync to the in-memory context so the rest of the UI reflects the logged-in state
        handleLogin(username.trim(), password, data.user);
        setSuccessMsg(language === "tr" ? "Başarıyla giriş yapıldı!" : "Logged in successfully!");
        setTimeout(() => { router.push("/profile"); }, 1000);
      } else {
        // ── Sign-up: persist new user to MySQL ──
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || (language === "tr" ? "Kayıt başarısız." : "Sign-up failed."));
        }
        // Bootstrap the in-memory context with the newly created profile
        handleSignUp(username.trim(), password, email.trim(), data.user);
        setSuccessMsg(language === "tr" ? "Kayıt olundu ve giriş yapıldı!" : "Signed up and logged in successfully!");
        setTimeout(() => { router.push("/profile"); }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || (language === "tr" ? "Kimlik doğrulama sırasında bir hata oluştu." : "An error occurred during authentication."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#f5f0e6] font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 brightness-[0.2]"
          src="/assets/consultant-bg.mp4"
        />
        {/* Dark luxury overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F10] via-transparent to-[#0F0F10]/80" />
      </div>

      <div className="w-full max-w-sm backdrop-blur-md bg-white/[0.02] border border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-8 rounded-sm relative z-10">
        <div className="text-center mb-6">
          <Link href="/" className="font-serif text-2xl tracking-[0.2em] gold-gradient-text uppercase font-bold block mb-2">
            {dict.hero.title}
          </Link>
          <span className="text-[10px] tracking-widest text-[#c5a880] uppercase block">
            {dict.auth.vault}
          </span>
        </div>

        <h2 className="font-serif text-lg text-white font-semibold text-center mb-4">
          {isLoginMode ? dict.auth.loginTitle : dict.auth.registerTitle}
        </h2>

        {errorMsg && (
          <div className="p-3 bg-red-950/20 border border-red-800/40 text-red-400 text-xs rounded-sm mb-4 text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-950/20 border border-green-800/40 text-green-400 text-xs rounded-sm mb-4 text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[9px] tracking-widest text-[#f5f0e6]/50 uppercase block mb-1">
              {dict.auth.userLabel}
            </label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={dict.auth.userPlaceholder}
              disabled={loading}
              className="w-full border-b border-white/[0.1] bg-transparent rounded-none py-2 px-1 text-xs text-[#f5f0e6] placeholder-[#f5f0e6]/30 focus:border-[#D4AF37] focus:outline-none transition-all disabled:opacity-50"
            />
          </div>

          {/* Email field — only shown in sign-up mode */}
          {!isLoginMode && (
            <div>
              <label className="text-[9px] tracking-widest text-[#f5f0e6]/50 uppercase block mb-1">
                {language === "tr" ? "E-posta" : "Email"}
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === "tr" ? "ornek@eposta.com" : "your@email.com"}
                disabled={loading}
                className="w-full border-b border-white/[0.1] bg-transparent rounded-none py-2 px-1 text-xs text-[#f5f0e6] placeholder-[#f5f0e6]/30 focus:border-[#D4AF37] focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
          )}

          <div>
            <label className="text-[9px] tracking-widest text-[#f5f0e6]/50 uppercase block mb-1">
              {dict.auth.passLabel}
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={dict.auth.passPlaceholder}
              disabled={loading}
              className="w-full border-b border-white/[0.1] bg-transparent rounded-none py-2 px-1 text-xs text-[#f5f0e6] placeholder-[#f5f0e6]/30 focus:border-[#D4AF37] focus:outline-none transition-all disabled:opacity-50"
            />
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-transparent hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#0F0F10] border border-[#D4AF37]/50 hover:border-[#D4AF37] text-xs font-semibold tracking-[0.2em] uppercase rounded-none transition-all duration-300 cursor-pointer mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? (language === "tr" ? "İşleniyor..." : "Processing...")
              : (isLoginMode ? dict.auth.btnAuth : dict.auth.btnEstablish)}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrorMsg("");
              setSuccessMsg("");
              setEmail("");
            }}
            className="text-[10px] tracking-wider uppercase text-[#c5a880] hover:text-[#e5cda8] font-semibold cursor-pointer"
          >
            {isLoginMode ? dict.auth.switchRegister : dict.auth.switchLogin}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-[9px] tracking-widest text-[#f5f0e6]/40 hover:text-white uppercase">
            {dict.auth.cancel}
          </Link>
        </div>
      </div>
    </div>
  )
}
