import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Search, 
  Layers, 
  Edit3, 
  Trash2, 
  Eye,
  X, 
  ChevronRight,
  Building2,
  Calendar,
  Globe,
  Cloud,
  Laptop,
  Server,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  MapPin,
  Store,
  FileSpreadsheet,
  Upload,
  FileUp,
  FileText,
  Download,
  HelpCircle,
  Info
} from 'lucide-react';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';
import { exportToCSV, exportToExcel, downloadImportTemplate } from '../utils/exporter';

export default function ServicesPage({ defaultCategory = 'ALL' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState(defaultCategory);

  // Advanced Filters
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCycle, setFilterCycle] = useState('');

  // Column Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Dropdown options
  const [customers, setCustomers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  // Create & Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedTypeSchema, setSelectedTypeSchema] = useState([]);
  const [formData, setFormData] = useState({
    service_name: '',
    service_type_id: '',
    customer_id: '',
    provider_id: '',
    cid: '',
    site_id: '',
    site_name: '',
    location: '',
    contract_number: '',
    billing_cycle: 'MONTHLY',
    due_day: 25,
    amount: '',
    start_date: new Date().toISOString().split('T')[0],
    pic: '',
    notes: '',
    status: 'ACTIVE',
    attributes: {},
  });

  // Bulk Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [parsedImportRows, setParsedImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Detail View Modal
  const [detailItem, setDetailItem] = useState(null);

  // Delete Modal
  const [deleteItem, setDeleteItem] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCategoryFilter(defaultCategory);
    setPage(1);
  }, [defaultCategory]);

  useEffect(() => {
    fetchServices(page, limit);
    fetchOptions();
  }, [search, page, limit, categoryFilter, filterCustomer, filterProvider, filterStatus, filterCycle, sortField, sortOrder]);

  const fetchServices = async (p = page, l = limit) => {
    setLoading(true);
    try {
      let queryParams = `search=${encodeURIComponent(search)}&page=${p}&limit=500`;
      if (filterCustomer) queryParams += `&customer_id=${filterCustomer}`;
      if (filterProvider) queryParams += `&provider_id=${filterProvider}`;
      if (filterStatus) queryParams += `&status=${filterStatus}`;

      const res = await api.get(`/services?${queryParams}`);
      if (res.success) {
        let fetchedData = res.data || [];

        // Client-side text search filter across all fields
        if (search && search.trim().length > 0) {
          const sLower = search.trim().toLowerCase();
          fetchedData = fetchedData.filter((s) => {
            const name = (s.service_name || '').toLowerCase();
            const cid = (s.cid || '').toLowerCase();
            const siteId = (s.site_id || '').toLowerCase();
            const loc = (s.location || '').toLowerCase();
            const dc = (s.site_name || s.attributes?.dc_name || '').toLowerCase();
            const provider = (s.provider?.provider_name || '').toLowerCase();
            const customer = (s.customer?.customer_name || '').toLowerCase();
            const contract = (s.contract_number || '').toLowerCase();

            return (
              name.includes(sLower) ||
              cid.includes(sLower) ||
              siteId.includes(sLower) ||
              loc.includes(sLower) ||
              dc.includes(sLower) ||
              provider.includes(sLower) ||
              customer.includes(sLower) ||
              contract.includes(sLower)
            );
          });
        }
        
        // Category filtering logic
        if (categoryFilter === 'INTERNET') {
          fetchedData = fetchedData.filter((s) => 
            [3, 4].includes(s.service_type_id) || 
            ['Fiber Optic Dedicated', 'VSAT Satellite'].includes(s.service_type?.name)
          );
        } else if (categoryFilter === 'HOSTING') {
          fetchedData = fetchedData.filter((s) => 
            [5, 6].includes(s.service_type_id) || 
            ['Cloud VPS & Hosting', 'Data Center Co-location'].includes(s.service_type?.name)
          );
        } else if (categoryFilter === 'SOFTWARE') {
          fetchedData = fetchedData.filter((s) => 
            [7].includes(s.service_type_id) || 
            ['Software SaaS License'].includes(s.service_type?.name)
          );
        }

        if (filterCycle) {
          fetchedData = fetchedData.filter((s) => s.billing_cycle === filterCycle);
        }

        // Apply Sorting
        fetchedData.sort((a, b) => {
          let aVal = a[sortField];
          let bVal = b[sortField];

          if (sortField === 'customer_name') {
            aVal = a.customer?.customer_name || '';
            bVal = b.customer?.customer_name || '';
          } else if (sortField === 'provider_name') {
            aVal = a.provider?.provider_name || '';
            bVal = b.provider?.provider_name || '';
          } else if (sortField === 'service_type_name') {
            aVal = a.service_type?.name || '';
            bVal = b.service_type?.name || '';
          }

          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = (bVal || '').toLowerCase();
          }

          if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        // Apply Pagination Slice
        setTotal(fetchedData.length);
        const startIndex = (p - 1) * l;
        const paginatedData = fetchedData.slice(startIndex, startIndex + l);

        setServices(paginatedData);
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [cRes, pRes, stRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/providers?limit=100'),
        api.get('/service-types'),
      ]);
      setCustomers(cRes.data || []);
      setProviders(pRes.data || []);
      setServiceTypes(stRes.data || []);
    } catch (err) {
      console.error("Failed to load options:", err);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={13} className="text-blue-600 font-bold" />
      : <ArrowDown size={13} className="text-blue-600 font-bold" />;
  };

  const resetFilters = () => {
    setSearch('');
    setFilterCustomer('');
    setFilterProvider('');
    setFilterStatus('');
    setFilterCycle('');
    setSortField('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchServices(1, limit);
  };

  const handleCategoryChange = (cat) => {
    setCategoryFilter(cat);
    setPage(1);
  };

  const handleServiceTypeChange = (e) => {
    const typeId = e.target.value;
    const st = serviceTypes.find((item) => item.id == typeId);
    setFormData({ ...formData, service_type_id: typeId, attributes: {} });
    if (st && st.attribute_schema) {
      setSelectedTypeSchema(st.attribute_schema);
    } else {
      setSelectedTypeSchema([]);
    }
  };

  const handleAttributeChange = (name, value) => {
    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        [name]: value,
      },
    });
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      service_name: '',
      service_type_id: '',
      customer_id: '',
      provider_id: '',
      cid: '',
      site_id: '',
      site_name: '',
      location: '',
      contract_number: '',
      billing_cycle: 'MONTHLY',
      due_day: 25,
      amount: '',
      start_date: new Date().toISOString().split('T')[0],
      pic: '',
      notes: '',
      status: 'ACTIVE',
      attributes: {},
    });
    setSelectedTypeSchema([]);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      service_name: item.service_name || '',
      service_type_id: item.service_type_id || '',
      customer_id: item.customer_id || '',
      provider_id: item.provider_id || '',
      cid: item.cid || '',
      site_id: item.site_id || '',
      site_name: item.site_name || '',
      location: item.location || '',
      contract_number: item.contract_number || '',
      billing_cycle: item.billing_cycle || 'MONTHLY',
      due_day: item.due_day || 25,
      amount: item.amount || '',
      start_date: item.start_date ? item.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
      pic: item.pic || '',
      notes: item.notes || '',
      status: item.status || 'ACTIVE',
      attributes: item.attributes || {},
    });

    const st = serviceTypes.find((st) => st.id === item.service_type_id);
    if (st && st.attribute_schema) {
      setSelectedTypeSchema(st.attribute_schema);
    } else {
      setSelectedTypeSchema([]);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        service_type_id: parseInt(formData.service_type_id),
        customer_id: parseInt(formData.customer_id),
        provider_id: parseInt(formData.provider_id),
        due_day: parseInt(formData.due_day),
        amount: parseFloat(formData.amount),
        start_date: new Date(formData.start_date).toISOString(),
      };

      if (editingItem) {
        const res = await api.put(`/services/${editingItem.id}`, payload);
        if (res.success) {
          setModalOpen(false);
          fetchServices(page, limit);
        }
      } else {
        const res = await api.post('/services', payload);
        if (res.success) {
          setModalOpen(false);
          fetchServices(page, limit);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteItem) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/services/${deleteItem.id}`);
      if (res.success) {
        setDeleteItem(null);
        fetchServices(page, limit);
      }
    } catch (err) {
      alert(err.message || 'Failed to archive service');
    } finally {
      setSubmitting(false);
    }
  };

  // --- BULK IMPORT HANDLERS (SUPPORTS .XLSX & .CSV) ---
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

        // Parse to JSON array of objects
        const rawJsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Filter out instruction rows (rows starting with # or containing PETUNJUK)
        const validRows = rawJsonRows.filter((row) => {
          const firstVal = String(Object.values(row)[0] || '').trim();
          const secondVal = String(Object.values(row)[1] || '').trim();
          if (firstVal.startsWith('#') || firstVal.toLowerCase().includes('petunjuk') || secondVal.toLowerCase().includes('petunjuk')) {
            return false;
          }
          return firstVal.length > 0 || secondVal.length > 0;
        });

        setParsedImportRows(validRows);
      } catch (err) {
        alert('Gagal membaca file Excel/CSV: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const executeBulkImport = async () => {
    if (!parsedImportRows.length) return;
    setImporting(true);
    setImportProgress(0);

    // Fetch latest fresh options from backend API
    let latestCust = customers;
    let latestProv = providers;
    let latestTypes = serviceTypes;

    try {
      const [cRes, pRes, tRes] = await Promise.all([
        api.get('/customers'),
        api.get('/providers'),
        api.get('/service-types'),
      ]);
      if (cRes.success && cRes.data?.length) latestCust = cRes.data;
      if (pRes.success && pRes.data?.length) latestProv = pRes.data;
      if (tRes.success && tRes.data?.length) latestTypes = tRes.data;
    } catch (e) {
      console.error("Error loading master options for import:", e);
    }

    const defaultStId = latestTypes[0]?.id || 1;
    const defaultCustId = latestCust.find((c) => c.customer_name.toLowerCase().includes('alfa'))?.id || latestCust[0]?.id || 1;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < parsedImportRows.length; i++) {
      const row = parsedImportRows[i];

      const cid = String(row['Circuit ID (CID)'] || row['cid'] || row['CID'] || `CID-${Date.now()}-${i}`).trim();
      const serviceName = String(row['Nama Toko / Layanan'] || row['service_name'] || row['Nama Toko'] || `FO Service ${i+1}`).trim();
      const siteId = String(row['Site ID'] || row['site_id'] || '').trim();
      const providerNameInput = String(row['Provider'] || row['provider_name'] || 'Biznet Networks').trim();
      const dcName = String(row['Distribution Center (DC)'] || row['dc_name'] || 'DC Balaraja').trim();
      const location = String(row['Lokasi Toko / Alamat'] || row['location'] || row['Alamat'] || '').trim();
      const amountVal = parseFloat(String(row['Biaya FO Bulanan (IDR)'] || row['amount'] || '7500000').replace(/[^0-9.]/g, '')) || 7500000;
      const dueDayVal = parseInt(String(row['Tgl Jatuh Tempo (1-31)'] || row['due_day'] || '25').replace(/[^0-9]/g, '')) || 25;

      let providerObj = latestProv.find((p) => p.provider_name.toLowerCase().includes(providerNameInput.toLowerCase()));
      let providerId = providerObj ? providerObj.id : (latestProv[0]?.id || 1);

      // Auto-create provider if not found in DB
      if (!providerObj && providerNameInput) {
        try {
          const newProvRes = await api.post('/providers', {
            provider_code: `PROV-${Date.now()}-${i}`,
            provider_name: providerNameInput,
            status: 'ACTIVE',
          });
          if (newProvRes.success && newProvRes.data?.id) {
            providerId = newProvRes.data.id;
            latestProv.push(newProvRes.data);
          }
        } catch (e) {
          console.warn("Could not auto-create provider, using fallback:", e);
        }
      }

      const payload = {
        service_name: serviceName,
        service_type_id: defaultStId,
        customer_id: defaultCustId,
        provider_id: providerId,
        cid: cid,
        site_id: siteId,
        site_name: dcName,
        location: location,
        contract_number: `CTR-IMP-${Date.now()}-${i}`,
        billing_cycle: 'MONTHLY',
        due_day: dueDayVal,
        amount: amountVal,
        start_date: new Date().toISOString(),
        status: 'ACTIVE',
        attributes: { dc_name: dcName },
      };

      try {
        const res = await api.post('/services', payload);
        if (res.success) successCount++;
        else failCount++;
      } catch (err) {
        failCount++;
      }

      setImportProgress(Math.round(((i + 1) / parsedImportRows.length) * 100));
    }

    setImporting(false);
    setImportModalOpen(false);
    setParsedImportRows([]);
    setImportFileName('');
    alert(`Bulk Import Selesai!\n✅ ${successCount} Layanan & Jadwal Tagihan Berhasil Ditambahkan.\n❌ ${failCount} Gagal.`);
    fetchServices(1, limit);
  };

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const handleExportServices = () => {
    if (!services.length) {
      alert('Tidak ada data sirkuit/layanan untuk diexport');
      return;
    }

    const exportRows = services.map((item) => ({
      'Circuit ID (CID)': item.cid || '-',
      'Nama Layanan / Toko': item.service_name || '',
      'Tipe Service': item.service_type?.name || '',
      'Provider': item.provider?.provider_name || '',
      'Pelanggan': item.customer?.customer_name || '',
      'Site ID': item.site_id || '-',
      'Distribution Center (DC)': item.attributes?.dc_name || item.site_name || '-',
      'Lokasi / Alamat': item.location || '-',
      'Siklus Tagihan': item.billing_cycle || 'MONTHLY',
      'Tgl Jatuh Tempo': item.due_day || 25,
      'Biaya Bulanan (IDR)': item.amount || 0,
      'Status': item.status,
    }));

    exportToExcel(exportRows, `Export_Layanan_${categoryFilter}`);
  };

  const headerInfo = getHeaderInfo();

  function getHeaderInfo() {
    switch (categoryFilter) {
      case 'INTERNET':
        return {
          title: 'Tagihan Internet & FO Outlets (Alfamart / DC)',
          desc: 'Tabel khusus pemantauan sirkuit FO per toko, Site ID, Distribution Center (DC), dan lokasi.',
        };
      case 'HOSTING':
        return {
          title: 'Tagihan Hosting & Cloud Infrastructure',
          desc: 'Manajemen terpisah untuk tagihan server VPS, Cloud Infrastructure (AWS, GCP, Biznet GIO), dan Co-location.',
        };
      case 'SOFTWARE':
        return {
          title: 'Tagihan Software & Lisensi SaaS',
          desc: 'Manajemen terpisah untuk lisensi perangkat lunak & aplikasi SaaS (Google Workspace, Office 365, Zoom).',
        };
      default:
        return {
          title: 'Semua Services & Subscriptions Registry',
          desc: 'Manajemen inventaris lengkap seluruh kewajiban layanan, jaringan, hosting, dan aplikasi.',
        };
    }
  }

  // Dynamic category counts calculation
  const allCount = services.length;
  const internetCount = services.filter((s) => 
    [1, 2, 3, 4].includes(s.service_type_id) || 
    ['FO-GSM', 'DUAL-GSM', 'Fiber Optic Dedicated', 'VSAT Satellite'].includes(s.service_type?.name)
  ).length;
  const hostingCount = services.filter((s) => 
    [5, 6].includes(s.service_type_id) || 
    ['Cloud VPS & Hosting', 'Data Center Co-location'].includes(s.service_type?.name)
  ).length;
  const softwareCount = services.filter((s) => 
    [7].includes(s.service_type_id) || 
    ['Software SaaS License'].includes(s.service_type?.name)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">{headerInfo.title}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">{headerInfo.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white font-semibold text-xs rounded-lg hover:bg-purple-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <Upload size={16} />
            <span>Bulk Import (Excel/CSV)</span>
          </button>
          <button
            onClick={handleExportServices}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {/* Category Tabs Bar - DYNAMIC COUNTS */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'Semua Layanan', icon: Layers, count: total > 0 ? (categoryFilter === 'ALL' ? total : allCount) : 0 },
          { key: 'INTERNET', label: 'Tagihan Internet & FO Toko', icon: Globe, count: categoryFilter === 'INTERNET' ? total : internetCount },
          { key: 'HOSTING', label: 'Tagihan Hosting & Cloud', icon: Cloud, count: categoryFilter === 'HOSTING' ? total : hostingCount },
          { key: 'SOFTWARE', label: 'Tagihan Software & SaaS', icon: Laptop, count: categoryFilter === 'SOFTWARE' ? total : softwareCount },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => handleCategoryChange(tab.key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors rounded-t-lg
                ${categoryFilter === tab.key 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/60 font-bold' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
              `}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Advanced Filter Bar Dropdowns */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter size={15} className="text-blue-600" />
            <span>Filter & Sort Controls</span>
          </div>
          {(filterCustomer || filterProvider || filterStatus || filterCycle || search) && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Text */}
          <div className="relative sm:col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={categoryFilter === 'INTERNET' ? "Search CID, Store Name, Site ID..." : "Search text..."}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Customer Filter */}
          <div>
            <select
              value={filterCustomer}
              onChange={(e) => { setFilterCustomer(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800"
            >
              <option value="">Semua Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.customer_name}</option>
              ))}
            </select>
          </div>

          {/* Provider Filter */}
          <div>
            <select
              value={filterProvider}
              onChange={(e) => { setFilterProvider(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800"
            >
              <option value="">Semua Provider</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.provider_name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>

          {/* Billing Cycle Filter */}
          <div>
            <select
              value={filterCycle}
              onChange={(e) => { setFilterCycle(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800"
            >
              <option value="">Semua Siklus</option>
              <option value="MONTHLY">MONTHLY</option>
              <option value="QUARTERLY">QUARTERLY</option>
              <option value="YEARLY">YEARLY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Dedicated Tables per Category */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
        {loading ? (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
              <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
            </div>
            <TableSkeleton rows={8} cols={7} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* 1. Tailored Header for INTERNET / FO Services */}
                {categoryFilter === 'INTERNET' && (
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200 select-none">
                    <tr>
                      <th onClick={() => handleSort('cid')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>CID (Circuit ID)</span>
                          {renderSortIcon('cid')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('service_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Register Name (Nama Toko / Outlet)</span>
                          {renderSortIcon('service_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('site_id')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Site ID (Alfa/Indo)</span>
                          {renderSortIcon('site_id')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('provider_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Provider FO</span>
                          {renderSortIcon('provider_name')}
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Distribution Center (DC)</th>
                      <th onClick={() => handleSort('location')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Lokasi / Alamat</span>
                          {renderSortIcon('location')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('amount')} className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center justify-end gap-1">
                          <span>Biaya FO Bulanan</span>
                          {renderSortIcon('amount')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('status')} className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center justify-center gap-1">
                          <span>Status</span>
                          {renderSortIcon('status')}
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                )}

                {/* 2. Dedicated Header for HOSTING Services */}
                {categoryFilter === 'HOSTING' && (
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200 select-none">
                    <tr>
                      <th onClick={() => handleSort('service_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Server / Instance Name</span>
                          {renderSortIcon('service_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('customer_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Pelanggan</span>
                          {renderSortIcon('customer_name')}
                        </div>
                      </th>
                      <th className="py-3.5 px-4">IP Address Server</th>
                      <th onClick={() => handleSort('site_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Data Center / Region</span>
                          {renderSortIcon('site_name')}
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Spesifikasi (vCPU/RAM)</th>
                      <th onClick={() => handleSort('provider_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Hosting Provider</span>
                          {renderSortIcon('provider_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('amount')} className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center justify-end gap-1">
                          <span>Biaya Server Bulanan</span>
                          {renderSortIcon('amount')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('status')} className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center justify-center gap-1">
                          <span>Status</span>
                          {renderSortIcon('status')}
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                )}

                {/* 3. Dedicated Header for SOFTWARE SaaS Services */}
                {categoryFilter === 'SOFTWARE' && (
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200 select-none">
                    <tr>
                      <th onClick={() => handleSort('service_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Software / Aplikasi</span>
                          {renderSortIcon('service_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('customer_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Pelanggan</span>
                          {renderSortIcon('customer_name')}
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Account / Tenant ID</th>
                      <th className="py-3.5 px-4">Jumlah Lisensi / Seats</th>
                      <th onClick={() => handleSort('provider_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Vendor SaaS</span>
                          {renderSortIcon('provider_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('amount')} className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center justify-end gap-1">
                          <span>Biaya Lisensi Bulanan</span>
                          {renderSortIcon('amount')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('status')} className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center justify-center gap-1">
                          <span>Status</span>
                          {renderSortIcon('status')}
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                )}

                {/* 4. Dedicated Header for ALL Services */}
                {categoryFilter === 'ALL' && (
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200 select-none">
                    <tr>
                      <th onClick={() => handleSort('service_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Nama Layanan</span>
                          {renderSortIcon('service_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('service_type_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Tipe Service</span>
                          {renderSortIcon('service_type_name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('provider_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Provider</span>
                          {renderSortIcon('provider_name')}
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Detail Identifikasi</th>
                      <th onClick={() => handleSort('due_day')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-1">
                          <span>Siklus & Due</span>
                          {renderSortIcon('due_day')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('amount')} className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center justify-end gap-1">
                          <span>Biaya Bulanan</span>
                          {renderSortIcon('amount')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('status')} className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center justify-center gap-1">
                          <span>Status</span>
                          {renderSortIcon('status')}
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                )}

                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {services.length > 0 ? (
                    services.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Tailored INTERNET Body Row */}
                        {categoryFilter === 'INTERNET' && (
                          <>
                            <td className="py-3.5 px-4 font-mono font-bold text-[13px] text-slate-900 select-all">
                              {item.cid || '-'}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 text-[14px] leading-tight flex items-center gap-1.5">
                                <Store size={14} className="text-blue-600 shrink-0" />
                                <span>{item.service_name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {item.site_id || '-'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {item.provider?.provider_name}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {item.attributes?.dc_name || item.site_name || 'DC Balaraja'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs">
                              {item.location || '-'}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-[14px]">
                              {formatIDR(item.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {item.status}
                              </span>
                            </td>
                          </>
                        )}

                        {/* 2. HOSTING Body Row */}
                        {categoryFilter === 'HOSTING' && (
                          <>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 text-[14px] leading-tight">{item.service_name}</div>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {item.customer?.customer_name}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-[13px] text-blue-600 select-all">
                              {item.attributes?.ip_address || 'Dynamic IP'}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-800">
                              {item.site_name || item.location}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700">
                              {item.attributes?.ram_core || item.attributes?.rack_number || 'Standard Cloud Instance'}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {item.provider?.provider_name}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-[14px]">
                              {formatIDR(item.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {item.status}
                              </span>
                            </td>
                          </>
                        )}

                        {/* 3. SOFTWARE Body Row */}
                        {categoryFilter === 'SOFTWARE' && (
                          <>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 text-[14px] leading-tight">{item.service_name}</div>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {item.customer?.customer_name}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-[13px] text-slate-900 select-all">
                              {item.cid || item.contract_number}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                {item.attributes?.user_seats ? `${item.attributes.user_seats} Seats` : 'Enterprise License'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {item.provider?.provider_name}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-[14px]">
                              {formatIDR(item.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {item.status}
                              </span>
                            </td>
                          </>
                        )}

                        {/* 4. ALL Body Row */}
                        {categoryFilter === 'ALL' && (
                          <>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 text-[14px] leading-tight">{item.service_name}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {item.service_type?.name}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900">{item.provider?.provider_name}</div>
                              <div className="text-[12px] text-slate-500 font-normal">{item.customer?.customer_name}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-semibold text-[13px] text-slate-900 tracking-tight leading-tight select-all">
                                {item.attributes?.ip_address || item.cid || '-'}
                              </div>
                              <div className="text-[12px] text-slate-500 font-normal leading-snug mt-0.5">
                                {item.site_name || item.location}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs">
                              <div className="font-semibold text-slate-800">{item.billing_cycle}</div>
                              <div className="text-slate-500">Tgl {item.due_day}</div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-[14px]">
                              {formatIDR(item.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {item.status}
                              </span>
                            </td>
                          </>
                        )}

                        {/* Actions Column for Full CRUD */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDetailItem(item)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Edit Service"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteItem(item)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Archive / Delete Service"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 font-medium">
                        Tidak ada data tagihan untuk kriteria filter yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              limit={limit}
              onPageChange={(newPage) => setPage(newPage)}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* BULK IMPORT MODAL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileUp className="text-purple-600" size={24} />
                <h3 className="font-bold text-slate-900 text-lg">Bulk Import Layanan & Sirkuit (Excel / CSV)</h3>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Step 1: Download Templates */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-purple-900 text-sm">1. Unduh Template Format Import (Excel / CSV)</div>
                  <div className="text-purple-700 text-xs mt-0.5">Template sudah dilengkapi dengan petunjuk pengisian di dalamnya. Baris petunjuk tidak akan masuk ke database.</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadImportTemplate('xlsx')}
                    className="px-3 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileSpreadsheet size={15} />
                    <span>Download Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadImportTemplate('csv')}
                    className="px-3 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download size={15} />
                    <span>Download CSV (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Database Field Instructions Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Info size={15} className="text-blue-600" />
                  <span>Petunjuk Pengisian Field Database:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="bg-white p-2 border border-slate-200 rounded">
                    <span className="font-bold text-blue-700">Circuit ID (CID)</span>
                    <p className="text-slate-500 font-sans text-[11px] mt-0.5">Nomor sirkuit unik (Contoh: 436651760009988)</p>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded">
                    <span className="font-bold text-blue-700">Nama Toko / Layanan</span>
                    <p className="text-slate-500 font-sans text-[11px] mt-0.5">Nama outlet toko (Contoh: ALFAMART BENDUNGAN HILIR)</p>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded">
                    <span className="font-bold text-blue-700">Site ID</span>
                    <p className="text-slate-500 font-sans text-[11px] mt-0.5">ID site toko ritel (Contoh: 1K72)</p>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded">
                    <span className="font-bold text-blue-700">Provider</span>
                    <p className="text-slate-500 font-sans text-[11px] mt-0.5">Biznet / Telkom / Oxygen / Astinet / MyRepublic</p>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded">
                    <span className="font-bold text-blue-700">Distribution Center</span>
                    <p className="text-slate-500 font-sans text-[11px] mt-0.5">Nama DC pengelola (Contoh: DC Balaraja)</p>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded">
                    <span className="font-bold text-blue-700">Lokasi / Alamat</span>
                    <p className="text-slate-500 font-sans text-[11px] mt-0.5">Kota atau Alamat lengkap toko</p>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded">
                    <span className="font-bold text-blue-700">Biaya FO Bulanan</span>
                    <p className="text-slate-500 font-sans text-[11px] mt-0.5">Angka murni tanpa titik (Contoh: 7500000)</p>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded">
                    <span className="font-bold text-blue-700">Tgl Jatuh Tempo</span>
                    <p className="text-slate-500 font-sans text-[11px] mt-0.5">Angka tanggal 1 s/d 31 (Contoh: 25)</p>
                  </div>
                </div>
              </div>

              {/* Step 3: Upload Excel / CSV File */}
              <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-6 text-center space-y-2 bg-slate-50/50 transition-colors">
                <Upload className="mx-auto text-purple-500" size={32} />
                <div className="font-bold text-slate-800 text-sm">Upload File Excel (.xlsx) atau CSV (.csv) Anda</div>
                <div className="text-[11px] text-slate-500">Mendukung format file .xlsx dan .csv berisi ribuan data sirkuit toko</div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-file-input"
                />
                <label
                  htmlFor="excel-file-input"
                  className="inline-block mt-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-800 font-bold rounded-lg cursor-pointer hover:bg-slate-100 shadow-xs text-xs"
                >
                  Browse File (.xlsx / .csv)...
                </label>
                {importFileName && (
                  <div className="font-mono text-purple-700 font-bold pt-2 text-xs">
                    📄 Selected File: {importFileName} ({parsedImportRows.length} baris valid terdeteksi, baris petunjuk otomatis diabaikan)
                  </div>
                )}
              </div>

              {/* Step 4: Preview Parsed Rows */}
              {parsedImportRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Preview Data Terdeteksi ({parsedImportRows.length} Baris Valid):</span>
                    <span className="text-emerald-600 text-[11px]">Siap Di-import</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold">
                        <tr>
                          <th className="p-2 border-b">CID</th>
                          <th className="p-2 border-b">Nama Toko</th>
                          <th className="p-2 border-b">Site ID</th>
                          <th className="p-2 border-b">Provider</th>
                          <th className="p-2 border-b">DC</th>
                          <th className="p-2 border-b text-right">Biaya Bulanan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {parsedImportRows.slice(0, 50).map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold">{r['Circuit ID (CID)'] || r['cid'] || '-'}</td>
                            <td className="p-2 font-sans font-semibold">{r['Nama Toko / Layanan'] || r['service_name'] || '-'}</td>
                            <td className="p-2 text-blue-700 font-bold">{r['Site ID'] || r['site_id'] || '-'}</td>
                            <td className="p-2 font-sans">{r['Provider'] || r['provider_name'] || '-'}</td>
                            <td className="p-2 font-sans">{r['Distribution Center (DC)'] || r['dc_name'] || '-'}</td>
                            <td className="p-2 text-right font-bold text-slate-900">
                              {formatIDR(r['Biaya FO Bulanan (IDR)'] || r['amount'] || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedImportRows.length > 50 && (
                    <div className="text-[11px] text-slate-500 text-center italic">
                      Menampilkan 50 baris pertama dari total {parsedImportRows.length} baris data.
                    </div>
                  )}
                </div>
              )}

              {/* Progress Indicator */}
              {importing && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between font-semibold text-purple-700">
                    <span>Proses Import Data & Autogenerate Tagihan...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-600 h-full transition-all duration-200" style={{ width: `${importProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!parsedImportRows.length || importing}
                onClick={executeBulkImport}
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>{importing ? `Importing... (${importProgress}%)` : `Proses Import (${parsedImportRows.length} Data)`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Add / Edit Service Modal (CREATE & UPDATE) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-2xl p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-headline-md font-bold text-slate-900">
                {editingItem ? `Edit Service: ${editingItem.service_name}` : 'Register New Service'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-800">Register Name / Nama Toko Alfa *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ALFAMART BENDUNGAN HILIR / ALFAMART ALAM SUTERA"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 focus:ring-1 focus:ring-blue-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800">Service Type & Category *</label>
                  <select
                    required
                    value={formData.service_type_id}
                    onChange={handleServiceTypeChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"
                  >
                    <option value="">Select Service Type...</option>
                    {serviceTypes.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800">Provider FO *</label>
                  <select
                    required
                    value={formData.provider_id}
                    onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"
                  >
                    <option value="">Select Provider...</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.provider_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800">Customer Entity *</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.customer_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800">CID (Circuit ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4366517600078840"
                    value={formData.cid}
                    onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800">Site ID Toko & Distribution Center (DC)</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Site ID (e.g. 1K72)"
                      value={formData.site_id}
                      onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="DC (e.g. DC Balaraja)"
                      value={formData.site_name}
                      onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-800">Lokasi / Alamat Lengkap Toko</label>
                  <input
                    type="text"
                    placeholder="e.g. Jl. Bendungan Hilir No. 45, Jakarta Pusat"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800">Biaya FO Bulanan (IDR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="7500000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono font-bold text-blue-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800">Billing Cycle & Due Day *</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <select
                      value={formData.billing_cycle}
                      onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="QUARTERLY">QUARTERLY</option>
                      <option value="YEARLY">YEARLY</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      placeholder="Due Day (1-31)"
                      value={formData.due_day}
                      onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  {submitting ? 'Saving...' : (editingItem ? 'Update Service' : 'Create & Generate Schedules')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Detail View Modal (READ DETAIL) */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">
                  {detailItem.service_type?.name}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">{detailItem.service_name}</h3>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="text-slate-400 font-medium">CID (Circuit ID)</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{detailItem.cid}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Site ID Toko</div>
                  <div className="font-mono font-bold text-blue-700 mt-0.5">{detailItem.site_id}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Distribution Center (DC)</div>
                  <div className="font-bold text-slate-900 mt-0.5">{detailItem.attributes?.dc_name || detailItem.site_name || 'DC Main'}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Provider FO</div>
                  <div className="font-bold text-slate-900 mt-0.5">{detailItem.provider?.provider_name}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Biaya FO Bulanan</div>
                  <div className="font-mono font-bold text-blue-600 mt-0.5">{formatIDR(detailItem.amount)}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Lokasi / Alamat</div>
                  <div className="font-bold text-slate-900 mt-0.5">{detailItem.location}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete / Archive Modal (DELETE / ARCHIVE) */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={24} />
              <h3 className="font-bold text-slate-900 text-base">Confirm Service Archival</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin mengarsip/menghapus sirkuit FO toko <strong className="text-slate-900">{deleteItem.service_name}</strong> (CID: <span className="font-mono">{deleteItem.cid}</span>)?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                {submitting ? 'Archiving...' : 'Archive Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
