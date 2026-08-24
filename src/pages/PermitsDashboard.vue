<script setup>
import { ref, computed, watch } from 'vue';
import { store } from '../store';
import {
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  AlertTriangle,
  Calendar,
  X,
  Briefcase,
  User,
  MapPin,
  Check,
  FileCheck,
  Shield,
  Layers,
  CheckCircle
} from 'lucide-vue-next';

// Filter states
const selectedProjectFilter = ref('all');
const selectedStatusFilter = ref('all');
const searchQuery = ref('');

// Computed KPIs
const kpis = computed(() => {
  const list = store.permits || [];
  return {
    active: list.filter(p => p.status === 'Active').length,
    awaiting: list.filter(p => p.status === 'Awaiting Approval').length,
    expired: list.filter(p => p.status === 'Expired').length,
    total: list.length
  };
});

// Filtered Permits list
const filteredPermits = computed(() => {
  let list = store.permits || [];

  if (selectedProjectFilter.value !== 'all') {
    list = list.filter(p => p.projectId === parseInt(selectedProjectFilter.value, 10));
  }

  if (selectedStatusFilter.value !== 'all') {
    list = list.filter(p => p.status === selectedStatusFilter.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.type.toLowerCase().includes(q) || 
      (p.location && p.location.toLowerCase().includes(q))
    );
  }

  return list;
});

// Wizard modal states
const isWizardOpen = ref(false);
const currentStep = ref(1);

const defaultWizard = () => ({
  type: 'Hot Work',
  title: '',
  projectId: 1,
  location: '',
  requestedBy: 'M. de Vries',
  validFrom: new Date().toISOString().split('T')[0],
  validTo: new Date().toISOString().split('T')[0],
  holderId: null, // Start as unassigned by default
  requiredCertificateIds: ['vca-b'],
  precautions: [],
  approvedBy: 'L. Hofman'
});

const wizardData = ref(defaultWizard());
const customPrecautionText = ref('');

// Reset wizard
const openWizard = () => {
  wizardData.value = defaultWizard();
  currentStep.value = 1;
  loadDefaultPrecautions();
  isWizardOpen.value = true;
};

const closeWizard = () => {
  isWizardOpen.value = false;
};

// Auto load standard precautions based on type
const loadDefaultPrecautions = () => {
  const type = wizardData.value.type;
  let items = [];
  if (type === 'Hot Work') {
    items = [
      'Remove all combustible materials within 15 meters.',
      'Post a trained fire watch with a suitable extinguisher.',
      'Conduct gas testing for flammable vapors before starting.'
    ];
  } else if (type === 'Confined Space') {
    items = [
      'Verify isolation of all energy sources and process lines (LOTO).',
      'Perform continuous atmospheric monitoring (Oxygen, LEL, Toxic gases).',
      'Appoint a standby person outside the space at all times.'
    ];
  } else if (type === 'Heights' || type === 'working on heights') {
    items = [
      'Inspect full-body safety harnesses and shock-absorbing lanyards.',
      'Verify secure anchor points capable of supporting 15kN.',
      'Ensure perimeter edge protection or safety netting is installed.'
    ];
  } else if (type === 'Electrical') {
    items = [
      'Verify Lockout/Tagout (LOTO) isolation at the energy source.',
      'Conduct voltage testing to verify a zero-energy state.',
      'Use properly rated insulated hand tools.'
    ];
  } else if (type === 'Excavation') {
    items = [
      'Scan excavation area for underground utilities before digging.',
      'Install shoring or slope trench walls in accordance with depth rules.',
      'Ensure ladders are placed within 7.5 meters of lateral travel.'
    ];
  } else if (type === 'Lifting') {
    items = [
      'Verify crane/hoist load charts and rigging safety certificates.',
      'Establish an exclusion zone and post warning signs.',
      'Review and sign off the lift plan with all crew members.'
    ];
  } else {
    items = [
      'Review Risk Assessment / Job Safety Analysis instructions.',
      'Wear standard PPE (hard hat, safety boots, high-visibility vest).'
    ];
  }
  wizardData.value.precautions = items.map(text => ({ description: text, confirmed: false }));
};

