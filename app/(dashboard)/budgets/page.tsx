// app/(dashboard)/budgets/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Plus, Target, ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { getBudgetsWithProgress, BudgetWithProgress } from "@/lib/firebase/firestore";
import BudgetCard from "@/components/budgets/BudgetCard";
import BudgetFormModal from "@/components/budgets/BudgetFormModal";
import DeleteBudgetModal from "@/components/budgets/DeleteBudgetModal";

export default function BudgetsPage() {
    const { user, userProfile } = useAuth();
    const { dataVersion } = useModal();

    const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });

    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<BudgetWithProgress | null>(null);
    const [deletingBudget, setDeletingBudget] = useState<BudgetWithProgress | null>(null);

    const currencySymbol =
        userProfile?.currency === "IDR" ? "Rp" : userProfile?.currency === "USD" ? "$" : "Rp";

    // ===== FETCH =====
    const fetchBudgets = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await getBudgetsWithProgress(user.uid, currentMonth);
            setBudgets(data);
        } catch (err) {
            console.error("[SpendWise] Error fetch budgets:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentMonth]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets, dataVersion]);

    // ===== MONTH NAVIGATION =====
    const monthLabel = useMemo(() => {
        const [y, m] = currentMonth.split("-").map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
        });
    }, [currentMonth]);

    const goToPreviousMonth = () => {
        const [y, m] = currentMonth.split("-").map(Number);
        const date = new Date(y, m - 2, 1);
        setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    };

    const goToNextMonth = () => {
        const [y, m] = currentMonth.split("-").map(Number);
        const date = new Date(y, m, 1);
        setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    };

    // ===== SUMMARY =====
    const summary = useMemo(() => {
        const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
        const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
        const overCount = budgets.filter((b) => b.status === "over").length;
        const warningCount = budgets.filter((b) => b.status === "warning").length;
        return { totalBudget, totalSpent, overCount, warningCount };
    }, [budgets]);

    const handleAdd = () => {
        setEditingBudget(null);
        setFormModalOpen(true);
    };

    const handleEdit = (b: BudgetWithProgress) => {
        setEditingBudget(b);
        setFormModalOpen(true);
    };

    const existingCategoryIds = budgets.map((b) => b.categoryId);

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-white">Budgets</h1>
                    <p className="text-sm text-[#94A3B8]">Kontrol pengeluaran per kategori</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus size={16} /> Set Budget
                </button>
            </div>

            {/* Month Navigator */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                <button
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                    <p className="text-xs text-[#94A3B8] uppercase tracking-wider">Periode Budget</p>
                    <p className="text-lg font-bold text-white">{monthLabel}</p>
                </div>
                <button
                    onClick={goToNextMonth}
                    className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Summary */}
            {budgets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={16} className="text-[#8B5CF6]" />
                            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                                Total Budget
                            </p>
                        </div>
                        <p className="text-2xl font-extrabold text-white">
                            {currencySymbol} {summary.totalBudget.toLocaleString("id-ID")}
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown size={16} className="text-rose-400" />
                            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                                Total Terpakai
                            </p>
                        </div>
                        <p className="text-2xl font-extrabold text-rose-400">
                            {currencySymbol} {summary.totalSpent.toLocaleString("id-ID")}
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={16} className="text-emerald-400" />
                            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                                Status
                            </p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            {summary.overCount > 0 && (
                                <span className="text-lg font-bold text-rose-400">
                                    {summary.overCount} over
                                </span>
                            )}
                            {summary.warningCount > 0 && (
                                <span className="text-lg font-bold text-amber-400">
                                    {summary.warningCount} warning
                                </span>
                            )}
                            {summary.overCount === 0 && summary.warningCount === 0 && (
                                <span className="text-lg font-bold text-emerald-400">
                                    Semua Aman ✅
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Budgets Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-[#8B5CF6]" />
                </div>
            ) : budgets.length === 0 ? (
                <div className="p-12 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Target size={28} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-sm text-[#94A3B8] mb-2">
                        Belum ada budget untuk bulan ini
                    </p>
                    <p className="text-xs text-[#94A3B8]/70 mb-4">
                        Set budget pertama Anda untuk mulai kontrol pengeluaran
                    </p>
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all"
                    >
                        <Plus size={16} /> Set Budget
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgets.map((b) => (
                        <BudgetCard
                            key={b.id}
                            budget={b}
                            currencySymbol={currencySymbol}
                            onEdit={handleEdit}
                            onDelete={(budget) => setDeletingBudget(budget)}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {formModalOpen && (
                <BudgetFormModal
                    budget={editingBudget}
                    month={currentMonth}
                    existingCategoryIds={
                        editingBudget
                            ? existingCategoryIds.filter((id) => id !== editingBudget.categoryId)
                            : existingCategoryIds
                    }
                    onClose={() => setFormModalOpen(false)}
                    onSuccess={fetchBudgets}
                />
            )}

            {deletingBudget && (
                <DeleteBudgetModal
                    budget={deletingBudget}
                    onClose={() => setDeletingBudget(null)}
                    onSuccess={fetchBudgets}
                />
            )}
        </div>
    );
}