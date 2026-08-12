<script setup>
import { ref } from 'vue';
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
const isSdsUploaded = ref(false);
const isSdsSkipped = ref(false);
const isUploading = ref(false);
const sdsData = ref({
  fileName: '',
  version: '1.0',
  issueDate: '',
  revisionDate: '',
  nextReviewDate: '',
  status: 'Missing'
});
const hazards = ref({
  pictograms: [],
  signalWord: 'Danger',
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

// Simulate Upload SDS
const triggerSdsUpload = () => {
  isUploading.value = true;
  isSdsSkipped.value = false;
  
  setTimeout(() => {
    isUploading.value = false;
    isSdsUploaded.value = true;
    sdsData.value = {
      fileName: 'Bitumen-Primer-SDS.pdf',
      version: '4.0',
      issueDate: '2026-08-01',
      revisionDate: '2026-08-10',
      nextReviewDate: '2027-08-10',
      status: 'Current'
    };
    // Prefill hazards classification from Soprema SDS
    hazards.value = {
      pictograms: ['GHS02', 'GHS07', 'GHS09'],
      signalWord: 'Danger',
      statements: 'H226, H315, H336',
      classes: 'Flammable, Skin irritation, Environmental hazard'
    };
    store.addToast('SDS Uploaded! Fields populated from Bitumen-Primer-SDS.pdf.', 'success');
  }, 900);
};

const skipSds = () => {
  isSdsSkipped.value = true;
  isSdsUploaded.value = false;
  sdsData.value = {
    fileName: '',
    version: '',
    issueDate: '',
    revisionDate: '',
    nextReviewDate: '',
    status: 'Missing'
  };
  hazards.value = {
    pictograms: [],
    signalWord: '',
    statements: '',
    classes: ''
  };
  store.addToast('SDS Skipped. Upload will be required for full approval.', 'warning');
};

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
    if (!isSdsUploaded.value && !isSdsSkipped.value) {
      store.addToast('Please upload the SDS sheet or skip for now', 'error');
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
      fileName: sdsData.value.fileName,
      version: sdsData.value.version,
      issueDate: sdsData.value.issueDate,
      revisionDate: sdsData.value.revisionDate,
      nextReviewDate: sdsData.value.nextReviewDate,
      status: isSdsSkipped.value ? 'Missing' : sdsData.value.status,
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
  
  // Navigate straight to Risk Assessment for this newly created substance
  store.navigateTo('haz-substances-assessment', { substanceId: newSub.id });
};

// GHS symbols helpers
const pictogramsList = [
  { id: 'GHS02', char: '🔥', name: 'GHS02 Flammable' },
  { id: 'GHS05', char: '🧪', name: 'GHS05 Corrosive' },
  { id: 'GHS06', char: '☠️', name: 'GHS06 Toxic' },
  { id: 'GHS07', char: '⚠️', name: 'GHS07 Irritant' },
  { id: 'GHS08', char: '👤', name: 'GHS08 Health' },
  { id: 'GHS09', char: '🌿', name: 'GHS09 Environment' }
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
          <p class="text-xs text-slate-400">Upload the supplier's Safety Data Sheet to automatically parse GHS hazard criteria.</p>
        </div>

        <div class="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <Upload class="w-8 h-8 text-slate-400 mb-3" />
          <p class="text-xs font-semibold text-slate-600 mb-1">Upload the latest Safety Data Sheet provided by the manufacturer or supplier.</p>
          <p class="text-[10px] text-slate-400 mb-4">Supports PDF files up to 10MB</p>
          
          <div class="flex flex-wrap gap-2.5 justify-center">
            <button
              type="button"
              @click="triggerSdsUpload"
              :disabled="isUploading"
              class="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <span v-if="isUploading">Parsing SDS...</span>
              <span v-else>Upload SDS PDF</span>
            </button>
            <button
              type="button"
              @click="skipSds"
              class="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>

        <!-- SDS upload status -->
        <div v-if="isSdsUploaded" class="bg-success-50/50 border border-success-100 p-4 rounded-xl flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <CheckCircle2 class="w-5 h-5 text-success" />
            <div>
              <h5 class="text-xs font-bold text-slate-700">{{ sdsData.fileName }}</h5>
              <span class="text-[10px] text-slate-400 font-semibold block mt-0.5">
                Version: {{ sdsData.version }} | Issue Date: {{ sdsData.issueDate }} | Rev Date: {{ sdsData.revisionDate }}
              </span>
            </div>
          </div>
          <span class="px-2 py-0.5 bg-success-100 border border-success-200 text-success-800 text-[9px] font-extrabold rounded-full">
            🟢 Current
          </span>
        </div>

        <!-- SDS Warning prompt -->
        <div v-if="isSdsSkipped" class="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h5 class="text-xs font-bold text-red-800">SDS Skip Warning</h5>
            <p class="text-[10px] text-red-600 font-medium mt-0.5 leading-relaxed">
              SDS is required before the substance can be fully approved. Substance status will remain draft or restricted.
            </p>
          </div>
        </div>

        <!-- Hazard Information (GHS) Section -->
        <div v-if="isSdsUploaded || isSdsSkipped" class="space-y-4 border-t border-slate-50 pt-4">
          <div>
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">GHS / Hazard Information</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">Please confirm or enter the classification details from the SDS sheets.</p>
          </div>

          <!-- Hazard pictograms checkboxes -->
          <div class="flex flex-col">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Hazard Pictograms</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="pic in pictogramsList"
                :key="pic.id"
                type="button"
                @click="selectPictogram(pic.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all"
                :class="[
                  hazards.pictograms.includes(pic.id)
                    ? 'bg-orange-50 border-orange-200 text-orange-800'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                ]"
              >
                <span class="text-sm">{{ pic.char }}</span>
                <span class="text-[10px] font-semibold">{{ pic.id }}</span>
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
                <span class="text-[10px] font-bold text-slate-600 ml-1.5">Supplier SDS</span>
              </div>
            </div>

            <!-- Hazard statements -->
            <div class="flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Hazard Statements (H-codes)</label>
              <input
                v-model="hazards.statements"
                type="text"
                placeholder="e.g. H226, H315, H336"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
              />
              <span class="text-[9px] text-slate-400 mt-1 block">Comma-separated H-codes</span>
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
  </div>
</template>
