<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import CompanyDocumentModal from '../components/CompanyDocumentModal.vue';
import {
  Building2, Briefcase, Users, ShieldCheck, FileCheck, ClipboardCheck,
  Plus, Mail, Phone, MapPin, FileDown, Layers, ChevronRight, Search,
  CheckCircle2, Shield, Calendar, Siren, FileWarning, CheckSquare
} from 'lucide-vue-next';

const activeTab = ref('overview');
const activeCompanyId = computed(() => store.selectedCompanyId || 1);
const company = computed(() => store.getCompany(activeCompanyId.value));
const showUploadModal = ref(false);
const employeeSearch = ref('');

// --- Company scope ---
const companyEmployees = computed(() => company.value ? store.getCompanyEmployees(company.value.id) : []);
const companyProjects = computed(() => company.value ? store.getCompanyProjects(company.value.id) : []);
const companyDocuments = computed(() => company.value ? store.getCompanyDocuments(company.value.id) : []);
const companyPermits = computed(() => company.value ? store.getCompanyPermits(company.value.id) : []);
const certStats = computed(() => company.value ? store.getCompanyCertStats(company.value.id) : { valid: 0, expiring: 0, expired: 0, total: 0, rate: 100, chartData: [] });
const projIds = computed(() => new Set(companyProjects.value.map(p => p.id)));

const coIncidents = computed(() => (store.incidents || []).filter(i => projIds.value.has(i.projectId)));
const coFindings = computed(() => (store.findings || []).filter(f => projIds.value.has(f.projectId)));
const coInspections = computed(() => store.getProjectInspections('all').filter(i => projIds.value.has(i.projectId)));
const coActions = computed(() => store.actions.filter(a => projIds.value.has(a.projectId)));
const openIncidents = computed(() => coIncidents.value.filter(i => i.status !== 'Closed'));
const criticalIncidents = computed(() => openIncidents.value.filter(i => i.severity === 'Critical' || i.severity === 'High'));
const openFindings = computed(() => coFindings.value.filter(f => f.status !== 'Closed'));
const openActions = computed(() => coActions.value.filter(a => a.status !== 'Completed'));
const overdueActions = computed(() => openActions.value.filter(a => a.status === 'Overdue'));
const activePermits = computed(() => companyPermits.value.filter(p => p.status === 'Active'));
const awaitingPermits = computed(() => companyPermits.value.filter(p => p.status === 'Awaiting Approval'));
const docsAttention = computed(() => companyDocuments.value.filter(d => d.status !== 'Verified'));
const kpiIcons = { Siren, FileWarning, CheckSquare, Users };

// Attention KPIs: only what needs action (max 4)
const attentionKpis = computed(() => {
  const list = [];
  if (criticalIncidents.value.length) list.push({ key: 'inc', label: 'Critical incidents', value: criticalIncidents.value.length, sub: `${openIncidents.value.length} open across ${companyProjects.value.length} sites`, icon: 'Siren', level: 'red' });
  if (overdueActions.value.length) list.push({ key: 'act', label: 'Overdue actions', value: overdueActions.value.length, sub: `${openActions.value.length} open on company sites`, icon: 'CheckSquare', level: 'red' });
  if (certStats.value.expired + certStats.value.expiring > 0) list.push({ key: 'cert', label: 'Certs expiring/expired', value: certStats.value.expired + certStats.value.expiring, sub: `${certStats.value.rate}% compliant · ${companyEmployees.value.length} crew`, icon: 'Users', level: 'red' });
  if (openFindings.value.length >= 3) list.push({ key: 'fnd', label: 'Open findings', value: openFindings.value.length, sub: `${coInspections.value.length} inspections on company sites`, icon: 'FileWarning', level: 'amber' });
  if (docsAttention.value.length) list.push({ key: 'doc', label: 'Docs need action', value: docsAttention.value.length, sub: `${companyDocuments.value.length} in vault`, icon: 'FileCheck', level: 'amber' });
  if (awaitingPermits.value.length) list.push({ key: 'ptw', label: 'Permits awaiting', value: awaitingPermits.value.length, sub: `${activePermits.value.length} active`, icon: 'FileCheck', level: 'amber' });
  const order = { red: 0, amber: 1 };
  return list.sort((a, b) => order[a.level] - order[b.level]).slice(0, 4);
});
const healthyLine = computed(() => {
  const shown = new Set(attentionKpis.value.map(k => k.key));
  const parts = [];
  if (!shown.has('inc')) parts.push(`${openIncidents.value.length} incidents open`);
  if (!shown.has('act')) parts.push(`${openActions.value.length} actions open`);
  if (!shown.has('cert')) parts.push(`${certStats.value.rate}% certs`);
  if (!shown.has('doc')) parts.push(`${companyDocuments.value.length} docs filed`);
  return parts.join(' · ');
});

