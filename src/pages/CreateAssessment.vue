<script setup>
import { ref, computed } from 'vue';
import { store } from '../store';
import { calculateKinneyScore, getKinneyRiskLevel } from '../mockData';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Copy,
  Info,
  CheckCircle2,
  FolderOpen,
  ClipboardList,
  Sparkles
} from 'lucide-vue-next';

// State references from store's wizard structure
const wizard = computed(() => store.wizard);

// Step 1 validation
const isStep1Valid = computed(() => {
  const info = wizard.value.info;
  return info.projectId && info.title && info.area && info.assessor && info.reviewDate;
});

// Load templates list
const loadTemplateHazards = () => {
  // Load typical warehouse/construction hazards as boilerplate to make UX smooth
  wizard.value.hazards = [
    {
      name: 'Working at height on temporary scissor lift',
      consequence: 'Operator falling from height leading to severe injury/fatality',
      category: 'Safety',
      likelihood: 3,
      exposure: 6,
      severity: 15,
      whoIsExposed: 'Field technician and safety spotter'
    },
    {
      name: 'Manual lifting of heavy electrical panels (35kg)',
      consequence: 'Lumbar spine muscular strain, disc injury',
      category: 'Ergonomics',
      likelihood: 6,
      exposure: 3,
      severity: 7,
      whoIsExposed: 'Electrical crew'
    },
    {
      name: 'Accidental contact with energized 400V terminal',
      consequence: 'Severe electrical shock, burns or electrocution',
      category: 'Electrical',
      likelihood: 2,
      exposure: 3,
      severity: 15,
      whoIsExposed: 'Testing engineer'
    }
  ];
  store.addToast('Loaded 3 typical safety template hazards.', 'success');
};

// Hazard Sub-modal state for Step 2
const showAddHazardForm = ref(false);
const newHazard = ref({
  name: '',
  consequence: '',
  category: 'Safety',
  likelihood: 3,
  exposure: 6,
  severity: 15,
  whoIsExposed: 'Field technicians'
});

const addHazard = () => {
  if (!newHazard.value.name || !newHazard.value.consequence) {
    store.addToast('Please fill in the hazard title and possible consequences.', 'error');
    return;
  }
  wizard.value.hazards.push({ ...newHazard.value });
  // Reset
  newHazard.value = { name: '', consequence: '', category: 'Safety', likelihood: 3, exposure: 6, severity: 15, whoIsExposed: 'Field technicians' };
  showAddHazardForm.value = false;
  store.addToast('Hazard added to draft list.');
};

const duplicateHazard = (idx) => {
  const item = wizard.value.hazards[idx];
  wizard.value.hazards.push({ ...item, name: `${item.name} (Copy)` });
  store.addToast('Hazard duplicated.');
};

const deleteHazard = (idx) => {
  wizard.value.hazards.splice(idx, 1);
  store.addToast('Hazard removed from wizard list.', 'warning');
};

// Step 3 calculations
const summaryStats = computed(() => {
  let highestInitial = 0;
  let highestResidual = 0;
  wizard.value.hazards.forEach(h => {
    const init = calculateKinneyScore(h.likelihood, h.exposure, h.severity);
    const resL = Math.max(1, Math.round(h.likelihood * 0.5));
    const resE = Math.max(1, Math.round(h.exposure * 0.6));
    const res = calculateKinneyScore(resL, resE, h.severity);
    if (init > highestInitial) highestInitial = init;
    if (res > highestResidual) highestResidual = res;
  });
  return { highestInitial, highestResidual };
});

