import * as XLSX from 'xlsx';

/**
 * Format any number into standard Indonesian Rupiah format: "Rp. 12.000.000"
 * @param {number|string} val 
 * @returns {string} e.g. "Rp. 12.000.000"
 */
export function formatRupiah(val) {
  if (val === null || val === undefined || val === '') return 'Rp. 0';
  if (typeof val === 'string' && val.trim().startsWith('Rp.')) return val;
  const num = typeof val === 'number' ? val : (parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0);
  return 'Rp. ' + new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Export data array to genuine Microsoft Excel (.xlsx) file with Rupiah formatting
 * @param {Array<Object>} rows Array of objects
 * @param {string} filename Output filename without extension
 */
export function exportToExcel(rows, filename = 'export_report') {
  if (!rows || !rows.length) {
    alert('Tidak ada data untuk di-export');
    return;
  }

  // Ensure all monetary fields are formatted as "Rp. X.XXX.XXX"
  const formattedRows = rows.map(row => {
    const newRow = {};
    Object.keys(row).forEach(key => {
      let val = row[key];
      const isPriceColumn = /IDR|Nominal|Biaya|Sisa|Tarif|Harga|Amount|Tagihan|Total/i.test(key);
      if (isPriceColumn && (typeof val === 'number' || (typeof val === 'string' && !isNaN(val) && val.trim() !== ''))) {
        newRow[key] = formatRupiah(val);
      } else {
        newRow[key] = val;
      }
    });
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');

  // Auto-width for columns
  const max_widths = [];
  formattedRows.forEach(row => {
    Object.keys(row).forEach((key, colIdx) => {
      const valStr = String(row[key] || '');
      max_widths[colIdx] = Math.max(max_widths[colIdx] || key.length, valStr.length);
    });
  });
  worksheet['!cols'] = max_widths.map(w => ({ wch: Math.min(w + 4, 50) }));

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export data to CSV (Excel Compatible with UTF-8 BOM)
 */
export function exportToCSV(rows, headers, filename = 'export_report') {
  if (!rows || !rows.length) {
    alert('Tidak ada data untuk di-export');
    return;
  }

  // Ensure all monetary fields are formatted as "Rp. X.XXX.XXX"
  const formattedRows = rows.map(row => {
    const newRow = {};
    Object.keys(row).forEach(key => {
      let val = row[key];
      const isPriceColumn = /IDR|Nominal|Biaya|Sisa|Tarif|Harga|Amount|Tagihan|Total/i.test(key);
      if (isPriceColumn && (typeof val === 'number' || (typeof val === 'string' && !isNaN(val) && val.trim() !== ''))) {
        newRow[key] = formatRupiah(val);
      } else {
        newRow[key] = val;
      }
    });
    return newRow;
  });

  const headerKeys = Object.keys(formattedRows[0]);
  const headerLabels = headers && headers.length === headerKeys.length ? headers : headerKeys;

  let csvContent = headerLabels.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\n';

  formattedRows.forEach(row => {
    const rowValues = headerKeys.map(key => {
      let val = row[key];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvContent += rowValues.join(',') + '\n';
  });

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download ready-to-fill Import Template (.xlsx or .csv) with Petunjuk Pengisian
 */
export function downloadImportTemplate(format = 'xlsx') {
  const templateRows = [
    {
      'Circuit ID (CID)': '436651760009988',
      'Nama Toko / Layanan': 'ALFAMART BENDUNGAN HILIR',
      'Site ID': '1K72',
      'Provider': 'Biznet Networks',
      'Distribution Center (DC)': 'DC Balaraja',
      'Lokasi Toko / Alamat': 'Jl. Bendungan Hilir No. 45, Jakarta Pusat',
      'Biaya FO Bulanan (IDR)': 7500000,
      'Tgl Jatuh Tempo (1-31)': 25,
    },
    {
      'Circuit ID (CID)': '1782909962',
      'Nama Toko / Layanan': 'ALFAMART ALAM SUTERA',
      'Site ID': '1M44',
      'Provider': 'Oxygen',
      'Distribution Center (DC)': 'DC Cikokol',
      'Lokasi Toko / Alamat': 'Jl. Alam Sutera Boulevard, Tangerang',
      'Biaya FO Bulanan (IDR)': 8500000,
      'Tgl Jatuh Tempo (1-31)': 15,
    },
    {
      'Circuit ID (CID)': '# PETUNJUK PENGISIAN (Baris ini tidak akan masuk ke database):',
      'Nama Toko / Layanan': 'Nama toko ritel (Wajib)',
      'Site ID': 'ID site lokasi toko (Opsional)',
      'Provider': 'Sesuai vendor FO (Biznet/Telkom/Oxygen/Astinet)',
      'Distribution Center (DC)': 'Nama induk DC pengelola toko',
      'Lokasi Toko / Alamat': 'Kota / Alamat lengkap toko',
      'Biaya FO Bulanan (IDR)': 'Angka tanpa titik/koma (Contoh: 7500000)',
      'Tgl Jatuh Tempo (1-31)': 'Angka tanggal 1 s/d 31',
    }
  ];

  if (format === 'xlsx') {
    exportToExcel(templateRows, 'Template_Import_Services_FO');
  } else {
    exportToCSV(templateRows, null, 'Template_Import_Services_FO');
  }
}
