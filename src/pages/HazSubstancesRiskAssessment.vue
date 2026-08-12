<script setup>
import { computed, ref, onMounted } from 'vue';
import { store } from '../store';
import {
  ShieldAlert,
  Flame,
  CheckCircle2,
  Plus,
  Trash2,
  AlertTriangle,
  Info
} from 'lucide-vue-next';

// Active substance from route parameter
const substance = computed(() => {
  const sId = store.selectedSubstanceId || store.currentParams.substanceId;
  return store.substances.find(s => s.id === parseInt(sId, 10));
});

// Risk Calculation State
const initialLikelihood = ref(4);
const initialSeverity = ref(3);
const hazardDescription = ref('Vapour inhalation');

// Controls List State
const existingControls = ref([]);
const newControlText = ref('');

// Residual Risk State
const residualLikelihood = ref(2);
const residualSeverity = ref(3);

// Pre-fill fields on mount
onMounted(() => {
  if (substance.value) {
    // Clone existing controls from wizard Step 3
    existingControls.value = [...substance.value.riskAssessment.existingControls];
    if (substance.value.riskAssessment.hazard) {
      hazardDescription.value = substance.value.riskAssessment.hazard;
    }
    // Prefill scores if they exist
    if (substance.value.riskAssessment.likelihood) {
      initialLikelihood.value = substance.value.riskAssessment.likelihood;
      initialSeverity.value = substance.value.riskAssessment.severity;
    }
    if (substance.value.riskAssessment.residualRisk?.likelihood) {
      residualLikelihood.value = substance.value.riskAssessment.residualRisk.likelihood;
      residualSeverity.value = substance.value.riskAssessment.residualRisk.severity;
    }
  }
});

// Risk scoring helper
const getRiskDetails = (l, s) => {
  const score = l * s;
  let level = 'Low';
  let badgeClass = 'bg-success-100 text-success-800 border-success-200';
  let textClass = 'text-success-600';
  
  if (score >= 15) {
    level = 'High';
    badgeClass = 'bg-red-100 text-red-800 border-red-200';
    textClass = 'text-red-600 font-bold';
  } else if (score >= 5) {
    level = 'Medium';
    badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
    textClass = 'text-amber-600 font-bold';
  }
  
  return { score, level, badgeClass, textClass };
};

const initialRisk = computed(() => getRiskDetails(initialLikelihood.value, initialSeverity.value));
const residualRisk = computed(() => getRiskDetails(residualLikelihood.value, residualSeverity.value));

// Controls management
const addControl = () => {
  if (newControlText.value.trim()) {
    existingControls.value.push(newControlText.value.trim());
    newControlText.value = '';
    store.addToast('Control measure added.', 'success');
  }
};

const removeControl = (idx) => {
  existingControls.value.splice(idx, 1);
  store.addToast('Control measure removed.', 'warning');
};

// Approve Risk Assessment
const submitApproval = () => {
  if (!hazardDescription.value.trim()) {
    store.addToast('Please input a hazard description', 'error');
    return;
  }

  const assessmentData = {
    hazard: hazardDescription.value,
    likelihood: initialLikelihood.value,
    severity: initialSeverity.value,
    riskScore: initialRisk.value.score,
    riskLevel: initialRisk.value.level,
    existingControls: existingControls.value,
    residualLikelihood: residualLikelihood.value,
    residualSeverity: residualSeverity.value,
    residualRiskScore: residualRisk.value.score,
    residualRiskLevel: residualRisk.value.level
  };

  store.approveRiskAssessment(substance.value.id, assessmentData);
  store.navigateTo('haz-substances-detail', { substanceId: substance.value.id });
};

