// components/dashboard/RecentTransactions.tsx
"use client";

import { ArrowUpRight, ArrowDownRight, Receipt } from "lucide-react";
import { Transaction } from "@/lib/types";

export default function RecentTransactions({
    transactions = []
}: {
    transactions?: Transaction[]
}) {
    const formatDate = (timestamp: any) => {
        if (!timestamp) return "";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Hari ini";
        if (date.toDateString() === yesterday.toDateString()) return "Kemarin";

        return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    };

    return (
        <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
                    <p className="text-xs text-[#94A3B8]">Aktivitas terakhir</p>
                </div>
                <button className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] font-semibold transition-colors">
                    View All →
                </button>
            </div>

            {transactions.length === 0 ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Receipt size={24} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-sm text-[#94A3B8] mb-2">Belum ada transaksi</p>
                    <p className="text-xs text-[#94A3B8]/70">Mulai catat transaksi pertama Anda</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {transactions.map((tx) => {
                        const isIncome = tx.type === "income";
                        return (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isIncome ? "bg-emerald-500/10" : "bg-rose-500/10"
                                        }`}>
                                        {tx.categoryIcon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {tx.categoryName}
                                        </p>
                                        <p className="text-xs text-[#94A3B8]">
                                            {tx.accountName} • {formatDate(tx.date)}
                                        </p>
                                    </div>
                                </div>
                                <p className={`text-sm font-bold ${isIncome ? "text-emerald-400" : "text-rose-400"
                                    }`}>
                                    {isIncome ? "+" : "-"}Rp {tx.amount.toLocaleString("id-ID")}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}