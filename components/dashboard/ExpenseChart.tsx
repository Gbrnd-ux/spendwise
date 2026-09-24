// components/dashboard/ExpenseChart.tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { ExpenseByCategory } from "@/lib/firebase/firestore";

interface Props {
    data?: ExpenseByCategory[];
    isLoading?: boolean;
}

export default function ExpenseChart({ data = [], isLoading = false }: Props) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (isLoading) {
        return (
            <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">Expenses</h3>
                    <p className="text-xs text-[#94A3B8]">By Category</p>
                </div>
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-pulse w-40 h-40 rounded-full bg-white/5" />
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">Expenses</h3>
                    <p className="text-xs text-[#94A3B8]">By Category</p>
                </div>
                <div className="h-64 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                        <PieChartIcon size={28} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-sm text-[#94A3B8] mb-2">Belum ada pengeluaran</p>
                    <p className="text-xs text-[#94A3B8]/70">
                        Catat pengeluaran untuk melihat breakdown kategori
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-white">Expenses</h3>
                <p className="text-xs text-[#94A3B8]">By Category</p>
            </div>

            <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
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
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs text-[#94A3B8]">Total</p>
                    <p className="text-lg font-extrabold text-white">
                        Rp {total >= 1000000 ? `${(total / 1000000).toFixed(1)}M` : total.toLocaleString("id-ID")}
                    </p>
                </div>
            </div>

            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[#94A3B8] truncate">{item.name}</span>
                        </div>
                        <span className="text-white font-semibold whitespace-nowrap ml-2">
                            Rp {item.value.toLocaleString("id-ID")}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}