// Company health rows
const healthRows = computed(() => [
  { key: 'prj', icon: 'Briefcase', label: 'Projects & site events', state: criticalIncidents.value.length ? 'bad' : openIncidents.value.length ? 'warn' : 'ok', stateText: criticalIncidents.value.length ? 'Needs action' : openIncidents.value.length ? 'Watch' : 'Healthy', headline: `${companyProjects.value.length} sites · ${openIncidents.value.length} incidents · ${openFindings.value.length} findings · ${openActions.value.length} actions open`, meta: companyProjects.value.map(p => p.name).join(' · ') || 'No sites assigned', action: 'Sites', run: () => {} },
  { key: 'wfl', icon: 'Users', label: 'Workforce credentials', state: certStats.value.expired ? 'bad' : certStats.value.expiring ? 'warn' : 'ok', stateText: certStats.value.expired ? 'Needs action' : certStats.value.expiring ? 'Watch' : 'Healthy', headline: `${companyEmployees.value.length} crew · ${certStats.value.valid} valid · ${certStats.value.expiring} expiring · ${certStats.value.expired} expired`, meta: 'VCA · BHV · Heights · NEN 3140', action: 'Workforce', run: () => { activeTab.value = 'workforce'; } },
  { key: 'doc', icon: 'ShieldCheck', label: 'Compliance documents', state: docsAttention.value.length ? 'warn' : 'ok', stateText: docsAttention.value.length ? 'Watch' : 'Healthy', headline: `${companyDocuments.value.filter(d => d.status === 'Verified').length}/${companyDocuments.value.length} verified`, meta: companyDocuments.value.map(d => d.category).slice(0, 4).join(' · '), action: 'Vault', run: () => { activeTab.value = 'documents'; } },
  { key: 'ptw', icon: 'FileCheck', label: 'Work permits', state: awaitingPermits.value.length ? 'warn' : 'ok', stateText: awaitingPermits.value.length ? 'Watch' : 'Healthy', headline: `${activePermits.value.length} active · ${awaitingPermits.value.length} awaiting approval`, meta: companyPermits.value.slice(0, 3).map(p => `${p.permitNumber} ${p.title}`).join(' · ') || 'No permits held', action: 'Permits', run: () => store.navigateTo('permits-dashboard') }
]);

// Per-project breakdown (the multi-project core)
const projectRows = computed(() => companyProjects.value.map(p => {
  const inc = (store.incidents || []).filter(i => i.projectId === p.id && i.status !== 'Closed');
  const fnd = (store.findings || []).filter(f => f.projectId === p.id && f.status !== 'Closed');
  const act = store.actions.filter(a => a.projectId === p.id && a.status !== 'Completed');
  const comp = store.getProjectCompliance(p.id);
  const crew = store.employees.filter(e => (e.projectIds || []).includes(p.id)).length;
  const hot = inc.filter(i => i.severity === 'Critical' || i.severity === 'High').length + act.filter(a => a.status === 'Overdue').length;
  return { ...p, openInc: inc.length, openFnd: fnd.length, openAct: act.length, compPct: comp.percentage, gaps: comp.gaps, crew, hot };
}).sort((a, b) => b.hot - a.hot));

