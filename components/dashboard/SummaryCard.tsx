// components/dashboard/SummaryCard.tsx
"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardProps {
    label: string;
    value: string;
    icon: LucideIcon;
    trend?: number;              // Persentase perubahan (opsional)
    gradient: string;            // Tailwind gradient classes
    hideable?: boolean;
    hidden?: boolean;
    onToggleHide?: () => void;
}

export default function SummaryCard({
    label,
    value,
    icon: Icon,
    trend,
    gradient,
    hideable,
    hidden,
    onToggleHide,
}: SummaryCardProps) {
    const isPositive = trend && trend > 0;

    return (
        <div className="relative p-5 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 group overflow-hidden">
            {/* Glow background */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity`} />

            <div className="relative flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                    <Icon size={18} className="text-white" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${isPositive
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-rose-400 bg-rose-500/10"
                        }`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <p className="relative text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                {label}
            </p>
            <p className="relative text-2xl font-extrabold text-white">
                {hidden ? "••••••" : value}
            </p>
        </div>
    );
}