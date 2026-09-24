// components/accounts/TransferModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ArrowRightLeft, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { transferBetweenAccounts } from "@/lib/firebase/firestore";
import { Account } from "@/lib/types";
import Modal from "@/components/ui/Modal";

interface Props {
    accounts: Account[];
    defaultFromId?: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function TransferModal({ accounts, defaultFromId, onClose, onSuccess }: Props) {
    const { user, userProfile } = useAuth();
    const { bumpDataVersion } = useModal();

    const [fromId, setFromId] = useState(defaultFromId || accounts[0]?.id || "");
    const [toId, setToId] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const currencySymbol = userProfile?.currency === "IDR" ? "Rp" : userProfile?.currency === "USD" ? "$" : "Rp";

    const fromAccount = accounts.find((a) => a.id === fromId);
    const toAccount = accounts.find((a) => a.id === toId);

    // Auto-select tujuan pertama yang bukan sumber
    useEffect(() => {
        if (fromId) {
            const firstAvailable = accounts.find((a) => a.id !== fromId);
            if (firstAvailable && toId === fromId) {
                setToId(firstAvailable.id);
            }
        }
    }, [fromId, accounts, toId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setErrorMessage("Nominal harus berupa angka positif.");
            return;
        }
        if (!fromId || !toId) {
            setErrorMessage("Pilih akun asal dan tujuan.");
            return;
        }
        if (fromId === toId) {
            setErrorMessage("Akun asal dan tujuan tidak boleh sama.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            await transferBetweenAccounts(user.uid, {
                fromAccountId: fromId,
                toAccountId: toId,
                amount: amountNum,
                date: new Date(date),
                note: note.trim(),
            });

            toast.success("Transfer berhasil! 💸", {
                description: `${currencySymbol} ${amountNum.toLocaleString("id-ID")} • ${fromAccount?.name} → ${toAccount?.name}`,
            });

            bumpDataVersion();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("[SpendWise] Transfer error:", err);
            setErrorMessage(err.message || "Gagal transfer. Silakan coba lagi.");
            toast.error("Transfer gagal", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const hasAccounts = accounts.length >= 2;

return (
    <Modal isOpen={true} onClose={onClose} maxWidth="md">
        <div>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Transfer</h2>
                        <p className="text-xs text-[#94A3B8]">Pindahkan saldo antar akun</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {!hasAccounts ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <AlertTriangle size={28} className="text-amber-400" />
                        </div>
                        <p className="text-sm text-white font-semibold mb-2">
                            Butuh Minimal 2 Akun
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                            Anda perlu memiliki minimal 2 akun untuk melakukan transfer. Tambahkan akun baru dulu.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* From */}
                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                Dari Akun
                            </label>
                            <select
                                value={fromId}
                                onChange={(e) => setFromId(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all appearance-none cursor-pointer"
                            >
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} — {currencySymbol} {acc.balance.toLocaleString("id-ID")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                Nominal
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#94A3B8]">
                                    {currencySymbol}
                                </span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="any"
                                    autoFocus
                                    className="w-full pl-16 pr-4 py-5 rounded-2xl bg-slate-900/60 border border-white/10 text-white text-3xl font-extrabold placeholder-slate-600 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/40 transition-all"
                                />
                            </div>
                            {fromAccount && amount && (
                                <p className="text-xs text-[#94A3B8] mt-2">
                                    Saldo setelah transfer:{" "}
                                    <span className="text-white font-semibold">
                                        {currencySymbol} {(fromAccount.balance - parseFloat(amount || "0")).toLocaleString("id-ID")}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center">
                                <ArrowRightLeft size={16} className="text-[#A78BFA]" />
                            </div>
                        </div>

                        {/* To */}
                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                Ke Akun
                            </label>
                            <select
                                value={toId}
                                onChange={(e) => setToId(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Pilih akun tujuan</option>
                                {accounts
                                    .filter((acc) => acc.id !== fromId)
                                    .map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} — {currencySymbol} {acc.balance.toLocaleString("id-ID")}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Date & Note */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-3 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                    Catatan
                                </label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Opsional"
                                    className="w-full px-3 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                                />
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
                            disabled={isLoading || !amount || !fromId || !toId}
                            className={`w-full py-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                                isLoading
                                    ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] opacity-80 cursor-not-allowed"
                                    : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                            }`}
                        >
                            {isLoading ? (
                                <><Loader2 size={18} className="animate-spin" /> Transfer...</>
                            ) : (
                                <><ArrowRightLeft size={18} /> Transfer Now</>
                            )}
                        </button>
                    </form>
                )}
        </div>
    </Modal>
);
}