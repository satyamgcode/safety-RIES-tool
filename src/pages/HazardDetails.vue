<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel, calculateKinneyScore } from '../mockData';
import {
  ArrowLeft,
  Briefcase,
  ClipboardCheck,
  ShieldCheck,
  User,
  Calendar,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  Trash2,
  PlusCircle,
  FileText,
  FileDown,
  ArrowRightLeft,
  X,
  MessageSquare,
  Send,
  History
} from 'lucide-vue-next';

const activeTab = ref('overview'); // 'overview', 'controls', 'actions', 'attachments', 'history'
const selectedHierarchyFilter = ref('All');

const hazardId = computed(() => store.currentParams.hazardId);
const hazard = computed(() => store.hazards.find(h => h.id === hazardId.value));

const hazardActions = computed(() => {
  if (!hazard.value) return [];
  return store.actions.filter(act => act.hazardId === hazard.value.id);
});

// Controls filtering by hierarchy
const filteredControls = computed(() => {
  if (!hazard.value) return [];
  if (selectedHierarchyFilter.value === 'All') return hazard.value.controls;
  return hazard.value.controls.filter(c => c.type === selectedHierarchyFilter.value);
});

// Add Control Form State
const showAddControlForm = ref(false);
const newControl = ref({
  type: 'Engineering',
  description: '',
  responsible: '',
  effectiveness: 60,
  status: 'Implemented'
});

const submitControl = () => {
  if (!newControl.value.description || !newControl.value.responsible) {
    store.addToast('Please fill in control description and owner.', 'error');
    return;
  }
  store.addControlToHazard(hazard.value.id, { ...newControl.value });
  // Reset
  newControl.value = { type: 'Engineering', description: '', responsible: '', effectiveness: 60, status: 'Implemented' };
  showAddControlForm.value = false;
};

// Add Action Form State
const showAddActionForm = ref(false);
const newAction = ref({
  title: '',
  description: '',
  assignedTo: '',
  priority: 'Medium',
  dueDate: new Date(2026, 9, 1).toISOString().split('T')[0]
});

const submitAction = () => {
  if (!newAction.value.title || !newAction.value.assignedTo) {
    store.addToast('Please fill in action title and assignee.', 'error');
    return;
  }
  store.addActionToHazard(hazard.value.id, { ...newAction.value });
  newAction.value = { title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '2026-10-01' };
  showAddActionForm.value = false;
};

const removeControl = (id) => {
  store.deleteControlFromHazard(hazard.value.id, id);
};

// Mock attachments list
const attachmentsList = [
  { name: 'Scaffold_Load_Certificate_Signed.pdf', size: '1.4 MB', type: 'PDF' },
  { name: 'Site_Inspection_Field_Photo_L4.jpg', size: '3.6 MB', type: 'JPEG' },
  { name: 'Harness_Daily_Checklog.xlsx', size: '420 KB', type: 'XLSX' }
];

// Mock History
const historyLogs = [
  { date: '2026-02-14 09:00', text: 'Hazard identified during baseline scaffold setup by John Doe.' },
  { date: '2026-02-14 11:30', text: 'Initial risk score set to 270 (Kinney) based on High Likelihood.' },
  { date: '2026-03-01 10:15', text: 'Control added: Standard double guardrails edge protection installed.' },
  { date: '2026-03-10 14:00', text: 'Action Item ACT-0012 resolved: Safety signages barrier tape mounted.' },
  { date: '2026-03-12 16:30', text: 'Residual Risk recalculated down to 48 (Safe range) after inspector sign-off.' }
];

// Selected Action for Detail modal popup
const selectedAction = ref(null);
const newCommentText = ref('');
const localStatus = ref('');
const localProgress = ref(0);

const openActionDetail = (actionItem) => {
  selectedAction.value = actionItem;
  localStatus.value = actionItem.status;
  localProgress.value = actionItem.progress;
  newCommentText.value = '';
};

