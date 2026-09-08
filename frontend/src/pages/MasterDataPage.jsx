import React, { useEffect, useState } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { 
  Building2, 
  Plus, 
  Database, 
  CheckCircle2, 
  X,
  Layers,
  Search,
  Server,
  Edit3,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  UploadCloud,
  FileText,
  Loader2,
  RefreshCw,
  Truck,
  CheckSquare
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';
import { 
  exportToExcel, 
  exportToCSV, 
  downloadProviderTemplate, 
  downloadCustomerTemplate 
} from '../utils/exporter';

export default function MasterDataPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'CUSTOMERS';

  const [customers, setCustomers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [cPage, setCPage] = useState(1);
  const [cLimit, setCLimit] = useState(10);

  const [pPage, setPPage] = useState(1);
  const [pLimit, setPLimit] = useState(10);

  // Customer Modal Form (Create & Edit)
  const [cModalOpen, setCModalOpen] = useState(false);
  const [cEditing, setCEditing] = useState(null);
  const [cForm, setCForm] = useState({ customer_code: '', customer_name: '', contact: '', notes: '', status: 'ACTIVE' });

  // Provider Modal Form (Create & Edit)
  const [pModalOpen, setPModalOpen] = useState(false);
  const [pEditing, setPEditing] = useState(null);
  const [pForm, setPForm] = useState({ provider_code: '', provider_name: '', contact: '', email: '', phone: '', address: '', status: 'ACTIVE' });

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'CUSTOMER'|'PROVIDER', item }

  // Bulk Import Modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTargetType, setBulkTargetType] = useState('PROVIDER'); // 'PROVIDER' or 'CUSTOMER'
  const [importFileName, setImportFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, fail: 0, total: 0 });

  const [submitting, setSubmitting] = useState(false);

  // Search state
  const [masterSearch, setMasterSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/customers?limit=1000'),
        api.get('/providers?limit=1000'),
      ]);
      setCustomers(cRes.data || []);
      setProviders(pRes.data || []);
    } catch (err) {
      console.error("Failed to load master data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  // --- CUSTOMER CRUD ---
  const openAddCustomer = () => {
    setCEditing(null);
    setCForm({ customer_code: '', customer_name: '', contact: '', notes: '', status: 'ACTIVE' });
    setCModalOpen(true);
  };

  const openEditCustomer = (c) => {
    setCEditing(c);
    setCForm({
      customer_code: c.customer_code || '',
      customer_name: c.customer_name || '',
      contact: c.contact || '',
      notes: c.notes || '',
      status: c.status || 'ACTIVE',
    });
    setCModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (cEditing) {
        const res = await api.put(`/customers/${cEditing.id}`, cForm);
        if (res.success) {
          setCModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/customers', cForm);
        if (res.success) {
          setCModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  // --- PROVIDER CRUD ---
  const openAddProvider = () => {
    setPEditing(null);
    setPForm({ provider_code: '', provider_name: '', contact: '', email: '', phone: '', address: '', status: 'ACTIVE' });
    setPModalOpen(true);
  };

  const openEditProvider = (p) => {
    setPEditing(p);
    setPForm({
      provider_code: p.provider_code || '',
      provider_name: p.provider_name || '',
      contact: p.contact || '',
      email: p.email || '',
      phone: p.phone || '',
      address: p.address || '',
      status: p.status || 'ACTIVE',
    });
    setPModalOpen(true);
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (pEditing) {
        const res = await api.put(`/providers/${pEditing.id}`, pForm);
        if (res.success) {
          setPModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/providers', pForm);
        if (res.success) {
          setPModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save provider');
    } finally {
      setSubmitting(false);
    }
  };

  // --- DELETE CONFIRMATION HANDLER ---
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const { type, item } = deleteTarget;
      let endpoint = '';
      if (type === 'CUSTOMER') endpoint = `/customers/${item.id}`;
      else if (type === 'PROVIDER') endpoint = `/providers/${item.id}`;

      const res = await api.delete(endpoint);
      if (res.success) {
        setDeleteTarget(null);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete entry');
    } finally {
      setSubmitting(false);
    }
  };

  // --- EXPORT MASTER DATA ---
  const handleExportProviders = (format = 'xlsx') => {
    if (!providers.length) {
      alert('Tidak ada data provider untuk diexport');
      return;
    }
    const rows = providers.map((p) => ({
      'Provider Code': p.provider_code,
      'Provider Name': p.provider_name,
      'Contact Person': p.contact || '-',
      'Email': p.email || '-',
      'Phone': p.phone || '-',
      'Address': p.address || '-',
      'Status': p.status || 'ACTIVE',
      'Created At': p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : '-',
    }));

    if (format === 'xlsx') {
      exportToExcel(rows, 'Master_Data_Providers_Vendors');
    } else {
      exportToCSV(rows, null, 'Master_Data_Providers_Vendors');
    }
  };

  const handleExportCustomers = (format = 'xlsx') => {
    if (!customers.length) {
      alert('Tidak ada data customer untuk diexport');
      return;
    }
    const rows = customers.map((c) => ({
      'Customer Code': c.customer_code,
      'Customer Name': c.customer_name,
      'Contact': c.contact || '-',
      'Notes': c.notes || '-',
      'Status': c.status || 'ACTIVE',
      'Created At': c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID') : '-',
    }));

    if (format === 'xlsx') {
      exportToExcel(rows, 'Master_Data_Customers');
    } else {
      exportToCSV(rows, null, 'Master_Data_Customers');
    }
  };

  // --- BULK IMPORT (EXCEL & CSV) HANDLERS ---
  const openBulkImportModal = (targetType) => {
    setBulkTargetType(targetType);
    setImportFileName('');
    setParsedRows([]);
    setImportProgress(0);
    setImportStats({ success: 0, fail: 0, total: 0 });
    setBulkModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawJsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Filter out template instructions
        const validRows = rawJsonRows.filter((row) => {
          const firstVal = String(Object.values(row)[0] || '').trim();
          const secondVal = String(Object.values(row)[1] || '').trim();
          if (firstVal.startsWith('#') || firstVal.toLowerCase().includes('petunjuk') || secondVal.toLowerCase().includes('petunjuk')) {
            return false;
          }
          return firstVal.length > 0 || secondVal.length > 0;
        });

        if (!validRows.length) {
          alert('Tidak ada baris data valid yang ditemukan pada file.');
          return;
        }

        setParsedRows(validRows);
      } catch (err) {
        alert('Gagal membaca file Excel/CSV: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const executeBulkImport = async () => {
    if (!parsedRows.length) return;
    setImporting(true);
    setImportProgress(0);

    let successCount = 0;
    let failCount = 0;
    const totalCount = parsedRows.length;

    for (let i = 0; i < totalCount; i++) {
      const row = parsedRows[i];

      try {
        if (bulkTargetType === 'PROVIDER') {
          const code = String(row['Provider Code'] || row['Kode Provider'] || row['Kode'] || row['provider_code'] || `PROV-${Date.now()}-${i}`).trim();
          const name = String(row['Provider Name'] || row['Nama Provider'] || row['Nama Vendor'] || row['Provider'] || row['provider_name'] || '').trim();
          const contact = String(row['Contact Person'] || row['Contact'] || row['Kontak'] || row['contact'] || '').trim();
          const email = String(row['Email'] || row['email'] || '').trim();
          const phone = String(row['Phone'] || row['Telepon'] || row['No Telp'] || row['phone'] || '').trim();
          const address = String(row['Address'] || row['Alamat'] || row['address'] || '').trim();
          const status = String(row['Status'] || row['status'] || 'ACTIVE').trim().toUpperCase();

          if (name) {
            // Check if provider already exists in current list
            const existing = providers.find((p) => p.provider_code === code || p.provider_name.toLowerCase() === name.toLowerCase());
            if (existing) {
              await api.put(`/providers/${existing.id}`, {
                provider_code: code,
                provider_name: name,
                contact: contact || existing.contact,
                email: email || existing.email,
                phone: phone || existing.phone,
                address: address || existing.address,
                status: status || existing.status,
              });
            } else {
              await api.post('/providers', {
                provider_code: code,
                provider_name: name,
                contact,
                email,
                phone,
                address,
                status: status || 'ACTIVE',
              });
            }
            successCount++;
          } else {
            failCount++;
          }
        } else if (bulkTargetType === 'CUSTOMER') {
          const code = String(row['Customer Code'] || row['Kode Customer'] || row['Kode'] || row['customer_code'] || `CUST-${Date.now()}-${i}`).trim();
          const name = String(row['Customer Name'] || row['Nama Customer'] || row['Nama Pelanggan'] || row['customer_name'] || '').trim();
          const contact = String(row['Contact'] || row['Kontak'] || row['contact'] || '').trim();
          const notes = String(row['Notes'] || row['Catatan'] || row['notes'] || '').trim();
          const status = String(row['Status'] || row['status'] || 'ACTIVE').trim().toUpperCase();

          if (name) {
            const existing = customers.find((c) => c.customer_code === code || c.customer_name.toLowerCase() === name.toLowerCase());
            if (existing) {
              await api.put(`/customers/${existing.id}`, {
                customer_code: code,
                customer_name: name,
                contact: contact || existing.contact,
                notes: notes || existing.notes,
                status: status || existing.status,
              });
            } else {
              await api.post('/customers', {
                customer_code: code,
                customer_name: name,
                contact,
                notes,
                status: status || 'ACTIVE',
              });
            }
            successCount++;
          } else {
            failCount++;
          }
        }
      } catch (err) {
        console.error(`Import error row ${i + 1}:`, err);
        failCount++;
      }

      setImportProgress(Math.round(((i + 1) / totalCount) * 100));
      setImportStats({ success: successCount, fail: failCount, total: totalCount });
    }

    setImporting(false);
    await fetchData();
  };

  // Client-side search filtering
  const sLower = masterSearch.trim().toLowerCase();
  const filteredCustomers = sLower
    ? customers.filter((c) =>
        (c.customer_code || '').toLowerCase().includes(sLower) ||
        (c.customer_name || '').toLowerCase().includes(sLower) ||
        (c.contact || '').toLowerCase().includes(sLower)
      )
    : customers;

  const filteredProviders = sLower
    ? providers.filter((p) =>
        (p.provider_code || '').toLowerCase().includes(sLower) ||
        (p.provider_name || '').toLowerCase().includes(sLower) ||
        (p.contact || '').toLowerCase().includes(sLower) ||
        (p.email || '').toLowerCase().includes(sLower)
      )
    : providers;

  // Paginated Slices
  const paginatedCustomers = filteredCustomers.slice((cPage - 1) * cLimit, cPage * cLimit);
  const cTotalPages = Math.ceil(filteredCustomers.length / cLimit) || 1;

  const paginatedProviders = filteredProviders.slice((pPage - 1) * pLimit, pPage * pLimit);
  const pTotalPages = Math.ceil(filteredProviders.length / pLimit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg text-slate-900 font-bold">Master Data Management</h1>
          <p className="font-body-md text-body-md text-slate-500">Pusat konfigurasi referensi utama untuk Customers dan Provider Layanan.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { key: 'CUSTOMERS', label: 'Customers (Perusahaan Pelanggan)', count: customers.length },
          { key: 'PROVIDERS', label: 'Providers (Vendor / Principal)', count: providers.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors
              ${(activeTab === tab.key || (activeTab === 'SERVICE_TYPES' && tab.key === 'CUSTOMERS')) 
                ? 'border-blue-600 text-blue-600 bg-blue-50/60 rounded-t-lg font-bold' 
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
            `}
          >
            <span>{tab.label}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder={activeTab === 'CUSTOMERS' ? 'Search customer code, name, contact...' : 'Search provider code, name, email...'}
          value={masterSearch}
          onChange={(e) => { setMasterSearch(e.target.value); setCPage(1); setPPage(1); }}
          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* 1. CUSTOMERS TAB */}
      {(activeTab === 'CUSTOMERS' || activeTab === 'SERVICE_TYPES') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">Data entitas perusahaan pemegang kontrak tagihan (Alfamart, Artacom, dll). <span className="font-bold text-slate-700">{filteredCustomers.length} data</span></p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => openBulkImportModal('CUSTOMER')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                title="Import massal data customer dari Excel atau CSV"
              >
                <FileSpreadsheet size={15} />
                <span>Bulk Import (Excel/CSV)</span>
              </button>

              <button
                onClick={() => handleExportCustomers('xlsx')}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                title="Export daftar customer ke file Excel"
              >
                <Download size={14} className="text-emerald-600" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={openAddCustomer}
                className="px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus size={15} />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
            {loading ? (
              <div className="p-6">
                <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                  <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                </div>
                <TableSkeleton rows={5} cols={5} />
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Customer Name</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {paginatedCustomers.length > 0 ? (
                      paginatedCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.customer_code}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{c.customer_name}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{c.contact || '-'}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{c.status}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditCustomer(c)}
                                className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Edit Customer"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'CUSTOMER', item: c })}
                                className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Customer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                          Tidak ada data customer yang sesuai dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <Pagination
                  currentPage={cPage}
                  totalPages={cTotalPages}
                  totalItems={filteredCustomers.length}
                  limit={cLimit}
                  onPageChange={(p) => setCPage(p)}
                  onLimitChange={(l) => { setCLimit(l); setCPage(1); }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. PROVIDERS TAB */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">Data vendor penyedia layanan jaringan, cloud hosting, dan lisensi (Biznet, Telkom, AWS, Google, dll). <span className="font-bold text-slate-700">{filteredProviders.length} data</span></p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => openBulkImportModal('PROVIDER')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                title="Import massal daftar vendor/provider dari file Excel atau CSV"
              >
                <FileSpreadsheet size={15} />
                <span>Bulk Import (Excel/CSV)</span>
              </button>

              <button
                onClick={() => handleExportProviders('xlsx')}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                title="Export daftar provider ke file Excel"
              >
                <Download size={14} className="text-emerald-600" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => handleExportProviders('csv')}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                title="Export daftar provider ke file CSV"
              >
                <FileText size={14} className="text-blue-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={openAddProvider}
                className="px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus size={15} />
                <span>Add Provider</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
            {loading ? (
              <div className="p-6">
                <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                  <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                </div>
                <TableSkeleton rows={5} cols={6} />
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Provider Name</th>
                      <th className="py-3.5 px-4">Contact Person</th>
                      <th className="py-3.5 px-4">Email & Phone</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {paginatedProviders.length > 0 ? (
                      paginatedProviders.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.provider_code}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{p.provider_name}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{p.contact || '-'}</td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                            <div>{p.email || '-'}</div>
                            <div className="text-slate-500 font-mono mt-0.5">{p.phone || '-'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{p.status}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditProvider(p)}
                                className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Edit Provider"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'PROVIDER', item: p })}
                                className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Provider"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                          Tidak ada data provider yang sesuai dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <Pagination
                  currentPage={pPage}
                  totalPages={pTotalPages}
                  totalItems={filteredProviders.length}
                  limit={pLimit}
                  onPageChange={(p) => setPPage(p)}
                  onLimitChange={(l) => { setPLimit(l); setPPage(1); }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* --- BULK IMPORT MODAL (EXCEL & CSV) --- */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Bulk Import {bulkTargetType === 'PROVIDER' ? 'Providers / Vendors' : 'Customers'}
                  </h3>
                  <p className="text-xs text-slate-500">Mendukung format file Microsoft Excel (.xlsx) dan CSV (.csv)</p>
                </div>
              </div>
              <button 
                onClick={() => !importing && setBulkModalOpen(false)} 
                disabled={importing}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
              {/* Download Template Step */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Download size={14} className="text-blue-600" />
                    <span>Langkah 1: Unduh Format Template Standar</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gunakan template resmi agar susunan kolom sesuai dengan struktur database.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => bulkTargetType === 'PROVIDER' ? downloadProviderTemplate('xlsx') : downloadCustomerTemplate('xlsx')}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    <span>Template (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => bulkTargetType === 'PROVIDER' ? downloadProviderTemplate('csv') : downloadCustomerTemplate('csv')}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileText size={14} className="text-blue-600" />
                    <span>Template (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div>
                <div className="font-bold text-slate-900 text-xs mb-1.5">
                  Langkah 2: Upload File Excel (.xlsx) atau CSV (.csv)
                </div>
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                  <UploadCloud size={32} className="text-slate-400 mb-2" />
                  <span className="font-bold text-slate-800 text-xs">
                    {importFileName ? `File Terpilih: ${importFileName}` : 'Klik untuk memilih file Excel / CSV'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Format didukung: .xlsx, .xls, .csv
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={importing}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Parsed Data Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Preview Data Siap Impor: {parsedRows.length} baris data</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Menampilkan 5 baris pertama</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-48">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          {Object.keys(parsedRows[0]).slice(0, 5).map((k) => (
                            <th key={k} className="py-2 px-3 whitespace-nowrap">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {parsedRows.slice(0, 5).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {Object.values(row).slice(0, 5).map((v, cIdx) => (
                              <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap text-slate-700">{String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress Bar during execution */}
              {importing && (
                <div className="space-y-1.5 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin text-blue-600" />
                      <span>Sedang memproses impor ke database ({importProgress}%)...</span>
                    </span>
                    <span>{importStats.success + importStats.fail} / {importStats.total}</span>
                  </div>
                  <div className="w-full h-2.5 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-150 rounded-full"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completion Stats Summary */}
              {!importing && importStats.total > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800">
                    Impor selesai! Berhasil: {importStats.success}, Gagal: {importStats.fail} dari total {importStats.total} data.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                disabled={importing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={executeBulkImport}
                disabled={importing || !parsedRows.length}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <CheckSquare size={14} />
                    <span>Mulai Impor ({parsedRows.length} Data)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal (CREATE & EDIT) */}
      {cModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {cEditing ? `Edit Customer: ${cEditing.customer_name}` : 'Add Customer'}
              </h3>
              <button onClick={() => setCModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Customer Code *</label>
                <input type="text" required placeholder="CUST-001" value={cForm.customer_code} onChange={(e) => setCForm({ ...cForm, customer_code: e.target.value })} className="w-full border rounded-lg p-2 mt-1 font-mono font-bold" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Customer Name *</label>
                <input type="text" required placeholder="PT Sumber Alfaria Trijaya Tbk" value={cForm.customer_name} onChange={(e) => setCForm({ ...cForm, customer_name: e.target.value })} className="w-full border rounded-lg p-2 mt-1 font-semibold" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Contact</label>
                <input type="text" placeholder="08123456789" value={cForm.contact} onChange={(e) => setCForm({ ...cForm, contact: e.target.value })} className="w-full border rounded-lg p-2 mt-1" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Status</label>
                <select value={cForm.status} onChange={(e) => setCForm({ ...cForm, status: e.target.value })} className="w-full border rounded-lg p-2 mt-1">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setCModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provider Modal (CREATE & EDIT) */}
      {pModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {pEditing ? `Edit Provider: ${pEditing.provider_name}` : 'Add Provider'}
              </h3>
              <button onClick={() => setPModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProvider} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Provider Code *</label>
                <input type="text" required placeholder="PROV-001" value={pForm.provider_code} onChange={(e) => setPForm({ ...pForm, provider_code: e.target.value })} className="w-full border rounded-lg p-2 mt-1 font-mono font-bold" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Provider Name *</label>
                <input type="text" required placeholder="Biznet Networks" value={pForm.provider_name} onChange={(e) => setPForm({ ...pForm, provider_name: e.target.value })} className="w-full border rounded-lg p-2 mt-1 font-semibold" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Contact Person</label>
                <input type="text" placeholder="Enterprise Account Manager" value={pForm.contact} onChange={(e) => setPForm({ ...pForm, contact: e.target.value })} className="w-full border rounded-lg p-2 mt-1 font-medium" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Email & Phone</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input type="email" placeholder="billing@provider.com" value={pForm.email} onChange={(e) => setPForm({ ...pForm, email: e.target.value })} className="border rounded-lg p-2 text-xs" />
                  <input type="text" placeholder="021-57998888" value={pForm.phone} onChange={(e) => setPForm({ ...pForm, phone: e.target.value })} className="border rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-800">Address</label>
                <input type="text" placeholder="Alamat kantor vendor / gedung" value={pForm.address} onChange={(e) => setPForm({ ...pForm, address: e.target.value })} className="w-full border rounded-lg p-2 mt-1" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Status</label>
                <select value={pForm.status} onChange={(e) => setPForm({ ...pForm, status: e.target.value })} className="w-full border rounded-lg p-2 mt-1">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setPModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                  {submitting ? 'Saving...' : 'Save Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={24} />
              <h3 className="font-bold text-slate-900 text-base">Confirm Deletion</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data master ini?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                {submitting ? 'Deleting...' : 'Delete Master Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
