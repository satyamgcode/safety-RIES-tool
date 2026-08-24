<script setup>
import { ref, computed } from 'vue';
import { store } from '../store';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Printer,
  Check,
  Briefcase,
  User,
  MapPin,
  Calendar,
  Shield,
  FileCheck,
  Trash2,
  Info,
  Users
} from 'lucide-vue-next';

// Retrieve permit ID from params
const permitId = computed(() => {
  return parseInt(store.currentParams.permitId || '1', 10);
});

// Current active permit object
const permit = computed(() => {
  return store.permits.find(p => p.id === permitId.value) || null;
});

// Checked precautions counts
const checkedCount = computed(() => {
  if (!permit.value) return 0;
  return permit.value.precautions.filter(p => p.confirmed).length;
});

const totalPrecautionsCount = computed(() => {
  if (!permit.value) return 0;
  return permit.value.precautions.length;
});

// Pretty Date Formatter
const formatDatePretty = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  // We can write a simple formatter or just use standard:
  const day = date.getDate();
  const year = date.getFullYear();
  const monthName = date.toLocaleString('default', { month: 'short' });
  return `${day} ${monthName} ${year}`;
};

// Check certificate validation for any employee
const verifyEmployeeCertificate = (employeeId, certTypeId) => {
  const type = store.certificateTypes.find(t => t.id === certTypeId);
  if (!type) return { status: 'Missing', name: certTypeId };
  
  const empId = parseInt(employeeId, 10);
  const certs = store.certificates.filter(c => c.employeeId === empId && (c.typeId === certTypeId || (store.certificateTypes.find(t => t.id === c.typeId)?.satisfies === certTypeId)));
  
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

// Count compliance issues for an employee
const getEmployeeComplianceIssuesCount = (employeeId) => {
  if (!permit.value) return 0;
  let count = 0;
  permit.value.requiredCertificateIds.forEach(id => {
    const verification = verifyEmployeeCertificate(employeeId, id);
    if (verification.status === 'Missing' || verification.status === 'Expired') {
      count++;
    }
  });
  return count;
};

// Overall compliance warnings count across all assigned workers
const overallComplianceIssuesCount = computed(() => {
  if (!permit.value) return 0;
  let count = 0;
  (permit.value.assignedEmployeeIds || []).forEach(empId => {
    count += getEmployeeComplianceIssuesCount(empId);
  });
  return count;
});

// List of employees who are not assigned to this permit
const unassignedEmployeesForPermit = computed(() => {
  if (!permit.value) return [];
  const assigned = permit.value.assignedEmployeeIds || [];
  return store.employees.filter(emp => !assigned.includes(emp.id));
});

// Precaution toggle handler
const togglePrecaution = (precautionId) => {
  store.togglePrecaution(permitId.value, precautionId);
};

// Approve Permit transition
const approvePermit = () => {
  if (overallComplianceIssuesCount.value > 0) {
    if (!confirm('Warning: One or more assigned workers have safety compliance warnings. Do you still wish to approve and activate this permit?')) {
      return;
    }
  }
  
  const approver = permit.value.approvedBy || 'L. Hofman';
  store.approvePermit(permitId.value, approver);
};

// Close Permit transition
const closePermit = () => {
  if (confirm('Are you sure you want to CLOSE this active permit? This will end the authorization.')) {
    store.closePermit(permitId.value, 'Shantanu');
  }
};

// Print Permit
const printPermit = () => {
  store.addToast(`Work Permit "${permit.value?.permitNumber}" sent to printer.`, 'success');
};
</script>

<template>
  <div v-if="permit" class="space-y-8 font-sans">
    
    <!-- Top Back Navigation & Actions Header -->
    <div class="space-y-3">
      <button 
        @click="store.navigateTo('permits-dashboard')"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft class="w-4 h-4" />
        Back to Dashboard
      </button>
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">{{ permit.title }}</h1>
          <p class="text-sm font-semibold text-slate-500 mt-1">
            {{ permit.projectName }} · {{ permit.location }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Print Button -->
          <button 
            @click="printPermit"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-all"
          >
            <Printer class="w-4 h-4" />
            Print permit
          </button>

          <!-- Permit Action controls -->
          <button 
            v-if="permit.status === 'Awaiting Approval'"
            @click="approvePermit"
            class="px-5 py-2 bg-success text-white font-semibold text-xs rounded-xl shadow-md hover:bg-success-600 active:bg-success-700 transition-all"
          >
            Approve & Activate
          </button>
          
          <button 
            v-if="permit.status === 'Active'"
            @click="closePermit"
            class="px-5 py-2 bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-300 transition-all"
          >
            Close Permit
          </button>

          <!-- Status badge -->
          <div 
            class="px-3 py-1.5 rounded-full text-xs font-bold inline-block border uppercase tracking-wider"
            :class="[
              permit.status === 'Active' ? 'text-success-700 bg-success-50 border-success-100' : '',
              permit.status === 'Closed' ? 'text-slate-500 bg-slate-50 border-slate-200' : '',
              permit.status === 'Awaiting Approval' ? 'text-orange-700 bg-orange-50 border-orange-100' : '',
              permit.status === 'Expired' ? 'text-red-700 bg-red-50 border-red-100' : ''
            ]"
          >
            <span class="w-1.5 h-1.5 rounded-full inline-block mr-1.5" :class="[
              permit.status === 'Active' ? 'bg-success-500' : '',
              permit.status === 'Closed' ? 'bg-slate-400' : '',
              permit.status === 'Awaiting Approval' ? 'bg-orange-500' : '',
              permit.status === 'Expired' ? 'bg-red-500' : ''
            ]"></span>
            {{ permit.status }}
          </div>
        </div>
      </div>
    </div>

    <!-- Info Column Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div>
        <span class="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Crew Size</span>
        <span class="block text-xs font-bold text-slate-800 mt-1.5">{{ (permit.assignedEmployeeIds || []).length }} worker(s) assigned</span>
      </div>
      <div>
        <span class="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Requested by</span>
        <span class="block text-xs font-bold text-slate-800 mt-1 truncate">{{ permit.requestedBy }}</span>
      </div>
      <div>
        <span class="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Approved by</span>
        <span class="block text-xs font-bold text-slate-800 mt-1 truncate">{{ permit.approvedBy || 'Awaiting Sign-off' }}</span>
      </div>
      <div>
        <span class="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Valid from</span>
        <span class="block text-xs font-bold text-slate-800 mt-1">{{ formatDatePretty(permit.validFrom) }}</span>
      </div>
      <div>
        <span class="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Valid to</span>
        <span class="block text-xs font-bold text-slate-800 mt-1">{{ formatDatePretty(permit.validTo) }}</span>
      </div>
    </div>

    <!-- Main Content Layout split -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      <!-- Left Panel: Precautions and Certificate Validation -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Precautions Section -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-base font-extrabold text-slate-800 tracking-tight">Precautions & Conditions</h2>
            
            <span class="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full">
              {{ checkedCount }} / {{ totalPrecautionsCount }} Confirmed
            </span>
          </div>

          <!-- Precautions List -->
          <div class="divide-y divide-slate-100 p-6 space-y-4">
            <div 
              v-for="precaution in permit.precautions" 
              :key="precaution.id"
              class="flex items-start gap-4"
            >
              <!-- Precaution Checkbox button -->
              <button 
                @click="togglePrecaution(precaution.id)"
                class="mt-0.5 flex-shrink-0 w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all"
                :class="[
                  precaution.confirmed 
                    ? 'bg-success border-success text-white shadow-sm shadow-success/15' 
                    : 'border-slate-200 hover:border-slate-400 text-transparent'
                ]"
              >
                <Check class="w-3.5 h-3.5 stroke-[3]" />
              </button>

              <div>
                <span 
                  class="text-xs font-semibold leading-relaxed transition-colors duration-150"
                  :class="precaution.confirmed ? 'text-slate-500 line-through' : 'text-slate-800'"
                >
                  {{ precaution.description }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Assigned Crew & Safety Compliance Check Card -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <Users class="w-5 h-5 text-brand-600" />
              <h3 class="text-base font-extrabold text-slate-800 tracking-tight">Assigned Workers & Certification Check</h3>
            </div>
            <span class="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
              {{ (permit.assignedEmployeeIds || []).length }} Assigned
            </span>
          </div>

          <!-- Description -->
          <p class="text-xs font-semibold text-slate-500 leading-relaxed">
            The work permit dictates that all assigned workers must possess valid, unexpired training certificates for:
            <span class="font-extrabold text-slate-700">
              {{ permit.requiredCertificateIds.map(cid => store.certificateTypes.find(t => t.id === cid)?.name || cid).join(', ') || 'No specific certifications' }}
            </span>.
          </p>

          <!-- List of Assigned Workers -->
          <div class="space-y-4" v-if="(permit.assignedEmployeeIds || []).length > 0">
            <div 
              v-for="empId in permit.assignedEmployeeIds" 
              :key="empId"
              class="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-3"
            >
              <!-- Worker Header details -->
              <div class="flex items-start justify-between gap-3">
                <div>
                  <span class="block text-sm font-extrabold text-slate-800">
                    {{ store.employees.find(e => e.id === empId)?.name || 'Unknown' }}
                  </span>
                  <span class="block text-[11px] text-slate-400 font-bold -mt-0.5">
                    {{ store.employees.find(e => e.id === empId)?.role || 'Worker' }} · {{ store.employees.find(e => e.id === empId)?.company || 'RIES Partner' }}
                  </span>
                </div>
                
                <!-- Remove worker action -->
                <button
                  v-if="permit.status !== 'Closed'"
                  @click="store.removeEmployeeFromPermit(permit.id, empId)"
                  class="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 transition-all flex items-center gap-1 shrink-0"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>

              <!-- Certificate validation list for this specific worker -->
              <div class="space-y-1.5 pt-1 border-t border-slate-100">
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Certification Status</div>
                <div 
                  v-for="certId in permit.requiredCertificateIds" 
                  :key="certId"
                  class="flex items-center justify-between text-xs font-semibold bg-white p-2 rounded-lg border border-slate-100/50"
                >
                  <span class="text-slate-600">{{ store.certificateTypes.find(t => t.id === certId)?.name || certId }}</span>
                  
                  <div>
                    <span 
                      v-if="verifyEmployeeCertificate(empId, certId).status === 'Valid'"
                      class="text-[9px] font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded border border-success-100"
                    >
                      Valid
                    </span>
                    <span 
                      v-else-if="verifyEmployeeCertificate(empId, certId).status === 'Expiring'"
                      class="text-[9px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100"
                    >
                      Expiring Soon
                    </span>
                    <span 
                      v-else-if="verifyEmployeeCertificate(empId, certId).status === 'Expired'"
                      class="text-[9px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100"
                    >
                      Expired
                    </span>
                    <span 
                      v-else
                      class="text-[9px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100"
                    >
                      Missing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Unassigned Warning banner -->
          <div v-else class="bg-blue-50/50 p-4 border border-blue-100 rounded-xl flex gap-3 text-xs font-semibold text-blue-800 leading-normal">
            <Info class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span class="font-extrabold text-blue-900 block">Permit Unassigned</span>
              This permit is currently defined project-wise and has no workers assigned to it. Assign an employee below to run training verification reports.
            </div>
          </div>

          <!-- Add Worker to Permit Section -->
          <div v-if="permit.status !== 'Closed' && unassignedEmployeesForPermit.length > 0" class="pt-2 border-t border-slate-100 space-y-2">
            <label class="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Assign Worker to this Crew</label>
            <div class="flex gap-2">
              <select
                @change="e => { if (e.target.value) { store.assignEmployeeToPermit(permit.id, e.target.value); e.target.value = ''; } }"
                class="flex-1 text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="">-- Add Employee to Permit --</option>
                <option v-for="emp in unassignedEmployeesForPermit" :key="emp.id" :value="emp.id">
                  {{ emp.name }} — {{ emp.role }}
                </option>
              </select>
            </div>
          </div>
        </div>

      </div>

      <!-- Right Panel: Timeline & Audit log -->
      <div class="space-y-6">
        
        <!-- Timeline Card -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h3 class="text-base font-extrabold text-slate-800 tracking-tight">Timeline</h3>

          <!-- Events list -->
          <div class="relative pl-6 border-l-2 border-slate-100 space-y-6">
            <div 
              v-for="(event, idx) in permit.timeline" 
              :key="idx"
              class="relative"
            >
              <!-- Colored Dot indicator -->
              <span 
                class="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ring-white"
                :class="[
                  event.status === 'Active' ? 'bg-success' : '',
                  event.status === 'Closed' ? 'bg-slate-400' : '',
                  event.status === 'Created' ? 'bg-slate-400' : ''
                ]"
              ></span>

              <div class="text-xs">
                <span class="block font-bold text-slate-800 uppercase tracking-wide">
                  {{ event.status }}
                </span>
                <span class="block text-[10px] font-semibold text-slate-400 mt-1">
                  {{ event.timestamp }}
                </span>
                <span v-if="event.by" class="block text-[10px] font-semibold text-slate-500 mt-0.5">
                  by <span class="font-bold">{{ event.by }}</span>
                </span>
              </div>
            </div>

            <!-- Empty timeline state -->
            <div v-if="!permit.timeline || permit.timeline.length === 0" class="text-xs text-slate-400 font-semibold italic text-center">
              No logged events recorded yet.
            </div>
          </div>
        </div>

        <!-- Help HSE card -->
        <div class="bg-brand-900 p-6 rounded-2xl text-white shadow-xl space-y-3 relative overflow-hidden">
          <div class="w-24 h-24 rounded-full bg-white/5 absolute -right-6 -bottom-6"></div>
          <FileCheck class="w-8 h-8 text-brand-400" />
          <h4 class="text-sm font-extrabold tracking-tight">Audit Trail Guidance</h4>
          <p class="text-[11px] font-medium text-brand-100/90 leading-relaxed">
            All permit state changes are programmatically locked to ensure HSE compliance. Toggle conditions on site, and verify assignee licenses before signing.
          </p>
        </div>

      </div>

    </div>

  </div>
  <div v-else class="py-12 text-center text-slate-500">
    Permit not found.
  </div>
</template>
