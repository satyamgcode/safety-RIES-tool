<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import {
  Plus,
  Search,
  ClipboardList,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Calendar,
  AlertTriangle,
  History
} from 'lucide-vue-next';

// Search filter
const searchQuery = ref('');

// Computed stats
const stats = computed(() => {
  const total = store.tras.length;
  const approved = store.tras.filter(t => t.status === 'Approved').length;
  const draft = store.tras.filter(t => t.status === 'Draft').length;
  const lmras = store.lmras.length;
  return { total, approved, draft, lmras };
});

// Computed list of TRAs with search applied
const filteredTras = computed(() => {
  let list = store.tras;
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(t => 
      t.title.toLowerCase().includes(q) ||
      (t.location && t.location.toLowerCase().includes(q)) ||
      (t.sourceRieName && t.sourceRieName.toLowerCase().includes(q))
    );
  }
  return list;
});

// Get highest residual risk score for a TRA
const getHighestResidualRisk = (tra) => {
  let highest = 0;
  tra.steps.forEach(s => {
    s.hazards.forEach(h => {
      if (h.residualRiskScore > highest) {
        highest = h.residualRiskScore;
      }
    });
  });
  return highest;
};

// Get total hazards count for a TRA
const getHazardsCount = (tra) => {
  return tra.steps.reduce((sum, s) => sum + s.hazards.length, 0);
};

// Find the last LMRA decision for a TRA
const getLastLmra = (traId) => {
  const traLmras = store.lmras
    .filter(l => l.traId === traId)
    .sort((a, b) => b.when.localeCompare(a.when));
  
  if (traLmras.length === 0) return { decision: 'Pending', color: 'text-amber-600 bg-amber-50 border-amber-100' };
  
  const last = traLmras[0];
  if (last.decision === 'Go') return { decision: 'Go', color: 'text-success-700 bg-success-50 border-success-100' };
  return { decision: 'No-Go', color: 'text-red-700 bg-red-50 border-red-100' };
};

// Recent LMRAs linked with their TRA titles
const recentLmras = computed(() => {
  return store.lmras
    .map(lmra => {
      const tra = store.tras.find(t => t.id === lmra.traId);
      return {
        ...lmra,
        traTitle: tra ? tra.title : 'Unknown Task'
      };
    })
    .sort((a, b) => b.when.localeCompare(a.when))
    .slice(0, 5);
});

const handleNewTra = () => {
  store.navigateTo('new-tra');
};

const handleViewTraDetails = (traId) => {
  store.navigateTo('tra-details', { traId });
};
</script>

