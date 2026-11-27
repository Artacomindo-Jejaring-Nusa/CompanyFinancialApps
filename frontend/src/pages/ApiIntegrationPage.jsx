import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Download,
  RefreshCw
} from 'lucide-react';

const PROD_BASE_URL = 'https://finance.ajnusa.com/api/v1';

export default function ApiIntegrationPage() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal Create State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [expiresIn, setExpiresIn] = useState('never');
  const [scopes, setScopes] = useState(['read:payment_reports', 'read:payments']);
  const [submitting, setSubmitting] = useState(false);

  // Newly Generated Key Modal (One-time Display)
  const [newKeyData, setNewKeyData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api-keys');
      if (res.success && res.data) {
        setApiKeys(res.data);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar API Key');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: nameInput.trim(),
        expires_in: expiresIn,
        scopes: scopes.join(','),
      };

      const res = await api.post('/api-keys', payload);
      if (res.success && res.data) {
        setNewKeyData(res.data);
        setCreateModalOpen(false);
        setNameInput('');
        fetchApiKeys();
      }
    } catch (err) {
      alert(err.message || 'Gagal membuat API key');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id, name) => {
    if (!window.confirm(`Yakin ingin menonaktifkan API Key "${name}"?`)) {
      return;
    }

    try {
      const res = await api.put(`/api-keys/${id}/revoke`);
      if (res.success) {
        fetchApiKeys();
      }
    } catch (err) {
      alert(err.message || 'Gagal mencabut API key');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus permanen API Key "${name}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/api-keys/${id}`);
      if (res.success) {
        fetchApiKeys();
      }
    } catch (err) {
      alert(err.message || 'Gagal menghapus API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const triggerDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            API Integration &amp; Developer Keys
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Manajemen API key dan integrasi data pembayaran ke platform SaaS HRMS.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => triggerDownload('/postman/FSPMS_SaaS_HRMS_Integration.postman_collection.json', 'FSPMS_SaaS_HRMS_Integration.postman_collection.json')}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
            title="Download Postman Collection (.json)"
          >
            <Download size={13} />
            <span>Postman Collection</span>
          </button>

          <button
            onClick={() => triggerDownload('/postman/FSPMS_Production.postman_environment.json', 'FSPMS_Production.postman_environment.json')}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
            title="Download Postman Environment (.json)"
          >
            <Download size={13} />
            <span>Environment</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Generate New API Key</span>
          </button>
        </div>
      </div>

      {/* Production Info Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400 font-sans font-medium">Base URL:</span>
          <span className="font-semibold text-slate-900 select-all">{PROD_BASE_URL}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>Auth Header: <code className="font-mono text-slate-800 font-semibold">X-API-Key: &lt;key&gt;</code></span>
          <span>Response: <code className="font-mono text-slate-800 font-semibold">application/json</code></span>
        </div>
      </div>

      {/* Newly Generated Secret Banner */}
      {newKeyData && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-emerald-900">
              API Key Baru: "{newKeyData.name}"
            </div>
            <button
              onClick={() => setNewKeyData(null)}
              className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-emerald-800">
            Salin kunci ini sekarang. Demi keamanan, kunci tidak akan ditampilkan lagi setelah ditutup.
          </p>
          <div className="bg-white border border-emerald-200 rounded p-2 flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-slate-900 select-all break-all">
              {newKeyData.plain_key}
            </span>
            <button
              onClick={() => copyToClipboard(newKeyData.plain_key)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shrink-0 flex items-center gap-1"
            >
              {copiedKey ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedKey ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        </div>
      )}

      {/* API Keys Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Daftar API Key
          </h2>
          <button
            onClick={fetchApiKeys}
            className="text-slate-400 hover:text-slate-700 text-xs flex items-center gap-1"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Nama Key</th>
                <th className="py-2.5 px-3">Prefix</th>
                <th className="py-2.5 px-3">Scope</th>
                <th className="py-2.5 px-3">Terakhir Dipakai</th>
                <th className="py-2.5 px-3">Kedaluwarsa</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat...
                  </td>
                </tr>
              ) : apiKeys.length > 0 ? (
                apiKeys.map((key) => {
                  const isActive = key.status === 'ACTIVE';
                  return (
                    <tr key={key.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {key.name}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(key.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {key.key_prefix}...
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600">
                        {key.scopes ? key.scopes.split(',').join(', ') : 'All'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {key.last_used_at 
                          ? new Date(key.last_used_at).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {key.expires_at 
                          ? new Date(key.expires_at).toLocaleDateString('id-ID')
                          : 'Never'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isActive 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {key.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isActive && (
                            <button
                              onClick={() => handleRevoke(key.id, key.name)}
                              className="text-amber-600 hover:text-amber-800 text-[11px] font-medium"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(key.id, key.name)}
                            className="text-slate-400 hover:text-red-600"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada API Key. Klik "+ Generate New API Key" untuk membuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Generate API Key */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-5 space-y-4 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">
                Generate API Key
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Nama Key *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SaaS HRMS Production"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Masa Berlaku
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 text-slate-800"
                >
                  <option value="never">Tanpa Batas (Never)</option>
                  <option value="30d">30 Hari</option>
                  <option value="90d">90 Hari</option>
                  <option value="1y">1 Tahun</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Scope Izin
                </label>
                <div className="space-y-1.5 border border-slate-200 rounded p-2.5 bg-slate-50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scopes.includes('read:payment_reports')}
                      onChange={(e) => {
                        if (e.target.checked) setScopes([...scopes, 'read:payment_reports']);
                        else setScopes(scopes.filter(s => s !== 'read:payment_reports'));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-800 font-medium">read:payment_reports (Laporan Pembayaran)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scopes.includes('read:payments')}
                      onChange={(e) => {
                        if (e.target.checked) setScopes([...scopes, 'read:payments']);
                        else setScopes(scopes.filter(s => s !== 'read:payments'));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-800 font-medium">read:payments (Rincian Invoice &amp; Jadwal)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scopes.includes('read:services')}
                      onChange={(e) => {
                        if (e.target.checked) setScopes([...scopes, 'read:services']);
                        else setScopes(scopes.filter(s => s !== 'read:services'));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-800 font-medium">read:services (Master Sirkuit)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                >
                  {submitting ? 'Menyimpan...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
