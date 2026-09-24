// components/settings/SecuritySection.tsx
"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Loader2, Check, Shield } from "lucide-react";
import { toast } from "sonner";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";

export default function SecuritySection() {
    const { user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Check apakah user login dengan Google (tidak punya password)
    const isGoogleOnly = user?.providerData.every((p) => p.providerId === "google.com");

    // Password strength
    const passwordChecks = {
        minLength: newPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
    };
    const strength = Object.values(passwordChecks).filter(Boolean).length;
    const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email) return;

        if (!currentPassword) {
            setErrorMessage("Masukkan password saat ini.");
            return;
        }
        if (strength < 3) {
            setErrorMessage("Password baru terlalu lemah. Gunakan min. 8 karakter dengan huruf besar dan angka.");
            return;
        }
        if (!passwordsMatch) {
            setErrorMessage("Konfirmasi password tidak cocok.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            // Re-authenticate dulu untuk keamanan
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            toast.success("Password berhasil diubah! 🔒", {
                description: "Gunakan password baru untuk login berikutnya.",
            });

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            console.error("[SpendWise] Update password error:", err);
            if (err.code === "auth/wrong-password") {
                setErrorMessage("Password saat ini salah.");
            } else if (err.code === "auth/weak-password") {
                setErrorMessage("Password baru terlalu lemah.");
            } else if (err.code === "auth/requires-recent-login") {
                setErrorMessage("Sesi Anda sudah lama. Silakan login ulang.");
            } else {
                setErrorMessage("Gagal mengubah password. Silakan coba lagi.");
            }
            toast.error("Gagal mengubah password");
        } finally {
            setIsLoading(false);
        }
    };

    // Kalau user Google-only
    if (isGoogleOnly) {
        return (
            <div className="space-y-4">
                <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                        <Shield size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-300 mb-1">
                                Login dengan Google
                            </p>
                            <p className="text-xs text-blue-300/80 leading-relaxed">
                                Akun Anda menggunakan Google Sign-In. Untuk mengubah password, silakan kelola melalui akun Google Anda.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Info */}
            <div className="p-4 rounded-xl bg-[#0B1120]/60 border border-white/5">
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                    🔐 Untuk keamanan, kami perlu memverifikasi password saat ini sebelum mengubahnya.
                </p>
            </div>

            {/* Current Password */}
            <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                    Password Saat Ini
                </label>
                <div className="relative">
                    <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Password saat ini"
                        className="w-full px-4 py-3.5 pr-12 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors"
                    >
                        {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {/* New Password */}
            <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                    Password Baru
                </label>
                <div className="relative">
                    <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 karakter"
                        className="w-full px-4 py-3.5 pr-12 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors"
                    >
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {/* Strength Meter */}
                {newPassword && (
                    <div className="mt-3">
                        <div className="flex gap-1 mb-2">
                            {[1, 2, 3].map((lvl) => (
                                <div
                                    key={lvl}
                                    className={`h-1 flex-1 rounded-full transition-all ${
                                        lvl <= strength
                                            ? strength === 3 ? "bg-emerald-500" : strength === 2 ? "bg-amber-500" : "bg-rose-500"
                                            : "bg-white/10"
                                    }`}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                { label: "Min. 8 karakter", check: passwordChecks.minLength },
                                { label: "Huruf besar", check: passwordChecks.hasUpperCase },
                                { label: "Angka", check: passwordChecks.hasNumber },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-1 text-[10px]">
                                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                        item.check ? "bg-emerald-500" : "bg-white/10"
                                    }`}>
                                        {item.check && <Check size={8} className="text-white" />}
                                    </div>
                                    <span className={item.check ? "text-emerald-400" : "text-[#94A3B8]"}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm New Password */}
            <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                    Konfirmasi Password Baru
                </label>
                <div className="relative">
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        className={`w-full px-4 py-3.5 pr-12 rounded-xl bg-slate-900/60 border text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                            confirmPassword && !passwordsMatch
                                ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500"
                                : "border-white/10 focus:border-[#8B5CF6] focus:ring-[#8B5CF6]"
                        }`}
                    />
                    {confirmPassword && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {passwordsMatch ? (
                                <Check size={18} className="text-emerald-500" />
                            ) : (
                                <span className="text-rose-500 text-xs">✕</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Error */}
            {errorMessage && (
                <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2.5">
                    {errorMessage}
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading || !currentPassword || !newPassword || !passwordsMatch}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm transition-all duration-300 ${
                    isLoading || !currentPassword || !newPassword || !passwordsMatch
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                }`}
            >
                {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Mengubah...</>
                ) : (
                    <><Lock size={16} /> Change Password</>
                )}
            </button>
        </form>
    );
}