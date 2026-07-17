<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { calculateKinneyScore, getKinneyRiskLevel } from '../mockData';
import {
  RefreshCw,
  Info,
  Play,
  CheckCircle2,
  User,
  Calendar,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  ShieldAlert,
  FolderOpen
} from 'lucide-vue-next';

// Selected assessment for review workflow
const selectedAssessment = computed(() => {
  return store.assessments.find(a => a.id === store.selectedAssessmentId) || store.assessments[0];
});

// Computed list of hazards belonging to the active assessment
const assessmentHazards = computed(() => {
  if (!selectedAssessment.value) return [];
  return store.hazards.filter(h => h.assessmentId === selectedAssessment.value.id);
});

// Local form states
const reviewerName = ref('Senior Safety Inspector');
const auditNotes = ref('');

const handleStartClone = () => {
  store.cloneAndStartReview(selectedAssessment.value.id, reviewerName.value);
};

const handlePublishReview = () => {
  if (!auditNotes.value.trim()) {
    store.addToast('Please provide safety audit notes before publishing.', 'error');
    return;
  }
  store.publishReviewedVersion(selectedAssessment.value.id, auditNotes.value);
};

// Comparative helpers
const getParentHazard = (hazard, index) => {
  if (!selectedAssessment.value || !selectedAssessment.value.parentId) return null;
  const parentHaz = store.hazards.filter(h => h.assessmentId === selectedAssessment.value.parentId);
  const matchByName = parentHaz.find(ph => ph.name === hazard.name);
  if (matchByName) return matchByName;
  return parentHaz[index] || null;
};

const getScoreDiff = (hazard, index) => {
  const ph = getParentHazard(hazard, index);
  if (!ph) return 0;
  const current = calculateKinneyScore(hazard.likelihood || 3, hazard.exposure || 6, hazard.severity || 15);
  const original = calculateKinneyScore(ph.likelihood || 3, ph.exposure || 6, ph.severity || 15);
  return current - original;
};

const getRiskDeltaClass = (diff) => {
  if (diff < 0) return 'text-success-700 bg-success-50 border-success-200';
  if (diff > 0) return 'text-red-700 bg-red-50 border-red-200';
  return 'text-slate-500 bg-slate-50 border-slate-200';
};

// Aggregate audited stats
const auditedMaxRisk = computed(() => {
  if (assessmentHazards.value.length === 0) return 0;
  return Math.max(...assessmentHazards.value.map(h => calculateKinneyScore(h.likelihood || 3, h.exposure || 6, h.severity || 15)), 0);
});

const baselineMaxRisk = computed(() => {
  if (!selectedAssessment.value || !selectedAssessment.value.parentId) return 0;
  const parentHaz = store.hazards.filter(h => h.assessmentId === selectedAssessment.value.parentId);
  if (parentHaz.length === 0) return 0;
  return Math.max(...parentHaz.map(h => calculateKinneyScore(h.likelihood || 3, h.exposure || 6, h.severity || 15)), 0);
});
</script>

