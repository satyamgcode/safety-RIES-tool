<script setup>
import { ref, computed } from 'vue';
import { store } from '../store';
import {
  FileText,
  Upload,
  AlertTriangle,
  Flame,
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Trash2
} from 'lucide-vue-next';

// Stepper State
const currentStep = ref(1);

// Step 1 Form Data
const form = ref({
  name: '',
  manufacturer: '',
  supplier: '',
  productCode: '',
  casNumber: '',
  site: 'Test Project 1',
  location: '',
  quantity: '',
  unit: 'L',
  usedFor: ''
});

// Step 2 Form Data (SDS & GHS)
const sdsData = ref({
  fileName: 'Manual Record',
  version: '',
  issueDate: '',
  revisionDate: '',
  nextReviewDate: '',
  status: 'Current'
});
const hazards = ref({
  pictograms: [],
  signalWord: '',
  statements: '',
  classes: ''
});

// Step 3 Form Data (Usage & Safety)
const storageRequirements = ref([
  { id: 'ignition', text: 'Keep away from ignition', checked: true },
  { id: 'closed', text: 'Keep container closed', checked: true },
  { id: 'ventilated', text: 'Ventilated area', checked: true }
]);
const usageMethod = ref('Roller'); // Brush, Roller, Spray, Other
const exposureRoutes = ref([
  { id: 'skin', text: 'Skin', checked: true },
  { id: 'inhalation', text: 'Inhalation', checked: true },
  { id: 'eye', text: 'Eye', checked: false }
]);
const ppeRequirements = ref([
  { id: 'gloves', text: 'Gloves', checked: true },
  { id: 'glasses', text: 'Safety glasses', checked: true },
  { id: 'respiratory', text: 'Respiratory protection', checked: false },
  { id: 'clothing', text: 'Protective clothing', checked: false }
]);
const basicControlsText = ref('Use in ventilated area. Avoid skin contact. Keep away from ignition sources.');

const selectPictogram = (pic) => {
  if (hazards.value.pictograms.includes(pic)) {
    hazards.value.pictograms = hazards.value.pictograms.filter(p => p !== pic);
  } else {
    hazards.value.pictograms.push(pic);
  }
};

// Wizard validation & navigation
const nextStep = () => {
  if (currentStep.value === 1) {
    if (!form.value.name || !form.value.manufacturer || !form.value.location || !form.value.quantity || !form.value.usedFor) {
      store.addToast('Please fill out all required fields (*)', 'error');
      return;
    }
  }
  if (currentStep.value === 2) {
    if (!sdsData.value.version || !sdsData.value.revisionDate || !sdsData.value.nextReviewDate) {
      store.addToast('Please fill in required SDS details (Version, Revision Date, Next Review)', 'error');
      return;
    }
  }
  currentStep.value++;
};

const prevStep = () => {
  currentStep.value--;
};

// Save wizard
const saveSubstance = () => {
  // Collect all checklists
  const storageReqs = storageRequirements.value.filter(r => r.checked).map(r => r.text);
  const routes = exposureRoutes.value.filter(r => r.checked).map(r => r.text);
  const ppe = ppeRequirements.value.filter(r => r.checked).map(r => r.text);

  // Split hazards arrays
  const parsedStatements = hazards.value.statements ? hazards.value.statements.split(',').map(s => s.trim()) : [];
  const parsedClasses = hazards.value.classes ? hazards.value.classes.split(',').map(c => c.trim()) : [];

  const substanceData = {
    name: form.value.name,
    manufacturer: form.value.manufacturer,
    supplier: form.value.supplier,
    productCode: form.value.productCode,
    casNumber: form.value.casNumber,
    site: form.value.site,
    location: form.value.location,
    quantity: form.value.quantity,
    unit: form.value.unit,
    usedFor: form.value.usedFor,
    sds: {
      fileName: 'Manual Record',
      version: sdsData.value.version,
      issueDate: sdsData.value.issueDate,
      revisionDate: sdsData.value.revisionDate,
      nextReviewDate: sdsData.value.nextReviewDate,
      status: 'Current',
      history: []
    },
    hazards: {
      pictograms: hazards.value.pictograms,
      signalWord: hazards.value.signalWord,
      statements: parsedStatements,
      classes: parsedClasses
    },
    storage: { requirements: storageReqs },
    exposure: { methods: [usageMethod.value], routes: routes },
    ppe: ppe,
    basicControls: basicControlsText.value,
    riskAssessment: {
      status: 'Required',
      hazard: 'Vapour inhalation',
      likelihood: null,
      severity: null,
      riskScore: null,
      riskLevel: null,
      existingControls: ['Ventilation', ...ppe],
      additionalControls: [],
      residualRisk: { likelihood: null, severity: null, riskScore: null, riskLevel: null }
    }
  };

  const newSub = store.addSubstance(substanceData);
  store.navigateTo('haz-substances-assessment', { substanceId: newSub.id });
};

