import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  Layers, 
  Phone, 
  User, 
  DollarSign, 
  ArrowRight,
  Info,
  Check,
  Calendar,
  Building2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import Pagination from '../components/Pagination';

// Helper: Format Rupiah with dot separator (UI Display)
function formatRupiahUI(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
  const val = Number(num);
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(val);
}

// Helper: Format Rupiah with comma decimals (Excel exact parity with proses_excel.py)
function formatRupiahExcel(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Rp 0,00';
  const val = Number(num);
  const parts = val.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = parts[1];
  return `Rp ${intPart},${decPart}`;
}

// Helper: Parse multi-line Billing Information block
function parseBillingInfo(text) {
  const result = {
    'PHONE NO': '',
    'NAME': '',
    'BILL NUMBER': '',
    'PERIOD': '',
    'AMOUNT': 0,
    'ADMIN': 0,
    'TOTAL': 0
  };
  if (!text || typeof text !== 'string') return result;

  const lines = text.split(/[\r\n]+/);
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const rawKey = line.substring(0, colonIdx).trim().toUpperCase();
      const val = line.substring(colonIdx + 1).trim();

      let matchedKey = null;
      if (rawKey === 'PHONE NO' || rawKey === 'NO. TELEPON' || rawKey === 'NO TELEPON' || rawKey === 'NOMOR TELEPON') {
        matchedKey = 'PHONE NO';
      } else if (rawKey === 'NAME' || rawKey === 'NAMA') {
        matchedKey = 'NAME';
      } else if (rawKey === 'BILL NUMBER' || rawKey === 'NO. TAGIHAN' || rawKey === 'NO TAGIHAN' || rawKey === 'NOMOR TAGIHAN') {
        matchedKey = 'BILL NUMBER';
      } else if (rawKey === 'PERIOD' || rawKey === 'PERIODE') {
        matchedKey = 'PERIOD';
      } else if (rawKey === 'AMOUNT' || rawKey === 'TAGIHAN') {
        matchedKey = 'AMOUNT';
      } else if (rawKey === 'ADMIN') {
        matchedKey = 'ADMIN';
      } else if (rawKey === 'TOTAL') {
        matchedKey = 'TOTAL';
      }

      if (matchedKey) {
        if (['AMOUNT', 'ADMIN', 'TOTAL'].includes(matchedKey)) {
          const cleaned = val.replace(/,/g, '').replace(/\s+/g, '').replace(/[^0-9.]/g, '');
          result[matchedKey] = parseFloat(cleaned) || 0;
        } else {
          result[matchedKey] = val;
        }
      }
    }
  }
  return result;
}