const heatMax = computed(() => Math.max(...projectRows.value.map(p => p.openInc + p.openFnd + p.openAct), 1));
// Company report pulse: monthly volume across all company sites (suits small site counts)
const coPulseMonths = computed(() => {
  const labels = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  return labels.map((label, i) => {
    const m = `2026-0${i + 3}`;
    const n = [...coIncidents.value, ...coFindings.value].filter(e => (e.date || '').startsWith(m)).length;
    return { label, value: n };
  });
});
const coPulseMax = computed(() => Math.max(...coPulseMonths.value.map(p => p.value), 1));
const coPulsePoints = computed(() => {
  const W = 560, H = 150, pl = 8, pr = 8, pt = 12, pb = 24;
  return coPulseMonths.value.map((p, i) => {
    const x = pl + (i / (coPulseMonths.value.length - 1)) * (W - pl - pr);
    const y = pt + (1 - p.value / coPulseMax.value) * (H - pt - pb);
    return { ...p, x: Math.round(x), y: Math.round(y) };
  });
});
const coPulseLine = computed(() => coPulsePoints.value.map(p => `${p.x},${p.y}`).join(' '));
const coPulseArea = computed(() => {
  const pts = coPulsePoints.value;
  if (!pts.length) return '';
  return `M${pts[0].x},150 L${pts.map(p => `${p.x},${p.y}`).join(' L')} L${pts[pts.length - 1].x},150 Z`;
});
const coSeverity = computed(() => {
  const total = Math.max(coIncidents.value.length, 1);
  const groups = [
    { label: 'Critical / High', n: coIncidents.value.filter(i => i.severity === 'Critical' || i.severity === 'High').length, bar: 'bg-red-500' },
    { label: 'Medium', n: coIncidents.value.filter(i => i.severity === 'Medium').length, bar: 'bg-warning' },
    { label: 'Low / closed', n: coIncidents.value.filter(i => i.severity === 'Low' || i.status === 'Closed').length, bar: 'bg-success' }
  ];
  return groups.map(g => ({ ...g, pct: Math.round((g.n / total) * 100) }));
});
const filteredEmployees = computed(() => {
  if (!employeeSearch.value.trim()) return companyEmployees.value;
  const q = employeeSearch.value.toLowerCase();
  return companyEmployees.value.filter(e => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
});
const getEmployeeCerts = (empId) => (store.certificates || []).filter(c => c.employeeId === empId);
const openProject = (id) => store.navigateTo('project-dashboard', { projectId: id });
</script>

<template>
  <div class="space-y-6 pb-16" v-if="company">
    <!-- Header: brand blueprint banner, same language as project dashboard -->
    <div class="rounded-2xl overflow-hidden border border-brand-100 shadow-sm">
      <div class="relative bg-brand-800 px-5 pt-6 pb-6 text-white overflow-hidden min-h-[180px] flex flex-col justify-center">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="co-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M36 0H0V36" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1" />
            </pattern>
            <pattern id="co-dots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill="#ffffff" fill-opacity="0.14" />
            </pattern>
          </defs>
          <rect width="1200" height="260" fill="url(#co-grid)" />
          <rect x="760" y="0" width="440" height="260" fill="url(#co-dots)" opacity="0.6" />
          <g fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.5">
            <circle cx="1010" cy="130" r="70" />
            <circle cx="1010" cy="130" r="105" stroke-dasharray="5 7" />
          </g>
          <text x="930" y="205" font-size="110" font-weight="800" fill="#ffffff" fill-opacity="0.06" letter-spacing="4">HSE</text>
          <g fill="#ffffff" fill-opacity="0.13">
            <rect x="830" y="90" width="120" height="70" rx="3" />
            <rect x="845" y="105" width="60" height="8" rx="2" fill-opacity="0.6" />
            <rect x="845" y="120" width="90" height="8" rx="2" fill-opacity="0.6" />
            <rect x="960" y="110" width="70" height="50" rx="3" />
          </g>
        </svg>
        <div class="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-start gap-4 min-w-0">
            <div class="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-lg ring-2 ring-white/40 overflow-hidden">
              <img v-if="company.logoUrl" :src="company.logoUrl" :alt="company.displayName" class="w-full h-full object-contain p-1.5" />
              <span v-else class="text-brand-700 font-bold text-xl">{{ (company.displayName || company.name).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }}</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap text-[11px] font-bold">
                <span class="px-2 py-0.5 rounded-md bg-white/15 border border-white/25 uppercase tracking-wider">{{ company.verificationStatus }}</span>
                <span class="px-2 py-0.5 rounded-md bg-white/15 border border-white/25">{{ company.tier }}</span>
                <span class="px-2 py-0.5 rounded-md bg-white/15 border border-white/25 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></span>{{ companyEmployees.length }} crew · {{ companyProjects.length }} sites</span>
              </div>
              <div class="flex items-center gap-3 mt-2 flex-wrap">
                <h1 class="text-2xl font-bold tracking-tight">{{ company.name }}</h1>
              </div>
              <div class="flex items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-brand-50 flex-wrap">
                <span class="flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5 opacity-80" />{{ company.address.city }}, {{ company.address.country }}</span>
                <span class="flex items-center gap-1.5"><Mail class="w-3.5 h-3.5 opacity-80" />{{ company.email }}</span>
                <span class="flex items-center gap-1.5"><Phone class="w-3.5 h-3.5 opacity-80" />{{ company.phone }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button @click="showUploadModal = true" class="px-3.5 py-2.5 text-xs font-bold bg-white text-brand-700 rounded-xl flex items-center gap-1.5 shadow-lg"><Plus class="w-4 h-4" />Document</button>
          </div>
        </div>
      </div>
      <div class="px-4 py-2.5 flex items-center gap-2 overflow-x-auto bg-slate-50 border-t border-slate-100">
        <button @click="activeTab = 'overview'" class="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'overview' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white'"><Layers class="w-3.5 h-3.5" />Overview · {{ openIncidents.length + openFindings.length + openActions.length }} open</button>
        <button @click="activeTab = 'documents'" class="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'documents' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white'"><ShieldCheck class="w-3.5 h-3.5" />Vault ({{ companyDocuments.length }})</button>
        <button @click="activeTab = 'workforce'" class="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'workforce' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white'"><Users class="w-3.5 h-3.5" />Workforce ({{ companyEmployees.length }})</button>
        <button @click="activeTab = 'profile'" class="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'profile' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white'"><Building2 class="w-3.5 h-3.5" />Profile</button>
      </div>
    </div>

    <!-- OVERVIEW -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <!-- Attention KPIs -->
      <div>
        <div class="flex items-center justify-between mb-2.5">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Needs attention · {{ attentionKpis.length }}</h3>
          <span v-if="healthyLine" class="text-[11px] font-semibold text-slate-400 truncate ml-4">Healthy: {{ healthyLine }}</span>
        </div>
        <div v-if="attentionKpis.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          <div v-for="k in attentionKpis" :key="k.key" class="rounded-2xl border border-slate-200 bg-white p-4 h-full min-h-[148px] flex flex-col">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ k.label }}</span>
              <span class="flex items-center gap-1.5 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full" :class="k.level === 'red' ? 'bg-red-500' : 'bg-warning'"></span>
                <span class="text-[10px] font-bold uppercase tracking-wider" :class="k.level === 'red' ? 'text-red-600' : 'text-warning-700'">Needs action</span>
              </span>
            </div>
            <div class="mt-auto pt-2 flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><component :is="kpiIcons[k.icon]" class="w-4 h-4" /></div>
              <div class="min-w-0">
                <div class="text-3xl font-bold leading-none" :class="k.level === 'red' ? 'text-red-600' : 'text-slate-800'">{{ k.value }}</div>
                <div class="text-[11px] font-semibold text-slate-400 mt-1 truncate">{{ k.sub }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="rounded-2xl border border-success-100 bg-success-50 px-5 py-4 text-xs font-semibold text-success-700">All clear — {{ healthyLine }}</div>
      </div>

      <!-- Company health rows -->
      <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div><h3 class="text-sm font-bold text-slate-800">Company health</h3><p class="text-xs text-slate-400">Fix what is red, across all sites.</p></div>
          <span class="text-[11px] font-bold px-2.5 py-1 rounded-full" :class="healthRows.some(r => r.state === 'bad') ? 'bg-red-50 text-red-700' : 'bg-success-50 text-success-700'">{{ healthRows.filter(r => r.state !== 'ok').length }} of {{ healthRows.length }} need attention</span>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="r in healthRows" :key="r.key" class="px-5 py-3.5 flex items-center gap-3.5 hover:bg-slate-50/60 transition-colors">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="[r.state === 'bad' ? 'bg-red-50 text-red-600' : '', r.state === 'warn' ? 'bg-warning-50 text-warning-700' : '', r.state === 'ok' ? 'bg-success-50 text-success-700' : '']"><component :is="kpiIcons[r.icon] || Briefcase" class="w-4.5 h-4.5" /></div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{{ r.label }}</p>
                <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" :class="[r.state === 'bad' ? 'bg-red-50 text-red-700' : '', r.state === 'warn' ? 'bg-warning-50 text-warning-700' : '', r.state === 'ok' ? 'bg-success-50 text-success-700' : '']">{{ r.stateText }}</span>
              </div>
              <p class="text-sm font-bold text-slate-800 truncate mt-0.5">{{ r.headline }}</p>
              <p class="text-xs text-slate-400 truncate">{{ r.meta }}</p>
            </div>
            <button @click="r.run()" class="px-3.5 py-2 text-xs font-bold rounded-xl shrink-0" :class="r.state === 'bad' ? 'bg-brand-500 text-white' : 'border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700'">{{ r.action }}</button>
          </div>
        </div>
      </div>

      <!-- Sites + crew side by side -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <!-- Sites breakdown -->
      <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden h-fit">
        <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2"><Briefcase class="w-4 h-4 text-brand-600" /><h3 class="text-sm font-bold text-slate-800">Sites · {{ projectRows.length }}</h3><span class="text-[11px] font-semibold text-slate-400">sorted by heat · click to open project dashboard</span></div>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="p in projectRows" :key="p.id" @click="openProject(p.id)" class="px-5 py-3.5 hover:bg-brand-50/40 cursor-pointer transition-colors">
            <div class="flex items-center gap-2 text-xs">
              <span class="font-mono font-bold text-slate-400">#{{ p.id }}</span>
              <span class="font-bold text-slate-800 truncate">{{ p.name }}</span>
              <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 shrink-0">{{ p.status }}</span>
              <span v-if="p.hot" class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 shrink-0">{{ p.hot }} hot</span>
              <span class="ml-auto text-[11px] font-bold shrink-0" :class="p.gaps ? 'text-red-600' : 'text-success-700'">{{ p.compPct }}% certs</span>
              <ChevronRight class="w-3.5 h-3.5 text-slate-300 shrink-0" />
            </div>
            <p class="text-[11px] text-slate-400 mt-1">{{ p.crew }} crew · {{ p.openInc }} incidents · {{ p.openFnd }} findings · {{ p.openAct }} actions open · {{ p.gaps }} cert gaps · {{ p.location }}</p>
          </div>
          <div v-if="!projectRows.length" class="p-8 text-center text-xs text-slate-400">No sites assigned to this company.</div>
        </div>
      </div>

      <!-- Crew roster -->
        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden h-fit">
          <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2"><Users class="w-4 h-4 text-brand-600" /><h3 class="text-sm font-bold text-slate-800">Crew · {{ companyEmployees.length }}</h3></div>
            <button @click="activeTab = 'workforce'" class="text-xs font-bold text-brand-600 flex items-center gap-1">Manage<ChevronRight class="w-3.5 h-3.5" /></button>
          </div>
          <div class="px-5 pt-3 relative">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-8 top-[22px]" />
            <input v-model="employeeSearch" placeholder="Search crew..." class="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto mt-2">
            <div v-for="emp in filteredEmployees.slice(0, 8)" :key="emp.id" class="px-5 py-2.5 flex items-center gap-2.5 text-xs">
              <div class="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-[10px] shrink-0">{{ emp.name.split(' ').map(n => n[0]).join('').slice(0, 2) }}</div>
              <div class="min-w-0 flex-1"><p class="font-bold text-slate-800 truncate">{{ emp.name }}</p><p class="text-[11px] text-slate-400 truncate">{{ emp.role }} · {{ (emp.projectIds || []).length }} sites</p></div>
              <div class="flex gap-1 shrink-0">
                <span v-for="cert in getEmployeeCerts(emp.id).slice(0, 3)" :key="cert.id" class="px-1.5 py-0.5 rounded text-[9px] font-bold" :class="[cert.status === 'Valid' ? 'bg-success-50 text-success-700' : '', cert.status === 'Expiring' ? 'bg-warning-50 text-warning-700' : '', cert.status === 'Expired' ? 'bg-red-50 text-red-700' : '']">{{ cert.typeId.toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Report pulse: company-wide volume trend + severity mix -->
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="flex items-start justify-between flex-wrap gap-2">
          <div><h3 class="text-sm font-bold text-slate-800">Report pulse — all sites</h3><p class="text-xs text-slate-400 mt-0.5">Incidents + findings per month · {{ coIncidents.length + coFindings.length }} total</p></div>
          <span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-wider">Mar – Sep</span>
        </div>
        <div class="mt-3">
          <svg viewBox="0 0 560 150" class="w-full h-auto" preserveAspectRatio="none" style="height: 150px;">
            <path :d="coPulseArea" fill="rgba(2,132,199,0.10)" />
            <polyline :points="coPulseLine" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <g v-for="p in coPulsePoints" :key="p.label">
              <circle :cx="p.x" :cy="p.y" r="8" fill="#0284c7" opacity="0.12" />
              <circle :cx="p.x" :cy="p.y" r="3.5" fill="#0284c7" stroke="#fff" stroke-width="1.5" />
              <text :x="p.x" :y="p.y - 12" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">{{ p.value }}</text>
              <text :x="p.x" :y="144" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8">{{ p.label }}</text>
            </g>
          </svg>
        </div>
        <div class="mt-3">
          <div class="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
            <div v-for="s in coSeverity" :key="s.label" class="h-full" :class="s.bar" :style="{ width: s.pct + '%' }"></div>
          </div>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span v-for="s in coSeverity" :key="s.label" class="flex items-center gap-1.5 font-semibold text-slate-500"><span class="w-2 h-2 rounded-full" :class="s.bar"></span>{{ s.label }} · <strong class="text-slate-800">{{ s.n }}</strong></span>
          </div>
        </div>
      </div>
    </div>

    <!-- DOCUMENTS -->
    <div v-else-if="activeTab === 'documents'" class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div class="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div><h3 class="text-sm font-bold text-slate-800">Compliance vault</h3><p class="text-xs text-slate-400 mt-0.5">Insurance, KVK extracts, charters, tax clearances.</p></div>
        <button @click="showUploadModal = true" class="px-4 py-2 bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"><Plus class="w-3.5 h-3.5" /><span>Upload</span></button>
      </div>
      <div class="divide-y divide-slate-100">
        <div v-for="doc in companyDocuments" :key="doc.id" class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center shrink-0">PDF</div>
            <div><span class="block font-bold text-slate-800 text-sm">{{ doc.title }}</span><span class="block text-[11px] text-slate-400 mt-0.5">Ref: {{ doc.documentNumber }} • {{ doc.category }} • {{ doc.fileName }} ({{ doc.fileSize }})</span></div>
          </div>
          <div class="flex items-center gap-4 shrink-0 sm:justify-end">
            <div class="text-right">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold block" :class="doc.status === 'Verified' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'">{{ doc.status }}</span>
              <span class="text-[10px] text-slate-400 block mt-0.5">Expires: {{ doc.validUntil }}</span>
            </div>
            <button @click="store.addToast(`Downloading ${doc.fileName}...`)" class="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center gap-1.5"><FileDown class="w-3.5 h-3.5" /><span>Download</span></button>
          </div>
        </div>
      </div>
    </div>

    <!-- WORKFORCE -->
    <div v-else-if="activeTab === 'workforce'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div><h3 class="text-sm font-bold text-slate-800">Crew & certificates ({{ companyEmployees.length }})</h3><p class="text-xs text-slate-400">VCA/BHV qualification and site access.</p></div>
        <button @click="store.navigateTo('training-overview')" class="px-4 py-2 bg-brand-50 text-brand-700 border border-brand-200 font-bold text-xs rounded-xl flex items-center gap-1.5"><span>Training Matrix</span><ChevronRight class="w-3.5 h-3.5" /></button>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div class="p-3 border-b border-slate-100 bg-slate-50">
          <input v-model="employeeSearch" placeholder="Search crew..." class="w-full max-w-sm px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs" />
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="emp in filteredEmployees" :key="emp.id" class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm shrink-0">{{ emp.name.split(' ').map(n => n[0]).join('').slice(0, 2) }}</div>
              <div><span class="block font-bold text-slate-800 text-sm">{{ emp.name }}</span><span class="block text-[11px] text-slate-400 mt-0.5">{{ emp.role }} · Sites: #{{ (emp.projectIds || []).join(', #') || 'None' }}</span></div>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span v-for="cert in getEmployeeCerts(emp.id)" :key="cert.id" class="px-2 py-1 rounded-lg text-xs font-bold" :class="[cert.status === 'Valid' ? 'bg-success-50 text-success-700' : '', cert.status === 'Expiring' ? 'bg-warning-50 text-warning-700' : '', cert.status === 'Expired' ? 'bg-red-50 text-red-700' : '']">{{ cert.typeId.toUpperCase() }}: {{ cert.certificateNumber }} ({{ cert.status }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PROFILE -->
    <div v-else-if="activeTab === 'profile'" class="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
      <div class="border-b border-slate-100 pb-4"><h3 class="text-sm font-bold text-slate-800">Legal & registration record</h3><p class="text-xs text-slate-400 mt-0.5">Commercial registration, insurance, and contacts.</p></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div class="space-y-4">
          <div><span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered name</span><span class="block text-slate-800 font-bold text-sm mt-0.5">{{ company.name }}</span></div>
          <div><span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">KVK</span><span class="block text-slate-800 font-mono font-bold mt-0.5">{{ company.kvk }}</span></div>
          <div><span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">BTW / VAT</span><span class="block text-slate-800 font-mono font-bold mt-0.5">{{ company.vat }}</span></div>
          <div><span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safety qualification</span><span class="block text-success-700 font-bold mt-0.5">{{ company.vcaCertification }}</span></div>
        </div>
        <div class="space-y-4">
          <div><span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Liability policy (AVB)</span><span class="block text-slate-800 font-semibold mt-0.5">{{ company.insurancePolicy }}</span></div>
          <div><span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operations manager</span><span class="block text-slate-800 font-semibold mt-0.5">{{ company.manager }} ({{ company.phone }})</span></div>
          <div><span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office address</span><span class="block text-slate-800 font-semibold mt-0.5">{{ company.address.street }} {{ company.address.number }}, {{ company.address.postalCode }} {{ company.address.city }}, {{ company.address.country }}</span></div>
          <div><span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span><span class="block text-slate-800 font-semibold mt-0.5">{{ company.email }}</span></div>
        </div>
      </div>
    </div>

    <CompanyDocumentModal :show="showUploadModal" :companyId="company.id" @close="showUploadModal = false" />
  </div>
</template>