// GHS H-Code Library Search and Selector Logic
const showHCodeLibraryModal = ref(false);
const searchHQuery = ref('');
const tempSelectedHCodes = ref([]);

const openHCodeLibrary = () => {
  const currentCodes = hazards.value.statements
    ? hazards.value.statements.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    : [];
  tempSelectedHCodes.value = [...currentCodes];
  searchHQuery.value = '';
  showHCodeLibraryModal.value = true;
};

const filteredHCodesList = computed(() => {
  const query = searchHQuery.value.trim().toLowerCase();
  if (!query) return store.standardHCodes;
  return store.standardHCodes.filter(item => 
    item.code.toLowerCase().includes(query) || 
    item.label.toLowerCase().includes(query) ||
    item.type.toLowerCase().includes(query)
  );
});

const toggleTempHCodeSelection = (code) => {
  if (tempSelectedHCodes.value.includes(code)) {
    tempSelectedHCodes.value = tempSelectedHCodes.value.filter(c => c !== code);
  } else {
    tempSelectedHCodes.value.push(code);
  }
};

const applyHCodeSelection = () => {
  hazards.value.statements = tempSelectedHCodes.value.join(', ');
  // Auto-fill Hazard Classes if blank
  const matchedTypes = tempSelectedHCodes.value.map(code => {
    const item = store.standardHCodes.find(h => h.code === code);
    return item ? `${item.type} hazard` : '';
  }).filter((v, i, self) => v && self.indexOf(v) === i);
  
  if (matchedTypes.length > 0 && !hazards.value.classes) {
    hazards.value.classes = matchedTypes.join(', ');
  }
  showHCodeLibraryModal.value = false;
  store.addToast('GHS H-Codes applied successfully.', 'success');
};

