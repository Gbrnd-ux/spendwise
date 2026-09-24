// components/reports/ReportFilters.tsx
"use client";

import { Calendar, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";

export type PeriodPreset = "this-month" | "last-month" | "3-months" | "6-months" | "this-year" | "custom";

interface Props {
    preset: PeriodPreset;
    startDate: string;
    endDate: string;
    onPresetChange: (preset: PeriodPreset, start: Date, end: Date) => void;
    onCustomRangeChange: (start: Date, end: Date) => void;
    onExportExcel: () => void;
    onExportPDF: () => void;
    isLoading?: boolean;
}

const PRESETS: { value: PeriodPreset; label: string }[] = [
    { value: "this-month", label: "Bulan Ini" },
    { value: "last-month", label: "Bulan Lalu" },
    { value: "3-months", label: "3 Bulan" },
    { value: "6-months", label: "6 Bulan" },
    { value: "this-year", label: "Tahun Ini" },
    { value: "custom", label: "Custom" },
];

export function getDateRangeFromPreset(preset: PeriodPreset): { start: Date; end: Date } {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (preset) {
        case "this-month":
            return {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: startOfToday,
            };
        case "last-month":
            return {
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
            };
        case "3-months":
            return {
                start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
                end: startOfToday,
            };
        case "6-months":
            return {
                start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
                end: startOfToday,
            };
        case "this-year":
            return {
                start: new Date(now.getFullYear(), 0, 1),
                end: startOfToday,
            };
        default:
            return {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: startOfToday,
            };
    }
}

export default function ReportFilters({
    preset,
    startDate,
    endDate,
    onPresetChange,
    onCustomRangeChange,
    onExportExcel,
    onExportPDF,
    isLoading,
}: Props) {
    return (
        <div className="space-y-4">
            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => {
                    const isActive = preset === p.value;
                    return (
                        <button
                            key={p.value}
                            onClick={() => {
                                if (p.value === "custom") {
                                    onPresetChange(p.value, new Date(startDate), new Date(endDate));
                                } else {
                                    const { start, end } = getDateRangeFromPreset(p.value);
                                    onPresetChange(p.value, start, end);
                                }
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                isActive
                                    ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                                    : "bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20"
                            }`}
                        >
                            {p.label}
                        </button>
                    );
                })}
            </div>

            {/* Custom Date Range + Export */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {preset === "custom" && (
                    <div className="flex items-center gap-2 flex-1 p-3 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                        <Calendar size={16} className="text-[#94A3B8] flex-shrink-0" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => onCustomRangeChange(new Date(e.target.value), new Date(endDate))}
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm focus:outline-none focus:border-[#8B5CF6] transition-all"
                        />
                        <span className="text-[#94A3B8] text-sm">—</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => onCustomRangeChange(new Date(startDate), new Date(e.target.value))}
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm focus:outline-none focus:border-[#8B5CF6] transition-all"
                        />
                    </div>
                )}

                <div className="flex gap-2 sm:ml-auto">
                    <button
                        onClick={onExportExcel}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-sm font-semibold transition-all disabled:opacity-50"
                    >
                        <FileSpreadsheet size={14} />
                        Excel
                    </button>
                    <button
                        onClick={onExportPDF}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-sm font-semibold transition-all disabled:opacity-50"
                    >
                        <FileText size={14} />
                        PDF
                    </button>
                </div>
            </div>
        </div>
    );
}