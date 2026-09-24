// components/transactions/AddTransactionModal.tsx
"use client";

import { useState, useEffect } from "react";
import { 
    X, 
    Loader2, 
    TrendingUp, 
    TrendingDown,
    Check,
    Calendar,
    FileText,
    Wallet as WalletIcon
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { 
    addTransaction, 
    ensureDefaultCategories, 
    getCategories, 
    getAccounts 
} from "@/lib/firebase/firestore";
import { Category, Account, TransactionType } from "@/lib/types";

interface AddTransactionModalProps {
    onSuccess?: () => void;
}

export default function AddTransactionModal({ onSuccess }: AddTransactionModalProps) {
    const { user, userProfile } = useAuth();
    const { isAddTransactionOpen, closeAddTransaction, bumpDataVersion } = useModal();

    const [type, setType] = useState<TransactionType>("expense");
    const [amount, setAmount] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");

    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const currencySymbol = userProfile?.currency === "IDR" ? "Rp" : userProfile?.currency === "USD" ? "$" : "Rp";

    // Load categories & accounts saat modal dibuka
    useEffect(() => {
        if (!isAddTransactionOpen || !user) return;

        const loadData = async () => {
            setIsLoadingData(true);
            try {
                // Pastikan default categories ada
                await ensureDefaultCategories(user.uid);

                const [cats, accs] = await Promise.all([
                    getCategories(user.uid, type),
                    getAccounts(user.uid),
                ]);

                setCategories(cats);
                setAccounts(accs);

                // Auto-select akun pertama
                if (accs.length > 0 && !selectedAccount) {
                    setSelectedAccount(accs[0]);
                }
            } catch (error) {
                console.error("[SpendWise] Gagal load data:", error);
                setErrorMessage("Gagal memuat data. Silakan coba lagi.");
            } finally {
                setIsLoadingData(false);
            }
        };

        loadData();
    }, [isAddTransactionOpen, user, type]);

    // Reset form saat modal dibuka
    useEffect(() => {
        if (isAddTransactionOpen) {
            setType("expense");
            setAmount("");
            setSelectedCategory(null);
            setDate(new Date().toISOString().split("T")[0]);
            setNote("");
            setErrorMessage("");
        }
    }, [isAddTransactionOpen]);

    // Reset kategori terpilih saat tipe berubah
    useEffect(() => {
        setSelectedCategory(null);
    }, [type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validasi
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
        await addTransaction(user.uid, {
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

        // Toast sukses
        toast.success(
            isIncome ? "Pemasukan berhasil dicatat!" : "Pengeluaran berhasil dicatat!",
            {
                description: `${selectedCategory.icon} ${selectedCategory.name} • Rp ${amountNum.toLocaleString("id-ID")}`,
                duration: 3500,
            }
    );

    // Trigger auto-refresh dashboard
    bumpDataVersion();

    closeAddTransaction();
    onSuccess?.();
} catch (error: any) {
    console.error("[SpendWise] Error add transaction:", error);

    // Toast error
    toast.error("Gagal menyimpan transaksi", {
        description: error.message || "Silakan coba lagi.",
        duration: 4000,
    });

    setErrorMessage("Gagal menyimpan transaksi. Silakan coba lagi.");
}
    };

    if (!isAddTransactionOpen) return null;

    const isIncome = type === "income";
    const accentColor = isIncome ? "emerald" : "rose";

        return (
            <Modal
                isOpen={isAddTransactionOpen}
                onClose={closeAddTransaction}
                maxWidth="lg"
            >
                <div>
                
               {/* Header */}
<div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Add Transaction</h2>
                        <p className="text-xs text-[#94A3B8]">Catat pemasukan atau pengeluaran</p>
                    </div>
                    <button
                        onClick={closeAddTransaction}
                        disabled={isLoading}
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* ===== TYPE TOGGLE ===== */}
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
                            <TrendingDown size={16} />
                            Expense
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
                            <TrendingUp size={16} />
                            Income
                        </button>
                    </div>

                    {/* ===== AMOUNT ===== */}
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
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                min="0"
                                step="any"
                                autoFocus
                                className={`w-full pl-16 pr-4 py-5 rounded-2xl bg-slate-900/60 border border-white/10 text-white text-3xl font-extrabold placeholder-slate-600 focus:outline-none focus:ring-2 transition-all duration-300 ${
                                    isIncome
                                        ? "focus:border-emerald-500 focus:ring-emerald-500/40"
                                        : "focus:border-rose-500 focus:ring-rose-500/40"
                                }`}
                            />
                        </div>
                    </div>

                    {/* ===== CATEGORY GRID ===== */}
                    <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">
                            Kategori
                        </label>
                        {isLoadingData ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={20} className="animate-spin text-[#8B5CF6]" />
                            </div>
                        ) : categories.length === 0 ? (
                            <p className="text-sm text-[#94A3B8] text-center py-4">
                                Belum ada kategori. Silakan refresh.
                            </p>
                        ) : (
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
                                                    ? `border-${accentColor}-500 bg-${accentColor}-500/10 shadow-[0_0_15px_rgba(${isIncome ? "16,185,129" : "244,63,94"},0.3)]`
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
                        )}
                    </div>

                    {/* ===== ACCOUNT DROPDOWN ===== */}
                    <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                            Dari Akun
                        </label>
                        {accounts.length === 0 ? (
                            <p className="text-sm text-[#94A3B8]">Belum ada akun. Silakan tambah akun dulu.</p>
                        ) : (
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
                                                    ? "border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
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
                        )}
                    </div>

                    {/* ===== DATE & NOTE ===== */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider flex items-center gap-1">
                                <Calendar size={12} />
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
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider flex items-center gap-1">
                                <FileText size={12} />
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

                    {/* ===== ERROR ===== */}
                    {errorMessage && (
                        <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2.5 animate-fade-in-up">
                            {errorMessage}
                        </div>
                    )}

                    {/* ===== SUBMIT ===== */}
                    <button
                        type="submit"
                        disabled={isLoading || !amount || !selectedCategory || !selectedAccount}
                        className={`w-full py-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                            isLoading
                                ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] opacity-80 cursor-not-allowed animate-glow-pulse"
                                : `bg-gradient-to-r ${
                                    isIncome 
                                        ? "from-emerald-500 to-emerald-600 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]" 
                                        : "from-rose-500 to-rose-600 hover:shadow-[0_0_25px_rgba(244,63,94,0.6)]"
                                } hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                Save {isIncome ? "Income" : "Expense"}
                            </>
                        )}
                    </button>
            </form>
        </div>
    </Modal>
);
}