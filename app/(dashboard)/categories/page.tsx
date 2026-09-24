// app/(dashboard)/categories/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Plus, TrendingUp, TrendingDown, Tags } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { getCategories } from "@/lib/firebase/firestore";
import { Category, TransactionType } from "@/lib/types";
import CategoryCard from "@/components/categories/CategoryCard";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import DeleteCategoryModal from "@/components/categories/DeleteCategoryModal";

export default function CategoriesPage() {
    const { user } = useAuth();
    const { dataVersion } = useModal();

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TransactionType>("expense");

    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const fetchCategories = useCallback(async () => {
        if (!user) return;
        try {
            const cats = await getCategories(user.uid);
            setCategories(cats);
        } catch (err) {
            console.error("[SpendWise] Error fetch categories:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories, dataVersion]);

    // Filtered by tab
    const filteredCategories = useMemo(() => {
        return categories.filter((c) => c.type === activeTab);
    }, [categories, activeTab]);

    // Counts
    const expenseCount = categories.filter((c) => c.type === "expense").length;
    const incomeCount = categories.filter((c) => c.type === "income").length;

    const handleAdd = () => {
        setEditingCategory(null);
        setFormModalOpen(true);
    };

    const handleEdit = (cat: Category) => {
        setEditingCategory(cat);
        setFormModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[#8B5CF6]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-white">Categories</h1>
                    <p className="text-sm text-[#94A3B8]">Kelola kategori transaksi Anda</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus size={16} /> Add Category
                </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                <button
                    onClick={() => setActiveTab("expense")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-semibold text-sm ${
                        activeTab === "expense"
                            ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                            : "text-[#94A3B8] hover:text-white"
                    }`}
                >
                    <TrendingDown size={16} />
                    Expense
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeTab === "expense" ? "bg-white/20" : "bg-white/5"
                    }`}>
                        {expenseCount}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("income")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-semibold text-sm ${
                        activeTab === "income"
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                            : "text-[#94A3B8] hover:text-white"
                    }`}
                >
                    <TrendingUp size={16} />
                    Income
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeTab === "income" ? "bg-white/20" : "bg-white/5"
                    }`}>
                        {incomeCount}
                    </span>
                </button>
            </div>

            {/* Info */}
            <p className="text-xs text-[#94A3B8] px-1">
                Menampilkan <span className="text-white font-semibold">{filteredCategories.length}</span> kategori
                {" • "}
                Kategori default tidak bisa dihapus jika masih dipakai
            </p>

            {/* Categories Grid */}
            {filteredCategories.length === 0 ? (
                <div className="p-12 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Tags size={28} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-sm text-[#94A3B8] mb-2">
                        Belum ada kategori {activeTab === "income" ? "pemasukan" : "pengeluaran"}
                    </p>
                    <p className="text-xs text-[#94A3B8]/70 mb-4">
                        Tambahkan kategori untuk memudahkan tracking
                    </p>
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all"
                    >
                        <Plus size={16} /> Add Category
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredCategories.map((cat) => (
                        <CategoryCard
                            key={cat.id}
                            category={cat}
                            onEdit={handleEdit}
                            onDelete={(c) => setDeletingCategory(c)}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {formModalOpen && (
                <CategoryFormModal
                    category={editingCategory}
                    defaultType={activeTab}
                    onClose={() => setFormModalOpen(false)}
                    onSuccess={fetchCategories}
                />
            )}

            {deletingCategory && (
                <DeleteCategoryModal
                    category={deletingCategory}
                    onClose={() => setDeletingCategory(null)}
                    onSuccess={fetchCategories}
                />
            )}
        </div>
    );
}