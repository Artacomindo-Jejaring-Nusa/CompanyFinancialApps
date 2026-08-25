import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Building2, 
  Receipt, 
  ArrowLeft,
  X,
  AlertCircle,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ArtacomLogo from '../components/ArtacomLogo';

export default function TVCalendarDisplayPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  const [schedules, setSchedules] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);

  // Display options
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('');
  const [detailItem, setDetailItem] = useState(null);
  const [dayModalItems, setDayModalItems] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Month navigation
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-indexed

  const containerRef = useRef(null);

  // Top Pinned Core Vendors
  const PINNED_VENDOR_CODES = ['PROV-JIP', 'PROV-IFO', 'PROV-SAT', 'PROV-PAR', 'PROV-JED', 'PROV-BIZ', 'PROV-IND', 'PROV-AST'];

  // Live Digital Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentDate(now);
      
      const timeOpts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      setTimeString(now.toLocaleTimeString('id-ID', timeOpts) + ' WIB');

      const dateOpts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      setDateString(now.toLocaleDateString('id-ID', dateOpts));
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fetch Data on view change
  useEffect(() => {
    fetchSchedulesData();
  }, [viewYear, viewMonth]);

  // Auto Refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchSchedulesData(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [viewYear, viewMonth]);

  const fetchSchedulesData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [schedRes, provRes] = await Promise.all([
        api.get('/payment-schedules?limit=1000'),
        api.get('/providers?limit=200'),
      ]);

      if (schedRes.success) {
        setSchedules(schedRes.data || []);
      }
      if (provRes.success) {
        const cleaned = (provRes.data || []).filter(
          (p) => !['PROV-IOH', 'PROV-XL', 'PROV-AWS', 'PROV-GCP', 'PROV-MSF'].includes(p.provider_code)
        );
        setProviders(cleaned);
      }
    } catch (err) {
      console.error("Failed to load TV display schedules:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleResetToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
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

  // Month metadata
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const targetPeriodPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  
  // Base schedules for this month
  const rawMonthSchedules = schedules.filter((s) => {
    if (s.due_date) {
      const d = new Date(s.due_date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    }
    return s.period === targetPeriodPrefix;
  });

  // Calculate SMART ACTIVE PROVIDERS for this month
  const activeProviderIds = new Set(rawMonthSchedules.map((s) => s.service?.provider_id));
  
  const smartPillProviders = providers.filter((p) => 
    activeProviderIds.has(p.id) || PINNED_VENDOR_CODES.includes(p.provider_code)
  );

  // Filtered schedules for calendar display
  let monthSchedules = [...rawMonthSchedules];

  if (selectedVendorFilter) {
    monthSchedules = monthSchedules.filter((s) => String(s.service?.provider_id) === String(selectedVendorFilter));
  }

  if (searchTerm && searchTerm.trim()) {
    const sLower = searchTerm.trim().toLowerCase();
    monthSchedules = monthSchedules.filter((item) => {
      const sName = (item.service?.service_name || '').toLowerCase();
      const pName = (item.service?.provider?.provider_name || '').toLowerCase();
      const cid = (item.service?.cid || '').toLowerCase();
      const notes = (item.notes || '').toLowerCase();
      return sName.includes(sLower) || pName.includes(sLower) || cid.includes(sLower) || notes.includes(sLower);
    });
  }

  // Calculate statistics for top KPI cards
  const totalNominalBulanIni = monthSchedules.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  const dueTodayItems = monthSchedules.filter((item) => item.status === 'DUE_TODAY');
  const dueTodayNominal = dueTodayItems.reduce((sum, item) => sum + (item.remaining_amount || item.amount || 0), 0);

  const overdueItems = monthSchedules.filter((item) => item.status === 'OVERDUE');
  const overdueNominal = overdueItems.reduce((sum, item) => sum + (item.remaining_amount || item.amount || 0), 0);

  const paidItems = monthSchedules.filter((item) => item.status === 'PAID');
  const paidNominal = paidItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Group schedules by day of month (1..31)
  const schedulesByDay = {};
  for (let day = 1; day <= daysInMonth; day++) {
    schedulesByDay[day] = [];
  }

  monthSchedules.forEach((item) => {
    let dayNumber = 1;
    if (item.due_date) {
      dayNumber = new Date(item.due_date).getDate();
    } else if (item.service?.due_day) {
      dayNumber = item.service.due_day;
    }
    if (schedulesByDay[dayNumber]) {
      schedulesByDay[dayNumber].push(item);
    }
  });

  // Sort each day items (OVERDUE first, then DUE_TODAY, then UPCOMING, then PAID)
  Object.keys(schedulesByDay).forEach((day) => {
    schedulesByDay[day].sort((a, b) => {
      const order = { OVERDUE: 1, DUE_TODAY: 2, DUE_SOON: 3, UPCOMING: 4, PARTIALLY_PAID: 5, PAID: 6 };
      return (order[a.status] || 9) - (order[b.status] || 9);
    });
  });

  // Today marker
  const isCurrentMonthView = currentDate.getFullYear() === viewYear && currentDate.getMonth() === viewMonth;
  const currentDayNumber = isCurrentMonthView ? currentDate.getDate() : -1;

  // Upcoming Priority Queue for Side Ticker
  const upcomingPriorityList = monthSchedules
    .filter((item) => item.status !== 'PAID')
    .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))
    .slice(0, 8);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'OVERDUE':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'DUE_TODAY':
        return 'bg-amber-50 border-amber-300 text-amber-900';
      case 'DUE_SOON':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'PAID':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-700';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full flex flex-col font-sans bg-slate-50 text-slate-800"
    >
      {/* ======================================================== */}
      {/* 1. TOP HEADER & FORMAL CLOCK                             */}
      {/* ======================================================== */}
      <header className="px-6 py-3 bg-white border-b border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Company Brand & Title */}
        <div className="flex items-center gap-4">
          <ArtacomLogo className="h-9 w-auto" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-slate-900 tracking-tight">
                Jadwal Tagihan & Jatuh Tempo Pembayaran Vendor
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Display Monitor
              </span>
            </div>
            <p className="text-xs text-slate-500">
              PT Artacomindo Jejaring Nusa • Rekapitulasi Kewajiban Vendor ({providers.length} Vendor Terdaftar)
            </p>
          </div>
        </div>

        {/* Live Digital Clock & Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {timeString || '12:00:00 WIB'}
            </div>
            <div className="text-xs font-medium text-slate-500">
              {dateString || 'Senin, 24 Agustus 2026'}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <div 
              title="Auto Refresh Interval"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Sync {countdown}s</span>
            </div>

            <button
              onClick={() => fetchSchedulesData(true)}
              className="p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              title="Refresh Data Sekarang"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              title="Mode Layar Penuh (Fullscreen)"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Kembali</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. FORMAL EXECUTIVE KPI SUMMARY CARDS                    */}
      {/* ======================================================== */}
      <section className="px-6 pt-3 pb-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Total Tagihan */}
          <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Tagihan {monthNames[viewMonth]}
              </div>
              <div className="text-lg md:text-xl font-bold text-slate-900 mt-0.5">
                {formatIDR(totalNominalBulanIni)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {monthSchedules.length} Tagihan Terdaftar
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
              <Receipt size={20} />
            </div>
          </div>

          {/* Due Today */}
          <div className={`p-3.5 bg-white rounded-lg border shadow-2xs flex items-center justify-between ${
            dueTodayItems.length > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
          }`}>
            <div>
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                {dueTodayItems.length > 0 && <span className="h-2 w-2 rounded-full bg-amber-500"></span>}
                <span>Jatuh Tempo Hari Ini</span>
              </div>
              <div className="text-lg md:text-xl font-bold text-amber-900 mt-0.5">
                {formatIDR(dueTodayNominal)}
              </div>
              <div className="text-xs text-amber-700 mt-0.5">
                {dueTodayItems.length} Tagihan Perlu Diproses
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
              <Clock size={20} />
            </div>
          </div>

          {/* Overdue */}
          <div className={`p-3.5 bg-white rounded-lg border shadow-2xs flex items-center justify-between ${
            overdueItems.length > 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
          }`}>
            <div>
              <div className="text-xs font-semibold text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                {overdueItems.length > 0 && <span className="h-2 w-2 rounded-full bg-red-500"></span>}
                <span>Lewat Jatuh Tempo (Overdue)</span>
              </div>
              <div className="text-lg md:text-xl font-bold text-red-700 mt-0.5">
                {formatIDR(overdueNominal)}
              </div>
              <div className="text-xs text-red-600 mt-0.5">
                {overdueItems.length} Tagihan Belum Dibayar
              </div>
            </div>
            <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-100">
              <AlertTriangle size={20} />
            </div>
          </div>

          {/* Lunas / Paid */}
          <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Sudah Lunas Terbayar
              </div>
              <div className="text-lg md:text-xl font-bold text-emerald-800 mt-0.5">
                {formatIDR(paidNominal)}
              </div>
              <div className="text-xs text-emerald-600 mt-0.5">
                {paidItems.length} Tagihan Selesai
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. MONTH SWITCHER & SMART VENDOR FILTER BAR              */}
      {/* ======================================================== */}
      <section className="px-6 py-2 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Month Navigation */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Bulan Lalu</span>
          </button>

          <div className="px-3.5 py-1 rounded-md border border-slate-300 bg-white font-bold text-sm text-slate-900">
            {monthNames[viewMonth]} {viewYear}
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
          >
            <span className="hidden sm:inline">Bulan Depan</span>
            <ChevronRight size={16} />
          </button>

          <button
            onClick={handleResetToday}
            className={`px-3 py-1 rounded-md border text-xs font-medium transition-colors ${
              isCurrentMonthView 
                ? 'bg-slate-800 text-white border-slate-800 font-semibold' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Bulan Ini
          </button>
        </div>

        {/* Vendor Filter Buttons & Search */}
        <div className="flex items-center gap-1.5 flex-1 justify-end overflow-x-auto pb-0.5 text-xs">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Cari link / vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md pl-7 pr-2.5 py-1 text-xs bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          <button
            onClick={() => setSelectedVendorFilter('')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              !selectedVendorFilter
                ? 'bg-slate-800 text-white font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Semua ({rawMonthSchedules.length})
          </button>

          {/* Smart Vendor Pills */}
          {smartPillProviders.map((prov) => {
            const count = rawMonthSchedules.filter((s) => String(s.service?.provider_id) === String(prov.id)).length;
            const isSelected = String(selectedVendorFilter) === String(prov.id);
            const shortName = getShortVendorName(prov.provider_name);

            return (
              <button
                key={prov.id}
                onClick={() => setSelectedVendorFilter(isSelected ? '' : String(prov.id))}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <span>{shortName}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.1 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Full Dropdown for Remaining Providers */}
          {providers.length > smartPillProviders.length && (
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              className="rounded-md px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="">Vendor Lainnya ({providers.length - smartPillProviders.length})...</option>
              {providers
                .filter((p) => !smartPillProviders.some((sp) => sp.id === p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.provider_name}</option>
                ))}
            </select>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. CALENDAR GRID & PRIORITY QUEUE                        */}
      {/* ======================================================== */}
      <main className="px-6 py-2 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* MONTHLY CALENDAR GRID */}
        <div className="lg:col-span-3 rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col shadow-2xs">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-2 text-center pb-2 border-b border-slate-200">
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((dayName, idx) => (
              <div
                key={dayName}
                className={`text-xs font-semibold uppercase tracking-wider py-0.5 ${
                  idx >= 5 ? 'text-red-600' : 'text-slate-500'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Day Slots */}
          <div className="grid grid-cols-7 gap-2 pt-2 flex-1">
            {/* Empty slots for first week */}
            {Array.from({ length: adjustedFirstDay }).map((_, idx) => (
              <div 
                key={`empty-${idx}`} 
                className="rounded-md border border-dashed border-slate-100 bg-slate-50/50 min-h-[90px]"
              />
            ))}

            {/* Actual Days of the Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isToday = isCurrentMonthView && dayNum === currentDayNumber;
              const dayItems = schedulesByDay[dayNum] || [];

              const hasOverdue = dayItems.some((s) => s.status === 'OVERDUE');
              const hasDueToday = dayItems.some((s) => s.status === 'DUE_TODAY');

              const visibleItems = dayItems.slice(0, 2);
              const remainingCount = dayItems.length - 2;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`rounded-md border p-1.5 flex flex-col min-h-[95px] transition-colors relative ${
                    isToday
                      ? 'bg-blue-50/40 border-blue-500 ring-1 ring-blue-500'
                      : hasOverdue
                      ? 'bg-red-50/30 border-red-200'
                      : hasDueToday
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${
                      isToday 
                        ? 'px-1.5 py-0.2 rounded bg-blue-600 text-white' 
                        : 'text-slate-700'
                    }`}>
                      {dayNum}
                    </span>

                    {isToday && (
                      <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-blue-100 text-blue-800 uppercase">
                        Hari Ini
                      </span>
                    )}

                    {dayItems.length > 0 && !isToday && (
                      <span className={`text-[10px] font-medium px-1 rounded ${
                        hasOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {dayItems.length} Inv
                      </span>
                    )}
                  </div>

                  {/* Invoice Chips */}
                  <div className="space-y-1 overflow-y-auto max-h-[105px] pr-0.5">
                    {visibleItems.map((item) => {
                      const shortVendor = getShortVendorName(item.service?.provider?.provider_name);
                      const badgeClass = getStatusBadgeStyle(item.status);

                      return (
                        <div
                          key={item.id}
                          onClick={() => setDetailItem(item)}
                          className={`p-1 rounded border text-left cursor-pointer transition-colors hover:bg-opacity-80 ${badgeClass}`}
                          title="Klik untuk melihat rincian tagihan"
                        >
                          <div className="flex items-center justify-between gap-1 text-[11px] font-semibold leading-tight">
                            <span className="truncate">{shortVendor}</span>
                            <span className="whitespace-nowrap text-[10px] font-bold">
                              {formatIDR(item.remaining_amount || item.amount)}
                            </span>
                          </div>
                          <div className="text-[10px] truncate text-slate-600 mt-0.5">
                            {item.service?.service_name || item.service?.cid}
                          </div>
                        </div>
                      );
                    })}

                    {/* Overflow Chip */}
                    {remainingCount > 0 && (
                      <button
                        onClick={() => setDayModalItems({ day: dayNum, items: dayItems })}
                        className="w-full py-0.5 px-1 rounded text-[10px] font-medium text-center bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                      >
                        +{remainingCount} Tagihan Lainnya
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDE PRIORITY QUEUE PANEL */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col shadow-2xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={16} className="text-amber-600" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                Prioritas Pembayaran Terdekat
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
              {upcomingPriorityList.length} Antrean
            </span>
          </div>

          <div className="space-y-2 pt-3 overflow-y-auto flex-1 max-h-[580px] pr-1">
            {upcomingPriorityList.length > 0 ? (
              upcomingPriorityList.map((item) => {
                const shortVendor = getShortVendorName(item.service?.provider?.provider_name);
                const badgeClass = getStatusBadgeStyle(item.status);

                return (
                  <div
                    key={`side-${item.id}`}
                    onClick={() => setDetailItem(item)}
                    className={`p-2.5 rounded-md border cursor-pointer hover:border-slate-400 transition-colors ${badgeClass}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        <Building2 size={12} className="text-slate-600" />
                        <span>{shortVendor}</span>
                      </span>
                      <span className="text-[10px] font-semibold uppercase">
                        {item.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 mt-1 font-medium truncate">
                      {item.service?.service_name}
                    </div>

                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200/60 text-[11px]">
                      <span className="font-bold text-slate-900">
                        {formatIDR(item.remaining_amount || item.amount)}
                      </span>
                      <span className="text-slate-600 text-[10px]">
                        Jatuh Tempo: {new Date(item.due_date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                <CheckCircle2 size={24} className="mx-auto mb-1.5 text-emerald-600" />
                <span>Semua tagihan telah lunas.</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* 5. MODAL LIST OF INVOICES FOR A DAY                      */}
      {/* ======================================================== */}
      {dayModalItems && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Daftar Tagihan Jatuh Tempo Tanggal {dayModalItems.day} {monthNames[viewMonth]} {viewYear}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total {dayModalItems.items.length} Invoice
                </p>
              </div>
              <button onClick={() => setDayModalItems(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {dayModalItems.items.map((item) => {
                const badgeClass = getStatusBadgeStyle(item.status);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setDayModalItems(null);
                      setDetailItem(item);
                    }}
                    className={`p-3 rounded-md border cursor-pointer hover:border-slate-400 transition-colors ${badgeClass}`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-slate-900">
                        <Building2 size={13} />
                        <span>{item.service?.provider?.provider_name}</span>
                      </span>
                      <span className="text-slate-900">
                        {formatIDR(item.remaining_amount || item.amount)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 mt-1">
                      {item.service?.service_name} • <span>{item.service?.cid || item.service?.contract_number || '-'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Customer: {item.service?.customer?.customer_name} • Status: {item.status}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setDayModalItems(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL DETAIL INVOICE POPUP                            */}
      {/* ======================================================== */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                  {detailItem.service?.provider?.provider_name}
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1.5">{detailItem.service?.service_name}</h3>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-md bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-slate-500 font-medium text-[11px]">Periode Tagihan</div>
                  <div className="font-bold text-slate-900 mt-0.5">{detailItem.period}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium text-[11px]">Status Pembayaran</div>
                  <div className="font-bold text-slate-900 mt-0.5">{detailItem.status}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium text-[11px]">Tanggal Jatuh Tempo</div>
                  <div className="font-bold text-red-700 mt-0.5">
                    {new Date(detailItem.due_date).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium text-[11px]">Nominal Tagihan</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {formatIDR(detailItem.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium text-[11px]">Circuit ID / Contract</div>
                  <div className="font-medium text-slate-800 mt-0.5">
                    {detailItem.service?.cid || detailItem.service?.contract_number || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium text-[11px]">Customer Entitas</div>
                  <div className="font-medium text-slate-800 mt-0.5">{detailItem.service?.customer?.customer_name}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <div className="text-slate-500 font-medium text-[11px]">Catatan Invoice</div>
                  <div className="text-slate-700 text-xs mt-0.5">{detailItem.notes || '-'}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-md text-xs"
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
