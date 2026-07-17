<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel, calculateKinneyScore } from '../mockData';
import DataTable from '../components/DataTable.vue';
import {
  ShieldAlert,
  Eye,
  X,
  User,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Trash2,
  PlusCircle,
  FileDown,
  Info
} from 'lucide-vue-next';

// Define Table Columns
const columns = [
  { key: 'hazardId', label: 'Hazard ID', sortable: true },
  { key: 'name', label: 'Hazard Title', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'projectName', label: 'Project Site', sortable: true },
  { key: 'assessmentName', label: 'Assessment Ref', sortable: true },
  { key: 'likelihood', label: 'L', sortable: true, class: 'text-center' },
  { key: 'exposure', label: 'E', sortable: true, class: 'text-center' },
  { key: 'severity', label: 'S', sortable: true, class: 'text-center' },
  { key: 'initialRiskScore', label: 'Initial', sortable: true, class: 'text-center font-bold text-slate-400' },
  { key: 'residualRiskScore', label: 'Residual', sortable: true, class: 'text-center font-bold text-slate-700' },
  { key: 'openActionsCount', label: 'Actions', sortable: true, class: 'text-center' },
  { key: 'status', label: 'Status', sortable: true }
];

// Computed filters
const filters = computed(() => {
  const projects = Array.from(new Set(store.hazards.map(h => h.projectName)));
  return [
    { key: 'category', label: 'Category', options: ['Safety', 'Ergonomics', 'Chemical', 'Biological', 'Physical', 'Electrical', 'Psychosocial'] },
    { key: 'projectName', label: 'Project', options: projects },
    { key: 'status', label: 'Status', options: ['Open', 'Mitigated'] }
  ];
});

// Slide-over Detail Pane State
const selectedHazard = ref(null);

const openDetail = (haz) => {
  selectedHazard.value = haz;
};

const closeDetail = () => {
  selectedHazard.value = null;
};

// Computed actions for selected hazard
const hazardActions = computed(() => {
  if (!selectedHazard.value) return [];
  return store.actions.filter(act => act.hazardId === selectedHazard.value.id);
});

// Toggle Action status
const toggleAction = (act) => {
  const newStatus = act.status === 'Completed' ? 'Open' : 'Completed';
  const newProgress = newStatus === 'Completed' ? 100 : 0;
  store.updateActionStatus(act.id, newStatus, newProgress);
  // Reactive update
  if (selectedHazard.value) {
    const freshHaz = store.hazards.find(h => h.id === selectedHazard.value.id);
    selectedHazard.value = freshHaz;
  }
};

// Bulk Action options
const bulkActions = ['Export CSV Register', 'Mitigate Selected', 'Archive Selected'];

const handleBulkAction = (event) => {
  const { action, ids } = event;
  if (action === 'Mitigate Selected') {
    ids.forEach(id => {
      const haz = store.hazards.find(h => h.id === id);
      if (haz) {
        haz.status = 'Mitigated';
        haz.residualRiskScore = Math.min(haz.residualRiskScore, 40); // reduce risk to safer level
      }
    });
    store.addToast(`Mitigated ${ids.length} selected hazards.`, 'success');
  } else if (action === 'Archive Selected') {
    store.hazards = store.hazards.filter(h => !ids.includes(h.id));
    store.addToast(`Archived ${ids.length} selected hazards.`, 'success');
  } else {
    store.addToast(`Bulk action "${action}" completed for ${ids.length} hazards.`);
  }
};

// Add mock control to selected hazard
const newControlDesc = ref('');
const newControlHierarchy = ref('PPE');