// GHS symbols helpers
const pictogramsList = [
  { id: 'GHS02', char: '🔥', name: 'GHS02 — Flammable', desc: 'Flammable liquids, gases, aerosols, solids, pyrophorics' },
  { id: 'GHS05', char: '🧪', name: 'GHS05 — Corrosive', desc: 'Skin corrosion/burns, serious eye damage, metal corrosion' },
  { id: 'GHS06', char: '☠️', name: 'GHS06 — Toxic', desc: 'Acute toxicity (fatal or severe danger if inhaled/swallowed)' },
  { id: 'GHS07', char: '⚠️', name: 'GHS07 — Harmful / Irritant', desc: 'Skin/eye irritation, skin sensitizer, acute toxicity, narcotic effects' },
  { id: 'GHS08', char: '👤', name: 'GHS08 — Health Hazard', desc: 'Carcinogenicity, respiratory sensitizer, reproductive toxicity, organ toxicity' },
  { id: 'GHS09', char: '🌿', name: 'GHS09 — Environmental', desc: 'Acute or chronic hazards to the aquatic environment' }
];
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight font-sans">Add Substance</h1>
        <p class="text-xs text-slate-500 mt-1">Register a new hazardous product used on-site and structure its SDS controls.</p>
      </div>
      <button
        @click="store.navigateTo('haz-substances-overview')"
        class="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
      >
        Cancel & Back
      </button>
    </div>

    <!-- Stepper indicator -->
    <div class="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between select-none">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
          :class="currentStep >= 1 ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/10' : 'bg-slate-100 text-slate-400'"
        >
          <span v-if="currentStep > 1"><Check class="w-4 h-4" /></span>
          <span v-else>1</span>
        </div>
        <span class="text-xs font-bold" :class="currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'">Product</span>
      </div>

      <div class="flex-1 h-px bg-slate-100 mx-4"></div>

      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
          :class="currentStep >= 2 ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/10' : 'bg-slate-100 text-slate-400'"
        >
          <span v-if="currentStep > 2"><Check class="w-4 h-4" /></span>
          <span v-else>2</span>
        </div>
        <span class="text-xs font-bold" :class="currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'">SDS & Hazards</span>
      </div>

      <div class="flex-1 h-px bg-slate-100 mx-4"></div>

      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
          :class="currentStep >= 3 ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/10' : 'bg-slate-100 text-slate-400'"
        >
          <span>3</span>
        </div>
        <span class="text-xs font-bold" :class="currentStep >= 3 ? 'text-slate-800' : 'text-slate-400'">Usage & Safety</span>
      </div>
    </div>

    <!-- Wizard Steps Card -->
    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      
      <!-- STEP 1: PRODUCT INFO -->
      <div v-if="currentStep === 1" class="space-y-4">
        <div class="border-b border-slate-50 pb-3">
          <h3 class="text-base font-extrabold text-slate-800">Product / Chemical Information</h3>
          <p class="text-xs text-slate-400">Specify core identifiers, site allocation, and tracking quantities.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Substance Name -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Product / Substance Name *</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Bitumen Primer"
              class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
            />
          </div>

          <!-- Manufacturer -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Manufacturer *</label>
            <input
              v-model="form.manufacturer"
              type="text"
              placeholder="e.g. Soprema"
              class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
            />
          </div>

          <!-- Supplier -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Supplier</label>
            <input
              v-model="form.supplier"
              type="text"
              placeholder="e.g. Soprema Supply"
              class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
            />
          </div>

          <!-- Product Code -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Product Code</label>
            <input
              v-model="form.productCode"
              type="text"
              placeholder="e.g. SOP-BP-20"
              class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
            />
          </div>

          <!-- CAS number -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">CAS Number</label>
            <input
              v-model="form.casNumber"
              type="text"
              placeholder="e.g. 64742-95-6"
              class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
            />
          </div>

          <!-- Site location -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Site *</label>
            <input
              v-model="form.site"
              type="text"
              disabled
              class="bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
            />
          </div>

          <!-- Location -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Location *</label>
            <input
              v-model="form.location"
              type="text"
              placeholder="e.g. Paint Store"
              class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
            />
          </div>

          <!-- Quantity / Unit -->
          <div class="grid grid-cols-3 gap-2">
            <div class="col-span-2 flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Quantity *</label>
              <input
                v-model="form.quantity"
                type="number"
                placeholder="20"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
              />
            </div>
            <div class="flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 tracking-wider mb-1 uppercase">Unit *</label>
              <select
                v-model="form.unit"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-600 focus:outline-hidden transition-colors"
              >
                <option value="L">L</option>
                <option value="bags">bags</option>
                <option value="kg">kg</option>
                <option value="drums">drums</option>
                <option value="canisters">canisters</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Used for -->
        <div class="flex flex-col">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Used For *</label>
          <input
            v-model="form.usedFor"
            type="text"
            placeholder="e.g. Surface preparation"
            class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
          />
        </div>
      </div>

      <!-- STEP 2: SDS & HAZARDS -->
      <div v-if="currentStep === 2" class="space-y-6">
        <div class="border-b border-slate-50 pb-3">
          <h3 class="text-base font-extrabold text-slate-800">Safety Data Sheet (SDS) & Hazards</h3>
          <p class="text-xs text-slate-400">Specify the manufacturer SDS parameters and chemical hazards manually.</p>
        </div>

        <!-- SDS Form details (Always visible, manually filled) -->
        <div class="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <div class="border-b border-slate-100 pb-2 flex items-center justify-between">
            <span class="text-xs font-extrabold text-slate-800">Supplier Safety Data Sheet Dates</span>
            <span class="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-extrabold rounded-full uppercase">
              Manual Entry
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div class="flex flex-col">
              <label class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">SDS Version *</label>
              <input
                v-model="sdsData.version"
                type="text"
                placeholder="e.g. 4.0"
                class="bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-brand-500 transition-colors"
              />
            </div>
            <div class="flex flex-col">
              <label class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Issue Date</label>
              <input
                v-model="sdsData.issueDate"
                type="date"
                class="bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-brand-500 transition-colors"
              />
            </div>
            <div class="flex flex-col">
              <label class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Revision Date *</label>
              <input
                v-model="sdsData.revisionDate"
                type="date"
                class="bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-brand-500 transition-colors"
              />
            </div>
            <div class="flex flex-col">
              <label class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Next Review *</label>
              <input
                v-model="sdsData.nextReviewDate"
                type="date"
                class="bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-brand-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <!-- Hazard Information (GHS) Section -->
        <div class="space-y-4 border-t border-slate-50 pt-4">
          <div>
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">GHS / Hazard Information</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">Please confirm or enter the classification details from the SDS sheets.</p>
          </div>

          <!-- Hazard pictograms checkboxes with chemical descriptions -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">Hazard Pictograms (Confirm from SDS Label)</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                v-for="pic in pictogramsList"
                :key="pic.id"
                type="button"
                @click="selectPictogram(pic.id)"
                class="flex items-start text-left gap-3 p-3 rounded-xl border text-xs transition-all cursor-pointer"
                :class="[
                  hazards.pictograms.includes(pic.id)
                    ? 'bg-orange-50/75 border-orange-200 text-orange-950 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50'
                ]"
              >
                <span class="text-xl p-1 bg-white rounded-lg border border-slate-100 shadow-xs shrink-0 select-none">{{ pic.char }}</span>
                <div>
                  <span class="font-extrabold block text-[11px]">{{ pic.name }}</span>
                  <span class="text-[9px] text-slate-400 font-semibold leading-relaxed mt-0.5 block">{{ pic.desc }}</span>
                </div>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Signal word -->
            <div class="flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Signal Word</label>
              <select
                v-model="hazards.signalWord"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-600 focus:outline-hidden transition-colors"
              >
                <option value="">None / N/A</option>
                <option value="Danger">Danger</option>
                <option value="Warning">Warning</option>
              </select>
            </div>

            <!-- Source: supplier label -->
            <div class="flex flex-col justify-end">
              <div class="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Source:</span>
                <span class="text-[10px] font-bold text-slate-600 ml-1.5">Supplier SDS Label</span>
              </div>
            </div>

            <!-- Hazard statements -->
            <div class="flex flex-col">
              <div class="flex items-center justify-between mb-1">
                <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hazard Statements (H-codes) *</label>
                <button
                  type="button"
                  @click="openHCodeLibrary"
                  class="text-[9px] font-extrabold text-brand-600 hover:text-brand-800 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  🔍 Browse H-Code Library
                </button>
              </div>
              <input
                v-model="hazards.statements"
                type="text"
                placeholder="e.g. H226, H315, H336"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
              />
              <span class="text-[9px] text-slate-400 mt-1.5 block leading-normal">
                💡 Standardized GHS warning codes found in <strong>Section 2 (Hazards Identification)</strong> of your product's supplier SDS sheet (e.g. H226, H315).
              </span>
            </div>

            <!-- Hazard classes -->
            <div class="flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Hazard Classes / Keywords</label>
              <input
                v-model="hazards.classes"
                type="text"
                placeholder="e.g. Flammable, Skin irritation"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
              />
              <span class="text-[9px] text-slate-400 mt-1 block">Comma-separated hazard classifications</span>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 3: USAGE & SAFETY -->
      <div v-if="currentStep === 3" class="space-y-6">
        <div class="border-b border-slate-50 pb-3">
          <h3 class="text-base font-extrabold text-slate-800">Usage & Exposure Controls</h3>
          <p class="text-xs text-slate-400">Record storage parameters, usage exposure routes, required PPE, and basic control instructions.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Storage requirements -->
          <div class="space-y-3">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Storage Requirements</h4>
            <div class="space-y-2">
              <label
                v-for="req in storageRequirements"
                :key="req.id"
                class="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer select-none text-xs font-semibold text-slate-600 hover:bg-slate-100/50 transition-colors"
              >
                <input
                  type="checkbox"
                  v-model="req.checked"
                  class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span>{{ req.text }}</span>
              </label>
            </div>
          </div>

          <!-- Exposure routes -->
          <div class="space-y-3">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Exposure Routes</h4>
            <div class="space-y-2">
              <label
                v-for="route in exposureRoutes"
                :key="route.id"
                class="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer select-none text-xs font-semibold text-slate-600 hover:bg-slate-100/50 transition-colors"
              >
                <input
                  type="checkbox"
                  v-model="route.checked"
                  class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span>{{ route.text }}</span>
              </label>
            </div>
          </div>

          <!-- Application method -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">How is it used? (Method)</label>
            <select
              v-model="usageMethod"
              class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-600 focus:outline-hidden transition-colors"
            >
              <option value="Brush">Brush</option>
              <option value="Roller">Roller</option>
              <option value="Spray">Spray</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <!-- Required PPE -->
          <div class="space-y-3 sm:col-span-2">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Required PPE</h4>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="ppe in ppeRequirements"
                :key="ppe.id"
                class="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer select-none text-xs font-semibold text-slate-600 hover:bg-slate-100/50 transition-colors"
              >
                <input
                  type="checkbox"
                  v-model="ppe.checked"
                  class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span>{{ ppe.text }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Basic Controls -->
        <div class="flex flex-col">
          <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Basic Controls & Safety Precautions</label>
          <textarea
            v-model="basicControlsText"
            rows="3"
            placeholder="Describe standard precautions..."
            class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
          ></textarea>
        </div>
      </div>

    </div>

    <!-- Actions navigation footer -->
    <div class="flex items-center justify-between">
      <button
        v-if="currentStep > 1"
        type="button"
        @click="prevStep"
        class="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Back</span>
      </button>
      <div v-else></div>

      <button
        v-if="currentStep < 3"
        type="button"
        @click="nextStep"
        class="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-500/10 cursor-pointer"
      >
        <span>Next</span>
        <ArrowRight class="w-4 h-4" />
      </button>

      <button
        v-else
        type="button"
        @click="saveSubstance"
        class="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-brand-500/10 cursor-pointer"
      >
        <CheckCircle2 class="w-4 h-4" />
        <span>Save & Create Risk Assessment</span>
      </button>
    </div>

    <!-- GHS H-CODE LIBRARY MODAL -->
    <div v-if="showHCodeLibraryModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4 animate-scale-in flex flex-col max-h-[85vh]">
        <div class="flex items-center justify-between border-b border-slate-50 pb-3 shrink-0">
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>GHS Hazard Statements (H-Codes) Library</span>
            </h3>
            <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Select warning codes to append to the product record.</p>
          </div>
          <button @click="showHCodeLibraryModal = false" class="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
            Close
          </button>
        </div>

        <!-- Search bar -->
        <div class="relative shrink-0">
          <input
            v-model="searchHQuery"
            type="text"
            placeholder="Search codes or terms (e.g. flammable, toxicity, H315)..."
            class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl pl-3 pr-10 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
          />
        </div>

        <!-- H-Code list -->
        <div class="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
          <div
            v-for="item in filteredHCodesList"
            :key="item.code"
            @click="toggleTempHCodeSelection(item.code)"
            class="flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer text-xs font-semibold"
            :class="[
              tempSelectedHCodes.includes(item.code)
                ? 'bg-brand-50/50 border-brand-200 text-brand-950 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50'
            ]"
          >
            <input
              type="checkbox"
              :checked="tempSelectedHCodes.includes(item.code)"
              class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 mt-0.5"
              @click.stop="toggleTempHCodeSelection(item.code)"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-slate-800">{{ item.code }}</span>
                <span
                  class="px-1.5 py-0.2 bg-white border text-[8px] font-bold rounded uppercase tracking-wider"
                  :class="[
                    item.type === 'Physical' ? 'text-red-700 border-red-100 bg-red-50/30' : '',
                    item.type === 'Health' ? 'text-amber-700 border-amber-100 bg-amber-50/30' : '',
                    item.type === 'Environmental' ? 'text-emerald-700 border-emerald-100 bg-emerald-50/30' : ''
                  ]"
                >
                  {{ item.type }}
                </span>
              </div>
              <p class="text-[10px] text-slate-400 block mt-1 leading-normal font-semibold">{{ item.label }}</p>
            </div>
          </div>
          <div v-if="filteredHCodesList.length === 0" class="py-12 text-center text-slate-400 italic text-xs">
            No hazard codes match your search query.
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center justify-between border-t border-slate-50 pt-3 shrink-0">
          <span class="text-[10px] font-bold text-slate-400">
            Selected: <span class="text-brand-600 font-extrabold">{{ tempSelectedHCodes.length }} codes</span>
          </span>
          <div class="flex items-center gap-2">
            <button
              @click="showHCodeLibraryModal = false"
              class="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              @click="applyHCodeSelection"
              class="bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Confirm & Add
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
