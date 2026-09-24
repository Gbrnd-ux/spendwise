// app/forgot-password/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Wallet, Loader2, ArrowLeft, Mail, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

// ===== KONFIGURASI ANTI-SPAM =====
const RESEND_COOLDOWN = 60;             // Detik cooldown antar kirim
const MAX_ATTEMPTS = 3;                 // Maks. kirim dalam jendela waktu
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // Jendela waktu: 15 menit (ms)
const STORAGE_KEY = "spendwise_reset_attempts";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [attempts, setAttempts] = useState(0);

    // Ref untuk nilai yang selalu fresh (menghindari stale closure)
    const isSubmittingRef = useRef(false);

    // ===== LOAD ATTEMPTS DARI LOCALSTORAGE SAAT MOUNT =====
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                const elapsed = Date.now() - parsed.timestamp;

                // Reset jika sudah lewat jendela waktu 15 menit
                if (elapsed > ATTEMPT_WINDOW_MS) {
                    localStorage.removeItem(STORAGE_KEY);
                    setAttempts(0);
                } else {
                    setAttempts(parsed.count);
                    // Sisa cooldown dari percobaan terakhir
                    const cooldownLeft = Math.max(0, Math.ceil((RESEND_COOLDOWN * 1000 - elapsed) / 1000));
                    if (cooldownLeft > 0) setCountdown(cooldownLeft);
                }
            }
        } catch (err) {
            console.warn("[SpendWise] Gagal load attempts:", err);
        }
    }, []);

    // ===== COUNTDOWN TIMER =====
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // ===== SIMPAN ATTEMPTS KE LOCALSTORAGE =====
    const persistAttempts = (newCount: number) => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ count: newCount, timestamp: Date.now() })
            );
        } catch (err) {
            console.warn("[SpendWise] Gagal simpan attempts:", err);
        }
    };

    // ===== VALIDASI EMAIL =====
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // ===== HANDLE SUBMIT =====
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmittingRef.current) return; // Cegah double-submit

        // Cek batas percobaan (menggunakan state terbaru)
        if (attempts >= MAX_ATTEMPTS) {
            setHasError(true);
            setErrorMessage(
                `Anda telah mencapai batas maksimum (${MAX_ATTEMPTS}x) dalam 15 menit. Silakan coba lagi nanti.`
            );
            return;
        }

        // Validasi format email
        if (!isValidEmail(email)) {
            setHasError(true);
            setErrorMessage("Format email tidak valid. Pastikan format: nama@domain.com");
            return;
        }

        isSubmittingRef.current = true;
        setIsLoading(true);
        setHasError(false);
        setErrorMessage("");

        try {
            await sendPasswordResetEmail(auth, email);

            // Update attempts dan persist ke localStorage
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            persistAttempts(newAttempts);

            setIsSuccess(true);
            setCountdown(RESEND_COOLDOWN);

            console.log(`[SpendWise] Email reset terkirim ke: ${email}`);
            console.log(`[SpendWise] Percobaan: ${newAttempts}/${MAX_ATTEMPTS}`);
        } catch (error: any) {
            console.error("[SpendWise] Error:", error.code, error.message);
            setHasError(true);

            switch (error.code) {
                case "auth/user-not-found":
                    // Anti enumeration: tetap tampilkan sukses
                    const newAttempts = attempts + 1;
                    setAttempts(newAttempts);
                    persistAttempts(newAttempts);
                    setIsSuccess(true);
                    setCountdown(RESEND_COOLDOWN);
                    break;

                case "auth/invalid-email":
                    setErrorMessage("Format email tidak valid.");
                    break;

                case "auth/too-many-requests":
                    setErrorMessage(
                        "Terlalu banyak permintaan dari jaringan ini. Silakan coba lagi dalam 15-30 menit."
                    );
                    setCountdown(300); // Lock 5 menit
                    break;

                case "auth/network-request-failed":
                    setErrorMessage("Koneksi internet bermasalah. Periksa jaringan Anda.");
                    break;

                default:
                    setErrorMessage("Gagal mengirim email. Silakan coba lagi dalam beberapa saat.");
            }
        } finally {
            setIsLoading(false);
            isSubmittingRef.current = false;
        }
    };

    // ===== HANDLE RESEND =====
    const handleResend = async () => {
        if (countdown > 0 || attempts >= MAX_ATTEMPTS || isSubmittingRef.current) return;
        // Buat fake event untuk trigger handleSubmit
        const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
        await handleSubmit(fakeEvent);
    };

    // ===== HITUNG SISA PERCOBAAN =====
    const remainingAttempts = MAX_ATTEMPTS - attempts;

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

            {/* Card */}
            <div
                className={`relative z-10 w-full max-w-md p-8 rounded-3xl bg-[#1E293B]/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-fade-in-up ${hasError ? "animate-shake border-rose-500/50" : ""
                    }`}
            >
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${isSuccess
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                            : "bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                            }`}
                    >
                        {isSuccess ? (
                            <CheckCircle2 size={32} className="text-white animate-fade-in-up" />
                        ) : (
                            <Mail size={32} className="text-white" />
                        )}
                    </div>
                </div>

                {isSuccess ? (
                    // ===== SUCCESS STATE =====
                    <div className="text-center animate-fade-in-up">
                        <h1 className="text-3xl font-extrabold text-white mb-2">Check your email</h1>
                        <p className="text-sm text-[#94A3B8] mb-3">
                            Kami telah mengirim link reset password ke:
                        </p>
                        <p className="text-sm font-semibold text-white mb-6 bg-slate-900/60 rounded-lg py-2.5 px-4 inline-block break-all">
                            {email}
                        </p>

                        {/* Info Box */}
                        <div className="text-left bg-[#0B1120]/60 border border-white/5 rounded-xl p-4 mb-6">
                            <p className="text-xs text-[#94A3B8] font-semibold mb-2 uppercase tracking-wider">
                                Tidak menerima email?
                            </p>
                            <ul className="text-xs text-[#94A3B8] space-y-1.5">
                                <li>• Cek folder <span className="text-white font-medium">Spam</span> atau <span className="text-white font-medium">Promosi</span>.</li>
                                <li>• Pastikan email <span className="text-white font-medium">tidak typo</span>.</li>
                                <li>• Tunggu beberapa menit, email bisa delay.</li>
                                <li>• Link berlaku selama <span className="text-white font-medium">1 jam</span>.</li>
                            </ul>
                        </div>

                        {/* Resend Section */}
                        <div className="mb-6 space-y-3">
                            {/* Info Sisa Percobaan */}
                            {remainingAttempts > 0 && attempts < MAX_ATTEMPTS && (
                                <div className="text-xs text-[#94A3B8]">
                                    Sisa kirim ulang: <span className="font-bold text-white">{remainingAttempts}</span> dari {MAX_ATTEMPTS} (jendela 15 menit)
                                </div>
                            )}

                            {attempts >= MAX_ATTEMPTS ? (
                                <div className="flex items-center justify-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 animate-fade-in-up">
                                    <AlertCircle size={14} className="flex-shrink-0" />
                                    <span className="font-semibold">Batas maksimum tercapai. Tunggu 15 menit lagi.</span>
                                </div>
                            ) : countdown > 0 ? (
                                <div className="flex items-center justify-center gap-2 text-xs text-[#94A3B8] bg-slate-900/60 rounded-lg px-4 py-3">
                                    <Clock size={14} className="animate-pulse" />
                                    <span>
                                        Kirim ulang dalam <span className="font-bold text-white">{countdown}s</span>
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleResend}
                                    disabled={isLoading}
                                    className="w-full text-sm text-[#8B5CF6] hover:text-[#A78BFA] font-semibold transition-colors duration-200 hover:underline"
                                >
                                    Kirim ulang email
                                </button>
                            )}
                        </div>

                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white font-medium transition-colors duration-200"
                        >
                            <ArrowLeft size={16} />
                            Back to login
                        </Link>
                    </div>
                ) : (
                    // ===== FORM STATE =====
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-extrabold text-white mb-2">Forgot password?</h1>
                            <p className="text-sm text-[#94A3B8]">
                                Enter your email and we'll send you a reset link
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Input */}
                            <div>
                                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="alexander@premium.com"
                                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all duration-300 disabled:opacity-50"
                                />
                            </div>

                            {/* Error Message */}
                            {hasError && (
                                <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 animate-fade-in-up flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Info Box */}
                            <div className="text-xs text-[#94A3B8] bg-[#0B1120]/60 border border-white/5 rounded-xl px-4 py-3">
                                💡 Link reset password berlaku selama <span className="text-white font-medium">1 jam</span>.
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || attempts >= MAX_ATTEMPTS}
                                className={`w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${isLoading || attempts >= MAX_ATTEMPTS
                                    ? "opacity-60 cursor-not-allowed"
                                    : "hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98]"
                                    }`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Sending link...
                                    </>
                                ) : attempts >= MAX_ATTEMPTS ? (
                                    "Terlalu Banyak Percobaan"
                                ) : (
                                    "Send Reset Link"
                                )}
                            </button>
                        </form>

                        {/* Back to Login */}
                        <div className="text-center mt-8">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white font-medium transition-colors duration-200"
                            >
                                <ArrowLeft size={16} />
                                Back to login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}