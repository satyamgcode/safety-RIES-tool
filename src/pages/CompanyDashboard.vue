<script setup>
import { computed, ref, watch } from 'vue';
import { store } from '../store';
import CompanyCertDonutChart from '../components/CompanyCertDonutChart.vue';
import CompanyDocumentModal from '../components/CompanyDocumentModal.vue';
import {
  Building2,
  Briefcase,
  Users,
  ShieldCheck,
  FileCheck,
  CheckSquare,
  ClipboardCheck,
  Plus,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Shield,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Layers,
  FileText,
  UserPlus,
  ChevronRight,
  TrendingUp,
  Download,
  Info,
  Calendar,
  Lock,
  Building
} from 'lucide-vue-next';

// Active Tab: 'overview' (Operations), 'documents' (Compliance Vault), 'workforce' (Employees), 'profile' (Legal Details)
const activeTab = ref('overview');

// Selected Company (resolves from store.selectedCompanyId or defaults to 1)
const activeCompanyId = computed(() => {
  return store.selectedCompanyId || 1;
});

const company = computed(() => {
  return store.getCompany(activeCompanyId.value);
});

// Dropdown company switcher
const handleCompanySwitch = (event) => {
  const newId = parseInt(event.target.value, 10);
  store.selectedCompanyId = newId;
};

// Modal state
const showUploadModal = ref(false);

// Associated data computations
const companyEmployees = computed(() => {
  if (!company.value) return [];
  return store.getCompanyEmployees(company.value.id);
});

const employeeSearch = ref('');
const filteredEmployees = computed(() => {
  if (!employeeSearch.value.trim()) return companyEmployees.value;
  const q = employeeSearch.value.toLowerCase();
  return companyEmployees.value.filter(e => 
    e.name.toLowerCase().includes(q) ||
    e.role.toLowerCase().includes(q)
  );
});

const companyProjects = computed(() => {
  if (!company.value) return [];
  return store.getCompanyProjects(company.value.id);
});

const companyDocuments = computed(() => {
  if (!company.value) return [];
  return store.getCompanyDocuments(company.value.id);
});

const companyPermits = computed(() => {
  if (!company.value) return [];
  return store.getCompanyPermits(company.value.id);
});

const certStats = computed(() => {
  if (!company.value) return { valid: 0, expiring: 0, expired: 0, total: 0, rate: 100, chartData: [] };
  return store.getCompanyCertStats(company.value.id);
});

// Helper to get employee certificates
const getEmployeeCerts = (empId) => {
  return (store.certificates || []).filter(c => c.employeeId === empId);
};
</script>

