// lib/firebase/firestore.ts
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    collection,
    getDocs,
    addDoc,
    query,
    orderBy,
    where,
    increment,
    writeBatch,
    Timestamp,
    limit,
    deleteDoc,
} from "firebase/firestore";
import { db } from "./config";
import { User } from "firebase/auth";
import { UserProfile, Account, Category, Transaction, TransactionType, AccountType } from "@/lib/types";

// ==================== TYPES ====================

export interface DashboardStats {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyBudget: number;
    recentTransactions: any[];
    accounts: Account[];
}

export interface CashFlowDataPoint {
    month: string;
    income: number;
    expense: number;
}

export interface ExpenseByCategory {
    name: string;
    value: number;
    color: string;
}

// ==================== USER ====================

export async function createUserDocument(user: User): Promise<void> {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) return;

    const userData = {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || user.email?.split("@")[0] || "User",
        photoURL: user.photoURL || null,
        currency: "IDR",
        onboarded: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, userData);
    console.log(`[SpendWise] User ${user.uid} dibuat di Firestore.`);
}

export async function getUserDocument(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
}

export async function updateUserDocument(
    userId: string,
    data: Partial<UserProfile>
): Promise<void> {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
}

// ==================== ACCOUNTS ====================

export async function addAccount(
    userId: string,
    account: Omit<Account, "id" | "createdAt">
): Promise<string> {
    const accountsRef = collection(db, "users", userId, "accounts");
    const docRef = await addDoc(accountsRef, {
        ...account,
        createdAt: serverTimestamp(),
    });
    console.log(`[SpendWise] Account ${docRef.id} dibuat.`);
    return docRef.id;
}

export async function getAccounts(userId: string): Promise<Account[]> {
    const accountsRef = collection(db, "users", userId, "accounts");
    const q = query(accountsRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Account[];
}

export async function getTotalBalance(userId: string): Promise<number> {
    const accounts = await getAccounts(userId);
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
}

// ==================== CATEGORIES ====================

const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
    { name: "Makanan", type: "expense", icon: "🍔", color: "#F59E0B", isDefault: true },
    { name: "Transport", type: "expense", icon: "🚗", color: "#10B981", isDefault: true },
    { name: "Belanja", type: "expense", icon: "🛍️", color: "#8B5CF6", isDefault: true },
    { name: "Tagihan", type: "expense", icon: "📄", color: "#F43F5E", isDefault: true },
    { name: "Hiburan", type: "expense", icon: "🎬", color: "#6366F1", isDefault: true },
    { name: "Kesehatan", type: "expense", icon: "💊", color: "#EC4899", isDefault: true },
    { name: "Pendidikan", type: "expense", icon: "📚", color: "#0EA5E9", isDefault: true },
    { name: "Lainnya", type: "expense", icon: "📌", color: "#64748B", isDefault: true },
    { name: "Gaji", type: "income", icon: "💼", color: "#10B981", isDefault: true },
    { name: "Bonus", type: "income", icon: "🎁", color: "#8B5CF6", isDefault: true },
    { name: "Investasi", type: "income", icon: "📈", color: "#F59E0B", isDefault: true },
    { name: "Lainnya", type: "income", icon: "💰", color: "#6366F1", isDefault: true },
];

export async function ensureDefaultCategories(userId: string): Promise<void> {
    const catRef = collection(db, "users", userId, "categories");
    const snap = await getDocs(catRef);

    if (!snap.empty) return;

    const batch = writeBatch(db);
    DEFAULT_CATEGORIES.forEach((cat) => {
        const ref = doc(catRef);
        batch.set(ref, { ...cat, createdAt: serverTimestamp() });
    });
    await batch.commit();
    console.log(`[SpendWise] ${DEFAULT_CATEGORIES.length} default categories dibuat untuk user ${userId}.`);
}

export async function getCategories(
    userId: string,
    type?: TransactionType
): Promise<Category[]> {
    const catRef = collection(db, "users", userId, "categories");
    const snapshot = await getDocs(catRef);
    let categories = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    })) as Category[];

    if (type) {
        categories = categories.filter((c) => c.type === type);
    }

    categories.sort((a, b) => a.name.localeCompare(b.name));
    return categories;
}

// ==================== TRANSACTIONS ====================

