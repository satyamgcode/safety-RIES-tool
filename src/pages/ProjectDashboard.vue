<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import SiteQrModal from '../components/SiteQrModal.vue';
import {
  Briefcase, User, MapPin, Calendar, Users, FileCheck, ShieldAlert,
  CheckSquare, ClipboardCheck, Plus, QrCode, ChevronRight,
  Search, CheckCircle2, FileDown, History, FileText, Truck, Check,
  Shield, Layers, Siren, FileWarning, ListChecks, Flame, Award, Wrench
} from 'lucide-vue-next';

const activeTab = ref('operations');

const activeProjectId = computed(() => {
  if (store.currentParams?.projectId) return parseInt(store.currentParams.projectId, 10);
  if (store.selectedProjectId && store.selectedProjectId !== 'all') return parseInt(store.selectedProjectId, 10);
  return 1;
});
const project = computed(() => store.projects.find(p => p.id === activeProjectId.value) || store.projects[0]);
const showQrModal = ref(false);
const workerSearch = ref('');

// --- Full project scope: RI&E core + prod-style event modules ---
const projectAssessments = computed(() => store.assessments.filter(a => a.projectId === project.value?.id));
const projectHazards = computed(() => store.hazards.filter(h => h.projectId === project.value?.id));
const projectActions = computed(() => store.actions.filter(a => a.projectId === project.value?.id));
const projectPermits = computed(() => (store.permits || []).filter(p => p.projectId === project.value?.id));
const projectEquipment = computed(() => store.getProjectEquipment(project.value?.id));
const projectInspections = computed(() => store.getProjectInspections(project.value?.id));
const projectIncidents = computed(() => store.getProjectIncidents(project.value?.id));
const projectFindings = computed(() => store.getProjectFindings(project.value?.id));
const onSiteWorkers = computed(() => store.getProjectCheckIns(project.value?.id));

const openActions = computed(() => projectActions.value.filter(a => a.status !== 'Completed'));
const overdueActions = computed(() => openActions.value.filter(a => a.status === 'Overdue'));
const highPriorityActions = computed(() => openActions.value.filter(a => a.priority === 'High' || a.priority === 'Critical'));
const openIncidents = computed(() => projectIncidents.value.filter(i => i.status !== 'Closed'));
const criticalIncidents = computed(() => openIncidents.value.filter(i => i.severity === 'Critical' || i.severity === 'High'));
const openFindings = computed(() => projectFindings.value.filter(f => f.status !== 'Closed'));
const activePermits = computed(() => projectPermits.value.filter(p => p.status === 'Active'));
const awaitingPermits = computed(() => projectPermits.value.filter(p => p.status === 'Awaiting Approval'));
const scheduledInspections = computed(() => projectInspections.value.filter(i => i.status === 'Scheduled'));
const equipmentDue = computed(() => projectEquipment.value.filter(e => e.certStatus !== 'Certified' || e.status !== 'Operational'));
const highestRisk = computed(() => projectHazards.value.length ? Math.max(...projectHazards.value.map(h => h.residualRiskScore)) : 0);
const certCompliance = computed(() => project.value ? store.getProjectCompliance(project.value.id) : { percentage: 100, gaps: 0, workersCount: 0 });
const projectTras = computed(() => (store.tras || []).filter(t => t.projectId === project.value?.id));

const incidentCausesData = computed(() => store.getProjectIncidentDistribution(project.value?.id));
const inspectionAuditData = computed(() => store.getProjectInspectionDistribution(project.value?.id));
const complianceRate = computed(() => {
  const d = inspectionAuditData.value;
  if (!d || !d.length) return 96;
  const p = d.reduce((a, x) => a + (x.passed || 0), 0), f = d.reduce((a, x) => a + (x.findings || 0), 0);
  return (p + f) > 0 ? Math.round((p / (p + f)) * 100) : 98;
});
const riskByCategory = computed(() => {
  const cats = ['Safety', 'Chemical', 'Electrical', 'Physical', 'Ergonomics', 'Biological', 'Psychosocial'];
  return cats.map(c => {
    const list = projectHazards.value.filter(h => h.category === c);
    return { category: c, count: list.length, max: list.length ? Math.max(...list.map(h => h.residualRiskScore)) : 0 };
  }).filter(x => x.count > 0);
});

