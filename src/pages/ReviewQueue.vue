<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import {
  FileClock,
  Play,
  X,
  ClipboardCheck,
  Briefcase,
  AlertTriangle,
  Calendar,
  CheckSquare
} from 'lucide-vue-next';

// Filter reviews that are pending (not completed)
const pendingReviews = computed(() => {
  return store.reviews.filter(r => r.status !== 'Completed');
});

// Search query
const searchQuery = ref('');

// Filtered review list
const filteredReviews = computed(() => {
  if (!searchQuery.value) return pendingReviews.value;
  const q = searchQuery.value.toLowerCase().trim();
  return pendingReviews.value.filter(r => {
    return r.assessmentName.toLowerCase().includes(q) ||
           r.projectName.toLowerCase().includes(q) ||
           r.reviewer.toLowerCase().includes(q);
  });
});

// Review Audit Modal/Section State
const activeReview = ref(null);
const auditNotes = ref('');
const upgradeVersion = ref(true);

const startReview = (rev) => {
  activeReview.value = rev;
  auditNotes.value = '';
  upgradeVersion.value = true;
};

const closeReview = () => {
  activeReview.value = null;
};

const submitReview = () => {
  if (!auditNotes.value.trim()) {
    store.addToast('Please input safety audit notes before completing.', 'error');
    return;
  }

  // Execute review in store
  store.conductAssessmentReview(
    activeReview.value.id,
    auditNotes.value,
    upgradeVersion.value
  );

  activeReview.value = null;
};

// --- SUBSTANCE REVIEW QUEUE FLOW ---
const activeQueueTab = ref('assessments');

const pendingSubstanceReviews = computed(() => {
  const items = [];
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);
  const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

  store.substances.forEach(sub => {
    const isSdsOverdue = sub.sds.status === 'Overdue' || (sub.sds.nextReviewDate && sub.sds.nextReviewDate < todayStr);
    const isRaOverdue = sub.riskAssessment.nextReviewDate && sub.riskAssessment.nextReviewDate < todayStr;
    const isRaRequired = sub.riskAssessment.status === 'Required';
    
    const isSdsDueSoon = sub.sds.status === 'Due Soon' || (sub.sds.nextReviewDate && sub.sds.nextReviewDate >= todayStr && sub.sds.nextReviewDate <= thirtyDaysLaterStr);
    const isRaDueSoon = sub.riskAssessment.nextReviewDate && sub.riskAssessment.nextReviewDate >= todayStr && sub.riskAssessment.nextReviewDate <= thirtyDaysLaterStr;
    const isRaReviewRequired = sub.riskAssessment.status === 'Review Required';

    if (isSdsOverdue || isRaOverdue || isRaRequired || isSdsDueSoon || isRaDueSoon || isRaReviewRequired) {
      let status = 'Scheduled';
      if (isSdsOverdue || isRaOverdue) status = 'Overdue';
      else if (isSdsDueSoon || isRaDueSoon || isRaReviewRequired) status = 'Due Soon';
      else if (isRaRequired) status = 'Initial Required';

      let reason = [];
      if (isSdsOverdue) reason.push('SDS Overdue');
      else if (isSdsDueSoon) reason.push('SDS Due Soon');

      if (isRaRequired) reason.push('Initial RA Required');
      else if (isRaOverdue) reason.push('RA Overdue');
      else if (isRaDueSoon) reason.push('RA Due Soon');
      else if (isRaReviewRequired) reason.push('RA Review Required (Hazards Changed)');

      items.push({
        id: sub.id,
        substanceName: sub.name,
        manufacturer: sub.manufacturer,
        location: sub.location,
        sdsNextReview: sub.sds.nextReviewDate || 'N/A',
        raNextReview: sub.riskAssessment.nextReviewDate || 'N/A',
        status: status,
        reason: reason.join(', '),
        substance: sub
      });
    }
  });
  return items;
});

const activeSubstanceReview = ref(null);
const subReviewType = ref('Full Substance Audit');
const subReviewerName = ref('Senior Safety Inspector');
const subReviewNotes = ref('');
const subReviewNextDate = ref('');
const isSubmittingSubReview = ref(false);

