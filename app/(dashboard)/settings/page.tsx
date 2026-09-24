// app/(dashboard)/settings/page.tsx
"use client";

import { useState } from "react";
import { User, Settings as SettingsIcon, Shield, AlertTriangle } from "lucide-react";
import ProfileSection from "@/components/settings/ProfileSection";
import PreferencesSection from "@/components/settings/PreferencesSection";
import SecuritySection from "@/components/settings/SecuritySection";
import DangerZoneSection from "@/components/settings/DangerZoneSection";

type Tab = "profile" | "preferences" | "security" | "danger";

const TABS: { value: Tab; label: string; icon: any; description: string }[] = [
    {
        value: "profile",
        label: "Profile",
        icon: User,
        description: "Kelola informasi pribadi Anda",
    },
    {
        value: "preferences",
        label: "Preferences",
        icon: SettingsIcon,
        description: "Mata uang dan preferensi",
    },
    {
        value: "security",
        label: "Security",
        icon: Shield,
        description: "Password dan keamanan akun",
    },
    {
        value: "danger",
        label: "Danger Zone",
        icon: AlertTriangle,
        description: "Logout atau hapus akun",
    },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("profile");

    const activeTabInfo = TABS.find((t) => t.value === activeTab)!;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-white">Settings</h1>
                <p className="text-sm text-[#94A3B8]">
                    Kelola akun dan preferensi Anda
                </p>
            </div>

            {/* Main Grid: Tabs + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tabs Sidebar */}
                <div className="lg:col-span-1">
                    <div className="space-y-1 p-2 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.value;
                            const isDanger = tab.value === "danger";

                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left relative ${
                                        isActive
                                            ? isDanger
                                                ? "bg-rose-500/10 text-rose-400"
                                                : "bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20 text-white"
                                            : "text-[#94A3B8] hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    {isActive && !isDanger && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#6366F1] to-[#8B5CF6] rounded-r-full" />
                                    )}
                                    {isActive && isDanger && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rose-500 rounded-r-full" />
                                    )}
                                    <Icon size={18} className="flex-shrink-0" />
                                    <span className="text-sm font-semibold">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="p-6 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10">
                        {/* Section Header */}
                        <div className="mb-6 pb-5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    activeTab === "danger"
                                        ? "bg-rose-500/10 border border-rose-500/20"
                                        : "bg-[#8B5CF6]/10 border border-[#8B5CF6]/20"
                                }`}>
                                    <activeTabInfo.icon
                                        size={18}
                                        className={activeTab === "danger" ? "text-rose-400" : "text-[#A78BFA]"}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">
                                        {activeTabInfo.label}
                                    </h2>
                                    <p className="text-xs text-[#94A3B8]">
                                        {activeTabInfo.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section Content */}
                        {activeTab === "profile" && <ProfileSection />}
                        {activeTab === "preferences" && <PreferencesSection />}
                        {activeTab === "security" && <SecuritySection />}
                        {activeTab === "danger" && <DangerZoneSection />}
                    </div>
                </div>
            </div>
        </div>
    );
}