export async function addTransaction(
    userId: string,
    data: {
        amount: number;
        type: TransactionType;
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        accountId: string;
        accountName: string;
        date: Date;
        note: string;
    }
): Promise<string> {
    const txRef = collection(db, "users", userId, "transactions");
    const accountRef = doc(db, "users", userId, "accounts", data.accountId);

    const batch = writeBatch(db);

    const newTxRef = doc(txRef);
    batch.set(newTxRef, {
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        categoryIcon: data.categoryIcon,
        accountId: data.accountId,
        accountName: data.accountName,
        date: Timestamp.fromDate(data.date),
        note: data.note,
        createdAt: serverTimestamp(),
    });

    const balanceDelta = data.type === "income" ? data.amount : -data.amount;
    batch.update(accountRef, { balance: increment(balanceDelta) });

    await batch.commit();
    console.log(`[SpendWise] Transaction ${newTxRef.id} dibuat. Saldo: ${balanceDelta > 0 ? "+" : ""}${balanceDelta}`);

    return newTxRef.id;
}

export async function getTransactions(
    userId: string,
    limitCount?: number
): Promise<Transaction[]> {
    const txRef = collection(db, "users", userId, "transactions");
    const q = query(txRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    
    let transactions = snapshot.docs.map((d) => ({ 
        id: d.id, 
        ...d.data() 
    })) as Transaction[];

    if (limitCount) {
        transactions = transactions.slice(0, limitCount);
    }

    return transactions;
}

export async function deleteTransaction(
    userId: string,
    transactionId: string
): Promise<void> {
    const txRef = doc(db, "users", userId, "transactions", transactionId);
    const txSnap = await getDoc(txRef);

    if (!txSnap.exists()) throw new Error("Transaksi tidak ditemukan");

    const txData = txSnap.data() as Transaction;
    const accountRef = doc(db, "users", userId, "accounts", txData.accountId);

    const batch = writeBatch(db);

    const reverseDelta = txData.type === "income" ? -txData.amount : txData.amount;
    batch.update(accountRef, { balance: increment(reverseDelta) });
    batch.delete(txRef);

    await batch.commit();
    console.log(`[SpendWise] Transaksi ${transactionId} dihapus. Saldo dikembalikan: ${reverseDelta}`);
}

// ==================== DASHBOARD ====================

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
    const accountsRef = collection(db, "users", userId, "accounts");
    const txRef = collection(db, "users", userId, "transactions");
    const budgetRef = collection(db, "users", userId, "budgets");

    const [accountsSnap, txSnap, budgetSnap] = await Promise.all([
        getDocs(accountsRef),
        getDocs(query(txRef, orderBy("date", "desc"))),
        getDocs(budgetRef),
    ]);

    const accounts = accountsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Account[];
    const allTx = txSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
    const budgets = budgetSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTx = allTx.filter((tx) => {
        const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
        return txDate >= startOfMonth;
    });

    const monthlyIncome = monthlyTx
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const monthlyExpense = monthlyTx
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const monthlyBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);

    return {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        monthlyBudget,
        recentTransactions: allTx.slice(0, 5),
        accounts,
    };
}

/**
 * Ambil data cash flow (6 bulan terakhir) untuk Line Chart
 */
export async function getCashFlowData(userId: string): Promise<CashFlowDataPoint[]> {
    const txRef = collection(db, "users", userId, "transactions");
    const snapshot = await getDocs(query(txRef, orderBy("date", "asc")));
    const transactions = snapshot.docs.map((d) => d.data());

    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Siapkan 6 bulan terakhir
    const months: CashFlowDataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            month: monthNames[d.getMonth()],
            income: 0,
            expense: 0,
        });
    }

    // Aggregate transaksi ke bulan-bulan tersebut
    transactions.forEach((tx: any) => {
        const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);

        // Cari index bulan yang cocok
        for (let i = 0; i < months.length; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            if (d.getMonth() === txDate.getMonth() && d.getFullYear() === txDate.getFullYear()) {
                if (tx.type === "income") {
                    months[i].income += tx.amount || 0;
                } else {
                    months[i].expense += tx.amount || 0;
                }
                break;
            }
        }
    });

    return months;
}

/**
 * Ambil data expenses grouped by category untuk Donut Chart
 */
