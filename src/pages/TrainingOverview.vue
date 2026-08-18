<script setup>
import { ref, computed } from 'vue';
import { store } from '../store';
import {
  Award,
  AlertTriangle,
  Clock,
  Users,
  Search,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  FileCheck,
  Plus,
  X,
  UserPlus
} from 'lucide-vue-next';

// Tab state: 'monitor' (expiring/expired) or 'employees' (all employees)
const activeTab = ref('monitor');
const searchQuery = ref('');

// Modals visibility state
const isAssignCertModalOpen = ref(false);
const isAddEmployeeModalOpen = ref(false);

// Assign Certificate Form state
const assignEmployeeId = ref('');
const assignTypeId = ref('bhv');
const assignCustomName = ref('');
const assignCustomValidityMonths = ref(12);
const assignNumber = ref('');
const assignIssuer = ref('');
const assignIssuedOn = ref(new Date().toISOString().split('T')[0]);

// Add Employee Form state
const newEmployeeName = ref('');
const newEmployeeRole = ref('');
const newEmployeeCompany = ref('');
const newEmployeeProjects = ref([]);

// Helper to format dates pretty (e.g. 10 Aug 2026)
const formatDatePretty = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Helper for relative time text
const getRelativeTimeText = (expiresOn) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const expiry = new Date(expiresOn);
  expiry.setHours(0,0,0,0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Expired ${Math.abs(diffDays)}d ago`;
  } else {
    return `${diffDays}d left`;
  }
};

// KPIs
const totalEmployees = computed(() => store.employees.length);

const certsWithCalculatedStatus = computed(() => {
  return store.certificates.map(c => {
    // Force recalculate status
    const status = store.updateCertificateStatus(c);
    const emp = store.employees.find(e => e.id === c.employeeId);
    const type = store.certificateTypes.find(t => t.id === c.typeId);
    
    return {
      ...c,
      status,
      employeeName: emp ? emp.name : 'Unknown',
      employeeRole: emp ? emp.role : '',
      employeeCompany: emp ? emp.company : '',
      certificateName: c.typeId === 'custom' ? c.customName : (type ? type.name : c.typeId)
    };
  });
});

const validCertsCount = computed(() => {
  return certsWithCalculatedStatus.value.filter(c => c.status === 'Valid').length;
});

const expiringCertsCount = computed(() => {
  return certsWithCalculatedStatus.value.filter(c => c.status === 'Expiring').length;
});

const expiredCertsCount = computed(() => {
  return certsWithCalculatedStatus.value.filter(c => c.status === 'Expired').length;
});

// Filtered and sorted certificates for Renewal Monitor
const renewalCerts = computed(() => {
  // Only Expiring and Expired
  let list = certsWithCalculatedStatus.value.filter(c => c.status === 'Expiring' || c.status === 'Expired');
  
  // Apply Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    list = list.filter(c => 
      c.employeeName.toLowerCase().includes(query) ||
      c.certificateName.toLowerCase().includes(query)
    );
  }
  
  // Sort: expired first, then expiring sorted by soonest expiresOn
  return list.sort((a, b) => {
    if (a.status === 'Expired' && b.status !== 'Expired') return -1;
    if (a.status !== 'Expired' && b.status === 'Expired') return 1;
    return new Date(a.expiresOn) - new Date(b.expiresOn);
  });
});

// All employees list with counts
const employeesList = computed(() => {
  let list = store.employees.map(emp => {
    const empCerts = certsWithCalculatedStatus.value.filter(c => c.employeeId === emp.id);
    const expiredCount = empCerts.filter(c => c.status === 'Expired').length;
    const expiringCount = empCerts.filter(c => c.status === 'Expiring').length;
    const validCount = empCerts.filter(c => c.status === 'Valid').length;
    
    return {
      ...emp,
      certsCount: empCerts.length,
      expiredCount,
      expiringCount,
      validCount
    };
  });

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    list = list.filter(e => 
      e.name.toLowerCase().includes(query) ||
      e.role.toLowerCase().includes(query) ||
      e.company.toLowerCase().includes(query)
    );
  }

  return list.sort((a, b) => b.expiredCount - a.expiredCount || b.expiringCount - a.expiringCount || a.name.localeCompare(b.name));
});

// Project compliance data
const projectsCompliance = computed(() => {
  return store.projects
    .map(p => {
      const comp = store.getProjectCompliance(p.id);
      return {
        id: p.id,
        name: p.name,
        ...comp
      };
    })
    .filter(p => p.workersCount > 0);
});

const navigateToEmployee = (employeeId) => {
  store.navigateTo('employee-certificates', { employeeId });
};

// Modal Operations
const openAssignCertModal = () => {
  if (store.employees.length === 0) {
    store.addToast('Please create an employee first before assigning certificates.', 'error');
    return;
  }
  assignEmployeeId.value = store.employees[0].id.toString();
  assignTypeId.value = 'bhv';
  assignCustomName.value = '';
  assignCustomValidityMonths.value = 12;
  assignNumber.value = '';
  assignIssuer.value = '';
  assignIssuedOn.value = new Date().toISOString().split('T')[0];
  isAssignCertModalOpen.value = true;
};

const closeAssignCertModal = () => {
  isAssignCertModalOpen.value = false;
};

const openAddEmployeeModal = () => {
  newEmployeeName.value = '';
  newEmployeeRole.value = '';
  newEmployeeCompany.value = '';
  newEmployeeProjects.value = [];
  isAddEmployeeModalOpen.value = true;
};

const closeAddEmployeeModal = () => {
  isAddEmployeeModalOpen.value = false;
};

// Submit certificate assignment
const submitAssignCert = () => {
  if (!assignNumber.value.trim()) {
    store.addToast('Please enter a certificate number.', 'error');
    return;
  }
  if (!assignIssuer.value.trim()) {
    store.addToast('Please enter the certificate issuer.', 'error');
    return;
  }
  if (assignTypeId.value === 'custom' && !assignCustomName.value.trim()) {
    store.addToast('Please enter the custom certification name.', 'error');
    return;
  }

  const certData = {
    typeId: assignTypeId.value,
    customName: assignCustomName.value,
    customValidityMonths: assignCustomValidityMonths.value,
    certificateNumber: assignNumber.value,
    issuer: assignIssuer.value,
    issuedOn: assignIssuedOn.value
  };

  store.addCertificate(parseInt(assignEmployeeId.value, 10), certData);
  closeAssignCertModal();
};

// Submit new employee creation
const submitAddEmployee = () => {
  if (!newEmployeeName.value.trim()) {
    store.addToast('Please enter the employee\'s name.', 'error');
    return;
  }
  if (!newEmployeeRole.value.trim()) {
    store.addToast('Please enter the employee\'s job title/role.', 'error');
    return;
  }
  if (!newEmployeeCompany.value.trim()) {
    store.addToast('Please enter the employee\'s company name.', 'error');
    return;
  }

  const empData = {
    name: newEmployeeName.value,
    role: newEmployeeRole.value,
    company: newEmployeeCompany.value,
    projectIds: newEmployeeProjects.value.map(id => parseInt(id, 10))
  };

  store.addEmployee(empData);
  closeAddEmployeeModal();
};
</script>

<template>
  <div class="space-y-8 font-sans">
    
    <!-- Header with Action Buttons -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
          <Award class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Training & certificates — Overview</h1>
          <p class="text-sm text-slate-500 font-medium">Certificate validity & project compliance across all projects · VCA, BHV & more</p>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-2.5">
        <button
          @click="openAddEmployeeModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-extrabold shadow-sm active:scale-98 transition-all cursor-pointer"
        >
          <UserPlus class="w-4 h-4" />
          Add Employee
        </button>
        <button
          @click="openAssignCertModal"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-brand-500/10 active:scale-98 transition-all cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          Assign Certificate
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Valid Certificates Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
        <div class="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center text-success-600">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <div>
          <span class="block text-3xl font-extrabold text-success-600 tracking-tight">{{ validCertsCount }}</span>
          <span class="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">Valid Certificates</span>
          <span class="block text-xs text-slate-400 mt-0.5">In date</span>
        </div>
      </div>

      <!-- Expiring Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
        <div class="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
          <Clock class="w-6 h-6" />
        </div>
        <div>
          <span class="block text-3xl font-extrabold text-yellow-600 tracking-tight">{{ expiringCertsCount }}</span>
          <span class="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">Expiring &lt; 90 days</span>
          <span class="block text-xs text-slate-400 mt-0.5">Plan renewal</span>
        </div>
      </div>

      <!-- Expired Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
        <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
          <XCircle class="w-6 h-6" />
        </div>
        <div>
          <span class="block text-3xl font-extrabold text-red-600 tracking-tight">{{ expiredCertsCount }}</span>
          <span class="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">Expired</span>
          <span class="block text-xs text-slate-400 mt-0.5">Action required</span>
        </div>
      </div>

      <!-- Tracked Employees Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200">
        <div class="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <span class="block text-3xl font-extrabold text-slate-800 tracking-tight">{{ totalEmployees }}</span>
          <span class="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">Employees Tracked</span>
          <span class="block text-xs text-slate-400 mt-0.5">Across all projects</span>
        </div>
      </div>
    </div>

    <!-- Main Grid Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      <!-- Left Panel: Renewal Monitor / Employee Register -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <!-- Card Header Tabs -->
        <div class="px-6 pt-5 pb-0 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex border-b border-transparent gap-6">
            <button
              @click="activeTab = 'monitor'"
              class="pb-4 text-sm font-bold tracking-tight transition-all relative"
              :class="activeTab === 'monitor' ? 'text-brand-600 border-b-2 border-brand-500' : 'text-slate-400 hover:text-slate-600'"
            >
              Renewal monitor
            </button>
            <button
              @click="activeTab = 'employees'"
              class="pb-4 text-sm font-bold tracking-tight transition-all relative"
              :class="activeTab === 'employees' ? 'text-brand-600 border-b-2 border-brand-500' : 'text-slate-400 hover:text-slate-600'"
            >
              All Tracked Employees
            </button>
          </div>
          
          <!-- Search input inside header -->
          <div class="relative w-full md:w-64 mb-3 md:mb-0">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search..."
              class="w-full text-xs font-semibold pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>
        </div>

        <!-- Renewal Monitor Tab Content -->
        <div v-if="activeTab === 'monitor'">
          <!-- Header Notice inside Monitor -->
          <div class="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>STATUS & EMPLOYEE</span>
            <span class="text-right">EXPIRES</span>
          </div>

          <div class="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
            <div
              v-for="cert in renewalCerts"
              :key="cert.id"
              @click="navigateToEmployee(cert.employeeId)"
              class="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-all duration-200 group"
            >
              <div class="flex items-center gap-4">
                <!-- Status indicator bullet/badge -->
                <div class="flex items-center">
                  <span
                    class="w-2.5 h-2.5 rounded-full mr-2.5 block shrink-0"
                    :class="cert.status === 'Expired' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'"
                  ></span>
                  <span
                    class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border"
                    :class="[
                      cert.status === 'Expired' 
                        ? 'text-red-700 bg-red-50 border-red-100' 
                        : 'text-yellow-700 bg-yellow-50 border-yellow-100'
                    ]"
                  >
                    {{ cert.status }}
                  </span>
                </div>

                <!-- Employee detail -->
                <div>
                  <span class="block text-sm font-extrabold text-slate-800 group-hover:text-brand-600 transition-colors">
                    {{ cert.employeeName }}
                  </span>
                  <span class="block text-[11px] text-slate-400 font-semibold leading-normal -mt-0.5">
                    {{ cert.employeeRole }} · {{ cert.employeeCompany }}
                  </span>
                  <span class="block text-xs text-brand-600 font-bold mt-1">
                    {{ cert.certificateName }}
                  </span>
                </div>
              </div>

              <!-- Expiry date relative / absolute -->
              <div class="text-right flex items-center gap-3">
                <div>
                  <span
                    class="block text-xs font-bold leading-none"
                    :class="cert.status === 'Expired' ? 'text-red-600' : 'text-yellow-600'"
                  >
                    {{ formatDatePretty(cert.expiresOn) }}
                  </span>
                  <span class="block text-[10px] text-slate-400 font-semibold mt-1">
                    {{ getRelativeTimeText(cert.expiresOn) }}
                  </span>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="renewalCerts.length === 0" class="p-12 text-center">
              <Award class="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 class="text-sm font-bold text-slate-700">No expiring or expired certificates</h3>
              <p class="text-xs text-slate-400 mt-1">All certificates are currently valid and up to date.</p>
            </div>
          </div>
        </div>

        <!-- All Employees Tab Content -->
        <div v-if="activeTab === 'employees'">
          <div class="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>EMPLOYEE & ROLE</span>
            <span class="text-right">CERTIFICATES STATUS</span>
          </div>

          <div class="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
            <div
              v-for="emp in employeesList"
              :key="emp.id"
              @click="navigateToEmployee(emp.id)"
              class="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-all duration-200 group"
            >
              <div>
                <span class="block text-sm font-extrabold text-slate-800 group-hover:text-brand-600 transition-colors">
                  {{ emp.name }}
                </span>
                <span class="block text-[11px] text-slate-400 font-semibold leading-normal -mt-0.5">
                  {{ emp.role }} · {{ emp.company }}
                </span>
                <span class="inline-flex gap-1 mt-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Assigned to {{ emp.projectIds.length }} projects
                </span>
              </div>

              <!-- Certificate metrics badges -->
              <div class="flex items-center gap-3">
                <div class="flex gap-1.5 text-[10px] font-bold">
                  <span v-if="emp.expiredCount > 0" class="px-2 py-0.5 rounded-full text-red-700 bg-red-50 border border-red-100">
                    {{ emp.expiredCount }} Expired
                  </span>
                  <span v-if="emp.expiringCount > 0" class="px-2 py-0.5 rounded-full text-yellow-700 bg-yellow-50 border border-yellow-100">
                    {{ emp.expiringCount }} Expiring
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-success-700 bg-success-50 border border-success-100">
                    {{ emp.validCount }} Valid
                  </span>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="employeesList.length === 0" class="p-12 text-center">
              <Users class="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 class="text-sm font-bold text-slate-700">No employees found</h3>
              <p class="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new employee.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Project Compliance -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div>
          <h2 class="text-base font-extrabold text-slate-800 tracking-tight">Project compliance</h2>
          <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">required certs valid</p>
        </div>

        <div class="space-y-5">
          <div v-for="proj in projectsCompliance" :key="proj.id" class="space-y-2">
            <!-- Project title and percent -->
            <div class="flex justify-between items-center text-xs font-bold text-slate-700">
              <span class="hover:text-brand-600 cursor-pointer truncate mr-2 font-extrabold" @click="store.navigateTo('projects', { projectId: proj.id })">
                {{ proj.name }}
              </span>
              <span :class="[
                proj.percentage === 100 ? 'text-success-600' : '',
                proj.percentage < 100 && proj.percentage >= 70 ? 'text-yellow-600' : '',
                proj.percentage < 70 ? 'text-red-500' : ''
              ]">
                {{ proj.percentage }}%
              </span>
            </div>

            <!-- Progress bar -->
            <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="[
                  proj.percentage === 100 ? 'bg-success-500' : '',
                  proj.percentage < 100 && proj.percentage >= 75 ? 'bg-yellow-500' : '',
                  proj.percentage < 75 ? 'bg-red-500' : ''
                ]"
                :style="{ width: `${proj.percentage}%` }"
              ></div>
            </div>

            <!-- Detail Subtitle -->
            <div class="flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span>{{ proj.workersCount }} workers</span>
              <span :class="proj.gaps > 0 ? 'text-red-500 font-semibold' : ''">{{ proj.gaps }} gaps</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Notice Banner -->
    <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-blue-800">
      <Info class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
      <div>
        <span class="font-extrabold block">Main-menu level info banner</span>
        Tracks every employee's certificates (VCA, BHV, machine, NEN 3140 ...) and flags renewals before they lapse. 
        <strong>Project compliance</strong> = required certs that are valid for the workers assigned. 
        Status derives from each certificate's <em>expires_on</em>; a higher certification level satisfies a lower requirement (e.g. VCA-VOL satisfies VCA-B).
      </div>
    </div>

    <!-- 1. Assign Certificate Modal -->
    <div
      v-if="isAssignCertModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div
        class="bg-white w-full max-w-lg rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-extrabold text-slate-800 text-sm tracking-tight">Assign Certificate</h3>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Register certificate for employee</p>
          </div>
          <button
            @click="closeAssignCertModal"
            class="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Content -->
        <form @submit.prevent="submitAssignCert" class="p-6 space-y-4 overflow-y-auto">
          
          <!-- Employee Selection -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Employee <span class="text-red-500">*</span></label>
            <select
              v-model="assignEmployeeId"
              class="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
            >
              <option v-for="emp in store.employees" :key="emp.id" :value="emp.id">
                {{ emp.name }} ({{ emp.role }} · {{ emp.company }})
              </option>
            </select>
          </div>

          <!-- Type dropdown -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Certificate Type <span class="text-red-500">*</span></label>
            <select
              v-model="assignTypeId"
              class="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
            >
              <option v-for="type in store.certificateTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
              <option value="custom">Custom Certification...</option>
            </select>
          </div>

          <!-- Custom Name and Duration -->
          <div v-if="assignTypeId === 'custom'" class="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Custom Name</label>
              <input
                type="text"
                v-model="assignCustomName"
                placeholder="e.g. Scaffolding inspector"
                class="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
              />
            </div>
            
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Validity Duration (months)</label>
              <input
                type="number"
                v-model="assignCustomValidityMonths"
                min="1"
                max="120"
                class="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <!-- Number -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Certificate Number <span class="text-red-500">*</span></label>
            <input
              type="text"
              v-model="assignNumber"
              placeholder="e.g. VB-123456"
              class="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>

          <!-- Issuer -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Issuer <span class="text-red-500">*</span></label>
            <input
              type="text"
              v-model="assignIssuer"
              placeholder="e.g. VCA Infra"
              class="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>

          <!-- Issued on -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Issued On <span class="text-red-500">*</span></label>
            <input
              type="date"
              v-model="assignIssuedOn"
              class="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
              required
            />
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="closeAssignCertModal"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-brand-500/10 transition-all cursor-pointer"
            >
              Assign Certificate
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 2. Add Employee Modal -->
    <div
      v-if="isAddEmployeeModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div
        class="bg-white w-full max-w-lg rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-extrabold text-slate-800 text-sm tracking-tight">Add Employee</h3>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Register a new employee/worker</p>
          </div>
          <button
            @click="closeAddEmployeeModal"
            class="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Content -->
        <form @submit.prevent="submitAddEmployee" class="p-6 space-y-4 overflow-y-auto">
          <!-- Name -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Full Name <span class="text-red-500">*</span></label>
            <input
              type="text"
              v-model="newEmployeeName"
              placeholder="e.g. John Doe"
              class="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>

          <!-- Role -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Role / Job Title <span class="text-red-500">*</span></label>
            <input
              type="text"
              v-model="newEmployeeRole"
              placeholder="e.g. Machinist"
              class="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>

          <!-- Company -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Company <span class="text-red-500">*</span></label>
            <input
              type="text"
              v-model="newEmployeeCompany"
              placeholder="e.g. Loggix Bouw"
              class="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>

          <!-- Assigned Projects Checkboxes -->
          <div class="space-y-2">
            <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Assigned Projects</label>
            <div class="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-slate-200 p-3 rounded-xl bg-slate-50 custom-scrollbar">
              <label v-for="proj in store.projects" :key="proj.id" class="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  :value="proj.id"
                  v-model="newEmployeeProjects"
                  class="rounded border-slate-350 text-brand-600 focus:ring-brand-500"
                />
                <span class="truncate">{{ proj.name }}</span>
              </label>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="closeAddEmployeeModal"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-brand-500/10 transition-all cursor-pointer"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
