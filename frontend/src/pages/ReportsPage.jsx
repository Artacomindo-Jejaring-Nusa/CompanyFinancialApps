import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  BarChart3, 
  Calendar, 
  Building2, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { CardSkeleton, TableSkeleton, Skeleton } from '../components/Skeleton';

export default function ReportsPage() {
  const [period, setPeriod] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [providerReport, setProviderReport] = useState([]);
  const [agingReport, setAgingReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [mRes, pRes, aRes] = await Promise.all([
        api.get(`/reports/monthly-summary?period=${period}`),
        api.get('/reports/provider-summary'),
        api.get('/reports/overdue-aging'),
      ]);
      setMonthlyReport(mRes.data);
      setProviderReport(pRes.data || []);
      setAgingReport(aRes.data || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">Financial Reports & Forecast</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Monthly payment summaries, provider breakdowns, and aging schedule analysis.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2 font-label-md text-label-md font-semibold text-on-surface"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <CardSkeleton count={4} />
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
            <TableSkeleton rows={4} cols={4} />
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
            <TableSkeleton rows={5} cols={5} />
          </div>
        </div>
      ) : (
        <>
          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl space-y-1 shadow-xs">
              <div className="text-xs font-semibold text-on-surface-variant uppercase">Period</div>
              <div className="font-display text-headline-lg font-bold text-primary font-mono">{monthlyReport?.period}</div>
              <div className="text-xs text-on-surface-variant">Total Schedules: {monthlyReport?.total_schedules || 0}</div>
            </div>

            <div className="p-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl space-y-1 shadow-xs">
              <div className="text-xs font-semibold text-on-surface-variant uppercase">Total Obligation</div>
              <div className="font-display text-headline-lg font-bold text-on-surface">{formatIDR(monthlyReport?.total_amount)}</div>
              <div className="text-xs text-on-surface-variant">Gross billing amount</div>
            </div>

            <div className="p-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl space-y-1 shadow-xs">
              <div className="text-xs font-semibold text-emerald-700 uppercase">Paid Amount</div>
              <div className="font-display text-headline-lg font-bold text-emerald-600">{formatIDR(monthlyReport?.paid_amount)}</div>
              <div className="text-xs text-emerald-600 font-medium">Recorded payment settlements</div>
            </div>

            <div className="p-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl space-y-1 shadow-xs">
              <div className="text-xs font-semibold text-secondary uppercase">Remaining Unpaid</div>
              <div className="font-display text-headline-lg font-bold text-secondary">{formatIDR(monthlyReport?.remaining_amount)}</div>
              <div className="text-xs text-secondary font-medium">Pending & overdue amount</div>
            </div>
          </div>

          {/* Overdue Aging Report */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-secondary" />
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Overdue Aging Breakdown</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {agingReport.map((bucket) => (
                <div key={bucket.bucket_name} className="p-4 bg-surface-container-low border rounded-lg space-y-1">
                  <div className="font-label-md text-xs font-bold text-on-surface">{bucket.bucket_name}</div>
                  <div className="font-display text-headline-md font-bold text-secondary">{formatIDR(bucket.total_amount)}</div>
                  <div className="text-xs text-on-surface-variant">{bucket.count} Overdue Invoice(s)</div>
                </div>
              ))}
            </div>
          </div>

          {/* Provider Summary Breakdown */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-primary" />
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Provider Obligation Breakdown</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-md text-body-md">
                <thead className="bg-surface-container-low text-on-surface-variant font-label-md text-[12px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Provider Name</th>
                    <th className="py-3 px-4 text-center">Active Services</th>
                    <th className="py-3 px-4 text-right">Total Billing</th>
                    <th className="py-3 px-4 text-right">Paid Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {providerReport.map((row) => (
                    <tr key={row.provider_id} className="hover:bg-surface-container/30">
                      <td className="py-3 px-4 font-semibold text-on-surface">{row.provider_name}</td>
                      <td className="py-3 px-4 text-center font-mono">{row.total_services}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatIDR(row.total_amount)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatIDR(row.paid_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
