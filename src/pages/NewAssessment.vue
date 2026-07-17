<script setup>
import { computed, ref } from 'vue';
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
  ClipboardList,
  Sparkles,
  ShieldCheck,
  Flame,
  Wrench
} from 'lucide-vue-next';

const wizard = computed(() => store.wizard);

// Step validation helper
const isStepValid = computed(() => {
  const info = wizard.value.info;
  if (wizard.value.step === 1) return info.projectId && info.title && info.assessor;
  if (wizard.value.step === 2) return info.area;
  if (wizard.value.step === 3) return wizard.value.hazards.length > 0;
  return true;
});

// Prepopulate baseline draft hazards
const loadTemplateHazards = () => {
  wizard.value.hazards = [
    {
      name: 'Working at height on scaffolding planks',
      consequence: 'Fall from height leading to severe fracture or fatality',
      category: 'Safety',
      likelihood: 4,
      exposure: 6,
      severity: 15,
      controls: [{ type: 'Engineering', description: 'Standard double guardrails and safety toe-boards.' }]
    },
    {
      name: 'Manual lifting of heavy steel flanges (40kg)',
      consequence: 'Lumbar spine muscular sprain, severe chronic pain',
      category: 'Ergonomics',
      likelihood: 6,
      exposure: 3,
      severity: 7,
      controls: [{ type: 'Administrative', description: 'Mandatory two-man lift SOP training.' }]
    },
    {
      name: 'Corrosive splash of Sulfuric Acid during valve swap',
      consequence: 'Severe chemical burns to eyes or exposed skin',
      category: 'Chemical',
      likelihood: 2,
      exposure: 3,
      severity: 40,
      controls: [{ type: 'PPE', description: 'Certified chemical safety goggles and acid-resistant gloves.' }]
    }
  ];
  store.addToast('Preloaded 3 industry-standard template hazards.', 'success');
};

// Wizard inline hazard builder
const showAddHazardForm = ref(false);
const newHazard = ref({
  name: '',
  consequence: '',
  category: 'Safety',
  likelihood: 3,
  exposure: 6,
  severity: 15,
  controls: []
});

const addHazard = () => {
  if (!newHazard.value.name || !newHazard.value.consequence) {
    store.addToast('Please fill in title and consequences.', 'error');
    return;
  }
  wizard.value.hazards.push({ ...newHazard.value, controls: [] });
  newHazard.value = { name: '', consequence: '', category: 'Safety', likelihood: 3, exposure: 6, severity: 15, controls: [] };
  showAddHazardForm.value = false;
  store.addToast('Hazard added.');
};

const deleteHazard = (idx) => {
  wizard.value.hazards.splice(idx, 1);
  store.addToast('Hazard removed.', 'warning');
};

const duplicateHazard = (idx) => {
  const item = wizard.value.hazards[idx];
  wizard.value.hazards.push(JSON.parse(JSON.stringify(item)));
  store.addToast('Hazard duplicated.');
};

// Helper to get or initialize the first control on a hazard
const getControl = (hazard) => {
  if (!hazard.controls) {
    hazard.controls = [];
  }
  if (hazard.controls.length === 0) {
    hazard.controls.push({ type: 'Engineering', description: '' });
  }
  return hazard.controls[0];
};

const setControlType = (hazard, type) => {
  const ctrl = getControl(hazard);
  ctrl.type = type;
};

const setControlDescription = (hazard, desc) => {
  const ctrl = getControl(hazard);
  ctrl.description = desc;
};

const getControlFactor = (type) => {
  if (type === 'Elimination') return 0.1;
  if (type === 'Substitution') return 0.2;
  if (type === 'Engineering') return 0.4;
  if (type === 'Administrative') return 0.6;
  if (type === 'PPE') return 0.8;
  return 0.4;
};