// Maximal attention queue across every module
// Attention-only KPIs: show max 4 metrics that need action, sorted red -> amber
const attentionKpis = computed(() => {
  const list = [];
  if (criticalIncidents.value.length) list.push({ key: 'inc', label: 'Critical incidents', value: criticalIncidents.value.length, sub: `${openIncidents.value.length} open · ${projectIncidents.value.length} total`, icon: 'Siren', level: 'red' });
  if (overdueActions.value.length) list.push({ key: 'act', label: 'Overdue actions', value: overdueActions.value.length, sub: `${openActions.value.length} open · ${highPriorityActions.value.length} high`, icon: 'CheckSquare', level: 'red' });
  if (certCompliance.value.gaps > 0) list.push({ key: 'cert', label: 'Certificate gaps', value: `${certCompliance.value.percentage}%`, sub: `${certCompliance.value.gaps} gaps · ${onSiteWorkers.value.length} on-site`, icon: 'Users', level: 'red' });
  if (highestRisk.value >= 150) list.push({ key: 'risk', label: 'Top residual risk', value: highestRisk.value, sub: `${projectHazards.value.length} hazards · ${getKinneyRiskLevel(highestRisk.value).name}`, icon: 'Flame', level: 'red' });
  if (openFindings.value.length >= 3) list.push({ key: 'fnd', label: 'Open findings', value: openFindings.value.length, sub: `${scheduledInspections.value.length} inspections scheduled`, icon: 'FileWarning', level: 'amber' });
  if (equipmentDue.value.length) list.push({ key: 'eq', label: 'Equipment attention', value: equipmentDue.value.length, sub: `${projectEquipment.value.length} units on site`, icon: 'Truck', level: 'amber' });
  if (awaitingPermits.value.length) list.push({ key: 'ptw', label: 'Permits awaiting', value: awaitingPermits.value.length, sub: `${activePermits.value.length} active · ${projectPermits.value.length} total`, icon: 'FileCheck', level: 'amber' });
  if (complianceRate.value < 90) list.push({ key: 'aud', label: 'Audit pass rate', value: `${complianceRate.value}%`, sub: `${projectInspections.value.length} inspections`, icon: 'ClipboardCheck', level: 'amber' });
  const order = { red: 0, amber: 1 };
  return list.sort((a, b) => order[a.level] - order[b.level]).slice(0, 3);
});
const healthyLine = computed(() => {
  const shown = new Set(attentionKpis.value.map(k => k.key));
  const parts = [];
  if (!shown.has('inc')) parts.push(`${openIncidents.value.length} incidents open`);
  if (!shown.has('act')) parts.push(`${openActions.value.length} actions open`);
  if (!shown.has('fnd')) parts.push(`${openFindings.value.length} findings open`);
  if (!shown.has('ptw')) parts.push(`${activePermits.value.length} permits active`);
  if (!shown.has('cert')) parts.push(`${certCompliance.value.percentage}% certs`);
  if (!shown.has('aud')) parts.push(`${complianceRate.value}% audit pass`);
  return parts.join(' · ');
});

