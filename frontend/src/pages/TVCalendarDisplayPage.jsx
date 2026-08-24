import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Building2, 
  DollarSign, 
  Layers, 
  Receipt, 
  ArrowLeft,
  Sun,
  Moon,
  Info,
  X,
  AlertCircle
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
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [countdown, setCountdown] = useState(30);

  // Display options
  const [darkMode, setDarkMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('');
  const [detailItem, setDetailItem] = useState(null);

  // Month navigation
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-indexed

  const containerRef = useRef(null);

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
        api.get('/providers?limit=100'),
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
      setLastUpdated(new Date());
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
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
  // Shift so Monday is index 0
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Filter schedules for the active view month/year
  const targetPeriodPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  
  let monthSchedules = schedules.filter((s) => {
    if (s.due_date) {
      const d = new Date(s.due_date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    }
    return s.period === targetPeriodPrefix;
  });

  if (selectedVendorFilter) {
    monthSchedules = monthSchedules.filter((s) => String(s.service?.provider_id) === String(selectedVendorFilter));
  }

  // Calculate statistics for top KPI cards
  const totalNominalBulanIni = monthSchedules.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalSisaBulanIni = monthSchedules.reduce((sum, item) => sum + (item.remaining_amount || (item.status === 'PAID' ? 0 : item.amount) || 0), 0);
  
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

  // Today marker
  const isCurrentMonthView = currentDate.getFullYear() === viewYear && currentDate.getMonth() === viewMonth;
  const currentDayNumber = isCurrentMonthView ? currentDate.getDate() : -1;

  // Upcoming 7 Days Priority Queue for Side Ticker
  const upcomingPriorityList = monthSchedules
    .filter((item) => item.status !== 'PAID')
    .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))
    .slice(0, 8);

  const getStatusColorClass = (status, isDark) => {
    switch (status) {
      case 'OVERDUE':
        return isDark 
          ? 'bg-rose-950/80 border-rose-500/80 text-rose-200 shadow-rose-950/50' 
          : 'bg-rose-50 border-rose-300 text-rose-800';
      case 'DUE_TODAY':
        return isDark 
          ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-amber-950/50 animate-pulse' 
          : 'bg-amber-50 border-amber-300 text-amber-800';
      case 'DUE_SOON':
        return isDark 
          ? 'bg-blue-950/80 border-blue-400/80 text-blue-200' 
          : 'bg-blue-50 border-blue-300 text-blue-800';
      case 'PAID':
        return isDark 
          ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300 opacity-75' 
          : 'bg-emerald-50 border-emerald-300 text-emerald-800 opacity-80';
      default:
        return isDark 
          ? 'bg-slate-800/80 border-slate-600 text-slate-300' 
          : 'bg-slate-100 border-slate-300 text-slate-700';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${
        darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* ======================================================== */}
      {/* 1. TOP WALLBOARD HEADER & REALTIME CLOCK                 */}
      {/* ======================================================== */}
      <header className={`px-6 py-3.5 border-b flex flex-col md:flex-row items-center justify-between gap-4 ${
        darkMode ? 'bg-[#111827]/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        {/* Company Brand & Screen Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <ArtacomLogo className="h-9 w-auto" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  FINANCE WALLBOARD
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                  TV MONITOR
                </span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Jadwal Tagihan & Jatuh Tempo Pembayaran Vendor (JIP, iForte, Satkom, Parama, Jedi, dll)
              </p>
            </div>
          </div>
        </div>

        {/* Live Digital Clock & Live Sync Indicator */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="font-mono text-xl md:text-2xl font-bold tracking-tight text-blue-400 drop-shadow-xs">
              {timeString || '12:00:00 WIB'}
            </div>
            <div className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {dateString || 'Senin, 24 Agustus 2026'}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700/50 hidden sm:block"></div>

          {/* Quick Action Controls (Back to App, Fullscreen, Dark/Light, Refresh) */}
          <div className="flex items-center gap-2">
            <div 
              title="Auto Sync Interval"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Sync {countdown}s</span>
            </div>

            <button
              onClick={() => fetchSchedulesData(true)}
              className={`p-2 rounded-lg border transition-colors ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
              title="Refresh Data Sekarang"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-blue-400' : ''} />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition-colors ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
              title="Ganti Mode Gelap / Terang"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg border transition-colors ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
              title="Layar Penuh (Fullscreen TV Mode)"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-lg border font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                darkMode ? 'bg-blue-600/30 hover:bg-blue-600/50 border-blue-500/50 text-blue-300' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
              }`}
            >
              <ArrowLeft size={14} />
              <span>Kembali</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. HIGH-IMPACT KPI OVERVIEW BAR                          */}
      {/* ======================================================== */}
      <section className="px-6 pt-4 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Card 1: Total Kewajiban */}
          <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
            darkMode ? 'bg-[#131b2e] border-slate-800/90' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Total Tagihan {monthNames[viewMonth]}
              </div>
              <div className="font-mono text-lg md:text-xl font-extrabold text-blue-400 mt-0.5">
                {formatIDR(totalNominalBulanIni)}
              </div>
              <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {monthSchedules.length} Tagihan Terjadwal
              </div>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600'}`}>
              <Receipt size={24} />
            </div>
          </div>

          {/* Card 2: Jatuh Tempo Hari Ini */}
          <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
            dueTodayItems.length > 0
              ? (darkMode ? 'bg-amber-950/40 border-amber-500/50 ring-1 ring-amber-500/30' : 'bg-amber-50 border-amber-300 ring-1 ring-amber-400')
              : (darkMode ? 'bg-[#131b2e] border-slate-800/90' : 'bg-white border-slate-200')
          }`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                {dueTodayItems.length > 0 && <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>}
                <span>Due Today (Hari Ini)</span>
              </div>
              <div className="font-mono text-lg md:text-xl font-extrabold text-amber-400 mt-0.5">
                {formatIDR(dueTodayNominal)}
              </div>
              <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-amber-300/80' : 'text-amber-700'}`}>
                {dueTodayItems.length} Tagihan Wajib Dibayar
              </div>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600'}`}>
              <Clock size={24} />
            </div>
          </div>

          {/* Card 3: Overdue Lewat Tempo */}
          <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
            overdueItems.length > 0
              ? (darkMode ? 'bg-rose-950/40 border-rose-500/50 ring-1 ring-rose-500/30' : 'bg-rose-50 border-rose-300 ring-1 ring-rose-400')
              : (darkMode ? 'bg-[#131b2e] border-slate-800/90' : 'bg-white border-slate-200')
          }`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                {overdueItems.length > 0 && <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping"></span>}
                <span>Overdue (Lewat Tempo)</span>
              </div>
              <div className="font-mono text-lg md:text-xl font-extrabold text-rose-400 mt-0.5">
                {formatIDR(overdueNominal)}
              </div>
              <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-rose-300/80' : 'text-rose-700'}`}>
                {overdueItems.length} Tagihan Kritis
              </div>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>

          {/* Card 4: Lunas / Paid */}
          <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
            darkMode ? 'bg-[#131b2e] border-slate-800/90' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Sudah Lunas Terbayar
              </div>
              <div className="font-mono text-lg md:text-xl font-extrabold text-emerald-400 mt-0.5">
                {formatIDR(paidNominal)}
              </div>
              <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
                {paidItems.length} Tagihan Selesai
              </div>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600'}`}>
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. MONTH NAVIGATOR & VENDOR FILTER PILLS                 */}
      {/* ======================================================== */}
      <section className="px-6 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Month Switcher Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className={`p-2 rounded-lg border font-bold text-xs transition-colors flex items-center gap-1 ${
              darkMode ? 'bg-[#1f293d] hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Bulan Lalu</span>
          </button>

          <div className={`px-4 py-1.5 rounded-lg border font-bold text-sm md:text-base font-mono tracking-wide ${
            darkMode ? 'bg-[#111827] border-blue-500/40 text-blue-300 shadow-2xs' : 'bg-white border-blue-300 text-blue-700 shadow-2xs'
          }`}>
            {monthNames[viewMonth]} {viewYear}
          </div>

          <button
            onClick={handleNextMonth}
            className={`p-2 rounded-lg border font-bold text-xs transition-colors flex items-center gap-1 ${
              darkMode ? 'bg-[#1f293d] hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <span className="hidden sm:inline">Bulan Depan</span>
            <ChevronRight size={16} />
          </button>

          <button
            onClick={handleResetToday}
            className={`px-3 py-1.5 rounded-lg border font-semibold text-xs transition-colors ${
              isCurrentMonthView 
                ? (darkMode ? 'bg-blue-600 text-white border-blue-500 font-bold' : 'bg-blue-600 text-white border-blue-600')
                : (darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700')
            }`}
          >
            Hari Ini
          </button>
        </div>

        {/* Vendor Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedVendorFilter('')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
              !selectedVendorFilter
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200')
            }`}
          >
            Semua Vendor ({monthSchedules.length})
          </button>

          {providers.map((prov) => {
            const count = monthSchedules.filter((s) => String(s.service?.provider_id) === String(prov.id)).length;
            const isSelected = String(selectedVendorFilter) === String(prov.id);
            const shortName = getShortVendorName(prov.provider_name);

            return (
              <button
                key={prov.id}
                onClick={() => setSelectedVendorFilter(isSelected ? '' : String(prov.id))}
                className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-2xs ring-2 ring-blue-400/40'
                    : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200')
                }`}
              >
                <span>{shortName}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : (darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-800')
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. MAIN CALENDAR GRID & SIDE PRIORITY QUEUE             */}
      {/* ======================================================== */}
      <main className="px-6 py-2 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* CALENDAR MONTHLY GRID (3 Columns on Large Screen) */}
        <div className={`lg:col-span-3 rounded-2xl border p-4 flex flex-col shadow-sm ${
          darkMode ? 'bg-[#111827]/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-2 text-center pb-2 border-b border-slate-700/40">
            {['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'].map((dayName, idx) => (
              <div
                key={dayName}
                className={`font-mono text-xs font-bold uppercase tracking-wider py-1 ${
                  idx >= 5 
                    ? 'text-rose-400' 
                    : (darkMode ? 'text-slate-400' : 'text-slate-600')
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Cells Grid */}
          <div className="grid grid-cols-7 gap-2 pt-2 flex-1">
            {/* Empty slots for first week padding */}
            {Array.from({ length: adjustedFirstDay }).map((_, idx) => (
              <div 
                key={`empty-${idx}`} 
                className={`rounded-xl border border-dashed min-h-[90px] p-1.5 opacity-25 ${
                  darkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50/50'
                }`}
              />
            ))}

            {/* Actual Days of the Month (1..daysInMonth) */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isToday = isCurrentMonthView && dayNum === currentDayNumber;
              const dayItems = schedulesByDay[dayNum] || [];

              const hasOverdue = dayItems.some((s) => s.status === 'OVERDUE');
              const hasDueToday = dayItems.some((s) => s.status === 'DUE_TODAY');

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`rounded-xl border p-2 flex flex-col min-h-[95px] transition-all relative ${
                    isToday
                      ? (darkMode 
                          ? 'bg-blue-950/40 border-blue-400 ring-2 ring-blue-500/50 shadow-lg shadow-blue-950/50' 
                          : 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-400 shadow-md')
                      : hasOverdue
                      ? (darkMode ? 'bg-rose-950/20 border-rose-900/60' : 'bg-rose-50/40 border-rose-200')
                      : hasDueToday
                      ? (darkMode ? 'bg-amber-950/20 border-amber-900/60' : 'bg-amber-50/40 border-amber-200')
                      : (darkMode ? 'bg-[#141d30]/70 border-slate-800 hover:border-slate-700' : 'bg-slate-50/80 border-slate-200 hover:border-slate-300')
                  }`}
                >
                  {/* Date Header inside Day Box */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-mono text-sm font-bold ${
                      isToday 
                        ? 'px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs' 
                        : (darkMode ? 'text-slate-300' : 'text-slate-700')
                    }`}>
                      {dayNum}
                    </span>

                    {isToday && (
                      <span className="text-[9px] font-bold font-mono tracking-wider px-1.5 py-0.2 rounded bg-blue-500 text-white uppercase">
                        Hari Ini
                      </span>
                    )}

                    {dayItems.length > 0 && !isToday && (
                      <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full ${
                        hasOverdue 
                          ? 'bg-rose-500/20 text-rose-400' 
                          : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700')
                      }`}>
                        {dayItems.length} Inv
                      </span>
                    )}
                  </div>

                  {/* Invoice Chips on this Date */}
                  <div className="space-y-1 overflow-y-auto max-h-[105px] pr-0.5 scrollbar-thin">
                    {dayItems.map((item) => {
                      const shortVendor = getShortVendorName(item.service?.provider?.provider_name);
                      const colorClass = getStatusColorClass(item.status, darkMode);

                      return (
                        <div
                          key={item.id}
                          onClick={() => setDetailItem(item)}
                          className={`p-1.5 rounded-lg border text-left cursor-pointer transition-transform hover:scale-[1.02] shadow-2xs ${colorClass}`}
                          title="Klik untuk melihat rincian invoice"
                        >
                          <div className="flex items-center justify-between gap-1 text-[11px] font-bold leading-tight">
                            <span className="truncate">{shortVendor}</span>
                            <span className="font-mono whitespace-nowrap text-[10px] opacity-90">
                              {formatIDR(item.remaining_amount || item.amount)}
                            </span>
                          </div>
                          <div className="text-[10px] truncate opacity-75 mt-0.5">
                            {item.service?.service_name || item.service?.cid}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDE PRIORITY QUEUE PANEL (Upcoming & Overdue List) */}
        <div className={`rounded-2xl border p-4 flex flex-col shadow-sm ${
          darkMode ? 'bg-[#111827]/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-400" />
              <h3 className="font-bold text-sm tracking-tight">Prioritas Pembayaran</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
              darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}>
              {upcomingPriorityList.length} Antrean
            </span>
          </div>

          {/* List of priority invoices */}
          <div className="space-y-2.5 pt-3 overflow-y-auto flex-1 max-h-[580px] pr-1">
            {upcomingPriorityList.length > 0 ? (
              upcomingPriorityList.map((item) => {
                const shortVendor = getShortVendorName(item.service?.provider?.provider_name);
                const colorClass = getStatusColorClass(item.status, darkMode);

                return (
                  <div
                    key={`side-${item.id}`}
                    onClick={() => setDetailItem(item)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:translate-x-1 shadow-2xs ${colorClass}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Building2 size={13} />
                        <span>{shortVendor}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                        {item.status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold mt-1 truncate">
                      {item.service?.service_name}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/10 text-[11px]">
                      <span className="font-mono font-bold text-sm">
                        {formatIDR(item.remaining_amount || item.amount)}
                      </span>
                      <span className="font-medium opacity-80">
                        Jatuh Tempo: {new Date(item.due_date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs opacity-60">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
                <span>Semua tagihan untuk filter ini telah lunas.</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* 5. MODAL DETAIL INVOICE POPUP (WHEN CLICKED)             */}
      {/* ======================================================== */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl ${
            darkMode ? 'bg-[#111827] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {detailItem.service?.provider?.provider_name}
                </span>
                <h3 className="font-bold text-base mt-1.5">{detailItem.service?.service_name}</h3>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-slate-400 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`grid grid-cols-2 gap-3 p-4 rounded-xl border ${
                darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="text-slate-400 font-medium">Periode Tagihan</div>
                  <div className="font-mono font-bold text-sm mt-0.5">{detailItem.period}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Status Pembayaran</div>
                  <div className="font-bold text-sm mt-0.5">{detailItem.status}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Tanggal Jatuh Tempo</div>
                  <div className="font-bold text-rose-400 text-sm mt-0.5">
                    {new Date(detailItem.due_date).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Nominal Tagihan</div>
                  <div className="font-mono font-extrabold text-blue-400 text-sm mt-0.5">
                    {formatIDR(detailItem.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Circuit ID / Contract</div>
                  <div className="font-mono font-bold mt-0.5">
                    {detailItem.service?.cid || detailItem.service?.contract_number || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Customer Entitas</div>
                  <div className="font-bold mt-0.5">{detailItem.service?.customer?.customer_name}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-700/50">
                  <div className="text-slate-400 font-medium">Catatan / Rincian Invoice</div>
                  <div className="font-mono text-xs mt-0.5">{detailItem.notes || '-'}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-700/50">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-xs"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