const calculateResidualCoords = (hazard) => {
  const ctrl = getControl(hazard);
  const factor = getControlFactor(ctrl.type);
  const resLikelihood = Math.max(1, Math.round((hazard.likelihood || 3) * factor));
  const resExposure = Math.max(1, Math.round((hazard.exposure || 6) * factor));
  const resSeverity = hazard.severity || 15;
  const score = calculateKinneyScore(resLikelihood, resExposure, resSeverity);
  return {
    likelihood: resLikelihood,
    exposure: resExposure,
    severity: resSeverity,
    score
  };
};

const maxInitialScore = computed(() => {
  if (!wizard.value.hazards || wizard.value.hazards.length === 0) return 0;
  return Math.max(...wizard.value.hazards.map(h => calculateKinneyScore(h.likelihood || 3, h.exposure || 6, h.severity || 15)));
});

const maxResidualScore = computed(() => {
  if (!wizard.value.hazards || wizard.value.hazards.length === 0) return 0;
  return Math.max(...wizard.value.hazards.map(h => calculateResidualCoords(h).score));
});

const riskReductionPercent = computed(() => {
  if (maxInitialScore.value === 0) return 0;
  return Math.max(0, Math.round((1 - (maxResidualScore.value / maxInitialScore.value)) * 100));
});

