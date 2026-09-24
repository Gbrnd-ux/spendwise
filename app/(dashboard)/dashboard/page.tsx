// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import {
    getDashboardStats,
    getCashFlowData,
    getExpenseByCategory,
    DashboardStats,
    CashFlowDataPoint,
    ExpenseByCategory,
} from "@/lib/firebase/firestore";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Target,
    Loader2,
    Plus
} from "lucide-react";
import SummaryCard from "@/components/dashboard/SummaryCard";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";

export default function DashboardPage() {
    const { user, userProfile } = useAuth();
    const { openAddTransaction, dataVersion } = useModal();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [cashFlowData, setCashFlowData] = useState<CashFlowDataPoint[]>([]);
    const [expenseData, setExpenseData] = useState<ExpenseByCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hideBalance, setHideBalance] = useState(false);

    const fetchAllData = useCallback(async () => {
        if (!user) return;
        try {
            const [statsData, cashData, expData] = await Promise.all([
                getDashboardStats(user.uid),
                getCashFlowData(user.uid),
                getExpenseByCategory(user.uid),
            ]);
            setStats(statsData);
            setCashFlowData(cashData);
            setExpenseData(expData);
        } catch (error) {
            console.error("[SpendWise] Error fetch dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);
        useEffect(() => {
            fetchAllData();
        }, [fetchAllData, dataVersion]);

    const formatCurrency = (amount: number) =>
        `Rp ${amount.toLocaleString("id-ID")}`;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[#8B5CF6]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    label="Total Balance"
                    value={formatCurrency(stats?.totalBalance || 0)}
                    icon={Wallet}
                    gradient="from-[#6366F1] to-[#8B5CF6]"
                    hideable
                    hidden={hideBalance}
                    onToggleHide={() => setHideBalance(!hideBalance)}
                />
                <SummaryCard
                    label="Income (Bulan Ini)"
                    value={formatCurrency(stats?.monthlyIncome || 0)}
                    icon={TrendingUp}
                    gradient="from-emerald-500 to-emerald-600"
                />
                <SummaryCard
                    label="Expense (Bulan Ini)"
                    value={formatCurrency(stats?.monthlyExpense || 0)}
                    icon={TrendingDown}
                    gradient="from-rose-500 to-rose-600"
                />
                <SummaryCard
                    label="Budget"
                    value={formatCurrency(stats?.monthlyBudget || 0)}
                    icon={Target}
                    gradient="from-amber-500 to-orange-500"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <CashFlowChart data={cashFlowData} />
                </div>
                <div className="lg:col-span-1">
                    <ExpenseChart data={expenseData} />
                </div>
            </div>

            <RecentTransactions transactions={stats?.recentTransactions || []} />

            {/* Spacer untuk FAB agar tidak overlap */}
            <div className="h-20 lg:h-24" />

            {/* Floating Action Button */}
            <button
                onClick={openAddTransaction}
                className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-110 active:scale-95 transition-all duration-200 group"
            >
                <Plus size={24} className="text-white" strokeWidth={2.5} />
                <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-[#1E293B] border border-white/10 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Add Transaction
                </span>
            </button>
        </div>
    );
}