<template>
  <div class="space-y-6 pb-16" v-if="company">
    <!-- Top Command & Company Profile Hero Banner -->
    <div class="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs relative overflow-hidden">
      <!-- Subtle decorative gradient accent -->
      <div class="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-linear-to-br from-emerald-50 to-brand-50 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <!-- Company Identity & Metadata -->
        <div class="flex items-start gap-4">
          <!-- Logo Avatar -->
          <div
            class="w-16 h-16 rounded-2xl bg-linear-to-br text-white font-black text-2xl flex items-center justify-center shadow-lg shrink-0"
            :class="company.logoColor || 'from-emerald-500 to-green-600'"
          >
            {{ company.logo || company.displayName[0] }}
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-wider border border-emerald-200">
                {{ company.verificationStatus }}
              </span>
              <span class="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                {{ company.tier }}
              </span>
              <span class="px-2.5 py-0.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200">
                {{ company.type }}
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Site Partner
              </span>
            </div>

            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-2xl font-black text-slate-800 tracking-tight font-sans">
                {{ company.name }}
              </h1>

              <!-- Quick Company Switcher -->
              <div class="relative inline-flex items-center">
                <select
                  :value="company.id"
                  @change="handleCompanySwitch"
                  class="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  title="Switch company"
                >
                  <option v-for="c in store.companies" :key="c.id" :value="c.id">
                    Switch: {{ c.displayName }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Structured Metadata Pills (Clean replacement of the raw key-value dump) -->
            <div class="flex items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-500 flex-wrap">
              <span class="flex items-center gap-1.5">
                <Building class="w-3.5 h-3.5 text-slate-400" />
                KVK: <strong class="text-slate-700 font-semibold">{{ company.kvk }}</strong>
              </span>
              <span class="text-slate-300">•</span>
              <span class="flex items-center gap-1.5">
                BTW/VAT: <strong class="text-slate-700 font-semibold">{{ company.vat }}</strong>
              </span>
              <span class="text-slate-300">•</span>
              <span class="flex items-center gap-1.5">
                <MapPin class="w-3.5 h-3.5 text-slate-400" />
                {{ company.address.street }} {{ company.address.number }}, {{ company.address.postalCode }} {{ company.address.city }}, {{ company.address.country }}
              </span>
              <span class="text-slate-300">•</span>
              <span class="flex items-center gap-1.5">
                <Mail class="w-3.5 h-3.5 text-slate-400" />
                {{ company.email }}
              </span>
              <span class="text-slate-300">•</span>
              <span class="flex items-center gap-1.5">
                <Phone class="w-3.5 h-3.5 text-slate-400" />
                {{ company.phone }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right Quick Actions & Safety Streak -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <!-- Safety Streak Badge -->
          <div class="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center gap-3 shadow-xs">
            <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Shield class="w-5 h-5" />
            </div>
            <div>
              <span class="block text-base font-black text-emerald-900 leading-none">{{ company.zeroLtiDays }} Days</span>
              <span class="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">{{ company.vcaCertification }}</span>
            </div>
          </div>

          <!-- Upload Compliance Document -->
          <button
            @click="showUploadModal = true"
            class="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all hover:scale-102"
          >
            <Plus class="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
        <button
          @click="activeTab = 'overview'"
          class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          :class="activeTab === 'overview' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>Company Safety & Operations</span>
        </button>

        <button
          @click="activeTab = 'documents'"
          class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          :class="activeTab === 'documents' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <ShieldCheck class="w-3.5 h-3.5" />
          <span>Compliance Vault ({{ companyDocuments.length }})</span>
        </button>

        <button
          @click="activeTab = 'workforce'"
          class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          :class="activeTab === 'workforce' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <Users class="w-3.5 h-3.5" />
          <span>Workforce & Certs ({{ companyEmployees.length }})</span>
        </button>

        <button
          @click="activeTab = 'profile'"
          class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          :class="activeTab === 'profile' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <Building2 class="w-3.5 h-3.5" />
          <span>Legal & Profile Details</span>
        </button>
      </div>
    </div>

    <!-- TAB 1: OVERVIEW DASHBOARD -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <!-- 5 Executive KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <!-- KPI 1: Active Projects -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Active Projects</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-3">
            <span class="block text-2xl font-black text-slate-800 leading-none">
              {{ companyProjects.length }}
            </span>
            <span class="text-[11px] text-slate-500 font-semibold mt-1 block">
              Contract Sites Deployed
            </span>
          </div>
        </div>

        <!-- KPI 2: Total Deployed Workforce -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Total Workforce</span>
            <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-3">
            <span class="block text-2xl font-black text-slate-800 leading-none">
              {{ companyEmployees.length }}
            </span>
            <span class="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Verified & Inducted
            </span>
          </div>
        </div>

        <!-- KPI 3: Safety Certification Compliance -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Cert Compliance</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ClipboardCheck class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-3">
            <span class="block text-2xl font-black text-emerald-700 leading-none">
              {{ certStats.rate }}%
            </span>
            <span class="text-[11px] text-emerald-600 font-semibold mt-1 block">
              {{ certStats.valid }} of {{ certStats.total }} valid certs
            </span>
          </div>
        </div>

        <!-- KPI 4: Active Work Permits -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Active Permits (PTW)</span>
            <div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <FileCheck class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-3">
            <span class="block text-2xl font-black text-slate-800 leading-none">
              {{ companyPermits.length }}
            </span>
            <span class="text-[11px] text-slate-500 font-semibold mt-1 block">
              Hot Work & Heights Active
            </span>
          </div>
        </div>

        <!-- KPI 5: Document Compliance Health -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Compliance Docs</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-3">
            <span class="block text-2xl font-black text-emerald-700 leading-none">
              {{ companyDocuments.filter(d => d.status === 'Verified').length }}/{{ companyDocuments.length }}
            </span>
            <span class="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 class="w-3 h-3 text-emerald-500" />
              Insurance & KVK Verified
            </span>
          </div>
        </div>
      </div>

      <!-- Analytics & Project Deployment Section -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Donut Chart: Workforce Certifications (5 cols) -->
        <div class="lg:col-span-5">
          <CompanyCertDonutChart
            :data="certStats.chartData"
            :rate="certStats.rate"
            title="Workforce Safety Credentials"
            subtitle="VCA-B, VCA-VOL, BHV & Heights certification breakdown"
          />
        </div>

        <!-- Assigned Projects Deployment Cards (7 cols) -->
        <div class="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-sm font-bold text-slate-800">Deployed Project Sites</h3>
              <p class="text-xs text-slate-400 mt-0.5">Active sites where this contractor has crew assigned</p>
            </div>
            <span class="text-xs font-bold text-slate-400">{{ companyProjects.length }} sites</span>
          </div>

          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="p in companyProjects"
              :key="p.id"
              @click="store.navigateTo('project-dashboard', { projectId: p.id })"
              class="p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-slate-50/50 cursor-pointer transition-all space-y-2 group"
            >
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-brand-50 text-brand-700 border border-brand-100">
                  Site #{{ p.id }}
                </span>
                <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700">
                  {{ p.status }}
                </span>
              </div>
              <h4 class="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors truncate">
                {{ p.name }}
              </h4>
              <p class="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                <MapPin class="w-3 h-3 text-slate-400" />
                {{ p.location }}
              </p>
              <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="text-slate-500">Manager: {{ p.manager }}</span>
                <span class="text-brand-600 font-bold flex items-center gap-0.5">
                  View <ChevronRight class="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2 Operational Widgets (Replacing the empty peach boxes) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Widget 1: Workforce Roster with Live Certifications -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <Users class="w-4 h-4 text-purple-600" />
              <h3 class="text-sm font-bold text-slate-800">Company Workforce Roster</h3>
            </div>
            <button
              @click="activeTab = 'workforce'"
              class="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>Manage All</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Quick Search -->
          <div class="mt-3 relative">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              v-model="employeeSearch"
              type="text"
              placeholder="Search by worker name or trade..."
              class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div class="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="emp in filteredEmployees"
              :key="emp.id"
              class="py-2.5 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl transition-colors text-xs"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                  {{ emp.name.split(' ').map(n => n[0]).join('') }}
                </div>
                <div class="truncate">
                  <span class="block font-bold text-slate-800 truncate">{{ emp.name }}</span>
                  <span class="block text-[11px] text-slate-400 truncate">{{ emp.role }}</span>
                </div>
              </div>

              <!-- Cert Pills -->
              <div class="flex items-center gap-1.5 shrink-0 ml-3">
                <span
                  v-for="cert in getEmployeeCerts(emp.id)"
                  :key="cert.id"
                  class="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  :class="[
                    cert.status === 'Valid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : '',
                    cert.status === 'Expiring' ? 'bg-amber-50 text-amber-700 border border-amber-200' : '',
                    cert.status === 'Expired' ? 'bg-red-50 text-red-700 border border-red-200' : ''
                  ]"
                >
                  {{ cert.typeId.toUpperCase() }}
                </span>
                <span v-if="getEmployeeCerts(emp.id).length === 0" class="text-[10px] text-slate-400 italic">
                  No certs logged
                </span>
              </div>
            </div>

            <div v-if="filteredEmployees.length === 0" class="py-8 text-center text-slate-400 text-xs">
              No employees registered for this contractor yet.
            </div>
          </div>
        </div>

        <!-- Widget 2: Compliance Document Vault (Replaces the empty peach tables) -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-emerald-600" />
              <h3 class="text-sm font-bold text-slate-800">Compliance Document Vault</h3>
            </div>
            <button
              @click="showUploadModal = true"
              class="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Add Document</span>
            </button>
          </div>

          <div class="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="doc in companyDocuments"
              :key="doc.id"
              class="py-2.5 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl transition-colors text-xs group"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-7 h-7 rounded-lg bg-red-50 text-red-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                  PDF
                </div>
                <div class="truncate">
                  <span class="block font-bold text-slate-800 truncate group-hover:text-brand-600 transition-colors">
                    {{ doc.title }}
                  </span>
                  <span class="block text-[11px] text-slate-400 truncate">
                    {{ doc.category }} • Valid to: {{ doc.validUntil }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-3 shrink-0 ml-3">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                >
                  {{ doc.status }}
                </span>
                <button
                  @click="store.addToast(`Downloading ${doc.fileName}...`)"
                  class="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                  title="Download File"
                >
                  <FileDown class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div v-if="companyDocuments.length === 0" class="py-8 text-center text-slate-400 text-xs">
              No documents uploaded yet. Click "Add Document" to upload compliance proof.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: FULL COMPLIANCE DOCUMENT VAULT -->
    <div v-else-if="activeTab === 'documents'" class="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 class="text-sm font-bold text-slate-800">Corporate Compliance & Legal Vault</h3>
          <p class="text-xs text-slate-400 mt-0.5">Insurance policies, Chamber of Commerce extracts, safety charters and tax clearances.</p>
        </div>
        <button
          @click="showUploadModal = true"
          class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>
      </div>

      <div class="divide-y divide-slate-100">
        <div
          v-for="doc in companyDocuments"
          :key="doc.id"
          class="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 font-black text-xs flex items-center justify-center shrink-0">
              PDF
            </div>
            <div>
              <span class="block font-bold text-slate-800 text-sm">{{ doc.title }}</span>
              <span class="block text-[11px] text-slate-400 mt-0.5">
                Ref: {{ doc.documentNumber }} • Category: {{ doc.category }} • File: {{ doc.fileName }} ({{ doc.fileSize }})
              </span>
            </div>
          </div>

          <div class="flex items-center gap-4 shrink-0 sm:justify-end">
            <div class="text-right">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold block"
                :class="doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'"
              >
                {{ doc.status }}
              </span>
              <span class="text-[10px] text-slate-400 block mt-0.5">Expires: {{ doc.validUntil }}</span>
            </div>
            <button
              @click="store.addToast(`Downloading ${doc.fileName}...`)"
              class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <FileDown class="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: WORKFORCE & CERTIFICATES -->
    <div v-else-if="activeTab === 'workforce'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-slate-800">Contractor Employees & Certificates</h3>
          <p class="text-xs text-slate-400">Manage site credentials, VCA/BHV qualification and project access.</p>
        </div>
        <button
          @click="store.navigateTo('training-overview')"
          class="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <span>Training Matrix</span>
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div class="p-3 border-b border-slate-100 bg-slate-50/50">
          <input
            v-model="employeeSearch"
            type="text"
            placeholder="Search company employees..."
            class="w-full max-w-sm px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div class="divide-y divide-slate-100">
          <div
            v-for="emp in filteredEmployees"
            :key="emp.id"
            class="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-extrabold flex items-center justify-center text-sm shrink-0">
                {{ emp.name.split(' ').map(n => n[0]).join('') }}
              </div>
              <div>
                <span class="block font-bold text-slate-800 text-sm">{{ emp.name }}</span>
                <span class="block text-[11px] text-slate-400 mt-0.5">Role: {{ emp.role }} • Assigned Sites: #{{ (emp.projectIds || []).join(', #') || 'None' }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <span
                v-for="cert in getEmployeeCerts(emp.id)"
                :key="cert.id"
                class="px-2 py-1 rounded-lg text-xs font-bold border"
                :class="[
                  cert.status === 'Valid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : '',
                  cert.status === 'Expiring' ? 'bg-amber-50 text-amber-700 border-amber-200' : '',
                  cert.status === 'Expired' ? 'bg-red-50 text-red-700 border-red-200' : ''
                ]"
              >
                {{ cert.typeId.toUpperCase() }}: {{ cert.certificateNumber }} ({{ cert.status }})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: LEGAL & PROFILE DETAILS -->
    <div v-else-if="activeTab === 'profile'" class="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
      <div class="border-b border-slate-100 pb-4">
        <h3 class="text-sm font-bold text-slate-800">Company Legal & Registration Record</h3>
        <p class="text-xs text-slate-400 mt-0.5">Commercial registration, liability insurance details, and primary operational contacts.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div class="space-y-4">
          <div>
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Registered Name</span>
            <span class="block text-slate-800 font-extrabold text-sm mt-0.5">{{ company.name }}</span>
          </div>

          <div>
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chamber of Commerce (KVK Nr)</span>
            <span class="block text-slate-800 font-mono font-bold mt-0.5">{{ company.kvk }}</span>
          </div>

          <div>
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">BTW / VAT Identification Number</span>
            <span class="block text-slate-800 font-mono font-bold mt-0.5">{{ company.vat }}</span>
          </div>

          <div>
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corporate Safety Qualification</span>
            <span class="block text-emerald-700 font-bold mt-0.5">{{ company.vcaCertification }}</span>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corporate Liability Policy (AVB)</span>
            <span class="block text-slate-800 font-semibold mt-0.5">{{ company.insurancePolicy }}</span>
          </div>

          <div>
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Operations Manager</span>
            <span class="block text-slate-800 font-semibold mt-0.5">{{ company.manager }} ({{ company.phone }})</span>
          </div>

          <div>
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Office Address</span>
            <span class="block text-slate-800 font-semibold mt-0.5">
              {{ company.address.street }} {{ company.address.number }}, {{ company.address.postalCode }} {{ company.address.city }}, {{ company.address.country }}
            </span>
          </div>

          <div>
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Web Portal</span>
            <a :href="company.website" target="_blank" class="text-brand-600 font-bold hover:underline flex items-center gap-1 mt-0.5">
              <span>{{ company.website }}</span>
              <ExternalLink class="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Document Modal -->
    <CompanyDocumentModal
      :show="showUploadModal"
      :companyId="company.id"
      @close="showUploadModal = false"
    />
  </div>
</template>
