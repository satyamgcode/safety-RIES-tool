<script setup>
import { ref, computed, watch } from 'vue';
import { store } from '../store';
import {
  ArrowLeft,
  Award,
  Calendar,
  AlertTriangle,
  Clock,
  Trash2,
  RefreshCw,
  Plus,
  Info,
  CheckCircle2,
  XCircle,
  FileCheck,
  History
} from 'lucide-vue-next';

// Retrieve employee ID from store currentParams
const employeeId = computed(() => {
  return parseInt(store.currentParams.employeeId || '1', 10);
});

// Current active employee object
const employee = computed(() => {
  return store.employees.find(e => e.id === employeeId.value) || { name: 'Employee', role: '', company: '', projectIds: [] };
});

// Assigned project names
const assignedProjects = computed(() => {
  return store.projects
    .filter(p => employee.value.projectIds.includes(p.id))
    .map(p => p.name)
    .join(', ');
});

// Employee certificates list
const employeeCerts = computed(() => {
  return store.certificates
    .filter(c => c.employeeId === employeeId.value)
    .map(c => {
      // Force recalculate status
      const status = store.updateCertificateStatus(c);
      const type = store.certificateTypes.find(t => t.id === c.typeId);
      return {
        ...c,
        status,
        typeName: c.typeId === 'custom' ? c.customName : (type ? type.name : c.typeId)
      };
    });
});

// Expiry relative string for badge
const getExpiryBadgeText = (cert) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const expiry = new Date(cert.expiresOn);
  expiry.setHours(0,0,0,0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays <= 90) {
    return `Expiring - ${diffDays}d left`;
  } else {
    return 'Valid';
  }
};

// Form states
const isRenewMode = ref(false);
const selectedCertId = ref(null); // Used during renewal

const formTypeId = ref('bhv');
const formCustomName = ref('');
const formCustomValidityMonths = ref(12);
const formNumber = ref('');
const formIssuer = ref('');
const formIssuedOn = ref(new Date().toISOString().split('T')[0]);

// Reset form
const resetForm = () => {
  isRenewMode.value = false;
  selectedCertId.value = null;
  formTypeId.value = 'bhv';
  formCustomName.value = '';
  formCustomValidityMonths.value = 12;
  formNumber.value = '';
  formIssuer.value = '';
  formIssuedOn.value = new Date().toISOString().split('T')[0];
};

// Trigger Renewal Mode from active row
const startRenewal = (cert) => {
  isRenewMode.value = true;
  selectedCertId.value = cert.id;
  formTypeId.value = cert.typeId;
  formCustomName.value = cert.customName || '';
  
  // Set default form values from existing cert
  formNumber.value = cert.certificateNumber;
  formIssuer.value = cert.issuer;
  
  // Default new issuedOn to today
  formIssuedOn.value = new Date().toISOString().split('T')[0];
};

// Submit Add / Renew
const submitForm = () => {
  if (!formNumber.value.trim()) {
    store.addToast('Please enter a certificate number.', 'error');
    return;
  }
  if (!formIssuer.value.trim()) {
    store.addToast('Please enter the certificate issuer.', 'error');
    return;
  }
  if (formTypeId.value === 'custom' && !formCustomName.value.trim()) {
    store.addToast('Please enter the custom certification name.', 'error');
    return;
  }

  const certData = {
    typeId: formTypeId.value,
    customName: formCustomName.value,
    customValidityMonths: formCustomValidityMonths.value,
    certificateNumber: formNumber.value,
    issuer: formIssuer.value,
    issuedOn: formIssuedOn.value
  };

  if (isRenewMode.value) {
    store.renewCertificate(selectedCertId.value, certData);
  } else {
    store.addCertificate(employeeId.value, certData);
  }
  
  resetForm();
};

const deleteCert = (certId) => {
  if (confirm('Are you sure you want to delete this certificate?')) {
    store.deleteCertificate(certId);
  }
};

// Formatted Date pretty
const formatDatePretty = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Watch for param changes to reset form
watch(employeeId, () => {
  resetForm();
});
</script>

