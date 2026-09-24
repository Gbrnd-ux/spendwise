// components/Header.tsx
"use client";

import { Search, Bell, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    const { userProfile } = useAuth();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    return (
        <header className="sticky top-0 z-30 bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4">
                {/* Left: Mobile Logo / Desktop Title */}
                <div className="flex items-center gap-4">
                    {/* Mobile Logo */}
                    <Link href="/dashboard" className="flex lg:hidden items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                            <Wallet size={16} className="text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">SpendWise</span>
                    </Link>

                    {/* Desktop Title */}
                    <div className="hidden lg:block">
                        {title ? (
                            <>
                                <h1 className="text-xl font-bold text-white">{title}</h1>
                                {subtitle && (
                                    <p className="text-xs text-[#94A3B8]">{subtitle}</p>
                                )}
                            </>
                        ) : (
                            <>
                                <h1 className="text-xl font-bold text-white">
                                    {getGreeting()}, {userProfile?.name?.split(" ")[0] || "User"}!
                                </h1>
                                <p className="text-xs text-[#94A3B8]">
                                    Here's your financial overview
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Search, Notif, Avatar */}
                <div className="flex items-center gap-2 lg:gap-3">
                    {/* Search (Desktop only) */}
                    <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6] transition-all w-64">
                        <Search size={16} className="text-[#94A3B8]" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 flex-1 w-full"
                        />
                        <kbd className="hidden xl:flex items-center gap-0.5 text-[10px] text-[#94A3B8] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 font-sans">
                            <span>⌘</span><span>K</span>
                        </kbd>
                    </div>

                    {/* Notification Bell */}
                    <button className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all">
                        <Bell size={18} />
                        {/* Red dot */}
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]">
                            <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-75" />
                        </span>
                    </button>

                    {/* Avatar (Mobile & Desktop) */}
                    <button className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform">
                        {userProfile?.name?.charAt(0).toUpperCase() || "U"}
                    </button>
                </div>
            </div>
        </header>
    );
}