export default function IndihomeConverterPage() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Parsed Output States
  const [dataRows, setDataRows] = useState([]);
  const [originalHeaders, setOriginalHeaders] = useState([]);
  const [detectedSheet, setDetectedSheet] = useState('');
  const [summary, setSummary] = useState(null);

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'SUCCESS' | 'FAILED'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const fileInputRef = useRef(null);

  // File Upload & Conversion Process
  const processExcelFile = async (uploadedFile) => {
    if (!uploadedFile) return;

    setProcessing(true);
    setError(null);
    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setFileSize((uploadedFile.size / 1024).toFixed(1) + ' KB');

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      // Find appropriate sheet (prefer 'Transaction Status', fallback to first)
      const targetSheet = wb.SheetNames.find(
        (name) => name.toLowerCase().includes('transaction status') || name.toLowerCase().includes('status')
      ) || wb.SheetNames[0];

      if (!targetSheet) {
        throw new Error('Tidak ada sheet yang ditemukan di dalam file Excel.');
      }
      setDetectedSheet(targetSheet);

      const ws = wb.Sheets[targetSheet];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (rawRows.length === 0) {
        throw new Error(`Sheet '${targetSheet}' kosong.`);
      }

      // Auto-detect header row index: contains 'Billing Information' or index 3
      let headerIdx = -1;
      for (let i = 0; i < Math.min(15, rawRows.length); i++) {
        if (rawRows[i] && rawRows[i].some((cell) => /billing\s*information/i.test(String(cell)))) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx === -1) {
        // Fallback default index 3 (row 4 in Excel)
        headerIdx = rawRows.length > 3 ? 3 : 0;
      }

      const headers = rawRows[headerIdx].map((h) => String(h).trim());
      setOriginalHeaders(headers);

      const billingColIdx = headers.findIndex((h) => /billing\s*information/i.test(h));
      const statusColIdx = headers.findIndex((h) => /status/i.test(h));

      if (billingColIdx === -1) {
        throw new Error("Kolom 'Billing Information' tidak ditemukan pada baris header.");
      }

      const rowsResult = [];
      const statusSummary = {};
      let totalSuccess = 0;
      let totalFailed = 0;
      let sumAmount = 0;
      let sumAdmin = 0;
      let sumTotal = 0;
      let successAmount = 0;
      let failedAmount = 0;

      for (let r = headerIdx + 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0 || !row[0]) continue;

        const rawStatus = statusColIdx !== -1 ? String(row[statusColIdx] || '').trim() : 'Unknown';
        const isSuccess = /success/i.test(rawStatus);
        const isFailed = /fail/i.test(rawStatus);

        const normalizedStatus = isSuccess ? 'Success' : (isFailed ? 'Failed' : (rawStatus || 'Unknown'));

        const parsed = parseBillingInfo(row[billingColIdx]);

        sumAmount += parsed.AMOUNT;
        sumAdmin += parsed.ADMIN;
        sumTotal += parsed.TOTAL;

        if (isSuccess) {
          totalSuccess++;
          successAmount += parsed.TOTAL;
        } else {
          totalFailed++;
          failedAmount += parsed.TOTAL;
        }

        if (!statusSummary[normalizedStatus]) {
          statusSummary[normalizedStatus] = { count: 0, totalAmount: 0 };
        }
        statusSummary[normalizedStatus].count += 1;
        statusSummary[normalizedStatus].totalAmount += parsed.TOTAL;

        // Build flat object for preview and export
        const rowItem = {
          _id: r,
          _rawStatus: rawStatus,
          _normalizedStatus: normalizedStatus,
          _isSuccess: isSuccess,
          _isFailed: isFailed,
          ...parsed,
        };

        headers.forEach((h, colIdx) => {
          rowItem[h] = row[colIdx] !== undefined ? row[colIdx] : '';
        });

        rowsResult.push(rowItem);
      }

      if (rowsResult.length === 0) {
        throw new Error('Tidak ada baris data transaksi yang berhasil diproses.');
      }

      setDataRows(rowsResult);
      setSummary({
        totalCount: rowsResult.length,
        totalSuccess,
        totalFailed,
        sumAmount,
        sumAdmin,
        sumTotal,
        successAmount,
        failedAmount,
        statusSummary,
      });
      setPage(1);
    } catch (err) {
      console.error('Error processing Excel:', err);
      setError(err.message || 'Gagal memproses file Excel.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processExcelFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setFileSize('');
    setDataRows([]);
    setSummary(null);
    setError(null);
    setSearchTerm('');
    setStatusFilter('ALL');
    setPage(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtered Rows for Table Preview
  const filteredRows = useMemo(() => {
    return dataRows.filter((item) => {
      // Status Filter
      if (statusFilter === 'SUCCESS' && !item._isSuccess) return false;
      if (statusFilter === 'FAILED' && !item._isFailed) return false;

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const jastel = String(item['Billing Key 1'] || '').toLowerCase();
        const phone = String(item['PHONE NO'] || '').toLowerCase();
        const name = String(item['NAME'] || '').toLowerCase();
        const bill = String(item['BILL NUMBER'] || '').toLowerCase();
        const period = String(item['PERIOD'] || '').toLowerCase();
        const status = String(item._rawStatus || '').toLowerCase();

        return (
          jastel.includes(q) ||
          phone.includes(q) ||
          name.includes(q) ||
          bill.includes(q) ||
          period.includes(q) ||
          status.includes(q)
        );
      }

      return true;
    });
  }, [dataRows, statusFilter, searchTerm]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRows.slice(start, start + limit);
  }, [filteredRows, page, limit]);

  const totalPages = Math.ceil(filteredRows.length / limit) || 1;

  // Export Converted Excel (Exact layout as proses_excel.py)
  const handleExportExcel = (failedOnly = false) => {
    if (!dataRows.length) return;

    const exportSourceRows = failedOnly ? dataRows.filter((r) => r._isFailed) : dataRows;
    if (exportSourceRows.length === 0) {
      alert('Tidak ada transaksi gagal untuk didownload.');
      return;
    }

    const extraHeaders = ['PHONE NO', 'NAME', 'BILL NUMBER', 'PERIOD', 'AMOUNT', 'ADMIN', 'TOTAL'];
    const allHeaders = [...originalHeaders, ...extraHeaders];

    let sumAmountExp = 0;
    let sumAdminExp = 0;
    let sumTotalExp = 0;
    const summaryMapExp = {};

    const formattedRows = exportSourceRows.map((item) => {
      sumAmountExp += item.AMOUNT;
      sumAdminExp += item.ADMIN;
      sumTotalExp += item.TOTAL;

      const st = item._normalizedStatus;
      if (!summaryMapExp[st]) {
        summaryMapExp[st] = { count: 0, total: 0 };
      }
      summaryMapExp[st].count += 1;
      summaryMapExp[st].total += item.TOTAL;

      const rowObj = {};
      originalHeaders.forEach((h) => {
        rowObj[h] = item[h] !== undefined ? item[h] : '';
      });

      rowObj['PHONE NO'] = item['PHONE NO'];
      rowObj['NAME'] = item['NAME'];
      rowObj['BILL NUMBER'] = item['BILL NUMBER'];
      rowObj['PERIOD'] = item['PERIOD'];
      rowObj['AMOUNT'] = formatRupiahExcel(item.AMOUNT);
      rowObj['ADMIN'] = formatRupiahExcel(item.ADMIN);
      rowObj['TOTAL'] = formatRupiahExcel(item.TOTAL);

      return rowObj;
    });

    // Grand Total Row for main data table
    const grandTotalRow = {};
    allHeaders.forEach((h, idx) => {
      if (idx === 0) grandTotalRow[h] = 'GRAND TOTAL';
      else if (h === 'AMOUNT') grandTotalRow[h] = formatRupiahExcel(sumAmountExp);
      else if (h === 'ADMIN') grandTotalRow[h] = formatRupiahExcel(sumAdminExp);
      else if (h === 'TOTAL') grandTotalRow[h] = formatRupiahExcel(sumTotalExp);
      else grandTotalRow[h] = '';
    });

    // Summary Table
    const summaryRows = [];
    let totalCountExp = 0;
    let totalAmountExp = 0;

    Object.keys(summaryMapExp).sort().forEach((st) => {
      totalCountExp += summaryMapExp[st].count;
      totalAmountExp += summaryMapExp[st].total;
      summaryRows.push({
        'Trx Status': st,
        'Jumlah_Transaksi': summaryMapExp[st].count,
        'Total_Amount': formatRupiahExcel(summaryMapExp[st].total),
      });
    });

    summaryRows.push({
      'Trx Status': 'Grand Total',
      'Jumlah_Transaksi': totalCountExp,
      'Total_Amount': formatRupiahExcel(totalAmountExp),
    });

    // Build worksheet with main table + grand total row
    const ws = XLSX.utils.json_to_sheet([...formattedRows, grandTotalRow], { header: allHeaders });

    // Append summary table 3 rows below main table (same as proses_excel.py)
    XLSX.utils.sheet_add_json(ws, summaryRows, { origin: formattedRows.length + 4 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Indihome Payment Processed');

    // Auto-generate file name
    const dateStr = new Date().toISOString().slice(0, 7); // YYYY-MM
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    let targetFileName = `Transaction_Status_PROCESSED_${dateStr} CID.xlsx`;
    if (failedOnly) {
      targetFileName = `Transaction_Status_FAILED_ONLY_${dateStr}.xlsx`;
    } else if (baseName) {
      targetFileName = `${baseName}_PROCESSED.xlsx`;
    }

    XLSX.writeFile(wb, targetFileName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Indihome Only
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Rekonsiliasi BCA / Bank
            </span>
          </div>
          <h1 className="font-display text-headline-lg text-slate-900 font-bold mt-1.5 flex items-center gap-2.5">
            <FileSpreadsheet className="text-rose-600" size={28} />
            <span>Converter Status Pembayaran Indihome</span>
          </h1>
          <p className="font-body-md text-slate-500 text-xs sm:text-sm mt-0.5">
            Ekstraksi otomatis informasi tagihan Indihome dari file upload konsolidasi status transaksi bank (Nomor Jastel, Nama, Periode, Amount, Admin, Total).
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportExcel(false)}
              className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
            >
              <Download size={16} />
              <span>Download Converted Excel (.xlsx)</span>
            </button>
            {summary.totalFailed > 0 && (
              <button
                onClick={() => handleExportExcel(true)}
                className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-100 transition-all flex items-center gap-1.5"
                title="Download hanya transaksi yang gagal untuk tindak lanjut cepat"
              >
                <AlertTriangle size={15} />
                <span>Download Gagal ({summary.totalFailed})</span>
              </button>
            )}
            <button
              onClick={handleReset}
              className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Reset dan Upload File Baru"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Upload Zone (Visible when no file, or collapsible) */}
      {!summary && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-white
            ${processing ? 'border-blue-400 bg-blue-50/30' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/50'}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".xlsx, .xls"
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-2xs">
              {processing ? (
                <RefreshCw size={28} className="animate-spin text-blue-600" />
              ) : (
                <UploadCloud size={30} />
              )}
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {processing ? 'Sedang Memproses Data Excel...' : 'Upload File Status Transaksi Indihome'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tarik & lepas file <span className="font-mono font-semibold text-slate-700">.xlsx</span> dari BCA / Bank (Consolidated Multiple Bill Payment) ke area ini, atau klik tombol di bawah.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                <FileSpreadsheet size={16} />
                <span>Pilih File Excel</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-4">
              <span>• Auto Ekstraksi 7 Komponen Tagihan</span>
              <span>• Rekonsiliasi Sukses vs Gagal</span>
              <span>• Instant Client-Side Processing</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold">Terjadi Kesalahan:</strong> {error}
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Main Content Area (Once Processed) */}
      {summary && (
        <div className="space-y-6">
          {/* File Meta Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <FileCheckIcon size={18} />
              </div>
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span>{fileName}</span>
                  <span className="text-[11px] text-slate-500 font-normal">({fileSize})</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Sheet Sumber: <strong className="text-slate-700">{detectedSheet}</strong> • Dikonversi ke:{' '}
                  <strong className="text-emerald-700 font-semibold">Indihome Payment Processed</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} />
                <span>Ganti File</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
            </div>
          </div>

          {/* 4 Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Transaksi */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Transaksi</span>
                <Layers size={16} className="text-blue-600" />
              </div>
              <div className="font-display text-2xl font-bold text-slate-900 mt-2 font-mono">
                {summary.totalCount.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Data mentah berhasil diekstraksi
              </div>
            </div>

            {/* Sukses */}
            <div className="bg-white border border-emerald-200/80 rounded-xl p-4 shadow-2xs bg-gradient-to-br from-white to-emerald-50/20">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-bold">
                <span>Berhasil (Success)</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="font-display text-2xl font-bold text-emerald-700 mt-2 font-mono">
                {summary.totalSuccess.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-emerald-800/80 font-mono font-semibold mt-1">
                {formatRupiahUI(summary.successAmount)}
              </div>
            </div>

            {/* Gagal */}
            <div className={`
              border rounded-xl p-4 shadow-2xs transition-all
              ${summary.totalFailed > 0 ? 'bg-rose-50/30 border-rose-200' : 'bg-white border-slate-200/80'}
            `}>
              <div className="flex items-center justify-between text-rose-700 text-xs font-bold">
                <span>Gagal (Failed)</span>
                <XCircle size={16} className="text-rose-600" />
              </div>
              <div className="font-display text-2xl font-bold text-rose-700 mt-2 font-mono">
                {summary.totalFailed.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-rose-800 font-mono font-semibold mt-1">
                {formatRupiahUI(summary.failedAmount)}
              </div>
            </div>

            {/* Grand Total Realisasi */}
            <div className="bg-white border border-blue-200/80 rounded-xl p-4 shadow-2xs bg-gradient-to-br from-white to-blue-50/30">
              <div className="flex items-center justify-between text-blue-700 text-xs font-bold">
                <span>Grand Total Realisasi</span>
                <DollarSign size={16} className="text-blue-600" />
              </div>
              <div className="font-display text-xl sm:text-2xl font-black text-blue-800 mt-2 font-mono truncate">
                {formatRupiahUI(summary.sumTotal)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Pokok: {formatRupiahUI(summary.sumAmount)}
              </div>
            </div>
          </div>

          {/* Status Breakdown Summary Table Widget */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <FileSpreadsheet className="text-blue-600" size={16} />
                <span>Tabel Ringkasan Status Transaksi (Summary Table Rekonsiliasi)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Otomatis dimasukkan ke hasil Excel</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Trx Status</th>
                    <th className="py-2.5 px-3 text-right">Jumlah Transaksi</th>
                    <th className="py-2.5 px-3 text-right">Proporsi</th>
                    <th className="py-2.5 px-3 text-right">Total Amount (IDR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {Object.keys(summary.statusSummary).sort().map((st) => {
                    const item = summary.statusSummary[st];
                    const pct = summary.totalCount > 0 ? ((item.count / summary.totalCount) * 100).toFixed(1) : 0;
                    const isSuccess = /success/i.test(st);
                    const isFailed = /fail/i.test(st);

                    return (
                      <tr key={st} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-sans font-semibold">
                          <span className={`
                            px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1
                            ${isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                            ${isFailed ? 'bg-rose-50 text-rose-700 border border-rose-200' : ''}
                            ${!isSuccess && !isFailed ? 'bg-slate-100 text-slate-700' : ''}
                          `}>
                            {isSuccess && <CheckCircle2 size={12} />}
                            {isFailed && <XCircle size={12} />}
                            <span>{st}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                          {item.count.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 font-sans">
                          {pct}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatRupiahExcel(item.totalAmount)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Summary Grand Total */}
                  <tr className="bg-slate-100/70 font-bold border-t border-slate-300">
                    <td className="py-2.5 px-3 text-slate-900 font-sans uppercase">Grand Total</td>
                    <td className="py-2.5 px-3 text-right text-slate-900">
                      {summary.totalCount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans text-slate-600">100%</td>
                    <td className="py-2.5 px-3 text-right text-blue-700 font-black">
                      {formatRupiahExcel(summary.sumTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Preview Table Section */}
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => { setStatusFilter('ALL'); setPage(1); }}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
                    ${statusFilter === 'ALL' 
                      ? 'bg-slate-900 text-white shadow-2xs' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}
                  `}
                >
                  <span>Semua Transaksi</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
                    {dataRows.length}
                  </span>
                </button>

                <button
                  onClick={() => { setStatusFilter('SUCCESS'); setPage(1); }}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
                    ${statusFilter === 'SUCCESS' 
                      ? 'bg-emerald-600 text-white shadow-2xs' 
                      : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'}
                  `}
                >
                  <CheckCircle2 size={13} />
                  <span>Sukses</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
                    {summary.totalSuccess}
                  </span>
                </button>

                <button
                  onClick={() => { setStatusFilter('FAILED'); setPage(1); }}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
                    ${statusFilter === 'FAILED' 
                      ? 'bg-rose-600 text-white shadow-2xs' 
                      : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'}
                  `}
                >
                  <XCircle size={13} />
                  <span>Gagal</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-mono">
                    {summary.totalFailed}
                  </span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Jastel, Nama, No. Telepon, Periode..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-3">Nomor Jastel (Key 1)</th>
                    <th className="py-3 px-3">No. Telepon</th>
                    <th className="py-3 px-3">Nama Pelanggan</th>
                    <th className="py-3 px-3">No. Tagihan</th>
                    <th className="py-3 px-3">Periode</th>
                    <th className="py-3 px-3 text-right">Tagihan (Pokok)</th>
                    <th className="py-3 px-3 text-right">Admin</th>
                    <th className="py-3 px-3 text-right">Total Bayar</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, idx) => {
                      const absoluteIdx = (page - 1) * limit + idx + 1;
                      const isSuccess = row._isSuccess;
                      const isFailed = row._isFailed;

                      return (
                        <tr key={row._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-400 font-normal">
                            {absoluteIdx}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {row['Billing Key 1'] || '-'}
                          </td>
                          <td className="py-3 px-3 text-blue-700 font-semibold select-all">
                            {row['PHONE NO'] || '-'}
                          </td>
                          <td className="py-3 px-3 font-sans font-bold text-slate-800 max-w-[220px] truncate" title={row['NAME']}>
                            {row['NAME'] || '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {row['BILL NUMBER'] || '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {row['PERIOD'] || '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700">
                            {formatRupiahUI(row.AMOUNT)}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-500">
                            {row.ADMIN > 0 ? formatRupiahUI(row.ADMIN) : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-blue-700">
                            {formatRupiahUI(row.TOTAL)}
                          </td>
                          <td className="py-3 px-3 text-center font-sans">
                            <span className={`
                              px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1
                              ${isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                              ${isFailed ? 'bg-rose-50 text-rose-700 border border-rose-200' : ''}
                              ${!isSuccess && !isFailed ? 'bg-slate-100 text-slate-700' : ''}
                            `}>
                              {isSuccess && <CheckCircle2 size={11} />}
                              {isFailed && <XCircle size={11} />}
                              <span>{row._rawStatus || row._normalizedStatus}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400 font-sans">
                        Tidak ada data transaksi yang cocok dengan filter atau pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredRows.length}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FileCheckIcon(props) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}