<template>
  <div class="space-y-8 font-sans">
    
    <!-- Header with Back navigation -->
    <div class="space-y-3">
      <button 
        @click="store.navigateTo('training-overview')"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft class="w-4 h-4" />
        Back to Overview
      </button>
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">{{ employee.name }}</h1>
          <p class="text-sm font-semibold text-slate-500 mt-1">
            {{ employee.role }} · {{ employee.company }}
          </p>
          <div v-if="employee.projectIds.length > 0" class="mt-2 text-xs font-bold text-brand-600 bg-brand-50/50 inline-block px-3 py-1 rounded-lg border border-brand-100">
            Assigned to: {{ assignedProjects }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Panel split layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      <!-- Left Panel: Certificates List -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-base font-extrabold text-slate-800 tracking-tight">Certificates</h2>
            <span class="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {{ employeeCerts.length }}
            </span>
          </div>

          <!-- Table Container -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/75 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th class="px-6 py-3">Certificate</th>
                  <th class="px-6 py-3">Number</th>
                  <th class="px-6 py-3">Issued</th>
                  <th class="px-6 py-3">Expires</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="cert in employeeCerts" :key="cert.id" class="text-xs hover:bg-slate-50/30 transition-colors">
                  <!-- Certificate name -->
                  <td class="px-6 py-4 font-bold text-slate-800">
                    {{ cert.typeName }}
                  </td>
                  
                  <!-- Certificate number -->
                  <td class="px-6 py-4 text-slate-500 font-semibold">
                    {{ cert.certificateNumber }}
                  </td>
                  
                  <!-- Issued date -->
                  <td class="px-6 py-4 text-slate-500 font-bold">
                    {{ formatDatePretty(cert.issuedOn) }}
                  </td>
                  
                  <!-- Expires date -->
                  <td class="px-6 py-4 text-slate-500 font-bold">
                    {{ formatDatePretty(cert.expiresOn) }}
                  </td>
                  
                  <!-- Status Pill -->
                  <td class="px-6 py-4">
                    <span 
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold inline-block border tracking-wide uppercase"
                      :class="[
                        cert.status === 'Expired' ? 'text-red-700 bg-red-50 border-red-100 shadow-sm' : '',
                        cert.status === 'Expiring' ? 'text-yellow-700 bg-yellow-50 border-yellow-100 shadow-sm' : '',
                        cert.status === 'Valid' ? 'text-success-700 bg-success-50 border-success-100' : ''
                      ]"
                    >
                      <span class="w-1.5 h-1.5 rounded-full inline-block mr-1.5" :class="[
                        cert.status === 'Expired' ? 'bg-red-500' : '',
                        cert.status === 'Expiring' ? 'bg-yellow-500' : '',
                        cert.status === 'Valid' ? 'bg-success-500' : ''
                      ]"></span>
                      {{ getExpiryBadgeText(cert) }}
                    </span>
                  </td>
                  
                  <!-- Actions (Delete, Renew) -->
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2.5">
                      <!-- Renew Button -->
                      <button 
                        @click="startRenewal(cert)"
                        class="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                        title="Renew Certificate"
                      >
                        <RefreshCw class="w-4 h-4" />
                      </button>
                      
                      <!-- Delete Button -->
                      <button 
                        @click="deleteCert(cert.id)"
                        class="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Certificate"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                <!-- Empty state -->
                <tr v-if="employeeCerts.length === 0">
                  <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                    <Award class="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <span class="block font-bold text-slate-700 text-sm">No certificates assigned</span>
                    <span class="block text-xs mt-1">Use the panel on the right to assign a new certificate.</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- History Log Panel -->
        <div v-if="employeeCerts.some(c => c.history && c.history.length > 0)" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
            <History class="w-5 h-5 text-slate-400" />
            <h3 class="text-sm font-bold text-slate-700">Certificate Renewal History</h3>
          </div>
          
          <div class="space-y-4">
            <div v-for="cert in employeeCerts.filter(c => c.history && c.history.length > 0)" :key="'hist-' + cert.id" class="space-y-2">
              <span class="text-xs font-bold text-brand-600 block">{{ cert.typeName }} History:</span>
              <div class="pl-4 border-l-2 border-slate-100 space-y-2">
                <div v-for="(hist, idx) in cert.history" :key="idx" class="text-xs text-slate-500 flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg">
                  <div>
                    <span class="font-bold">Number:</span> {{ hist.certificateNumber }} · 
                    <span class="font-bold">Issuer:</span> {{ hist.issuer }}
                  </div>
                  <div class="text-[10px] text-slate-400 font-semibold">
                    Issued: {{ formatDatePretty(hist.issuedOn) }} · Expired: {{ formatDatePretty(hist.expiresOn) }} · Renewed: {{ formatDatePretty(hist.renewedAt) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Add / Renew Form -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div>
          <h2 class="text-base font-extrabold text-slate-800 tracking-tight">
            {{ isRenewMode ? 'Renew certificate' : 'Add certificate' }}
          </h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">
            {{ isRenewMode ? 'Enter details for the new renewed certificate' : 'Assign a new certificate to this employee' }}
          </p>
        </div>

        <form @submit.prevent="submitForm" class="space-y-4">
          
          <!-- Certificate Type Dropdown -->
          <div class="space-y-1">
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wide">Type</label>
            <select
              v-model="formTypeId"
              :disabled="isRenewMode"
              class="w-full text-xs font-semibold px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
            >
              <option v-for="type in store.certificateTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
              <option value="custom">Custom Certification...</option>
            </select>
          </div>

          <!-- Custom fields (only shown if type is Custom) -->
          <transition name="fade">
            <div v-if="formTypeId === 'custom'" class="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
              <div class="space-y-1">
                <label class="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Custom Name</label>
                <input
                  type="text"
                  v-model="formCustomName"
                  placeholder="e.g. Scaffolding inspector"
                  class="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>
              
              <div class="space-y-1">
                <label class="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Validity Duration (months)</label>
                <input
                  type="number"
                  v-model="formCustomValidityMonths"
                  min="1"
                  max="120"
                  class="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </transition>

          <!-- Certificate Number -->
          <div class="space-y-1">
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wide">Certificate number</label>
            <input
              type="text"
              v-model="formNumber"
              placeholder="e.g. VB-123456"
              class="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- Issuer -->
          <div class="space-y-1">
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wide">Issuer</label>
            <input
              type="text"
              v-model="formIssuer"
              placeholder="e.g. VCA Infra"
              class="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- Issued on Date Picker -->
          <div class="space-y-1">
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wide">Issued on</label>
            <div class="relative">
              <Calendar class="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              <input
                type="date"
                v-model="formIssuedOn"
                class="w-full text-xs font-semibold pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>

          <!-- Submit and Cancel Buttons -->
          <div class="space-y-2 pt-2">
            <button
              type="submit"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-brand-500/10 hover:bg-brand-600 active:scale-98 transition-all cursor-pointer"
            >
              <component :is="isRenewMode ? RefreshCw : Plus" class="w-4 h-4" />
              {{ isRenewMode ? 'Renew certificate' : 'Add certificate' }}
            </button>
            
            <button
              v-if="isRenewMode"
              type="button"
              @click="resetForm"
              class="w-full px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
            >
              Cancel Renewal
            </button>
          </div>

        </form>
      </div>

    </div>

    <!-- Bottom Notice Banner -->
    <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-blue-800">
      <Info class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
      <div>
        <span class="font-extrabold block">Per-employee certificate register info banner</span>
        Expiry is auto-derived from the certificate type's validity (e.g. BHV = 12 months, VCA = 120 months). 
        Tables link: <em>employee</em>, <em>certificate</em> (FK <em>certificate_type_id</em>). 
        The same records feed the project training matrix & safety compliance indicators.
      </div>
    </div>

  </div>
</template>