<template>
  <div class="space-y-8 pb-16 font-sans">
    <!-- Header Page Title -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <ShieldCheck class="w-7 h-7 text-brand-500" />
          <span>Task Safety — TRA's</span>
        </h1>
        <p class="text-xs text-slate-500 mt-1">Manage project-specific Task Risk Analyses (TRA) and Last Minute Risk Analysis (LMRA) logbooks.</p>
      </div>

      <button
        @click="handleNewTra"
        class="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/10 flex items-center gap-1.5 transition-all self-start md:self-auto"
      >
        <Plus class="w-4 h-4" />
        <span>+ New TRA</span>
      </button>
    </div>

    <!-- Stat Grid cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      <!-- Total TRAs -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
        <div class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
          <ClipboardList class="w-5 h-5" />
        </div>
        <div>
          <span class="block font-extrabold text-2xl text-slate-800 tracking-tight">{{ stats.total }}</span>
          <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">TRAs Total</span>
        </div>
      </div>

      <!-- Approved -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
        <div class="w-11 h-11 rounded-xl bg-success-50 border border-success-100 flex items-center justify-center text-success-600">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <div>
          <span class="block font-extrabold text-2xl text-slate-800 tracking-tight">{{ stats.approved }}</span>
          <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Approved / Valid</span>
        </div>
      </div>

      <!-- Draft -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
        <div class="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
          <FileText class="w-5 h-5" />
        </div>
        <div>
          <span class="block font-extrabold text-2xl text-slate-800 tracking-tight">{{ stats.draft }}</span>
          <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Draft</span>
        </div>
      </div>

      <!-- LMRAs Logged -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
        <div class="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
          <History class="w-5 h-5" />
        </div>
        <div>
          <span class="block font-extrabold text-2xl text-slate-800 tracking-tight">{{ stats.lmras }}</span>
          <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">LMRAs Logged</span>
        </div>
      </div>
    </div>

    <!-- Active TRAs Section -->
    <div class="space-y-4">
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div class="relative w-full max-w-md">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-4.5 w-4.5 text-slate-400" />
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tasks, locations, or source RI&Es..."
            class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <span class="text-xs text-slate-400 font-medium">Click a TRA to open its steps & hazards</span>
      </div>

      <!-- TRAs List Table -->
      <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase">
                <th class="px-5 py-3.5">Task</th>
                <th class="px-5 py-3.5">Location</th>
                <th class="px-4 py-3.5 text-center">Steps</th>
                <th class="px-4 py-3.5 text-center">Hazards</th>
                <th class="px-5 py-3.5 text-center">Highest Residual</th>
                <th class="px-5 py-3.5">Status</th>
                <th class="px-5 py-3.5">Valid Until</th>
                <th class="px-5 py-3.5">Last LMRA</th>
                <th class="px-5 py-3.5 text-right"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="tra in filteredTras"
                :key="tra.id"
                class="hover:bg-slate-50/50 transition-colors cursor-pointer"
                @click="handleViewTraDetails(tra.id)"
              >
                <!-- Task title & source RIE -->
                <td class="px-5 py-4">
                  <span class="block font-bold text-slate-800 text-sm leading-snug hover:text-brand-600 transition-colors">{{ tra.title }}</span>
                  <span class="block text-[10px] text-slate-400 mt-1" v-if="tra.sourceRieName">
                    from RI&E • <span class="font-medium text-slate-500">{{ tra.sourceRieName }}</span>
                  </span>
                  <span class="block text-[10px] text-slate-400 mt-1 font-semibold text-brand-600" v-else>
                    Independent Task
                  </span>
                </td>
                
                <!-- Location -->
                <td class="px-5 py-4 font-semibold text-slate-500">
                  <span class="flex items-center gap-1.5 truncate max-w-[155px]" :title="tra.location">
                    <MapPin class="w-3.5 h-3.5 text-slate-400" />
                    {{ tra.location || '-' }}
                  </span>
                </td>

                <!-- Steps Count -->
                <td class="px-4 py-4 text-center font-bold text-slate-700">{{ tra.steps.length }}</td>

                <!-- Hazards Count -->
                <td class="px-4 py-4 text-center font-semibold text-slate-500">{{ getHazardsCount(tra) }}</td>

                <!-- Highest Residual Kinney Risk Badge -->
                <td class="px-5 py-4 text-center font-bold">
                  <div class="flex items-center justify-center" v-if="getHazardsCount(tra) > 0">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 bg-success-50 text-success-700 border border-success-100"
                      :class="[
                        getHighestResidualRisk(tra) >= 150 ? 'bg-red-50 text-red-700 border-red-100' : '',
                        getHighestResidualRisk(tra) >= 70 && getHighestResidualRisk(tra) < 150 ? 'bg-warning-50 text-warning-700 border-warning-100' : ''
                      ]"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {{ getHighestResidualRisk(tra) }}
                    </span>
                  </div>
                  <span v-else class="text-slate-300 font-normal">—</span>
                </td>

                <!-- Status -->
                <td class="px-5 py-4">
                  <span class="flex items-center gap-1.5 font-bold" v-if="tra.status === 'Approved'">
                    <span class="w-2 h-2 rounded-full bg-success-500"></span>
                    <span class="text-success-700">Valid</span>
                  </span>
                  <span class="flex items-center gap-1.5 font-bold text-slate-500" v-else>
                    <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>Draft</span>
                  </span>
                </td>

                <!-- Valid Until -->
                <td class="px-5 py-4 font-medium text-slate-500">
                  <span class="flex items-center gap-1.5" v-if="tra.validUntil">
                    <Calendar class="w-3.5 h-3.5 text-slate-400" />
                    {{ tra.validUntil }}
                  </span>
                  <span class="text-slate-300 font-normal" v-else>—</span>
                </td>

                <!-- Last LMRA Decision status -->
                <td class="px-5 py-4">
                  <span
                    class="px-2.5 py-1 rounded-lg text-[9px] font-bold border flex items-center gap-1 w-fit uppercase"
                    :class="getLastLmra(tra.id).color"
                  >
                    <span>{{ getLastLmra(tra.id).decision }}</span>
                  </span>
                </td>

                <!-- Action Chevron -->
                <td class="px-5 py-4 text-right">
                  <ChevronRight class="w-4 h-4 text-slate-400 ml-auto" />
                </td>
              </tr>

              <tr v-if="filteredTras.length === 0">
                <td colspan="9" class="text-center py-12 text-slate-400">
                  <div class="max-w-xs mx-auto space-y-2">
                    <ClipboardList class="w-8 h-8 mx-auto text-slate-300" />
                    <span class="block font-medium">No Task Risk Analyses found.</span>
                    <button @click="handleNewTra" class="mt-2 bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold px-3.5 py-1.5 rounded-xl border border-brand-100 transition-colors text-xs">
                      Create First TRA
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Recent LMRAs List -->
    <div class="space-y-4">
      <div class="border-b border-slate-100 pb-2">
        <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
          <History class="w-4.5 h-4.5 text-slate-500" />
          <span>Recent LMRAs — On-Site Go/No-Go Checks</span>
        </h2>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase">
                <th class="px-5 py-3">Decision</th>
                <th class="px-5 py-3">Task</th>
                <th class="px-5 py-3">By</th>
                <th class="px-5 py-3">When</th>
                <th class="px-5 py-3">Location</th>
                <th class="px-5 py-3">Comments / Remarks</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="lmra in recentLmras"
                :key="lmra.id"
                class="hover:bg-slate-50/30 transition-colors"
              >
                <!-- Decision Badge -->
                <td class="px-5 py-3">
                  <span
                    class="px-2 py-0.5 rounded-full text-[9px] font-extrabold border"
                    :class="[
                      lmra.decision === 'Go' ? 'bg-success-50 text-success-700 border-success-100' : 'bg-red-50 text-red-700 border-red-100'
                    ]"
                  >
                    {{ lmra.decision }}
                  </span>
                </td>
                
                <!-- Task title -->
                <td class="px-5 py-3 font-semibold text-slate-700 truncate max-w-[200px]" :title="lmra.traTitle">
                  {{ lmra.traTitle }}
                </td>

                <!-- Operator -->
                <td class="px-5 py-3 font-medium text-slate-600">{{ lmra.by }}</td>

                <!-- When -->
                <td class="px-5 py-3 text-slate-400 font-medium">{{ lmra.when }}</td>

                <!-- Location -->
                <td class="px-5 py-3 text-slate-500 font-semibold truncate max-w-[150px]">{{ lmra.location }}</td>

                <!-- Comments -->
                <td class="px-5 py-3 text-slate-500 max-w-[250px] truncate" :title="lmra.comments">
                  {{ lmra.comments || 'No remarks recorded.' }}
                </td>
              </tr>

              <tr v-if="recentLmras.length === 0">
                <td colspan="6" class="text-center py-6 text-slate-400">
                  No Last Minute Risk Analyses have been logged yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
