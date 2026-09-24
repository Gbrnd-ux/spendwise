// app/(dashboard)/transactions/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import {
    getTransactions,
    getAccounts,
    getCategories,
} from "@/lib/firebase/firestore";
import { Transaction, Account, Category } from "@/lib/types";
import TransactionFilters, { FilterState } from "@/components/transactions/TransactionFilters";
import TransactionList from "@/components/transactions/TransactionList";
import EditTransactionModal from "@/components/transactions/EditTransactionModal";
import DeleteConfirmationModal from "@/components/transactions/DeleteConfirmationModal";
import { toDate } from "@/lib/utils";

export default function TransactionsPage() {
    const { user, userProfile } = useAuth();
    const { openAddTransaction, dataVersion } = useModal();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState<FilterState>({
        month: new Date().toISOString().slice(0, 7), // Bulan ini
        categoryId: "",
        accountId: "",
        search: "",
    });

    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

    const currencySymbol = userProfile?.currency === "IDR" ? "Rp" : userProfile?.currency === "USD" ? "$" : "Rp";

    // ===== FETCH DATA =====
    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const [txs, accs, cats] = await Promise.all([
                getTransactions(user.uid),
                getAccounts(user.uid),
                getCategories(user.uid),
            ]);
            setTransactions(txs);
            setAccounts(accs);
            setCategories(cats);
        } catch (err) {
            console.error("[SpendWise] Error fetch:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData, dataVersion]);

    // ===== FILTER =====
    const filteredTx = useMemo(() => {
        return transactions.filter((tx) => {
            const txDate = toDate(tx.date);

            // Month filter
            if (filters.month) {
                const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
                if (txMonth !== filters.month) return false;
            }

            // Category filter
            if (filters.categoryId && tx.categoryId !== filters.categoryId) return false;

            // Account filter
            if (filters.accountId && tx.accountId !== filters.accountId) return false;

            // Search filter
            if (filters.search) {
                const q = filters.search.toLowerCase();
                const haystack = `${tx.categoryName} ${tx.accountName} ${tx.note}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            return true;
        });
    }, [transactions, filters]);

    // ===== SUMMARY =====
    const summary = useMemo(() => {
        const income = filteredTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = filteredTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        return { income, expense, net: income - expense };
    }, [filteredTx]);

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
                    <h1 className="text-2xl font-extrabold text-white">Transactions</h1>
                    <p className="text-sm text-[#94A3B8]">Kelola semua transaksi Anda</p>
                </div>
                <button
                    onClick={openAddTransaction}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus size={16} /> Add Transaction
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-emerald-400" />
                        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Income</p>
                    </div>
                    <p className="text-xl font-extrabold text-emerald-400">
                        {currencySymbol} {summary.income.toLocaleString("id-ID")}
                    </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={14} className="text-rose-400" />
                        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Expense</p>
                    </div>
                    <p className="text-xl font-extrabold text-rose-400">
                        {currencySymbol} {summary.expense.toLocaleString("id-ID")}
                    </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet size={14} className="text-[#8B5CF6]" />
                        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Net</p>
                    </div>
                    <p className={`text-xl font-extrabold ${
                        summary.net >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                        {currencySymbol} {summary.net.toLocaleString("id-ID")}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <TransactionFilters
                filters={filters}
                onFilterChange={setFilters}
                categories={categories}
                accounts={accounts}
                currencySymbol={currencySymbol}
            />

            {/* Info count */}
            <p className="text-xs text-[#94A3B8] px-1">
                Menampilkan <span className="text-white font-semibold">{filteredTx.length}</span> dari {transactions.length} transaksi
            </p>

            {/* List */}
            <TransactionList
                transactions={filteredTx}
                onEdit={(tx) => setEditingTx(tx)}
                onDelete={(tx) => setDeletingTx(tx)}
            />

            {/* Edit Modal */}
            {editingTx && (
                <EditTransactionModal
                    transaction={editingTx}
                    onClose={() => setEditingTx(null)}
                    onSuccess={fetchData}
                />
            )}

            {/* Delete Modal */}
            {deletingTx && (
                <DeleteConfirmationModal
                    transaction={deletingTx}
                    onClose={() => setDeletingTx(null)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}