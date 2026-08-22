import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Layers, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight,
  Calendar,
  Building2,
  PieChart as PieChartIcon,
  BarChart2,
  Download,
  Filter,
  DollarSign,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CardSkeleton, ChartSkeleton, TableSkeleton, Skeleton } from '../components/Skeleton';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [providerData, setProviderData] = useState([]);
  const [agingData, setAgingData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock trend data for rich visualizations
  const trendData = [
    { month: 'May 2026', paid: 42000000, upcoming: 0, overdue: 0 },
    { month: 'Jun 2026', paid: 48000000, upcoming: 0, overdue: 0 },
    { month: 'Jul 2026', paid: 51000000, upcoming: 0, overdue: 2500000 },
    { month: 'Aug 2026', paid: 35000000, upcoming: 15000000, overdue: 7500000 },
    { month: 'Sep 2026', paid: 0, upcoming: 54000000, overdue: 0 },
    { month: 'Oct 2026', paid: 0, upcoming: 54000000, overdue: 0 },
  ];

  const serviceTypeData = [
    { name: 'Fiber Optic', value: 45, color: '#004ac6' },
    { name: 'VSAT Satellite', value: 20, color: '#2563eb' },
    { name: 'Cloud VPS / Hosting', value: 20, color: '#0284c7' },
    { name: 'SD-WAN & Routing', value: 15, color: '#7c3aed' },
  ];

  const COLORS = ['#004ac6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, provRes, agingRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/reports/provider-summary'),
        api.get('/reports/overdue-aging'),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (provRes.success) setProviderData(provRes.data || []);
      if (agingRes.success) setAgingData(agingRes.data || []);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
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

  const formatShortIDR = (val) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(0)}M`;
    return formatIDR(val);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        {/* Metrics Cards Skeleton */}
        <CardSkeleton count={4} />

        {/* Charts Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton height="h-80" />
          </div>
          <div>
            <ChartSkeleton height="h-80" />
          </div>
        </div>

        {/* Bottom Section Skeleton */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-28" />
          </div>
          <TableSkeleton rows={5} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">Executive Financial Dashboard</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Real-time financial monitoring, obligation trends, and risk assessment analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-surface-container border border-outline-variant/40 text-on-surface font-label-md text-label-md font-semibold rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            <span>Export Report</span>
          </button>
          <Link
            to="/payments"
            className="px-4 py-2 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-surface-tint transition-colors shadow-xs flex items-center gap-2"
          >
            <Clock size={16} />
            <span>Process Payments</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Services */}
        <div className="p-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold">Active Contracts</span>
            <div className="p-2 bg-primary-fixed text-primary rounded-lg">
              <Layers size={18} />
            </div>
          </div>
          <div className="font-display text-display font-bold text-on-surface">
            {summary?.active_services_count || 0}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp size={14} />
            <span>+100% active operational uptime</span>
          </div>
        </div>

        {/* Due Today */}
        <div className="p-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold">Due Today</span>
            <div className="p-2 bg-surface-container-high text-primary rounded-lg">
              <Clock size={18} />
            </div>
          </div>
          <div className="font-display text-display font-bold text-on-surface">
            {summary?.due_today_count || 0}
          </div>
          <p className="font-body-md text-[13px] text-primary font-medium">
            Total: {formatIDR(summary?.due_today_amount)}
          </p>
        </div>

        {/* Due Next 7 Days */}
        <div className="p-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold">Due Next 7 Days</span>
            <div className="p-2 bg-tertiary-fixed text-tertiary-container rounded-lg">
              <Calendar size={18} />
            </div>
          </div>
          <div className="font-display text-display font-bold text-on-surface">
            {summary?.due_next_7_days_count || 0}
          </div>
          <p className="font-body-md text-[13px] text-on-surface-variant">
            Total: {formatIDR(summary?.due_next_7_days_amount)}
          </p>
        </div>

        {/* Overdue Alert Card */}
        <div className="p-5 bg-surface-container-lowest border border-secondary/30 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-secondary font-semibold">
            <span className="font-label-md text-label-md">Overdue Exposure</span>
            <div className="p-2 bg-secondary-fixed text-secondary rounded-lg">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="font-display text-display font-bold text-secondary">
            {summary?.overdue_count || 0}
          </div>
          <p className="font-body-md text-[13px] text-secondary font-medium">
            Total: {formatIDR(summary?.overdue_amount)}
          </p>
        </div>
      </div>

      {/* Interactive Charts Section - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Obligation & Settlement Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Financial Settlement Trend</h2>
              <p className="text-xs text-on-surface-variant">6-Month historical settled vs upcoming obligations</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-container text-on-primary-container font-mono">
              2026 Fiscal Year
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUpcoming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004ac6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#004ac6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eeff" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#434655' }} />
                <YAxis tick={{ fontSize: 12, fill: '#434655' }} tickFormatter={formatShortIDR} />
                <Tooltip formatter={(val) => formatIDR(val)} />
                <Legend />
                <Area type="monotone" dataKey="paid" name="Settled Paid" stroke="#10b981" fillOpacity={1} fill="url(#colorPaid)" />
                <Area type="monotone" dataKey="upcoming" name="Upcoming Commitment" stroke="#004ac6" fillOpacity={1} fill="url(#colorUpcoming)" />
                <Area type="monotone" dataKey="overdue" name="Overdue Exposure" stroke="#ef4444" fillOpacity={1} fill="url(#colorOverdue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Type Share (Pie Chart) */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Service Type Share</h2>
            <p className="text-xs text-on-surface-variant">Contract distribution by infrastructure type</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `${val}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-outline-variant/30">
            {serviceTypeData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="font-medium text-on-surface">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-on-surface-variant">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Charts Section - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Commitment Breakdown */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Provider Commitment</h2>
              <p className="text-xs text-on-surface-variant">Gross billing allocation per service provider</p>
            </div>
            <Building2 size={18} className="text-primary" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eeff" />
                <XAxis dataKey="provider_name" tick={{ fontSize: 11, fill: '#434655' }} />
                <YAxis tick={{ fontSize: 11, fill: '#434655' }} tickFormatter={formatShortIDR} />
                <Tooltip formatter={(val) => formatIDR(val)} />
                <Bar dataKey="total_amount" name="Total Obligation" fill="#004ac6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid_amount" name="Paid Settlement" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue Aging Risk Heatmap */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Overdue Aging Risk</h2>
              <p className="text-xs text-on-surface-variant">Aging buckets for overdue invoices</p>
            </div>
            <AlertTriangle size={18} className="text-secondary" />
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eeff" />
                <XAxis dataKey="bucket_name" tick={{ fontSize: 11, fill: '#434655' }} />
                <YAxis tick={{ fontSize: 11, fill: '#434655' }} tickFormatter={formatShortIDR} />
                <Tooltip formatter={(val) => formatIDR(val)} />
                <Bar dataKey="total_amount" name="Overdue Amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Alert Table */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-secondary" />
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Overdue Invoices Alert</h2>
            </div>
            <Link to="/payments?tab=OVERDUE" className="text-primary font-label-md text-label-md font-semibold hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md">
              <thead className="bg-surface-container-low text-on-surface-variant font-label-md text-[12px] uppercase">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Service</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {summary?.overdue_schedules?.length > 0 ? (
                  summary.overdue_schedules.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-on-surface">{item.service?.service_name}</div>
                        <div className="text-xs text-on-surface-variant">{item.service?.cid} • {item.service?.provider?.provider_name}</div>
                      </td>
                      <td className="py-3 px-3 text-secondary font-medium">
                        {new Date(item.due_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-on-surface">
                        {formatIDR(item.remaining_amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-on-surface-variant">
                      No overdue payments found. Great job!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Due Dates */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Upcoming Deadlines</h2>
            </div>
            <Link to="/payments?tab=UPCOMING" className="text-primary font-label-md text-label-md font-semibold hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md">
              <thead className="bg-surface-container-low text-on-surface-variant font-label-md text-[12px] uppercase">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Service</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {summary?.upcoming_schedules?.length > 0 ? (
                  summary.upcoming_schedules.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-on-surface">{item.service?.service_name}</div>
                        <div className="text-xs text-on-surface-variant">{item.service?.cid} • {item.service?.provider?.provider_name}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-on-surface-variant">
                        {new Date(item.due_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-on-surface">
                        {formatIDR(item.remaining_amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-on-surface-variant">
                      No upcoming payment deadlines.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
