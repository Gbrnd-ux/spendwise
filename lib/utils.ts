// lib/utils.ts
import { Timestamp } from "firebase/firestore";

/**
 * Konversi Firestore Timestamp / Date / string / number ke Date.
 * Aman untuk semua tipe data.
 */
export function toDate(value: Timestamp | Date | string | number | any): Date {
    if (!value) return new Date();
    
    // Firestore Timestamp
    if (typeof value.toDate === "function") {
        return value.toDate();
    }
    
    // Date instance
    if (value instanceof Date) {
        return value;
    }
    
    // String atau number
    return new Date(value);
}

/**
 * Format tanggal ke "Hari Ini" / "Kemarin" / "22 September 2026"
 */
export function formatRelativeDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Hari Ini";
    if (date.toDateString() === yesterday.toDateString()) return "Kemarin";

    return date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}