<template>
  <div class="space-y-6 pb-12" v-if="selectedAssessment">
    <!-- Header Selection -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans flex items-center gap-2">
          <RefreshCw class="w-6 h-6 text-brand-500" />
          <span>Audit Review Cycle</span>
        </h1>
        <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <span>Active safety file review pipeline. Status:</span>
          <span
            class="px-2 py-0.5 rounded text-[10px] font-bold"
            :class="selectedAssessment.status === 'Published' ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'"
          >
            {{ selectedAssessment.status }}
          </span>
        </p>
      </div>

      <!-- Dropdown selector -->
      <div class="flex items-center gap-2.5">
        <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Target RI&E:</label>
        <select
          v-model="store.selectedAssessmentId"
          class="border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white text-slate-700 shadow-sm"
        >
          <option v-for="a in store.assessments" :key="a.id" :value="a.id">{{ a.title }} ({{ a.projectName }})</option>
        </select>
      </div>
    </div>

    <!-- STAGE 1: Assessment has NOT been cloned yet (Status is Published) -->
    <div v-if="selectedAssessment.status === 'Published'" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
      <div class="border-b border-slate-50 pb-3">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"><FolderOpen class="w-4.5 h-4.5 text-brand-500" /> Start Audit Review Cycle</h3>
        <p class="text-xs text-slate-400 mt-0.5">Clones the active safety file to create an isolated reviewed version draft.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4 border border-slate-100 p-5 rounded-2xl bg-slate-50/50 text-xs font-semibold text-slate-600">
          <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Safety Folder Details</h4>
          <div class="grid grid-cols-2 gap-4 mt-2">
            <span class="block">Title: <span class="text-slate-800 block font-bold text-sm mt-0.5">{{ selectedAssessment.title }}</span></span>
            <span class="block">Project Site: <span class="text-slate-800 block font-bold text-sm mt-0.5">{{ selectedAssessment.projectName }}</span></span>
            <span class="block">Active Version: <span class="text-slate-800 block font-bold text-sm mt-0.5">{{ selectedAssessment.version }}</span></span>
            <span class="block">Assigned Inspector: <span class="text-slate-800 block font-bold text-sm mt-0.5">{{ selectedAssessment.assessor }}</span></span>
            <span class="block">Hazards Evaluated: <span class="text-slate-800 block font-bold text-sm mt-0.5">{{ selectedAssessment.hazardsCount }} items</span></span>
            <span class="block">Max Baseline Risk: 
              <span class="px-2 py-0.5 rounded text-[10px] font-bold inline-block mt-0.5" :class="getKinneyRiskLevel(selectedAssessment.highestResidualRisk || 48).color">
                {{ selectedAssessment.highestResidualRisk || 48 }} ({{ getKinneyRiskLevel(selectedAssessment.highestResidualRisk || 48).name }})
              </span>
            </span>
          </div>
        </div>

        <div class="lg:col-span-1 space-y-4 flex flex-col justify-between p-5 border border-slate-100 rounded-2xl">
          <div class="space-y-3">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Auditing Safety Inspector Name</label>
              <input
                v-model="reviewerName"
                type="text"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white font-bold"
              />
            </div>
            <div class="bg-blue-50/50 border border-blue-100/50 p-3 rounded-xl text-[10px] text-slate-500 leading-relaxed">
              <strong>💡 Safety Review Workflow:</strong> Cloning creates a copy of the assessment for editing risk coordinates. The baseline version remains published in history.
            </div>
          </div>

          <button
            @click="handleStartClone"
            class="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-brand-500/10 flex items-center justify-center gap-1.5 transition-all hover:scale-102 mt-4"
          >
            <Play class="w-4 h-4 fill-white/10" />
            <span>Create Draft & Start Audit</span>
          </button>
        </div>
      </div>
    </div>

    <!-- STAGE 2: Assessment is Under Review (cloned draft) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
      
      <!-- Left Column: Hazards List Form (2/3 width) -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div class="border-b border-slate-50 pb-2.5">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Calibration Workspace</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Adjust risk variables (L, E, S) based on physical audit checks for the draft <span class="font-bold text-slate-600">{{ selectedAssessment.version }}</span>.</p>
          </div>

          <!-- Hazards Grid/List -->
          <div class="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            <div
              v-for="(h, idx) in assessmentHazards"
              :key="h.id"
              class="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3"
            >
              <!-- Hazard Header Info -->
              <div class="flex items-start justify-between text-xs font-bold text-slate-700 flex-wrap gap-2">
                <span class="max-w-[70%] leading-relaxed">{{ idx + 1 }}. {{ h.name }}</span>
                <!-- Reviewed vs Baseline Comparison badge -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] text-slate-400 font-normal">Audited:</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getKinneyRiskLevel(calculateKinneyScore(h.likelihood, h.exposure, h.severity)).color">
                    {{ calculateKinneyScore(h.likelihood, h.exposure, h.severity) }} ({{ getKinneyRiskLevel(calculateKinneyScore(h.likelihood, h.exposure, h.severity)).name }})
                  </span>
                </div>
              </div>

              <!-- Read-only Baseline row -->
              <div v-if="getParentHazard(h, idx)" class="grid grid-cols-4 gap-2 bg-white/70 border border-slate-100/80 p-2 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-wider items-center">
                <span>Baseline values:</span>
                <span class="text-slate-600 font-normal normal-case">L: {{ getParentHazard(h, idx).likelihood }}</span>
                <span class="text-slate-600 font-normal normal-case">E: {{ getParentHazard(h, idx).exposure }}</span>
                <span class="text-slate-600 font-normal normal-case">S: {{ getParentHazard(h, idx).severity }}</span>
              </div>

              <!-- Editable Inputs (Replaced sliders with clean numeric fields) -->
              <div class="grid grid-cols-3 gap-3">
                <div class="space-y-1">
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Likelihood (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    v-model.number="h.likelihood"
                    class="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700 font-bold"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Exposure (0.5-10)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    v-model.number="h.exposure"
                    class="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700 font-bold"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Severity (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    v-model.number="h.severity"
                    class="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700 font-bold"
                  />
                </div>
              </div>

              <!-- Interactive Risk Delta Badge -->
              <div v-if="getParentHazard(h, idx)" class="flex justify-end pt-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1" :class="getRiskDeltaClass(getScoreDiff(h, idx))">
                  <span v-if="getScoreDiff(h, idx) < 0">📉 Risk Mitigated By {{ Math.abs(getScoreDiff(h, idx)) }} pts</span>
                  <span v-else-if="getScoreDiff(h, idx) > 0">📈 Warning: Risk Increased By {{ getScoreDiff(h, idx) }} pts</span>
                  <span v-else>➖ No Change from Baseline</span>
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Sidebar Audit Status & Publish (1/3 width) -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Audit Summary Card -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div class="border-b border-slate-50 pb-2">
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Audit Summary</h4>
          </div>
          <div class="space-y-2 text-xs font-semibold text-slate-600">
            <span class="flex items-center gap-1.5"><User class="w-4 h-4 text-slate-400" /> Assessor: <span class="text-slate-800 font-bold">{{ selectedAssessment.assessor }}</span></span>
            <span class="flex items-center gap-1.5"><Calendar class="w-4 h-4 text-slate-400" /> Version: <span class="text-slate-800 font-bold">{{ selectedAssessment.version }}</span></span>
          </div>

          <!-- Dynamic aggregate comparison -->
          <div class="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-3" v-if="selectedAssessment.parentId">
            <span class="text-[9px] font-bold text-slate-400 tracking-wider uppercase block">Review Score Summary</span>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500 font-medium">Baseline Max Risk:</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getKinneyRiskLevel(baselineMaxRisk).color">
                {{ baselineMaxRisk }}
              </span>
            </div>
            <div class="flex items-center justify-between text-xs border-t border-slate-200/50 pt-2">
              <span class="text-slate-500 font-medium">Audited Max Risk:</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getKinneyRiskLevel(auditedMaxRisk).color">
                {{ auditedMaxRisk }}
              </span>
            </div>
            <div class="flex justify-between items-center text-xs border-t border-slate-200/50 pt-2 font-bold" :class="auditedMaxRisk - baselineMaxRisk <= 0 ? 'text-success-700' : 'text-red-700'">
              <span>Risk Adjustment:</span>
              <span>{{ auditedMaxRisk - baselineMaxRisk <= 0 ? '📉 Decreased' : '📈 Increased' }}</span>
            </div>
          </div>
        </div>

        <!-- Safety Reference guide -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div class="border-b border-slate-50 pb-2 flex items-center gap-1.5">
            <Info class="w-4 h-4 text-brand-500" />
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Kinney Guide</h4>
          </div>
          <div class="text-[10px] text-slate-500 leading-relaxed space-y-2">
            <p><strong>Formula:</strong> Likelihood (L) × Exposure (E) × Severity (S) = Score</p>
            <ul class="list-disc list-inside space-y-1">
              <li><strong>Likelihood (L):</strong> Probability (1 = rare, 10 = continuous).</li>
              <li><strong>Exposure (E):</strong> Encounter frequency (0.5 = yearly, 10 = constant).</li>
              <li><strong>Severity (S):</strong> Incident severity (1 = minor cut, 100 = death).</li>
            </ul>
          </div>
        </div>

        <!-- Audit Remarks / Notes & Sign Off -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Inspector Safety Audit Notes *</label>
            <textarea
              v-model="auditNotes"
              rows="4"
              placeholder="e.g. Verified guardrails are installed and checking logs daily..."
              class="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700 bg-white"
            ></textarea>
          </div>

          <button
            @click="handlePublishReview"
            class="w-full bg-success-600 hover:bg-success-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-success-600/10 flex items-center justify-center gap-1.5 transition-all hover:scale-102"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>Publish Upgraded Version</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