const startSubstanceReview = (item) => {
  activeSubstanceReview.value = item;
  subReviewType.value = 'Full Substance Audit';
  subReviewerName.value = 'Senior Safety Inspector';
  subReviewNotes.value = '';
  
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  subReviewNextDate.value = nextYear.toISOString().split('T')[0];
};

const closeSubstanceReview = () => {
  activeSubstanceReview.value = null;
};

const submitSubstanceReview = () => {
  if (!subReviewNotes.value.trim()) {
    store.addToast('Please enter safety audit notes before completing.', 'error');
    return;
  }
  if (!subReviewNextDate.value) {
    store.addToast('Please specify the next review date.', 'error');
    return;
  }

  isSubmittingSubReview.value = true;
  setTimeout(() => {
    store.conductSubstanceReview(activeSubstanceReview.value.id, {
      type: subReviewType.value,
      reviewer: subReviewerName.value,
      notes: subReviewNotes.value,
      nextReviewDate: subReviewNextDate.value
    });
    isSubmittingSubReview.value = false;
    activeSubstanceReview.value = null;
  }, 600);
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">Review & Audit Queue</h1>
        <p class="text-xs text-slate-500 mt-1">Schedule and sign off on recurring assessment audits, log safety remarks, and manage version control release cycles.</p>
      </div>
    </div>

    <!-- Stats summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
          <FileClock class="w-5 h-5" />
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pending Reviews</span>
          <span class="text-xl font-black text-slate-800 leading-none mt-1 block">{{ pendingReviews.length }}</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
          <AlertTriangle class="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Overdue Audits</span>
          <span class="text-xl font-black text-red-600 leading-none mt-1 block">
            {{ pendingReviews.filter(r => r.status === 'Overdue').length }}
          </span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-success-50 border border-success-100 flex items-center justify-center text-success-600">
          <ClipboardCheck class="w-5 h-5" />
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Completed reviews (YTd)</span>
          <span class="text-xl font-black text-slate-800 leading-none mt-1 block">
            {{ store.reviews.filter(r => r.status === 'Completed').length }}
          </span>
        </div>
      </div>
    </div>

    <!-- Queue Tabs -->
    <div class="flex border-b border-slate-100 mb-6 gap-1">
      <button
        @click="activeQueueTab = 'assessments'"
        class="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap"
        :class="[
          activeQueueTab === 'assessments'
            ? 'border-brand-500 text-brand-600 font-black'
            : 'border-transparent text-slate-400 hover:text-slate-600'
        ]"
      >
        RI&E Assessments Queue ({{ pendingReviews.length }})
      </button>
      <button
        @click="activeQueueTab = 'substances'"
        class="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap"
        :class="[
          activeQueueTab === 'substances'
            ? 'border-brand-500 text-brand-600 font-black'
            : 'border-transparent text-slate-400 hover:text-slate-600'
        ]"
      >
        Hazardous Substances Queue ({{ pendingSubstanceReviews.length }})
      </button>
    </div>

    <!-- Search bar -->
    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search queue by assessment title, project, or auditor..."
          class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div class="text-xs font-semibold text-slate-400">
        Review Cycle: 12 Months standard
      </div>
    </div>

    <!-- Table of Review Queue (RI&E Assessments) -->
    <div v-if="activeQueueTab === 'assessments'" class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
              <th class="px-5 py-3.5">RI&E Assessment Queue</th>
              <th class="px-5 py-3.5">Project Ref</th>
              <th class="px-5 py-3.5 text-center">Version</th>
              <th class="px-5 py-3.5 text-center">Highest Risk Score</th>
              <th class="px-5 py-3.5">Review Due Date</th>
              <th class="px-5 py-3.5">Assigned Auditor</th>
              <th class="px-5 py-3.5">Status</th>
              <th class="px-5 py-3.5 text-right">Audit Trigger</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="rev in filteredReviews" :key="rev.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-5 py-4">
                <button
                  @click="store.navigateTo('assessments', { assessmentId: rev.assessmentId })"
                  class="font-bold text-slate-700 hover:text-brand-600 hover:underline transition-colors block text-left"
                >
                  {{ rev.assessmentName }}
                </button>
              </td>
              <td class="px-5 py-4">
                <button
                  @click="store.navigateTo('projects', { projectId: rev.projectId })"
                  class="text-slate-500 font-semibold hover:text-brand-600 transition-colors"
                >
                  {{ rev.projectName }}
                </button>
              </td>
              <td class="px-5 py-4 text-center">
                <span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold">{{ rev.currentVersion }}</span>
              </td>
              <td class="px-5 py-4 text-center">
                <div class="flex items-center justify-center gap-1.5" v-if="rev.highestRiskScore > 0">
                  <span class="font-bold text-slate-800">{{ rev.highestRiskScore }}</span>
                  <span class="w-1.5 h-1.5 rounded-full" :class="getKinneyRiskLevel(rev.highestRiskScore).color.split(' ')[0]"></span>
                </div>
                <span v-else class="text-slate-400 font-medium">-</span>
              </td>
              <td class="px-5 py-4 font-semibold" :class="rev.status === 'Overdue' ? 'text-red-500 font-bold' : 'text-slate-500'">
                {{ rev.reviewDueDate }}
              </td>
              <td class="px-5 py-4 font-semibold text-slate-600">{{ rev.reviewer }}</td>
              <td class="px-5 py-4">
                <span
                  class="px-2 py-0.5 rounded-full text-[9px] font-bold border"
                  :class="[
                    rev.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100 animate-pulse' : '',
                    rev.status === 'Scheduled' ? 'bg-slate-50 text-slate-500 border-slate-100' : '',
                    rev.status === 'Due Soon' ? 'bg-orange-50 text-orange-600 border-orange-100' : '',
                  ]"
                >
                  {{ rev.status }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <button
                  @click="startReview(rev)"
                  class="bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                >
                  <Play class="w-3.5 h-3.5 fill-current" />
                  <span>Start Audit</span>
                </button>
              </td>
            </tr>
            <tr v-if="filteredReviews.length === 0">
              <td colspan="8" class="text-center py-10 text-slate-400 font-medium">No reviews currently in the pending queue.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Table of Substance Review Queue -->
    <div v-if="activeQueueTab === 'substances'" class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
              <th class="px-5 py-3.5">Substance Name</th>
              <th class="px-5 py-3.5">Manufacturer</th>
              <th class="px-5 py-3.5">Storage Location</th>
              <th class="px-5 py-3.5">SDS Review Due</th>
              <th class="px-5 py-3.5">RA Review Due</th>
              <th class="px-5 py-3.5">Trigger Reason</th>
              <th class="px-5 py-3.5">Status</th>
              <th class="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in pendingSubstanceReviews" :key="item.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-5 py-4">
                <button
                  @click="store.navigateTo('haz-substances-detail', { substanceId: item.id, tab: 'reviews' })"
                  class="font-bold text-slate-700 hover:text-brand-600 hover:underline transition-colors block text-left"
                >
                  {{ item.substanceName }}
                </button>
              </td>
              <td class="px-5 py-4 font-semibold text-slate-500">{{ item.manufacturer }}</td>
              <td class="px-5 py-4 font-semibold text-slate-600">{{ item.location }}</td>
              <td class="px-5 py-4 font-semibold text-slate-500">{{ item.sdsNextReview }}</td>
              <td class="px-5 py-4 font-semibold text-slate-500">{{ item.raNextReview }}</td>
              <td class="px-5 py-4 text-slate-500 font-semibold max-w-xs truncate" :title="item.reason">{{ item.reason }}</td>
              <td class="px-5 py-4">
                <span
                  class="px-2 py-0.5 rounded-full text-[9px] font-bold border"
                  :class="[
                    item.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100 animate-pulse' : '',
                    item.status === 'Due Soon' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : '',
                    item.status === 'Initial Required' ? 'bg-orange-50 text-orange-700 border-orange-100' : '',
                    item.status === 'Scheduled' ? 'bg-slate-50 text-slate-500 border-slate-100' : ''
                  ]"
                >
                  {{ item.status }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <button
                  @click="startSubstanceReview(item)"
                  class="bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                >
                  <Play class="w-3.5 h-3.5 fill-current" />
                  <span>Start Audit</span>
                </button>
              </td>
            </tr>
            <tr v-if="pendingSubstanceReviews.length === 0">
              <td colspan="8" class="text-center py-10 text-slate-400 font-medium">No substances currently requiring safety review.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Inline Review Conduct Panel / Dialog -->
    <div v-if="activeReview" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-fade-in">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ClipboardCheck class="w-5 h-5 text-brand-500" />
            <h4 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-sans">Active HSE Audit & Sign-off</h4>
          </div>
          <button @click="closeReview" class="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
        </div>

        <div class="p-5 space-y-4">
          <!-- Short summary -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
            <div class="flex justify-between font-bold">
              <span>Assessment:</span>
              <span class="text-slate-800">{{ activeReview.assessmentName }}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>Project Site:</span>
              <span class="text-slate-800">{{ activeReview.projectName }}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>Current Version:</span>
              <span class="text-slate-800">{{ activeReview.currentVersion }}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>Highest Risk Score:</span>
              <span class="text-red-600 font-bold">{{ activeReview.highestRiskScore }}</span>
            </div>
          </div>

          <!-- Notes input -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Audit notes & Safety findings *</label>
            <textarea
              v-model="auditNotes"
              rows="5"
              placeholder="Outline edge-guard conditions, safety compliance, harness logs checks, toolbox talk logs etc..."
              class="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            ></textarea>
          </div>

          <!-- Option to upgrade version -->
          <div class="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            <input
              type="checkbox"
              id="chk-version-upgrade"
              v-model="upgradeVersion"
              class="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
            />
            <label for="chk-version-upgrade" class="font-bold text-slate-700 cursor-pointer select-none">
              Publish upgraded version (v{{ parseFloat(activeReview.currentVersion.replace('v','')) + 1 }}.0)
              <span class="block text-[9px] text-slate-400 font-semibold mt-0.5">Will increment version and send current state to Archive history.</span>
            </label>
          </div>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button @click="closeReview" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white text-xs font-bold transition-all cursor-pointer">Cancel</button>
          <button @click="submitReview" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">Complete Safety Review</button>
        </div>
      </div>
    </div>

    <!-- Substance Review Modal -->
    <div v-if="activeSubstanceReview" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-in">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ClipboardCheck class="w-5 h-5 text-brand-500" />
            <h4 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-sans">Audit Hazardous Substance</h4>
          </div>
          <button @click="closeSubstanceReview" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">&times;</button>
        </div>

        <div class="p-5 space-y-4">
          <!-- Info Summary -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
            <div class="flex justify-between font-bold">
              <span>Substance:</span>
              <span class="text-slate-800">{{ activeSubstanceReview.substanceName }}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>Location:</span>
              <span class="text-slate-800">{{ activeSubstanceReview.location }}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>SDS Next Review:</span>
              <span class="text-slate-800">{{ activeSubstanceReview.sdsNextReview }}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>RA Next Review:</span>
              <span class="text-slate-800">{{ activeSubstanceReview.raNextReview }}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>Audit Reason:</span>
              <span class="text-amber-700 font-bold">{{ activeSubstanceReview.reason }}</span>
            </div>
          </div>

          <!-- Review Scope -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Review Scope / Type *</label>
            <select
              v-model="subReviewType"
              class="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold text-slate-700 bg-slate-50"
            >
              <option value="Full Substance Audit">Full Substance Audit (SDS & Risk Assessment)</option>
              <option value="SDS Review">SDS Dates & Compliance Review</option>
              <option value="Risk Assessment Review">Kinney Controls & Risk Evaluation</option>
            </select>
          </div>

          <!-- Reviewer Name -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Safety Inspector / Auditor *</label>
            <input
              v-model="subReviewerName"
              type="text"
              class="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold text-slate-700 bg-slate-50"
            />
          </div>

          <!-- Audit Notes -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Audit findings & notes *</label>
            <textarea
              v-model="subReviewNotes"
              rows="4"
              placeholder="Outline storage check findings, package leakages, correct PPE usage, ventilation status..."
              class="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            ></textarea>
          </div>

          <!-- Next Review Date -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rescheduled Next Review Date *</label>
            <input
              v-model="subReviewNextDate"
              type="date"
              class="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold text-slate-700 bg-slate-50"
            />
          </div>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button @click="closeSubstanceReview" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white text-xs font-bold transition-all cursor-pointer">Cancel</button>
          <button @click="submitSubstanceReview" :disabled="isSubmittingSubReview" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">
            <span v-if="isSubmittingSubReview">Completing...</span>
            <span v-else>Complete Substance Review</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
