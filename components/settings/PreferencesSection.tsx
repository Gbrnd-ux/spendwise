// components/settings/PreferencesSection.tsx
"use client";

import { useState } from "react";
import { Check, Loader2, DollarSign, Palette } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/firebase/firestore";

const CURRENCIES = [
    { code: "IDR", symbol: "Rp", label: "Indonesian Rupiah", flag: "🇮🇩" },
    { code: "USD", symbol: "$", label: "US Dollar", flag: "🇺🇸" },
    { code: "SGD", symbol: "S$", label: "Singapore Dollar", flag: "🇸🇬" },
    { code: "MYR", symbol: "RM", label: "Malaysian Ringgit", flag: "🇲🇾" },
    { code: "EUR", symbol: "€", label: "Euro", flag: "🇪🇺" },
    { code: "GBP", symbol: "£", label: "British Pound", flag: "🇬🇧" },
];

export default function PreferencesSection() {
    const { user, userProfile, refreshProfile } = useAuth();
    const [selected, setSelected] = useState(userProfile?.currency || "IDR");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!user || selected === userProfile?.currency) return;

        setIsLoading(true);
        try {
            await updateUserProfile(user.uid, { currency: selected });
            await refreshProfile();
            toast.success("Mata uang berhasil diubah! 💱", {
                description: `Sekarang menggunakan ${selected}`,
            });
        } catch (err: any) {
            console.error("[SpendWise] Update currency error:", err);
            toast.error("Gagal mengubah mata uang");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Currency */}
            <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={12} />
                    Mata Uang Utama
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CURRENCIES.map((c) => {
                        const isActive = selected === c.code;
                        return (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => setSelected(c.code)}
                                className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 text-left ${
                                    isActive
                                        ? "border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                        : "border-white/10 bg-slate-900/60 hover:border-white/20"
                                }`}
                            >
                                <span className="text-2xl">{c.flag}</span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold ${isActive ? "text-white" : "text-[#94A3B8]"}`}>
                                        {c.code} {c.symbol}
                                    </p>
                                    <p className="text-xs text-[#94A3B8] truncate">{c.label}</p>
                                </div>
                                {isActive && (
                                    <div className="w-6 h-6 rounded-full bg-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                                        <Check size={14} className="text-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <p className="text-[10px] text-[#94A3B8]/70 mt-2">
                    💡 Mata uang ini akan digunakan untuk semua transaksi baru
                </p>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={isLoading || selected === userProfile?.currency}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm transition-all duration-300 ${
                    isLoading || selected === userProfile?.currency
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                }`}
            >
                {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                ) : (
                    <><Check size={16} /> Save Currency</>
                )}
            </button>
        </div>
    );
}