// Watch type change to update precautions and cert requirements
watch(() => wizardData.value.type, (newType) => {
  loadDefaultPrecautions();
  // Auto-select sensible certificates based on type
  if (newType === 'Hot Work') {
    wizardData.value.requiredCertificateIds = ['vca-b'];
  } else if (newType === 'Confined Space') {
    wizardData.value.requiredCertificateIds = ['vca-b', 'bhv'];
  } else if (newType === 'Heights') {
    wizardData.value.requiredCertificateIds = ['vca-b', 'heights'];
  } else if (newType === 'Electrical') {
    wizardData.value.requiredCertificateIds = ['nen3140'];
  } else {
    wizardData.value.requiredCertificateIds = ['vca-b'];
  }
});

// Add custom precaution
const addCustomPrecaution = () => {
  if (customPrecautionText.value.trim()) {
    wizardData.value.precautions.push({
      description: customPrecautionText.value.trim(),
      confirmed: false
    });
    customPrecautionText.value = '';
  }
};

// Remove precaution
const removePrecaution = (index) => {
  wizardData.value.precautions.splice(index, 1);
};

// Check certificate validation for wizard holder
const verifyCertificate = (certTypeId) => {
  if (!wizardData.value.holderId) return { status: 'Missing', name: certTypeId };
  const holderId = parseInt(wizardData.value.holderId, 10);
  const type = store.certificateTypes.find(t => t.id === certTypeId);
  if (!type) return { status: 'Missing', name: certTypeId };

  const certs = store.certificates.filter(c => c.employeeId === holderId && (c.typeId === certTypeId || (store.certificateTypes.find(t => t.id === c.typeId)?.satisfies === certTypeId)));
  
  if (certs.length === 0) {
    return { status: 'Missing', name: type.name };
  }

  // Check if any is valid
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let hasValid = false;
  let hasExpiring = false;
  let expiredCert = null;

  for (const c of certs) {
    const expiry = new Date(c.expiresOn);
    expiry.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0) {
      if (diffDays <= 90) {
        hasExpiring = true;
      } else {
        hasValid = true;
      }
    } else {
      expiredCert = c;
    }
  }

  if (hasValid) return { status: 'Valid', name: type.name };
  if (hasExpiring) return { status: 'Expiring', name: type.name };
  return { status: 'Expired', name: type.name, expiredOn: expiredCert?.expiresOn };
};

// Verify if the holder has any warnings
const complianceIssuesCount = computed(() => {
  if (!wizardData.value.holderId) return 0;
  let count = 0;
  wizardData.value.requiredCertificateIds.forEach(id => {
    const verification = verifyCertificate(id);
    if (verification.status === 'Missing' || verification.status === 'Expired') {
      count++;
    }
  });
  return count;
});

