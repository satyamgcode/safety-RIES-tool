<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel, calculateKinneyScore } from '../mockData';
import LmraModal from '../components/LmraModal.vue';
import {
  ArrowLeft,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  Play,
  ClipboardList,
  AlertTriangle,
  History,
  FileCheck2,
  Info,
  Layers,
  ChevronDown
} from 'lucide-vue-next';

// Find current TRA based on routing parameters
const traId = computed(() => parseInt(store.currentParams.traId || store.selectedTraId, 10));
const tra = computed(() => store.tras.find(t => t.id === traId.value));

// Back to list
const handleBack = () => {
  store.navigateTo('tra-dashboard');
};

// --- DRAFT MODE STATE ---
const newStepName = ref('');
const selectedStepId = ref(null);
const activeHazardMode = ref('pull'); // 'pull' or 'manual'

// Selected RI&E hazard to pull in
const selectedRieHazardId = ref('');

// Manual hazard form state
const manualHazardName = ref('');
const manualHazardCategory = ref(''); // Bound to "Category - location" text input
const manualHazardLikelihood = ref('3');
const manualHazardExposure = ref('6');
const manualHazardSeverity = ref('7');
const manualHazardResidualLikelihood = ref('1');
const manualHazardResidualExposure = ref('3');
const manualHazardResidualSeverity = ref('7');
const manualHazardControls = ref('');

// Auditor name for sign-off
const showApproveDialog = ref(false);
const auditorName = ref('Toets Veiligheidskunde BV');

// --- LMRA STATE ---
const isLmraModalOpen = ref(false);

// Filter LMRAs for this TRA
const traLmras = computed(() => {
  return store.lmras
    .filter(l => l.traId === traId.value)
    .sort((a, b) => b.when.localeCompare(a.when));
});

// Highest residual risk for the TRA
const highestResidualRisk = computed(() => {
  if (!tra.value) return 0;
  let highest = 0;
  tra.value.steps.forEach(s => {
    s.hazards.forEach(h => {
      if (h.residualRiskScore > highest) {
        highest = h.residualRiskScore;
      }
    });
  });
  return highest;
});

// Available hazards from source RI&E (or project fallback) to pull from
const sourceRieHazards = computed(() => {
  if (!tra.value) return [];
  if (tra.value.sourceRieId) {
    return store.hazards.filter(h => h.assessmentId === tra.value.sourceRieId);
  }
  return store.hazards.filter(h => h.projectId === tra.value.projectId);
});

// --- METHODS ---

// Add a new step
const addStep = () => {
  if (!newStepName.value.trim()) {
    store.addToast('Please enter a step name.', 'error');
    return;
  }
  store.addStepToTra(traId.value, newStepName.value);
  
  // Set as selected step if none selected
  if (!selectedStepId.value && tra.value.steps.length > 0) {
    selectedStepId.value = tra.value.steps[tra.value.steps.length - 1].id;
  }
  newStepName.value = '';
};

// Remove a step
const deleteStep = (stepId) => {
  if (confirm('Are you sure you want to delete this step and all its hazards?')) {
    store.deleteStepFromTra(traId.value, stepId);
    if (selectedStepId.value === stepId) {
      selectedStepId.value = tra.value.steps.length > 0 ? tra.value.steps[0].id : null;
    }
  }
};

// Pull hazard from RI&E
const pullRieHazard = () => {
  if (!selectedStepId.value) {
    store.addToast('Please create and select a task step first.', 'error');
    return;
  }
  if (!selectedRieHazardId.value) {
    store.addToast('Please select a hazard to pull.', 'error');
    return;
  }

  const sourceHaz = store.hazards.find(h => h.id === parseInt(selectedRieHazardId.value, 10));
  if (!sourceHaz) return;

  // Add to step
  store.addHazardToTraStep(traId.value, selectedStepId.value, {
    name: sourceHaz.name,
    category: sourceHaz.category,
    consequence: sourceHaz.consequence,
    sourceHazardId: sourceHaz.id,
    likelihood: sourceHaz.likelihood,
    exposure: sourceHaz.exposure,
    severity: sourceHaz.severity,
    residualLikelihood: sourceHaz.residualLikelihood,
    residualExposure: sourceHaz.residualExposure,
    controls: sourceHaz.controls // Pull the controls array from RI&E
  });

  selectedRieHazardId.value = '';
};