// Steps naming
const stepLabels = [
  'General Info',
  'Location & Area',
  'Identify Hazards',
  'Kinney Scoring',
  'Define Controls',
  'Review & Publish'
];
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">New Assessment Wizard</h1>
      <p class="text-xs text-slate-500 mt-1">Guided 6-step wizard to evaluate, register, and publish safety assessment folders.</p>
    </div>

    <!-- 6 Steps Indicator Header -->
    <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between overflow-x-auto custom-scrollbar">
      <div class="flex items-center gap-2.5 min-w-max">
        <div v-for="s in 6" :key="s" class="flex items-center gap-2.5">
          <span
            class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] border transition-all duration-150"
            :class="[
              wizard.step === s ? 'bg-brand-500 border-brand-500 text-white font-extrabold scale-105 shadow-sm shadow-brand-500/10' : '',
              wizard.step > s ? 'bg-success-500 border-success-500 text-white font-bold' : '',
              wizard.step < s ? 'bg-slate-50 border-slate-200 text-slate-400' : ''
            ]"
          >
            {{ s }}
          </span>
          <span class="text-[11px] font-bold" :class="wizard.step === s ? 'text-brand-600 font-extrabold' : 'text-slate-400'">
            {{ stepLabels[s - 1] }}
          </span>
          <div v-if="s < 6" class="w-6 h-px bg-slate-100 mx-1"></div>
        </div>
      </div>
    </div>

    <!-- Responsive Layout Grid: Left for Wizard steps, Right for Methodology Guide -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Active Wizard Step Form (takes 2 cols on lg) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- STEP 1: General Info -->
        <div v-if="wizard.step === 1" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 animate-fade-in">
          <div class="border-b border-slate-50 pb-2">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Step 1: General Parameters</h3>
            <p class="text-xs text-slate-400 mt-0.5">Initialize the safety file, assign a client site, and set the assessor owner.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Project Site Mapping *</label>
              <select
                v-model="wizard.info.projectId"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
              >
                <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assessment Title *</label>
              <input
                v-model="wizard.info.title"
                type="text"
                placeholder="e.g. Scaffolding erection & welding works"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assessor / Inspector Owner *</label>
              <input
                v-model="wizard.info.assessor"
                type="text"
                placeholder="e.g. John Doe, HSE Specialist"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Scheduled Next Audit Date *</label>
              <input
                v-model="wizard.info.reviewDate"
                type="date"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <!-- STEP 2: Location & Area -->
        <div v-else-if="wizard.step === 2" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 animate-fade-in">
          <div class="border-b border-slate-50 pb-2">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Step 2: Location & Work Scope</h3>
            <p class="text-xs text-slate-400 mt-0.5">Specify target zones and describe specific site operational constraints.</p>
          </div>

          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Work Zone / Location *</label>
              <input
                v-model="wizard.info.area"
                type="text"
                placeholder="e.g. Sector 4 - Heavy Fabrication Gallery"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Operational Scope / Description</label>
              <textarea
                v-model="wizard.info.description"
                rows="5"
                placeholder="Outline physical constraints, exposure risks, and subcontractor details..."
                class="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- STEP 3: Identify Hazards -->
        <div v-else-if="wizard.step === 3" class="space-y-4 animate-fade-in">
          <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-50 pb-2 flex-wrap gap-3">
              <div>
                <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Step 3: Hazard Identification</h3>
                <p class="text-xs text-slate-400 mt-0.5">Identify safety hazards, write possible consequences, and categorize them.</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="loadTemplateHazards"
                  class="text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles class="w-3.5 h-3.5" />
                  <span>Load Template</span>
                </button>
                <button
                  @click="showAddHazardForm = true"
                  class="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Add Hazard</span>
                </button>
              </div>
            </div>

            <!-- Table -->
            <div class="border border-slate-100 rounded-xl overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
                    <th class="px-4 py-3">#</th>
                    <th class="px-4 py-3">Hazard Title</th>
                    <th class="px-4 py-3">Category</th>
                    <th class="px-4 py-3">Possible Consequences</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(h, idx) in wizard.hazards" :key="idx" class="hover:bg-slate-50/50">
                    <td class="px-4 py-3 font-semibold text-slate-400">{{ idx + 1 }}</td>
                    <td class="px-4 py-3 font-bold text-slate-700 max-w-[150px] truncate">{{ h.name }}</td>
                    <td class="px-4 py-3 font-semibold text-slate-500">{{ h.category }}</td>
                    <td class="px-4 py-3 text-slate-500 max-w-[180px] truncate">{{ h.consequence }}</td>
                    <td class="px-4 py-3 text-right">
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
                    <td colspan="5" class="text-center py-8 text-slate-400 font-medium">No hazards defined yet. Click "Load Template" to start.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add Hazard submodal -->
          <div v-if="showAddHazardForm" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col overflow-hidden animate-fade-in">
              <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Add Custom Hazard</h4>
                <button @click="showAddHazardForm = false" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
              </div>
              <div class="p-4 space-y-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Hazard Title *</label>
                  <input
                    v-model="newHazard.name"
                    type="text"
                    required
                    placeholder="e.g. Chemical spillage at reactor inlet"
                    class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Category</label>
                    <select
                      v-model="newHazard.category"
                      class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                    >
                      <option value="Safety">Safety</option>
                      <option value="Ergonomics">Ergonomics</option>
                      <option value="Chemical">Chemical</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Physical">Physical</option>
                    </select>
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Exposed Personnel</label>
                    <input
                      v-model="newHazard.whoIsExposed"
                      type="text"
                      placeholder="e.g. Field Operators"
                      class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Consequences *</label>
                  <input
                    v-model="newHazard.consequence"
                    type="text"
                    required
                    placeholder="e.g. Severe acid burn injury"
                    class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button @click="showAddHazardForm = false" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white text-xs font-bold transition-all">Cancel</button>
                <button @click="addHazard" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all">Add Hazard</button>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 4: Initial Kinney Scoring -->
        <div v-else-if="wizard.step === 4" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 animate-fade-in">
          <div class="border-b border-slate-50 pb-2">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"><Flame class="w-4.5 h-4.5 text-brand-500" /> Step 4: Initial Kinney Scoring</h3>
            <p class="text-xs text-slate-400 mt-0.5">Determine Likelihood, Exposure, and Severity variables to calculate the baseline score.</p>
          </div>

          <div class="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            <div
              v-for="(h, idx) in wizard.hazards"
              :key="idx"
              class="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3"
            >
              <div class="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{{ idx + 1 }}. {{ h.name }}</span>
                <span class="px-2 py-0.5 rounded text-[10px]" :class="getKinneyRiskLevel(calculateKinneyScore(h.likelihood, h.exposure, h.severity)).color">
                  Initial: {{ calculateKinneyScore(h.likelihood, h.exposure, h.severity) }} ({{ getKinneyRiskLevel(calculateKinneyScore(h.likelihood, h.exposure, h.severity)).name }})
                </span>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="space-y-1">
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Likelihood (1-10)</label>
                  <input
                    v-model.number="h.likelihood"
                    type="number"
                    min="1"
                    max="10"
                    class="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-right bg-white"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Exposure (0.5-10)</label>
                  <input
                    v-model.number="h.exposure"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    class="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-right bg-white"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Severity (1-100)</label>
                  <input
                    v-model.number="h.severity"
                    type="number"
                    min="1"
                    max="100"
                    class="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-right bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 5: Define Controls -->
        <div v-else-if="wizard.step === 5" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 animate-fade-in">
          <div class="border-b border-slate-50 pb-2">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"><Wrench class="w-4.5 h-4.5 text-brand-500" /> Step 5: Define Mitigation Controls</h3>
            <p class="text-xs text-slate-400 mt-0.5">Apply controls matching the HSE hierarchy (Elimination, Substitution, Engineering, Admin, PPE).</p>
          </div>

          <div class="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            <div
              v-for="(h, idx) in wizard.hazards"
              :key="idx"
              class="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3"
            >
              <div class="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{{ idx + 1 }}. {{ h.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-slate-400">Baseline Score: {{ calculateKinneyScore(h.likelihood, h.exposure, h.severity) }}</span>
                  <span class="text-slate-300">|</span>
                  <span class="px-2 py-0.5 rounded text-[10px] flex items-center gap-1.5" :class="getKinneyRiskLevel(calculateResidualCoords(h).score).color">
                    Residual: {{ calculateResidualCoords(h).score }} ({{ getKinneyRiskLevel(calculateResidualCoords(h).score).name }})
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div class="space-y-1">
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Hierarchy Type</label>
                  <select
                    :value="getControl(h).type"
                    @change="setControlType(h, $event.target.value)"
                    class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none"
                  >
                    <option value="Elimination">Elimination</option>
                    <option value="Substitution">Substitution</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Administrative">Administrative</option>
                    <option value="PPE">PPE</option>
                  </select>
                </div>
                <div class="md:col-span-3 space-y-1">
                  <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Control Description</label>
                  <input
                    type="text"
                    :value="getControl(h).description"
                    @input="setControlDescription(h, $event.target.value)"
                    placeholder="e.g. Guard rail edge protections, safety harness logs checked daily..."
                    class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 6: Review & Publish -->
        <div v-else-if="wizard.step === 6" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 animate-fade-in">
          <div class="border-b border-slate-50 pb-2">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck class="w-4.5 h-4.5 text-success" /> Step 6: Review & Publish Safety File</h3>
            <p class="text-xs text-slate-400 mt-0.5">Verify general assessment metadata and sign off to publish the safety register.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="space-y-2">
              <span class="block text-[10px] text-slate-400 tracking-wider uppercase">RI&E General Info</span>
              <span class="block">Title: <span class="text-slate-800">{{ wizard.info.title }}</span></span>
              <span class="block">Project Site ID: <span class="text-slate-800">#{{ wizard.info.projectId }}</span></span>
              <span class="block">Evaluation Area: <span class="text-slate-800">{{ wizard.info.area }}</span></span>
              <span class="block">Lead Assessor: <span class="text-slate-800">{{ wizard.info.assessor }}</span></span>
            </div>
            <div class="space-y-4 border-l border-slate-200 pl-4 text-xs font-semibold text-slate-600">
              <span class="block text-[10px] text-slate-400 tracking-wider uppercase font-bold">Hazards Aggregates</span>
              
              <div class="space-y-0.5">
                <span class="block text-slate-400 text-[10px] uppercase tracking-wider">Identified Hazards</span>
                <span class="text-slate-800 font-bold block">{{ wizard.hazards.length }} total hazards registered</span>
              </div>

              <div class="space-y-1 border-t border-slate-100 pt-2.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-brand-600 font-bold">Calculated Max Kinney Score:</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getKinneyRiskLevel(maxInitialScore).color">
                    {{ maxInitialScore }} ({{ getKinneyRiskLevel(maxInitialScore).name }})
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 font-normal leading-normal">
                  Worst-case risk score before applying controls. Matches the highest-scoring hazard you evaluated in Step 4.
                </p>
              </div>

              <div class="space-y-1 border-t border-slate-100 pt-2.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-success-600 font-bold">Mitigated Residual Max Kinney:</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getKinneyRiskLevel(maxResidualScore).color">
                    {{ maxResidualScore }} ({{ getKinneyRiskLevel(maxResidualScore).name }})
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 font-normal leading-normal">
                  Remaining risk score after applying mitigation multipliers (e.g. Elimination, Engineering) in Step 5.
                </p>
              </div>

              <!-- Risk Reduction Progress Bar -->
              <div class="space-y-1.5 border-t border-slate-100 pt-2.5" v-if="maxInitialScore > 0">
                <div class="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Overall Risk Level Decreased By:</span>
                  <span class="text-success-600 font-black">{{ riskReductionPercent }}%</span>
                </div>
                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                  <div class="bg-success-500 h-full rounded-full transition-all duration-500" :style="{ width: riskReductionPercent + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sign off publish button -->
          <div class="flex justify-end pt-2">
            <button
              @click="store.publishWizardAssessment"
              class="bg-success-600 hover:bg-success-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-success-600/10 flex items-center gap-1.5 transition-all hover:scale-102"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>Publish & Sign-off RI&E</span>
            </button>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm shrink-0">
          <button
            @click="wizard.step = Math.max(1, wizard.step - 1)"
            :disabled="wizard.step === 1"
            class="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>Back</span>
          </button>

          <div class="text-[10px] text-slate-400 font-bold hidden md:block">
            Step {{ wizard.step }} of 6
          </div>

          <button
            @click="wizard.step = Math.min(6, wizard.step + 1)"
            v-if="wizard.step < 6"
            :disabled="!isStepValid"
            class="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/10 flex items-center gap-1.5 transition-all"
          >
            <span>Next Step</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Methodology & Reference Companion Sidebar -->
      <div class="space-y-6 lg:col-span-1 lg:sticky lg:top-6 animate-fade-in">
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div class="border-b border-slate-50 pb-3 flex items-center gap-2">
            <div class="p-1.5 bg-brand-50 text-brand-600 rounded-lg">
              <Info class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Methodology Guide</h4>
              <p class="text-[10px] text-slate-400">Contextual helper for Step {{ wizard.step }}</p>
            </div>
          </div>

          <!-- Step 1 & 2: Setup Guidance -->
          <div v-if="wizard.step === 1 || wizard.step === 2" class="space-y-4 text-xs">
            <p class="text-slate-500 leading-relaxed">
              Before calculating risk, you must map the assessment context. Proper definitions here ensure the audit scope is clear.
            </p>
            <div class="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100/80">
              <div class="flex gap-2">
                <span class="text-brand-600 font-bold">🏢</span>
                <div>
                  <span class="font-bold text-slate-700 block">Site Mapping</span>
                  <span class="text-[11px] text-slate-500 block mt-0.5">Links identified hazards to an active physical location under audit.</span>
                </div>
              </div>
              <div class="flex gap-2 border-t border-slate-200/50 pt-2.5">
                <span class="text-brand-600 font-bold">🎯</span>
                <div>
                  <span class="font-bold text-slate-700 block">Area & Scope</span>
                  <span class="text-[11px] text-slate-500 block mt-0.5">Specifies localized work constraints, sub-contractors, and ambient operational risks.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Identify Hazards Guidance -->
          <div v-else-if="wizard.step === 3" class="space-y-4 text-xs">
            <p class="text-slate-500 leading-relaxed">
              A <strong>Hazard</strong> is a potential source of harm or adverse health effect. Identifying them is the foundation of risk mitigation.
            </p>
            <div class="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100/80">
              <div class="flex gap-2">
                <span class="text-brand-600 font-bold">⚠️</span>
                <div>
                  <span class="font-bold text-slate-700 block">Hazard vs Consequence</span>
                  <span class="text-[11px] text-slate-500 block mt-0.5">
                    <strong>Hazard:</strong> The source (e.g. wet floor).<br>
                    <strong>Consequence:</strong> The outcome (e.g. severe sprain from falling).
                  </span>
                </div>
              </div>
              <div class="flex gap-2 border-t border-slate-200/50 pt-2.5">
                <span class="text-brand-600 font-bold">📂</span>
                <div>
                  <span class="font-bold text-slate-700 block">Safety Categories</span>
                  <span class="text-[11px] text-slate-500 block mt-0.5">Grouping hazards (Chemical, Physical, Ergonomics, etc.) allows for better aggregate reporting later.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Kinney Scoring Guidance -->
          <div v-else-if="wizard.step === 4" class="space-y-4 text-xs">
            <div class="space-y-1">
              <span class="text-[10px] text-brand-600 font-bold tracking-wider uppercase block">Kinney Equation</span>
              <div class="bg-brand-500/5 text-brand-800 p-3 rounded-xl border border-brand-500/10 font-bold text-center flex items-center justify-center gap-1.5 text-[13px]">
                <span>L</span>
                <span class="text-slate-400 font-normal">×</span>
                <span>E</span>
                <span class="text-slate-400 font-normal">×</span>
                <span>S</span>
                <span class="text-slate-400 font-normal">=</span>
                <span class="text-brand-700">Score</span>
              </div>
            </div>

            <div class="space-y-2.5">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Scale References</span>
              <div class="grid grid-cols-3 gap-2 text-[10px] text-center">
                <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span class="font-bold text-slate-700 block text-[9px]">Likelihood (L)</span>
                  <span class="text-slate-400 block mt-0.5">0.1 - 10</span>
                  <span class="text-[8px] text-slate-500 block mt-1">1 = rare<br>10 = certain</span>
                </div>
                <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span class="font-bold text-slate-700 block text-[9px]">Exposure (E)</span>
                  <span class="text-slate-400 block mt-0.5">0.5 - 10</span>
                  <span class="text-[8px] text-slate-500 block mt-1">1 = yearly<br>10 = continuous</span>
                </div>
                <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span class="font-bold text-slate-700 block text-[9px]">Severity (S)</span>
                  <span class="text-slate-400 block mt-0.5">1 - 100</span>
                  <span class="text-[8px] text-slate-500 block mt-1">1 = minor<br>100 = death</span>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Finekin-Kinney Risk Bands</span>
              <div class="space-y-1.5 text-[10px] font-bold">
                <div class="flex items-center justify-between p-1.5 rounded border border-success-100 bg-success-50/50 text-success-800">
                  <span>Score &lt; 20</span>
                  <span>Low Risk</span>
                </div>
                <div class="flex items-center justify-between p-1.5 rounded border border-yellow-200 bg-yellow-50/50 text-yellow-800">
                  <span>Score 20 - 70</span>
                  <span>Medium Risk</span>
                </div>
                <div class="flex items-center justify-between p-1.5 rounded border border-orange-200 bg-orange-50/50 text-orange-800">
                  <span>Score 70 - 150</span>
                  <span>High Risk</span>
                </div>
                <div class="flex items-center justify-between p-1.5 rounded border border-red-200 bg-red-50/50 text-red-800">
                  <span>Score 150 - 320</span>
                  <span>Very High</span>
                </div>
                <div class="flex items-center justify-between p-1.5 rounded border border-purple-200 bg-purple-50/50 text-purple-800">
                  <span>Score &ge; 320</span>
                  <span>Critical Risk</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 5: Define Controls Guidance -->
          <div v-else-if="wizard.step === 5" class="space-y-4 text-xs">
            <div class="space-y-1">
              <span class="text-[10px] text-brand-600 font-bold tracking-wider uppercase block">Residual Risk Calculation</span>
              <p class="text-[11px] text-slate-500 leading-relaxed">
                Mitigation controls reduce **Likelihood** & **Exposure** by a specific factor. **Severity** remains constant.
              </p>
              <div class="bg-success-500/5 text-success-800 p-2.5 rounded-xl border border-success-500/10 font-mono text-[10px] space-y-1">
                <div>resLikelihood = L * Factor</div>
                <div>resExposure = E * Factor</div>
                <div class="font-bold border-t border-success-200/40 pt-1 mt-1 text-[11px] text-success-900 font-sans text-center">
                  Residual Score = resL * resE * S
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Control Hierarchy & Multipliers</span>
              <div class="space-y-2 text-[10px]">
                <div class="p-2 border border-emerald-100 bg-emerald-50/50 rounded-xl flex items-start gap-2.5">
                  <span class="text-sm">🟢</span>
                  <div>
                    <span class="font-bold text-emerald-800 block">Elimination (Factor: 0.1)</span>
                    <span class="text-slate-500 block mt-0.5">Physically remove danger. (90% reduction)</span>
                  </div>
                </div>
                <div class="p-2 border border-teal-100 bg-teal-50/50 rounded-xl flex items-start gap-2.5">
                  <span class="text-sm">🔵</span>
                  <div>
                    <span class="font-bold text-teal-800 block">Substitution (Factor: 0.2)</span>
                    <span class="text-slate-500 block mt-0.5">Replace with a safer alternative. (80% reduction)</span>
                  </div>
                </div>
                <div class="p-2 border border-blue-100 bg-blue-50/50 rounded-xl flex items-start gap-2.5">
                  <span class="text-sm">⚙️</span>
                  <div>
                    <span class="font-bold text-blue-800 block">Engineering (Factor: 0.4)</span>
                    <span class="text-slate-500 block mt-0.5">Physical barrier or guards. (60% reduction)</span>
                  </div>
                </div>
                <div class="p-2 border border-yellow-100 bg-yellow-50/30 rounded-xl flex items-start gap-2.5">
                  <span class="text-sm">📋</span>
                  <div>
                    <span class="font-bold text-yellow-800 block">Administrative (Factor: 0.6)</span>
                    <span class="text-slate-500 block mt-0.5">Procedures, training, signs. (40% reduction)</span>
                  </div>
                </div>
                <div class="p-2 border border-rose-100 bg-rose-50/30 rounded-xl flex items-start gap-2.5">
                  <span class="text-sm">🛡️</span>
                  <div>
                    <span class="font-bold text-rose-800 block">PPE (Factor: 0.8)</span>
                    <span class="text-slate-500 block mt-0.5">Worker gear (glasses, harness). (20% reduction)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 6: Review & Publish Guidance -->
          <div v-else-if="wizard.step === 6" class="space-y-4 text-xs">
            <p class="text-slate-500 leading-relaxed">
              Verify that the overall residual risk level is brought down to a safe range (&lt; 20 is target, &lt; 70 is acceptable).
            </p>
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100/80 space-y-2">
              <span class="font-bold text-slate-700 block">Publish Actions:</span>
              <ul class="list-disc list-inside text-[11px] text-slate-500 space-y-1">
                <li>Registers assessment into database.</li>
                <li>Pushes hazards to project risk registers.</li>
                <li>Recalculates project-wide max risk indexes.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
