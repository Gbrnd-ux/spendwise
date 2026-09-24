// lib/types/index.ts
import { Timestamp } from "firebase/firestore";

export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    photoURL: string | null;
    currency: string;
    onboarded: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type AccountType = "cash" | "bank" | "ewallet";

export interface Account {
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    icon: string;
    color: string;
    createdAt: Timestamp;
}

// ===== BARU =====
export type TransactionType = "income" | "expense";

export interface Category {
    id: string;
    name: string;
    type: TransactionType;
    icon: string;   // emoji
    color: string;  // hex
    isDefault?: boolean;
}

export interface Transaction {
    id: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    accountId: string;
    accountName: string;
    date: Timestamp;
    note: string;
    createdAt: Timestamp;
}