// Add manual custom hazard
const addManualHazard = () => {
  if (!selectedStepId.value) {
    store.addToast('Please create and select a task step first.', 'error');
    return;
  }
  if (!manualHazardName.value.trim()) {
    store.addToast('Please enter a hazard name.', 'error');
    return;
  }

  const categoryLocation = manualHazardCategory.value || 'General';
  const parts = categoryLocation.split(' - ');
  const category = parts[0] || 'Safety';
  const consequence = parts[1] || 'Manual Entry';

  store.addHazardToTraStep(traId.value, selectedStepId.value, {
    name: manualHazardName.value,
    category: category,
    consequence: consequence,
    sourceHazardId: null,
    likelihood: manualHazardLikelihood.value,
    exposure: manualHazardExposure.value,
    severity: manualHazardSeverity.value,
    residualLikelihood: manualHazardResidualLikelihood.value,
    residualExposure: manualHazardResidualExposure.value,
    residualSeverity: manualHazardResidualSeverity.value,
    controlMeasures: manualHazardControls.value || 'Standard safety watch'
  });

  // Reset form
  manualHazardName.value = '';
  manualHazardCategory.value = '';
  manualHazardControls.value = '';
};

// Delete hazard from step
const deleteHazard = (stepId, hazardId) => {
  store.deleteHazardFromTraStep(traId.value, stepId, hazardId);
};

// Approve TRA
const triggerApprove = () => {
  const totalHazards = tra.value.steps.reduce((sum, s) => sum + s.hazards.length, 0);
  if (totalHazards === 0) {
    store.addToast('You cannot approve a TRA with 0 hazards. Add at least one hazard.', 'error');
    return;
  }
  showApproveDialog.value = true;
};

const confirmApprove = () => {
  store.approveTra(traId.value, auditorName.value);
  showApproveDialog.value = false;
};

// Expand control drawer for a hazard
const expandedHazardId = ref(null);
const toggleHazardExpand = (hazId) => {
  expandedHazardId.value = expandedHazardId.value === hazId ? null : hazId;
};

// Form state for adding controls
const newControlType = ref('Engineering');
const newControlDescription = ref('');

const handleAddControl = (stepId, hazId) => {
  if (!newControlDescription.value.trim()) {
    store.addToast('Please enter control description.', 'error');
    return;
  }
  store.addControlToTraHazard(traId.value, stepId, hazId, {
    type: newControlType.value,
    description: newControlDescription.value
  });
  newControlDescription.value = '';
};

const handleDeleteControl = (stepId, hazId, ctrlId) => {
  store.deleteControlFromTraHazard(traId.value, stepId, hazId, ctrlId);
};

// Form state for adding TRA hazard actions
const newActionTitle = ref('');
const newActionAssignee = ref('');
const newActionPriority = ref('Medium');
const newActionDueDate = ref(new Date().toISOString().split('T')[0]);

const getHazardActions = (hazId) => {
  return store.actions.filter(a => a.traId === traId.value && a.hazardId === hazId);
};

const handleAddAction = (stepId, hazId) => {
  if (!newActionTitle.value.trim() || !newActionAssignee.value.trim()) {
    store.addToast('Please enter action title and assignee.', 'error');
    return;
  }
  store.addActionToTraHazard(traId.value, stepId, hazId, {
    title: newActionTitle.value,
    assignedTo: newActionAssignee.value,
    priority: newActionPriority.value,
    dueDate: newActionDueDate.value
  });
  newActionTitle.value = '';
  newActionAssignee.value = '';
  newActionPriority.value = 'Medium';
  newActionDueDate.value = new Date().toISOString().split('T')[0];
};

const handleDeleteAction = (actionId) => {
  if (confirm('Are you sure you want to delete this action?')) {
    store.deleteActionFromTraHazard(actionId);
  }
};

const expandedApprovedHazardId = ref(null);
const toggleApprovedHazardExpand = (hazId) => {
  expandedApprovedHazardId.value = expandedApprovedHazardId.value === hazId ? null : hazId;
};
</script>

