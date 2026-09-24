// components/dashboard/CashFlowChart.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import { CashFlowDataPoint } from "@/lib/firebase/firestore";

interface Props {
    data?: CashFlowDataPoint[];
    isLoading?: boolean;
}

export default function CashFlowChart({ data = [], isLoading = false }: Props) {
    const hasData = data.some((d) => d.income > 0 || d.expense > 0);

    if (isLoading) {
        return (
            <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white">Cash Flow</h3>
                    <p className="text-xs text-[#94A3B8]">Income vs Expense</p>
                </div>
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-pulse w-full h-full bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white">Cash Flow</h3>
                    <p className="text-xs text-[#94A3B8]">Income vs Expense (6 bulan terakhir)</p>
                </div>
                <div className="h-64 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                        <LineChartIcon size={28} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-sm text-[#94A3B8] mb-2">Belum ada data transaksi</p>
                    <p className="text-xs text-[#94A3B8]/70">
                        Tambahkan transaksi untuk melihat grafik cash flow Anda
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white">Cash Flow</h3>
                    <p className="text-xs text-[#94A3B8]">Income vs Expense (6 bulan terakhir)</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[#94A3B8]">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-[#94A3B8]">Expense</span>
                    </div>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                        <XAxis
                            dataKey="month"
                            stroke="#64748B"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748B"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                return value.toString();
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.95)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "12px",
                                color: "white",
                                fontSize: "12px",
                            }}
                            formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                        />
                        <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{ fill: "#10B981", r: 4 }}
                            activeDot={{ r: 6, fill: "#10B981" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="expense"
                            stroke="#F43F5E"
                            strokeWidth={3}
                            dot={{ fill: "#F43F5E", r: 4 }}
                            activeDot={{ r: 6, fill: "#F43F5E" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}