const publishAssessment = () => {
  if (wizard.value.hazards.length === 0) {
    store.addToast('Cannot publish an assessment with zero hazards. Please add hazards in Step 2.', 'error');
    return;
  }
  store.publishWizardAssessment();
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">RI&E Creation Wizard</h1>
      <p class="text-xs text-slate-500 mt-1">Guided workflow to compile general settings, identify hazards, establish initial risk levels, and publish safety files.</p>
    </div>

    <!-- Wizard Steps indicator -->
    <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
      <div class="flex items-center gap-2.5 flex-1 justify-center md:justify-start">
        <span
          class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border transition-all duration-150"
          :class="wizard.step === 1 ? 'bg-brand-500 border-brand-500 text-white font-extrabold scale-105' : 'bg-slate-50 border-slate-200 text-slate-400'"
        >
          1
        </span>
        <span class="text-xs font-bold transition-all" :class="wizard.step === 1 ? 'text-brand-600' : 'text-slate-400'">Assessment Info</span>
        
        <div class="w-12 h-px bg-slate-100 hidden md:block"></div>
        
        <span
          class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border transition-all duration-150"
          :class="wizard.step === 2 ? 'bg-brand-500 border-brand-500 text-white font-extrabold scale-105' : 'bg-slate-50 border-slate-200 text-slate-400'"
        >
          2
        </span>
        <span class="text-xs font-bold transition-all" :class="wizard.step === 2 ? 'text-brand-600' : 'text-slate-400'">Hazard Identification</span>

        <div class="w-12 h-px bg-slate-100 hidden md:block"></div>

        <span
          class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border transition-all duration-150"
          :class="wizard.step === 3 ? 'bg-brand-500 border-brand-500 text-white font-extrabold scale-105' : 'bg-slate-50 border-slate-200 text-slate-400'"
        >
          3
        </span>
        <span class="text-xs font-bold transition-all" :class="wizard.step === 3 ? 'text-brand-600' : 'text-slate-400'">Review & Publish</span>
      </div>

      <div class="text-xs font-semibold text-slate-400 hidden md:block flex-shrink-0">
        Template auto-saves drafts
      </div>
    </div>

    <!-- STEP 1: Assessment Info -->
    <div v-if="wizard.step === 1" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
      <div class="border-b border-slate-50 pb-3">
        <h3 class="text-base font-bold text-slate-800">Step 1: General Information</h3>
        <p class="text-xs text-slate-400">Map the evaluation to an active project site, name the operation, and schedule review thresholds.</p>
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Project / Site Operation *</label>
            <select
              v-model="wizard.info.projectId"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="" disabled>Select Project Site</option>
              <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }} ({{ p.client }})</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Title *</label>
            <input
              v-model="wizard.info.title"
              type="text"
              placeholder="e.g. Scaffolding erection & girder welding works"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation Area / Zone *</label>
            <input
              v-model="wizard.info.area"
              type="text"
              placeholder="e.g. Zone 4 - Boiler Gallery"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessor Owner *</label>
            <input
              v-model="wizard.info.assessor"
              type="text"
              placeholder="e.g. John Doe, HSE Spec"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Review Date *</label>
            <input
              v-model="wizard.info.reviewDate"
              type="date"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Evaluation Methodology</label>
            <select
              v-model="wizard.info.method"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="Finekin-Kinney">Finekin-Kinney (L x E x S)</option>
              <option value="5x5 Risk Matrix">5x5 Risk Matrix (L x S)</option>
            </select>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Work description and constraints</label>
          <textarea
            v-model="wizard.info.description"
            rows="5"
            placeholder="Outline workspace details, physical barriers, subcontractor details, and other parameters..."
            class="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          ></textarea>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex justify-end pt-4 border-t border-slate-100">
        <button
          @click="wizard.step = 2"
          :disabled="!isStep1Valid"
          class="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-brand-500/10 flex items-center gap-2 transition-all"
        >
          <span>Next: Identify Hazards</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- STEP 2: Hazard List -->
    <div v-else-if="wizard.step === 2" class="space-y-6 animate-fade-in">
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="flex items-start justify-between border-b border-slate-50 pb-3 flex-wrap gap-4">
          <div>
            <h3 class="text-base font-bold text-slate-800">Step 2: Hazard Identification & Registration</h3>
            <p class="text-xs text-slate-400 mt-0.5">Brainstorm and log safety hazards, define initial exposure levels, and calculate baseline risks.</p>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="loadTemplateHazards"
              class="text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-100 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Sparkles class="w-4 h-4" />
              <span>Load Template Hazards</span>
            </button>
            <button
              @click="showAddHazardForm = true"
              class="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus class="w-4 h-4" />
              <span>Add Custom Hazard</span>
            </button>
          </div>
        </div>

        <!-- Draft Hazards table list -->
        <div class="border border-slate-100 rounded-xl overflow-hidden">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
                <th class="px-4 py-3">#</th>
                <th class="px-4 py-3">Hazard Title</th>
                <th class="px-4 py-3">Category</th>
                <th class="px-4 py-3">Possible Consequences</th>
                <th class="px-4 py-3 text-center">Likelihood</th>
                <th class="px-4 py-3 text-center">Exposure</th>
                <th class="px-4 py-3 text-center">Severity</th>
                <th class="px-4 py-3 text-center">Initial Risk</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(haz, idx) in wizard.hazards" :key="idx" class="hover:bg-slate-50/50">
                <td class="px-4 py-3.5 text-slate-400 font-semibold">{{ idx + 1 }}</td>
                <td class="px-4 py-3.5 font-bold text-slate-700 max-w-[150px] truncate">{{ haz.name }}</td>
                <td class="px-4 py-3.5 font-semibold text-slate-500">{{ haz.category }}</td>
                <td class="px-4 py-3.5 text-slate-500 max-w-[180px] truncate">{{ haz.consequence }}</td>
                <td class="px-4 py-3.5 text-center text-slate-600 font-medium">{{ haz.likelihood }}</td>
                <td class="px-4 py-3.5 text-center text-slate-600 font-medium">{{ haz.exposure }}</td>
                <td class="px-4 py-3.5 text-center text-slate-600 font-medium">{{ haz.severity }}</td>
                <td class="px-4 py-3.5 text-center font-bold text-slate-800">
                  <div class="flex items-center justify-center gap-1">
                    <span>{{ calculateKinneyScore(haz.likelihood, haz.exposure, haz.severity) }}</span>
                    <span class="w-1.5 h-1.5 rounded-full" :class="getKinneyRiskLevel(calculateKinneyScore(haz.likelihood, haz.exposure, haz.severity)).color.split(' ')[0]"></span>
                  </div>
                </td>
                <td class="px-4 py-3.5 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button @click="duplicateHazard(idx)" class="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-50 rounded" title="Duplicate">
                      <Copy class="w-3.5 h-3.5" />
                    </button>
                    <button @click="deleteHazard(idx)" class="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded" title="Delete">
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="wizard.hazards.length === 0">
                <td colspan="9" class="text-center py-12 text-slate-400 font-medium">
                  <div class="max-w-xs mx-auto">
                    <ClipboardList class="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span>No hazards listed yet. Click "Load Template Hazards" or "Add Custom Hazard" to fill the list.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Navigation buttons -->
      <div class="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <button
          @click="wizard.step = 1"
          class="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-sm font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ChevronLeft class="w-4 h-4" />
          <span>Back: Assessment Info</span>
        </button>
        <button
          @click="wizard.step = 3"
          :disabled="wizard.hazards.length === 0"
          class="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-brand-500/10 flex items-center gap-2 transition-all"
        >
          <span>Next: Review & Publish</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Hazard Adding Inline Sub-modal -->
      <div v-if="showAddHazardForm" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col overflow-hidden animate-fade-in">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <h4 class="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Add Custom Hazard</h4>
            <button @click="showAddHazardForm = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
          </div>

          <div class="p-5 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hazard Title *</label>
              <input
                v-model="newHazard.name"
                type="text"
                required
                placeholder="e.g. Inhalation of organic solvent fumes"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <select
                  v-model="newHazard.category"
                  class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                >
                  <option value="Safety">Safety</option>
                  <option value="Ergonomics">Ergonomics</option>
                  <option value="Chemical">Chemical</option>
                  <option value="Biological">Biological</option>
                  <option value="Physical">Physical</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Psychosocial">Psychosocial</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Who is exposed</label>
                <input
                  v-model="newHazard.whoIsExposed"
                  type="text"
                  placeholder="e.g. Paint sprayers"
                  class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Possible Consequences *</label>
              <input
                v-model="newHazard.consequence"
                type="text"
                required
                placeholder="e.g. Dizziness, long term nervous impairment"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div class="border-t border-slate-50 pt-3">
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kinney Risk Coords (Initial)</span>
              <div class="grid grid-cols-3 gap-3">
                <div class="space-y-1">
                  <label class="text-[10px] font-semibold text-slate-500">Likelihood (1-10)</label>
                  <input
                    v-model.number="newHazard.likelihood"
                    type="number"
                    min="1"
                    max="10"
                    class="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-semibold text-slate-500">Exposure (0.5-10)</label>
                  <input
                    v-model.number="newHazard.exposure"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    class="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-semibold text-slate-500">Severity (1-100)</label>
                  <input
                    v-model.number="newHazard.severity"
                    type="number"
                    min="1"
                    max="100"
                    class="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div class="mt-3.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Computed Kinney Score:</span>
                <span class="text-sm font-bold text-slate-800">
                  {{ calculateKinneyScore(newHazard.likelihood, newHazard.exposure, newHazard.severity) }}
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ml-1" :class="getKinneyRiskLevel(calculateKinneyScore(newHazard.likelihood, newHazard.exposure, newHazard.severity)).color">
                    {{ getKinneyRiskLevel(calculateKinneyScore(newHazard.likelihood, newHazard.exposure, newHazard.severity)).name }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <button @click="showAddHazardForm = false" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white text-xs font-bold transition-all">Cancel</button>
            <button @click="addHazard" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all">Add Hazard</button>
          </div>
        </div>
      </div>
    </div>

    <!-- STEP 3: Review & Publish -->
    <div v-else-if="wizard.step === 3" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
      <div class="border-b border-slate-50 pb-3">
        <h3 class="text-base font-bold text-slate-800">Step 3: Review & Final Publication</h3>
        <p class="text-xs text-slate-400">Review assessment metadata details, compile risk stats, and sign off the safety log.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Text review info -->
        <div class="space-y-4 border border-slate-50 p-4 rounded-xl bg-slate-50/50">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Info class="w-4.5 h-4.5 text-slate-400" /> Dossier Details</h4>
          
          <div class="grid grid-cols-2 gap-3.5 text-xs font-semibold text-slate-600">
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">TITLE</span>
              <span class="block text-slate-700 mt-1">{{ wizard.info.title }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">PROJECT SITE</span>
              <span class="block text-slate-700 mt-1">Project #{{ wizard.info.projectId }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">EVALUATION ZONE</span>
              <span class="block text-slate-700 mt-1">{{ wizard.info.area }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">ASSESSOR</span>
              <span class="block text-slate-700 mt-1">{{ wizard.info.assessor }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">METHODOLOGY</span>
              <span class="block text-slate-700 mt-1">{{ wizard.info.method }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">NEXT AUDIT DATE</span>
              <span class="block text-warning mt-1">{{ wizard.info.reviewDate }}</span>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 text-xs">
            <span class="block text-[10px] text-slate-400 leading-none mb-1">SCOPE</span>
            <p class="text-slate-500 leading-relaxed truncate">{{ wizard.info.description || 'No description provided.' }}</p>
          </div>
        </div>

        <!-- Calculated Stats review -->
        <div class="space-y-4 border border-slate-50 p-4 rounded-xl bg-slate-50/50 flex flex-col justify-between">
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 class="w-4.5 h-4.5 text-success" /> Generated Statistics</h4>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white p-3 rounded-xl border border-slate-100 text-center">
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hazards Identified</span>
                <span class="block text-2xl font-black text-slate-800 mt-1">{{ wizard.hazards.length }}</span>
              </div>
              <div class="bg-white p-3 rounded-xl border border-slate-100 text-center">
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spawned Action items</span>
                <span class="block text-2xl font-black text-slate-800 mt-1">{{ wizard.hazards.length }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white p-3 rounded-xl border border-slate-100 text-center">
                <span class="block text-[10px] font-bold text-slate-400 tracking-wider">Highest Initial Risk</span>
                <span class="block text-xl font-bold text-slate-600 mt-1">{{ summaryStats.highestInitial }}</span>
              </div>
              <div class="bg-white p-3 rounded-xl border border-slate-100 text-center">
                <span class="block text-[10px] font-bold text-slate-400 tracking-wider">Highest Residual Risk</span>
                <span class="block text-xl font-black text-red-600 mt-1">
                  {{ summaryStats.highestResidual }}
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded block max-w-max mx-auto mt-1" :class="getKinneyRiskLevel(summaryStats.highestResidual).color">
                    {{ getKinneyRiskLevel(summaryStats.highestResidual).name }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div class="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <Info class="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Residual values calculated based on 50% average baseline control reductions.</span>
          </div>
        </div>
      </div>

      <!-- Action controls -->
      <div class="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          @click="wizard.step = 2"
          class="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-sm font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ChevronLeft class="w-4 h-4" />
          <span>Back: Hazards List</span>
        </button>
        
        <button
          @click="publishAssessment"
          class="bg-success-600 hover:bg-success-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-success-600/10 flex items-center gap-2 transition-all duration-150 hover:scale-102"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>Publish & Sign-off RI&E</span>
        </button>
      </div>
    </div>
  </div>
</template>
