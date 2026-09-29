import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Receipt,
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Building2,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Send,
  Layers,
  Calendar,
  DollarSign,
  Tag,
  Paperclip,
  CheckSquare,
  Square,
  Printer
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';
import { exportToExcel } from '../utils/exporter';

export default function HrmsClaimsReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'ALL';

  const [claims, setClaims] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Modals
  const [detailItem, setDetailItem] = useState(null);
  const [disburseModalItem, setDisburseModalItem] = useState(null);
  const [disburseForm, setDisburseForm] = useState({
    disbursed_by: '',
    disbursed_ref: '',
    notes: '',
  });
  const [submittingDisburse, setSubmittingDisburse] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncConfig, setSyncConfig] = useState({
    hrms_base_url: 'http://localhost:8000',
    api_token: '',
  });

  const formatIDR = (val) => {
    if (val === null || val === undefined || val === '') return 'Rp. 0';
    const num = typeof val === 'number' ? val : (parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0);
    return 'Rp. ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num);
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/hrms/summary');
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (e) {
      console.warn('Gagal memuat ringkasan klaim HRMS:', e);
    }
  };

  const fetchClaims = async (targetPage = page, targetLimit = limit) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentTab !== 'ALL') params.append('source_type', currentTab);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('page', targetPage);
      params.append('limit', targetLimit);

      const res = await api.get(`/hrms/claims?${params.toString()}`);
      if (res.success) {
        setClaims(res.data || []);
        if (res.meta) {
          setTotal(res.meta.total || 0);
        }
      }
    } catch (e) {
      console.error('Gagal mengambil daftar klaim HRMS:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchClaims(1, limit);
    setPage(1);
  }, [currentTab, statusFilter, priorityFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClaims(1, limit);
    setPage(1);
  };

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const handleSyncHRMS = async (e) => {
    if (e) e.preventDefault();
    setSyncing(true);
    try {
      const res = await api.post('/hrms/sync', syncConfig);
      if (res.success) {
        alert(`Sinkronisasi berhasil! ${res.data?.synced_count || 0} pengajuan diperbarui dari HRMS.`);
        setSyncModalOpen(false);
        fetchSummary();
        fetchClaims(page, limit);
      }
    } catch (err) {
      alert(err.message || 'Gagal melakukan sinkronisasi dengan HRMS SaaS. Pastikan service HRMS aktif.');
    } finally {
      setSyncing(false);
    }
  };

  const openDisburseModal = (item) => {
    setDisburseModalItem(item);
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setDisburseForm({
      disbursed_by: 'Finance Disbursement Officer',
      disbursed_ref: `DISB-BCA-${dateCode}-${randNum}`,
      notes: `Pencairan dana ${item.reference_no} atas nama ${item.employee_name}`,
    });
  };

  const handleDisburseSubmit = async (e) => {
    e.preventDefault();
    if (!disburseModalItem) return;
    setSubmittingDisburse(true);
    try {
      const res = await api.post(`/hrms/claims/${disburseModalItem.id}/disburse`, disburseForm);
      if (res.success) {
        alert(`Pencairan dana untuk ${disburseModalItem.reference_no} berhasil dicatat.`);
        setDisburseModalItem(null);
        fetchSummary();
        fetchClaims(page, limit);
      }
    } catch (err) {
      alert(err.message || 'Gagal memproses pencairan dana');
    } finally {
      setSubmittingDisburse(false);
    }
  };

  const handleExportExcel = () => {
    if (!claims.length) {
      alert('Tidak ada data klaim untuk diexport');
      return;
    }

    const exportRows = claims.map((item) => ({
      'NO. REFERENSI': item.reference_no,
      'TIPE': item.source_type === 'REIMBURSEMENT' ? 'Reimbursement (Klaim Biaya)' : 'Pengajuan Dana (Kasbon)',
      'NAMA KARYAWAN': item.employee_name,
      'DIVISI': item.department || '-',
      'KEPERLUAN / JUDUL': item.title,
      'DESKRIPSI': item.description || '-',
      'NOMINAL PENGAJUAN': formatIDR(item.amount),
      'PRIORITAS': item.priority || 'Normal',
      'STATUS': item.status,
      'DISETUJUI OLEH': item.approved_by || '-',
      'TGL DISETUJUI': item.approved_at ? new Date(item.approved_at).toLocaleDateString('id-ID') : '-',
      'STATUS PENCAIRAN': item.status === 'DISBURSED' ? 'SUDAH DICAIRKAN' : 'BELUM DICAIRKAN',
      'DICAIRKAN OLEH': item.disbursed_by || '-',
      'REF PENCAIRAN': item.disbursed_ref || '-',
      'TGL DICAIRKAN': item.disbursed_at ? new Date(item.disbursed_at).toLocaleDateString('id-ID') : '-',
      'TANGGAL PENGAJUAN': new Date(item.created_at).toLocaleDateString('id-ID'),
    }));

    exportToExcel(exportRows, `Laporan_Klaim_HRMS_${currentTab}_${new Date().toISOString().slice(0, 10)}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">APPROVED (Siap Cair)</span>;
      case 'DISBURSED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">DISBURSED (Lunas)</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">PENDING APPROVAL</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase tracking-wider">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">High</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Normal</span>;
    }
  };

  const parseJsonSafe = (raw) => {
    if (!raw) return [];
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-headline-lg text-on-surface font-bold">Laporan Klaim & Pengajuan Dana HRMS</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              API HRMS SaaS
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Monitoring, validasi realisasi klaim biaya/reimbursement dan pengajuan kasbon operasional dari aplikasi HRMS Narwasthu Group.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSyncModalOpen(true)}
            className="btn btn-outline flex items-center gap-2 text-xs"
            title="Konfigurasi & Sinkronisasi dengan API HRMS SaaS"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin text-blue-600' : 'text-slate-600'} />
            <span>Sync HRMS</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="btn btn-outline flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn btn-outline flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            <Printer size={15} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="card p-3.5 bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Semua Pengajuan</div>
          <div className="font-mono text-base sm:text-lg font-black text-slate-900 mt-1">
            {formatIDR(summary?.total_amount || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {summary?.total_count || 0} total transaksi
          </div>
        </div>

        <div className="card p-3.5 bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Reimbursement (Klaim)</div>
          <div className="font-mono text-base sm:text-lg font-black text-blue-700 mt-1">
            {formatIDR(summary?.reimbursement_amount || 0)}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5 font-medium">
            {summary?.reimbursement_count || 0} klaim biaya
          </div>
        </div>

        <div className="card p-3.5 bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">Pengajuan Dana (Kasbon)</div>
          <div className="font-mono text-base sm:text-lg font-black text-purple-700 mt-1">
            {formatIDR(summary?.fund_request_amount || 0)}
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5 font-medium">
            {summary?.fund_request_count || 0} pengajuan dana
          </div>
        </div>

        <div className="card p-3.5 bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Menunggu Persetujuan</div>
          <div className="font-mono text-base sm:text-lg font-black text-amber-700 mt-1">
            {formatIDR(summary?.pending_amount || 0)}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5 font-medium">
            {summary?.pending_count || 0} pending review
          </div>
        </div>

        <div className="card p-3.5 bg-white border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Siap Dicairkan</div>
          <div className="font-mono text-base sm:text-lg font-black text-emerald-800 mt-1">
            {formatIDR(summary?.approved_amount || 0)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
            {summary?.approved_count || 0} approved HRD/Ops
          </div>
        </div>

        <div className="card p-3.5 bg-white border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">Sudah Dicairkan</div>
          <div className="font-mono text-base sm:text-lg font-black text-blue-900 mt-1">
            {formatIDR(summary?.disbursed_amount || 0)}
          </div>
          <div className="text-[11px] text-blue-700 mt-0.5 font-medium">
            {summary?.disbursed_count || 0} telah dibayarkan
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card bg-white border border-slate-200/80 shadow-xs rounded-xl overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 pt-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleTabChange('ALL')}
              className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors ${
                currentTab === 'ALL'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Pengajuan ({summary?.total_count || 0})
            </button>
            <button
              onClick={() => handleTabChange('REIMBURSEMENT')}
              className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors ${
                currentTab === 'REIMBURSEMENT'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Klaim Biaya / Reimbursement ({summary?.reimbursement_count || 0})
            </button>
            <button
              onClick={() => handleTabChange('FUND_REQUEST')}
              className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors ${
                currentTab === 'FUND_REQUEST'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengajuan Dana / Kasbon ({summary?.fund_request_count || 0})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono pb-2">
            Total Nilai Tab: <strong className="text-slate-800">{formatIDR(claims.reduce((acc, c) => acc + (c.amount || 0), 0))}</strong>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3 flex-wrap">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari karyawan, no ref, divisi, atau keperluan..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <button type="submit" className="btn btn-primary px-3 py-2 text-xs">
              Cari
            </button>
          </form>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved (Siap Cair)</option>
              <option value="DISBURSED">Disbursed (Lunas)</option>
              <option value="REJECTED">Rejected (Ditolak)</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            {/* Date Filters */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Tgl:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 outline-hidden font-mono"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 outline-hidden font-mono"
              />
            </div>

            {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Tgl Masuk</th>
                <th className="py-3 px-3">No. Referensi</th>
                <th className="py-3 px-3">Karyawan & Divisi</th>
                <th className="py-3 px-3">Tipe</th>
                <th className="py-3 px-3">Peruntukan / Keperluan</th>
                <th className="py-3 px-3 text-center">Prioritas</th>
                <th className="py-3 px-3 text-right">Nominal Diajukan</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={7} columns={9} />
              ) : claims.length > 0 ? (
                claims.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {item.reference_no}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 leading-tight">{item.employee_name}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        {item.department || 'Operasional'}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.source_type === 'REIMBURSEMENT' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Reimbursement
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Pengajuan Dana
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 line-clamp-1 max-w-xs">{item.title}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getPriorityBadge(item.priority)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-[13px] whitespace-nowrap">
                      {formatIDR(item.amount)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(item.status)}
                      {item.status === 'DISBURSED' && item.disbursed_at && (
                        <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                          Cair: {new Date(item.disbursed_at).toLocaleDateString('id-ID')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setDetailItem(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail Rincian & Nota"
                        >
                          <Eye size={15} />
                        </button>

                        {item.status === 'APPROVED' && (
                          <button
                            onClick={() => openDisburseModal(item)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-2xs transition-colors flex items-center gap-1"
                            title="Proses Pencairan Dana oleh Tim Finance"
                          >
                            <Send size={12} />
                            <span>Cairkan Dana</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                    Tidak ada data klaim biaya atau pengajuan dana ditemukan untuk filter ini.
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
          onPageChange={(newPage) => {
            setPage(newPage);
            fetchClaims(newPage, limit);
          }}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
            fetchClaims(1, newLimit);
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: DETAIL ITEM & RINCIAN NOTA                      */}
      {/* ========================================================= */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-2xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">Detail Laporan Pengajuan</h3>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {detailItem.reference_no}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Tipe: {detailItem.source_type === 'REIMBURSEMENT' ? 'Reimbursement (Klaim Biaya)' : 'Pengajuan Dana (Kasbon Operasional)'}
                </div>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {/* Applicant & Summary Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Karyawan</div>
                <div className="font-bold text-slate-900 text-xs mt-0.5">{detailItem.employee_name}</div>
                <div className="text-[11px] text-slate-500 font-normal">{detailItem.department}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Tanggal Pengajuan</div>
                <div className="font-bold text-slate-800 text-xs mt-0.5">{new Date(detailItem.created_at).toLocaleDateString('id-ID')}</div>
                <div className="text-[11px] text-slate-500 font-normal">Prioritas: {detailItem.priority || 'Normal'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Status Verifikasi</div>
                <div className="mt-0.5">{getStatusBadge(detailItem.status)}</div>
                {detailItem.approved_by && (
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">By: {detailItem.approved_by}</div>
                )}
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Total Nominal</div>
                <div className="font-bold text-blue-700 text-sm mt-0.5">{formatIDR(detailItem.amount)}</div>
              </div>
            </div>

            {/* Title & Notes */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-800">Judul / Keperluan:</div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                {detailItem.title}
              </div>
              {detailItem.description && (
                <>
                  <div className="font-bold text-slate-800 pt-1">Keterangan / Latar Belakang:</div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                    {detailItem.description}
                  </div>
                </>
              )}
            </div>

            {/* Items Breakdown Table */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>Rincian Item Biaya (Breakdown)</span>
                <span className="text-[11px] text-slate-500 font-normal">Sesuai invoice/kuitansi pengajuan</span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">Uraian / Deskripsi Barang</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Harga Satuan</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {(() => {
                      const items = parseJsonSafe(detailItem.items);
                      if (items && items.length > 0) {
                        return items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 font-sans font-medium text-slate-800">{it.name || it.item || it.description}</td>
                            <td className="py-2 px-3 text-center">{it.qty || 1}</td>
                            <td className="py-2 px-3 text-right">{formatIDR(it.price || it.amount || 0)}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatIDR(it.total || (it.qty * it.price) || it.amount || 0)}</td>
                          </tr>
                        ));
                      }
                      return (
                        <tr>
                          <td colSpan={5} className="py-3 text-center text-slate-400 font-sans">
                            Tidak ada rincian item terpisah (Nominal lumpsum total).
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                  <tfoot className="bg-slate-50/80 border-t border-slate-200 font-mono font-bold text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-2 px-3 text-right font-sans">Total Nilai Pengajuan:</td>
                      <td className="py-2 px-3 text-right text-blue-700">{formatIDR(detailItem.amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Audit & Disbursement Track */}
            {detailItem.status === 'DISBURSED' && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-blue-600" />
                  <span>Informasi Pencairan Dana oleh Finance</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-700">
                  <div>Petugas Pencairan: <strong>{detailItem.disbursed_by || 'Finance'}</strong></div>
                  <div>No. Ref Transfer: <strong>{detailItem.disbursed_ref || '-'}</strong></div>
                  <div>Waktu Pencairan: <strong>{detailItem.disbursed_at ? new Date(detailItem.disbursed_at).toLocaleString('id-ID') : '-'}</strong></div>
                  <div>Status Buku: <strong className="text-emerald-700">Disbursed (Kas Berkurang)</strong></div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              {detailItem.status === 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => {
                    const item = detailItem;
                    setDetailItem(null);
                    openDisburseModal(item);
                  }}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span>Proses Pencairan Dana Sekarang</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="btn btn-outline text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: DISBURSEMENT / PENCAIRAN DANA OLEH FINANCE       */}
      {/* ========================================================= */}
      {disburseModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Pencairan Dana (Disbursement)</h3>
              <button onClick={() => setDisburseModalItem(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-xs space-y-1">
              <div className="font-bold text-emerald-900 text-xs">{disburseModalItem.title}</div>
              <div className="text-slate-600">
                Pemohon: <strong className="text-slate-800">{disburseModalItem.employee_name}</strong> • Ref: <span className="font-mono">{disburseModalItem.reference_no}</span>
              </div>
              <div className="font-mono text-emerald-800 font-black text-sm pt-1">
                Nominal yang Dicairkan: {formatIDR(disburseModalItem.amount)}
              </div>
            </div>

            <form onSubmit={handleDisburseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Nama Petugas Finance / Kasir *</label>
                <input
                  type="text"
                  required
                  value={disburseForm.disbursed_by}
                  onChange={(e) => setDisburseForm({ ...disburseForm, disbursed_by: e.target.value })}
                  placeholder="e.g. Finance Officer (BCA Transfer)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Nomor Referensi Bank / Bukti Kas Keluar *</label>
                <input
                  type="text"
                  required
                  value={disburseForm.disbursed_ref}
                  onChange={(e) => setDisburseForm({ ...disburseForm, disbursed_ref: e.target.value })}
                  placeholder="e.g. TRX-BCA-20260929-001 / BKK-0988"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Catatan Pencairan</label>
                <textarea
                  rows={2}
                  value={disburseForm.notes}
                  onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })}
                  placeholder="Catatan transfer ke rekening karyawan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDisburseModalItem(null)}
                  className="btn btn-outline text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDisburse}
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>{submittingDisburse ? 'Menyimpan...' : 'Konfirmasi Pencairan Selesai'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: HRMS SAAS SYNC CONFIG MODAL                      */}
      {/* ========================================================= */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Sinkronisasi API HRMS SaaS</h3>
              <button onClick={() => setSyncModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Hubungkan ke API service HRMS Narwasthu Group (<strong className="font-mono">C:\laragon\www\SaaS</strong>) untuk menarik data pengajuan dana dan klaim reimbursement secara langsung.
            </p>

            <form onSubmit={handleSyncHRMS} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-800">HRMS Backend API URL *</label>
                <input
                  type="url"
                  required
                  value={syncConfig.hrms_base_url}
                  onChange={(e) => setSyncConfig({ ...syncConfig, hrms_base_url: e.target.value })}
                  placeholder="http://localhost:8000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800">Sanctum Integration Token (Opsional)</label>
                <input
                  type="text"
                  value={syncConfig.api_token}
                  onChange={(e) => setSyncConfig({ ...syncConfig, api_token: e.target.value })}
                  placeholder="Integration Bearer Token dari menu API Tokens HRMS"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Kosongkan jika endpoint lokal dapat diakses langsung tanpa otorisasi terpisah.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSyncModalOpen(false)}
                  className="btn btn-outline text-xs"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                  <span>{syncing ? 'Menyinkronkan...' : 'Mulai Sinkronisasi Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