export async function getExpenseByCategory(userId: string): Promise<ExpenseByCategory[]> {
    const txRef = collection(db, "users", userId, "transactions");
    const snapshot = await getDocs(txRef);
    const transactions = snapshot.docs.map((d) => d.data() as any);

    // Filter hanya expense
    const expenses = transactions.filter((tx) => tx.type === "expense");

    const categoryMap = new Map<string, { name: string; value: number; color: string }>();
    const COLORS = ["#8B5CF6", "#10B981", "#F59E0B", "#F43F5E", "#6366F1", "#EC4899", "#0EA5E9", "#64748B"];

    expenses.forEach((tx) => {
        const key = tx.categoryId || tx.categoryName;
        if (categoryMap.has(key)) {
            categoryMap.get(key)!.value += tx.amount;
        } else {
            const colorIndex = categoryMap.size % COLORS.length;
            categoryMap.set(key, {
                name: tx.categoryName || "Lainnya",
                value: tx.amount,
                color: COLORS[colorIndex],
            });
        }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
}
// lib/firebase/firestore.ts
// Tambahkan di bawah getExpenseByCategory

/**
 * Update transaksi & sesuaikan saldo akun
 */
export async function updateTransaction(
    userId: string,
    transactionId: string,
    newData: {
        amount: number;
        type: TransactionType;
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        accountId: string;
        accountName: string;
        date: Date;
        note: string;
    }
): Promise<void> {
    const txRef = doc(db, "users", userId, "transactions", transactionId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) throw new Error("Transaksi tidak ditemukan");

    const oldTx = txSnap.data() as Transaction;
    const batch = writeBatch(db);

    // Reverse efek transaksi lama
    const oldEffect = oldTx.type === "income" ? -oldTx.amount : oldTx.amount;
    // Efek transaksi baru
    const newEffect = newData.type === "income" ? newData.amount : -newData.amount;

    const oldAccountRef = doc(db, "users", userId, "accounts", oldTx.accountId);
    const newAccountRef = doc(db, "users", userId, "accounts", newData.accountId);

    if (oldTx.accountId === newData.accountId) {
        // Akun sama — net effect
        const netEffect = oldEffect + newEffect;
        if (netEffect !== 0) {
            batch.update(oldAccountRef, { balance: increment(netEffect) });
        }
    } else {
        // Akun berbeda — reverse dari lama, apply ke baru
        batch.update(oldAccountRef, { balance: increment(oldEffect) });
        batch.update(newAccountRef, { balance: increment(newEffect) });
    }

    batch.update(txRef, {
        amount: newData.amount,
        type: newData.type,
        categoryId: newData.categoryId,
        categoryName: newData.categoryName,
        categoryIcon: newData.categoryIcon,
        accountId: newData.accountId,
        accountName: newData.accountName,
        date: Timestamp.fromDate(newData.date),
        note: newData.note,
        updatedAt: serverTimestamp(),
    });

    await batch.commit();
    console.log(`[SpendWise] Transaksi ${transactionId} diupdate.`);
}
// lib/firebase/firestore.ts
// Tambahkan di bawah updateTransaction

// ==================== ACCOUNT MANAGEMENT ====================

/**
 * Update akun (nama, type, warna, icon)
 * Balance tidak boleh diupdate manual — hanya via transaksi/transfer
 */
export async function updateAccount(
    userId: string,
    accountId: string,
    data: {
        name: string;
        type: AccountType;
        color: string;
        icon: string;
    }
): Promise<void> {
    const accountRef = doc(db, "users", userId, "accounts", accountId);
    await updateDoc(accountRef, {
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
        updatedAt: serverTimestamp(),
    });
    console.log(`[SpendWise] Account ${accountId} diupdate.`);
}

/**
 * Cek apakah akun masih dipakai di transaksi
 */
export async function checkAccountUsage(
    userId: string,
    accountId: string
): Promise<number> {
    const txRef = collection(db, "users", userId, "transactions");
    const q = query(txRef, where("accountId", "==", accountId));
    const snapshot = await getDocs(q);
    return snapshot.size;
}

/**
 * Hapus akun — hanya bisa kalau tidak dipakai di transaksi
 */
export async function deleteAccount(
    userId: string,
    accountId: string
): Promise<void> {
    const usageCount = await checkAccountUsage(userId, accountId);

    if (usageCount > 0) {
        throw new Error(
            `Akun ini masih digunakan di ${usageCount} transaksi. Hapus transaksi tersebut dulu atau pindahkan ke akun lain.`
        );
    }

    const accountRef = doc(db, "users", userId, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);

    if (accountSnap.exists()) {
        const balance = accountSnap.data().balance || 0;
        if (balance !== 0) {
            throw new Error(
                `Saldo akun masih Rp ${balance.toLocaleString("id-ID")}. Pindahkan saldo ke akun lain dulu (transfer).`
            );
        }
    }

    await updateDoc(accountRef, { deleted: true });
    // Atau: await deleteDoc(accountRef); // Hard delete
    console.log(`[SpendWise] Account ${accountId} dihapus.`);
}

/**
 * Transfer saldo antar akun (atomic)
 */
export async function transferBetweenAccounts(
    userId: string,
    data: {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        date: Date;
        note: string;
    }
): Promise<void> {
    if (data.fromAccountId === data.toAccountId) {
        throw new Error("Akun asal dan tujuan tidak boleh sama.");
    }

    const fromRef = doc(db, "users", userId, "accounts", data.fromAccountId);
    const toRef = doc(db, "users", userId, "accounts", data.toAccountId);

    const [fromSnap, toSnap] = await Promise.all([getDoc(fromRef), getDoc(toRef)]);

    if (!fromSnap.exists() || !toSnap.exists()) {
        throw new Error("Akun tidak ditemukan.");
    }

    const fromData = fromSnap.data() as Account;
    const toData = toSnap.data() as Account;

    if (fromData.balance < data.amount) {
        throw new Error(
            `Saldo tidak cukup. Saldo ${fromData.name}: Rp ${fromData.balance.toLocaleString("id-ID")}`
        );
    }

    const batch = writeBatch(db);
    const txRef = collection(db, "users", userId, "transactions");

    // 1. Kurangi dari akun asal
    batch.update(fromRef, { balance: increment(-data.amount) });

    // 2. Tambah ke akun tujuan
    batch.update(toRef, { balance: increment(data.amount) });

    // 3. Catat sebagai 2 transaksi (transfer out & transfer in)
    const outRef = doc(txRef);
    batch.set(outRef, {
        amount: data.amount,
        type: "expense",
        categoryId: "transfer",
        categoryName: "Transfer Keluar",
        categoryIcon: "↗️",
        accountId: data.fromAccountId,
        accountName: fromData.name,
        date: Timestamp.fromDate(data.date),
        note: data.note || `Transfer ke ${toData.name}`,
        isTransfer: true,
        transferTo: data.toAccountId,
        createdAt: serverTimestamp(),
    });

    const inRef = doc(txRef);
    batch.set(inRef, {
        amount: data.amount,
        type: "income",
        categoryId: "transfer",
        categoryName: "Transfer Masuk",
        categoryIcon: "↘️",
        accountId: data.toAccountId,
        accountName: toData.name,
        date: Timestamp.fromDate(data.date),
        note: data.note || `Transfer dari ${fromData.name}`,
        isTransfer: true,
        transferFrom: data.fromAccountId,
        createdAt: serverTimestamp(),
    });

    await batch.commit();
    console.log(`[SpendWise] Transfer Rp ${data.amount} dari ${fromData.name} ke ${toData.name}`);
}
// lib/firebase/firestore.ts
// Tambahkan di bawah transferBetweenAccounts

// ==================== CATEGORY MANAGEMENT ====================

/**
 * Tambah kategori baru
 */
export async function addCategory(
    userId: string,
    data: {
        name: string;
        type: TransactionType;
        icon: string;
        color: string;
    }
): Promise<string> {
    const catRef = collection(db, "users", userId, "categories");
    const docRef = await addDoc(catRef, {
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        isDefault: false,
        createdAt: serverTimestamp(),
    });
    console.log(`[SpendWise] Category ${docRef.id} dibuat.`);
    return docRef.id;
}

/**
 * Update kategori
 */
export async function updateCategory(
    userId: string,
    categoryId: string,
    data: {
        name: string;
        icon: string;
        color: string;
        type: TransactionType;
    }
): Promise<void> {
    const catRef = doc(db, "users", userId, "categories", categoryId);
    await updateDoc(catRef, {
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
        updatedAt: serverTimestamp(),
    });
    console.log(`[SpendWise] Category ${categoryId} diupdate.`);
}

/**
 * Cek apakah kategori masih dipakai di transaksi
 */
export async function checkCategoryUsage(
    userId: string,
    categoryId: string
): Promise<number> {
    const txRef = collection(db, "users", userId, "transactions");
    const q = query(txRef, where("categoryId", "==", categoryId));
    const snapshot = await getDocs(q);
    return snapshot.size;
}

/**
 * Hapus kategori — hanya kalau tidak dipakai di transaksi
 */
export async function deleteCategory(
    userId: string,
    categoryId: string
): Promise<void> {
    const usageCount = await checkCategoryUsage(userId, categoryId);

    if (usageCount > 0) {
        throw new Error(
            `Kategori ini masih digunakan di ${usageCount} transaksi. Hapus atau ubah transaksi tersebut dulu.`
        );
    }

    const catRef = doc(db, "users", userId, "categories", categoryId);
    await deleteDoc(catRef);
    console.log(`[SpendWise] Category ${categoryId} dihapus.`);
}
// lib/firebase/firestore.ts
// Tambahkan di bawah deleteCategory

// ==================== REPORTS ====================

export interface ReportData {
    period: { start: Date; end: Date };
    summary: {
        income: number;
        expense: number;
        net: number;
        transactionCount: number;
    };
    byCategory: {
        id: string;
        name: string;
        icon: string;
        color: string;
        type: TransactionType;
        total: number;
        count: number;
    }[];
    byAccount: {
        id: string;
        name: string;
        type: string;
        totalIncome: number;
        totalExpense: number;
        net: number;
        count: number;
    }[];
    monthlyTrend: {
        month: string;
        income: number;
        expense: number;
    }[];
    transactions: Transaction[];
}

/**
 * Ambil semua data yang dibutuhkan untuk halaman Reports
 */
export async function getReportData(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<ReportData> {
    const txRef = collection(db, "users", userId, "transactions");
    const snapshot = await getDocs(query(txRef, orderBy("date", "desc")));

    const allTx = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    })) as Transaction[];

    // Filter transaksi dalam periode
    const transactions = allTx.filter((tx) => {
        const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date as any);
        return txDate >= startDate && txDate <= endDate;
    });

    // ===== Summary =====
    const income = transactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);

    // ===== Breakdown by Category =====
    const catMap = new Map<string, ReportData["byCategory"][0]>();
    transactions.forEach((tx) => {
        const key = tx.categoryId || tx.categoryName;
        if (catMap.has(key)) {
            const existing = catMap.get(key)!;
            existing.total += tx.amount;
            existing.count += 1;
        } else {
            catMap.set(key, {
                id: tx.categoryId,
                name: tx.categoryName,
                icon: tx.categoryIcon,
                color: "#8B5CF6",
                type: tx.type,
                total: tx.amount,
                count: 1,
            });
        }
    });
    const byCategory = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

    // ===== Breakdown by Account =====
    const accMap = new Map<string, ReportData["byAccount"][0]>();
    transactions.forEach((tx) => {
        const key = tx.accountId;
        if (accMap.has(key)) {
            const existing = accMap.get(key)!;
            if (tx.type === "income") existing.totalIncome += tx.amount;
            else existing.totalExpense += tx.amount;
            existing.count += 1;
        } else {
            accMap.set(key, {
                id: tx.accountId,
                name: tx.accountName,
                type: "",
                totalIncome: tx.type === "income" ? tx.amount : 0,
                totalExpense: tx.type === "expense" ? tx.amount : 0,
                net: 0,
                count: 1,
            });
        }
    });
    accMap.forEach((acc) => {
        acc.net = acc.totalIncome - acc.totalExpense;
    });
    const byAccount = Array.from(accMap.values()).sort(
        (a, b) => Math.abs(b.net) - Math.abs(a.net)
    );

    // ===== Monthly Trend (dalam periode) =====
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthMap = new Map<string, { month: string; income: number; expense: number }>();

    // Generate semua bulan dalam periode
    let cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (cur <= endMonth) {
        const key = `${cur.getFullYear()}-${cur.getMonth()}`;
        monthMap.set(key, {
            month: `${monthNames[cur.getMonth()]} ${String(cur.getFullYear()).slice(2)}`,
            income: 0,
            expense: 0,
        });
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }

    transactions.forEach((tx) => {
        const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date as any);
        const key = `${txDate.getFullYear()}-${txDate.getMonth()}`;
        if (monthMap.has(key)) {
            const item = monthMap.get(key)!;
            if (tx.type === "income") item.income += tx.amount;
            else item.expense += tx.amount;
        }
    });

    const monthlyTrend = Array.from(monthMap.values());

    return {
        period: { start: startDate, end: endDate },
        summary: {
            income,
            expense,
            net: income - expense,
            transactionCount: transactions.length,
        },
        byCategory,
        byAccount,
        monthlyTrend,
        transactions,
    };
}
// lib/firebase/firestore.ts
// Tambahkan di bawah getReportData

