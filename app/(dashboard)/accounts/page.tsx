// app/(dashboard)/accounts/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, ArrowRightLeft, Wallet as WalletIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { getAccounts } from "@/lib/firebase/firestore";
import { Account } from "@/lib/types";
import AccountCard from "@/components/accounts/AccountCard";
import AccountFormModal from "@/components/accounts/AccountFormModal";
import TransferModal from "@/components/accounts/TransferModal";
import DeleteAccountModal from "@/components/accounts/DeleteAccountModal";

export default function AccountsPage() {
    const { user, userProfile } = useAuth();
    const { dataVersion } = useModal();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

    const currencySymbol = userProfile?.currency === "IDR" ? "Rp" : userProfile?.currency === "USD" ? "$" : "Rp";

    const fetchAccounts = useCallback(async () => {
        if (!user) return;
        try {
            const accs = await getAccounts(user.uid);
            setAccounts(accs.filter((a) => !(a as any).deleted));
        } catch (err) {
            console.error("[SpendWise] Error fetch accounts:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts, dataVersion]);

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const handleAdd = () => {
        setEditingAccount(null);
        setFormModalOpen(true);
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setFormModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[#8B5CF6]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-white">Accounts</h1>
                    <p className="text-sm text-[#94A3B8]">Kelola semua dompet dan akun Anda</p>
                </div>
                <div className="flex gap-2">
                    {accounts.length >= 2 && (
                        <button
                            onClick={() => setTransferModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all"
                        >
                            <ArrowRightLeft size={16} /> Transfer
                        </button>
                    )}
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={16} /> Add Account
                    </button>
                </div>
            </div>

            {/* Total Balance Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/10 backdrop-blur-xl border border-[#8B5CF6]/20">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg">
                        <WalletIcon size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                            Total Balance
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                            Dari {accounts.length} akun
                        </p>
                    </div>
                </div>
                <p className="text-3xl font-extrabold text-white mt-2">
                    {currencySymbol} {totalBalance.toLocaleString("id-ID")}
                </p>
            </div>

            {/* Accounts Grid */}
            {accounts.length === 0 ? (
                <div className="p-12 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                        <WalletIcon size={28} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-sm text-[#94A3B8] mb-2">Belum ada akun</p>
                    <p className="text-xs text-[#94A3B8]/70 mb-4">
                        Mulai tambahkan dompet pertama Anda
                    </p>
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all"
                    >
                        <Plus size={16} /> Add Account
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map((account) => (
                        <AccountCard
                            key={account.id}
                            account={account}
                            currencySymbol={currencySymbol}
                            onEdit={handleEdit}
                            onDelete={(acc) => setDeletingAccount(acc)}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {formModalOpen && (
                <AccountFormModal
                    account={editingAccount}
                    onClose={() => setFormModalOpen(false)}
                    onSuccess={fetchAccounts}
                />
            )}

            {transferModalOpen && (
                <TransferModal
                    accounts={accounts}
                    onClose={() => setTransferModalOpen(false)}
                    onSuccess={fetchAccounts}
                />
            )}

            {deletingAccount && (
                <DeleteAccountModal
                    account={deletingAccount}
                    onClose={() => setDeletingAccount(null)}
                    onSuccess={fetchAccounts}
                />
            )}
        </div>
    );
}   