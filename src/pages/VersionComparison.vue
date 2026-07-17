<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import {
  ArrowRightLeft,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  CheckCircle,
  GitCompare,
  Info
} from 'lucide-vue-next';

// Selection state
const selectedAssessmentId = ref(1); // Default to Roof & Steel Girder Works
const oldVersion = ref('v2.0');
const newVersion = ref('v3.0');

const selectedAssessment = computed(() => {
  return store.assessments.find(a => a.id === selectedAssessmentId.value);
});

// Comparison metrics mock data mapping
const comparisonSummary = computed(() => {
  return {
    addedHazards: 2,
    removedHazards: 1,
    improvedRisks: 4,
    newActions: 3,
    completedActions: 5,
    controlsAdded: 6
  };
});

// Comparison table records mock list
const comparisonHazards = computed(() => {
  return [
    {
      id: 1,
      name: 'Working at height on temporary scissor lift',
      category: 'Safety',
      oldScore: 270,
      newScore: 48,
      diff: -222,
      status: 'Improved'
    },
    {
      id: 2,
      name: 'Falling tools and materials during rigging',
      category: 'Safety',
      oldScore: 135,
      newScore: 24,
      diff: -111,
      status: 'Improved'
    },
    {
      id: 3,
      name: 'Entanglement hazard in welding machine generator',
      category: 'Safety',
      oldScore: 120,
      newScore: 120,
      diff: 0,
      status: 'No Change'
    },
    {
      id: 4,
      name: 'Toxic lead exposure during high heat welding',
      category: 'Chemical',
      oldScore: 180,
      newScore: 48,
      diff: -132,
      status: 'Improved'
    },
    {
      id: 5,
      name: 'Strap snapping on heavy hoist hook',
      category: 'Safety',
      oldScore: 480,
      newScore: 90,
      diff: -390,
      status: 'Improved'
    },
    {
      id: 6,
      name: 'Ergonomic lumbar strain due to steel dragging',
      category: 'Ergonomics',
      oldScore: 0,
      newScore: 36,
      diff: 36,
      status: 'New'
    },
    {
      id: 7,
      name: 'Tripping hazard due to scattered cable cords',
      category: 'Physical',
      oldScore: 60,
      newScore: 0,
      diff: -60,
      status: 'Removed'
    }
  ];
});
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">Version Comparison</h1>
        <p class="text-xs text-slate-500 mt-1">Audit changes, risk score shifts, and control introductions between two published safety archives.</p>
      </div>
    </div>

    <!-- Selectors Card -->
    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><GitCompare class="w-4.5 h-4.5 text-brand-500" /> Comparison Scope</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">RI&E Assessment</label>
          <select
            v-model="selectedAssessmentId"
            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
          >
            <option v-for="a in store.assessments" :key="a.id" :value="a.id">{{ a.title }} ({{ a.projectName }})</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Base Version</label>
          <select
            v-model="oldVersion"
            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
          >
            <option value="v1.0">v1.0 (Baseline Draft)</option>
            <option value="v2.0">v2.0 (Active)</option>
            <option value="v3.0">v3.0</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Revision</label>
          <select
            v-model="newVersion"
            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
          >
            <option value="v2.0">v2.0</option>
            <option value="v3.0">v3.0</option>
            <option value="v4.0">v4.0 (Latest Sign-off)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Summary KPI cards -->
    <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hazards Added</span>
        <span class="block text-xl font-black text-brand-600 mt-1">+{{ comparisonSummary.addedHazards }}</span>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hazards Removed</span>
        <span class="block text-xl font-black text-slate-400 mt-1">-{{ comparisonSummary.removedHazards }}</span>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center border-b-2 border-b-success-500">
        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Improved Risks</span>
        <span class="block text-xl font-black text-success-600 mt-1">{{ comparisonSummary.improvedRisks }}</span>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Actions</span>
        <span class="block text-xl font-black text-orange-600 mt-1">+{{ comparisonSummary.newActions }}</span>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center border-b-2 border-b-success-500">
        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Actions</span>
        <span class="block text-xl font-black text-success-600 mt-1">{{ comparisonSummary.completedActions }}</span>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Controls Added</span>
        <span class="block text-xl font-black text-blue-600 mt-1">{{ comparisonSummary.controlsAdded }}</span>
      </div>
    </div>

    <!-- Comparison Table Grid -->
    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-50 pb-2">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Historical Comparison Table</h4>
        <span class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
          <Info class="w-3.5 h-3.5 text-slate-400" />
          Negative differences indicate successful safety mitigation cycles.
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
              <th class="px-4 py-3">Hazard Title / Description</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3 text-center">Old Kinney Score ({{ oldVersion }})</th>
              <th class="px-4 py-3 text-center">New Kinney Score ({{ newVersion }})</th>
              <th class="px-4 py-3 text-center">Difference</th>
              <th class="px-4 py-3 text-right">Mitigation Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="haz in comparisonHazards" :key="haz.id" class="hover:bg-slate-50/50">
              <td class="px-4 py-3.5 font-bold text-slate-700 max-w-xs truncate">{{ haz.name }}</td>
              <td class="px-4 py-3.5 font-semibold text-slate-500">{{ haz.category }}</td>
              <td class="px-4 py-3.5 text-center font-semibold text-slate-400">
                {{ haz.oldScore === 0 ? '-' : haz.oldScore }}
              </td>
              <td class="px-4 py-3.5 text-center font-bold text-slate-800">
                {{ haz.newScore === 0 ? '-' : haz.newScore }}
              </td>
              <td class="px-4 py-3.5 text-center font-black">
                <span v-if="haz.diff < 0" class="text-success-600 flex items-center justify-center gap-0.5">
                  <TrendingDown class="w-3.5 h-3.5" />
                  {{ haz.diff }}
                </span>
                <span v-else-if="haz.diff > 0" class="text-red-500 flex items-center justify-center gap-0.5">
                  <TrendingUp class="w-3.5 h-3.5" />
                  +{{ haz.diff }}
                </span>
                <span v-else class="text-slate-400 font-normal">0</span>
              </td>
              <td class="px-4 py-3.5 text-right font-bold">
                <span
                  class="px-2 py-0.5 rounded text-[9px] font-bold"
                  :class="[
                    haz.status === 'Improved' ? 'bg-success-50 text-success-700 border border-success-100' : '',
                    haz.status === 'New' ? 'bg-blue-50 text-blue-700 border border-blue-100' : '',
                    haz.status === 'Removed' ? 'bg-slate-100 text-slate-400 border border-slate-200' : '',
                    haz.status === 'No Change' ? 'bg-slate-50 text-slate-500 border border-slate-100' : ''
                  ]"
                >
                  {{ haz.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
