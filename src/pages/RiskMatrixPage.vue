<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import {
  Grid,
  Info,
  SlidersHorizontal,
  Eye,
  AlertTriangle,
  Flame,
  ShieldCheck
} from 'lucide-vue-next';

// Interactive Matrix Filter Coordinate State
const selectedMatrixCell = ref({ l: 3, s: 4 }); // Pre-filter to cells with records for clean default state

const selectCell = (l, s) => {
  if (selectedMatrixCell.value && selectedMatrixCell.value.l === l && selectedMatrixCell.value.s === s) {
    selectedMatrixCell.value = null; // Clear filter
  } else {
    selectedMatrixCell.value = { l, s };
  }
};

// Map Kinney scores to standard 5x5 coordinates
// Likelihood: 1-10 -> 1-5
// Severity: 1-100 -> 1-5
const getMatrixCoords = (haz) => {
  let l = 1;
  if (haz.residualLikelihood >= 8) l = 5;
  else if (haz.residualLikelihood >= 6) l = 4;
  else if (haz.residualLikelihood >= 4) l = 3;
  else if (haz.residualLikelihood >= 2) l = 2;

  let s = 1;
  if (haz.residualSeverity >= 40) s = 5;
  else if (haz.residualSeverity >= 15) s = 4;
  else if (haz.residualSeverity >= 7) s = 3;
  else if (haz.residualSeverity >= 3) s = 2;

  return { l, s };
};

const cellColors5x5 = [
  // L5
  ['bg-orange-400 border-orange-300 hover:bg-orange-500', 'bg-orange-500 border-orange-400 hover:bg-orange-600', 'bg-red-500 border-red-400 hover:bg-red-600', 'bg-red-600 border-red-500 hover:bg-red-700', 'bg-red-700 border-red-600 hover:bg-red-800'],
  // L4
  ['bg-yellow-400 border-yellow-300 hover:bg-yellow-500', 'bg-orange-400 border-orange-300 hover:bg-orange-500', 'bg-orange-500 border-orange-400 hover:bg-orange-600', 'bg-red-500 border-red-400 hover:bg-red-600', 'bg-red-600 border-red-500 hover:bg-red-700'],
  // L3
  ['bg-green-400 border-green-300 hover:bg-green-500', 'bg-yellow-400 border-yellow-300 hover:bg-yellow-500', 'bg-orange-400 border-orange-300 hover:bg-orange-500', 'bg-orange-500 border-orange-400 hover:bg-orange-600', 'bg-red-500 border-red-400 hover:bg-red-600'],
  // L2
  ['bg-green-500 border-green-400 hover:bg-green-600', 'bg-green-400 border-green-300 hover:bg-green-500', 'bg-yellow-400 border-yellow-300 hover:bg-yellow-500', 'bg-orange-400 border-orange-300 hover:bg-orange-500', 'bg-orange-500 border-orange-400 hover:bg-orange-600'],
  // L1
  ['bg-green-600 border-green-500 hover:bg-green-700', 'bg-green-500 border-green-400 hover:bg-green-600', 'bg-green-400 border-green-300 hover:bg-green-500', 'bg-yellow-400 border-yellow-300 hover:bg-yellow-500', 'bg-orange-400 border-orange-300 hover:bg-orange-500']
];

const getCellBgColor = (l, s) => {
  const rIdx = 5 - l;
  const cIdx = s - 1;
  return cellColors5x5[rIdx]?.[cIdx] || 'bg-slate-200';
};

const getCellCount = (l, s) => {
  return store.hazards.filter(h => {
    const coords = getMatrixCoords(h);
    return coords.l === l && coords.s === s;
  }).length;
};

// Filtered Hazards list based on selected matrix coordinate
const matrixCellHazards = computed(() => {
  if (!selectedMatrixCell.value) return store.hazards;
  const { l, s } = selectedMatrixCell.value;
  return store.hazards.filter(h => {
    const coords = getMatrixCoords(h);
    return coords.l === l && coords.s === s;
  });
});

