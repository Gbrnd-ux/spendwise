// components/budgets/BudgetFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { setBudget, getCategories } from "@/lib/firebase/firestore";
import { BudgetWithProgress } from "@/lib/firebase/firestore";
import { Category } from "@/lib/types";
import Modal from "@/components/ui/Modal";

interface Props {
    budget: BudgetWithProgress | null;    // null = tambah
    month: string;                        // "YYYY-MM"
    existingCategoryIds: string[];        // untuk exclude dari dropdown
    onClose: () => void;
    onSuccess?: () => void;
}

export default function BudgetFormModal({
    budget,
    month,
    existingCategoryIds,
    onClose,
    onSuccess,
}: Props) {
    const { user, userProfile } = useAuth();
    const { bumpDataVersion } = useModal();

    const isEdit = !!budget;

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(!isEdit);
    const [errorMessage, setErrorMessage] = useState("");

    const currencySymbol =
        userProfile?.currency === "IDR" ? "Rp" : userProfile?.currency === "USD" ? "$" : "Rp";

    // Load categories (expense only)
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            setIsLoadingData(true);
            try {
                const cats = await getCategories(user.uid, "expense");
                setCategories(cats);

                if (budget) {
                    // Prefill edit
                    setAmount(String(budget.amount));
                    const cat = cats.find((c) => c.id === budget.categoryId);
                    if (cat) setSelectedCategory(cat);
                }
            } catch (err) {
                console.error("[SpendWise] Error load categories:", err);
                setErrorMessage("Gagal memuat kategori.");
            } finally {
                setIsLoadingData(false);
            }
        };

        loadData();
    }, [user, budget]);

    // Available categories untuk dropdown
    const availableCategories = isEdit
        ? categories
        : categories.filter((c) => !existingCategoryIds.includes(c.id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setErrorMessage("Nominal budget harus berupa angka positif.");
            return;
        }
        if (!selectedCategory) {
            setErrorMessage("Pilih kategori terlebih dahulu.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            await setBudget(user.uid, {
                categoryId: selectedCategory.id,
                categoryName: selectedCategory.name,
                categoryIcon: selectedCategory.icon,
                categoryColor: selectedCategory.color,
                amount: amountNum,
                month,
            });

            toast.success(
                isEdit ? "Budget berhasil diupdate! 🎯" : "Budget berhasil dibuat! 🎯",
                {
                    description: `${selectedCategory.icon} ${selectedCategory.name} • ${currencySymbol} ${amountNum.toLocaleString("id-ID")}`,
                }
            );

            bumpDataVersion();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("[SpendWise] Budget save error:", err);
            setErrorMessage(err.message || "Gagal menyimpan budget.");
            toast.error("Gagal menyimpan budget");
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
                            {isEdit ? "Edit Budget" : "Set Budget"}
                        </h2>
                        <p className="text-xs text-[#94A3B8]">
                            Batas pengeluaran kategori untuk bulan {month}
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

                {isLoadingData ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-[#8B5CF6]" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Category Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">
                                Kategori
                            </label>

                            {availableCategories.length === 0 && !isEdit ? (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                    <p className="text-xs text-amber-300">
                                        Semua kategori expense sudah punya budget bulan ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                                    {availableCategories.map((cat) => {
                                        const isSelected = selectedCategory?.id === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-1.5 ${
                                                    isSelected
                                                        ? "border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                                        : "border-white/10 bg-slate-900/60 hover:border-white/20"
                                                }`}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8B5CF6] flex items-center justify-center">
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

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                Batas Budget
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
                            disabled={
                                isLoading ||
                                !amount ||
                                !selectedCategory ||
                                (availableCategories.length === 0 && !isEdit)
                            }
                            className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                                isLoading
                                    ? "opacity-80 cursor-not-allowed animate-glow-pulse"
                                    : "hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                            }`}
                        >
                            {isLoading ? (
                                <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                            ) : (
                                <><Check size={18} /> {isEdit ? "Save Changes" : "Set Budget"}</>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
}