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

    <!-- Table of Review Queue -->
    <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
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
                  class="bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ml-auto transition-colors"
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
          <button @click="closeReview" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white text-xs font-bold transition-all">Cancel</button>
          <button @click="submitReview" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all">Complete Safety Review</button>
        </div>
      </div>
    </div>
  </div>
</template>