// Navigate wizard steps
const nextStep = () => {
  if (currentStep.value === 1) {
    if (!wizardData.value.title.trim()) {
      store.addToast('Please enter a permit title.', 'error');
      return;
    }
    if (!wizardData.value.location.trim()) {
      store.addToast('Please enter a location.', 'error');
      return;
    }
  }
  if (currentStep.value === 3) {
    if (wizardData.value.precautions.length === 0) {
      store.addToast('Please define at least one precaution/condition.', 'warning');
    }
  }
  if (currentStep.value < 4) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// Create the Permit
const submitWizard = () => {
  const data = {
    ...wizardData.value,
    precautions: wizardData.value.precautions.map(p => p.description)
  };
  store.addPermit(data);
  closeWizard();
};

const getConditionsCheckedCount = (permit) => {
  return permit.precautions.filter(p => p.confirmed).length;
};

// Assign Permit Modal State
const isAssignModalOpen = ref(false);
const assignmentData = ref({
  permitId: '',
  employeeId: ''
});

const openAssignModal = () => {
  assignmentData.value.permitId = '';
  assignmentData.value.employeeId = '';
  isAssignModalOpen.value = true;
};

const closeAssignModal = () => {
  isAssignModalOpen.value = false;
};

const submitAssignment = () => {
  if (!assignmentData.value.permitId || !assignmentData.value.employeeId) return;
  store.assignPermit(assignmentData.value.permitId, assignmentData.value.employeeId);
  closeAssignModal();
};

const verifyCertForAssign = (certTypeId) => {
  const holderId = parseInt(assignmentData.value.employeeId, 10);
  const type = store.certificateTypes.find(t => t.id === certTypeId);
  if (!type) return { status: 'Missing', name: certTypeId };

  const certs = store.certificates.filter(c => c.employeeId === holderId && (c.typeId === certTypeId || (store.certificateTypes.find(t => t.id === c.typeId)?.satisfies === certTypeId)));
  
  if (certs.length === 0) {
    return { status: 'Missing', name: type.name };
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  
  let hasValid = false;
  let hasExpiring = false;
  let expiredCert = null;

  for (const c of certs) {
    const expiry = new Date(c.expiresOn);
    expiry.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0) {
      if (diffDays <= 90) {
        hasExpiring = true;
      } else {
        hasValid = true;
      }
    } else {
      expiredCert = c;
    }
  }

  if (hasValid) return { status: 'Valid', name: type.name };
  if (hasExpiring) return { status: 'Expiring', name: type.name };
  return { status: 'Expired', name: type.name, expiredOn: expiredCert?.expiresOn };
};

const assignComplianceIssuesCount = computed(() => {
  const permit = store.permits.find(p => p.id === parseInt(assignmentData.value.permitId, 10));
  if (!permit || !assignmentData.value.employeeId) return 0;
  let count = 0;
  permit.requiredCertificateIds.forEach(id => {
    const verification = verifyCertForAssign(id);
    if (verification.status === 'Missing' || verification.status === 'Expired') {
      count++;
    }
  });
  return count;
});
</script>

<template>
  <div class="space-y-8 font-sans">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Permit to work</h1>
        <p class="text-xs font-medium text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Authorisations for high-risk activities (hot work, confined space, height, excavation, electrical, lifting) across all projects
        </p>
      </div>
      
      <!-- Top Action Group -->
      <div class="flex items-center gap-3">
        <!-- Assign Permit Trigger Button -->
        <button 
          @click="openAssignModal"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:bg-brand-800 shadow-md shadow-brand-500/10 transition-all text-sm shrink-0"
        >
          <User class="w-4 h-4" />
          Assign permit
        </button>

        <!-- New Permit Trigger Button -->
        <button 
          @click="openWizard"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-warning text-white font-semibold rounded-xl hover:bg-warning-600 active:bg-warning-700 shadow-md shadow-warning-500/10 transition-all text-sm shrink-0"
        >
          <Plus class="w-4 h-4" />
          New permit
        </button>
      </div>
    </div>

    <!-- KPIs Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Active Permits KPI -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center text-success-500 border border-success-100">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-slate-800 tracking-tight leading-none">{{ kpis.active }}</span>
            <span class="text-xs font-bold text-slate-500">Active permits</span>
          </div>
        </div>
      </div>

      <!-- Awaiting Approval KPI -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
          <Clock class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-slate-800 tracking-tight leading-none">{{ kpis.awaiting }}</span>
            <span class="text-xs font-bold text-slate-500">Awaiting Approval</span>
          </div>
        </div>
      </div>

      <!-- Expired KPI -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
          <XCircle class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-slate-800 tracking-tight leading-none">{{ kpis.expired }}</span>
            <span class="text-xs font-bold text-slate-500">Expired / Open</span>
          </div>
        </div>
      </div>

      <!-- Total Permits KPI -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 border border-brand-100">
          <FileText class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-slate-800 tracking-tight leading-none">{{ kpis.total }}</span>
            <span class="text-xs font-bold text-slate-500">Total permits</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters and List Table Panel -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <!-- Panel Header with controls -->
      <div class="p-6 border-b border-slate-100 space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 class="text-base font-extrabold text-slate-800 tracking-tight">Open permits</h2>
          <span class="text-[10px] font-bold text-slate-400">Awaiting, approved, active. Click row to open.</span>
        </div>

        <!-- Filters form -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Project Filter -->
          <div class="space-y-1">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Project</label>
            <select 
              v-model="selectedProjectFilter"
              class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">All Projects</option>
              <option v-for="proj in store.projects" :key="proj.id" :value="proj.id">{{ proj.name }}</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="space-y-1">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Status</label>
            <select 
              v-model="selectedStatusFilter"
              class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Awaiting Approval">Awaiting Approval</option>
              <option value="Closed">Closed</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <!-- Text Search query -->
          <div class="space-y-1">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Search</label>
            <div class="relative">
              <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search permits..." 
                class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/75 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th class="px-6 py-3">Type</th>
              <th class="px-6 py-3">Permit</th>
              <th class="px-6 py-3">Project</th>
              <th class="px-6 py-3 text-center">Conditions</th>
              <th class="px-6 py-3">Validity</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="permit in filteredPermits" 
              :key="permit.id"
              @click="store.navigateTo('permit-details', { permitId: permit.id })"
              class="hover:bg-slate-50/40 transition-colors cursor-pointer group"
            >
              <!-- Type -->
              <td class="px-6 py-4">
                <span class="text-xs font-bold text-brand-600 hover:underline">
                  {{ permit.type }}
                </span>
              </td>

              <!-- Permit Title & Location -->
              <td class="px-6 py-4">
                <div>
                  <span class="block text-xs font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{{ permit.title }}</span>
                  <span class="block text-[10px] font-medium text-slate-400 mt-0.5">{{ permit.location }}</span>
                </div>
              </td>

              <!-- Project Name -->
              <td class="px-6 py-4">
                <span class="text-xs font-bold text-slate-700">{{ permit.projectName }}</span>
              </td>

              <!-- Conditions Checked Counter -->
              <td class="px-6 py-4 text-center">
                <span 
                  class="text-xs font-extrabold px-2.5 py-0.5 rounded-full"
                  :class="[
                    getConditionsCheckedCount(permit) === permit.precautions.length 
                      ? 'text-success-700 bg-success-50' 
                      : (getConditionsCheckedCount(permit) > 0 ? 'text-blue-700 bg-blue-50' : 'text-slate-500 bg-slate-100')
                  ]"
                >
                  {{ getConditionsCheckedCount(permit) }}/{{ permit.precautions.length }}
                </span>
              </td>

              <!-- Validity Dates -->
              <td class="px-6 py-4">
                <span class="text-[10px] font-semibold text-slate-500 tracking-tight">
                  {{ permit.validFrom }} <span class="text-slate-300 font-bold mx-1">→</span> {{ permit.validTo }}
                </span>
              </td>

              <!-- Status Badge -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5">
                  <span 
                    class="w-1.5 h-1.5 rounded-full"
                    :class="[
                      permit.status === 'Active' ? 'bg-success-500' : '',
                      permit.status === 'Closed' ? 'bg-slate-400' : '',
                      permit.status === 'Awaiting Approval' ? 'bg-orange-400' : '',
                      permit.status === 'Expired' ? 'bg-red-500' : ''
                    ]"
                  ></span>
                  <span 
                    class="text-xs font-bold text-slate-700"
                    :class="[
                      permit.status === 'Active' ? 'text-success-700' : '',
                      permit.status === 'Closed' ? 'text-slate-500' : '',
                      permit.status === 'Awaiting Approval' ? 'text-orange-700' : '',
                      permit.status === 'Expired' ? 'text-red-700' : ''
                    ]"
                  >
                    {{ permit.status }}
                  </span>
                </div>
              </td>

              <!-- Action chevron icon -->
              <td class="px-6 py-4 text-right">
                <ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all inline-block" />
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="filteredPermits.length === 0">
              <td colspan="7" class="px-6 py-12 text-center">
                <div class="max-w-xs mx-auto space-y-2">
                  <Shield class="w-8 h-8 text-slate-300 mx-auto" />
                  <p class="text-xs font-bold text-slate-700">No permits found</p>
                  <p class="text-[10px] text-slate-400 leading-normal">Try adjusting your filters or search terms to find what you are looking for.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Request New Permit Wizard Modal -->
    <div 
      v-if="isWizardOpen"
      class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      @click.self="closeWizard"
    >
      <div 
        class="bg-white rounded-2xl w-full max-w-2xl border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-base font-extrabold text-slate-900 tracking-tight">Request new permit</h3>
            <p class="text-[10px] font-semibold text-slate-400 mt-0.5">Starts in Awaiting approval</p>
          </div>
          <button 
            @click="closeWizard"
            class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X class="w-4.5 h-4.5" />
          </button>
        </div>

        <!-- Step Indicator -->
        <div class="px-6 py-3 bg-slate-100/50 border-b border-slate-100 flex justify-between items-center text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
          <div class="flex items-center gap-1.5" :class="{'text-brand-600': currentStep >= 1}">
            <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="{'bg-brand-500 border-brand-500 text-white': currentStep === 1, 'bg-brand-50 border-brand-500 text-brand-600': currentStep > 1}">1</span>
            General
          </div>
          <div class="flex items-center gap-1.5" :class="{'text-brand-600': currentStep >= 2}">
            <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="{'bg-brand-500 border-brand-500 text-white': currentStep === 2, 'bg-brand-50 border-brand-500 text-brand-600': currentStep > 2}">2</span>
            Validation
          </div>
          <div class="flex items-center gap-1.5" :class="{'text-brand-600': currentStep >= 3}">
            <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="{'bg-brand-500 border-brand-500 text-white': currentStep === 3, 'bg-brand-50 border-brand-500 text-brand-600': currentStep > 3}">3</span>
            Precautions
          </div>
          <div class="flex items-center gap-1.5" :class="{'text-brand-600': currentStep >= 4}">
            <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="{'bg-brand-500 border-brand-500 text-white': currentStep === 4}">4</span>
            Review
          </div>
        </div>

        <!-- Wizard Scrollable Body -->
        <div class="flex-1 p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          
          <!-- STEP 1: General Info -->
          <div v-if="currentStep === 1" class="space-y-4">
            <!-- Permit Type dropdown -->
            <div class="space-y-1">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Permit type</label>
              <select 
                v-model="wizardData.type"
                class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="Hot Work">Hot Work</option>
                <option value="Confined Space">Confined Space</option>
                <option value="Heights">Working on Heights</option>
                <option value="Electrical">Electrical</option>
                <option value="Excavation">Excavation</option>
                <option value="Lifting">Lifting Operations</option>
                <option value="Custom">Custom Permit Type</option>
              </select>
            </div>

            <!-- Custom Type Text Box -->
            <div v-if="wizardData.type === 'Custom'" class="space-y-1">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Specify custom type</label>
              <input 
                v-model="wizardData.customType"
                type="text"
                placeholder="e.g. Chemical Handling"
                class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>

            <!-- Title -->
            <div class="space-y-1">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Title</label>
              <input 
                v-model="wizardData.title"
                type="text"
                placeholder="Enter a descriptive title for this permit..."
                class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>

            <!-- Project Selection -->
            <div class="space-y-1">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Project</label>
              <select 
                v-model="wizardData.projectId"
                class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
              >
                <option v-for="proj in store.projects" :key="proj.id" :value="proj.id">{{ proj.name }}</option>
              </select>
            </div>

            <!-- Location & Requested By (Grid) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Location</label>
                <input 
                  v-model="wizardData.location"
                  type="text"
                  placeholder="e.g. Zone 4, Building B"
                  class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Requested by</label>
                <select 
                  v-model="wizardData.requestedBy"
                  class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option v-for="emp in store.employees" :key="emp.id" :value="emp.name">{{ emp.name }} ({{ emp.role }})</option>
                </select>
              </div>
            </div>

            <!-- Validity dates -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Valid from</label>
                <input 
                  v-model="wizardData.validFrom"
                  type="date"
                  class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Valid to</label>
                <input 
                  v-model="wizardData.validTo"
                  type="date"
                  class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <!-- STEP 2: Assignee and Required Certificates -->
          <div v-if="currentStep === 2" class="space-y-6">
            
            <!-- Assignee Dropdown -->
            <div class="space-y-1">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assignee / Holder</label>
              <select 
                v-model="wizardData.holderId"
                class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
              >
                <option :value="null">-- Unassigned (Assign Later) --</option>
                <option v-for="emp in store.employees" :key="emp.id" :value="emp.id">
                  {{ emp.name }} — {{ emp.role }} ({{ emp.company }})
                </option>
              </select>
            </div>

            <!-- Required Certificates checkboxes -->
            <div class="space-y-2.5">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Select Certificates Required for this PTW</label>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label 
                  v-for="cert in store.certificateTypes" 
                  :key="cert.id"
                  class="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                >
                  <input 
                    type="checkbox"
                    :value="cert.id"
                    v-model="wizardData.requiredCertificateIds"
                    class="mt-1 accent-brand-600 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span class="block text-xs font-bold text-slate-800 leading-tight">{{ cert.name }}</span>
                    <span class="block text-[10px] font-semibold text-slate-400 mt-0.5">Valid for: {{ cert.validityMonths }} months</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Real-time Validation Report -->
            <div v-if="wizardData.holderId" class="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield class="w-4 h-4 text-brand-500" />
                  Certificate Validation Report
                </h4>
                
                <!-- Overall Status Badge -->
                <span 
                  v-if="wizardData.requiredCertificateIds.length > 0"
                  class="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border"
                  :class="[
                    complianceIssuesCount > 0 
                      ? 'text-red-700 bg-red-50 border-red-100' 
                      : 'text-success-700 bg-success-50 border-success-100'
                  ]"
                >
                  {{ complianceIssuesCount > 0 ? `${complianceIssuesCount} Warning(s)` : 'Compliant' }}
                </span>
              </div>

              <!-- Empty state when no certs selected -->
              <p v-if="wizardData.requiredCertificateIds.length === 0" class="text-xs text-slate-400 font-semibold italic text-center py-2">
                No certificate requirements defined yet. Select checkboxes above to run compliance checks.
              </p>

              <!-- List of checks -->
              <div v-else class="space-y-2">
                <div 
                  v-for="certId in wizardData.requiredCertificateIds" 
                  :key="certId"
                  class="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-slate-100/70 text-xs font-semibold"
                >
                  <span class="text-slate-700 text-xs">{{ verifyCertificate(certId).name }}</span>
                  
                  <!-- Compliance Check results -->
                  <div class="flex items-center gap-1.5">
                    <span 
                      v-if="verifyCertificate(certId).status === 'Valid'"
                      class="inline-flex items-center gap-1 text-[10px] font-bold text-success-700 bg-success-50 border border-success-100 px-2 py-0.5 rounded-md"
                    >
                      <Check class="w-3 h-3" /> Valid
                    </span>
                    <span 
                      v-else-if="verifyCertificate(certId).status === 'Expiring'"
                      class="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-md"
                    >
                      <AlertTriangle class="w-3 h-3" /> Expiring Soon
                    </span>
                    <span 
                      v-else-if="verifyCertificate(certId).status === 'Expired'"
                      class="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md"
                    >
                      <XCircle class="w-3 h-3" /> Expired ({{ verifyCertificate(certId).expiredOn }})
                    </span>
                    <span 
                      v-else
                      class="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md"
                    >
                      <AlertTriangle class="w-3 h-3" /> Missing
                    </span>
                  </div>
                </div>
              </div>

              <!-- Warning Banner -->
              <div 
                v-if="complianceIssuesCount > 0" 
                class="flex gap-2 p-3 bg-red-50/50 border border-red-100 rounded-xl text-[10px] font-semibold text-red-800 leading-normal"
              >
                <AlertTriangle class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span class="font-extrabold text-red-900 block">Holder Compliance Warning</span>
                  Selected worker does not satisfy all required training certifications. In advisory mode, this permit can still be created, but warnings will be visible on active screens.
                </div>
              </div>
            </div>
            <div v-else class="bg-blue-50 p-4 border border-blue-100 rounded-xl flex gap-2.5 text-[11px] text-blue-800 leading-normal">
              <Info class="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span class="font-extrabold text-blue-900 block">Project-wise Definition Mode</span>
                No assignee is selected for this work permit. The permit details, precautions, and required certificates will be defined for the project, and an administrator can assign an employee to it later.
              </div>
            </div>
          </div>

          <!-- STEP 3: Precautions Checklist -->
          <div v-if="currentStep === 3" class="space-y-4">
            <div class="flex items-center justify-between">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Precautions & Conditions Checklist</label>
              <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {{ wizardData.precautions.length }} items
              </span>
            </div>

            <!-- Pre-populated Precautions list -->
            <div class="space-y-2">
              <div 
                v-for="(precaution, index) in wizardData.precautions" 
                :key="index"
                class="flex items-start justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group"
              >
                <div class="flex gap-2.5 items-start">
                  <span class="text-xs font-extrabold text-brand-600 bg-brand-50 w-5 h-5 rounded-full flex items-center justify-center mt-0.5">{{ index + 1 }}</span>
                  <span class="text-xs font-semibold text-slate-700 leading-relaxed">{{ precaution.description }}</span>
                </div>
                <button 
                  @click="removePrecaution(index)"
                  class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5 hover:bg-slate-100 rounded"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Custom Precaution Form box -->
            <div class="flex gap-2 border border-slate-100 rounded-xl p-3 bg-slate-50/20">
              <input 
                v-model="customPrecautionText"
                @keyup.enter="addCustomPrecaution"
                type="text" 
                placeholder="Add custom precaution for this work site..." 
                class="flex-1 bg-white text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button 
                @click="addCustomPrecaution"
                class="px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
              >
                Add
              </button>
            </div>
          </div>

          <!-- STEP 4: Review and Submit -->
          <div v-if="currentStep === 4" class="space-y-6">
            
            <!-- Summary Card -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-inner overflow-hidden p-5 space-y-4">
              <h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Permit Details</h4>
              
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="block text-[10px] font-bold text-slate-400 uppercase">Title</span>
                  <span class="block font-bold text-slate-800 mt-0.5">{{ wizardData.title }}</span>
                </div>
                <div>
                  <span class="block text-[10px] font-bold text-slate-400 uppercase">Permit Type</span>
                  <span class="block font-bold text-brand-600 mt-0.5">{{ wizardData.type }}</span>
                </div>
                <div>
                  <span class="block text-[10px] font-bold text-slate-400 uppercase">Project</span>
                  <span class="block font-bold text-slate-800 mt-0.5">
                    {{ store.projects.find(p => p.id === wizardData.projectId)?.name || 'Unknown' }}
                  </span>
                </div>
                <div>
                  <span class="block text-[10px] font-bold text-slate-400 uppercase">Location</span>
                  <span class="block font-bold text-slate-800 mt-0.5">{{ wizardData.location }}</span>
                </div>
                <div>
                  <span class="block text-[10px] font-bold text-slate-400 uppercase">Requested by</span>
                  <span class="block font-bold text-slate-800 mt-0.5">{{ wizardData.requestedBy }}</span>
                </div>
                <div>
                  <span class="block text-[10px] font-bold text-slate-400 uppercase">Assignee (Holder)</span>
                  <span class="block font-bold text-slate-800 mt-0.5">
                    {{ store.employees.find(e => e.id === wizardData.holderId)?.name || 'Unknown' }}
                  </span>
                </div>
                <div class="col-span-2">
                  <span class="block text-[10px] font-bold text-slate-400 uppercase">Validity Range</span>
                  <span class="block font-semibold text-slate-600 mt-0.5">
                    {{ wizardData.validFrom }} <span class="text-slate-300 mx-1">→</span> {{ wizardData.validTo }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Compliance verification summary -->
            <div class="space-y-2 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
              <h4 class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Compliance Summary</h4>
              
              <div v-if="wizardData.requiredCertificateIds.length === 0" class="text-xs text-slate-500 font-semibold">
                No certificate check needed.
              </div>
              <div v-else class="space-y-1.5">
                <div 
                  v-for="certId in wizardData.requiredCertificateIds" 
                  :key="certId"
                  class="flex items-center justify-between text-xs font-semibold bg-white p-2.5 rounded-xl border border-slate-100"
                >
                  <span class="text-slate-600">{{ store.certificateTypes.find(t => t.id === certId)?.name }}</span>
                  <span 
                    class="px-2 py-0.5 rounded text-[10px] font-bold"
                    :class="[
                      verifyCertificate(certId).status === 'Valid' ? 'text-success-700 bg-success-50' : 'text-red-700 bg-red-50'
                    ]"
                  >
                    {{ verifyCertificate(certId).status }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Approver Selection dropdown -->
            <div class="space-y-1 bg-warning-50/30 p-4.5 rounded-2xl border border-warning-100">
              <label class="text-[10px] font-extrabold text-warning-700 uppercase tracking-wider block">Approver / HSE Coordinator</label>
              <select 
                v-model="wizardData.approvedBy"
                class="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
              >
                <option v-for="emp in store.employees" :key="emp.id" :value="emp.name">{{ emp.name }} ({{ emp.role }})</option>
              </select>
              <span class="text-[10px] font-medium text-slate-400 mt-1 block">Permit will be saved as Awaiting approval. Selected person will sign off on activation.</span>
            </div>
          </div>
        </div>

        <!-- Modal Footer buttons -->
        <div class="px-6 py-4.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <!-- Back button -->
          <button 
            @click="prevStep"
            v-if="currentStep > 1"
            class="px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-colors"
          >
            Back
          </button>
          <div v-else></div>

          <!-- Action buttons -->
          <div class="flex gap-2">
            <button 
              @click="closeWizard"
              class="px-4.5 py-2 text-slate-500 hover:text-slate-700 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            
            <button 
              @click="nextStep"
              v-if="currentStep < 4"
              class="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              Next
            </button>
            
            <button 
              @click="submitWizard"
              v-else
              class="px-5 py-2 bg-warning hover:bg-warning-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              Submit Permit
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Permit Modal -->
    <div 
      v-if="isAssignModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      @click.self="closeAssignModal"
    >
      <div 
        class="bg-white rounded-2xl w-full max-w-lg border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-base font-extrabold text-slate-900 tracking-tight">Assign Work Permit</h3>
            <p class="text-[10px] font-semibold text-slate-400 mt-0.5">Assign an existing work permit to a worker</p>
          </div>
          <button 
            @click="closeAssignModal"
            class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X class="w-4.5 h-4.5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4 font-sans">
          
          <!-- Select Permit Dropdown -->
          <div class="space-y-1">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Select Work Permit</label>
            <select 
              v-model="assignmentData.permitId"
              class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">-- Choose Permit to Assign --</option>
              <option v-for="p in store.permits.filter(p => p.status !== 'Closed')" :key="p.id" :value="p.id">
                {{ p.permitNumber }} - {{ p.title }} ({{ p.type }} - Holder: {{ p.holderName }})
              </option>
            </select>
          </div>

          <!-- Select Employee Dropdown -->
          <div class="space-y-1" v-if="assignmentData.permitId">
            <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assign to Worker</label>
            <select 
              v-model="assignmentData.employeeId"
              class="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">-- Select Employee --</option>
              <option v-for="emp in store.employees" :key="emp.id" :value="emp.id">
                {{ emp.name }} — {{ emp.role }} ({{ emp.company }})
              </option>
            </select>
          </div>

          <!-- Real-time Validation Checker in Modal -->
          <div 
            v-if="assignmentData.permitId && assignmentData.employeeId" 
            class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3"
          >
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Shield class="w-4 h-4 text-brand-500" />
              Certification Validation Report
            </h4>

            <div class="space-y-2">
              <div 
                v-for="certId in store.permits.find(p => p.id === parseInt(assignmentData.permitId, 10)).requiredCertificateIds"
                :key="certId"
                class="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100 text-xs font-semibold"
              >
                <span class="text-slate-600">{{ store.certificateTypes.find(t => t.id === certId)?.name || certId }}</span>
                
                <div>
                  <span 
                    v-if="verifyCertForAssign(certId).status === 'Valid'"
                    class="text-[9px] font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded"
                  >
                    Valid
                  </span>
                  <span 
                    v-else-if="verifyCertForAssign(certId).status === 'Expiring'"
                    class="text-[9px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded"
                  >
                    Expiring Soon
                  </span>
                  <span 
                    v-else-if="verifyCertForAssign(certId).status === 'Expired'"
                    class="text-[9px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded"
                  >
                    Expired
                  </span>
                  <span 
                    v-else
                    class="text-[9px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded"
                  >
                    Missing
                  </span>
                </div>
              </div>

              <!-- Warning Banner -->
              <div 
                v-if="assignComplianceIssuesCount > 0" 
                class="flex gap-2 p-3 bg-red-50/50 border border-red-100 rounded-xl text-[10px] font-semibold text-red-800 leading-normal"
              >
                <AlertTriangle class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span class="font-extrabold text-red-900 block">Holder Compliance Warning</span>
                  Selected worker is missing required certifications for this permit.
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
          <button 
            @click="closeAssignModal"
            class="px-4.5 py-2 text-slate-500 hover:text-slate-700 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="submitAssignment"
            :disabled="!assignmentData.permitId || !assignmentData.employeeId"
            class="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
          >
            Assign Permit
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 9999px;
}
</style>
