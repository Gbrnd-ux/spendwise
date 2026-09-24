// lib/export/reportExport.ts
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportData } from "@/lib/firebase/firestore";

const formatDate = (date: Date) =>
    date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

const formatRupiah = (amount: number) =>
    `Rp ${amount.toLocaleString("id-ID")}`;

// ==================== EXCEL EXPORT ====================

export function exportReportToExcel(data: ReportData, currency: string = "IDR") {
    const wb = XLSX.utils.book_new();

    // === Sheet 1: Summary ===
    const summaryData: (string | number)[][] = [
        ["Laporan Keuangan SpendWise"],
        ["Periode", `${formatDate(data.period.start)} - ${formatDate(data.period.end)}`],
        [],
        ["Ringkasan", "Jumlah"],
        ["Total Income", data.summary.income],
        ["Total Expense", data.summary.expense],
        ["Net (Income - Expense)", data.summary.net],
        ["Total Transaksi", data.summary.transactionCount],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // === Sheet 2: By Category ===
    const catData: (string | number)[][] = [
        ["Kategori", "Ikon", "Tipe", "Total", "Jumlah Transaksi"],
        ...data.byCategory.map((c) => [
            c.name,
            c.icon,
            c.type === "income" ? "Income" : "Expense",
            c.total,
            c.count,
        ]),
    ];
    const wsCat = XLSX.utils.aoa_to_sheet(catData);
    XLSX.utils.book_append_sheet(wb, wsCat, "By Category");

    // === Sheet 3: By Account ===
    const accData: (string | number)[][] = [
        ["Akun", "Total Income", "Total Expense", "Net", "Jumlah Transaksi"],
        ...data.byAccount.map((a) => [
            a.name,
            a.totalIncome,
            a.totalExpense,
            a.net,
            a.count,
        ]),
    ];
    const wsAcc = XLSX.utils.aoa_to_sheet(accData);
    XLSX.utils.book_append_sheet(wb, wsAcc, "By Account");

    // === Sheet 4: Monthly Trend ===
    const trendData: (string | number)[][] = [
        ["Bulan", "Income", "Expense", "Net"],
        ...data.monthlyTrend.map((m) => [
            m.month,
            m.income,
            m.expense,
            m.income - m.expense,
        ]),
    ];
    const wsTrend = XLSX.utils.aoa_to_sheet(trendData);
    XLSX.utils.book_append_sheet(wb, wsTrend, "Monthly Trend");

    // === Sheet 5: All Transactions ===
    const txData: (string | number)[][] = [
        ["Tanggal", "Tipe", "Kategori", "Akun", "Catatan", "Jumlah"],
        ...data.transactions.map((tx) => {
            const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date as any);
            return [
                txDate.toLocaleDateString("id-ID"),
                tx.type === "income" ? "Income" : "Expense",
                tx.categoryName,
                tx.accountName,
                tx.note || "-",
                tx.type === "income" ? tx.amount : -tx.amount,
            ];
        }),
    ];
    const wsTx = XLSX.utils.aoa_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, wsTx, "Transactions");

    // Save
    const fileName = `SpendWise-Report-${data.period.start.toISOString().split("T")[0]}_to_${data.period.end.toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// ==================== PDF EXPORT ====================

export function exportReportToPDF(data: ReportData, currency: string = "IDR") {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ===== Header =====
    doc.setFillColor(99, 102, 241); // violet
    doc.rect(0, 0, pageWidth, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SpendWise", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Financial Report", 14, 22);

    // ===== Period =====
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Periode:", 14, 42);
    doc.setFont("helvetica", "normal");
    doc.text(`${formatDate(data.period.start)} - ${formatDate(data.period.end)}`, 40, 42);

    // ===== Summary Box =====
    let y = 52;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, "F");

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("INCOME", 20, y + 8);
    doc.text("EXPENSE", 80, y + 8);
    doc.text("NET", 140, y + 8);

    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text(formatRupiah(data.summary.income), 20, y + 18);

    doc.setTextColor(244, 63, 94);
    doc.text(formatRupiah(data.summary.expense), 80, y + 18);

    doc.setTextColor(
        data.summary.net >= 0 ? 16 : 244,
        data.summary.net >= 0 ? 185 : 63,
        data.summary.net >= 0 ? 129 : 94
    );
    doc.text(formatRupiah(data.summary.net), 140, y + 18);

    // ===== By Category Table =====
    y += 40;
    autoTable(doc, {
        startY: y,
        head: [["Kategori", "Tipe", "Total", "Transaksi"]],
        body: data.byCategory.map((c) => [
            c.name,
            c.type === "income" ? "Income" : "Expense",
            formatRupiah(c.total),
            c.count.toString(),
        ]),
        theme: "striped",
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
    });

    // ===== By Account Table =====
    y = (doc as any).lastAutoTable.finalY + 10;
    autoTable(doc, {
        startY: y,
        head: [["Akun", "Income", "Expense", "Net", "Transaksi"]],
        body: data.byAccount.map((a) => [
            a.name,
            formatRupiah(a.totalIncome),
            formatRupiah(a.totalExpense),
            formatRupiah(a.net),
            a.count.toString(),
        ]),
        theme: "striped",
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
    });

    // ===== Monthly Trend =====
    y = (doc as any).lastAutoTable.finalY + 10;
    autoTable(doc, {
        startY: y,
        head: [["Bulan", "Income", "Expense", "Net"]],
        body: data.monthlyTrend.map((m) => [
            m.month,
            formatRupiah(m.income),
            formatRupiah(m.expense),
            formatRupiah(m.income - m.expense),
        ]),
        theme: "striped",
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
    });

    // ===== Footer =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
            `Generated by SpendWise • Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
        );
    }

    // Save
    const fileName = `SpendWise-Report-${data.period.start.toISOString().split("T")[0]}_to_${data.period.end.toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
}