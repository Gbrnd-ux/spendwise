// app/(dashboard)/reports/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Loader2, TrendingUp, TrendingDown, Wallet, Receipt,
    ArrowUpRight, ArrowDownRight, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getReportData, ReportData } from "@/lib/firebase/firestore";
import { exportReportToExcel, exportReportToPDF } from "@/lib/export/reportExport";
import ReportFilters, { PeriodPreset, getDateRangeFromPreset } from "@/components/reports/ReportFilters";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

export default function ReportsPage() {
    const { user, userProfile } = useAuth();

    const [preset, setPreset] = useState<PeriodPreset>("this-month");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [report, setReport] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const currencySymbol = userProfile?.currency === "IDR" ? "Rp" : userProfile?.currency === "USD" ? "$" : "Rp";

    // Init: set preset bulan ini
    useEffect(() => {
        const { start, end } = getDateRangeFromPreset("this-month");
        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);
    }, []);

    // Fetch data when range changes
    const fetchReport = useCallback(async () => {
        if (!user || !startDate || !endDate) return;
        setIsLoading(true);
        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const data = await getReportData(user.uid, start, end);
            setReport(data);
        } catch (err) {
            console.error("[SpendWise] Error fetch report:", err);
            toast.error("Gagal memuat laporan");
        } finally {
            setIsLoading(false);
        }
    }, [user, startDate, endDate]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handlePresetChange = (newPreset: PeriodPreset, start: Date, end: Date) => {
        setPreset(newPreset);
        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);
    };

    const handleCustomRangeChange = (start: Date, end: Date) => {
        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);
    };

    const handleExportExcel = () => {
        if (!report) return;
        try {
            exportReportToExcel(report, userProfile?.currency || "IDR");
            toast.success("Excel berhasil didownload! 📊");
        } catch (err) {
            toast.error("Gagal export Excel");
            console.error(err);
        }
    };

    const handleExportPDF = () => {
        if (!report) return;
        try {
            exportReportToPDF(report, userProfile?.currency || "IDR");
            toast.success("PDF berhasil didownload! 📄");
        } catch (err) {
            toast.error("Gagal export PDF");
            console.error(err);
        }
    };

    // ===== Loading =====
    if (isLoading && !report) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[#8B5CF6]" />
            </div>
        );
    }

    const summary = report?.summary;
    const maxCategoryTotal = report?.byCategory[0]?.total || 1;
    const maxAccountTotal = Math.max(
        ...(report?.byAccount.map((a) => Math.max(a.totalIncome, a.totalExpense)) || [1])
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-white">Reports</h1>
                <p className="text-sm text-[#94A3B8]">Analisis keuangan Anda</p>
            </div>

            {/* Filters */}
            <ReportFilters
                preset={preset}
                startDate={startDate}
                endDate={endDate}
                onPresetChange={handlePresetChange}
                onCustomRangeChange={handleCustomRangeChange}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                isLoading={isLoading}
            />

            {isLoading && report ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-[#8B5CF6]" />
                </div>
            ) : !report || report.summary.transactionCount === 0 ? (
                <div className="p-12 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                        <BarChart3 size={28} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-sm text-[#94A3B8] mb-2">Belum ada data di periode ini</p>
                    <p className="text-xs text-[#94A3B8]/70">
                        Coba ganti periode atau tambah transaksi baru
                    </p>
                </div>
            ) : (
                <>
                    {/* ===== Summary Cards ===== */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={16} className="text-emerald-400" />
                                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                                    Total Income
                                </p>
                            </div>
                            <p className="text-2xl font-extrabold text-emerald-400">
                                {currencySymbol} {(summary?.income || 0).toLocaleString("id-ID")}
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown size={16} className="text-rose-400" />
                                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                                    Total Expense
                                </p>
                            </div>
                            <p className="text-2xl font-extrabold text-rose-400">
                                {currencySymbol} {(summary?.expense || 0).toLocaleString("id-ID")}
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet size={16} className="text-[#8B5CF6]" />
                                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                                    Net
                                </p>
                            </div>
                            <p className={`text-2xl font-extrabold ${
                                (summary?.net || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}>
                                {currencySymbol} {(summary?.net || 0).toLocaleString("id-ID")}
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Receipt size={16} className="text-[#94A3B8]" />
                                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                                    Transaksi
                                </p>
                            </div>
                            <p className="text-2xl font-extrabold text-white">
                                {summary?.transactionCount || 0}
                            </p>
                        </div>
                    </div>

                    {/* ===== Monthly Trend Chart ===== */}
                    <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-white">Monthly Trend</h3>
                            <p className="text-xs text-[#94A3B8]">Perbandingan income & expense per bulan</p>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={report.monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#64748B"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => {
                                            if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
                                            if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                                            return v.toString();
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
                                        cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                                        iconType="circle"
                                    />
                                    <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} name="Income" />
                                    <Bar dataKey="expense" fill="#F43F5E" radius={[6, 6, 0, 0]} name="Expense" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ===== Breakdown Grid ===== */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* By Category */}
                        <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                            <div className="mb-5">
                                <h3 className="text-lg font-bold text-white">Breakdown by Category</h3>
                                <p className="text-xs text-[#94A3B8]">Kategori paling banyak dipakai</p>
                            </div>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                {report.byCategory.map((cat) => {
                                    const pct = (cat.total / maxCategoryTotal) * 100;
                                    const isIncome = cat.type === "income";
                                    return (
                                        <div key={cat.id} className="group">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className="text-lg">{cat.icon}</span>
                                                <span className="text-sm font-semibold text-white flex-1 truncate">
                                                    {cat.name}
                                                </span>
                                                <span className={`text-sm font-bold ${
                                                    isIncome ? "text-emerald-400" : "text-rose-400"
                                                }`}>
                                                    {currencySymbol} {cat.total.toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            isIncome
                                                                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                                                : "bg-gradient-to-r from-rose-500 to-rose-400"
                                                        }`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-[#94A3B8] w-12 text-right">
                                                    {cat.count}x
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* By Account */}
                        <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                            <div className="mb-5">
                                <h3 className="text-lg font-bold text-white">Breakdown by Account</h3>
                                <p className="text-xs text-[#94A3B8]">Aktivitas per akun</p>
                            </div>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                                {report.byAccount.map((acc) => (
                                    <div key={acc.id} className="p-3 rounded-xl bg-[#0B1120]/40 border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-white">
                                                {acc.name}
                                            </span>
                                            <span className={`text-sm font-bold ${
                                                acc.net >= 0 ? "text-emerald-400" : "text-rose-400"
                                            }`}>
                                                {acc.net >= 0 ? "+" : ""}{currencySymbol} {acc.net.toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <ArrowUpRight size={12} className="text-emerald-400" />
                                                <span className="text-[#94A3B8]">
                                                    {currencySymbol} {acc.totalIncome.toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <ArrowDownRight size={12} className="text-rose-400" />
                                                <span className="text-[#94A3B8]">
                                                    {currencySymbol} {acc.totalExpense.toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                            <span className="text-[#94A3B8] ml-auto">
                                                {acc.count} transaksi
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}