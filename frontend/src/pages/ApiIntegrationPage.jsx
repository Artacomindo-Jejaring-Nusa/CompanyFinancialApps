import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Trash2, 
  Clock, 
  Activity, 
  Code2, 
  Terminal, 
  Globe, 
  Layers, 
  Lock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileText,
  Server,
  Zap,
  Play,
  Download,
  BookOpen
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

  // Documentation tab state
  const [activeCodeTab, setActiveCodeTab] = useState('curl'); // 'curl' | 'node' | 'python' | 'php'
  const [copiedCode, setCopiedCode] = useState(false);

  // Postman state
  const [copiedPostmanCol, setCopiedPostmanCol] = useState(false);
  const [copiedPostmanEnv, setCopiedPostmanEnv] = useState(false);

  // Live API Tester State
  const [testEndpoint, setTestEndpoint] = useState('/integration/payment-reports');
  const [testApiKey, setTestApiKey] = useState('');
  const [testingApi, setTestingApi] = useState(false);
  const [testResponse, setTestResponse] = useState(null);

  // In production it points to https://finance.ajnusa.com/api/v1, or local backend in dev
  const activeBaseUrl = window.location.origin.includes('localhost')
    ? 'http://localhost:8080/api/v1'
    : PROD_BASE_URL;

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
        setTestApiKey(res.data.plain_key || '');
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
    if (!window.confirm(`Yakin ingin menonaktifkan API Key "${name}"? Aplikasi SaaS HRMS yang menggunakan key ini tidak akan dapat mengakses data lagi.`)) {
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
    if (!window.confirm(`Hapus permanen API Key "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
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

  const copyToClipboard = (text, type = 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    } else if (type === 'postman_col') {
      setCopiedPostmanCol(true);
      setTimeout(() => setCopiedPostmanCol(false), 2500);
    } else if (type === 'postman_env') {
      setCopiedPostmanEnv(true);
      setTimeout(() => setCopiedPostmanEnv(false), 2500);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Download json file directly in browser
  const triggerDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Run live test request
  const runLiveTest = async () => {
    setTestingApi(true);
    setTestResponse(null);
    const keyToUse = testApiKey || (newKeyData?.plain_key) || (apiKeys.find(k => k.status === 'ACTIVE')?.key_prefix) || 'YOUR_API_KEY';

    try {
      const res = await fetch(`${activeBaseUrl}${testEndpoint}`, {
        method: 'GET',
        headers: {
          'X-API-Key': keyToUse,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      setTestResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });
    } catch (err) {
      setTestResponse({
        status: 500,
        statusText: 'Client Network Error',
        data: { error: err.message },
      });
    } finally {
      setTestingApi(false);
    }
  };

  const activeKeysCount = apiKeys.filter((k) => k.status === 'ACTIVE').length;

  const getCodeSnippet = () => {
    const keyPlaceholder = testApiKey || (newKeyData?.plain_key) || 'fspms_live_abcdef1234567890';
    const targetUrl = `${PROD_BASE_URL}/integration/payment-reports`;

    switch (activeCodeTab) {
      case 'curl':
        return `# 1. Menggunakan Header X-API-Key (Standar Produksi)
curl -X GET "${targetUrl}?period=2026-11" \\
  -H "X-API-Key: ${keyPlaceholder}" \\
  -H "Accept: application/json"

# 2. Atau Menggunakan Authorization Bearer
curl -X GET "${targetUrl}?period=2026-11" \\
  -H "Authorization: Bearer ${keyPlaceholder}"`;

      case 'node':
        return `// Integrasi Node.js (Axios) untuk Platform SaaS HRMS
import axios from 'axios';

async function syncPaymentReportsToHRMS() {
  try {
    const response = await axios.get('${targetUrl}', {
      headers: {
        'X-API-Key': '${keyPlaceholder}',
        'Accept': 'application/json'
      },
      params: {
        period: '2026-11' // Filter periode bulan tagihan
      }
    });

    console.log('Status Sinkronisasi:', response.data.success);
    console.log('Total Pembayaran:', response.data.data.summary.total_amount);
    console.log('Rincian Beban Vendor:', response.data.data.vendor_breakdown);
    return response.data.data;
  } catch (error) {
    console.error('Gagal integrasi HRMS:', error.response?.data || error.message);
  }
}

syncPaymentReportsToHRMS();`;

      case 'python':
        return `# Integrasi Python (requests) untuk Backend SaaS HRMS
import requests

url = "${targetUrl}"
headers = {
    "X-API-Key": "${keyPlaceholder}",
    "Accept": "application/json"
}
params = {
    "period": "2026-11"
}

response = requests.get(url, headers=headers, params=params)
if response.status_code == 200:
    data = response.json()
    print("Ringkasan Pengeluaran Sukses:", data["data"]["summary"])
    print("Breakdown per Vendor:", data["data"]["vendor_breakdown"])
else:
    print(f"Error {response.status_code}:", response.text)`;

      case 'php':
        return `<?php
// Integrasi PHP / Laravel untuk SaaS HRMS
$apiKey = '${keyPlaceholder}';
$url = '${targetUrl}?period=2026-11';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ' . $apiKey,
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $result = json_decode($response, true);
    print_r($result['data']['summary']);
} else {
    echo "Gagal koneksi API: " . $response;
}`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Settings &amp; Administration
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              SaaS HRMS Integration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl text-slate-900 font-bold mt-1.5 flex items-center gap-2.5">
            <Key className="text-blue-600" size={26} />
            <span>API Integration &amp; Developer Keys</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Kelola API Key dan integrasi otomatis laporan pembayaran tagihan, inventaris sirkuit, dan pengeluaran operasional ke platform SaaS HRMS.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* Info Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Kunci Dibuat</span>
            <Key size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {apiKeys.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Seluruh API Key terdaftar</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Kunci Aktif (Live)</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {activeKeysCount}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Siap menerima request API</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Protokol Keamanan</span>
            <Lock size={16} className="text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-800 mt-2">
            SHA-256 Hash
          </div>
          <div className="text-[11px] text-slate-400 mt-1">One-time plain secret copy</div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
            <span>Production Base URL</span>
            <Globe size={16} className="text-blue-600" />
          </div>
          <div className="text-xs font-bold font-mono text-blue-900 mt-2 truncate" title={PROD_BASE_URL}>
            finance.ajnusa.com/api/v1
          </div>
          <div className="text-[11px] text-blue-600 mt-1">HTTPS RESTful API</div>
        </div>
      </div>

      {/* Newly Generated API Key Alert Banner */}
      {newKeyData && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-emerald-700 shrink-0" size={22} />
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">
                  API Key Baru Berhasil Dibuat: "{newKeyData.name}"
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Salin kunci rahasia ini sekarang! Demi keamanan enkripsi, <strong>kunci ini hanya ditampilkan sekali saja</strong> dan tidak dapat dilihat lagi setelah halaman ditutup.
                </p>
              </div>
            </div>
            <button
              onClick={() => setNewKeyData(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold text-sm px-2 py-1"
            >
              ✕
            </button>
          </div>

          <div className="bg-white border border-emerald-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-mono text-xs font-bold text-slate-900 select-all break-all flex-1">
              {newKeyData.plain_key}
            </span>
            <button
              onClick={() => copyToClipboard(newKeyData.plain_key, 'key')}
              className={`
                px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0
                ${copiedKey 
                  ? 'bg-emerald-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'}
              `}
            >
              {copiedKey ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey ? 'Tersalin!' : 'Salin API Key'}</span>
            </button>
          </div>

          <div className="text-[11px] text-emerald-800 flex items-center gap-1.5">
            <Lock size={12} />
            <span>Gunakan key ini pada header request: <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-mono font-bold">X-API-Key: {newKeyData.key_prefix}...</code></span>
          </div>
        </div>
      )}

      {/* POSTMAN COLLECTION & ENVIRONMENT DOWNLOAD CARD */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/60 border border-orange-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-200/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              P
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Postman Collection &amp; Environment (Ready to Import)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
                  v2.1.0
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Download file JSON Postman resmi yang sudah dikonfigurasi lengkap dengan endpoint <code className="font-mono font-semibold text-orange-900">https://finance.ajnusa.com/api/v1</code>, query parameters, header autentikasi, dan auto test assertions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => triggerDownload('/postman/FSPMS_SaaS_HRMS_Integration.postman_collection.json', 'FSPMS_SaaS_HRMS_Integration.postman_collection.json')}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Download file Postman Collection"
            >
              <Download size={14} />
              <span>Download Collection (.json)</span>
            </button>

            <button
              onClick={() => triggerDownload('/postman/FSPMS_Production.postman_environment.json', 'FSPMS_Production.postman_environment.json')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Download file Postman Environment"
            >
              <Download size={14} />
              <span>Download Environment (.json)</span>
            </button>
          </div>
        </div>

        {/* 4 Steps to Import */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/90 border border-orange-200/80 rounded-lg p-3 space-y-1">
            <div className="font-bold text-orange-950 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Import ke Postman</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Buka aplikasi Postman, klik menu <strong>Import</strong> di pojok kiri atas, lalu pilih kedua file JSON yang di-download.
            </p>
          </div>

          <div className="bg-white/90 border border-orange-200/80 rounded-lg p-3 space-y-1">
            <div className="font-bold text-orange-950 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Pilih Environment</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Di dropdown pojok kanan atas Postman, aktifkan environment <strong>FSPMS - Production (finance.ajnusa.com)</strong>.
            </p>
          </div>

          <div className="bg-white/90 border border-orange-200/80 rounded-lg p-3 space-y-1">
            <div className="font-bold text-orange-950 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
              <span>Isi Nilai apiKey</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Buka tab Environments, isi variabel <code className="font-mono font-semibold text-slate-800">apiKey</code> dengan key yang dibuat di halaman ini.
            </p>
          </div>

          <div className="bg-white/90 border border-orange-200/80 rounded-lg p-3 space-y-1">
            <div className="font-bold text-orange-950 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">4</span>
              <span>Send Request!</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Klik <strong>Send</strong> pada folder <em>Laporan Pembayaran</em> atau <em>Detail Transaksi</em> untuk menerima JSON real-time.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Daftar API Key Terdaftar</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kunci API yang aktif digunakan untuk otentikasi request ke domain <code className="font-mono text-slate-700 font-semibold">{PROD_BASE_URL}</code>
            </p>
          </div>
          <button
            onClick={fetchApiKeys}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            title="Refresh daftar key"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Aplikasi / Integrasi</th>
                <th className="py-3 px-3">Prefix Kunci</th>
                <th className="py-3 px-3">Scope Izin</th>
                <th className="py-3 px-3">Terakhir Digunakan</th>
                <th className="py-3 px-3">Kedaluwarsa</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    Memuat daftar API key...
                  </td>
                </tr>
              ) : apiKeys.length > 0 ? (
                apiKeys.map((key) => {
                  const isActive = key.status === 'ACTIVE';
                  return (
                    <tr key={key.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{key.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          Dibuat: {new Date(key.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {key.key_prefix}...
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {key.scopes ? (
                            key.scopes.split(',').map((s) => (
                              <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 font-mono">
                                {s.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">Semua akses</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                        {key.last_used_at ? (
                          <div className="flex items-center gap-1 font-mono">
                            <Clock size={12} className="text-slate-400" />
                            <span>{new Date(key.last_used_at).toLocaleDateString('id-ID')} {new Date(key.last_used_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum pernah</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                        {key.expires_at ? (
                          new Date(key.expires_at).toLocaleDateString('id-ID')
                        ) : (
                          <span className="text-emerald-700 font-semibold">Tidak pernah (Never)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`
                          px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1
                          ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}
                        `}>
                          {isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span>{key.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isActive && (
                            <button
                              onClick={() => handleRevoke(key.id, key.name)}
                              className="px-2.5 py-1 text-amber-700 hover:bg-amber-50 rounded font-semibold text-[11px] transition-colors"
                              title="Cabut akses API key ini"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(key.id, key.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Hapus API key"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada API Key yang dibuat. Klik tombol <strong>Generate New API Key</strong> di atas untuk membuat kredensial pertama Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Guide & Endpoints Documentation */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-5">
        <div>
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Code2 size={20} className="text-blue-600" />
            <span>Dokumentasi Endpoint Integrasi (SaaS HRMS REST API)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan spesifikasi endpoint di bawah ini untuk menghubungkan aplikasi backend SaaS HRMS ke Finance Portal.
          </p>
        </div>

        {/* Base URL and Auth Spec */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Production Base URL</div>
            <div className="flex items-center justify-between font-bold text-blue-700 select-all">
              <span>{PROD_BASE_URL}</span>
              <button
                onClick={() => copyToClipboard(PROD_BASE_URL)}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="Salin Base URL"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Header Autentikasi</div>
            <div className="flex items-center justify-between font-bold text-slate-800 select-all">
              <span>X-API-Key: fspms_live_...</span>
              <span className="text-[10px] font-sans text-slate-500">atau Bearer &lt;key&gt;</span>
            </div>
          </div>
        </div>

        {/* Endpoints List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
            Daftar Endpoint Terbuka
          </h3>

          {/* Endpoint 1 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-mono">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">GET</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">https://finance.ajnusa.com/api/v1/integration/payment-reports</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Scope: read:payment_reports
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mengambil ringkasan rekapitulasi pembayaran (Total Tagihan, Total Lunas, Sisa Pending/Overdue, serta rincian per Vendor/Provider). Sangat ideal untuk modul expense tracking dan costing report di SaaS HRMS.
            </p>
            <div className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded-lg border border-slate-200">
              Query Parameters: <code className="text-blue-700 font-bold">period=YYYY-MM</code> (e.g. 2026-11), <code className="text-blue-700 font-bold">start_date=YYYY-MM-DD</code>, <code className="text-blue-700 font-bold">end_date=YYYY-MM-DD</code>
            </div>
          </div>

          {/* Endpoint 2 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-mono">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">GET</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">https://finance.ajnusa.com/api/v1/integration/payments</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Scope: read:payments
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mengambil data detail jadwal dan transaksi pembayaran (Nama Toko/Outlet, Circuit ID, Nama Vendor, Tanggal Jatuh Tempo, Nominal, Status Pembayaran).
            </p>
            <div className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded-lg border border-slate-200">
              Query Parameters: <code className="text-blue-700 font-bold">status=PAID|UPCOMING|OVERDUE</code>, <code className="text-blue-700 font-bold">period=YYYY-MM</code>, <code className="text-blue-700 font-bold">page=1</code>, <code className="text-blue-700 font-bold">limit=50</code>
            </div>
          </div>

          {/* Endpoint 3 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-mono">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">GET</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">https://finance.ajnusa.com/api/v1/integration/health</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Public / Health
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Memeriksa status operasional server dan memvalidasi apakah API Key yang digunakan valid dan aktif.
            </p>
          </div>
        </div>

        {/* Code Snippets Section */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-slate-600" />
              <span className="font-bold text-slate-800 text-xs">Contoh Kode Integrasi Siap Pakai</span>
            </div>
            <div className="flex items-center gap-1">
              {['curl', 'node', 'python', 'php'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCodeTab(tab)}
                  className={`
                    px-2.5 py-1 rounded text-xs font-semibold uppercase transition-colors
                    ${activeCodeTab === tab 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}
                  `}
                >
                  {tab === 'node' ? 'Node.js' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{getCodeSnippet()}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(getCodeSnippet())}
              className="absolute right-3 top-3 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedCode ? 'Tersalin' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Live Interactive API Tester */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Play size={16} className="text-emerald-600" />
                <span>Live API Tester Langsung di Browser</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Uji langsung endpoint menggunakan API Key Anda sebelum dihubungkan ke SaaS HRMS.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-4">
              <select
                value={testEndpoint}
                onChange={(e) => setTestEndpoint(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-semibold text-slate-800"
              >
                <option value="/integration/payment-reports">GET /integration/payment-reports</option>
                <option value="/integration/payments">GET /integration/payments</option>
                <option value="/integration/health">GET /integration/health</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Masukkan API Key (X-API-Key)"
                value={testApiKey}
                onChange={(e) => setTestApiKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                onClick={runLiveTest}
                disabled={testingApi}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {testingApi ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                <span>{testingApi ? 'Menguji...' : 'Kirim Test Request'}</span>
              </button>
            </div>
          </div>

          {testResponse && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 font-sans font-semibold">Hasil Response Server:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${testResponse.status === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  HTTP {testResponse.status} {testResponse.statusText}
                </span>
              </div>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                <code>{JSON.stringify(testResponse.data, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Generate New API Key */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Key size={18} className="text-blue-600" />
                <span>Buat API Key Baru</span>
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800">
                  Nama Key / Nama Platform *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SaaS HRMS Expense Sync Server / Production"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-1 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Identifikasi sistem atau server yang akan menggunakan kunci ini.
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-800">Masa Berlaku (Expiration)</label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-1 font-semibold text-slate-800"
                >
                  <option value="never">Tanpa Batas Waktu (Never Expire - Direkomendasikan untuk Server)</option>
                  <option value="30d">30 Hari</option>
                  <option value="90d">90 Hari</option>
                  <option value="1y">1 Tahun</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1.5">
                  Scope Izin Akses (Permissions)
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-sans">
                    <input
                      type="checkbox"
                      checked={scopes.includes('read:payment_reports')}
                      onChange={(e) => {
                        if (e.target.checked) setScopes([...scopes, 'read:payment_reports']);
                        else setScopes(scopes.filter(s => s !== 'read:payment_reports'));
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800">read:payment_reports</div>
                      <div className="text-[11px] text-slate-500">Mengakses laporan rekapitulasi pembayaran &amp; pengeluaran per vendor.</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-sans">
                    <input
                      type="checkbox"
                      checked={scopes.includes('read:payments')}
                      onChange={(e) => {
                        if (e.target.checked) setScopes([...scopes, 'read:payments']);
                        else setScopes(scopes.filter(s => s !== 'read:payments'));
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800">read:payments</div>
                      <div className="text-[11px] text-slate-500">Membaca daftar rincian invoice transaksi pembayaran &amp; CID sirkuit.</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-sans">
                    <input
                      type="checkbox"
                      checked={scopes.includes('read:services')}
                      onChange={(e) => {
                        if (e.target.checked) setScopes([...scopes, 'read:services']);
                        else setScopes(scopes.filter(s => s !== 'read:services'));
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800">read:services</div>
                      <div className="text-[11px] text-slate-500">Membaca data master sirkuit &amp; langganan.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  {submitting ? 'Memproses...' : 'Buat & Generate Kunci'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
