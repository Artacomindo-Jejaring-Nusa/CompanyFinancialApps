import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  CreditCard, 
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
  FileSpreadsheet
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';
import { exportToCSV } from '../utils/exporter';

export default function PaymentMonitoringPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'ALL';

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Modals
  const [payModalItem, setPayModalItem] = useState(null);
  const [bulkPayModalOpen, setBulkPayModalOpen] = useState(false);

  // Form states for Single Mark as Paid
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules(page, limit);
  }, [currentTab, page, limit, search]);

  const fetchSchedules = async (p = page, l = limit) => {
    setLoading(true);
    try {
      let statusParam = currentTab === 'ALL' ? '' : currentTab;
      const res = await api.get(`/payment-schedules?status=${statusParam}&search=${search}&page=${p}&limit=${l}`);
      if (res.success) {
        setSchedules(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error("Failed to load schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
    setSelectedIds([]);
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSchedules(1, limit);
  };

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleExportReport = () => {
    if (!schedules.length) {
      alert('Tidak ada data tagihan untuk diexport');
      return;
    }

    const exportRows = schedules.map((item) => ({
      'Periode Tagihan': item.period,
      'Nama Layanan': item.service?.service_name || '',
      'Provider': item.service?.provider?.provider_name || '',
      'Pelanggan': item.service?.customer?.customer_name || '',
      'Circuit ID (CID)': item.service?.cid || '',
      'Site ID': item.service?.site_id || '',
      'Site / Lokasi': item.service?.site_name || item.service?.location || '',
      'Jatuh Tempo': item.due_date ? new Date(item.due_date).toLocaleDateString('id-ID') : '',
      'Nominal Tagihan (IDR)': item.amount || 0,
      'Sisa Tagihan (IDR)': item.remaining_amount || 0,
      'Status Pembayaran': item.status,
      'Tanggal Bayar': item.paid_date ? new Date(item.paid_date).toLocaleDateString('id-ID') : '-',
      'No Referensi Bayar': item.payment_reference || '-',
    }));

    exportToCSV(exportRows, null, `Laporan_Tagihan_${currentTab}`);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = schedules
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

  const openPayModal = (item) => {
    setPayModalItem(item);
    setPaymentAmount(item.remaining_amount || item.amount);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRef('');
    setPaymentNotes('');
  };

  const handleSinglePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        schedule_id: payModalItem.id,
        payment_date: paymentDate,
        payment_amount: parseFloat(paymentAmount),
        payment_reference: paymentRef,
        payment_method: paymentMethod,
        notes: paymentNotes,
      };

      const res = await api.post('/payment-schedules/mark-as-paid', payload);
      if (res.success) {
        setPayModalItem(null);
        fetchSchedules(page, limit);
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
        payment_reference: paymentRef,
        payment_method: paymentMethod,
        notes: paymentNotes,
      };

      const res = await api.post('/payment-schedules/bulk-mark-as-paid', payload);
      if (res.success) {
        setBulkPayModalOpen(false);
        setSelectedIds([]);
        fetchSchedules(page, limit);
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
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">PAID</span>;
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

  // Check Grace Period condition
  const isGracePeriodActive = (currentTab === 'OVERDUE' || currentTab === 'DUE_TODAY' || currentTab === 'DUE_SOON') && total === 0 && !loading;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">Single Inbox Payment Monitoring</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Monitoring jadwal jatuh tempo, histori transaksi, serta pemrosesan pembayaran tunggal maupun bulk.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <FileSpreadsheet size={16} />
            <span>Export Laporan (Excel/CSV)</span>
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setBulkPayModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-2"
            >
              <CheckSquare size={16} />
              <span>Mark {selectedIds.length} Selected as Paid</span>
            </button>
          )}
        </div>
      </div>

      {/* Grace Period Notification Banner */}
      {isGracePeriodActive && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="font-bold text-emerald-900 text-sm">🎉 Fitur Grace Period Aktif: Semua Tagihan FO Bulan Ini Telah Lunas!</div>
              <div className="text-emerald-700 text-xs mt-0.5">
                Tidak ada sisa tagihan untuk kategori ini. Sistem otomatis berpindah ke jadwal tagihan periode bulan depan (UPCOMING).
              </div>
            </div>
          </div>
          <button
            onClick={() => handleTabChange('ALL')}
            className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-lg hover:bg-emerald-800 transition-colors shrink-0"
          >
            Lihat Tagihan Bulan Depan →
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-outline-variant/40 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All Schedules' },
          { key: 'DUE_TODAY', label: 'Due Today' },
          { key: 'DUE_SOON', label: 'Due Soon (7 Days)' },
          { key: 'OVERDUE', label: 'Overdue' },
          { key: 'PAID', label: 'Paid' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`
              px-4 py-2 font-label-md text-label-md font-semibold border-b-2 whitespace-nowrap transition-colors
              ${currentTab === tab.key 
                ? 'border-blue-600 text-blue-600 bg-blue-50/60 rounded-t-lg font-bold' 
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Controls */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search contract, CID, or service name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Schedules Table */}
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
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          selectedIds.length > 0 &&
                          selectedIds.length === schedules.filter((s) => s.status !== 'PAID').length
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                    </th>
                    <th className="py-3.5 px-4">Period</th>
                    <th className="py-3.5 px-4">Service & Provider</th>
                    <th className="py-3.5 px-4">CID & Site</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4 text-right">Remaining Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {schedules.length > 0 ? (
                    schedules.map((item) => (
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
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {item.period}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-[14px] leading-tight">{item.service?.service_name}</div>
                          <div className="text-[12px] text-slate-500 font-medium mt-0.5">{item.service?.provider?.provider_name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-semibold text-[13px] text-slate-900 tracking-tight leading-tight select-all">
                            {item.service?.cid || '-'}
                          </div>
                          <div className="text-[12px] text-slate-500 font-normal leading-snug mt-0.5">
                            {item.service?.site_name || item.service?.location}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                          {new Date(item.due_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-[14px]">
                          {formatIDR(item.remaining_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.status !== 'PAID' ? (
                            <button
                              onClick={() => openPayModal(item)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-2xs"
                            >
                              Mark as Paid
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                        No payment schedules found for the selected tab.
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

      {/* Single Mark As Paid Modal */}
      {payModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Record Payment</h3>
              <button onClick={() => setPayModalItem(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 border border-slate-200">
              <div className="font-bold text-slate-900">{payModalItem.service?.service_name}</div>
              <div>Period: <span className="font-mono">{payModalItem.period}</span> | CID: <span className="font-mono">{payModalItem.service?.cid}</span></div>
              <div className="text-blue-600 font-bold">Remaining Total: {formatIDR(payModalItem.remaining_amount)}</div>
            </div>

            <form onSubmit={handleSinglePaymentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800">Payment Amount (IDR)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono font-semibold text-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800">Payment Reference / Bank Transfer No.</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRX-BCA-99881122"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Virtual Account">Virtual Account</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash / Cheque">Cash / Cheque</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-800">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional payment notes..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setPayModalItem(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  {submitting ? 'Saving...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Mark As Paid Modal */}
      {bulkPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Bulk Payment ({selectedIds.length} Items)</h3>
              <button onClick={() => setBulkPayModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBulkPaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Batch Payment Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BATCH-TRX-202608"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Virtual Account">Virtual Account</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setBulkPayModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
                >
                  {submitting ? 'Processing...' : 'Bulk Mark as Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
