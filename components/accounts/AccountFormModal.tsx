// components/accounts/AccountFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check, Banknote, Landmark, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { addAccount, updateAccount } from "@/lib/firebase/firestore";
import { Account, AccountType } from "@/lib/types";
import Modal from "@/components/ui/Modal";

interface Props {
    account: Account | null;   // null = mode tambah
    onClose: () => void;
    onSuccess?: () => void;
}

const ACCOUNT_TYPES: {
    value: AccountType;
    label: string;
    icon: any;
    color: string;
}[] = [
    { value: "cash", label: "Cash", icon: Banknote, color: "from-emerald-500 to-emerald-600" },
    { value: "bank", label: "Bank", icon: Landmark, color: "from-blue-500 to-blue-600" },
    { value: "ewallet", label: "E-Wallet", icon: Smartphone, color: "from-violet-500 to-violet-600" },
];

const COLORS = [
    "from-emerald-500 to-emerald-600",
    "from-blue-500 to-blue-600",
    "from-violet-500 to-violet-600",
    "from-rose-500 to-rose-600",
    "from-amber-500 to-amber-600",
    "from-cyan-500 to-cyan-600",
    "from-pink-500 to-pink-600",
    "from-indigo-500 to-indigo-600",
];

export default function AccountFormModal({ account, onClose, onSuccess }: Props) {
    const { user, userProfile } = useAuth();
    const { bumpDataVersion } = useModal();

    const isEdit = !!account;

    const [name, setName] = useState("");
    const [type, setType] = useState<AccountType>("cash");
    const [balance, setBalance] = useState("");
    const [color, setColor] = useState(COLORS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const currencySymbol = userProfile?.currency === "IDR" ? "Rp" : userProfile?.currency === "USD" ? "$" : "Rp";

    // Prefill kalau edit
    useEffect(() => {
        if (account) {
            setName(account.name);
            setType(account.type);
            setBalance(String(account.balance));
            setColor(account.color);
        } else {
            setName("");
            setType("cash");
            setBalance("");
            setColor(COLORS[0]);
        }
        setErrorMessage("");
    }, [account]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!name.trim()) {
            setErrorMessage("Nama akun wajib diisi.");
            return;
        }

        const balanceNum = parseFloat(balance);
        if (!isEdit && (isNaN(balanceNum) || balanceNum < 0)) {
            setErrorMessage("Saldo awal harus berupa angka positif.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            const typeData = ACCOUNT_TYPES.find((t) => t.value === type)!;

            if (isEdit && account) {
                // Update — hanya nama, type, color
                await updateAccount(user.uid, account.id, {
                    name: name.trim(),
                    type,
                    color,
                    icon: typeData.label,
                });

                toast.success("Akun berhasil diupdate!", {
                    description: `${name} • ${typeData.label}`,
                });
            } else {
                // Tambah baru
                await addAccount(user.uid, {
                    name: name.trim(),
                    type,
                    balance: balanceNum,
                    color,
                    icon: typeData.label,
                });

                toast.success("Akun berhasil dibuat! 🎉", {
                    description: `${name} • ${currencySymbol} ${balanceNum.toLocaleString("id-ID")}`,
                });
            }

            bumpDataVersion();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("[SpendWise] Account save error:", err);
            setErrorMessage(err.message || "Gagal menyimpan akun. Silakan coba lagi.");
            toast.error("Gagal menyimpan akun");
        } finally {
            setIsLoading(false);
        }
    };

 return (
    <Modal isOpen={true} onClose={onClose} maxWidth="md">
        <div>
               {/* Header */}
<div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {isEdit ? "Edit Account" : "Add Account"}
                        </h2>
                        <p className="text-xs text-[#94A3B8]">
                            {isEdit ? "Ubah detail akun" : "Tambah dompet baru"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Type */}
                    <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">
                            Jenis Akun
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {ACCOUNT_TYPES.map((t) => {
                                const Icon = t.icon;
                                const isSelected = type === t.value;
                                return (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setType(t.value)}
                                        className={`relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                                            isSelected
                                                ? "border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                                : "border-white/10 bg-slate-900/60 hover:border-white/20"
                                        }`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                                                <Check size={10} className="text-white" />
                                            </div>
                                        )}
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                                            <Icon size={16} className="text-white" />
                                        </div>
                                        <span className={`text-xs font-semibold ${isSelected ? "text-white" : "text-[#94A3B8]"}`}>
                                            {t.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                            Nama Akun
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: BCA, Dompet, GoPay"
                            className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                        />
                    </div>

                    {/* Balance — HANYA saat create */}
                    {!isEdit && (
                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                Saldo Saat Ini
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] font-semibold">
                                    {currencySymbol}
                                </span>
                                <input
                                    type="number"
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="any"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {isEdit && (
                        <div className="p-3 rounded-xl bg-[#0B1120]/60 border border-white/5">
                            <p className="text-xs text-[#94A3B8] mb-1">Saldo saat ini</p>
                            <p className="text-lg font-bold text-white">
                                {currencySymbol} {account?.balance.toLocaleString("id-ID")}
                            </p>
                            <p className="text-[10px] text-[#94A3B8]/70 mt-2">
                                💡 Saldo tidak bisa diubah manual. Gunakan transaksi atau transfer.
                            </p>
                        </div>
                    )}

                    {/* Color Picker */}
                    <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">
                            Warna
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`relative aspect-square rounded-xl bg-gradient-to-br ${c} transition-all duration-300 ${
                                        color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#1E293B]" : "hover:scale-110"
                                    }`}
                                >
                                    {color === c && (
                                        <Check size={14} className="absolute inset-0 m-auto text-white" />
                                    )}
                                </button>
                            ))}
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
                        disabled={isLoading}
                        className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                            isLoading
                                ? "opacity-80 cursor-not-allowed animate-glow-pulse"
                                : "hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                    >
                        {isLoading ? (
                            <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                        ) : (
                            <><Check size={18} /> {isEdit ? "Save Changes" : "Create Account"}</>
                        )}
                    </button>
            </form>
        </div>
    </Modal>
);
}