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
      'Distribution Center (DC)': 'DC Balaraja',
      'Provider': 'Biznet Networks',
      'HPP / Tarif Dasar (IDR)': 6756757,
      'PPN 11% (IDR)': 743243,
      'Biaya Charge / Admin Bank (IDR)': 6500,
      'Total Pembayaran (IDR)': 7506500,
      'Nama Pemilik Rekening': 'PT Sumber Alfaria Trijaya Tbk',
      'Lokasi Toko / Alamat': 'Jl. Bendungan Hilir No. 45, Jakarta Pusat',
      'Tgl Jatuh Tempo (1-31)': 25,
      'Siklus Penagihan': 'MONTHLY',
    },
    {
      'Circuit ID (CID)': '1782909962',
      'Nama Toko / Layanan': 'ALFAMART ALAM SUTERA',
      'Site ID': '1M44',
      'Distribution Center (DC)': 'DC Cikokol',
      'Provider': 'Oxygen',
      'HPP / Tarif Dasar (IDR)': 7657658,
      'PPN 11% (IDR)': 842342,
      'Biaya Charge / Admin Bank (IDR)': 2500,
      'Total Pembayaran (IDR)': 8502500,
      'Nama Pemilik Rekening': 'PT Sumber Alfaria Trijaya Tbk',
      'Lokasi Toko / Alamat': 'Jl. Alam Sutera Boulevard, Tangerang',
      'Tgl Jatuh Tempo (1-31)': 15,
      'Siklus Penagihan': 'MONTHLY',
    },
    {
      'Circuit ID (CID)': '# PETUNJUK PENGISIAN (Baris ini tidak akan masuk ke database):',
      'Nama Toko / Layanan': 'Nama toko ritel / sirkuit FO (Wajib)',
      'Site ID': 'ID site lokasi toko (Opsional)',
      'Distribution Center (DC)': 'Nama induk DC pengelola toko',
      'Provider': 'Sesuai vendor FO (Biznet/Telkom/Oxygen/Astinet)',
      'HPP / Tarif Dasar (IDR)': 'Harga pokok dasar tanpa pajak (Contoh: 6756757)',
      'PPN 11% (IDR)': 'Pajak PPN 11% (Contoh: 743243 atau kosongkan untuk hitung otomatis)',
      'Biaya Charge / Admin Bank (IDR)': 'Biaya charge admin bank / VA (Contoh: 6500 / 2500 / 500 / 0)',
      'Total Pembayaran (IDR)': 'Total realisasi bayar = HPP + PPN + Admin (Contoh: 7506500)',
      'Nama Pemilik Rekening': 'Nama pemegang akun/rekening',
      'Lokasi Toko / Alamat': 'Kota / Alamat lengkap toko',
      'Tgl Jatuh Tempo (1-31)': 'Angka tanggal jatuh tempo (1 s/d 31)',
      'Siklus Penagihan': 'MONTHLY / YEARLY / QUARTERLY',
    }
  ];

  if (format === 'xlsx') {
    exportToExcel(templateRows, 'Template_Import_Services_FO_Financial');
  } else {
    exportToCSV(templateRows, null, 'Template_Import_Services_FO_Financial');
  }
}

/**
 * Download ready-to-fill Provider / Vendor Import Template (.xlsx or .csv)
 */
export function downloadProviderTemplate(format = 'xlsx') {
  const templateRows = [
    {
      'Provider Code': 'PROV-BIZNET',
      'Provider Name': 'PT Midplaza Prima (Biznet Networks)',
      'Contact Person': 'Enterprise Account Manager',
      'Email': 'billing@biznetnetworks.com',
      'Phone': '021-57998888',
      'Address': 'MidPlaza 2 Bldg, 8th Fl, Jl. Jend. Sudirman Kav 10-11, Jakarta',
      'Status': 'ACTIVE',
    },
    {
      'Provider Code': 'PROV-TELKOM',
      'Provider Name': 'PT Telkom Indonesia (Persero) Tbk',
      'Contact Person': 'Corporate Customer Care',
      'Email': 'corporate@telkom.co.id',
      'Phone': '1500250',
      'Address': 'Telkom Landmark Tower, Jl. Gatot Subroto, Jakarta Selatan',
      'Status': 'ACTIVE',
    },
    {
      'Provider Code': 'PROV-IFORTE',
      'Provider Name': 'PT iForte Solusi Infotek',
      'Contact Person': 'Finance & Billing Support',
      'Email': 'billing@iforte.co.id',
      'Phone': '021-23586300',
      'Address': 'Menara BCA Lt. 39, Grand Indonesia, Jakarta Pusat',
      'Status': 'ACTIVE',
    },
    {
      'Provider Code': '# PETUNJUK PENGISIAN (Baris ini tidak akan diimpor):',
      'Provider Name': 'Nama lengkap vendor / provider (Wajib)',
      'Contact Person': 'Nama PIC / Divisi Kontak',
      'Email': 'Email penagihan / invoice vendor',
      'Phone': 'Nomor telepon / call center vendor',
      'Address': 'Alamat kantor vendor',
      'Status': 'ACTIVE atau INACTIVE',
    }
  ];

  if (format === 'xlsx') {
    exportToExcel(templateRows, 'Template_Import_Providers_Vendors');
  } else {
    exportToCSV(templateRows, null, 'Template_Import_Providers_Vendors');
  }
}

/**
 * Download ready-to-fill Customer Import Template (.xlsx or .csv)
 */
export function downloadCustomerTemplate(format = 'xlsx') {
  const templateRows = [
    {
      'Customer Code': 'CUST-ALFA',
      'Customer Name': 'PT Sumber Alfaria Trijaya Tbk (Alfamart)',
      'Contact': 'Operation & IT Infrastructure Support',
      'Notes': 'Pemegang kontrak tagihan jaringan toko ritel Alfamart',
      'Status': 'ACTIVE',
    },
    {
      'Customer Code': 'CUST-ARTA',
      'Customer Name': 'PT Artacom Jaya Nusantara',
      'Contact': 'Internal Finance Support',
      'Notes': 'Entitas internal holding & operational company',
      'Status': 'ACTIVE',
    },
    {
      'Customer Code': '# PETUNJUK PENGISIAN (Baris ini tidak akan diimpor):',
      'Customer Name': 'Nama resmi perusahaan pelanggan (Wajib)',
      'Contact': 'Kontak PIC / Divisi',
      'Notes': 'Catatan tambahan keterangan pelanggan',
      'Status': 'ACTIVE atau INACTIVE',
    }
  ];

  if (format === 'xlsx') {
    exportToExcel(templateRows, 'Template_Import_Customers');
  } else {
    exportToCSV(templateRows, null, 'Template_Import_Customers');
  }
}