// ==================== BUDGETS ====================

export interface Budget {
    id: string;
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    amount: number;
    month: string;       // format "YYYY-MM"
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export interface BudgetWithProgress extends Budget {
    spent: number;
    percentage: number;   // 0-100+
    status: "safe" | "warning" | "over";
}

/**
 * Tambah / update budget (upsert by categoryId+month)
 */
export async function setBudget(
    userId: string,
    data: {
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        categoryColor: string;
        amount: number;
        month: string;
    }
): Promise<string> {
    const budgetRef = collection(db, "users", userId, "budgets");

    // Cek apakah sudah ada budget untuk kategori+bulan ini
    const q = query(
        budgetRef,
        where("categoryId", "==", data.categoryId),
        where("month", "==", data.month)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
        // Update yang ada
        const docRef = existing.docs[0].ref;
        await updateDoc(docRef, {
            amount: data.amount,
            categoryName: data.categoryName,
            categoryIcon: data.categoryIcon,
            categoryColor: data.categoryColor,
            updatedAt: serverTimestamp(),
        });
        console.log(`[SpendWise] Budget updated: ${data.categoryName} → ${data.amount}`);
        return docRef.id;
    }

    // Buat baru
    const docRef = await addDoc(budgetRef, {
        ...data,
        createdAt: serverTimestamp(),
    });
    console.log(`[SpendWise] Budget created: ${data.categoryName} → ${data.amount}`);
    return docRef.id;
}

/**
 * Ambil semua budget user untuk bulan tertentu
 */
export async function getBudgets(userId: string, month: string): Promise<Budget[]> {
    const budgetRef = collection(db, "users", userId, "budgets");
    const q = query(budgetRef, where("month", "==", month));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Budget[];
}

/**
 * Ambil budget dengan progress (spent vs amount)
 */
export async function getBudgetsWithProgress(
    userId: string,
    month: string
): Promise<BudgetWithProgress[]> {
    const budgets = await getBudgets(userId, month);

    // Ambil semua transaksi bulan tersebut
    const txRef = collection(db, "users", userId, "transactions");
    const snapshot = await getDocs(txRef);
    const allTx = snapshot.docs.map((d) => d.data() as any);

    // Parse month "YYYY-MM"
    const [year, m] = month.split("-").map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);

