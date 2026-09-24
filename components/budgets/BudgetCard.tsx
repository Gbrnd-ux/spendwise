// components/budgets/BudgetCard.tsx
"use client";

import { Edit3, Trash2, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { BudgetWithProgress } from "@/lib/firebase/firestore";

interface Props {
    budget: BudgetWithProgress;
    currencySymbol: string;
    onEdit: (budget: BudgetWithProgress) => void;
    onDelete: (budget: BudgetWithProgress) => void;
}

const STATUS_CONFIG = {
    safe: {
        barColor: "from-emerald-500 to-emerald-400",
        bgColor: "bg-emerald-500/10",
        textColor: "text-emerald-400",
        icon: CheckCircle2,
        label: "Aman",
    },
    warning: {
        barColor: "from-amber-500 to-amber-400",
        bgColor: "bg-amber-500/10",
        textColor: "text-amber-400",
        icon: TrendingUp,
        label: "Hampir Habis",
    },
    over: {
        barColor: "from-rose-500 to-rose-400",
        bgColor: "bg-rose-500/10",
        textColor: "text-rose-400",
        icon: AlertTriangle,
        label: "Overbudget",
    },
};

export default function BudgetCard({ budget, currencySymbol, onEdit, onDelete }: Props) {
    const config = STATUS_CONFIG[budget.status];
    const StatusIcon = config.icon;
    const remaining = budget.amount - budget.spent;
    const barWidth = Math.min(budget.percentage, 100);

    return (
        <div className={`group relative p-5 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 ${
            budget.status === "over" ? "border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : ""
        }`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: `${budget.categoryColor}20` }}
                    >
                        {budget.categoryIcon}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white truncate">
                            {budget.categoryName}
                        </p>
                        <div className={`flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-full ${config.bgColor} inline-flex`}>
                            <StatusIcon size={10} className={config.textColor} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textColor}`}>
                                {config.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(budget)}
                        className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all"
                        title="Edit"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(budget)}
                        className="p-2 rounded-lg text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Hapus"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Amount Info */}
            <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-2xl font-extrabold ${budget.status === "over" ? "text-rose-400" : "text-white"}`}>
                    {currencySymbol} {budget.spent.toLocaleString("id-ID")}
                </span>
                <span className="text-sm text-[#94A3B8]">
                    / {currencySymbol} {budget.amount.toLocaleString("id-ID")}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${config.barColor} transition-all duration-700`}
                        style={{ width: `${barWidth}%` }}
                    />
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className={config.textColor}>
                        {budget.percentage.toFixed(1)}% terpakai
                    </span>
                    <span className={remaining >= 0 ? "text-[#94A3B8]" : "text-rose-400 font-semibold"}>
                        {remaining >= 0
                            ? `Sisa: ${currencySymbol} ${remaining.toLocaleString("id-ID")}`
                            : `Kelebihan: ${currencySymbol} ${Math.abs(remaining).toLocaleString("id-ID")}`
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}