<template>
  <div class="space-y-6 pb-16 font-sans" v-if="tra">
    <!-- Header Block -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
      <div class="flex items-center gap-3">
        <button
          @click="handleBack"
          class="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">{{ tra.title }}</h1>
          <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span class="font-bold text-slate-600">TRA</span> • 
            <span>Project: {{ tra.projectName }}</span> • 
            <span>Area: {{ tra.location }}</span>
          </p>
        </div>
      </div>

      <!-- Action Status Badge / Sign Off -->
      <div class="flex items-center gap-3 self-start md:self-auto">
        <span
          class="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5"
          :class="[
            tra.status === 'Approved' ? 'bg-success-50 text-success-700 border-success-200' : 'bg-slate-100 text-slate-500 border-slate-200'
          ]"
        >
          <span class="w-2 h-2 rounded-full" :class="tra.status === 'Approved' ? 'bg-success-500' : 'bg-slate-400'"></span>
          {{ tra.status === 'Approved' ? 'Approved & Valid' : 'Draft Mode' }}
        </span>

        <button
          v-if="tra.status === 'Draft'"
          @click="triggerApprove"
          class="bg-success-600 hover:bg-success-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-success-500/10 flex items-center gap-1.5 transition-all"
        >
          <FileCheck2 class="w-4 h-4" />
          <span>Approve TRA</span>
        </button>
      </div>
    </div>

    <!-- Metadata Grid cards -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div>
        <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Task Title</span>
        <span class="block text-xs font-semibold text-slate-700 truncate mt-0.5" :title="tra.title">{{ tra.title }}</span>
      </div>
      <div>
        <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assessor</span>
        <span class="block text-xs font-semibold text-slate-700 mt-0.5">{{ tra.assessor }}</span>
      </div>
      <div>
        <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved By</span>
        <span class="block text-xs font-semibold text-slate-700 mt-0.5">{{ tra.approvedBy || '— Pending —' }}</span>
      </div>
      <div>
        <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valid Until</span>
        <span class="block text-xs font-bold text-slate-700 mt-0.5" :class="tra.validUntil ? 'text-success-700' : 'text-slate-400'">{{ tra.validUntil || '—' }}</span>
      </div>
      <div>
        <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Highest Residual Risk</span>
        <span class="block text-xs font-extrabold mt-0.5" :class="[
          highestResidualRisk >= 150 ? 'text-red-600' : (highestResidualRisk >= 70 ? 'text-warning-600' : 'text-success-600')
        ]">{{ highestResidualRisk || '—' }}</span>
      </div>
    </div>

    <!-- Dialog for approval sign off -->
    <div v-if="showApproveDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full space-y-4">
        <div>
          <h3 class="font-extrabold text-slate-800 text-sm tracking-tight">Approve Task Risk Analysis</h3>
          <p class="text-xs text-slate-500 mt-0.5">Please sign off on the audit steps. This freezes the TRA and generates its safety valid stamp.</p>
        </div>
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auditor / Safety Inspector Name</label>
          <input
            v-model="auditorName"
            type="text"
            class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            @click="showApproveDialog = false"
            class="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-xs border border-slate-200"
          >
            Cancel
          </button>
          <button
            @click="confirmApprove"
            class="bg-success-600 hover:bg-success-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
          >
            Approve & Sign Off
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN INTERACTIVE SECTION -->

    <!-- DRAFT MODE VIEW (Image 3) -->
    <div v-if="tra.status === 'Draft'" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Steps panel -->
      <div class="lg:col-span-2 space-y-5">
        <!-- Loop steps -->
        <div 
          v-for="(step, idx) in tra.steps"
          :key="step.id"
          class="bg-white border rounded-2xl shadow-sm border-slate-100 overflow-hidden"
          :class="[selectedStepId === step.id ? 'ring-2 ring-brand-500/20 border-brand-300' : '']"
          @click="selectedStepId = step.id"
        >
          <!-- Step Header -->
          <div class="px-5 py-3.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between cursor-pointer">
            <h3 class="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-brand-500 text-white font-extrabold text-[10px] flex items-center justify-center">{{ idx + 1 }}</span>
              <span>{{ step.name }}</span>
            </h3>
            <button
              @click.stop="deleteStep(step.id)"
              class="p-1 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-lg transition-all"
              title="Delete Step"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Hazards in Step -->
          <div class="p-5 space-y-3">
            <div v-if="step.hazards.length === 0" class="text-slate-400 text-xs italic py-2">
              No hazards in this step yet. Use control form below to pull or add.
            </div>
            
            <div
              v-for="haz in step.hazards"
              :key="haz.id"
              class="flex flex-col gap-3.5 p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all cursor-pointer"
              @click.stop="toggleHazardExpand(haz.id)"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1.5 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-slate-800 text-xs">{{ haz.name }}</span>
                    <span class="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[9px] font-bold uppercase">{{ haz.category }}</span>
                    <span class="px-1.5 py-0.5 bg-brand-50 text-brand-600 border border-brand-100 rounded text-[9px] font-bold" v-if="haz.sourceHazardId">RI&E Source</span>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed"><span class="font-semibold text-slate-700">Consequence:</span> {{ haz.consequence || 'N/A' }}</p>
                  <p class="text-[11px] text-brand-700 leading-relaxed font-semibold">
                    <span class="font-semibold text-slate-700">Controls:</span> 
                    {{ haz.controls && haz.controls.length > 0 ? haz.controls.map(c => c.description).join(' + ') : 'No controls applied yet. Click to expand and apply.' }}
                  </p>
                </div>

                <!-- Kinney details and Delete button -->
                <div class="flex items-center gap-4 shrink-0">
                  <div class="text-right space-y-0.5">
                    <span class="block text-[9px] font-bold text-slate-400 uppercase">Kinney</span>
                    <span 
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-success-50 text-success-700 border border-success-100"
                      :class="[
                        haz.residualRiskScore >= 150 ? 'bg-red-50 text-red-700 border-red-100' : (haz.residualRiskScore >= 70 ? 'bg-warning-50 text-warning-700 border-warning-100' : '')
                      ]"
                    >
                      {{ haz.residualRiskScore }}
                    </span>
                  </div>
                  <button
                    @click.stop="deleteHazard(step.id, haz.id)"
                    class="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Expanded controls drawer -->
              <div 
                v-if="expandedHazardId === haz.id" 
                class="pt-3 border-t border-slate-100 space-y-4"
                @click.stop
              >
                <!-- Kinney parameters comparison -->
                <div class="grid grid-cols-2 gap-4 bg-white p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span class="block text-[9px] font-bold text-slate-400 uppercase">Initial Risk (W:{{ haz.likelihood }}×B:{{ haz.exposure }}×E:{{ haz.severity }})</span>
                    <span class="text-sm font-extrabold text-slate-700">{{ haz.initialRiskScore }}</span>
                  </div>
                  <div>
                    <span class="block text-[9px] font-bold text-slate-400 uppercase">Residual Risk (W:{{ haz.residualLikelihood }}×B:{{ haz.residualExposure }}×E:{{ haz.residualSeverity }})</span>
                    <span class="text-sm font-extrabold" :class="[
                      haz.residualRiskScore >= 150 ? 'text-red-600' : (haz.residualRiskScore >= 70 ? 'text-warning-600' : 'text-success-600')
                    ]">{{ haz.residualRiskScore }}</span>
                  </div>
                </div>

                <!-- List of applied controls -->
                <div class="space-y-2">
                  <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Applied Controls & Mitigations</span>
                  <div class="space-y-1.5" v-if="haz.controls && haz.controls.length > 0">
                    <div 
                      v-for="ctrl in haz.controls" 
                      :key="ctrl.id" 
                      class="flex items-center justify-between gap-3 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                    >
                      <div class="flex items-center gap-2">
                        <span class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0" :class="[
                          ctrl.type === 'Elimination' || ctrl.type === 'Substitution' ? 'bg-red-50 text-red-700' : '',
                          ctrl.type === 'Engineering' ? 'bg-brand-50 text-brand-700' : '',
                          ctrl.type === 'Administrative' ? 'bg-amber-50 text-amber-700' : '',
                          ctrl.type === 'PPE' ? 'bg-success-50 text-success-700' : ''
                        ]">{{ ctrl.type }}</span>
                        <span class="text-slate-600 font-medium">{{ ctrl.description }}</span>
                      </div>
                      <button
                        @click.stop="handleDeleteControl(step.id, haz.id, ctrl.id)"
                        class="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors shrink-0"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div class="text-[10px] text-slate-400 italic py-1" v-else>
                    No controls applied yet. Use the tool below to mitigate this risk.
                  </div>
                </div>

                <!-- Add new control form -->
                <div class="flex items-end gap-2 pt-1">
                  <div class="w-32 shrink-0">
                    <span class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Type</span>
                    <select
                      v-model="newControlType"
                      class="w-full p-2 border border-slate-200 rounded-xl text-[10px] bg-slate-50 focus:outline-none bg-white"
                    >
                      <option value="Elimination">Elimination</option>
                      <option value="Substitution">Substitution</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Administrative">Admin</option>
                      <option value="PPE">PPE</option>
                    </select>
                  </div>
                  <div class="flex-1">
                    <span class="block text-[9px] font-bold text-slate-400 uppercase mb-1">Control Description</span>
                    <input
                      v-model="newControlDescription"
                      type="text"
                      placeholder="e.g. Install double guardrails"
                      class="w-full p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    @click.stop="handleAddControl(step.id, haz.id)"
                    class="bg-brand-50 hover:bg-brand-100 border border-brand-100 text-brand-600 font-bold px-3 py-2 rounded-xl text-xs transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </div>

                <!-- Action Tracking Section -->
                <div class="border-t border-slate-100 pt-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Corrective Action Items</span>
                    <span class="text-[9px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{{ getHazardActions(haz.id).length }} active</span>
                  </div>

                  <!-- Actions List -->
                  <div class="space-y-2" v-if="getHazardActions(haz.id).length > 0">
                    <div 
                      v-for="act in getHazardActions(haz.id)" 
                      :key="act.id" 
                      class="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-2 hover:bg-slate-100/50 transition-colors"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="space-y-0.5">
                          <span class="font-bold text-slate-800 leading-snug">{{ act.title }}</span>
                          <p class="text-[10px] text-slate-400 font-medium">Assigned to: <span class="text-slate-600 font-semibold">{{ act.assignedTo }}</span> • Due: <span class="text-slate-600 font-semibold">{{ act.dueDate }}</span></p>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                          <span class="px-1.5 py-0.5 bg-brand-50 text-brand-700 text-[8px] font-extrabold uppercase rounded border border-brand-100">{{ act.status }}</span>
                          <button
                            @click.stop="handleDeleteAction(act.id)"
                            class="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="text-[10px] text-slate-400 italic py-1" v-else>
                    No actions assigned to this hazard yet.
                  </div>

                  <!-- Spawn new action form -->
                  <div class="bg-slate-50/50 p-3 rounded-xl border border-slate-100/70 space-y-3">
                    <span class="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">Assign Safety Corrective Action</span>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div class="space-y-1">
                        <span class="block text-[8px] font-bold text-slate-400 uppercase">Task Title</span>
                        <input
                          v-model="newActionTitle"
                          type="text"
                          placeholder="e.g. Set up rescue harness lines"
                          class="w-full p-2 border border-slate-200 rounded-xl text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                      <div class="space-y-1">
                        <span class="block text-[8px] font-bold text-slate-400 uppercase">Assigned Crew Member</span>
                        <input
                          v-model="newActionAssignee"
                          type="text"
                          placeholder="e.g. John Doe"
                          class="w-full p-2 border border-slate-200 rounded-xl text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <div class="flex items-end gap-3 flex-wrap">
                      <div class="flex-1 space-y-1 min-w-[100px]">
                        <span class="block text-[8px] font-bold text-slate-400 uppercase">Due Date</span>
                        <input
                          v-model="newActionDueDate"
                          type="date"
                          class="w-full p-2 border border-slate-200 rounded-xl text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                      <div class="w-24 space-y-1">
                        <span class="block text-[8px] font-bold text-slate-400 uppercase">Priority</span>
                        <select
                          v-model="newActionPriority"
                          class="w-full p-2 border border-slate-200 rounded-xl text-[11px] bg-white focus:outline-none"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        @click.stop="handleAddAction(step.id, haz.id)"
                        class="bg-[#f97316] hover:bg-orange-650 text-white font-extrabold px-4 py-2 rounded-xl text-[11px] transition-colors shrink-0 h-[33px]"
                      >
                        Assign Action
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Add Step Input box -->
        <div class="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 mb-5">
          <input
            v-model="newStepName"
            type="text"
            placeholder="Add a task step..."
            class="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            @keyup.enter="addStep"
          />
          <button
            @click="addStep"
            class="bg-brand-50 hover:bg-brand-100 border border-brand-100 text-brand-600 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>Add step</span>
          </button>
        </div>

        <!-- Add Hazard to Step Controller Box (Horizontal style matching mockup) -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
          <!-- Step selection and tabs header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-2 flex-wrap">
              <label class="text-xs font-bold text-slate-700 tracking-tight block">Add hazard to step</label>
              <select
                v-model="selectedStepId"
                class="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-700 shadow-sm"
              >
                <option :value="null" disabled>— Select a Step —</option>
                <option v-for="(step, idx) in tra.steps" :key="step.id" :value="step.id">
                  {{ idx + 1 }}. {{ step.name }}
                </option>
              </select>
            </div>

            <!-- Tab Buttons styled as pill selector -->
            <div class="flex items-center gap-1.5 bg-slate-100/75 p-1 rounded-xl w-fit">
              <button
                type="button"
                @click="activeHazardMode = 'pull'"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                :class="activeHazardMode === 'pull' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
              >
                Pull from RI&E
              </button>
              <button
                type="button"
                @click="activeHazardMode = 'manual'"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                :class="activeHazardMode === 'manual' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
              >
                Add manually
              </button>
            </div>
          </div>

          <!-- Tab Content area -->
          <div>
            <!-- PULL FROM RIE FORM -->
            <div v-if="activeHazardMode === 'pull'" class="flex items-center gap-3">
              <div class="flex-1">
                <select
                  v-model="selectedRieHazardId"
                  class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                >
                  <option value="" disabled>Select an RI&E hazard...</option>
                  <option v-for="haz in sourceRieHazards" :key="haz.id" :value="haz.id">
                    [{{ haz.category }}] {{ haz.name }} (Kinney Score: {{ haz.residualRiskScore }})
                  </option>
                </select>
              </div>
              <button
                type="button"
                @click="pullRieHazard"
                class="bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1 transition-all shrink-0 h-[38px]"
              >
                <Plus class="w-4 h-4" />
                <span>Pull in</span>
              </button>
            </div>

            <!-- ADD MANUALLY FORM (Matching Image mockup layout) -->
            <div v-else class="space-y-4 text-xs">
              <!-- Row 1: Hazard name & Category - location -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  v-model="manualHazardName"
                  type="text"
                  placeholder="Hazard name"
                  class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <input
                  v-model="manualHazardCategory"
                  type="text"
                  placeholder="Category - location"
                  class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <!-- Row 2: INITIAL WxBxE dropdowns & RESIDUAL WxBxE dropdowns -->
              <div class="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 justify-between">
                <!-- Initial Kinney dropdowns -->
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-slate-400 uppercase tracking-wide text-[10px] w-14">INITIAL</span>
                  <!-- W selector -->
                  <select
                    v-model="manualHazardLikelihood"
                    class="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none bg-white text-slate-700"
                  >
                    <option value="10">10</option>
                    <option value="6">6</option>
                    <option value="3">3</option>
                    <option value="1">1</option>
                    <option value="0.5">0.5</option>
                    <option value="0.1">0.1</option>
                  </select>
                  <span class="text-slate-400 font-bold">×</span>
                  <!-- B selector -->
                  <select
                    v-model="manualHazardExposure"
                    class="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none bg-white text-slate-700"
                  >
                    <option value="10">10</option>
                    <option value="6">6</option>
                    <option value="3">3</option>
                    <option value="2">2</option>
                    <option value="1">1</option>
                    <option value="0.5">0.5</option>
                  </select>
                  <span class="text-slate-400 font-bold">×</span>
                  <!-- E selector -->
                  <select
                    v-model="manualHazardSeverity"
                    class="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none bg-white text-slate-700"
                  >
                    <option value="100">100</option>
                    <option value="40">40</option>
                    <option value="15">15</option>
                    <option value="7">7</option>
                    <option value="3">3</option>
                    <option value="1">1</option>
                  </select>
                </div>

                <!-- Residual Kinney dropdowns -->
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-slate-400 uppercase tracking-wide text-[10px] w-14 md:w-auto">RESIDUAL</span>
                  <!-- W selector -->
                  <select
                    v-model="manualHazardResidualLikelihood"
                    class="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none bg-white text-slate-700"
                  >
                    <option value="10">10</option>
                    <option value="6">6</option>
                    <option value="3">3</option>
                    <option value="1">1</option>
                    <option value="0.5">0.5</option>
                    <option value="0.1">0.1</option>
                  </select>
                  <span class="text-slate-400 font-bold">×</span>
                  <!-- B selector -->
                  <select
                    v-model="manualHazardResidualExposure"
                    class="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none bg-white text-slate-700"
                  >
                    <option value="10">10</option>
                    <option value="6">6</option>
                    <option value="3">3</option>
                    <option value="2">2</option>
                    <option value="1">1</option>
                    <option value="0.5">0.5</option>
                  </select>
                  <span class="text-slate-400 font-bold">×</span>
                  <!-- E selector -->
                  <select
                    v-model="manualHazardResidualSeverity"
                    class="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none bg-white text-slate-700"
                  >
                    <option value="100">100</option>
                    <option value="40">40</option>
                    <option value="15">15</option>
                    <option value="7">7</option>
                    <option value="3">3</option>
                    <option value="1">1</option>
                  </select>
                </div>
              </div>

              <!-- Row 3: Control measures & Add button -->
              <div class="flex items-center gap-3">
                <input
                  v-model="manualHazardControls"
                  type="text"
                  placeholder="Control measures"
                  class="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  @keyup.enter="addManualHazard"
                />
                <button
                  type="button"
                  @click="addManualHazard"
                  class="bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-brand-500/10 flex items-center justify-center gap-1 transition-all shrink-0 h-[38px] w-24"
                >
                  <Plus class="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Sidebar (LMRA History & Actions - Disabled in Draft Mode) -->
      <div class="space-y-6">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
              <History class="w-4.5 h-4.5 text-slate-500" />
              <span>LMRA history</span>
            </h3>
            <span class="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-extrabold flex items-center justify-center">
              0
            </span>
          </div>

          <!-- Disabled orange button -->
          <button
            disabled
            class="w-full bg-[#f97316] text-white font-extrabold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
          >
            <AlertTriangle class="w-4.5 h-4.5 fill-white/10" />
            <span>Perform LMRA</span>
          </button>

          <p class="text-[10px] text-slate-400 leading-relaxed font-semibold text-center mt-1">
            Approve the TRA first to run LMRAs against it.
          </p>

          <div class="text-center py-6 text-slate-400 text-xs italic">
            No LMRA's performed yet.
          </div>
        </div>
      </div>
    </div>

    <!-- APPROVED MODE VIEW (Image 4) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Steps & hazards details -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Loop steps -->
        <div
          v-for="(step, idx) in tra.steps"
          :key="step.id"
          class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm space-y-4 p-5"
        >
          <!-- Step Header banner -->
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-brand-500 text-white font-black text-xs flex items-center justify-center">{{ idx + 1 }}</span>
            <h2 class="text-sm font-black text-slate-800 uppercase tracking-tight">{{ step.name }}</h2>
            <span class="text-[10px] text-slate-400 font-bold ml-auto">{{ step.hazards.length }} {{ step.hazards.length === 1 ? 'hazard' : 'hazards' }}</span>
          </div>

          <!-- Hazards Table inside the step -->
          <div class="border border-slate-100 rounded-xl overflow-hidden" v-if="step.hazards.length > 0">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th class="px-4 py-3">Hazard</th>
                  <th class="px-3 py-3 text-center">W-B-E</th>
                  <th class="px-3 py-3 text-center">Initial</th>
                  <th class="px-3 py-3 text-center">Residual</th>
                  <th class="px-4 py-3">Control Measures</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <template v-for="haz in step.hazards" :key="haz.id">
                  <tr
                    class="hover:bg-slate-50/10 cursor-pointer transition-colors"
                    :class="[expandedApprovedHazardId === haz.id ? 'bg-slate-50/30' : '']"
                    @click="toggleApprovedHazardExpand(haz.id)"
                  >
                    <!-- Hazard info -->
                    <td class="px-4 py-4.5 max-w-[200px]">
                      <span class="block font-bold text-slate-850 text-sm leading-snug">{{ haz.name }}</span>
                      <span class="block text-[9px] text-slate-400 font-extrabold uppercase mt-1">
                        {{ haz.category }} • {{ haz.consequence || 'No consequence specified.' }}
                      </span>
                    </td>

                    <!-- W - B - E -->
                    <td class="px-3 py-4.5 text-center font-bold text-slate-500">
                      {{ haz.likelihood }}•{{ haz.exposure }}•{{ haz.severity }}
                    </td>

                    <!-- Initial Score Badge -->
                    <td class="px-3 py-4.5 text-center">
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-600"
                      >
                        {{ haz.initialRiskScore }}
                      </span>
                    </td>

                    <!-- Residual Score Badge -->
                    <td class="px-3 py-4.5 text-center">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border"
                        :class="[
                          haz.residualRiskScore >= 150 ? 'bg-red-50 text-red-700 border-red-100' : (haz.residualRiskScore >= 70 ? 'bg-warning-50 text-warning-700 border-warning-100' : 'bg-success-50 text-success-700 border-success-100')
                        ]"
                      >
                        {{ haz.residualRiskScore }}
                      </span>
                    </td>

                    <!-- Control Measures text -->
                    <td class="px-4 py-4.5 text-brand-700 font-semibold leading-relaxed">
                      <div class="flex items-center justify-between gap-2">
                        <span>{{ haz.controls && haz.controls.length > 0 ? haz.controls.map(c => c.description).join(' + ') : 'No controls applied.' }}</span>
                        <span class="text-[9px] text-slate-400 font-bold shrink-0 bg-slate-100 px-1.5 py-0.5 rounded uppercase">Click to expand</span>
                      </div>
                    </td>
                  </tr>

                  <!-- Expanded Detail Row (Actions & Controls summary) -->
                  <tr v-if="expandedApprovedHazardId === haz.id" class="bg-slate-50/20">
                    <td colspan="5" class="px-5 py-4 border-b border-slate-100">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs" @click.stop>
                        <!-- Controls Panel -->
                        <div class="space-y-2">
                          <span class="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Mitigation Controls Summary</span>
                          <div class="space-y-1.5" v-if="haz.controls && haz.controls.length > 0">
                            <div 
                              v-for="ctrl in haz.controls" 
                              :key="ctrl.id" 
                              class="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg shadow-xs"
                            >
                              <span class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0" :class="[
                                ctrl.type === 'Elimination' || ctrl.type === 'Substitution' ? 'bg-red-50 text-red-700' : '',
                                ctrl.type === 'Engineering' ? 'bg-brand-50 text-brand-700' : '',
                                ctrl.type === 'Administrative' ? 'bg-amber-50 text-amber-700' : '',
                                ctrl.type === 'PPE' ? 'bg-success-50 text-success-700' : ''
                              ]">{{ ctrl.type }}</span>
                              <span class="text-slate-650 font-medium">{{ ctrl.description }}</span>
                            </div>
                          </div>
                          <div class="text-slate-450 italic text-[10px]" v-else>
                            No controls applied.
                          </div>
                        </div>

                        <!-- Actions Status Tracking Panel -->
                        <div class="space-y-2">
                          <span class="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Linked Actions & Task Status</span>
                          <div class="space-y-2" v-if="getHazardActions(haz.id).length > 0">
                            <div 
                              v-for="act in getHazardActions(haz.id)" 
                              :key="act.id" 
                              class="p-2.5 bg-white border border-slate-100 rounded-xl space-y-2"
                            >
                              <div class="flex items-start justify-between gap-3">
                                <div>
                                  <div class="font-bold text-slate-850 flex items-center gap-1.5 leading-snug">
                                    <span class="text-slate-400 font-mono text-[9px]">{{ act.actionId }}</span>
                                    <span>{{ act.title }}</span>
                                  </div>
                                  <p class="text-[10px] text-slate-450 mt-0.5">Assigned to: <span class="font-semibold text-slate-700">{{ act.assignedTo }}</span> • Due: <span class="font-semibold text-slate-700">{{ act.dueDate }}</span></p>
                                </div>
                                <span class="px-1.5 py-0.5 rounded text-[8px] font-extrabold border shrink-0 uppercase" :class="[
                                  act.status === 'Completed' ? 'bg-success-50 text-success-700 border-success-200' : (act.status === 'In Progress' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-slate-100 text-slate-500 border-slate-200')
                                ]">{{ act.status }}</span>
                              </div>

                              <!-- Progress bar -->
                              <div class="flex items-center gap-2">
                                <div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div class="bg-brand-500 h-full transition-all duration-300" :style="{ width: `${act.progress}%` }"></div>
                                </div>
                                <span class="text-[9px] font-bold text-slate-500">{{ act.progress }}%</span>
                              </div>
                            </div>
                          </div>
                          <div class="text-slate-455 italic text-[10px]" v-else>
                            No corrective actions assigned to this hazard.
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          
          <div class="text-center py-4 text-xs text-slate-400 italic" v-else>
            No hazards logged for this step.
          </div>
        </div>
      </div>

      <!-- Sidebar: LMRA History & Actions (Image 4 right side) -->
      <div class="space-y-6">
        
        <!-- Perform LMRA Trigger card -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
              <History class="w-4.5 h-4.5 text-slate-500" />
              <span>LMRA History</span>
            </h3>
            <span class="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-extrabold flex items-center justify-center">
              {{ traLmras.length }}
            </span>
          </div>

          <!-- Orange active button -->
          <button
            @click="isLmraModalOpen = true"
            class="w-full bg-warning border border-warning hover:bg-warning-600 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-md shadow-warning-500/10 flex items-center justify-center gap-2 transition-all"
          >
            <AlertTriangle class="w-4.5 h-4.5 fill-white/10" />
            <span>Perform LMRA</span>
          </button>

          <p class="text-[10px] text-slate-400 leading-relaxed font-semibold text-center mt-1">
            Approve the TRA first to run LMRAs against it.
          </p>

          <!-- LMRA Log listings -->
          <div class="space-y-3 pt-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            <div
              v-for="lmra in traLmras"
              :key="lmra.id"
              class="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center justify-between">
                <span
                  class="px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border"
                  :class="[
                    lmra.decision === 'Go' ? 'bg-success-50 text-success-700 border-success-200' : 'bg-red-50 text-red-700 border-red-200'
                  ]"
                >
                  {{ lmra.decision }}
                </span>
                <span class="text-[10px] text-slate-400 font-semibold">{{ lmra.when.split(' ')[0] }}</span>
              </div>
              <div class="text-[11px] font-bold text-slate-700">{{ lmra.by }}</div>
              <p class="text-[11px] text-slate-500 leading-relaxed italic" v-if="lmra.comments">
                "{{ lmra.comments }}"
              </p>
            </div>
            
            <div class="text-center py-6 text-slate-400 text-xs italic" v-if="traLmras.length === 0">
              No LMRAs performed yet. Run check before starting.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Explanation Box (Image 3/4 bottom) -->
    <div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-4.5 flex gap-3.5 items-start">
      <Info class="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
      <div class="space-y-1">
        <p class="text-xs font-semibold text-slate-700">Enterprise Safety Lifecycle Standard</p>
        <p class="text-[11px] text-slate-500 leading-relaxed font-medium">
          A TRA is the prepared task analysis. **Steps** lead to **Kinney-scored hazards** (pulled from the parent RI&E or added manually) which define specific **control measures**. Once approved, the TRA is frozen and valid for 3 months; crews must run an on-site **LMRA (Last Minute Risk Analysis)** before starting each work shift.
        </p>
        <p class="text-[9px] text-slate-400 font-semibold font-mono tracking-wider pt-1 uppercase">
          Database Tables: tra, tra_step, tra_hazard (FK source_hazard_id -> RI&E hazard).
        </p>
      </div>
    </div>

    <!-- Perform LMRA checklist modal overlay -->
    <LmraModal
      :is-open="isLmraModalOpen"
      :tra="tra"
      @close="isLmraModalOpen = false"
    />
  </div>
</template>
