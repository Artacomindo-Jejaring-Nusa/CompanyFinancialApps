import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import ArtacomLogo from '../components/ArtacomLogo';
import api from '../services/api';
import { 
  LayoutDashboard, 
  CreditCard, 
  Layers, 
  Database, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  LogOut, 
  Search, 
  Bell,
  Menu,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Truck,
  Tag,
  FileText,
  Calendar,
  Globe,
  Cloud,
  Laptop,
  Store,
  ArrowRight,
  Loader2,
  Trash2
} from 'lucide-react';

export default function MainLayout() {
  const { user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Search states
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalResults, setGlobalResults] = useState({ services: [], schedules: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Notification Center states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close search and notification dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Live Notifications on mount and periodically
  useEffect(() => {
    fetchLiveNotifications();
  }, [location.pathname]);

  const fetchLiveNotifications = async () => {
    try {
      const [overdueRes, dueSoonRes, auditRes] = await Promise.all([
        api.get('/payment-schedules?status=OVERDUE&limit=5'),
        api.get('/payment-schedules?status=DUE_SOON&limit=5'),
        api.get('/audit-logs?limit=3'),
      ]);

      const items = [];
      const overdueData = overdueRes.data || [];
      const dueSoonData = dueSoonRes.data || [];
      const auditData = auditRes.data || [];

      if (overdueData.length > 0) {
        items.push({
          id: 'overdue-alert',
          type: 'OVERDUE',
          title: `${overdueData.length} Tagihan Overdue Terdeteksi`,
          description: `Terdapat ${overdueData.length} sirkuit FO dengan tagihan melewati jatuh tempo yang membutuhkan tindakan segera.`,
          time: 'Action Required',
          link: '/payments?tab=OVERDUE',
          count: overdueData.length,
          icon: AlertTriangle,
          color: 'rose',
        });
      }

      if (dueSoonData.length > 0) {
        items.push({
          id: 'duesoon-alert',
          type: 'DUE_SOON',
          title: `${dueSoonData.length} Tagihan Jatuh Tempo (H-7)`,
          description: `Persiapkan pembayaran tagihan FO yang akan jatuh tempo dalam 7 hari ke depan.`,
          time: 'Due This Week',
          link: '/payments?tab=DUE_SOON',
          count: dueSoonData.length,
          icon: Clock,
          color: 'amber',
        });
      }

      // Grace Period System Notification
      items.push({
        id: 'grace-info',
        type: 'GRACE_PERIOD',
        title: 'Fitur Grace Period Aktif',
        description: 'Jika seluruh tagihan FO bulan berjalan lunas, sistem akan otomatis beralih ke periode berikutnya.',
        time: 'System Info',
        link: '/payments?tab=ALL',
        icon: CheckCircle2,
        color: 'emerald',
      });

      if (auditData.length > 0) {
        items.push({
          id: 'audit-info',
          type: 'AUDIT',
          title: 'System Audit Trail Terbaru',
          description: `Aktivitas terakhir: ${auditData[0].action} pada entity ${auditData[0].entity}.`,
          time: new Date(auditData[0].timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          link: '/audit-logs',
          icon: ShieldCheck,
          color: 'blue',
        });
      }

      // Load dismissed notifications from localStorage
      const dismissedRaw = localStorage.getItem('fspms_dismissed_notifications');
      const dismissedIds = dismissedRaw ? JSON.parse(dismissedRaw) : [];
      const filteredItems = items.filter((item) => !dismissedIds.includes(item.id));

      const isRead = localStorage.getItem('fspms_notifications_read') === 'true';

      setNotifications(filteredItems);
      setUnreadCount(isRead ? 0 : (overdueData.length + dueSoonData.length));
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const handleNotificationClick = (item) => {
    setNotificationsOpen(false);
    navigate(item.link);
  };

  const handleClearNotifications = () => {
    setUnreadCount(0);
    localStorage.setItem('fspms_notifications_read', 'true');
  };

  const handleRemoveNotification = (id, e) => {
    e.stopPropagation();
    setNotifications((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      const dismissedRaw = localStorage.getItem('fspms_dismissed_notifications');
      const dismissedIds = dismissedRaw ? JSON.parse(dismissedRaw) : [];
      if (!dismissedIds.includes(id)) {
        dismissedIds.push(id);
        localStorage.setItem('fspms_dismissed_notifications', JSON.stringify(dismissedIds));
      }
      return updated;
    });
  };

  const handleClearAllNotifications = () => {
    const currentIds = notifications.map((n) => n.id);
    const dismissedRaw = localStorage.getItem('fspms_dismissed_notifications');
    const dismissedIds = dismissedRaw ? JSON.parse(dismissedRaw) : [];
    const newDismissed = Array.from(new Set([...dismissedIds, ...currentIds]));
    localStorage.setItem('fspms_dismissed_notifications', JSON.stringify(newDismissed));
    localStorage.setItem('fspms_notifications_read', 'true');

    setNotifications([]);
    setUnreadCount(0);
  };

  // Debounced Global Search Handler
  useEffect(() => {
    const query = globalSearchQuery.trim();
    if (!query || query.length < 2) {
      setGlobalResults({ services: [], schedules: [] });
      setSearchDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [servicesRes, schedulesRes] = await Promise.all([
          api.get(`/services?search=${encodeURIComponent(query)}&limit=5`),
          api.get(`/payment-schedules?search=${encodeURIComponent(query)}&limit=5`),
        ]);

        setGlobalResults({
          services: servicesRes.data || [],
          schedules: schedulesRes.data || [],
        });
        setSearchDropdownOpen(true);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [globalSearchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    setSearchDropdownOpen(false);
    navigate(`/services?search=${encodeURIComponent(globalSearchQuery.trim())}`);
  };

  const handleSelectService = (service) => {
    setSearchDropdownOpen(false);
    setGlobalSearchQuery('');
    navigate(`/services?search=${encodeURIComponent(service.cid || service.service_name)}`);
  };

  const handleSelectSchedule = (schedule) => {
    setSearchDropdownOpen(false);
    setGlobalSearchQuery('');
    navigate(`/payments?search=${encodeURIComponent(schedule.service?.cid || schedule.service?.service_name || '')}`);
  };

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const navigationGroups = [
    {
      title: 'CORE',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'SERVICES & TAGIHAN',
      items: [
        { name: 'Tagihan Internet & FO', path: '/services/internet', icon: Globe },
        { name: 'Tagihan Hosting & Cloud', path: '/services/hosting', icon: Cloud },
        { name: 'Tagihan Software & SaaS', path: '/services/software', icon: Laptop },
        { name: 'Semua Services Registry', path: '/services', icon: Layers },
      ],
    },
    {
      title: 'PAYMENTS',
      items: [
        { name: 'Upcoming Schedules', path: '/payments?tab=ALL', icon: Clock },
        { name: 'Due Soon (7 Days)', path: '/payments?tab=DUE_SOON', icon: Calendar },
        { name: 'Overdue Risk', path: '/payments?tab=OVERDUE', icon: AlertTriangle },
        { name: 'Paid History', path: '/payments?tab=PAID', icon: CheckCircle2 },
      ],
    },
    {
      title: 'REPORTS',
      items: [
        { name: 'Financial Reports', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        { name: 'Customers', path: '/master-data?tab=CUSTOMERS', icon: Building2 },
        { name: 'Providers / Vendors', path: '/master-data?tab=PROVIDERS', icon: Truck },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        ...(hasRole('admin') ? [{ name: 'User Management', path: '/users', icon: Users }] : []),
        ...(hasRole('admin', 'finance_supervisor', 'finance_manager', 'auditor') ? [{ name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck }] : []),
      ],
    },
  ];

  const isLinkActive = (itemPath) => {
    const currentUrl = location.pathname + location.search;
    if (itemPath.includes('?')) {
      return currentUrl === itemPath;
    }
    return location.pathname === itemPath && !location.search;
  };

  const totalResults = globalResults.services.length + globalResults.schedules.length;

  return (
    <div className="flex h-screen bg-slate-50/50 font-body-lg text-slate-800 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80
        flex flex-col justify-between transition-transform duration-200 ease-in-out shadow-xs
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <ArtacomLogo className="h-8 w-auto" />
              <div className="h-7 w-px bg-slate-300"></div>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-slate-900 text-xs tracking-tight">Finance</span>
                <span className="font-bold text-blue-600 text-[10px] tracking-widest uppercase mt-0.5">Ajnusa</span>
              </div>
            </div>
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links Grouped */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-medium">
            {navigationGroups.map((group, idx) => {
              if (group.items.length === 0) return null;
              return (
                <div key={idx} className="space-y-1">
                  <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {group.title}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isLinkActive(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-xs transition-colors
                          ${active 
                            ? 'bg-blue-50 text-blue-600 font-bold' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                        `}
                      >
                        <Icon size={16} className={active ? 'text-blue-600' : 'text-slate-400'} />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer - User Profile & Logout */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-slate-900 text-xs truncate">
                  {user?.full_name || 'User'}
                </span>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                  {user?.role?.name || 'Staff'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Interactive Global Search Bar */}
            <div className="relative hidden md:block w-80" ref={searchContainerRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search CID, Store Name, Site ID, Provider..."
                  value={globalSearchQuery}
                  onFocus={() => {
                    if (globalSearchQuery.trim().length >= 2) setSearchDropdownOpen(true);
                  }}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 font-medium text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-colors"
                />
                {searchLoading ? (
                  <Loader2 className="absolute right-2.5 top-2.5 text-blue-600 animate-spin" size={15} />
                ) : globalSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => { setGlobalSearchQuery(''); setSearchDropdownOpen(false); }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                ) : null}
              </form>

              {/* Instant Search Results Dropdown Overlay */}
              {searchDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                  {totalResults > 0 ? (
                    <div className="p-2 space-y-3 text-xs">
                      {/* Services & FO Outlets Category */}
                      {globalResults.services.length > 0 && (
                        <div>
                          <div className="px-2 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
                            <span>Sirkuit & Layanan ({globalResults.services.length})</span>
                          </div>
                          <div className="space-y-1 mt-1">
                            {globalResults.services.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => handleSelectService(item)}
                                className="p-2 rounded-lg hover:bg-blue-50/70 cursor-pointer transition-colors flex items-center justify-between group"
                              >
                                <div>
                                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <Store size={13} className="text-blue-600 shrink-0" />
                                    <span>{item.service_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                                    <span>CID: <strong className="text-slate-800">{item.cid || '-'}</strong></span>
                                    <span>•</span>
                                    <span>Site: <strong className="text-blue-700">{item.site_id || '-'}</strong></span>
                                    <span>•</span>
                                    <span>{item.provider?.provider_name}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono font-bold text-slate-900 text-xs">{formatIDR(item.amount)}</div>
                                  <div className="text-[10px] text-emerald-600 font-semibold">{item.status}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Payment Schedules Category */}
                      {globalResults.schedules.length > 0 && (
                        <div className="border-t border-slate-100 pt-2">
                          <div className="px-2 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                            <span>Jadwal Tagihan ({globalResults.schedules.length})</span>
                          </div>
                          <div className="space-y-1 mt-1">
                            {globalResults.schedules.map((sched) => (
                              <div
                                key={sched.id}
                                onClick={() => handleSelectSchedule(sched)}
                                className="p-2 rounded-lg hover:bg-blue-50/70 cursor-pointer transition-colors flex items-center justify-between group"
                              >
                                <div>
                                  <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                    <Clock size={13} className="text-purple-600 shrink-0" />
                                    <span>{sched.service?.service_name || 'Tagihan Layanan'}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    <span>Periode: <strong>{sched.period}</strong></span>
                                    <span> • Jatuh Tempo: {sched.due_date ? new Date(sched.due_date).toLocaleDateString('id-ID') : '-'}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono font-bold text-slate-900 text-xs">{formatIDR(sched.amount)}</div>
                                  <span className={`text-[10px] font-bold ${sched.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {sched.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Link */}
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full text-center py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1 border-t border-slate-100 mt-1"
                      >
                        <span>Lihat Semua Hasil Pencarian "{globalSearchQuery}"</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 font-medium">
                      Tidak ditemukan sirkuit, CID, atau tagihan dengan kata kunci "<strong className="text-slate-800">{globalSearchQuery}</strong>"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative p-2 rounded-full transition-colors ${
                  notificationsOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Pemberitahuan & Peringatan Tagihan"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Dropdown Header */}
                  <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Bell size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">Notifikasi Finansial</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Alert tagihan & update sistem real-time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleClearNotifications}
                          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <>
                          {unreadCount > 0 && <span className="text-slate-300">•</span>}
                          <button
                            onClick={handleClearAllNotifications}
                            className="font-semibold text-rose-500 hover:text-rose-600 hover:underline"
                            title="Hapus semua notifikasi"
                          >
                            Hapus Semua
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notification Items List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map((item) => {
                        const Icon = item.icon;
                        const colorMap = {
                          rose: 'bg-rose-50 text-rose-600 border-rose-200',
                          amber: 'bg-amber-50 text-amber-600 border-amber-200',
                          emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                          blue: 'bg-blue-50 text-blue-600 border-blue-200',
                        };

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 group relative"
                          >
                            <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${colorMap[item.color] || 'bg-slate-50 text-slate-600'}`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                  {item.title}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                                  {item.time}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleRemoveNotification(item.id, e)}
                              className="absolute right-2 top-3 p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                              title="Hapus Notifikasi Ini"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500">
                        Tidak ada notifikasi baru saat ini.
                      </div>
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="pt-2 px-3 border-t border-slate-100">
                    <button
                      onClick={() => { setNotificationsOpen(false); navigate('/payments'); }}
                      className="w-full py-2 text-center text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Buka Single Inbox Payment Monitoring</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200"></div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-600">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
