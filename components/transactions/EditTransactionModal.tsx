// components/transactions/EditTransactionModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
    X, Loader2, TrendingUp, TrendingDown, Check, Calendar, FileText, Wallet as WalletIcon
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { updateTransaction, getCategories, getAccounts } from "@/lib/firebase/firestore";
import { Category, Account, Transaction, TransactionType } from "@/lib/types";
import { toDate } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

interface Props {
    transaction: Transaction | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function EditTransactionModal({ transaction, onClose, onSuccess }: Props) {
    const { user, userProfile } = useAuth();
    const { bumpDataVersion } = useModal();

    const [type, setType] = useState<TransactionType>("expense");
    const [amount, setAmount] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [date, setDate] = useState("");
    const [note, setNote] = useState("");

    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const currencySymbol = userProfile?.currency === "IDR" ? "Rp" : userProfile?.currency === "USD" ? "$" : "Rp";

    // Load data + prefill form
    useEffect(() => {
        if (!transaction || !user) return;

        const loadData = async () => {
            setIsLoadingData(true);
            try {
                const [cats, accs] = await Promise.all([
                    getCategories(user.uid, transaction.type),
                    getAccounts(user.uid),
                ]);
                setCategories(cats);
                setAccounts(accs);

                // Prefill form
                setType(transaction.type);
                setAmount(String(transaction.amount));
                setNote(transaction.note || "");

                const txDate = toDate(transaction.date);
                setDate(txDate.toISOString().split("T")[0]);

                const cat = cats.find((c) => c.id === transaction.categoryId);
                if (cat) setSelectedCategory(cat);

                const acc = accs.find((a) => a.id === transaction.accountId);
                if (acc) setSelectedAccount(acc);
            } catch (err) {
                console.error("[SpendWise] Error load edit:", err);
                setErrorMessage("Gagal memuat data.");
            } finally {
                setIsLoadingData(false);
            }
        };

        loadData();
    }, [transaction, user]);

    // Reload categories saat type berubah
    useEffect(() => {
        if (!user || isLoadingData) return;
        getCategories(user.uid, type).then(setCategories);
    }, [type, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !transaction) return;

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setErrorMessage("Nominal harus berupa angka positif.");
            return;
        }
        if (!selectedCategory) {
            setErrorMessage("Pilih kategori terlebih dahulu.");
            return;
        }
        if (!selectedAccount) {
            setErrorMessage("Pilih akun terlebih dahulu.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            await updateTransaction(user.uid, transaction.id, {
                amount: amountNum,
                type,
                categoryId: selectedCategory.id,
                categoryName: selectedCategory.name,
                categoryIcon: selectedCategory.icon,
                accountId: selectedAccount.id,
                accountName: selectedAccount.name,
                date: new Date(date),
                note: note.trim(),
            });

            toast.success("Transaksi berhasil diupdate!", {
                description: `${selectedCategory.icon} ${selectedCategory.name} • Rp ${amountNum.toLocaleString("id-ID")}`,
            });

            bumpDataVersion();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("[SpendWise] Update error:", err);
            setErrorMessage("Gagal mengupdate transaksi. Silakan coba lagi.");
            toast.error("Gagal mengupdate transaksi");
        } finally {
            setIsLoading(false);
        }
    };

    if (!transaction) return null;

    const isIncome = type === "income";
    const accentColor = isIncome ? "emerald" : "rose";

return (
    <Modal isOpen={!!transaction} onClose={onClose} maxWidth="lg">
        <div>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Edit Transaction</h2>
                        <p className="text-xs text-[#94A3B8]">Ubah detail transaksi</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {isLoadingData ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-[#8B5CF6]" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Type Toggle */}
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#0B1120]/60 border border-white/5">
                            <button
                                type="button"
                                onClick={() => setType("expense")}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-semibold text-sm ${
                                    type === "expense"
                                        ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                                        : "text-[#94A3B8] hover:text-white"
                                }`}
                            >
                                <TrendingDown size={16} /> Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("income")}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-semibold text-sm ${
                                    type === "income"
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                        : "text-[#94A3B8] hover:text-white"
                                }`}
                            >
                                <TrendingUp size={16} /> Income
                            </button>
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
                                    className={`w-full pl-16 pr-4 py-5 rounded-2xl bg-slate-900/60 border border-white/10 text-white text-3xl font-extrabold placeholder-slate-600 focus:outline-none focus:ring-2 transition-all duration-300 ${
                                        isIncome
                                            ? "focus:border-emerald-500 focus:ring-emerald-500/40"
                                            : "focus:border-rose-500 focus:ring-rose-500/40"
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">
                                Kategori
                            </label>
                            <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                                {categories.map((cat) => {
                                    const isSelected = selectedCategory?.id === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-1.5 ${
                                                isSelected
                                                    ? `border-${accentColor}-500 bg-${accentColor}-500/10`
                                                    : "border-white/10 bg-slate-900/60 hover:border-white/20"
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                                                    isIncome ? "bg-emerald-500" : "bg-rose-500"
                                                }`}>
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            )}
                                            <span className="text-xl">{cat.icon}</span>
                                            <span className={`text-[10px] font-semibold leading-tight text-center ${
                                                isSelected ? "text-white" : "text-[#94A3B8]"
                                            }`}>
                                                {cat.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Account */}
                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                Akun
                            </label>
                            <div className="space-y-2">
                                {accounts.map((acc) => {
                                    const isSelected = selectedAccount?.id === acc.id;
                                    return (
                                        <button
                                            key={acc.id}
                                            type="button"
                                            onClick={() => setSelectedAccount(acc)}
                                            className={`w-full p-3 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                                                isSelected
                                                    ? "border-[#8B5CF6] bg-[#8B5CF6]/10"
                                                    : "border-white/10 bg-slate-900/60 hover:border-white/20"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center`}>
                                                    <WalletIcon size={16} className="text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-[#94A3B8]"}`}>
                                                        {acc.name}
                                                    </p>
                                                    <p className="text-xs text-[#94A3B8] capitalize">{acc.type}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-white">
                                                {currencySymbol} {acc.balance.toLocaleString("id-ID")}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date & Note */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider flex items-center gap-1">
                                    <Calendar size={12} /> Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-3 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider flex items-center gap-1">
                                    <FileText size={12} /> Catatan
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
                            disabled={isLoading || !amount || !selectedCategory || !selectedAccount}
                            className={`w-full py-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                                isLoading
                                    ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] opacity-80 cursor-not-allowed"
                                    : `bg-gradient-to-r ${
                                        isIncome
                                            ? "from-emerald-500 to-emerald-600 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]"
                                            : "from-rose-500 to-rose-600 hover:shadow-[0_0_25px_rgba(244,63,94,0.6)]"
                                    } hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40`
                            }`}
                        >
                            {isLoading ? (
                                <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                            ) : (
                                <><Check size={18} /> Save Changes</>
                            )}
                        </button>
                    </form>
                )}
        </div>
    </Modal>
);
}