const closeActionDetail = () => {
  selectedAction.value = null;
};

const applyStatusChange = () => {
  if (!selectedAction.value) return;
  store.updateActionStatus(selectedAction.value.id, localStatus.value, localProgress.value);
  if (localStatus.value === 'Completed') {
    localProgress.value = 100;
  }
};

const submitComment = () => {
  if (!newCommentText.value.trim()) return;
  store.addActionComment(selectedAction.value.id, newCommentText.value, 'Current Auditor');
  newCommentText.value = '';
};
</script>

<template>
  <div class="space-y-6 pb-12" v-if="hazard">
    <!-- Back Navigation -->
    <div class="flex items-center justify-between">
      <button
        v-if="store.lastHazardSource === 'register'"
        @click="store.navigateTo('hazards')"
        class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Hazard Register</span>
      </button>
      <button
        v-else
        @click="store.navigateTo('assessments', { assessmentId: hazard.assessmentId })"
        class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Assessment Details</span>
      </button>

      <div class="text-xs font-semibold text-slate-400">
        Assessment: <span class="font-bold text-slate-600">{{ hazard.assessmentName }}</span>
      </div>
    </div>

    <!-- Main Header Card -->
    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div>
        <div class="flex items-center gap-3 flex-wrap">
          <span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-mono text-[10px] font-bold">{{ hazard.hazardId }}</span>
          <span class="px-2.5 py-0.5 bg-brand-50 text-brand-600 rounded text-xs font-bold uppercase tracking-wider">{{ hazard.category }}</span>
          <span
            class="px-2.5 py-0.5 text-[10px] font-bold rounded-full border"
            :class="[
              hazard.status === 'Mitigated' ? 'bg-success-50 text-success-700 border border-success-100' : 'bg-red-50 text-red-700 border border-red-100'
            ]"
          >
            {{ hazard.status }}
          </span>
        </div>
        <h2 class="text-xl font-extrabold text-slate-800 tracking-tight mt-2 font-sans">{{ hazard.name }}</h2>
        <p class="text-xs text-slate-400 mt-1">Consequence: <span class="font-bold text-slate-600">{{ hazard.consequence }}</span></p>
        <div class="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-3 pt-3 border-t border-slate-50">
          <span>Project: <span class="text-slate-700">{{ hazard.projectName }}</span></span>
          <span>•</span>
          <span>Location: <span class="text-slate-700">{{ hazard.location }}</span></span>
          <span>•</span>
          <span>Owner: <span class="text-slate-700">{{ hazard.owner }}</span></span>
        </div>
      </div>
    </div>

    <!-- Risk Score Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Initial Risk -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 flex flex-col justify-between">
        <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Initial Kinney Risk</span>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-2xl font-black text-slate-400">{{ hazard.likelihood * hazard.exposure * hazard.severity }}</span>
          <span class="text-xs font-semibold text-slate-400">Score</span>
        </div>
        <span class="block text-[10px] text-slate-400 font-bold mt-1">Formula Coords: L:{{ hazard.likelihood }} x E:{{ hazard.exposure }} x S:{{ hazard.severity }}</span>
      </div>

      <!-- Residual Risk -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 flex flex-col justify-between border-l-4 border-l-brand-500">
        <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Residual Kinney Risk</span>
        <div class="flex items-center justify-between mt-1">
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-black text-slate-800">{{ hazard.residualRiskScore }}</span>
            <span class="text-xs font-semibold text-slate-400">Score</span>
          </div>
          <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full border shrink-0" :class="getKinneyRiskLevel(hazard.residualRiskScore).color">
            {{ getKinneyRiskLevel(hazard.residualRiskScore).name }}
          </span>
        </div>
        <span class="block text-[10px] text-slate-500 font-bold mt-1">Formula Coords: L:{{ hazard.residualLikelihood }} x E:{{ hazard.residualExposure }} x S:{{ hazard.residualSeverity }}</span>
      </div>

      <!-- Risk Trend -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 flex flex-col justify-between">
        <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Risk Mitigation Trend</span>
        <div class="flex items-center gap-3 mt-1 text-slate-800">
          <TrendingDown class="w-8 h-8 text-success-600 bg-success-50 p-1.5 rounded-xl border border-success-100" v-if="hazard.riskTrend === 'Decreasing'" />
          <TrendingUp class="w-8 h-8 text-red-600 bg-red-50 p-1.5 rounded-xl border border-red-100" v-else-if="hazard.riskTrend === 'Increasing'" />
          <Minus class="w-8 h-8 text-slate-500 bg-slate-50 p-1.5 rounded-xl border border-slate-100" v-else />
          <div>
            <span class="block text-sm font-bold text-slate-800">{{ hazard.riskTrend }}</span>
            <span class="block text-[10px] text-slate-400 mt-0.5">Calculated by audit cycles</span>
          </div>
        </div>
        <span class="block text-[10px] text-slate-400 font-semibold mt-1">Audited regular checklist checks</span>
      </div>
    </div>

    <!-- Tabs Menu -->
    <div class="flex items-center gap-2 border-b border-slate-100 pb-px">
      <button
        @click="activeTab = 'overview'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'overview' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Hazard Overview
      </button>
      <button
        @click="activeTab = 'controls'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'controls' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Mitigation Controls ({{ hazard.controls?.length || 0 }})
      </button>
      <button
        @click="activeTab = 'actions'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'actions' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Actions ({{ hazardActions.length }})
      </button>
      <button
        @click="activeTab = 'attachments'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'attachments' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Attachments & Photos
      </button>
      <button
        @click="activeTab = 'history'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'history' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Changelog History
      </button>
    </div>

    <!-- TAB ACTIONS -->

    <!-- Tab 1: Overview -->
    <div v-if="activeTab === 'overview'" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle class="w-4 h-4 text-slate-400" /> Qualitative Analysis</h4>
          <div class="space-y-2 text-xs">
            <span class="block font-bold text-slate-500">WHO IS EXPOSED:</span>
            <p class="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{{ hazard.whoIsExposed || 'Operators, field engineers and site supervisors working in direct vicinity.' }}</p>
          </div>
          <div class="space-y-2 text-xs">
            <span class="block font-bold text-slate-500">POSSIBLE CONSEQUENCES:</span>
            <p class="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{{ hazard.consequence }}</p>
          </div>
        </div>

        <!-- Formula Math presentation -->
        <div class="space-y-3">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck class="w-4 h-4 text-slate-400" /> Finekin-Kinney Risk Formula</h4>
          
          <div class="border border-slate-100 p-4 rounded-xl space-y-3 bg-slate-50/50 text-xs">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="font-bold text-slate-600">Likelihood (L)</span>
              <span class="font-bold text-slate-800">{{ hazard.residualLikelihood }} / 10</span>
            </div>
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="font-bold text-slate-600">Exposure (E)</span>
              <span class="font-bold text-slate-800">{{ hazard.residualExposure }} / 10</span>
            </div>
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="font-bold text-slate-600">Severity (S)</span>
              <span class="font-bold text-slate-800">{{ hazard.residualSeverity }} / 100</span>
            </div>

            <div class="flex items-center justify-between pt-1 font-bold text-brand-600">
              <span>Residual Score (L x E x S)</span>
              <span>{{ hazard.residualRiskScore }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Controls inside Hazard Detail -->
    <div v-else-if="activeTab === 'controls'" class="space-y-4">
      <!-- Hierarchy selector filter buttons -->
      <div class="flex flex-wrap items-center gap-1.5 bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-xs font-bold">
        <span class="text-slate-400 uppercase tracking-wider mr-2">Hierarchy Filter:</span>
        <button
          v-for="cat in ['All', 'Elimination', 'Substitution', 'Engineering', 'Administrative', 'PPE']"
          :key="cat"
          @click="selectedHierarchyFilter = cat"
          class="px-3 py-1.5 rounded-lg border transition-all duration-150"
          :class="[
            selectedHierarchyFilter === cat
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-100'
          ]"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Table of controls -->
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-slate-50 pb-2">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Mitigation Controls Table</h4>
          <button
            @click="showAddControlForm = true"
            class="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            <PlusCircle class="w-4 h-4" />
            <span>Add Control Measure</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="text-slate-400 border-b border-slate-100 font-bold uppercase">
                <th class="py-2.5">Hierarchy</th>
                <th class="py-2.5">Description</th>
                <th class="py-2.5">Owner / Responsible</th>
                <th class="py-2.5 text-center">Effectiveness</th>
                <th class="py-2.5">Date Implemented</th>
                <th class="py-2.5">Status</th>
                <th class="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="c in filteredControls" :key="c.id" class="hover:bg-slate-50/50">
                <td class="py-3">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold border"
                    :class="[
                      c.type === 'Elimination' ? 'bg-red-50 text-red-700 border-red-100' : '',
                      c.type === 'Substitution' ? 'bg-orange-50 text-orange-700 border-orange-100' : '',
                      c.type === 'Engineering' ? 'bg-blue-50 text-blue-700 border-blue-100' : '',
                      c.type === 'Administrative' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : '',
                      c.type === 'PPE' ? 'bg-slate-100 text-slate-600 border-slate-200' : ''
                    ]"
                  >
                    {{ c.type }}
                  </span>
                </td>
                <td class="py-3 text-slate-700 max-w-xs leading-relaxed">{{ c.description }}</td>
                <td class="py-3 font-semibold text-slate-600">{{ c.responsible }}</td>
                <td class="py-3 text-center">
                  <span class="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold">{{ c.effectiveness }}%</span>
                </td>
                <td class="py-3 text-slate-400">{{ c.implementedDate }}</td>
                <td class="py-3 font-semibold text-success-600">{{ c.status }}</td>
                <td class="py-3 text-right">
                  <button @click="removeControl(c.id)" class="p-1 text-slate-400 hover:text-red-500 rounded" title="Delete Control">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
              <tr v-if="filteredControls.length === 0">
                <td colspan="7" class="text-center py-6 text-slate-400">No controls mapped to this hierarchy filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Control Inline Form Modal -->
      <div v-if="showAddControlForm" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col overflow-hidden animate-fade-in">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Add Mitigation Control</h4>
            <button @click="showAddControlForm = false" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>

          <div class="p-4 space-y-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Control Hierarchy Type *</label>
              <select
                v-model="newControl.type"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
              >
                <option value="Elimination">Elimination (Highest Effectiveness)</option>
                <option value="Substitution">Substitution</option>
                <option value="Engineering">Engineering</option>
                <option value="Administrative">Administrative</option>
                <option value="PPE">PPE (Lowest Effectiveness)</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Control Description *</label>
              <textarea
                v-model="newControl.description"
                rows="3"
                placeholder="Detail what measure will block, reduce, or isolate the hazard..."
                class="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Responsible Owner *</label>
                <input
                  v-model="newControl.responsible"
                  type="text"
                  placeholder="e.g. Markus Vance"
                  class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Effectiveness (%)</label>
                <input
                  v-model.number="newControl.effectiveness"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <button @click="showAddControlForm = false" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white text-xs font-bold transition-all">Cancel</button>
            <button @click="submitControl" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all">Apply Control</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Actions -->
    <div v-else-if="activeTab === 'actions'" class="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-50 pb-2">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Corrective Actions</h4>
        <button
          @click="showAddActionForm = true"
          class="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Spawn Action Task</span>
        </button>
      </div>

      <div class="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
              <th class="px-4 py-3">Action ID</th>
              <th class="px-4 py-3">Task Title</th>
              <th class="px-4 py-3">Assigned To</th>
              <th class="px-4 py-3">Priority</th>
              <th class="px-4 py-3">Due Date</th>
              <th class="px-4 py-3">Progress</th>
              <th class="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="act in hazardActions" :key="act.id" @click="openActionDetail(act)" class="hover:bg-slate-50 cursor-pointer transition-colors">
              <td class="px-4 py-3 font-bold text-slate-400">{{ act.actionId }}</td>
              <td class="px-4 py-3 font-semibold text-slate-700 truncate max-w-[200px]">{{ act.title }}</td>
              <td class="px-4 py-3 font-semibold text-slate-600">{{ act.assignedTo }}</td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-0.5 rounded text-[9px] font-bold"
                  :class="[
                    act.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : '',
                    act.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' : '',
                    act.priority === 'Low' ? 'bg-slate-50 text-slate-500 border border-slate-100' : ''
                  ]"
                >
                  {{ act.priority }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-500">{{ act.dueDate }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-16 bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div class="bg-brand-500 h-full rounded-full" :style="{ width: act.progress + '%' }"></div>
                  </div>
                  <span>{{ act.progress }}%</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  class="px-2.5 py-0.5 text-[9px] font-bold rounded-full"
                  :class="[
                    act.status === 'Completed' ? 'bg-success-50 text-success-700 border border-success-100' : '',
                    act.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' : '',
                    act.status === 'Open' ? 'bg-slate-50 text-slate-500 border border-slate-100' : '',
                    act.status === 'Overdue' ? 'bg-red-50 text-red-700 border border-red-100' : '',
                  ]"
                >
                  {{ act.status }}
                </span>
              </td>
            </tr>
            <tr v-if="hazardActions.length === 0">
              <td colspan="7" class="text-center py-6 text-slate-400">No actions defined for this hazard.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Action Inline Form Modal -->
      <div v-if="showAddActionForm" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col overflow-hidden animate-fade-in">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-sans">Spawn Action Task</h4>
            <button @click="showAddActionForm = false" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
          </div>

          <div class="p-4 space-y-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Action Title *</label>
              <input
                v-model="newAction.title"
                type="text"
                required
                placeholder="e.g. Conduct thickness check of scaffold planks"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Action Description</label>
              <textarea
                v-model="newAction.description"
                rows="3"
                placeholder="Brief safety action specifications..."
                class="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Assigned To *</label>
                <input
                  v-model="newAction.assignedTo"
                  type="text"
                  placeholder="e.g. Markus Vance"
                  class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Priority</label>
                <select
                  v-model="newAction.priority"
                  class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Due Date</label>
              <input
                v-model="newAction.dueDate"
                type="date"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <button @click="showAddActionForm = false" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white text-xs font-bold transition-all">Cancel</button>
            <button @click="submitAction" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all">Create Action</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 4: Attachments -->
    <div v-else-if="activeTab === 'attachments'" class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Hazard Files & Scene Photos</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="file in attachmentsList" :key="file.name" class="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between text-xs hover:shadow-sm transition-all">
          <div class="flex items-start gap-2.5">
            <FileText class="w-8 h-8 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span class="block font-semibold text-slate-700 truncate max-w-[120px]">{{ file.name }}</span>
              <span class="block text-[10px] text-slate-400 mt-0.5">{{ file.size }} | {{ file.type }}</span>
            </div>
          </div>
          <button @click="store.addToast(`File downloaded: ${file.name}`)" class="text-slate-400 hover:text-slate-600">
            <FileDown class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Tab 5: History -->
    <div v-else-if="activeTab === 'history'" class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit History Trail</h4>
      
      <div class="relative pl-6 border-l-2 border-slate-100 space-y-6 ml-3 text-xs">
        <div v-for="(log, idx) in historyLogs" :key="idx" class="relative">
          <span class="absolute -left-9 top-1 w-4 h-4 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
          </span>
          <div class="space-y-1">
            <span class="block text-[10px] font-bold text-slate-400">{{ log.date }}</span>
            <p class="text-slate-600 leading-relaxed font-semibold">{{ log.text }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Details Popup Modal -->
    <div v-if="selectedAction" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-xs">
      <!-- Modal Body -->
      <div class="w-full max-w-lg bg-white max-h-[90vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col p-6 overflow-y-auto animate-fade-in custom-scrollbar">
        <!-- Close & Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-400 font-mono text-xs">{{ selectedAction.actionId }}</span>
              <span class="text-slate-300">/</span>
              <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">{{ selectedAction.priority }} Priority</span>
            </div>
            <h3 class="text-base font-bold text-slate-800 mt-1 truncate max-w-xs">{{ selectedAction.title }}</h3>
          </div>
          <button @click="closeActionDetail" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Description -->
        <div class="space-y-4 flex-1 text-left">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
            <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">{{ selectedAction.description }}</p>
          </div>

          <!-- Quick parameters mapping -->
          <div class="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
            <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <User class="w-4 h-4 text-slate-400" />
              <div>
                <span class="block text-[9px] text-slate-400 leading-none">ASSIGNEE</span>
                <span class="block text-slate-700 mt-0.5">{{ selectedAction.assignedTo }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Calendar class="w-4 h-4 text-slate-400" />
              <div>
                <span class="block text-[9px] text-slate-400 leading-none">DUE DATE</span>
                <span class="block text-slate-700 mt-0.5">{{ selectedAction.dueDate }}</span>
              </div>
            </div>
          </div>

          <!-- Status & Progress Editors -->
          <div class="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Update Progress & Status</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status</label>
                <select
                  v-model="localStatus"
                  @change="applyStatusChange"
                  class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-700"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Progress ({{ localProgress }}%)</label>
                <input
                  v-model.number="localProgress"
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  @change="applyStatusChange"
                  class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500 mt-3"
                />
              </div>
            </div>
          </div>

          <!-- Comments Feed -->
          <div class="space-y-3 pt-2">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><MessageSquare class="w-4 h-4 text-slate-400" /> Comment Feed</h4>
            
            <div class="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
              <div
                v-for="(cmt, idx) in selectedAction.comments"
                :key="idx"
                class="text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1"
              >
                <div class="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>{{ cmt.author }}</span>
                  <span>{{ cmt.date }}</span>
                </div>
                <p class="text-slate-600 leading-relaxed">{{ cmt.text }}</p>
              </div>
              <div v-if="!selectedAction.comments || selectedAction.comments.length === 0" class="text-center text-[10px] text-slate-400 py-3">
                No updates or comments logged.
              </div>
            </div>

            <!-- Comment Input Box -->
            <div class="flex gap-2">
              <input
                v-model="newCommentText"
                type="text"
                placeholder="Log a comment/update..."
                @keyup.enter="submitComment"
                class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700 bg-white"
              />
              <button
                @click="submitComment"
                class="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0"
              >
                <Send class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Action Timeline logs -->
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><History class="w-4 h-4 text-slate-400" /> Action Resolution Timeline</h4>
            <div class="relative pl-4 border-l border-slate-100 space-y-3.5 ml-2 text-[10px]">
              <div v-for="(tNode, idx) in selectedAction.timeline" :key="idx" class="relative">
                <span class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white border border-slate-300 flex items-center justify-center">
                  <span class="w-1 h-1 rounded-full bg-slate-400"></span>
                </span>
                <span class="block text-slate-400">{{ tNode.date }}</span>
                <span class="block text-slate-600 font-semibold mt-0.5">{{ tNode.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-20 text-slate-400 bg-white border border-slate-100 rounded-2xl">
    Hazard record not found.
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
