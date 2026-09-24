// app/onboarding/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addAccount, updateUserDocument } from "@/lib/firebase/firestore";
import { AccountType } from "@/lib/types";
import { toast } from "sonner";
import {
    Wallet,
    Banknote,
    Landmark,
    Smartphone,
    Check,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Sparkles,
    PartyPopper
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

// ===== KONFIGURASI ACCOUNT TYPES =====
const ACCOUNT_TYPES: {
    value: AccountType;
    label: string;
    icon: any;
    description: string;
    color: string;
}[] = [
        {
            value: "cash",
            label: "Cash",
            icon: Banknote,
            description: "Dompet fisik, uang tunai",
            color: "from-emerald-500 to-emerald-600"
        },
        {
            value: "bank",
            label: "Bank",
            icon: Landmark,
            description: "Rekening bank (BCA, Mandiri, dll)",
            color: "from-blue-500 to-blue-600"
        },
        {
            value: "ewallet",
            label: "E-Wallet",
            icon: Smartphone,
            description: "GoPay, OVO, Dana, dll",
            color: "from-violet-500 to-violet-600"
        },
    ];

const CURRENCIES = [
    { code: "IDR", symbol: "Rp", label: "Rupiah Indonesia" },
    { code: "USD", symbol: "$", label: "US Dollar" },
    { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
    { code: "MYR", symbol: "RM", label: "Malaysian Ringgit" },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { user, userProfile, refreshProfile } = useAuth();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Form data
    const [accountName, setAccountName] = useState("");
    const [accountType, setAccountType] = useState<AccountType>("cash");
    const [initialBalance, setInitialBalance] = useState("");
    const [currency, setCurrency] = useState("IDR");

    // Redirect jika sudah onboarded
    useEffect(() => {
        if (userProfile?.onboarded) {
            router.push("/dashboard");
        }
    }, [userProfile, router]);

    // Step 3: Simpan akun & selesaikan onboarding
    const handleFinish = async () => {
        if (!user) return;

        // Validasi
        if (!accountName.trim()) {
            setErrorMessage("Nama akun wajib diisi.");
            return;
        }
        const balanceNum = parseFloat(initialBalance);
        if (isNaN(balanceNum) || balanceNum < 0) {
            setErrorMessage("Saldo awal harus berupa angka positif.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            const selectedType = ACCOUNT_TYPES.find((t) => t.value === accountType)!;

            // 1. Simpan akun ke Firestore
            await addAccount(user.uid, {
                name: accountName.trim(),
                type: accountType,
                balance: balanceNum,
                icon: selectedType.label,
                color: selectedType.color,
            });

            // 2. Update user: set onboarded = true & currency
            await updateUserDocument(user.uid, {
                onboarded: true,
                currency: currency,
            });

            // 3. Refresh profil di context
            await refreshProfile();
            toast.success("Akun berhasil dibuat! 🎉", {
    description: `${accountName} • Rp ${balanceNum.toLocaleString("id-ID")}`,
    duration: 3500,
});
            // 4. Pindah ke step 4 (success)
            setStep(4);
        } catch (error: any) {
            console.error("[SpendWise] Onboarding error:", error);
            setErrorMessage("Gagal menyimpan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToDashboard = () => {
        router.push("/dashboard");
    };

    const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || "Rp";

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0B1120] py-12 px-4">
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

                {/* Progress Indicator */}
                {step < 4 && (
                    <div className="absolute top-8 right-8 flex items-center gap-2 z-10">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 rounded-full transition-all duration-500 ${s <= step
                                        ? "w-8 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
                                        : "w-4 bg-white/10"
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Card */}
                <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-[#1E293B]/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-fade-in-up">

                    {/* ============ STEP 1: WELCOME ============ */}
                    {step === 1 && (
                        <div className="text-center animate-fade-in-up">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                                    <Sparkles size={40} className="text-white" />
                                </div>
                            </div>

                            <h1 className="text-3xl font-extrabold text-white mb-3">
                                Welcome to SpendWise!
                            </h1>
                            <p className="text-[#94A3B8] mb-8 leading-relaxed">
                                Hi <span className="text-white font-semibold">{userProfile?.name || user?.displayName}</span>,
                                mari kita mulai dengan mengatur akun pertama Anda untuk mulai tracking keuangan.
                            </p>

                            <div className="text-left bg-[#0B1120]/60 border border-white/5 rounded-xl p-5 mb-8">
                                <p className="text-xs text-[#94A3B8] font-semibold mb-3 uppercase tracking-wider">
                                    Yang akan Anda lakukan:
                                </p>
                                <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                                    <li className="flex items-start gap-2">
                                        <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span>Setup akun pertama (Cash, Bank, atau E-Wallet)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span>Pilih mata uang utama</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span>Mulai catat transaksi harian</span>
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                Get Started
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* ============ STEP 2: SETUP ACCOUNT ============ */}
                    {step === 2 && (
                        <div className="animate-fade-in-up">
                            <div className="mb-6">
                                <p className="text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider mb-2">
                                    Langkah 1 dari 2
                                </p>
                                <h1 className="text-2xl font-extrabold text-white mb-2">
                                    Setup Akun Pertama
                                </h1>
                                <p className="text-sm text-[#94A3B8]">
                                    Pilih jenis akun dan masukkan saldo saat ini.
                                </p>
                            </div>

                            {/* Account Type Selector */}
                            <div className="mb-5">
                                <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">
                                    Jenis Akun
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ACCOUNT_TYPES.map((type) => {
                                        const Icon = type.icon;
                                        const isSelected = accountType === type.value;
                                        return (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setAccountType(type.value)}
                                                className={`relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${isSelected
                                                        ? "border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                                        : "border-white/10 bg-slate-900/60 hover:border-white/20"
                                                    }`}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                                                        <Check size={10} className="text-white" />
                                                    </div>
                                                )}
                                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                                                    <Icon size={16} className="text-white" />
                                                </div>
                                                <span className={`text-xs font-semibold ${isSelected ? "text-white" : "text-[#94A3B8]"}`}>
                                                    {type.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-[#94A3B8] mt-2">
                                    {ACCOUNT_TYPES.find((t) => t.value === accountType)?.description}
                                </p>
                            </div>

                            {/* Account Name */}
                            <div className="mb-5">
                                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                    Nama Akun
                                </label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    placeholder="Contoh: BCA, Dompet, GoPay"
                                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all duration-300"
                                />
                            </div>

                            {/* Initial Balance */}
                            <div className="mb-6">
                                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                    Saldo Saat Ini
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] font-semibold">
                                        {currencySymbol}
                                    </span>
                                    <input
                                        type="number"
                                        value={initialBalance}
                                        onChange={(e) => setInitialBalance(e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all duration-300"
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {errorMessage && (
                                <div className="mb-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2.5 animate-fade-in-up">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    disabled={isLoading}
                                    className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm transition-all duration-300 hover:bg-white/10 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!accountName.trim() || !initialBalance}
                                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ============ STEP 3: CURRENCY ============ */}
                    {step === 3 && (
                        <div className="animate-fade-in-up">
                            <div className="mb-6">
                                <p className="text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider mb-2">
                                    Langkah 2 dari 2
                                </p>
                                <h1 className="text-2xl font-extrabold text-white mb-2">
                                    Mata Uang Utama
                                </h1>
                                <p className="text-sm text-[#94A3B8]">
                                    Pilih mata uang yang akan digunakan untuk tracking.
                                </p>
                            </div>

                            {/* Currency Selector */}
                            <div className="space-y-2 mb-6">
                                {CURRENCIES.map((c) => (
                                    <button
                                        key={c.code}
                                        type="button"
                                        onClick={() => setCurrency(c.code)}
                                        className={`w-full p-4 rounded-xl border transition-all duration-300 flex items-center justify-between ${currency === c.code
                                                ? "border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                                : "border-white/10 bg-slate-900/60 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${currency === c.code
                                                    ? "bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white"
                                                    : "bg-white/5 text-[#94A3B8]"
                                                }`}>
                                                {c.symbol}
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-semibold ${currency === c.code ? "text-white" : "text-[#94A3B8]"}`}>
                                                    {c.code}
                                                </p>
                                                <p className="text-xs text-[#94A3B8]">{c.label}</p>
                                            </div>
                                        </div>
                                        {currency === c.code && (
                                            <div className="w-6 h-6 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                                                <Check size={14} className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="bg-[#0B1120]/60 border border-white/5 rounded-xl p-4 mb-6">
                                <p className="text-xs text-[#94A3B8] font-semibold mb-3 uppercase tracking-wider">
                                    Ringkasan
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[#94A3B8]">Akun</span>
                                        <span className="text-white font-semibold">{accountName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#94A3B8]">Jenis</span>
                                        <span className="text-white font-semibold">
                                            {ACCOUNT_TYPES.find((t) => t.value === accountType)?.label}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#94A3B8]">Saldo</span>
                                        <span className="text-emerald-400 font-semibold">
                                            {currencySymbol} {parseFloat(initialBalance || "0").toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Error */}
                            {errorMessage && (
                                <div className="mb-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2.5 animate-fade-in-up">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={isLoading}
                                    className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm transition-all duration-300 hover:bg-white/10 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </button>
                                <button
                                    onClick={handleFinish}
                                    disabled={isLoading}
                                    className={`flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${isLoading
                                            ? "opacity-80 cursor-not-allowed animate-glow-pulse"
                                            : "hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98]"
                                        }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            Finish Setup
                                            <Check size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ============ STEP 4: SUCCESS ============ */}
                    {step === 4 && (
                        <div className="text-center animate-fade-in-up">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-glow-pulse">
                                    <PartyPopper size={40} className="text-white" />
                                </div>
                            </div>

                            <h1 className="text-3xl font-extrabold text-white mb-3">
                                You're all set! 🎉
                            </h1>
                            <p className="text-[#94A3B8] mb-8 leading-relaxed">
                                Akun <span className="text-white font-semibold">{accountName}</span> berhasil dibuat dengan
                                saldo awal <span className="text-emerald-400 font-semibold">
                                    {currencySymbol} {parseFloat(initialBalance || "0").toLocaleString("id-ID")}
                                </span>.
                            </p>

                            <div className="bg-[#0B1120]/60 border border-white/5 rounded-xl p-4 mb-8 text-left">
                                <p className="text-xs text-[#94A3B8] font-semibold mb-3 uppercase tracking-wider">
                                    Selanjutnya apa?
                                </p>
                                <ul className="space-y-2 text-xs text-[#94A3B8]">
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500">→</span>
                                        <span>Catat transaksi harian untuk tracking</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500">→</span>
                                        <span>Set budget bulanan per kategori</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500">→</span>
                                        <span>Lihat laporan keuangan Anda</span>
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={handleGoToDashboard}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                Go to Dashboard
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}