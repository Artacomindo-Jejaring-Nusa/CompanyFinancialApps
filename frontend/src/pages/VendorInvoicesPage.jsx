import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Receipt, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Filter, 
  CheckSquare, 
  DollarSign, 
  X, 
  Download, 
  FileSpreadsheet,
  Building2,
  FilePlus,
  Eye,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  Tag,
  Store,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';
import { exportToCSV, exportToExcel } from '../utils/exporter';

export default function VendorInvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatusTab = searchParams.get('status') || 'ALL';
  const selectedProviderParam = searchParams.get('provider') || '';

  const [invoices, setInvoices] = useState([]);
  const [allRawInvoices, setAllRawInvoices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeProvider, setActiveProvider] = useState(selectedProviderParam);
  const [selectedIds, setSelectedIds] = useState([]);

  // Sorting
  const [sortField, setSortField] = useState('due_date');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Modals
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [payModalItem, setPayModalItem] = useState(null);
  const [bulkPayModalOpen, setBulkPayModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // Single Pay Form State
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [baseAmount, setBaseAmount] = useState('');
  const [adminFee, setAdminFee] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [fakturPajakInput, setFakturPajakInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');

  // New Incoming Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState({
    provider_id: '',
    customer_id: '',
    service_type_id: '',
    service_name: '',
    vendor_invoice_number: '',
    faktur_pajak_number: '',
    cid: '',
    site_name: '',
    amount: '',
    include_ppn: false,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchInvoices(page, limit);
  }, [currentStatusTab, activeProvider, search, sortField, sortOrder, page, limit]);

  const fetchOptions = async () => {
    try {
      const [pRes, cRes, stRes] = await Promise.all([
        api.get('/providers?limit=100'),
        api.get('/customers?limit=100'),
        api.get('/service-types'),
      ]);
      if (pRes.success) {
        const cleaned = (pRes.data || []).filter(
          (p) => !['PROV-IOH', 'PROV-XL', 'PROV-AWS', 'PROV-GCP', 'PROV-MSF'].includes(p.provider_code)
        );
        setProviders(cleaned);
      }
      if (cRes.success) setCustomers(cRes.data || []);
      if (stRes.success) setServiceTypes(stRes.data || []);
    } catch (err) {
      console.error("Failed to load options:", err);
    }
  };

  const getShortVendorName = (name) => {
    if (!name) return 'Vendor';
    let clean = name.replace(/PT\.?\s*/i, '').trim();
    if (clean.includes('(')) {
      const match = clean.match(/\(([^)]+)\)/);
      if (match) return match[1];
    }
    if (clean.toLowerCase().includes('indihome') || clean.toLowerCase().includes('telkom')) return 'Telkom';
    if (clean.toLowerCase().includes('biznet')) return 'Biznet';
    return clean.split(' ')[0];
  };

  const fetchInvoices = async (p = page, l = limit) => {
    setLoading(true);
    try {
      let statusQuery = currentStatusTab === 'ALL' ? '' : currentStatusTab;
      let queryUrl = `/payment-schedules?status=${statusQuery}&search=${encodeURIComponent(search)}&page=1&limit=500`;
      if (activeProvider) {
        queryUrl += `&provider_id=${activeProvider}`;
      }

      const res = await api.get(queryUrl);
      if (res.success) {
        let list = res.data || [];
        setAllRawInvoices(list);

        // Client search
        if (search && search.trim()) {
          const sLower = search.trim().toLowerCase();
          list = list.filter((item) => {
            const sName = (item.service?.service_name || '').toLowerCase();
            const pName = (item.service?.provider?.provider_name || '').toLowerCase();
            const cid = (item.service?.cid || '').toLowerCase();
            const contract = (item.service?.contract_number || '').toLowerCase();
            const notes = (item.notes || '').toLowerCase();
            const period = (item.period || '').toLowerCase();
            return (
              sName.includes(sLower) ||
              pName.includes(sLower) ||
              cid.includes(sLower) ||
              contract.includes(sLower) ||
              notes.includes(sLower) ||
              period.includes(sLower)
            );
          });
        }

        if (activeProvider) {
          list = list.filter((item) => String(item.service?.provider_id) === String(activeProvider));
        }

        // Apply Sorting
        list.sort((a, b) => {
          let aVal = a[sortField];
          let bVal = b[sortField];

          if (sortField === 'provider_name') {
            aVal = a.service?.provider?.provider_name || '';
            bVal = b.service?.provider?.provider_name || '';
          } else if (sortField === 'service_name') {
            aVal = a.service?.service_name || '';
            bVal = b.service?.service_name || '';
          }

          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = (bVal || '').toLowerCase();
          }

          if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        setTotal(list.length);
        const startIndex = (p - 1) * l;
        setInvoices(list.slice(startIndex, startIndex + l));
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTabChange = (status) => {
    setSearchParams({ status, provider: activeProvider });
    setSelectedIds([]);
    setPage(1);
  };

  const handleProviderFilterChange = (provId) => {
    setActiveProvider(provId);
    setSearchParams({ status: currentStatusTab, provider: provId });
    setSelectedIds([]);
    setPage(1);
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

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleExportInvoices = () => {
    if (!invoices.length) {
      alert('Tidak ada data invoice untuk diexport');
      return;
    }

    const exportRows = (allRawInvoices.length ? allRawInvoices : invoices).map((item) => {
      const notes = item.notes || '';
      const invMatch = notes.match(/No\.?\s*Inv:\s*([^\s|,]+)/i);
      const fakturMatch = notes.match(/Faktur:\s*([^\s|,]+)/i);

      return {
        'No. Invoice Vendor': invMatch ? invMatch[1] : (item.service?.contract_number || '-'),
        'No. Faktur Pajak': fakturMatch ? fakturMatch[1] : '-',
        'Vendor / Provider': item.service?.provider?.provider_name || '',
        'Nama Tagihan': item.service?.service_name || '',
        'Pelanggan': item.service?.customer?.customer_name || '',
        'Circuit ID / Link ID': item.service?.cid || '-',
        'Periode': item.period,
        'Tanggal Jatuh Tempo': item.due_date ? new Date(item.due_date).toLocaleDateString('id-ID') : '',
        'Nominal Tagihan (IDR)': item.amount || 0,
        'Sisa Tagihan (IDR)': item.remaining_amount || 0,
        'Status Pembayaran': item.status,
        'Tanggal Pelunasan': item.payment_date ? new Date(item.payment_date).toLocaleDateString('id-ID') : '-',
        'Catatan / Referensi': item.notes || '-',
      };
    });

    const activeProviderName = providers.find((p) => String(p.id) === String(activeProvider))?.provider_name;
    const filename = activeProviderName 
      ? `Rekap_Invoice_${getShortVendorName(activeProviderName)}_${currentStatusTab}`
      : `Rekap_Invoice_Semua_Vendor_${currentStatusTab}`;

    exportToExcel(exportRows, filename);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = invoices
        .filter((s) => s.status !== 'PAID' && s.status !== 'CANCELLED')
        .map((s) => s.id);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Open Form "+ Catat Invoice Masuk"
  const openInvoiceModal = () => {
    setInvoiceForm({
      provider_id: activeProvider || (providers[0]?.id || ''),
      customer_id: customers[0]?.id || 1,
      service_type_id: serviceTypes[0]?.id || 1,
      service_name: '',
      vendor_invoice_number: '',
      faktur_pajak_number: '',
      cid: '',
      site_name: '',
      amount: '',
      include_ppn: false,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setInvoiceModalOpen(true);
  };

  const handleSaveIncomingInvoice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let rawAmount = parseFloat(invoiceForm.amount) || 0;
      if (invoiceForm.include_ppn) {
        rawAmount = rawAmount * 1.11; // Auto include PPN 11%
      }

      const selectedProv = providers.find((p) => String(p.id) === String(invoiceForm.provider_id));
      const provName = selectedProv ? getShortVendorName(selectedProv.provider_name) : 'Vendor';

      const invoiceServiceName = invoiceForm.service_name.trim() 
        || `Tagihan ${provName} - ${invoiceForm.vendor_invoice_number || 'Ref Baru'}`;

      let notesCombined = `No. Inv: ${invoiceForm.vendor_invoice_number || '-'}`;
      if (invoiceForm.faktur_pajak_number) notesCombined += ` | Faktur: ${invoiceForm.faktur_pajak_number}`;
      if (invoiceForm.notes) notesCombined += ` | Ket: ${invoiceForm.notes}`;

      const servicePayload = {
        service_name: invoiceServiceName,
        service_type_id: parseInt(invoiceForm.service_type_id) || (serviceTypes[0]?.id || 1),
        customer_id: parseInt(invoiceForm.customer_id) || (customers[0]?.id || 1),
        provider_id: parseInt(invoiceForm.provider_id) || (providers[0]?.id || 1),
        cid: invoiceForm.cid || `INV-${invoiceForm.vendor_invoice_number || Date.now()}`,
        site_name: invoiceForm.site_name || 'DC / Kantor Pusat',
        location: invoiceForm.site_name || '-',
        contract_number: invoiceForm.vendor_invoice_number || `CTR-${Date.now()}`,
        billing_cycle: 'MONTHLY',
        due_day: new Date(invoiceForm.due_date).getDate() || 25,
        amount: rawAmount,
        start_date: new Date(invoiceForm.due_date).toISOString(),
        status: 'ACTIVE',
        attributes: {
          vendor_invoice_number: invoiceForm.vendor_invoice_number,
          faktur_pajak_number: invoiceForm.faktur_pajak_number,
          invoice_date: invoiceForm.invoice_date,
        },
      };

      const res = await api.post('/services', servicePayload);
      if (res.success) {
        setInvoiceModalOpen(false);
        alert(`Invoice Masuk dari ${provName} Berhasil Dicatat ke Sistem!`);
        fetchInvoices(1, limit);
      }
    } catch (err) {
      alert(err.message || 'Gagal mencatat invoice masuk');
    } finally {
      setSubmitting(false);
    }
  };

  const openPayModal = (item) => {
    const base = item.remaining_amount || item.amount || 0;
    setPayModalItem(item);
    setBaseAmount(base);
    setAdminFee(0);
    setPaymentAmount(base);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRef('');
    setInvoiceNumberInput('');
    setFakturPajakInput('');
    setPaymentNotes(item.notes || '');
  };

  const handleBaseAmountChange = (val) => {
    setBaseAmount(val);
    const numBase = parseFloat(val) || 0;
    const numFee = parseFloat(adminFee) || 0;
    setPaymentAmount(numBase + numFee);
  };

  const handleAdminFeeChange = (fee) => {
    setAdminFee(fee);
    const numBase = parseFloat(baseAmount) || 0;
    const numFee = parseFloat(fee) || 0;
    setPaymentAmount(numBase + numFee);
  };

  const handleSinglePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let combinedNotes = paymentNotes;
      if (invoiceNumberInput) combinedNotes += ` | No. Inv: ${invoiceNumberInput}`;
      if (fakturPajakInput) combinedNotes += ` | Faktur: ${fakturPajakInput}`;
      if (parseFloat(adminFee) > 0) {
        combinedNotes += ` | Biaya Admin Bank: ${formatIDR(adminFee)}`;
      }

      const payload = {
        schedule_id: payModalItem.id,
        payment_date: paymentDate,
        payment_amount: parseFloat(paymentAmount),
        payment_reference: paymentRef || `TRX-${Date.now()}`,
        payment_method: paymentMethod,
        notes: combinedNotes.trim(),
      };

      const res = await api.post('/payment-schedules/mark-as-paid', payload);
      if (res.success) {
        setPayModalItem(null);
        fetchInvoices(page, limit);
      }
    } catch (err) {
      alert(err.message || 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkPaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        schedule_ids: selectedIds,
        payment_date: paymentDate,
        payment_reference: paymentRef || `BATCH-${Date.now()}`,
        payment_method: paymentMethod,
        notes: paymentNotes.trim(),
      };

      const res = await api.post('/payment-schedules/bulk-mark-as-paid', payload);
      if (res.success) {
        setBulkPayModalOpen(false);
        setSelectedIds([]);
        fetchInvoices(page, limit);
      }
    } catch (err) {
      alert(err.message || 'Bulk payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">LUNAS</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">OVERDUE</span>;
      case 'DUE_TODAY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">DUE TODAY</span>;
      case 'DUE_SOON':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">DUE SOON</span>;
      case 'PARTIALLY_PAID':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">PARTIAL</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">UPCOMING</span>;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Selected vendor details
  const activeVendorObj = providers.find((p) => String(p.id) === String(activeProvider));

  // Statistics calculation for KPI cards
  const totalAmountSum = (allRawInvoices.length ? allRawInvoices : invoices).reduce((sum, item) => sum + (item.remaining_amount || item.amount || 0), 0);
  const unpaidCount = (allRawInvoices.length ? allRawInvoices : invoices).filter((item) => item.status !== 'PAID').length;
  const overdueCount = (allRawInvoices.length ? allRawInvoices : invoices).filter((item) => item.status === 'OVERDUE').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">Tagihan Invoice Masuk Vendor</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Pusat registrasi, verifikasi, dan pemantauan invoice tagihan masuk dari semua vendor mitra (JIP, iForte, Satkom, Parama, Jedi, Biznet, dll).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openInvoiceModal}
            className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <FilePlus size={16} />
            <span>+ Catat Invoice Masuk</span>
          </button>

          <button
            onClick={handleExportInvoices}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <FileSpreadsheet size={16} />
            <span>Export Rekap ({activeProvider ? getShortVendorName(activeVendorObj?.provider_name) : 'Semua'})</span>
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setBulkPayModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white font-semibold text-xs rounded-lg hover:bg-purple-700 transition-colors shadow-xs flex items-center gap-2"
            >
              <CheckSquare size={16} />
              <span>Bayar {selectedIds.length} Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Receipt size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Invoice Terdaftar</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{total} Invoice</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Invoice Belum Lunas / Overdue</div>
            <div className="text-xl font-bold text-rose-700 font-mono mt-0.5">{unpaidCount} ({overdueCount} Overdue)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Nilai Tagihan Terpilih</div>
            <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">{formatIDR(totalAmountSum)}</div>
          </div>
        </div>
      </div>

      {/* Sleek Wrapped Vendor Navigation Pill Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <Building2 size={15} className="text-blue-600" />
            <span>Pilih Vendor Penerbit Invoice:</span>
          </div>
          {activeProvider && (
            <button
              onClick={() => handleProviderFilterChange('')}
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              <X size={13} />
              <span>Tampilkan Semua Vendor</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => handleProviderFilterChange('')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              !activeProvider 
                ? 'bg-blue-600 text-white shadow-2xs font-bold' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>Semua Vendor</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              !activeProvider ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {allRawInvoices.length}
            </span>
          </button>

          {/* Clean Short-named Provider Pills */}
          {providers.map((prov) => {
            const count = allRawInvoices.filter((s) => String(s.service?.provider_id) === String(prov.id)).length;
            const isSelected = String(activeProvider) === String(prov.id);
            const shortName = getShortVendorName(prov.provider_name);

            return (
              <button
                key={prov.id}
                onClick={() => handleProviderFilterChange(isSelected ? '' : String(prov.id))}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs font-bold ring-2 ring-blue-400/40'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{shortName}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white font-bold' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Vendor Banner */}
      {activeVendorObj && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Building2 size={18} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <span>Vendor Terpilih: {activeVendorObj.provider_name}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-100 text-blue-800 font-semibold">{activeVendorObj.provider_code}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-white px-3 py-1 rounded-lg border border-blue-200">
              <span className="text-slate-500">Jumlah Tagihan: </span>
              <span className="font-bold text-blue-700">{total} Invoice</span>
            </div>
            <div className="bg-white px-3 py-1 rounded-lg border border-blue-200">
              <span className="text-slate-500">Total Nominal: </span>
              <span className="font-mono font-bold text-slate-900">{formatIDR(totalAmountSum)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'Semua Status Invoice', count: allRawInvoices.length },
          { key: 'DUE_TODAY', label: 'Jatuh Tempo Hari Ini', count: allRawInvoices.filter((s) => s.status === 'DUE_TODAY').length },
          { key: 'DUE_SOON', label: 'Jatuh Tempo H-7', count: allRawInvoices.filter((s) => s.status === 'DUE_SOON').length },
          { key: 'OVERDUE', label: 'Lewat Jatuh Tempo (Overdue)', count: allRawInvoices.filter((s) => s.status === 'OVERDUE').length },
          { key: 'PAID', label: 'Sudah Lunas (Paid)', count: allRawInvoices.filter((s) => s.status === 'PAID').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleStatusTabChange(tab.key)}
            className={`
              px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 rounded-t-lg
              ${currentStatusTab === tab.key 
                ? 'border-blue-600 text-blue-600 bg-blue-50/60 font-bold' 
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
            `}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
              currentStatusTab === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari nomor invoice vendor, nama layanan, provider, CID, atau nomor faktur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <select
          value={activeProvider}
          onChange={(e) => handleProviderFilterChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800"
        >
          <option value="">Semua Vendor / Provider...</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.provider_name}</option>
          ))}
        </select>
      </div>

      {/* Invoice Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
        {loading ? (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
              <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-28 animate-pulse"></div>
            </div>
            <TableSkeleton rows={7} cols={8} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200 select-none">
                  <tr>
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          selectedIds.length > 0 &&
                          selectedIds.length === invoices.filter((s) => s.status !== 'PAID').length
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                    </th>
                    <th className="py-3.5 px-4">No. Invoice Vendor</th>
                    <th onClick={() => handleSort('provider_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center gap-1">
                        <span>Vendor / Provider</span>
                        {renderSortIcon('provider_name')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('service_name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center gap-1">
                        <span>Peruntukan Tagihan</span>
                        {renderSortIcon('service_name')}
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Periode</th>
                    <th onClick={() => handleSort('due_date')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center gap-1">
                        <span>Jatuh Tempo</span>
                        {renderSortIcon('due_date')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('amount')} className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center justify-end gap-1">
                        <span>Nominal Tagihan</span>
                        {renderSortIcon('amount')}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length > 0 ? (
                    invoices.map((item) => {
                      const notes = item.notes || '';
                      const invMatch = notes.match(/No\.?\s*Inv:\s*([^\s|,]+)/i);
                      const displayInvoiceNum = invMatch ? invMatch[1] : (item.service?.contract_number || '-');

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              disabled={item.status === 'PAID'}
                              checked={selectedIds.includes(item.id)}
                              onChange={() => handleSelectOne(item.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-30"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-700 text-xs select-all">
                            {displayInvoiceNum}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Building2 size={14} className="text-blue-600 shrink-0" />
                              <span>{item.service?.provider?.provider_name || 'Vendor'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                              {item.service?.customer?.customer_name}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-[14px] leading-tight">{item.service?.service_name}</div>
                            <div className="text-[12px] text-slate-500 font-normal mt-0.5">
                              {item.service?.site_name || item.service?.location || '-'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 text-xs">
                            {item.period}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                            {new Date(item.due_date).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-[14px]">
                            {formatIDR(item.remaining_amount || item.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setDetailItem(item)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Lihat Detail Invoice"
                              >
                                <Eye size={15} />
                              </button>

                              {item.status !== 'PAID' ? (
                                <button
                                  onClick={() => openPayModal(item)}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-2xs"
                                >
                                  Bayar
                                </button>
                              ) : (
                                <span className="text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded">Lunas</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                        Tidak ada invoice masuk ditemukan untuk filter ini.
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

      {/* ========================================================= */}
      {/* MODAL 1: CATAT INVOICE MASUK VENDOR                       */}
      {/* ========================================================= */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-2xl p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-display text-headline-md font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="text-blue-600" size={20} />
                  <span>Pencatatan Invoice Masuk dari Vendor</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catat invoice yang baru diterima dari JIP, iForte, Satkom, Parama, Jedi, dll ke daftar kewajiban tagihan.
                </p>
              </div>
              <button onClick={() => setInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveIncomingInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Vendor / Provider */}
                <div>
                  <label className="font-semibold text-slate-800">Vendor / Provider Penerbit Invoice *</label>
                  <select
                    required
                    value={invoiceForm.provider_id}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, provider_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-semibold text-slate-900"
                  >
                    <option value="">Pilih Vendor (JIP, iForte, Satkom, Parama, Jedi, dll)...</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.provider_name}</option>
                    ))}
                  </select>
                </div>

                {/* Customer Entity */}
                <div>
                  <label className="font-semibold text-slate-800">Customer / Entitas Tertagih *</label>
                  <select
                    required
                    value={invoiceForm.customer_id}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.customer_name}</option>
                    ))}
                  </select>
                </div>

                {/* Nomor Invoice Vendor */}
                <div>
                  <label className="font-semibold text-slate-800">Nomor Invoice Vendor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV/JIP/2026/08/0109 atau 8829/IFORTE/08/26"
                    value={invoiceForm.vendor_invoice_number}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, vendor_invoice_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono font-bold text-blue-700"
                  />
                </div>

                {/* Nomor Faktur Pajak */}
                <div>
                  <label className="font-semibold text-slate-800">Nomor Faktur Pajak (Jika Ada)</label>
                  <input
                    type="text"
                    placeholder="e.g. 010.000-26.12345678"
                    value={invoiceForm.faktur_pajak_number}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, faktur_pajak_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                  />
                </div>

                {/* Deskripsi Tagihan */}
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-800">Peruntukan / Nama Tagihan Layanan *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tagihan Sewa FO Trunk Balaraja / Tagihan Bandwidth VSAT Satkomindo"
                    value={invoiceForm.service_name}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, service_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-semibold"
                  />
                </div>

                {/* Tipe Layanan */}
                <div>
                  <label className="font-semibold text-slate-800">Kategori / Tipe Layanan *</label>
                  <select
                    value={invoiceForm.service_type_id}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, service_type_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"
                  >
                    {serviceTypes.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>

                {/* Circuit ID / Site / Link ID */}
                <div>
                  <label className="font-semibold text-slate-800">Circuit ID / Link ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CID-998811 / Site Balaraja"
                    value={invoiceForm.cid}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, cid: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                  />
                </div>

                {/* Tanggal Invoice Diterima */}
                <div>
                  <label className="font-semibold text-slate-800">Tanggal Invoice Diterima *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                  />
                </div>

                {/* Tanggal Jatuh Tempo */}
                <div>
                  <label className="font-semibold text-slate-800">Tanggal Jatuh Tempo Pembayaran *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono font-bold text-rose-700"
                  />
                </div>

                {/* Nominal Tagihan */}
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-800">Nominal Tagihan (IDR) *</label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 15000000"
                      value={invoiceForm.amount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-900 text-sm"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        checked={invoiceForm.include_ppn}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, include_ppn: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span>+ PPN 11%</span>
                    </label>
                  </div>
                </div>

                {/* Catatan Tambahan */}
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-800">Catatan Invoice (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Invoice include potongan restitusi SLA..."
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>{submitting ? 'Menyimpan...' : 'Simpan & Jadwalkan Tagihan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SINGLE MARK AS PAID                             */}
      {/* ========================================================= */}
      {payModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Proses Pembayaran Tagihan</h3>
              <button onClick={() => setPayModalItem(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="bg-blue-50/70 p-3 rounded-lg text-xs space-y-1 border border-blue-100">
              <div className="font-bold text-slate-900 text-[13px]">{payModalItem.service?.service_name}</div>
              <div className="text-slate-600">
                Vendor: <span className="font-bold text-blue-700">{payModalItem.service?.provider?.provider_name}</span> | Periode: <span className="font-mono">{payModalItem.period}</span>
              </div>
              <div className="text-blue-700 font-bold text-sm pt-0.5">
                Total Kewajiban: {formatIDR(payModalItem.remaining_amount || payModalItem.amount)}
              </div>
            </div>

            <form onSubmit={handleSinglePaymentSubmit} className="space-y-3.5 text-xs">
              {/* Payment Date & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800">Tanggal Pembayaran *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-semibold text-slate-800"
                  >
                    <option value="Bank Transfer BCA">Bank Transfer (BCA)</option>
                    <option value="Bank Transfer Mandiri">Bank Transfer (Mandiri)</option>
                    <option value="Bank Transfer BRI">Bank Transfer (BRI)</option>
                    <option value="Bank Transfer BNI">Bank Transfer (BNI)</option>
                    <option value="Virtual Account">Virtual Account</option>
                    <option value="Corporate Credit Card">Corporate Credit Card</option>
                    <option value="Cheque / Giro">Cheque / Giro</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Payment Amount & Admin Fee Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Rincian Nominal Transfer:</span>
                  <span className="text-[11px] text-slate-500 font-medium">Bisa disesuaikan mandiri (opsional)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Base Amount */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Nominal Pokok Tagihan (IDR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={baseAmount}
                      onChange={(e) => handleBaseAmountChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 mt-1 font-mono font-bold text-slate-800"
                    />
                  </div>

                  {/* Admin Fee / Tambahan */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Biaya Admin Bank / Tambahan (IDR)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={adminFee}
                      onChange={(e) => handleAdminFeeChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 mt-1 font-mono font-bold text-amber-700"
                    />
                  </div>
                </div>

                {/* Admin Fee Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-500 mr-1">Preset Admin:</span>
                  {[
                    { label: 'Gratis (Rp 0)', val: 0 },
                    { label: '+ Rp 500 (BI-FAST)', val: 500 },
                    { label: '+ Rp 2.500 (ATM)', val: 2500 },
                    { label: '+ Rp 6.500 (Kliring/Online)', val: 6500 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleAdminFeeChange(preset.val)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        Number(adminFee) === preset.val
                          ? 'bg-amber-600 text-white border-amber-600 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Final Total Amount Box */}
                <div className="p-2.5 bg-blue-600 text-white rounded-lg flex items-center justify-between shadow-xs">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
                      Total Realisasi Pembayaran (IDR)
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5 font-mono">
                      Pokok: {formatIDR(baseAmount || 0)} {Number(adminFee) > 0 ? `+ Admin: ${formatIDR(adminFee)}` : ''}
                    </div>
                  </div>
                  <div className="font-mono text-base sm:text-lg font-black tracking-tight">
                    {formatIDR(paymentAmount || 0)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800">No. Invoice Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-JIP-0089"
                    value={invoiceNumberInput}
                    onChange={(e) => setInvoiceNumberInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800">No. Faktur Pajak</label>
                  <input
                    type="text"
                    placeholder="e.g. 010.000-26.xxx"
                    value={fakturPajakInput}
                    onChange={(e) => setFakturPajakInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800">Nomor Referensi Bank / Bukti Transfer *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRX-BCA-99881122 / NOREK-MANDIRI-4455"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-semibold"
                >
                  <option value="Bank Transfer">Bank Transfer (BCA / Mandiri / BNI)</option>
                  <option value="Virtual Account">Virtual Account</option>
                  <option value="Corporate Credit Card">Corporate Credit Card</option>
                  <option value="Cheque / Giro">Cheque / Giro</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setPayModalItem(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  {submitting ? 'Menyimpan...' : 'Konfirmasi Pelunasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: BULK MARK AS PAID                                */}
      {/* ========================================================= */}
      {bulkPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Pelunasan Massal ({selectedIds.length} Invoice Tagihan)</h3>
              <button onClick={() => setBulkPayModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBulkPaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Tanggal Pembayaran Batch *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Nomor Referensi Batch Transfer *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BATCH-TRX-202608-VENDOR"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-semibold"
                >
                  <option value="Bank Transfer">Bank Transfer (BCA / Mandiri)</option>
                  <option value="Virtual Account">Virtual Account</option>
                  <option value="Cheque / Giro">Cheque / Giro</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setBulkPayModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
                >
                  {submitting ? 'Memproses...' : `Konfirmasi Pelunasan ${selectedIds.length} Tagihan`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: DETAIL TAGIHAN & INVOICE VENDOR                  */}
      {/* ========================================================= */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">
                  {detailItem.service?.provider?.provider_name}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">{detailItem.service?.service_name}</h3>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <div className="text-slate-500 font-medium">Periode Tagihan</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{detailItem.period}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Status Pembayaran</div>
                  <div className="mt-0.5">{getStatusBadge(detailItem.status)}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Tanggal Jatuh Tempo</div>
                  <div className="font-bold text-rose-700 mt-0.5">{new Date(detailItem.due_date).toLocaleDateString('id-ID')}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Total Nominal Tagihan</div>
                  <div className="font-mono font-bold text-blue-700 mt-0.5">{formatIDR(detailItem.amount)}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Circuit ID / Contract</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{detailItem.service?.cid || detailItem.service?.contract_number || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Customer Entitas</div>
                  <div className="font-bold text-slate-900 mt-0.5">{detailItem.service?.customer?.customer_name}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <div className="text-slate-500 font-medium">Catatan / Rincian Invoice</div>
                  <div className="font-mono text-slate-800 text-xs mt-0.5">{detailItem.notes || '-'}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