// Incident pulse: monthly report volume (incidents + findings) Mar-Sep + severity split
const pulseMonths = computed(() => {
  const labels = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  return labels.map((label, i) => {
    const m = `2026-0${i + 3}`;
    const n = [...projectIncidents.value, ...projectFindings.value].filter(e => (e.date || '').startsWith(m)).length;
    return { label, value: n };
  });
});
const pulseMax = computed(() => Math.max(...pulseMonths.value.map(p => p.value), 1));
const pulsePoints = computed(() => {
  const W = 560, H = 150, pl = 8, pr = 8, pt = 12, pb = 24;
  return pulseMonths.value.map((p, i) => {
    const x = pl + (i / (pulseMonths.value.length - 1)) * (W - pl - pr);
    const y = pt + (1 - p.value / pulseMax.value) * (H - pt - pb);
    return { ...p, x: Math.round(x), y: Math.round(y) };
  });
});
const pulseLine = computed(() => pulsePoints.value.map(p => `${p.x},${p.y}`).join(' '));
const pulseArea = computed(() => {
  const pts = pulsePoints.value;
  if (!pts.length) return '';
  return `M${pts[0].x},150 L${pts.map(p => `${p.x},${p.y}`).join(' L')} L${pts[pts.length - 1].x},150 Z`;
});
const severitySplit = computed(() => {
  const groups = [
    { label: 'Critical / High', n: projectIncidents.value.filter(i => i.severity === 'Critical' || i.severity === 'High').length, bar: 'bg-red-500' },
    { label: 'Medium', n: projectIncidents.value.filter(i => i.severity === 'Medium').length, bar: 'bg-warning' },
    { label: 'Low / closed', n: projectIncidents.value.filter(i => i.severity === 'Low' || i.status === 'Closed').length, bar: 'bg-success' }
  ];
  const total = Math.max(projectIncidents.value.length, 1);
  return groups.map(g => ({ ...g, pct: Math.round((g.n / total) * 100) }));
});
// Verification coverage per inspection type: pass-rate bars (fixes absolute-scale problem)
const coverageRows = computed(() => {
  const map = {};
  projectInspections.value.forEach(i => {
    const k = i.type || 'General';
    if (!map[k]) map[k] = { type: k, n: 0, done: 0, passed: 0, findings: 0 };
    map[k].n++; if (i.status === 'Completed') map[k].done++;
    map[k].passed += i.passedChecks || 0; map[k].findings += i.findingsCount || 0;
  });
  return Object.values(map).map(r => ({ ...r, rate: (r.passed + r.findings) ? Math.round((r.passed / (r.passed + r.findings)) * 100) : 100 }));
});
const coverageTotals = computed(() => ({
  n: projectInspections.value.length,
  passed: projectInspections.value.reduce((a, x) => a + (x.passedChecks || 0), 0),
  findings: projectInspections.value.reduce((a, x) => a + (x.findingsCount || 0), 0)
}));
// Site status: one row per domain with spotlight detail + single action
const incidentSpot = computed(() => criticalIncidents.value[0] || openIncidents.value[0]);
const findingSpot = computed(() => openFindings.value[0]);
const actionSpot = computed(() => overdueActions.value[0] || openActions.value[0]);
const permitSpot = computed(() => awaitingPermits.value[0] || activePermits.value[0]);
const statusRows = computed(() => [
  {
    key: 'inc', icon: 'Siren', label: 'Incidents',
    state: criticalIncidents.value.length ? 'bad' : openIncidents.value.length ? 'warn' : 'ok',
    stateText: criticalIncidents.value.length ? 'Needs action' : openIncidents.value.length ? 'Watch' : 'Healthy',
    headline: `${openIncidents.value.length} open · ${criticalIncidents.value.length} critical · ${projectIncidents.value.length} total`,
    meta: incidentSpot.value ? `${incidentSpot.value.type} — ${incidentSpot.value.description} · ${incidentSpot.value.date} · ${incidentSpot.value.reporter}` : 'No incidents recorded',
    action: 'Report', run: quickReportIncident
  },
  {
    key: 'fnd', icon: 'FileWarning', label: 'Findings & inspections',
    state: openFindings.value.length >= 3 ? 'warn' : openFindings.value.length ? 'warn' : 'ok',
    stateText: openFindings.value.length ? 'Watch' : 'Healthy',
    headline: `${openFindings.value.length} open findings · ${projectInspections.value.length} inspections · ${scheduledInspections.value.length} scheduled`,
    meta: findingSpot.value ? `${findingSpot.value.title} · ${findingSpot.value.kind} · ${findingSpot.value.reporter}` : 'No open findings',
    action: 'Add', run: quickAddFinding
  },
  {
    key: 'act', icon: 'CheckSquare', label: 'Actions',
    state: overdueActions.value.length ? 'bad' : openActions.value.length ? 'warn' : 'ok',
    stateText: overdueActions.value.length ? 'Needs action' : openActions.value.length ? 'Watch' : 'Healthy',
    headline: `${openActions.value.length} open · ${overdueActions.value.length} overdue · ${highPriorityActions.value.length} high priority`,
    meta: actionSpot.value ? `${actionSpot.value.title} · ${actionSpot.value.assignedTo} · due ${actionSpot.value.dueDate}` : 'All actions completed',
    action: 'Tracker', run: () => store.navigateTo('actions')
  },
  {
    key: 'ptw', icon: 'FileCheck', label: 'Permits to work',
    state: awaitingPermits.value.length ? 'warn' : 'ok',
    stateText: awaitingPermits.value.length ? 'Watch' : 'Healthy',
    headline: `${activePermits.value.length} active · ${awaitingPermits.value.length} awaiting approval · ${projectPermits.value.length} total`,
    meta: permitSpot.value ? `${permitSpot.value.permitNumber} — ${permitSpot.value.title} · ${permitSpot.value.type} · holder ${permitSpot.value.holderName} · until ${permitSpot.value.validTo}` : 'No permits on this site yet',
    action: 'Permits', run: () => store.navigateTo('permits-dashboard')
  },
  {
    key: 'team', icon: 'Users', label: 'Team & machines',
    state: certCompliance.value.gaps ? 'bad' : equipmentDue.value.length ? 'warn' : 'ok',
    stateText: certCompliance.value.gaps ? 'Needs action' : equipmentDue.value.length ? 'Watch' : 'Healthy',
    headline: `${onSiteWorkers.value.length} on-site · ${certCompliance.value.percentage}% certs · ${certCompliance.value.gaps} gaps · ${projectEquipment.value.length} machines (${equipmentDue.value.length} due)`,
    meta: equipmentDue.value[0] ? `${equipmentDue.value[0].tag} — ${equipmentDue.value[0].name} · ${equipmentDue.value[0].operator} · next ${equipmentDue.value[0].nextInspection}` : 'All machines certified',
    action: 'Team', run: () => store.navigateTo('training-overview')
  }
]);

const filteredWorkers = computed(() => {
  if (!workerSearch.value.trim()) return onSiteWorkers.value;
  const q = workerSearch.value.toLowerCase();
  return onSiteWorkers.value.filter(w => w.name.toLowerCase().includes(q) || w.company.toLowerCase().includes(q) || w.role.toLowerCase().includes(q));
});

const projectMilestones = [
  { date: '2026-01-10', title: 'Project Kick-off & Site Handover', type: 'system', desc: 'Site access granted and initial logistics perimeter established.' },
  { date: '2026-02-14', title: 'Initial Baseline RI&E Draft Completed', type: 'rie', desc: 'Identified height safety and machinery hazards.' },
  { date: '2026-03-01', title: 'Safety Audit Gate Review 1', type: 'audit', desc: 'Board review completed. Edge protection approved.' },
  { date: '2026-04-15', title: 'Published Assessment Revision v2.0', type: 'rie', desc: 'Updated controls with dual-lanyard harness requirements.' },
  { date: '2026-06-12', title: 'Action Remediation Campaign', type: 'action', desc: '14 signage and cable tray items closed by operators.' }
];

const navigateToPermit = (id) => { store.selectedPermitId = id; store.navigateTo('permit-details', { permitId: id }); };
const kpiIcons = { Siren, FileWarning, CheckSquare, Flame, Truck, FileCheck, ClipboardCheck, Users };
// Side-border color per triage module — project palette only
const barByKind = (kind) => {
  if (kind.startsWith('Overdue')) return 'border-l-red-500';
  if (kind.startsWith('Incident')) return 'border-l-warning';
  if (kind.startsWith('Finding')) return 'border-l-yellow-500';
  if (kind.startsWith('Permit')) return 'border-l-brand-500';
  if (kind.startsWith('Inspection')) return 'border-l-brand-300';
  if (kind.startsWith('Cert')) return 'border-l-success';
  return 'border-l-slate-300';
};
const quickReportIncident = () => {
  if (!project.value) return;
  store.addIncident({ projectId: project.value.id, type: 'Dangerous Situation', description: 'Reported from project dashboard triage', companyName: project.value.client, severity: 'Medium', reporter: 'Dashboard User' });
};
const quickAddFinding = () => {
  if (!project.value) return;
  store.addFinding({ projectId: project.value.id, type: 'Inspection', kind: 'Dashboard triage', title: 'New finding registered from dashboard', reporter: 'Dashboard User' });
};
</script>

