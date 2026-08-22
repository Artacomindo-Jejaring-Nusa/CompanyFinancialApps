import * as XLSX from 'xlsx';

/**
 * Export data array to genuine Microsoft Excel (.xlsx) file
 * @param {Array<Object>} rows Array of objects
 * @param {string} filename Output filename without extension
 */
export function exportToExcel(rows, filename = 'export_report') {
  if (!rows || !rows.length) {
    alert('Tidak ada data untuk di-export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');

  // Auto-width for columns
  const max_widths = [];
  rows.forEach(row => {
    Object.keys(row).forEach((key, colIdx) => {
      const valStr = String(row[key] || '');
      max_widths[colIdx] = Math.max(max_widths[colIdx] || key.length, valStr.length);
    });
  });
  worksheet['!cols'] = max_widths.map(w => ({ wch: Math.min(w + 3, 50) }));

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

  const headerKeys = Object.keys(rows[0]);
  const headerLabels = headers && headers.length === headerKeys.length ? headers : headerKeys;

  let csvContent = headerLabels.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\n';

  rows.forEach(row => {
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
