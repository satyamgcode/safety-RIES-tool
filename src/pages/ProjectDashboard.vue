<script setup>
import { computed, ref, watch } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import ProjectDonutChart from '../components/ProjectDonutChart.vue';
import ProjectInspectionBarChart from '../components/ProjectInspectionBarChart.vue';
import SiteQrModal from '../components/SiteQrModal.vue';
import {
  Briefcase,
  User,
  MapPin,
  Calendar,
  Users,
  FileCheck,
  ShieldAlert,
  CheckSquare,
  ClipboardCheck,
  Plus,
  QrCode,
  ArrowRight,
  Clock,
  HardHat,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Info,
  ChevronRight,
  TrendingUp,
  History,
  FileText,
  Truck,
  Wrench,
  Check,
  Shield,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-vue-next';

// Active View Tab: 'operations' (Main Dashboard), 'assessments' (RI&Es), 'documents' (Files), 'timeline' (History)
const activeTab = ref('operations');

// Project Resolution: check store.currentParams.projectId, or store.selectedProjectId, or default to 1
const activeProjectId = computed(() => {
  if (store.currentParams?.projectId) {
    return parseInt(store.currentParams.projectId, 10);
  }
  if (store.selectedProjectId && store.selectedProjectId !== 'all') {
    return parseInt(store.selectedProjectId, 10);
  }
  return 1;
});

const project = computed(() => {
  return store.projects.find(p => p.id === activeProjectId.value) || store.projects[0];
});

// Dropdown project switch handler
const handleProjectSwitch = (event) => {
  const newId = parseInt(event.target.value, 10);
  store.selectedProjectId = newId;
  store.currentParams.projectId = newId;
};

// Modal for Site QR
const showQrModal = ref(false);

// Project Data Computations
const projectAssessments = computed(() => {
  if (!project.value) return [];
  return store.assessments.filter(a => a.projectId === project.value.id);
});

const projectHazards = computed(() => {
  if (!project.value) return [];
  return store.hazards.filter(h => h.projectId === project.value.id);
});

const projectActions = computed(() => {
  if (!project.value) return [];
  return store.actions.filter(a => a.projectId === project.value.id);
});

const openActions = computed(() => {
  return projectActions.value.filter(a => a.status !== 'Completed');
});

const highPriorityActions = computed(() => {
  return openActions.value.filter(a => a.priority === 'High' || a.priority === 'Critical');
});

const highestRisk = computed(() => {
  if (projectHazards.value.length === 0) return 0;
  return Math.max(...projectHazards.value.map(h => h.residualRiskScore));
});

// Active Work Permits for this project
const projectPermits = computed(() => {
  if (!project.value) return [];
  return (store.permits || []).filter(p => p.projectId === project.value.id);
});

const activePermits = computed(() => {
  return projectPermits.value.filter(p => p.status === 'Active');
});

// On-site workers for this project
const onSiteWorkers = computed(() => {
  if (!project.value) return [];
  return store.getProjectCheckIns(project.value.id);
});

const workerSearch = ref('');
const filteredWorkers = computed(() => {
  if (!workerSearch.value.trim()) return onSiteWorkers.value;
  const q = workerSearch.value.toLowerCase();
  return onSiteWorkers.value.filter(w => 
    w.name.toLowerCase().includes(q) ||
    w.company.toLowerCase().includes(q) ||
    w.role.toLowerCase().includes(q)
  );
});

// Machinery and equipment
const projectEquipment = computed(() => {
  if (!project.value) return [];
  return store.getProjectEquipment(project.value.id);
});

// Safety Inspections
const projectInspections = computed(() => {
  if (!project.value) return [];
  return store.getProjectInspections(project.value.id);
});

// Charts dynamic data
const incidentCausesData = computed(() => {
  if (!project.value) return [];
  return store.getProjectIncidentDistribution(project.value.id);
});

const inspectionAuditData = computed(() => {
  if (!project.value) return [];
  return store.getProjectInspectionDistribution(project.value.id);
});

// Overall Compliance Rate computation
const complianceRate = computed(() => {
  const auditData = inspectionAuditData.value;
  if (!auditData || auditData.length === 0) return 96;
  const totalPassed = auditData.reduce((acc, d) => acc + d.passed, 0);
  const totalFindings = auditData.reduce((acc, d) => acc + d.findings, 0);
  const total = totalPassed + totalFindings;
  return total > 0 ? Math.round((totalPassed / total) * 100) : 98;
});

// Mock timeline logs
const projectMilestones = [
  { date: '2026-01-10', title: 'Project Kick-off & Site Handover', type: 'system', desc: 'Site access granted and initial logistics perimeter established.' },
  { date: '2026-02-14', title: 'Initial Baseline RI&E Draft Completed', type: 'rie', desc: 'Identified 25 height safety and machinery hazards.' },
  { date: '2026-03-01', title: 'Safety Audit & Gate Review 1', type: 'audit', desc: 'Board review completed. Edge protection measures approved.' },
  { date: '2026-04-15', title: 'Published Assessment Revision v2.0', type: 'rie', desc: 'Updated hazard controls with dual-lanyard harness requirements.' },
  { date: '2026-06-12', title: 'Action Items Remediation Campaign', type: 'action', desc: '14 safety signage and cable tray items closed by operators.' }
];

const navigateToPermit = (permitId) => {
  store.selectedPermitId = permitId;
  store.navigateTo('permit-details', { permitId });
};
</script>

<template>
  <div class="space-y-6 pb-16" v-if="project">
    <!-- Top Command & Project Header Banner -->
    <div class="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs relative overflow-hidden">
      <!-- Background subtle gradient accent -->
      <div class="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-linear-to-br from-brand-50 to-brand-100/30 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <!-- Project Context -->
        <div class="space-y-3">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="px-2.5 py-0.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-black uppercase tracking-wider border border-brand-100">
              Project #{{ project.id }}
            </span>
            <span
              class="px-2.5 py-0.5 text-xs font-bold rounded-lg border"
              :class="[
                project.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-200' : '',
                project.status === 'Planning' ? 'bg-slate-50 text-slate-600 border-slate-200' : '',
                project.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : '',
                project.status === 'On Hold' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''
              ]"
            >
              {{ project.status }} Site
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Safety Monitoring
            </span>
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-black text-slate-800 tracking-tight font-sans">
              {{ project.name }}
            </h1>
            
            <!-- Quick Site Switcher Dropdown -->
            <div class="relative inline-flex items-center">
              <select
                :value="project.id"
                @change="handleProjectSwitch"
                class="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                title="Switch active project site"
              >
                <option v-for="p in store.projects" :key="p.id" :value="p.id">
                  Switch: {{ p.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Metadata Tags -->
          <div class="flex items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-500 flex-wrap">
            <span class="flex items-center gap-1.5">
              <Briefcase class="w-3.5 h-3.5 text-slate-400" />
              Client: <strong class="text-slate-700 font-semibold">{{ project.client }}</strong>
            </span>
            <span class="text-slate-300">•</span>
            <span class="flex items-center gap-1.5">
              <MapPin class="w-3.5 h-3.5 text-slate-400" />
              {{ project.location }}
            </span>
            <span class="text-slate-300">•</span>
            <span class="flex items-center gap-1.5">
              <User class="w-3.5 h-3.5 text-slate-400" />
              Manager: <strong class="text-slate-700 font-semibold">{{ project.manager }}</strong>
            </span>
            <span class="text-slate-300">•</span>
            <span class="flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              Next Audit: <strong class="text-amber-600 font-semibold">{{ project.reviewDueDate }}</strong>
            </span>
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
              <span class="block text-base font-black text-emerald-900 leading-none">142 Days</span>
              <span class="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">Zero Lost Time Injury</span>
            </div>
          </div>

          <!-- Print QR Induction Pass -->
          <button
            @click="showQrModal = true"
            class="px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl border border-brand-200 flex items-center justify-center gap-2 transition-all shadow-xs hover:scale-102"
          >
            <QrCode class="w-4 h-4 text-brand-600" />
            <span>Site QR Induction</span>
          </button>

          <!-- New Assessment / Hazard Shortcut -->
          <button
            @click="store.wizard.info.projectId = project.id; store.navigateTo('create-assessment')"
            class="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-102"
          >
            <Plus class="w-4 h-4" />
            <span>Add Assessment</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs (Operations vs RI&E Dossier vs Files) -->
      <div class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
        <button
          @click="activeTab = 'operations'"
          class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          :class="activeTab === 'operations' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>Site Safety Operations</span>
        </button>

        <button
          @click="activeTab = 'assessments'"
          class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          :class="activeTab === 'assessments' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <ClipboardCheck class="w-3.5 h-3.5" />
          <span>RI&E Assessments ({{ projectAssessments.length }})</span>
        </button>

        <button
          @click="activeTab = 'documents'"
          class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          :class="activeTab === 'documents' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <FileText class="w-3.5 h-3.5" />
          <span>Site Dossier & Documents (3)</span>
        </button>

        <button
          @click="activeTab = 'timeline'"
          class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          :class="activeTab === 'timeline' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <History class="w-3.5 h-3.5" />
          <span>Audit History Timeline</span>
        </button>
      </div>
    </div>

    <!-- TAB 1: OPERATIONS DASHBOARD (The primary redesigned dashboard) -->
    <div v-if="activeTab === 'operations'" class="space-y-6">
      <!-- 5 Clean Executive KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <!-- KPI 1: On-Site Workforce -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">On-Site Workforce</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-3">
            <span class="block text-2xl font-black text-slate-800 leading-none">
              {{ onSiteWorkers.length }}
            </span>
            <span class="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Inducted & Verified
            </span>
          </div>
        </div>

        <!-- KPI 2: Active Work Permits -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Active Permits (PTW)</span>
            <div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <FileCheck class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-3">
            <span class="block text-2xl font-black text-slate-800 leading-none">
              {{ activePermits.length }}
            </span>
            <span class="text-[11px] text-slate-500 font-semibold mt-1 block">
              {{ projectPermits.length }} total issued
            </span>
          </div>
        </div>

        <!-- KPI 3: Highest Risk Score -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Highest Risk</span>
            <div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-3">
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl font-black text-red-600 leading-none">
                {{ highestRisk }}
              </span>
              <span
                v-if="highestRisk > 0"
                class="text-[9px] font-extrabold px-1.5 py-0.5 rounded border"
                :class="getKinneyRiskLevel(highestRisk).color"
              >
                {{ getKinneyRiskLevel(highestRisk).name }}
              </span>
            </div>
            <span class="text-[11px] text-slate-500 font-semibold mt-1 block">
              Across {{ projectHazards.length }} hazards
            </span>
          </div>
        </div>

        <!-- KPI 4: Pending Corrective Actions -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Pending Actions</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckSquare class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-3">
            <span class="block text-2xl font-black text-slate-800 leading-none">
              {{ openActions.length }}
            </span>
            <span class="text-[11px] font-bold mt-1 block" :class="highPriorityActions.length > 0 ? 'text-amber-600' : 'text-slate-400'">
              {{ highPriorityActions.length }} High Priority
            </span>
          </div>
        </div>

        <!-- KPI 5: Safety Compliance Rate -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold uppercase tracking-wider">Audit Pass Rate</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ClipboardCheck class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-3">
            <span class="block text-2xl font-black text-emerald-700 leading-none">
              {{ complianceRate }}%
            </span>
            <span class="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 class="w-3 h-3 text-emerald-500" />
              Audits Up to Date
            </span>
          </div>
        </div>
      </div>

      <!-- Domain Safety Charts (Replacing dummy financial charts & monochrome pie) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Donut Chart: Incident & Near-Miss Root Causes (5 cols) -->
        <div class="lg:col-span-5">
          <ProjectDonutChart
            :data="incidentCausesData"
            title="Cause of Incident & Near-Misses"
            subtitle="Categorized site safety events & proactive hazard logs"
            totalLabel="Logged Reports"
          />
        </div>

        <!-- Grouped Bar Chart: Inspections & Audits by Domain (7 cols) -->
        <div class="lg:col-span-7">
          <ProjectInspectionBarChart
            :data="inspectionAuditData"
            title="Inspections & Audits per Domain"
            subtitle="Verified safety checks: Compliant items vs Remedial findings"
          />
        </div>
      </div>

      <!-- 4 Site Operational Widgets (Clean tables replacing empty peach cards) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Widget 1: On-Site Personnel & Subcontractor Roster -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <Users class="w-4 h-4 text-brand-600" />
              <h3 class="text-sm font-bold text-slate-800">Employees & Contractors On-Site</h3>
            </div>
            <span class="text-xs font-bold text-slate-400">
              {{ filteredWorkers.length }} checked in
            </span>
          </div>

          <!-- Quick Search -->
          <div class="mt-3 relative">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              v-model="workerSearch"
              type="text"
              placeholder="Search by worker name, subcontractor or role..."
              class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- Roster List -->
          <div class="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="worker in filteredWorkers"
              :key="worker.id"
              class="py-2.5 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl transition-colors text-xs"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                  {{ worker.name.split(' ').map(n => n[0]).join('') }}
                </div>
                <div class="truncate">
                  <span class="block font-bold text-slate-800 truncate">{{ worker.name }}</span>
                  <span class="block text-[11px] text-slate-400 truncate">{{ worker.company }} • {{ worker.role }}</span>
                </div>
              </div>

              <div class="flex items-center gap-3 shrink-0 text-right">
                <div>
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold block"
                    :class="worker.certStatus === 'Valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                  >
                    {{ worker.certName }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono mt-0.5 block flex items-center justify-end gap-1">
                    <Clock class="w-3 h-3 text-slate-400" />
                    In: {{ worker.checkInTime }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="filteredWorkers.length === 0" class="py-8 text-center text-slate-400 text-xs">
              No personnel matching search criteria.
            </div>
          </div>
        </div>

        <!-- Widget 2: Active Work Permits (Permit-to-Work) -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <FileCheck class="w-4 h-4 text-orange-500" />
              <h3 class="text-sm font-bold text-slate-800">Active High-Risk Permits (PTW)</h3>
            </div>
            <button
              @click="store.navigateTo('permits-dashboard')"
              class="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="permit in projectPermits"
              :key="permit.id"
              @click="navigateToPermit(permit.id)"
              class="py-2.5 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl transition-colors cursor-pointer text-xs group"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[10px] font-bold text-slate-400">#{{ permit.permitNumber }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    :class="[
                      permit.type === 'Hot Work' ? 'bg-orange-50 text-orange-700' : '',
                      permit.type === 'Confined Space' ? 'bg-purple-50 text-purple-700' : '',
                      permit.type === 'Electrical' ? 'bg-blue-50 text-blue-700' : '',
                      permit.type === 'Heights' ? 'bg-red-50 text-red-700' : ''
                    ]"
                  >
                    {{ permit.type }}
                  </span>
                </div>
                <h4 class="font-bold text-slate-800 mt-1 truncate group-hover:text-brand-600 transition-colors">
                  {{ permit.title }}
                </h4>
                <p class="text-[11px] text-slate-400 mt-0.5">Holder: {{ permit.holderName }} | Area: {{ permit.location }}</p>
              </div>

              <div class="shrink-0 text-right ml-3">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="[
                    permit.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : '',
                    permit.status === 'Closed' ? 'bg-slate-100 text-slate-600' : '',
                    permit.status === 'Awaiting Approval' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''
                  ]"
                >
                  {{ permit.status }}
                </span>
                <span class="block text-[10px] text-slate-400 mt-1 font-mono">Until: {{ permit.validTo }}</span>
              </div>
            </div>

            <div v-if="projectPermits.length === 0" class="py-8 text-center text-slate-400 text-xs">
              No permits created for this site yet.
            </div>
          </div>
        </div>

        <!-- Widget 3: Pending Corrective Actions (Priority Action Tracker) -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <CheckSquare class="w-4 h-4 text-amber-500" />
              <h3 class="text-sm font-bold text-slate-800">Pending Corrective Actions</h3>
            </div>
            <span class="text-xs font-bold text-slate-400">
              {{ openActions.length }} open
            </span>
          </div>

          <div class="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="act in openActions.slice(0, 5)"
              :key="act.id"
              class="py-2.5 flex items-start justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors text-xs"
            >
              <!-- 1-Click Status Complete Checkbox -->
              <button
                @click="store.toggleActionStatus(act.id)"
                class="mt-0.5 w-4.5 h-4.5 rounded-md border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-600 flex items-center justify-center shrink-0 transition-colors"
                title="Click to mark action completed"
              >
                <Check class="w-3.5 h-3.5" />
              </button>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span
                    class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider"
                    :class="[
                      act.priority === 'Critical' ? 'bg-red-50 text-red-700' : '',
                      act.priority === 'High' ? 'bg-orange-50 text-orange-700' : '',
                      act.priority === 'Medium' ? 'bg-amber-50 text-amber-700' : '',
                      act.priority === 'Low' ? 'bg-blue-50 text-blue-700' : ''
                    ]"
                  >
                    {{ act.priority }}
                  </span>
                  <span class="text-[11px] text-slate-400 font-mono">Due: {{ act.dueDate }}</span>
                </div>
                <h4 class="font-bold text-slate-800 mt-1 leading-snug">{{ act.title }}</h4>
                <p class="text-[11px] text-slate-400 mt-0.5 truncate">Assigned: {{ act.assignee }}</p>
              </div>
            </div>

            <div v-if="openActions.length === 0" class="py-8 text-center text-slate-400 text-xs">
              <CheckCircle2 class="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              All corrective actions completed for this project!
            </div>
          </div>
        </div>

        <!-- Widget 4: Heavy Machinery & Equipment Safety Status -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <Truck class="w-4 h-4 text-blue-600" />
              <h3 class="text-sm font-bold text-slate-800">Machinery & Heavy Equipment</h3>
            </div>
            <span class="text-xs font-bold text-slate-400">
              {{ projectEquipment.length }} active units
            </span>
          </div>

          <div class="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="eq in projectEquipment"
              :key="eq.id"
              class="py-2.5 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl transition-colors text-xs"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[10px] font-bold text-slate-400">{{ eq.tag }}</span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                    {{ eq.type }}
                  </span>
                </div>
                <h4 class="font-bold text-slate-800 mt-1 truncate">{{ eq.name }}</h4>
                <p class="text-[11px] text-slate-400 mt-0.5">Operator: {{ eq.operator }} • {{ eq.location }}</p>
              </div>

              <div class="shrink-0 text-right ml-3">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold inline-block"
                  :class="eq.certStatus === 'Certified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'"
                >
                  {{ eq.certStatus }}
                </span>
                <span class="block text-[10px] text-slate-400 mt-1 font-mono">Next: {{ eq.nextInspection }}</span>
              </div>
            </div>

            <div v-if="projectEquipment.length === 0" class="py-8 text-center text-slate-400 text-xs">
              No heavy machinery registered for this site.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: ASSESSMENTS (RI&E List for this Project) -->
    <div v-else-if="activeTab === 'assessments'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Project RI&E Assessments</h3>
          <p class="text-xs text-slate-400">Baseline and periodic risk assessments registered under this site.</p>
        </div>
        <button
          @click="store.wizard.info.projectId = project.id; store.navigateTo('create-assessment')"
          class="text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Assessment</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="ass in projectAssessments"
          :key="ass.id"
          @click="store.navigateTo('assessments', { assessmentId: ass.id })"
          class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 space-y-3 group"
        >
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">
              {{ ass.version }}
            </span>
            <span
              class="px-2 py-0.5 text-[9px] font-bold rounded-full"
              :class="[
                ass.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : '',
                ass.status === 'Under Review' ? 'bg-blue-50 text-blue-700 border border-blue-200' : '',
                ass.status === 'Draft' ? 'bg-slate-50 text-slate-500 border border-slate-200' : ''
              ]"
            >
              {{ ass.status }}
            </span>
          </div>

          <div>
            <h4 class="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{{ ass.title }}</h4>
            <span class="text-[11px] text-slate-400 block mt-0.5">Area: {{ ass.area }}</span>
          </div>

          <div class="grid grid-cols-3 gap-2.5 text-center text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl">
            <div>
              <span class="block text-[9px] text-slate-400">HAZARDS</span>
              <span class="block text-slate-700 mt-0.5 font-bold">{{ ass.hazardsCount }}</span>
            </div>
            <div>
              <span class="block text-[9px] text-slate-400">RESIDUAL RISK</span>
              <span class="block text-red-600 mt-0.5 font-bold" v-if="ass.highestResidualRisk > 0">{{ ass.highestResidualRisk }}</span>
              <span class="block text-slate-400 mt-0.5" v-else>0</span>
            </div>
            <div>
              <span class="block text-[9px] text-slate-400">ACTIONS</span>
              <span class="block text-slate-700 mt-0.5" :class="ass.openActionsCount > 0 ? 'text-amber-600 font-bold' : ''">{{ ass.openActionsCount }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-50 font-medium">
            <span>Assessor: {{ ass.assessor }}</span>
            <span>Due: {{ ass.reviewDate }}</span>
          </div>
        </div>

        <div v-if="projectAssessments.length === 0" class="col-span-2 text-center text-slate-400 py-12 bg-white border border-slate-100 rounded-2xl">
          No assessments created for this site yet. Click "Add Assessment" to begin.
        </div>
      </div>
    </div>

    <!-- TAB 3: DOCUMENTS (Site Dossier & Files) -->
    <div v-else-if="activeTab === 'documents'" class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
      <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Site Safety Dossier & Files</h4>
          <p class="text-[11px] text-slate-400">Mandatory HSE documentation, site layout drawings, and compliance certificates.</p>
        </div>
        <button
          @click="store.addToast('Mock file upload simulation.')"
          class="text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Upload File</span>
        </button>
      </div>

      <div class="divide-y divide-slate-100">
        <div class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-[10px]">PDF</div>
            <div>
              <span class="block font-bold text-slate-800">Project_Safety_Plan_and_HSE_Directives_2026.pdf</span>
              <span class="block text-[11px] text-slate-400 mt-0.5">Size: 4.8 MB • Uploaded by Markus Vance • 2026-01-15</span>
            </div>
          </div>
          <button @click="store.addToast('Mock file downloaded: Safety Plan.')" class="p-2 border border-slate-200 hover:bg-white rounded-xl text-slate-500 hover:text-slate-800 transition-colors">
            <FileDown class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">DWG</div>
            <div>
              <span class="block font-bold text-slate-800">Site_Emergency_Escape_Routes_and_Muster_Layout.dwg</span>
              <span class="block text-[11px] text-slate-400 mt-0.5">Size: 18.2 MB • Uploaded by Sarah Jenkins • 2026-02-02</span>
            </div>
          </div>
          <button @click="store.addToast('Mock file downloaded: Escape Layout.')" class="p-2 border border-slate-200 hover:bg-white rounded-xl text-slate-500 hover:text-slate-800 transition-colors">
            <FileDown class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px]">XLS</div>
            <div>
              <span class="block font-bold text-slate-800">Environmental_Impact_and_Noise_Baseline_Log.xlsx</span>
              <span class="block text-[11px] text-slate-400 mt-0.5">Size: 1.1 MB • Uploaded by External Auditor • 2026-03-20</span>
            </div>
          </div>
          <button @click="store.addToast('Mock file downloaded: Noise Log.')" class="p-2 border border-slate-200 hover:bg-white rounded-xl text-slate-500 hover:text-slate-800 transition-colors">
            <FileDown class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 4: TIMELINE (Audit & Milestone History) -->
    <div v-else-if="activeTab === 'timeline'" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
      <div>
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Site Audit & Milestone Timeline</h4>
        <p class="text-[11px] text-slate-400">Chronological audit checkpoints and regulatory revisions.</p>
      </div>

      <div class="relative pl-6 border-l-2 border-slate-100 space-y-6 ml-3">
        <div v-for="(mile, idx) in projectMilestones" :key="idx" class="relative">
          <span class="absolute -left-9 top-1 w-4 h-4 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center z-10">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
          </span>

          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{{ mile.date }}</span>
              <span
                class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                :class="[
                  mile.type === 'rie' ? 'bg-blue-100 text-blue-700' : '',
                  mile.type === 'audit' ? 'bg-purple-100 text-purple-700' : '',
                  mile.type === 'action' ? 'bg-orange-100 text-orange-700' : '',
                  mile.type === 'system' ? 'bg-slate-100 text-slate-700' : '',
                ]"
              >
                {{ mile.type }}
              </span>
            </div>
            <h4 class="text-sm font-bold text-slate-800">{{ mile.title }}</h4>
            <p class="text-xs text-slate-500 leading-relaxed max-w-xl">{{ mile.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Site QR Induction Modal -->
    <SiteQrModal
      :show="showQrModal"
      :project="project"
      @close="showQrModal = false"
    />
  </div>

  <div v-else class="text-center py-20 text-slate-400 bg-white border border-slate-100 rounded-2xl">
    Project record not found.
  </div>
</template>
