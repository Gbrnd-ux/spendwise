// app/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { loginWithGoogle } from "@/lib/firebase/auth";
import { createUserDocument } from "@/lib/firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // AUTO REDIRECT — begitu user terisi dari onAuthStateChanged
    useEffect(() => {
        if (!authLoading && user) {
            router.replace("/dashboard");
        }
    }, [user, authLoading, router]);

    // ===== PASSWORD VALIDATION LOGIC =====
    const passwordChecks = {
        minLength: formData.password.length >= 8,
        hasUpperCase: /[A-Z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSymbol: /[!@#$%^&*]/.test(formData.password),
    };

    const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;
    const passwordsMatch =
        formData.password === formData.confirmPassword && formData.confirmPassword !== "";

    const getStrengthColor = () => {
        if (passwordStrength <= 1) return "bg-rose-500";
        if (passwordStrength === 2) return "bg-amber-500";
        if (passwordStrength === 3) return "bg-yellow-400";
        return "bg-emerald-500";
    };

    const getStrengthText = () => {
        if (passwordStrength <= 1) return "Lemah";
        if (passwordStrength === 2) return "Sedang";
        if (passwordStrength === 3) return "Kuat";
        return "Sangat Kuat";
    };

    // ===== HANDLE SUBMIT EMAIL/PASSWORD =====
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setHasError(false);
        setErrorMessage("");

        if (!passwordsMatch) {
            setHasError(true);
            setErrorMessage("Password dan Confirm Password tidak cocok!");
            toast.error("Validasi gagal", {
                description: "Password dan Confirm Password tidak cocok.",
            });
            return;
        }
        if (passwordStrength < 3) {
            setHasError(true);
            setErrorMessage(
                "Password terlalu lemah. Gunakan min. 8 karakter dengan huruf besar, angka, dan simbol."
            );
            toast.error("Password terlalu lemah", {
                description: "Gunakan min. 8 karakter dengan huruf besar, angka, dan simbol.",
            });
            return;
        }
        if (!agreeTerms) {
            setHasError(true);
            setErrorMessage("Anda harus menyetujui Terms & Conditions.");
            toast.error("Terms & Conditions", {
                description: "Anda harus menyetujui syarat & ketentuan.",
            });
            return;
        }

        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            await updateProfile(userCredential.user, {
                displayName: formData.name,
            });

            // Buat dokumen user di Firestore (kalau belum ada)
            await createUserDocument(userCredential.user);

            toast.success("Akun berhasil dibuat! 🎉", {
                description: `Selamat datang, ${formData.name}!`,
                duration: 3500,
            });
            // router.replace dihandle oleh useEffect
        } catch (error: any) {
            setHasError(true);
            let msg = "Gagal membuat akun. Silakan coba lagi.";
            if (error.code === "auth/email-already-in-use") {
                msg = "Email sudah terdaftar. Silakan login.";
            } else if (error.code === "auth/weak-password") {
                msg = "Password terlalu lemah.";
            } else if (error.code === "auth/invalid-email") {
                msg = "Format email tidak valid.";
            }
            setErrorMessage(msg);
            toast.error("Pendaftaran gagal", {
                description: msg,
                duration: 4000,
            });
            setIsLoading(false);
        }
    };

    // ===== HANDLE GOOGLE SIGNUP =====
    const handleGoogleSignup = async () => {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage("");

        try {
            await loginWithGoogle();
            toast.success("Akun berhasil dibuat! 🎉", {
                description: "Berhasil mendaftar dengan Google",
                duration: 3500,
            });
            // router.replace dihandle oleh useEffect
        } catch (error: any) {
            setHasError(true);
            let msg = "Gagal mendaftar dengan Google. Silakan coba lagi.";
            if (error.message?.includes("sudah terdaftar dengan password")) {
                msg = error.message;
            } else if (error.code === "auth/popup-closed-by-user") {
                msg = "Proses dibatalkan.";
            } else if (error.code === "auth/popup-blocked") {
                msg = "Popup diblokir browser. Izinkan popup lalu coba lagi.";
            }
            setErrorMessage(msg);
            toast.error("Pendaftaran Google gagal", {
                description: msg,
                duration: 4000,
            });
            setIsLoading(false);
        }
    };

    // Loading screen selagi AuthContext cek session
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
                <Loader2 size={32} className="animate-spin text-[#8B5CF6]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0B1120] py-12">
            {/* Animated Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#6366F1] rounded-full mix-blend-screen filter blur-[180px] opacity-30 animate-float-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#8B5CF6] rounded-full mix-blend-screen filter blur-[180px] opacity-30 animate-float-reverse"></div>

            {/* Logo */}
            <div className="absolute top-8 left-8 flex items-center gap-2 z-10 animate-fade-in-up">
                <div className="w-9 h-9 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    <Wallet size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-wide">SpendWise</span>
            </div>

            {/* Register Card */}
            <div
                className={`relative z-10 w-full max-w-md p-8 rounded-3xl bg-[#1E293B]/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-fade-in-up ${
                    hasError ? "animate-shake border-rose-500/50" : ""
                }`}
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white mb-2">Create account</h1>
                    <p className="text-sm text-[#94A3B8]">Start your journey to smarter spending</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Alexander Pierce"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all duration-300"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                            Email address
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="alexander@premium.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all duration-300"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Min. 8 karakter"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all duration-300"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors duration-200"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Password Strength Meter */}
                        {formData.password && (
                            <div className="mt-3 animate-fade-in-up">
                                <div className="flex gap-1 mb-2">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                level <= passwordStrength ? getStrengthColor() : "bg-white/10"
                                            }`}
                                        ></div>
                                    ))}
                                </div>
                                <p className="text-xs text-[#94A3B8]">
                                    Kekuatan:{" "}
                                    <span className="font-semibold text-white">{getStrengthText()}</span>
                                </p>

                                {/* Checklist */}
                                <div className="grid grid-cols-2 gap-1.5 mt-3">
                                    {[
                                        { label: "Min. 8 karakter", check: passwordChecks.minLength },
                                        { label: "Huruf besar", check: passwordChecks.hasUpperCase },
                                        { label: "Angka", check: passwordChecks.hasNumber },
                                        { label: "Simbol (!@#$)", check: passwordChecks.hasSymbol },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-xs">
                                            {item.check ? (
                                                <Check size={12} className="text-emerald-500" />
                                            ) : (
                                                <X size={12} className="text-[#94A3B8]" />
                                            )}
                                            <span className={item.check ? "text-emerald-500" : "text-[#94A3B8]"}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Ulangi password"
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, confirmPassword: e.target.value })
                                }
                                className={`w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all duration-300 ${
                                    formData.confirmPassword && !passwordsMatch
                                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500"
                                        : "border-white/10 focus:border-[#8B5CF6] focus:ring-[#8B5CF6]"
                                }`}
                            />
                            {formData.confirmPassword && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {passwordsMatch ? (
                                        <Check size={18} className="text-emerald-500" />
                                    ) : (
                                        <X size={18} className="text-rose-500" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded border-white/20 bg-slate-900/60 accent-[#8B5CF6] cursor-pointer transition-all"
                        />
                        <label htmlFor="terms" className="text-sm text-[#94A3B8] cursor-pointer select-none">
                            I agree to the{" "}
                            <Link href="#" className="text-[#8B5CF6] hover:text-[#A78BFA] font-semibold transition-colors">
                                Terms & Conditions
                            </Link>{" "}
                            and{" "}
                            <Link href="#" className="text-[#8B5CF6] hover:text-[#A78BFA] font-semibold transition-colors">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    {/* Error Message */}
                    {hasError && (
                        <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2.5 animate-fade-in-up">
                            {errorMessage}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                            isLoading
                                ? "opacity-80 cursor-not-allowed animate-glow-pulse"
                                : "hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-7">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <span className="text-xs text-[#94A3B8]/70 font-medium uppercase tracking-wider">
                        or sign up with
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>

                {/* Google Button */}
                <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={isLoading}
                    className={`w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-300 ${
                        isLoading
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] active:scale-[0.99]"
                    }`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <p className="text-center text-sm text-[#94A3B8] mt-8">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-[#8B5CF6] hover:text-[#A78BFA] font-bold transition-colors duration-200"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}