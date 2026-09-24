import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FolderTree,
  FolderPlus,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart3,
  Layers,
  Edit3,
  Trash2,
  Eye,
  X,
  FileSpreadsheet,
  Globe,
  Cloud,
  Laptop,
  Smartphone,
  Info,
  ArrowUpRight,
  Filter,
  Briefcase
} from 'lucide-react';

export default function ProjectsPage({ defaultTab = 'hierarchy' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || defaultTab;

  const [activeTab, setActiveTab] = useState(currentTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [expandedProjects, setExpandedProjects] = useState({ 'PRJ-ALFA-2026': true, 'PRJ-INDO-2026': true, 'PRJ-INTERNAL-OPS': false });

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'PARENT', // 'PARENT' or 'SUB'
    parent_id: '',
    project_code: '',
    project_name: '',
    customer_name: '',
    customer_id: '',
    budget: '',
    contract_value: '',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    pic: '',
    status: 'ACTIVE',
    description: '',
  });

  // Mock / Initial Data for Projects & Sub-Projects (Hierarchical)
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('artacom_projects_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'PRJ-ALFA-2026',
        code: 'PRJ-ALFA-2026',
        name: 'Pengadaan & Managed Connectivity Alfamart Nasional',
        customer_name: 'PT Sumber Alfaria Trijaya Tbk',
        contract_value: 2850000000,
        budget: 1850000000,
        realized_cost: 642500000,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        status: 'ACTIVE',
        pic: 'Ahmad Fauzi (Head of Project Delivery)',
        description: 'Penyediaan sirkuit FO, backup 4G router, dan monitoring server untuk 350+ gerai Alfamart wilayah Jawa & Bali.',
        sub_projects: [
          {
            id: 'SUB-ALFA-JABAR',
            parent_id: 'PRJ-ALFA-2026',
            code: 'SUB-ALFA-JABAR',
            name: 'Rollout FO & Backup Router Region Jawa Barat (DC Balaraja & Cikokol)',
            budget: 850000000,
            realized_cost: 320000000,
            fo_count: 142,
            cellular_count: 28,
            server_count: 2,
            pic: 'Rudi Hermawan',
            status: 'ACTIVE',
            start_date: '2026-01-01',
            end_date: '2026-06-30',
          },
          {
            id: 'SUB-ALFA-JATIM',
            parent_id: 'PRJ-ALFA-2026',
            code: 'SUB-ALFA-JATIM',
            name: 'Rollout FO & Konektivitas Region Jawa Timur (DC Surabaya & Sidoarjo)',
            budget: 680000000,
            realized_cost: 245000000,
            fo_count: 98,
            cellular_count: 15,
            server_count: 1,
            pic: 'Bambang Sudirjo',
            status: 'ACTIVE',
            start_date: '2026-02-01',
            end_date: '2026-08-31',
          },
          {
            id: 'SUB-ALFA-CLOUD',
            parent_id: 'PRJ-ALFA-2026',
            code: 'SUB-ALFA-CLOUD',
            name: 'Cloud VPS & Database Sync System Alfamart Integration',
            budget: 320000000,
            realized_cost: 77500000,
            fo_count: 0,
            cellular_count: 0,
            server_count: 6,
            pic: 'Dian Prasetyo',
            status: 'ACTIVE',
            start_date: '2026-01-15',
            end_date: '2026-12-31',
          }
        ]
      },
      {
        id: 'PRJ-INDO-2026',
        code: 'PRJ-INDO-2026',
        name: 'Managed Network & Fiber Optic Connectivity Indomaret',
        customer_name: 'PT Indomarco Prismatama',
        contract_value: 1950000000,
        budget: 1200000000,
        realized_cost: 412000000,
        start_date: '2026-01-15',
        end_date: '2026-11-30',
        status: 'ACTIVE',
        pic: 'Hendro Wijaya (Senior PM)',
        description: 'Jasa pemeliharaan dan pengadaan koneksi fiber optic toko ritel Indomaret terintegrasi.',
        sub_projects: [
          {
            id: 'SUB-INDO-JABODETABEK',
            parent_id: 'PRJ-INDO-2026',
            code: 'SUB-INDO-JABODETABEK',
            name: 'Konektivitas FO & Backup Seluler Cluster Jabodetabek',
            budget: 750000000,
            realized_cost: 290000000,
            fo_count: 85,
            cellular_count: 20,
            server_count: 1,
            pic: 'Dimas Anggara',
            status: 'ACTIVE',
            start_date: '2026-01-15',
            end_date: '2026-10-31',
          },
          {
            id: 'SUB-INDO-SUMATERA',
            parent_id: 'PRJ-INDO-2026',
            code: 'SUB-INDO-SUMATERA',
            name: 'Link Interkoneksi Node Sumatera Bagian Selatan (Palembang & Lampung)',
            budget: 450000000,
            realized_cost: 122000000,
            fo_count: 32,
            cellular_count: 8,
            server_count: 0,
            pic: 'Ferry Salim',
            status: 'ACTIVE',
            start_date: '2026-03-01',
            end_date: '2026-11-30',
          }
        ]
      },
      {
        id: 'PRJ-INTERNAL-OPS',
        code: 'PRJ-INTERNAL-OPS',
        name: 'Infrastruktur & Operasional Internal Artacom 2026',
        customer_name: 'PT Artacomindo Jejaring Nusa (Internal)',
        contract_value: 0,
        budget: 450000000,
        realized_cost: 185000000,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        status: 'ACTIVE',
        pic: 'Siti Rahmawati (Internal IT Ops)',
        description: 'Penyediaan colocation Data Center Cyber, Cloud Backend, SaaS ERP/Accounting, dan Lisensi Developer.',
        sub_projects: [
          {
            id: 'SUB-OPS-DC',
            parent_id: 'PRJ-INTERNAL-OPS',
            code: 'SUB-OPS-DC',
            name: 'Colocation Rack Cyber DC & Bandwidth Backbone Core',
            budget: 280000000,
            realized_cost: 115000000,
            fo_count: 4,
            cellular_count: 5,
            server_count: 8,
            pic: 'Wahyu Nugroho',
            status: 'ACTIVE',
            start_date: '2026-01-01',
            end_date: '2026-12-31',
          },
          {
            id: 'SUB-OPS-SAAS',
            parent_id: 'PRJ-INTERNAL-OPS',
            code: 'SUB-OPS-SAAS',
            name: 'Lisensi Perangkat Lunak, Google Workspace, GitHub & Cloud DB',
            budget: 170000000,
            realized_cost: 70000000,
            fo_count: 0,
            cellular_count: 0,
            server_count: 3,
            pic: 'Siti Rahmawati',
            status: 'ACTIVE',
            start_date: '2026-01-01',
            end_date: '2026-12-31',
          }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('artacom_projects_data', JSON.stringify(projects));
  }, [projects]);

  const formatIDR = (val) => {
    if (val === null || val === undefined || val === '') return 'Rp. 0';
    const num = typeof val === 'number' ? val : (parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0);
    return 'Rp. ' + new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(num);
  };

  const toggleExpand = (projectId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const openCreateModal = (type = 'PARENT', parentId = '') => {
    setEditingItem(null);
    setFormData({
      type: type,
      parent_id: parentId,
      project_code: type === 'PARENT' ? `PRJ-${Date.now().toString().slice(-4)}` : `SUB-${Date.now().toString().slice(-4)}`,
      project_name: '',
      customer_name: type === 'SUB' && parentId ? (projects.find(p => p.id === parentId)?.customer_name || '') : '',
      customer_id: '',
      budget: '',
      contract_value: '',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      pic: '',
      status: 'ACTIVE',
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (item, isSub = false, parentId = '') => {
    setEditingItem({ ...item, isSub, parentId });
    setFormData({
      type: isSub ? 'SUB' : 'PARENT',
      parent_id: parentId || item.parent_id || '',
      project_code: item.code,
      project_name: item.name,
      customer_name: item.customer_name || '',
      customer_id: '',
      budget: item.budget,
      contract_value: item.contract_value || '',
      start_date: item.start_date || '2026-01-01',
      end_date: item.end_date || '2026-12-31',
      pic: item.pic || '',
      status: item.status || 'ACTIVE',
      description: item.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const budgetNum = parseFloat(formData.budget) || 0;
    const contractNum = parseFloat(formData.contract_value) || 0;

    if (editingItem) {
      if (editingItem.isSub) {
        // Update sub-project
        setProjects(prev => prev.map(p => {
          if (p.id === editingItem.parentId) {
            return {
              ...p,
              sub_projects: p.sub_projects.map(sp => sp.id === editingItem.id ? {
                ...sp,
                code: formData.project_code,
                name: formData.project_name,
                budget: budgetNum,
                pic: formData.pic,
                status: formData.status,
                start_date: formData.start_date,
                end_date: formData.end_date,
              } : sp)
            };
          }
          return p;
        }));
      } else {
        // Update parent project
        setProjects(prev => prev.map(p => p.id === editingItem.id ? {
          ...p,
          code: formData.project_code,
          name: formData.project_name,
          customer_name: formData.customer_name,
          budget: budgetNum,
          contract_value: contractNum,
          start_date: formData.start_date,
          end_date: formData.end_date,
          pic: formData.pic,
          status: formData.status,
          description: formData.description,
        } : p));
      }
    } else {
      if (formData.type === 'SUB') {
        const newSub = {
          id: formData.project_code,
          parent_id: formData.parent_id,
          code: formData.project_code,
          name: formData.project_name,
          budget: budgetNum,
          realized_cost: 0,
          fo_count: 0,
          cellular_count: 0,
          server_count: 0,
          pic: formData.pic,
          status: formData.status,
          start_date: formData.start_date,
          end_date: formData.end_date,
        };
        setProjects(prev => prev.map(p => {
          if (p.id === formData.parent_id) {
            return {
              ...p,
              sub_projects: [...(p.sub_projects || []), newSub]
            };
          }
          return p;
        }));
        setExpandedProjects(prev => ({ ...prev, [formData.parent_id]: true }));
      } else {
        const newParent = {
          id: formData.project_code,
          code: formData.project_code,
          name: formData.project_name,
          customer_name: formData.customer_name,
          contract_value: contractNum,
          budget: budgetNum,
          realized_cost: 0,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
          pic: formData.pic,
          description: formData.description,
          sub_projects: []
        };
        setProjects(prev => [newParent, ...prev]);
        setExpandedProjects(prev => ({ ...prev, [newParent.id]: true }));
      }
    }
    setModalOpen(false);
  };

  const handleDeleteSubmit = () => {
    if (!deleteItem) return;
    if (deleteItem.isSub) {
      setProjects(prev => prev.map(p => {
        if (p.id === deleteItem.parentId) {
          return {
            ...p,
            sub_projects: p.sub_projects.filter(sp => sp.id !== deleteItem.id)
          };
        }
        return p;
      }));
    } else {
      setProjects(prev => prev.filter(p => p.id !== deleteItem.id));
    }
    setDeleteItem(null);
  };

  // Filtered Projects
  const filteredProjects = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sub_projects?.some(sp => sp.name.toLowerCase().includes(searchQuery.toLowerCase()) || sp.code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchCustomer = customerFilter === 'ALL' || p.customer_name === customerFilter;

    return matchSearch && matchStatus && matchCustomer;
  });

  // KPI Calculations
  const totalParentProjects = projects.length;
  const totalSubProjects = projects.reduce((acc, p) => acc + (p.sub_projects?.length || 0), 0);
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalRealized = projects.reduce((acc, p) => acc + (p.realized_cost || 0), 0);
  const totalRemaining = totalBudget - totalRealized;
  const totalContract = projects.reduce((acc, p) => acc + (p.contract_value || 0), 0);

  const customersList = Array.from(new Set(projects.map(p => p.customer_name).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700">
              PROJECT COSTING & ERP
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Mekari Jurnal Hierarchy Standard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Manajemen Proyek & Sub-Proyek
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Klasifikasi alokasi biaya pengeluaran, tagihan infrastruktur, dan pagu anggaran per proyek dan sub-proyek.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openCreateModal('SUB')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs"
          >
            <FolderPlus size={15} className="text-blue-600" />
            <span>Tambah Sub-Proyek</span>
          </button>
          <button
            onClick={() => openCreateModal('PARENT')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus size={16} />
            <span>+ Proyek Induk Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Projects */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyek & Sub-Proyek</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderTree size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalParentProjects}</span>
            <span className="text-xs text-slate-500 font-medium">Proyek Induk</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Total Sub-Proyek:</span>
            <span className="font-bold text-blue-600">{totalSubProjects} Sub-Proyek</span>
          </div>
        </div>

        {/* Card 2: Total Budget */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pagu Anggaran</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-bold text-lg text-slate-900 tracking-tight">{formatIDR(totalBudget)}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Nilai Kontrak Klien:</span>
            <span className="font-bold text-purple-700">{formatIDR(totalContract)}</span>
          </div>
        </div>

        {/* Card 3: Realized Expense */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Realisasi Biaya (AP)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-bold text-lg text-amber-700 tracking-tight">{formatIDR(totalRealized)}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Serapan Anggaran:</span>
            <span className="font-bold text-amber-600">
              {totalBudget > 0 ? ((totalRealized / totalBudget) * 100).toFixed(1) : 0}% Terpakai
            </span>
          </div>
        </div>

        {/* Card 4: Sisa Pagu */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sisa Pagu Anggaran</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-bold text-lg text-emerald-700 tracking-tight">{formatIDR(totalRemaining)}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Status Likuiditas:</span>
            <span className="font-bold text-emerald-600">Aman & Terkendali</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-2xs">
        <button
          onClick={() => { setActiveTab('hierarchy'); setSearchParams({ tab: 'hierarchy' }); }}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'hierarchy'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderTree size={16} />
          <span>Hierarki Proyek & Sub-Proyek</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-bold">
            {filteredProjects.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('costing'); setSearchParams({ tab: 'costing' }); }}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'costing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 size={16} />
          <span>Analisis Biaya & Profitabilitas Proyek (P&L)</span>
        </button>
      </div>

      {/* Tab Content: HIERARCHY TREE VIEW */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari kode proyek, nama proyek, atau sub-proyek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_HOLD">ON HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>

              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="ALL">Semua Klien / Entitas</option>
                {customersList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {(searchQuery || statusFilter !== 'ALL' || customerFilter !== 'ALL') && (
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCustomerFilter('ALL'); }}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Hierarchical Accordion List */}
          <div className="space-y-4">
            {filteredProjects.map((parent) => {
              const isExpanded = !!expandedProjects[parent.id];
              const subCount = parent.sub_projects?.length || 0;
              const parentUsagePercent = parent.budget > 0 ? Math.min(100, (parent.realized_cost / parent.budget) * 100) : 0;

              return (
                <div
                  key={parent.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all hover:border-slate-300"
                >
                  {/* Parent Project Card Row */}
                  <div className="p-4.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => toggleExpand(parent.id)}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-600 transition-colors mt-0.5 shrink-0"
                        title={isExpanded ? 'Tutup Sub-Proyek' : 'Buka Sub-Proyek'}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {parent.code}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {parent.status}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {parent.customer_name}
                          </span>
                        </div>

                        <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                          {parent.name}
                        </h2>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          {parent.description}
                        </p>
                      </div>
                    </div>

                    {/* Financial Metrics & Actions */}
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-6 lg:gap-8 justify-between lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Pagu Anggaran (Budget)</div>
                        <div className="font-bold text-xs text-slate-900">{formatIDR(parent.budget)}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Realisasi Biaya (AP)</div>
                        <div className="font-bold text-xs text-amber-700">{formatIDR(parent.realized_cost)}</div>
                      </div>

                      <div className="w-28">
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                          <span className="text-slate-400">Serapan</span>
                          <span className="text-slate-700">{parentUsagePercent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${parentUsagePercent > 85 ? 'bg-rose-500' : parentUsagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${parentUsagePercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openCreateModal('SUB', parent.id)}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 text-xs flex items-center gap-1"
                          title="Tambah Sub-Proyek ke Proyek Ini"
                        >
                          <Plus size={13} />
                          <span>Sub-Proyek</span>
                        </button>
                        <button
                          onClick={() => setDetailItem({ ...parent, isSub: false })}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail Proyek"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(parent, false)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Proyek"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteItem({ ...parent, isSub: false })}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Proyek"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Projects Accordion Drawer */}
                  {isExpanded && (
                    <div className="p-4 bg-white space-y-2.5">
                      <div className="flex items-center justify-between px-2 pb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Daftar Sub-Proyek & Alokasi Sirkuit ({subCount})</span>
                        <span className="text-[11px] font-normal text-slate-400">Dimensi Cost Center Khusus</span>
                      </div>

                      {subCount === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          Belum ada sub-proyek terdaftar di bawah proyek ini.{' '}
                          <button
                            onClick={() => openCreateModal('SUB', parent.id)}
                            className="font-bold text-blue-600 hover:underline"
                          >
                            Tambah Sub-Proyek Pertama
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {parent.sub_projects.map((sub) => {
                            const subUsagePercent = sub.budget > 0 ? Math.min(100, (sub.realized_cost / sub.budget) * 100) : 0;
                            return (
                              <div
                                key={sub.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/70 hover:bg-blue-50/40 border border-slate-200 rounded-lg transition-colors gap-3 ml-2 sm:ml-6 border-l-4 border-l-blue-500"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[11px] px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded">
                                      {sub.code}
                                    </span>
                                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                                      {sub.name}
                                    </h3>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                    <span>PIC: <strong className="text-slate-700">{sub.pic || '-'}</strong></span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-blue-700 font-semibold">
                                      <Globe size={12} /> {sub.fo_count} FO Sirkuit
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-teal-700 font-semibold">
                                      <Smartphone size={12} /> {sub.cellular_count} SIM Card
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-purple-700 font-semibold">
                                      <Cloud size={12} /> {sub.server_count} VPS Server
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                  <div>
                                    <div className="text-[10px] text-slate-400 font-semibold">Sub-Budget</div>
                                    <div className="font-bold text-xs text-slate-900">{formatIDR(sub.budget)}</div>
                                  </div>

                                  <div>
                                    <div className="text-[10px] text-slate-400 font-semibold">Terpakai</div>
                                    <div className="font-bold text-xs text-amber-700">{formatIDR(sub.realized_cost)}</div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setDetailItem({ ...sub, isSub: true, parent_name: parent.name, customer_name: parent.customer_name })}
                                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                      title="Lihat Detail Sub-Proyek"
                                    >
                                      <Eye size={15} />
                                    </button>
                                    <button
                                      onClick={() => openEditModal(sub, true, parent.id)}
                                      className="p-1 text-slate-400 hover:text-amber-600 rounded"
                                      title="Edit Sub-Proyek"
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteItem({ ...sub, isSub: true, parentId: parent.id })}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                      title="Hapus Sub-Proyek"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
                Tidak ada proyek yang sesuai dengan kriteria pencarian atau filter Anda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: COSTING & PROFITABILITY (P&L) */}
      {activeTab === 'costing' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Analisis Biaya & Profitabilitas Proyek (Project P&L)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan nilai kontrak klien dengan total pengeluaran operasional (HPP FO, Cloud, SaaS, Seluler) untuk mengukur laba kotor per proyek.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Kode & Nama Proyek</th>
                    <th className="p-3">Klien / Entitas</th>
                    <th className="p-3 text-right">Nilai Kontrak (Revenue)</th>
                    <th className="p-3 text-right">Pagu Anggaran</th>
                    <th className="p-3 text-right">Beban FO (Internet)</th>
                    <th className="p-3 text-right">Beban Server & Cloud</th>
                    <th className="p-3 text-right">Total Beban (Cost)</th>
                    <th className="p-3 text-right">Gross Profit (Margin)</th>
                    <th className="p-3 text-center">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {projects.map((p) => {
                    const foEst = (p.realized_cost * 0.7);
                    const cloudEst = (p.realized_cost * 0.3);
                    const margin = p.contract_value > 0 ? (p.contract_value - p.realized_cost) : 0;
                    const marginPct = p.contract_value > 0 ? ((margin / p.contract_value) * 100).toFixed(1) : 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{p.name}</span>
                          <span className="text-[11px] text-blue-700 font-bold">{p.code}</span>
                        </td>
                        <td className="p-3 font-sans font-medium text-slate-700">
                          {p.customer_name}
                        </td>
                        <td className="p-3 text-right font-bold text-purple-700">
                          {formatIDR(p.contract_value)}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-800">
                          {formatIDR(p.budget)}
                        </td>
                        <td className="p-3 text-right text-slate-700">
                          {formatIDR(foEst)}
                        </td>
                        <td className="p-3 text-right text-slate-700">
                          {formatIDR(cloudEst)}
                        </td>
                        <td className="p-3 text-right font-bold text-amber-700">
                          {formatIDR(p.realized_cost)}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          {formatIDR(margin)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            parseFloat(marginPct) > 50 ? 'bg-emerald-100 text-emerald-800' :
                            parseFloat(marginPct) > 20 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {marginPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingItem ? 'Edit Data Proyek' : formData.type === 'SUB' ? 'Tambah Sub-Proyek Baru' : 'Tambah Proyek Induk Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data identitas, pagu anggaran, dan penugasan proyek.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Type Switcher (only for new item) */}
              {!editingItem && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'PARENT', parent_id: '' })}
                    className={`py-2 text-center rounded-md font-bold transition-all ${
                      formData.type === 'PARENT' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Proyek Induk (Parent)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'SUB', parent_id: projects[0]?.id || '' })}
                    className={`py-2 text-center rounded-md font-bold transition-all ${
                      formData.type === 'SUB' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Sub-Proyek (Anak)
                  </button>
                </div>
              )}

              {/* If SUB project, select parent */}
              {formData.type === 'SUB' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Proyek Induk Terkait *</label>
                  <select
                    required
                    value={formData.parent_id}
                    onChange={(e) => {
                      const sel = projects.find(p => p.id === e.target.value);
                      setFormData({
                        ...formData,
                        parent_id: e.target.value,
                        customer_name: sel?.customer_name || formData.customer_name
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5 text-xs text-slate-900 font-semibold"
                  >
                    <option value="">-- Pilih Proyek Induk --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} ({p.customer_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Kode Proyek / Task *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRJ-ALFA-2026 / SUB-ALFA-JABAR"
                    value={formData.project_code}
                    onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5 font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Nama Klien / Customer Entity</label>
                  <input
                    type="text"
                    placeholder="e.g. PT Sumber Alfaria Trijaya Tbk"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Nama Proyek / Sub-Proyek *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rollout FO & Backup Router Wilayah Jawa Barat"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Pagu Anggaran / Budget (IDR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 850000000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Nilai Kontrak Klien (Opsional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1200000000"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5 font-bold text-purple-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Target Selesai</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Status Proyek</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5 font-semibold text-slate-800"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_HOLD">ON HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">PIC / Penanggung Jawab Proyek</label>
                <input
                  type="text"
                  placeholder="e.g. Rudi Hermawan (Lead PM)"
                  value={formData.pic}
                  onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Deskripsi / Ruang Lingkup (Scope)</label>
                <textarea
                  rows="2"
                  placeholder="Catatan ruang lingkup proyek..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-0.5"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Daftarkan Proyek'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DETAIL MODAL */}
      {detailItem && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                  {detailItem.code}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">{detailItem.name}</h3>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <div className="text-slate-400 font-medium">Tipe Proyek</div>
                  <div className="font-bold text-slate-900 mt-0.5">{detailItem.isSub ? 'Sub-Proyek' : 'Proyek Induk'}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Status</div>
                  <div className="font-bold text-emerald-600 mt-0.5">{detailItem.status}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Klien / Entitas</div>
                  <div className="font-bold text-slate-900 mt-0.5">{detailItem.customer_name || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">PIC Proyek</div>
                  <div className="font-bold text-slate-900 mt-0.5">{detailItem.pic || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Periode Proyek</div>
                  <div className="font-medium text-slate-800 mt-0.5">{detailItem.start_date} s/d {detailItem.end_date}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Pagu Anggaran (Budget)</div>
                  <div className="font-bold text-blue-700 mt-0.5">{formatIDR(detailItem.budget)}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <div className="text-slate-400 font-medium">Realisasi Biaya Terpakai (AP)</div>
                  <div className="font-bold text-amber-700 text-sm mt-0.5">{formatIDR(detailItem.realized_cost)}</div>
                </div>
              </div>

              {detailItem.description && (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div className="font-semibold text-blue-900 text-xs">Deskripsi & Ruang Lingkup:</div>
                  <p className="text-slate-700 text-xs mt-1 leading-relaxed">{detailItem.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE MODAL */}
      {deleteItem && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={24} />
              <h3 className="font-bold text-slate-900 text-base">Konfirmasi Hapus Data</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus {deleteItem.isSub ? 'Sub-Proyek' : 'Proyek Induk'}{' '}
              <strong className="text-slate-900">{deleteItem.name}</strong> ({deleteItem.code})?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
