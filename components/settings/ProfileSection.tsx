// components/settings/ProfileSection.tsx
"use client";

import { useState, useEffect } from "react";
import { User, Mail, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/firebase/firestore";

export default function ProfileSection() {
    const { user, userProfile, refreshProfile } = useAuth();

    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (userProfile?.name) setName(userProfile.name);
    }, [userProfile]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!name.trim()) {
            setErrorMessage("Nama tidak boleh kosong.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            // Update Firebase Auth displayName
            await updateProfile(user, { displayName: name.trim() });

            // Update Firestore user document
            await updateUserProfile(user.uid, { name: name.trim() });

            // Refresh AuthContext profile
            await refreshProfile();

            toast.success("Profil berhasil diupdate! ✅", {
                description: `Halo, ${name}!`,
            });
        } catch (err: any) {
            console.error("[SpendWise] Update profile error:", err);
            setErrorMessage("Gagal menyimpan. Silakan coba lagi.");
            toast.error("Gagal update profil");
        } finally {
            setIsLoading(false);
        }
    };

    const initial = userProfile?.name?.charAt(0).toUpperCase() || "U";

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.4)] flex-shrink-0">
                    <span className="text-white text-3xl font-bold">{initial}</span>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-1">
                        {userProfile?.name || "User"}
                    </p>
                    <p className="text-xs text-[#94A3B8] truncate">
                        {userProfile?.email}
                    </p>
                    <p className="text-[10px] text-[#94A3B8]/70 mt-1">
                        Avatar otomatis dari inisial nama Anda
                    </p>
                </div>
            </div>

            {/* Name */}
            <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={12} />
                    Nama Lengkap
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    maxLength={50}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                />
            </div>

            {/* Email (readonly) */}
            <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={12} />
                    Email
                </label>
                <input
                    type="email"
                    value={userProfile?.email || ""}
                    disabled
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900/30 border border-white/5 text-[#94A3B8] cursor-not-allowed"
                />
                <p className="text-[10px] text-[#94A3B8]/70 mt-1.5">
                    Email tidak dapat diubah. Hubungi support jika perlu perubahan.
                </p>
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
                disabled={isLoading || name.trim() === userProfile?.name}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm transition-all duration-300 ${
                    isLoading || name.trim() === userProfile?.name
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                }`}
            >
                {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                ) : (
                    <><Check size={16} /> Save Changes</>
                )}
            </button>
        </form>
    );
}