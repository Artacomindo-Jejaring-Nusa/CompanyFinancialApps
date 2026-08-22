import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Building2, 
  Plus, 
  Database, 
  CheckCircle2, 
  X,
  Layers,
  Search,
  Server,
  Edit3,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';

export default function MasterDataPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'CUSTOMERS';

  const [customers, setCustomers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [cPage, setCPage] = useState(1);
  const [cLimit, setCLimit] = useState(10);

  const [pPage, setPPage] = useState(1);
  const [pLimit, setPLimit] = useState(10);

  // Customer Modal Form (Create & Edit)
  const [cModalOpen, setCModalOpen] = useState(false);
  const [cEditing, setCEditing] = useState(null);
  const [cForm, setCForm] = useState({ customer_code: '', customer_name: '', contact: '', notes: '', status: 'ACTIVE' });

  // Provider Modal Form (Create & Edit)
  const [pModalOpen, setPModalOpen] = useState(false);
  const [pEditing, setPEditing] = useState(null);
  const [pForm, setPForm] = useState({ provider_code: '', provider_name: '', contact: '', email: '', phone: '', address: '', status: 'ACTIVE' });

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'CUSTOMER'|'PROVIDER', item }

  const [submitting, setSubmitting] = useState(false);

  // Search state
  const [masterSearch, setMasterSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/providers?limit=100'),
      ]);
      setCustomers(cRes.data || []);
      setProviders(pRes.data || []);
    } catch (err) {
      console.error("Failed to load master data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  // --- CUSTOMER CRUD ---
  const openAddCustomer = () => {
    setCEditing(null);
    setCForm({ customer_code: '', customer_name: '', contact: '', notes: '', status: 'ACTIVE' });
    setCModalOpen(true);
  };

  const openEditCustomer = (c) => {
    setCEditing(c);
    setCForm({
      customer_code: c.customer_code || '',
      customer_name: c.customer_name || '',
      contact: c.contact || '',
      notes: c.notes || '',
      status: c.status || 'ACTIVE',
    });
    setCModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (cEditing) {
        const res = await api.put(`/customers/${cEditing.id}`, cForm);
        if (res.success) {
          setCModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/customers', cForm);
        if (res.success) {
          setCModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  // --- PROVIDER CRUD ---
  const openAddProvider = () => {
    setPEditing(null);
    setPForm({ provider_code: '', provider_name: '', contact: '', email: '', phone: '', address: '', status: 'ACTIVE' });
    setPModalOpen(true);
  };

  const openEditProvider = (p) => {
    setPEditing(p);
    setPForm({
      provider_code: p.provider_code || '',
      provider_name: p.provider_name || '',
      contact: p.contact || '',
      email: p.email || '',
      phone: p.phone || '',
      address: p.address || '',
      status: p.status || 'ACTIVE',
    });
    setPModalOpen(true);
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (pEditing) {
        const res = await api.put(`/providers/${pEditing.id}`, pForm);
        if (res.success) {
          setPModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/providers', pForm);
        if (res.success) {
          setPModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save provider');
    } finally {
      setSubmitting(false);
    }
  };

  // --- DELETE CONFIRMATION HANDLER ---
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const { type, item } = deleteTarget;
      let endpoint = '';
      if (type === 'CUSTOMER') endpoint = `/customers/${item.id}`;
      else if (type === 'PROVIDER') endpoint = `/providers/${item.id}`;

      const res = await api.delete(endpoint);
      if (res.success) {
        setDeleteTarget(null);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side search filtering
  const sLower = masterSearch.trim().toLowerCase();
  const filteredCustomers = sLower
    ? customers.filter((c) =>
        (c.customer_code || '').toLowerCase().includes(sLower) ||
        (c.customer_name || '').toLowerCase().includes(sLower) ||
        (c.contact || '').toLowerCase().includes(sLower)
      )
    : customers;

  const filteredProviders = sLower
    ? providers.filter((p) =>
        (p.provider_code || '').toLowerCase().includes(sLower) ||
        (p.provider_name || '').toLowerCase().includes(sLower) ||
        (p.contact || '').toLowerCase().includes(sLower) ||
        (p.email || '').toLowerCase().includes(sLower)
      )
    : providers;

  // Paginated Slices
  const paginatedCustomers = filteredCustomers.slice((cPage - 1) * cLimit, cPage * cLimit);
  const cTotalPages = Math.ceil(filteredCustomers.length / cLimit) || 1;

  const paginatedProviders = filteredProviders.slice((pPage - 1) * pLimit, pPage * pLimit);
  const pTotalPages = Math.ceil(filteredProviders.length / pLimit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">Master Data Management</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Pusat konfigurasi referensi utama untuk Customers dan Provider Layanan.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/40">
        {[
          { key: 'CUSTOMERS', label: 'Customers (Perusahaan Pelanggan)', count: customers.length },
          { key: 'PROVIDERS', label: 'Providers (Vendor / Principal)', count: providers.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2.5 font-label-md text-label-md font-semibold border-b-2 transition-colors
              ${(activeTab === tab.key || (activeTab === 'SERVICE_TYPES' && tab.key === 'CUSTOMERS')) 
                ? 'border-blue-600 text-blue-600 bg-blue-50/60 rounded-t-lg font-bold' 
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
            `}
          >
            <span>{tab.label}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder={activeTab === 'CUSTOMERS' ? 'Search customer code, name, contact...' : 'Search provider code, name, email...'}
          value={masterSearch}
          onChange={(e) => { setMasterSearch(e.target.value); setCPage(1); setPPage(1); }}
          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* 1. CUSTOMERS TAB */}
      {(activeTab === 'CUSTOMERS' || activeTab === 'SERVICE_TYPES') && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">Data entitas perusahaan pemegang kontrak tagihan (Alfamart, Artacom, dll). <span className="font-bold text-slate-700">{filteredCustomers.length} data</span></p>
            <button
              onClick={openAddCustomer}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-xs"
            >
              <Plus size={16} />
              <span>Add Customer</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
            {loading ? (
              <div className="p-6">
                <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                  <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                </div>
                <TableSkeleton rows={5} cols={5} />
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Customer Name</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {paginatedCustomers.length > 0 ? (
                      paginatedCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.customer_code}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{c.customer_name}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{c.contact || '-'}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{c.status}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditCustomer(c)}
                                className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Edit Customer"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'CUSTOMER', item: c })}
                                className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Customer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                          Tidak ada data customer yang sesuai dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <Pagination
                  currentPage={cPage}
                  totalPages={cTotalPages}
                  totalItems={filteredCustomers.length}
                  limit={cLimit}
                  onPageChange={(p) => setCPage(p)}
                  onLimitChange={(l) => { setCLimit(l); setCPage(1); }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. PROVIDERS TAB */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">Data vendor penyedia layanan jaringan, cloud hosting, dan lisensi (Biznet, Telkom, AWS, Google, dll). <span className="font-bold text-slate-700">{filteredProviders.length} data</span></p>
            <button
              onClick={openAddProvider}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-xs"
            >
              <Plus size={16} />
              <span>Add Provider</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
            {loading ? (
              <div className="p-6">
                <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                  <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                </div>
                <TableSkeleton rows={5} cols={6} />
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-[12px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Provider Name</th>
                      <th className="py-3.5 px-4">Contact Person</th>
                      <th className="py-3.5 px-4">Email & Phone</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {paginatedProviders.length > 0 ? (
                      paginatedProviders.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.provider_code}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{p.provider_name}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{p.contact || '-'}</td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                            <div>{p.email}</div>
                            <div className="text-slate-500">{p.phone}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{p.status}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditProvider(p)}
                                className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Edit Provider"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'PROVIDER', item: p })}
                                className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Provider"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                          Tidak ada data provider yang sesuai dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <Pagination
                  currentPage={pPage}
                  totalPages={pTotalPages}
                  totalItems={filteredProviders.length}
                  limit={pLimit}
                  onPageChange={(p) => setPPage(p)}
                  onLimitChange={(l) => { setPLimit(l); setPPage(1); }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Customer Modal (CREATE & EDIT) */}
      {cModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {cEditing ? `Edit Customer: ${cEditing.customer_name}` : 'Add Customer'}
              </h3>
              <button onClick={() => setCModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Customer Code *</label>
                <input type="text" required placeholder="CUST-001" value={cForm.customer_code} onChange={(e) => setCForm({ ...cForm, customer_code: e.target.value })} className="w-full border rounded-lg p-2 mt-1 font-mono font-bold" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Customer Name *</label>
                <input type="text" required placeholder="PT Sumber Alfaria Trijaya Tbk" value={cForm.customer_name} onChange={(e) => setCForm({ ...cForm, customer_name: e.target.value })} className="w-full border rounded-lg p-2 mt-1 font-semibold" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Contact</label>
                <input type="text" placeholder="08123456789" value={cForm.contact} onChange={(e) => setCForm({ ...cForm, contact: e.target.value })} className="w-full border rounded-lg p-2 mt-1" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Status</label>
                <select value={cForm.status} onChange={(e) => setCForm({ ...cForm, status: e.target.value })} className="w-full border rounded-lg p-2 mt-1">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setCModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provider Modal (CREATE & EDIT) */}
      {pModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {pEditing ? `Edit Provider: ${pEditing.provider_name}` : 'Add Provider'}
              </h3>
              <button onClick={() => setPModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProvider} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800">Provider Code *</label>
                <input type="text" required placeholder="PROV-001" value={pForm.provider_code} onChange={(e) => setPForm({ ...pForm, provider_code: e.target.value })} className="w-full border rounded-lg p-2 mt-1 font-mono font-bold" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Provider Name *</label>
                <input type="text" required placeholder="Biznet Networks" value={pForm.provider_name} onChange={(e) => setPForm({ ...pForm, provider_name: e.target.value })} className="w-full border rounded-lg p-2 mt-1 font-semibold" />
              </div>
              <div>
                <label className="font-semibold text-slate-800">Email & Phone</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input type="email" placeholder="billing@provider.com" value={pForm.email} onChange={(e) => setPForm({ ...pForm, email: e.target.value })} className="border rounded-lg p-2 text-xs" />
                  <input type="text" placeholder="021-57998888" value={pForm.phone} onChange={(e) => setPForm({ ...pForm, phone: e.target.value })} className="border rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-800">Status</label>
                <select value={pForm.status} onChange={(e) => setPForm({ ...pForm, status: e.target.value })} className="w-full border rounded-lg p-2 mt-1">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setPModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                  {submitting ? 'Saving...' : 'Save Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={24} />
              <h3 className="font-bold text-slate-900 text-base">Confirm Deletion</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data master ini?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                {submitting ? 'Deleting...' : 'Delete Master Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