<template>
  <div class="space-y-6 pb-16" v-if="project">
    <!-- Header: maximal brand banner (project palette only) -->
    <div class="rounded-2xl overflow-hidden border border-brand-100 shadow-sm">
      <div class="relative bg-brand-800 px-5 pt-5 pb-5 text-white overflow-hidden">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hdr-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M36 0H0V36" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1" />
            </pattern>
            <pattern id="hdr-dots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill="#ffffff" fill-opacity="0.14" />
            </pattern>
            <linearGradient id="hdr-fade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#0c3a54" stop-opacity="0.55" />
              <stop offset="0.45" stop-color="#0c3a54" stop-opacity="0.05" />
              <stop offset="1" stop-color="#0c3a54" stop-opacity="0" />
            </linearGradient>
          </defs>
          <rect width="1200" height="260" fill="url(#hdr-grid)" />
          <rect x="760" y="0" width="440" height="260" fill="url(#hdr-dots)" opacity="0.6" />
          <rect width="1200" height="260" fill="url(#hdr-fade)" />
          <g fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.5">
            <circle cx="1010" cy="130" r="70" />
            <circle cx="1010" cy="130" r="105" stroke-dasharray="5 7" />
            <circle cx="1010" cy="130" r="140" stroke-opacity="0.07" />
          </g>
          <text x="960" y="205" font-size="120" font-weight="800" fill="#ffffff" fill-opacity="0.06" letter-spacing="4">HSE</text>
          <g stroke="#ffffff" stroke-opacity="0.28" stroke-width="2" fill="none">
            <polyline points="60,218 240,218 300,170 470,170 530,210 700,210" stroke-dasharray="7 6" stroke-linecap="round" />
          </g>
          <g fill="#ffffff">
            <circle cx="60" cy="218" r="4" fill-opacity="0.5" />
            <circle cx="300" cy="170" r="4" fill-opacity="0.5" />
            <circle cx="530" cy="210" r="4" fill-opacity="0.5" />
            <circle cx="700" cy="210" r="5" fill-opacity="0.8" />
          </g>
          <g fill="#ffffff" fill-opacity="0.13">
            <rect x="880" y="60" width="10" height="170" rx="2" />
            <rect x="820" y="72" width="150" height="9" rx="2" />
            <rect x="890" y="52" width="26" height="16" rx="2" />
            <rect x="876" y="81" width="3" height="70" />
            <rect x="868" y="151" width="19" height="13" rx="1.5" />
            <rect x="760" y="205" width="70" height="25" rx="2" />
            <rect x="836" y="205" width="70" height="25" rx="2" />
            <rect x="912" y="205" width="70" height="25" rx="2" />
            <rect x="752" y="230" width="238" height="8" rx="2" fill-opacity="0.10" />
          </g>
          <g fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2">
            <path d="M180 52a26 26 0 0 1 52 0v8h-52z" />
            <rect x="172" y="60" width="68" height="7" rx="3.5" />
          </g>
        </svg>
        <div class="absolute -left-16 -bottom-28 w-72 h-72 rounded-full bg-brand-400/20 blur-3xl pointer-events-none"></div>
        <div class="relative flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap text-[11px] font-bold">
              <span class="px-2 py-0.5 rounded-md bg-white/15 border border-white/25 uppercase tracking-wider">Project #{{ project.id }}</span>
              <span class="px-2 py-0.5 rounded-md bg-white/15 border border-white/25">{{ project.status }} Site</span>
              <span class="px-2 py-0.5 rounded-md bg-white/15 border border-white/25 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></span>Live · {{ onSiteWorkers.length }} on-site</span>
              <span v-if="criticalIncidents.length" class="px-2 py-0.5 rounded-md bg-white/15 border border-white/25">{{ criticalIncidents.length }} critical incidents</span>
              <span class="px-2 py-0.5 rounded-md bg-white/15 border border-white/25">{{ complianceRate }}% audit pass</span>
            </div>
            <h1 class="text-2xl font-bold tracking-tight mt-2.5">{{ project.name }}</h1>
            <div class="flex items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-brand-50 flex-wrap">
              <span class="flex items-center gap-1.5"><Briefcase class="w-3.5 h-3.5 opacity-80" />{{ project.client }}</span>
              <span class="flex items-center gap-1.5"><MapPin class="w-3.5 h-3.5 opacity-80" />{{ project.location }}</span>
              <span class="flex items-center gap-1.5"><User class="w-3.5 h-3.5 opacity-80" />{{ project.manager }}</span>
              <span class="flex items-center gap-1.5"><Calendar class="w-3.5 h-3.5 opacity-80" />Audit <strong class="text-white">{{ project.reviewDueDate }}</strong></span>
            </div>
            <div class="flex items-center gap-4 mt-3 text-xs font-semibold">
              <span class="flex items-center gap-1.5"><span class="text-base font-bold">{{ openIncidents.length }}</span><span class="text-brand-100">incidents</span></span>
              <span class="w-px h-4 bg-white/25"></span>
              <span class="flex items-center gap-1.5"><span class="text-base font-bold">{{ openFindings.length }}</span><span class="text-brand-100">findings</span></span>
              <span class="w-px h-4 bg-white/25"></span>
              <span class="flex items-center gap-1.5"><span class="text-base font-bold">{{ openActions.length }}</span><span class="text-brand-100">actions</span></span>
              <span class="w-px h-4 bg-white/25"></span>
              <span class="flex items-center gap-1.5"><span class="text-base font-bold">{{ activePermits.length }}</span><span class="text-brand-100">permits</span></span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <div class="bg-white/15 border border-white/25 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 backdrop-blur">
              <div class="w-9 h-9 rounded-xl bg-success-500 flex items-center justify-center"><Shield class="w-4 h-4 text-white" /></div>
              <div><div class="text-base font-bold leading-none">142</div><div class="text-[10px] font-bold uppercase tracking-wider text-brand-50">Zero LTI days</div></div>
            </div>
            <button @click="showQrModal = true" class="px-3.5 py-2.5 text-xs font-bold bg-white/15 border border-white/25 rounded-xl flex items-center gap-1.5 hover:bg-white/25"><QrCode class="w-4 h-4" />Site QR</button>
            <button @click="store.wizard.info.projectId = project.id; store.navigateTo('create-assessment')" class="px-3.5 py-2.5 text-xs font-bold bg-white text-brand-700 rounded-xl flex items-center gap-1.5 shadow-lg"><Plus class="w-4 h-4" />Assessment</button>
          </div>
        </div>
      </div>
      <div class="px-4 py-2.5 flex items-center gap-2 overflow-x-auto bg-slate-50 border-t border-slate-100">
        <button @click="activeTab = 'operations'" class="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'operations' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white'"><Layers class="w-3.5 h-3.5" />Operations · {{ openIncidents.length + openFindings.length + openActions.length }} open</button>
        <button @click="activeTab = 'assessments'" class="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'assessments' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white'"><ClipboardCheck class="w-3.5 h-3.5" />RI&E ({{ projectAssessments.length }})</button>
        <button @click="activeTab = 'documents'" class="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'documents' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white'"><FileText class="w-3.5 h-3.5" />Dossier</button>
        <button @click="activeTab = 'timeline'" class="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap" :class="activeTab === 'timeline' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white'"><History class="w-3.5 h-3.5" />Timeline</button>
      </div>
    </div>

    <div v-if="activeTab === 'operations'" class="space-y-6">
      <!-- Attention KPIs: only metrics needing action, signal-colored left borders -->
      <div>
        <div class="flex items-center justify-between mb-2.5">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Needs attention · {{ attentionKpis.length }}</h3>
          <span v-if="healthyLine" class="text-[11px] font-semibold text-slate-400 truncate ml-4">Healthy: {{ healthyLine }}</span>
        </div>
        <div v-if="attentionKpis.length" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
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
        <div v-else class="rounded-2xl border border-success-100 bg-success-50 px-5 py-4 text-xs font-semibold text-success-700">All clear — no metric needs attention right now. {{ healthyLine }}</div>
      </div>

      <!-- Site status: icon rows with spotlight detail + state pill + action -->
      <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div><h3 class="text-sm font-bold text-slate-800">Site status</h3><p class="text-xs text-slate-400">Is the site healthy? Fix what is red.</p></div>
          <span class="text-[11px] font-bold px-2.5 py-1 rounded-full" :class="statusRows.some(r => r.state === 'bad') ? 'bg-red-50 text-red-700' : 'bg-success-50 text-success-700'">{{ statusRows.filter(r => r.state !== 'ok').length }} of {{ statusRows.length }} need attention</span>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="r in statusRows" :key="r.key" class="px-5 py-3.5 flex items-center gap-3.5 hover:bg-slate-50/60 transition-colors">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="[r.state === 'bad' ? 'bg-red-50 text-red-600' : '', r.state === 'warn' ? 'bg-warning-50 text-warning-700' : '', r.state === 'ok' ? 'bg-success-50 text-success-700' : '']"><component :is="kpiIcons[r.icon]" class="w-4.5 h-4.5" /></div>
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

      <!-- Safety pulse: report volume trend + severity mix + verification coverage -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 h-fit">
          <div class="flex items-start justify-between">
            <div><h3 class="text-sm font-bold text-slate-800">Incident pulse</h3><p class="text-xs text-slate-400 mt-0.5">Reports per month · incidents + findings · {{ projectIncidents.length + projectFindings.length }} total</p></div>
            <span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-wider">Mar – Sep</span>
          </div>
          <div class="mt-3">
            <svg viewBox="0 0 560 150" class="w-full h-auto" preserveAspectRatio="none" style="height: 150px;">
              <path :d="pulseArea" fill="rgba(2,132,199,0.10)" />
              <polyline :points="pulseLine" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              <g v-for="p in pulsePoints" :key="p.label">
                <circle :cx="p.x" :cy="p.y" r="8" fill="#0284c7" opacity="0.12" />
                <circle :cx="p.x" :cy="p.y" r="3.5" fill="#0284c7" stroke="#fff" stroke-width="1.5" />
                <text :x="p.x" :y="p.y - 12" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">{{ p.value }}</text>
                <text :x="p.x" :y="144" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8">{{ p.label }}</text>
              </g>
            </svg>
          </div>
          <div class="mt-3">
            <div class="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
              <div v-for="s in severitySplit" :key="s.label" class="h-full" :class="s.bar" :style="{ width: s.pct + '%' }"></div>
            </div>
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span v-for="s in severitySplit" :key="s.label" class="flex items-center gap-1.5 font-semibold text-slate-500"><span class="w-2 h-2 rounded-full" :class="s.bar"></span>{{ s.label }} · <strong class="text-slate-800">{{ s.n }}</strong></span>
            </div>
          </div>
        </div>
        <div class="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 h-fit">
          <div class="flex items-start justify-between">
            <div><h3 class="text-sm font-bold text-slate-800">Verification coverage</h3><p class="text-xs text-slate-400 mt-0.5">{{ coverageTotals.n }} inspections · {{ coverageTotals.passed }} passed · {{ coverageTotals.findings }} findings</p></div>
            <span class="text-xl font-bold" :class="complianceRate >= 90 ? 'text-success-700' : 'text-red-600'">{{ complianceRate }}%</span>
          </div>
          <div class="mt-4 space-y-3.5">
            <div v-for="r in coverageRows" :key="r.type">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-slate-700">{{ r.type }}</span>
                <span class="text-slate-400 font-semibold">{{ r.done }}/{{ r.n }} done · <strong class="text-slate-600">{{ r.rate }}%</strong> · {{ r.findings }} findings</span>
              </div>
              <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full rounded-full bg-brand-500" :style="{ width: r.rate + '%' }"></div></div>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] font-semibold text-slate-400">
            <span>{{ projectTras.length }} TRAs linked</span><span>{{ openFindings.length }} findings open</span><span>{{ openActions.length }} actions open</span>
          </div>
        </div>
      </div>

      <!-- Event wall: maximal density, minimal color -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden h-fit">
          <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2"><Siren class="w-4 h-4 text-brand-600" /><h3 class="text-sm font-black text-slate-900">Incidents · {{ projectIncidents.length }}</h3><span class="text-[11px] font-bold text-red-600">{{ openIncidents.length }} open</span></div>
            <button @click="quickReportIncident" class="text-xs font-bold text-white bg-brand-500 px-2.5 py-1.5 rounded-lg flex items-center gap-1"><Plus class="w-3.5 h-3.5" />Report</button>
          </div>
          <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            <div v-for="inc in projectIncidents" :key="inc.id" class="px-5 py-3 hover:bg-red-50/40 text-xs">
              <div class="flex items-center gap-2"><span class="font-mono font-black text-slate-400">#{{ inc.nr }}</span><span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold" :class="inc.severity === 'Critical' || inc.severity === 'High' ? 'bg-slate-100 text-red-600' : 'bg-slate-100 text-slate-500'">{{ inc.severity }}</span><span class="font-semibold text-slate-500 truncate">{{ inc.type }}</span><span class="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black" :class="inc.status === 'Open' ? 'bg-red-100 text-red-700' : inc.status === 'In Review' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'">{{ inc.status }}</span></div>
              <p class="font-bold text-slate-900 mt-1 leading-snug">{{ inc.description }}</p>
              <p class="text-[11px] text-slate-400 mt-1">{{ inc.date }} · {{ inc.reporter }} · {{ inc.companyName }} · <strong class="text-slate-600">{{ inc.findingsCount }} findings · {{ inc.actionsCount }} actions</strong></p>
            </div>
            <div v-if="!projectIncidents.length" class="p-8 text-center text-xs text-slate-400">No incidents.</div>
          </div>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden h-fit">
          <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2"><ClipboardCheck class="w-4 h-4 text-brand-600" /><h3 class="text-sm font-black text-slate-900">Inspections · {{ projectInspections.length }}</h3><span class="text-[11px] font-bold text-amber-600">{{ scheduledInspections.length }} scheduled</span></div>
            <button @click="store.addToast('Open Inspections module to schedule.')" class="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1"><Plus class="w-3.5 h-3.5" />Schedule</button>
          </div>
          <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            <div v-for="sp in projectInspections" :key="sp.id" class="px-5 py-3 hover:bg-slate-50 text-xs">
              <div class="flex items-center gap-2"><span class="font-mono font-black text-slate-400">#{{ sp.nr }}</span><span class="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-brand-100 text-brand-700">{{ sp.type }}</span><span class="ml-auto text-[11px] font-black" :class="sp.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'">● {{ sp.status }}</span></div>
              <p class="font-bold text-slate-900 mt-1 leading-snug">{{ sp.description }}</p>
              <p class="text-[11px] text-slate-400 mt-1">{{ sp.scheduledDate }} · {{ sp.inspector }} · {{ sp.location }} · <strong class="text-slate-600">{{ sp.passedChecks }} passed · {{ sp.findingsCount }} findings · {{ sp.actionsCount }} actions</strong></p>
            </div>
            <div v-if="!projectInspections.length" class="p-8 text-center text-xs text-slate-400">No inspections.</div>
          </div>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden h-fit">
          <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2"><FileWarning class="w-4 h-4 text-brand-600" /><h3 class="text-sm font-black text-slate-900">Findings · {{ projectFindings.length }}</h3><span class="text-[11px] font-bold text-amber-600">{{ openFindings.length }} open</span></div>
            <button @click="quickAddFinding" class="text-xs font-bold text-white bg-brand-500 px-2.5 py-1.5 rounded-lg flex items-center gap-1"><Plus class="w-3.5 h-3.5" />Add</button>
          </div>
          <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            <div v-for="f in projectFindings" :key="f.id" class="px-5 py-3 hover:bg-amber-50/40 text-xs">
              <div class="flex items-center gap-2"><span class="font-mono font-black text-slate-400">#{{ f.nr }}</span><span class="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-brand-50 text-brand-700">{{ f.type }}</span><span class="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black" :class="f.status === 'Closed' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'">{{ f.status }}</span></div>
              <p class="font-bold text-slate-900 mt-1 leading-snug">{{ f.title }}</p>
              <p class="text-[11px] text-slate-400 mt-1">{{ f.date }} · {{ f.reporter }} · {{ f.kind }} · <strong class="text-slate-600">{{ f.actionsCount }} actions</strong></p>
            </div>
            <div v-if="!projectFindings.length" class="p-8 text-center text-xs text-slate-400">No findings.</div>
          </div>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white overflow-hidden h-fit">
          <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2"><ListChecks class="w-4 h-4 text-brand-600" /><h3 class="text-sm font-black text-slate-900">Actions · {{ projectActions.length }}</h3><span class="text-[11px] font-bold text-slate-400">{{ openActions.length }} open</span></div>
            <button @click="store.navigateTo('actions')" class="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1">All<ChevronRight class="w-3.5 h-3.5" /></button>
          </div>
          <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            <div v-for="a in openActions.slice(0, 8)" :key="a.id" class="px-5 py-3 flex items-start gap-2.5 text-xs hover:bg-orange-50/40">
              <button @click="store.toggleActionStatus(a.id)" class="mt-0.5 w-5 h-5 rounded-lg border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-600 flex items-center justify-center shrink-0"><Check class="w-3.5 h-3.5" /></button>
              <div class="min-w-0"><div class="flex items-center gap-2 flex-wrap"><span class="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase" :class="[a.priority === 'High' ? 'bg-red-100 text-red-700' : '', a.priority === 'Medium' ? 'bg-warning-50 text-warning-700' : '', a.priority === 'Low' ? 'bg-brand-50 text-brand-700' : '']">{{ a.priority }}</span><span class="font-mono text-[11px] text-slate-400">Due {{ a.dueDate }} · {{ a.status }}</span></div>
              <p class="font-bold text-slate-900 mt-1 leading-snug">{{ a.title }}</p><p class="text-[11px] text-slate-400">{{ a.assignedTo }}</p></div>
            </div>
            <div v-if="!openActions.length" class="p-8 text-center text-xs text-slate-400">All actions completed.</div>
          </div>
        </div>
      </div>

      <!-- Bottom wall: content-sized cards, no stretch gaps -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 h-fit">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-100"><ShieldAlert class="w-4 h-4 text-red-500" /><h3 class="text-sm font-black text-slate-900">RI&E risk matrix</h3><span class="ml-auto text-[11px] font-bold text-slate-400">{{ projectHazards.length }} hazards</span></div>
          <div class="mt-3 space-y-2">
            <div v-for="r in riskByCategory" :key="r.category" class="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 flex items-center gap-2 text-xs">
              <span class="font-black text-slate-800 w-24 truncate">{{ r.category }}</span>
              <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div class="h-full rounded-full" :class="r.max > 150 ? 'bg-red-500' : r.max > 70 ? 'bg-amber-500' : 'bg-emerald-500'" :style="{ width: Math.min(100, (r.max / 320) * 100) + '%' }"></div></div>
              <span class="font-black w-14 text-right" :class="r.max > 100 ? 'text-red-600' : 'text-slate-700'">{{ r.max }}</span>
              <span class="text-slate-400 w-12 text-right">{{ r.count }}×</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between"><span>{{ projectAssessments.length }} assessments</span><span>{{ projectTras.length }} TRAs</span><span>{{ complianceRate }}% audit pass</span></div>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5 h-fit">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-100"><Users class="w-4 h-4 text-brand-600" /><h3 class="text-sm font-black text-slate-900">Team · {{ onSiteWorkers.length }}</h3><span class="ml-auto text-[11px] font-black" :class="certCompliance.gaps ? 'text-red-600' : 'text-emerald-600'">{{ certCompliance.percentage }}% certs</span></div>
          <div class="mt-3 relative"><Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" /><input v-model="workerSearch" placeholder="Search name, company, role..." class="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" /></div>
          <div class="mt-2 divide-y divide-slate-100">
            <div v-for="w in filteredWorkers" :key="w.id" class="py-2 flex items-center gap-2.5 text-xs">
              <div class="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-black flex items-center justify-center text-[10px]">{{ w.name.split(' ').map(n => n[0]).join('').slice(0, 2) }}</div>
              <div class="min-w-0 flex-1"><p class="font-bold text-slate-900 truncate">{{ w.name }}</p><p class="text-[11px] text-slate-400 truncate">{{ w.company }} · {{ w.role }} · in {{ w.checkInTime }}</p></div>
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0" :class="w.certStatus === 'Valid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">{{ w.certName }}</span>
            </div>
          </div>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5 h-fit">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-100"><FileCheck class="w-4 h-4 text-brand-600" /><h3 class="text-sm font-black text-slate-900">Permits & TRA</h3><button @click="store.navigateTo('permits-dashboard')" class="ml-auto text-xs font-bold text-brand-600 flex items-center gap-1">All<ChevronRight class="w-3.5 h-3.5" /></button></div>
          <div class="mt-3 space-y-2">
            <div v-for="p in projectPermits.slice(0, 4)" :key="p.id" @click="navigateToPermit(p.id)" class="rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50/30 p-2.5 cursor-pointer text-xs">
              <div class="flex items-center gap-2"><span class="font-mono font-black text-slate-400">#{{ p.permitNumber }}</span><span class="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-brand-50 text-brand-700">{{ p.type }}</span><span class="ml-auto text-[10px] font-black" :class="p.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'">{{ p.status }}</span></div>
              <p class="font-bold text-slate-900 mt-1 truncate">{{ p.title }}</p>
              <p class="text-[11px] text-slate-400">{{ p.holderName }} · {{ p.location }} · until {{ p.validTo }}</p>
            </div>
            <div v-if="!projectPermits.length" class="text-xs text-slate-400 text-center py-2">No permits.</div>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-100">
            <span class="text-[11px] font-black uppercase tracking-wider text-slate-400">Task safety</span>
            <div v-for="t in projectTras.slice(0, 3)" :key="t.id" class="text-xs mt-1.5 flex justify-between"><span class="font-bold text-slate-800 truncate">{{ t.title }}</span><span class="font-black" :class="t.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'">{{ t.status }}</span></div>
            <div v-if="!projectTras.length" class="text-xs text-slate-400 mt-1">No TRAs linked.</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'assessments'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div><h3 class="text-sm font-black text-slate-900 uppercase tracking-wider">RI&E Assessments ({{ projectAssessments.length }})</h3><p class="text-xs text-slate-400">Baseline and periodic assessments for this site.</p></div>
        <button @click="store.wizard.info.projectId = project.id; store.navigateTo('create-assessment')" class="text-xs font-bold text-white bg-brand-500 px-3 py-2 rounded-xl flex items-center gap-1.5"><Plus class="w-3.5 h-3.5" />Add Assessment</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="a in projectAssessments" :key="a.id" @click="store.navigateTo('assessments', { assessmentId: a.id })" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
          <div class="flex items-center justify-between text-xs"><span class="font-mono font-bold text-slate-400">{{ a.version }}</span><span class="px-2 py-0.5 rounded-full text-[10px] font-black" :class="[a.status === 'Published' ? 'bg-success-50 text-success-700' : '', a.status === 'Under Review' ? 'bg-brand-50 text-brand-700' : '', a.status === 'Draft' ? 'bg-slate-100 text-slate-500' : '']">{{ a.status }}</span></div>
          <p class="font-black text-slate-900 mt-2">{{ a.title }}</p>
          <p class="text-xs text-slate-400">{{ a.area }} · {{ a.assessor }}</p>
          <div class="grid grid-cols-3 text-center bg-slate-50 rounded-xl mt-3 py-2.5 text-xs"><div><div class="text-[10px] font-bold text-slate-400">HAZARDS</div><div class="font-black">{{ a.hazardsCount }}</div></div><div><div class="text-[10px] font-bold text-slate-400">RESIDUAL</div><div class="font-black text-red-600">{{ a.highestResidualRisk }}</div></div><div><div class="text-[10px] font-bold text-slate-400">ACTIONS</div><div class="font-black" :class="a.openActionsCount ? 'text-amber-600' : ''">{{ a.openActionsCount }}</div></div></div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'documents'" class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div class="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between"><h3 class="text-sm font-black text-slate-900">Site dossier</h3><button @click="store.addToast('Upload simulated.')" class="text-xs font-bold bg-brand-500 text-white px-3 py-1.5 rounded-lg">+ Upload</button></div>
      <div class="divide-y divide-slate-100 text-xs">
        <div class="p-4 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-[10px]">PDF</div><div><p class="font-bold">Project_Safety_Plan_2026.pdf</p><p class="text-[11px] text-slate-400">4.8 MB · Markus Vance</p></div></div><button @click="store.addToast('Download simulated.')"><FileDown class="w-4 h-4 text-slate-400" /></button></div>
        <div class="p-4 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-[10px]">DWG</div><div><p class="font-bold">Site_Emergency_Escape_Routes.dwg</p><p class="text-[11px] text-slate-400">18.2 MB · Sarah Jenkins</p></div></div><button @click="store.addToast('Download simulated.')"><FileDown class="w-4 h-4 text-slate-400" /></button></div>
      </div>
    </div>

    <div v-else-if="activeTab === 'timeline'" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 class="text-sm font-black text-slate-900">Timeline</h3>
      <div class="mt-4 ml-2 pl-5 border-l-2 border-slate-100 space-y-5">
        <div v-for="(m, i) in projectMilestones" :key="i" class="relative text-xs"><span class="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-brand-500"></span><span class="font-mono font-bold text-slate-400">{{ m.date }}</span><p class="font-black text-slate-900 text-sm">{{ m.title }}</p><p class="text-slate-500">{{ m.desc }}</p></div>
      </div>
    </div>

    <SiteQrModal :show="showQrModal" :project="project" @close="showQrModal = false" />
  </div>
  <div v-else class="text-center py-20 text-slate-400 bg-white border rounded-2xl">Project not found.</div>
</template>