// Risk rating description based on selected coordinates
const cellRatingDescription = computed(() => {
  if (!selectedMatrixCell.value) return { name: 'Full Register', class: 'bg-slate-100 text-slate-700' };
  const { l, s } = selectedMatrixCell.value;
  const val = l * s;
  if (val <= 4) return { name: 'Low Risk Zone', class: 'bg-success-50 text-success-700 border border-success-100' };
  if (val <= 9) return { name: 'Medium Risk Zone', class: 'bg-yellow-50 text-yellow-700 border border-yellow-100' };
  if (val <= 16) return { name: 'High Risk Zone', class: 'bg-warning-50 text-warning-700 border border-warning-100' };
  return { name: 'Critical Risk Zone', class: 'bg-red-50 text-red-700 border border-red-100' };
});
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">Interactive Risk Matrix</h1>
        <p class="text-xs text-slate-500 mt-1">Cross-mitigation 5x5 analysis dashboard. Click cells to filter active registry items instantly.</p>
      </div>
    </div>

    <!-- Matrix Layout Grid (2 Columns: Left Matrix, Right List) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Matrix visualizer (cols span 7) -->
      <div class="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
        <div>
          <div class="border-b border-slate-50 pb-3 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">HSE Standard 5x5 Matrix</h3>
              <p class="text-xs text-slate-400 mt-1">Map of Likelihood against Consequence. Numerical values represent active hazard count.</p>
            </div>
            <span class="text-xs font-semibold text-slate-400">Model: Kinney Coords Mapping</span>
          </div>

          <div class="flex items-start justify-center py-6">
            <!-- Y-axis Label -->
            <div class="h-64 flex items-center justify-center">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest origin-center -rotate-90 -translate-x-5 w-4 block whitespace-nowrap">Likelihood (1-5)</span>
            </div>

            <div>
              <!-- The Matrix grid -->
              <div class="grid grid-rows-5 gap-2 w-80 h-64 select-none">
                <!-- L5 down to 1 -->
                <div v-for="l in [5, 4, 3, 2, 1]" :key="'row-'+l" class="grid grid-cols-5 gap-2 h-full">
                  <button
                    v-for="s in [1, 2, 3, 4, 5]"
                    :key="'cell-'+l+'-'+s"
                    @click="selectCell(l, s)"
                    class="h-full rounded-lg font-bold text-xs text-white border flex flex-col items-center justify-center transition-all relative overflow-hidden shadow-sm"
                    :class="[
                      getCellBgColor(l, s),
                      selectedMatrixCell && selectedMatrixCell.l === l && selectedMatrixCell.s === s
                        ? 'ring-4 ring-slate-800 scale-105 z-10 font-black shadow-lg border-slate-800'
                        : 'opacity-90 hover:opacity-100 hover:scale-102'
                    ]"
                  >
                    <span class="text-[10px] font-semibold opacity-70">L{{l}}-S{{s}}</span>
                    <span class="text-sm font-black mt-0.5">{{ getCellCount(l, s) }}</span>
                  </button>
                </div>
              </div>

              <!-- X Axis Labels -->
              <div class="grid grid-cols-5 gap-2 w-80 text-center text-[10px] font-black text-slate-400 mt-2">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
              <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mt-3">
                Consequence / Severity (1-5)
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Legend -->
        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Matrix Risk Legend</h4>
          <div class="grid grid-cols-4 gap-2 text-[10px] font-bold text-center text-white">
            <div class="bg-green-500 rounded p-1.5 shadow-sm">Low (1-4)</div>
            <div class="bg-yellow-500 rounded p-1.5 shadow-sm text-slate-800">Medium (5-9)</div>
            <div class="bg-orange-500 rounded p-1.5 shadow-sm">High (10-16)</div>
            <div class="bg-red-600 rounded p-1.5 shadow-sm">Critical (17-25)</div>
          </div>
        </div>
      </div>

      <!-- Right filtered items list (cols span 5) -->
      <div class="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="border-b border-slate-50 pb-3 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Filtered Hazards</h3>
            <p class="text-xs text-slate-400 mt-1">Inspection pane for selected risk combination.</p>
          </div>
          <span
            class="px-2.5 py-0.5 text-[10px] font-bold rounded-full"
            :class="cellRatingDescription.class"
          >
            {{ cellRatingDescription.name }}
          </span>
        </div>

        <!-- Hazard Items List Container -->
        <div class="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
          <div
            v-for="haz in matrixCellHazards"
            :key="haz.id"
            @click="store.navigateTo('hazards', { hazardId: haz.id })"
            class="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-brand-300 hover:bg-brand-50/20 cursor-pointer transition-all flex items-start justify-between gap-3 group"
          >
            <div class="min-w-0">
              <span class="block font-bold text-slate-700 text-xs truncate group-hover:text-brand-600 transition-colors">{{ haz.name }}</span>
              <span class="block text-[10px] text-slate-400 mt-1 truncate">Project: {{ haz.projectName }}</span>
              <span class="block text-[10px] text-slate-400">Area: {{ haz.location }}</span>
            </div>
            <div class="shrink-0 text-right">
              <span class="block text-xs font-bold text-slate-800">Score {{ haz.residualRiskScore }}</span>
              <span class="block text-[9px] font-bold text-slate-400 mt-1">L{{ haz.residualLikelihood }} x E{{ haz.residualExposure }}</span>
            </div>
          </div>

          <div v-if="matrixCellHazards.length === 0" class="text-center text-xs text-slate-400 py-10">
            No active hazards map to this matrix coordinate combination.
          </div>
        </div>

        <div class="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-2">
          <Info class="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Click any hazard block to inspect controls & actions directly.</span>
        </div>
      </div>
    </div>
  </div>
</template>
