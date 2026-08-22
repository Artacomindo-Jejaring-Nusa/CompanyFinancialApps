import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  Filter, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Globe, 
  RotateCcw,
  FileCode
} from 'lucide-react';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Detail Modal
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs?page=1&limit=500');
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Client-side search and filtering
  const filteredLogs = logs.filter((log) => {
    const sLower = search.trim().toLowerCase();
    const matchesSearch = !sLower || (
      (log.action || '').toLowerCase().includes(sLower) ||
      (log.entity || '').toLowerCase().includes(sLower) ||
      (log.entity_id || '').toLowerCase().includes(sLower) ||
      (log.user?.full_name || '').toLowerCase().includes(sLower) ||
      (log.user?.username || '').toLowerCase().includes(sLower) ||
      (log.ip_address || '').toLowerCase().includes(sLower)
    );

    const matchesAction = !filterAction || log.action === filterAction;
    const matchesEntity = !filterEntity || log.entity === filterEntity;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredLogs.length / limit) || 1;

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELETE':
      case 'ARCHIVE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'PAYMENT':
      case 'BULK_PAYMENT':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'IMPORT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'AUTH_LOGIN':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleResetFilter = () => {
    setSearch('');
    setFilterAction('');
    setFilterEntity('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={24} />
            <h1 className="font-display text-headline-lg text-on-surface font-bold">System Audit Trail</h1>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Immutable activity log for regulatory compliance, security audits, and financial history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold font-mono">
            {filteredLogs.length} Total Audit Records
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter size={14} className="text-blue-600" />
            <span>Filter & Search Audit Trail</span>
          </div>
          {(search || filterAction || filterEntity) && (
            <button
              onClick={handleResetFilter}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search action, entity, user, IP, entity ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Semua Action</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE / ARCHIVE</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="IMPORT">IMPORT</option>
              <option value="SYSTEM_INIT">SYSTEM_INIT</option>
              <option value="AUTH_LOGIN">AUTH_LOGIN</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div>
            <select
              value={filterEntity}
              onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Semua Entity</option>
              <option value="Service">Service</option>
              <option value="PaymentSchedule">PaymentSchedule</option>
              <option value="Customer">Customer</option>
              <option value="Provider">Provider</option>
              <option value="User">User</option>
              <option value="DatabaseSchema">DatabaseSchema</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
        {loading ? (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
              <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-28 animate-pulse"></div>
            </div>
            <TableSkeleton rows={7} cols={6} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Entity & Target ID</th>
                    <th className="py-3.5 px-4">Executed By</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4 text-center">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">
                            {new Date(log.timestamp).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-slate-900">{log.entity}</div>
                          <div className="font-mono text-slate-500 text-[11px] truncate max-w-xs">{log.entity_id}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <User size={13} className="text-slate-400" />
                            <span>{log.user?.full_name || 'System / Admin'}</span>
                          </div>
                          <div className="text-slate-400 font-mono text-[11px] ml-4">{log.user?.username || 'system'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] border border-slate-200">
                            {log.ip_address || '127.0.0.1'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setDetailItem(log)}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors border border-blue-200"
                            title="View Payload Data"
                          >
                            <FileCode size={14} />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                        Tidak ada log audit yang sesuai dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              limit={limit}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          </>
        )}
      </div>

      {/* Detail Payload Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Audit Record Detail</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {detailItem.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Action:</span>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{detailItem.action}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Timestamp:</span>
                  <div className="font-mono text-slate-800 mt-0.5">{new Date(detailItem.timestamp).toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Entity:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{detailItem.entity}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Entity ID:</span>
                  <div className="font-mono text-slate-800 mt-0.5 truncate">{detailItem.entity_id}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">User:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{detailItem.user?.full_name || 'System'} ({detailItem.user?.username || 'system'})</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">IP Address:</span>
                  <div className="font-mono text-slate-800 mt-0.5">{detailItem.ip_address || '127.0.0.1'}</div>
                </div>
              </div>

              {/* Old Value vs New Value */}
              {detailItem.old_value && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Previous Value (Old)</h4>
                  <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-mono overflow-x-auto max-h-40">
                    {typeof detailItem.old_value === 'string' ? detailItem.old_value : JSON.stringify(detailItem.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {detailItem.new_value && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Payload / Result (New)</h4>
                  <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-xs font-mono overflow-x-auto max-h-52">
                    {typeof detailItem.new_value === 'string' ? detailItem.new_value : JSON.stringify(detailItem.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors"
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