    // Filter expense di bulan tersebut
    const monthExpenses = allTx.filter((tx) => {
        if (tx.type !== "expense") return false;
        const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
        return txDate >= start && txDate <= end;
    });

    // Hitung spent per kategori
    const spentMap = new Map<string, number>();
    monthExpenses.forEach((tx) => {
        const key = tx.categoryId;
        spentMap.set(key, (spentMap.get(key) || 0) + tx.amount);
    });

    // Combine dengan progress
    return budgets.map((b) => {
        const spent = spentMap.get(b.categoryId) || 0;
        const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        let status: "safe" | "warning" | "over" = "safe";
        if (percentage >= 100) status = "over";
        else if (percentage >= 75) status = "warning";

        return {
            ...b,
            spent,
            percentage,
            status,
        };
    }).sort((a, b) => b.percentage - a.percentage);
}

/**
 * Hapus budget
 */
export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
    const budgetRef = doc(db, "users", userId, "budgets", budgetId);
    await deleteDoc(budgetRef);
    console.log(`[SpendWise] Budget ${budgetId} dihapus.`);
}
// lib/firebase/firestore.ts
// Tambahkan di bawah deleteBudget

// ==================== SETTINGS ====================

/**
 * Update user profile (nama, currency)
 */
export async function updateUserProfile(
    userId: string,
    data: {
        name?: string;
        currency?: string;
    }
): Promise<void> {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
    console.log(`[SpendWise] User profile ${userId} diupdate.`);
}

/**
 * Hapus semua data user (transactions, categories, budgets, accounts)
 * lalu hapus user document
 */
export async function deleteAllUserData(userId: string): Promise<void> {
    const subcollections = ["transactions", "categories", "budgets", "accounts"];

    for (const sub of subcollections) {
        const colRef = collection(db, "users", userId, sub);
        const snapshot = await getDocs(colRef);

        // Hapus dalam batch (max 500 per batch)
        const chunks: any[][] = [];
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += 500) {
            chunks.push(docs.slice(i, i + 500));
        }

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }

        console.log(`[SpendWise] Deleted ${docs.length} docs from ${sub}`);
    }

    // Hapus user document
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    console.log(`[SpendWise] User document ${userId} dihapus.`);
}