// Map pictograms to emojis/colors
const getGhsIcon = (pic) => {
  const mapping = {
    GHS02: { char: '🔥', label: 'Flammable', color: 'bg-red-50 text-red-700 border-red-100' },
    GHS05: { char: '🧪', label: 'Corrosive', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    GHS06: { char: '☠️', label: 'Toxic', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    GHS07: { char: '⚠️', label: 'Harmful', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    GHS08: { char: '👤', label: 'Health Hazard', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    GHS09: { char: '🌿', label: 'Environmental', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
  };
  return mapping[pic] || { char: '❓', label: pic, color: 'bg-slate-100 text-slate-600 border-slate-200' };
};
</script>

<template>
  <div v-if="substance" class="max-w-3xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Risk Assessment</span>
          <span>/</span>
          <span>Draft Substance</span>
        </div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight font-sans mt-0.5">{{ substance.name }}</h1>
        <p class="text-xs text-slate-500">Perform a basic hazardous-substance risk assessment using 5x5 matrix metrics.</p>
      </div>
      <button
        @click="store.navigateTo('haz-substances-detail', { substanceId: substance.id })"
        class="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
      >
        Cancel
      </button>
    </div>

    <!-- Hazards Alert Summary -->
    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
      <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Product Warning Classification</h3>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="pic in substance.hazards.pictograms"
          :key="pic"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold"
          :class="getGhsIcon(pic).color"
        >
          <span class="text-sm">{{ getGhsIcon(pic).char }}</span>
          <span>{{ getGhsIcon(pic).label }}</span>
        </span>
        <span v-if="substance.hazards.pictograms.length === 0" class="text-xs text-slate-400 italic">
          No hazard pictograms recorded. SDS missing or skipped.
        </span>
      </div>
    </div>

    <!-- The Assessment Form -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- INITIAL RISK -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="border-b border-slate-50 pb-2">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">1. Initial Risk Calculation</h3>
          <p class="text-[10px] text-slate-400">Record work exposure risk before applying extra controls.</p>
        </div>

        <div class="space-y-4">
          <!-- Hazard description -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Hazard / Exposure Scenario</label>
            <input
              v-model="hazardDescription"
              type="text"
              class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
              placeholder="e.g. Vapour inhalation during brush application"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Likelihood -->
            <div class="flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Likelihood (1-5)</label>
              <select
                v-model="initialLikelihood"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-600 focus:outline-hidden transition-colors"
              >
                <option :value="1">1 — Rare</option>
                <option :value="2">2 — Unlikely</option>
                <option :value="3">3 — Possible</option>
                <option :value="4">4 — Likely</option>
                <option :value="5">5 — Almost Certain</option>
              </select>
            </div>

            <!-- Severity -->
            <div class="flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Severity (1-5)</label>
              <select
                v-model="initialSeverity"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-600 focus:outline-hidden transition-colors"
              >
                <option :value="1">1 — Insignificant</option>
                <option :value="2">2 — Minor</option>
                <option :value="3">3 — Moderate</option>
                <option :value="4">4 — Major</option>
                <option :value="5">5 — Catastrophic</option>
              </select>
            </div>
          </div>

          <!-- Calculated Risk Score display -->
          <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Initial Risk Score</span>
              <span class="text-xs text-slate-500 font-semibold">Likelihood × Severity</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-2xl font-black text-slate-800">{{ initialRisk.score }}</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border" :class="initialRisk.badgeClass">
                {{ initialRisk.level }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- CONTROLS MANAGEMENT -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="border-b border-slate-50 pb-2">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">2. Control Measures</h3>
          <p class="text-[10px] text-slate-400">Implement precautions to mitigate exposure or chemical danger.</p>
        </div>

        <div class="space-y-4">
          <!-- Controls list -->
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <h4 class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Controls Checklist</h4>
            <div v-if="existingControls.length === 0" class="text-xs text-slate-400 italic py-2">
              No controls defined yet. Use form below to add.
            </div>
            <div
              v-for="(ctrl, idx) in existingControls"
              :key="idx"
              class="flex items-center justify-between gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700"
            >
              <span class="truncate pr-1 flex-1">{{ ctrl }}</span>
              <button
                @click="removeControl(idx)"
                class="text-slate-400 hover:text-red-500 transition-colors shrink-0 p-0.5 cursor-pointer"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Add new control form -->
          <div class="flex gap-2">
            <input
              v-model="newControlText"
              type="text"
              placeholder="e.g. Use local exhaust ventilation"
              class="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
              @keydown.enter="addControl"
            />
            <button
              @click="addControl"
              class="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-3 flex items-center justify-center cursor-pointer shadow-xs transition-colors"
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- RESIDUAL RISK -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 md:col-span-2">
        <div class="border-b border-slate-50 pb-2">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">3. Residual Risk Evaluation</h3>
          <p class="text-[10px] text-slate-400">Determine risk levels after including the control measures above.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Likelihood selection -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Residual Likelihood (1-5)</label>
            <select
              v-model="residualLikelihood"
              class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-600 focus:outline-hidden transition-colors"
            >
              <option :value="1">1 — Rare</option>
              <option :value="2">2 — Unlikely</option>
              <option :value="3">3 — Possible</option>
              <option :value="4">4 — Likely</option>
              <option :value="5">5 — Almost Certain</option>
            </select>
          </div>

          <!-- Severity selection -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Residual Severity (1-5)</label>
            <select
              v-model="residualSeverity"
              class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-600 focus:outline-hidden transition-colors"
            >
              <option :value="1">1 — Insignificant</option>
              <option :value="2">2 — Minor</option>
              <option :value="3">3 — Moderate</option>
              <option :value="4">4 — Major</option>
              <option :value="5">5 — Catastrophic</option>
            </select>
          </div>

          <!-- Score summary display -->
          <div class="bg-success-50/50 border border-success-100 p-4 rounded-xl flex items-center justify-between gap-4">
            <div>
              <span class="text-[10px] font-extrabold text-success-800 uppercase tracking-wider block">Residual Risk Score</span>
              <span class="text-[9px] text-success-600 font-semibold block mt-0.5">Control mitigated score</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-2xl font-black text-slate-800">{{ residualRisk.score }}</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border" :class="residualRisk.badgeClass">
                {{ residualRisk.level }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Approve Buttons -->
    <div class="flex justify-end">
      <button
        @click="submitApproval"
        class="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md shadow-brand-500/10 hover:shadow-lg transition-all duration-200 cursor-pointer"
      >
        <CheckCircle2 class="w-4.5 h-4.5" />
        <span>Approve Assessment</span>
      </button>
    </div>
  </div>
  <div v-else class="py-12 text-center text-slate-400">
    Substance not found.
  </div>
</template>