const submitControl = () => {
  if (!newControlDesc.value.trim()) return;
  store.addControlToHazard(selectedHazard.value.id, {
    type: newControlHierarchy.value,
    description: newControlDesc.value,
    responsible: 'HSE Auditor',
    effectiveness: 60,
    status: 'Implemented'
  });
  // Refresh detail ref
  selectedHazard.value = store.hazards.find(h => h.id === selectedHazard.value.id);
  newControlDesc.value = '';
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">Hazard Register</h1>
      <p class="text-xs text-slate-500 mt-1">HSE portfolio registry of identified workspace hazards, Kinney risk score coordinates, and applied control actions.</p>
    </div>

    <!-- Data Table Card -->
    <div class="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
      <DataTable
        :columns="columns"
        :items="store.hazards"
        :filters="filters"
        :bulkActions="bulkActions"
        @bulk-action="handleBulkAction"
        row-clickable
        @row-click="item => store.navigateTo('hazards', { hazardId: item.id })"
        searchPlaceholder="Search hazards by title, category, project, assessor, location..."
      >
        <!-- Custom Cells -->
        <template #cell-hazardId="{ value }">
          <span class="font-bold text-slate-400 font-mono text-xs">{{ value }}</span>
        </template>

        <template #cell-name="{ item }">
          <button
            @click.stop="store.navigateTo('hazards', { hazardId: item.id })"
            class="font-semibold text-brand-600 hover:text-brand-800 hover:underline text-left block max-w-[220px] truncate"
          >
            {{ item.name }}
          </button>
        </template>

        <template #cell-projectName="{ item }">
          <span class="text-slate-600 font-semibold truncate block max-w-[130px]">{{ item.projectName }}</span>
        </template>

        <template #cell-assessmentName="{ item }">
          <span class="text-slate-400 truncate block max-w-[130px]">{{ item.assessmentName }}</span>
        </template>

        <template #cell-residualRiskScore="{ value }">
          <div class="flex items-center justify-center gap-1.5" v-if="value > 0">
            <span class="font-bold text-slate-800 text-xs">{{ value }}</span>
            <span class="w-1.5 h-1.5 rounded-full" :class="getKinneyRiskLevel(value).color.split(' ')[0]"></span>
          </div>
          <span v-else class="text-slate-400 font-medium text-xs">-</span>
        </template>

        <template #cell-openActionsCount="{ value }">
          <span
            class="px-2 py-0.5 rounded-full font-bold text-xs"
            :class="value > 0 ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-slate-50 text-slate-400'"
          >
            {{ value }}
          </span>
        </template>

        <template #cell-status="{ value }">
          <span
            class="px-2 py-0.5 text-[10px] font-bold rounded-full border"
            :class="[
              value === 'Mitigated' ? 'bg-success-50 text-success-700 border-success-100' : 'bg-red-50 text-red-700 border-red-100'
            ]"
          >
            {{ value }}
          </span>
        </template>
      </DataTable>
    </div>

    <!-- Slide-over Drawer for Hazard inspection -->
    <div v-if="selectedHazard" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
      <div class="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-in">
        <!-- Close & Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-5 shrink-0">
          <div>
            <div class="flex items-center gap-2 text-xs">
              <span class="font-bold text-slate-400 font-mono">{{ selectedHazard.hazardId }}</span>
              <span class="text-slate-300">/</span>
              <span class="px-2 py-0.5 bg-brand-50 text-brand-600 rounded text-[9px] font-bold uppercase tracking-wider">{{ selectedHazard.category }}</span>
            </div>
            <h3 class="text-base font-extrabold text-slate-800 mt-1 truncate max-w-xs">{{ selectedHazard.name }}</h3>
          </div>
          <button @click="closeDetail" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Contents -->
        <div class="space-y-5 flex-1">
          <!-- Consequences -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consequences & Consequences</label>
            <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-semibold">
              {{ selectedHazard.consequence }}
            </p>
          </div>

          <!-- Risk scores Kinney -->
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span class="block text-[9px] font-bold text-slate-400 uppercase">Initial Kinney Risk</span>
              <span class="block text-lg font-black text-slate-400 mt-1">{{ selectedHazard.initialRiskScore }}</span>
              <span class="block text-[8px] text-slate-400 font-semibold mt-0.5">Coords: L:{{ selectedHazard.likelihood }} x E:{{ selectedHazard.exposure }} x S:{{ selectedHazard.severity }}</span>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 border-l-4 border-l-brand-500">
              <span class="block text-[9px] font-bold text-slate-400 uppercase">Residual Kinney Risk</span>
              <div class="flex items-center justify-between mt-1">
                <span class="text-lg font-black text-slate-800">{{ selectedHazard.residualRiskScore }}</span>
                <span class="px-2 py-0.5 text-[8px] font-bold rounded-full" :class="getKinneyRiskLevel(selectedHazard.residualRiskScore).color">
                  {{ getKinneyRiskLevel(selectedHazard.residualRiskScore).name }}
                </span>
              </div>
              <span class="block text-[8px] text-slate-500 font-bold mt-0.5">Coords: L:{{ selectedHazard.residualLikelihood }} x E:{{ selectedHazard.residualExposure }} x S:{{ selectedHazard.residualSeverity }}</span>
            </div>
          </div>

          <!-- Controls Table -->
          <div class="space-y-2">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-50 pb-1.5">
              <span>Applied Mitigation Controls ({{ selectedHazard.controls?.length || 0 }})</span>
            </h4>
            <div class="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
              <div
                v-for="c in selectedHazard.controls"
                :key="c.id"
                class="text-[10px] p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-start justify-between gap-2"
              >
                <div class="min-w-0">
                  <span class="px-1.5 py-0.5 text-[8px] font-bold rounded bg-slate-200 text-slate-600 mr-1.5 align-middle border border-slate-300">
                    {{ c.type }}
                  </span>
                  <span class="text-slate-600 font-semibold leading-relaxed">{{ c.description }}</span>
                </div>
                <span class="text-success-600 shrink-0 font-bold">Safe</span>
              </div>
              <div v-if="selectedHazard.controls?.length === 0" class="text-center text-[10px] text-slate-400 py-2">
                No controls implemented yet.
              </div>
            </div>

            <!-- Add Control Form -->
            <div class="flex gap-2 pt-1.5">
              <select
                v-model="newControlHierarchy"
                class="border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold bg-white text-slate-700"
              >
                <option value="PPE">PPE</option>
                <option value="Administrative">Admin</option>
                <option value="Engineering">Engineering</option>
                <option value="Substitution">Subst</option>
              </select>
              <input
                v-model="newControlDesc"
                type="text"
                placeholder="Describe new control..."
                class="flex-1 border border-slate-200 rounded-lg px-3 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-brand-500"
                @keyup.enter="submitControl"
              />
              <button @click="submitControl" class="bg-brand-500 hover:bg-brand-600 text-white font-bold px-3 py-1 rounded-lg text-[10px] transition-colors shrink-0">
                Apply
              </button>
            </div>
          </div>

          <!-- Actions Checklist -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Corrective Action Plan ({{ hazardActions.length }})</span>
            </h4>
            <div class="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              <div
                v-for="act in hazardActions"
                :key="act.id"
                @click="toggleAction(act)"
                class="p-2 border border-slate-100 rounded-xl flex items-start gap-2.5 cursor-pointer transition-colors"
                :class="act.status === 'Completed' ? 'bg-success-50/50 hover:bg-success-100/30' : 'bg-slate-50 hover:bg-slate-100'"
              >
                <input
                  type="checkbox"
                  :checked="act.status === 'Completed'"
                  class="w-3.5 h-3.5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer mt-0.5"
                  @click.stop="toggleAction(act)"
                />
                <div class="min-w-0">
                  <span class="block font-bold text-[11px]" :class="act.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-700'">
                    {{ act.title }}
                  </span>
                  <span class="block text-[8px] text-slate-400 mt-0.5">Due Date: {{ act.dueDate }} | Assignee: {{ act.assignedTo }}</span>
                </div>
              </div>
              <div v-if="hazardActions.length === 0" class="text-center text-[10px] text-slate-400 py-3">
                No corrective action items mapped.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
