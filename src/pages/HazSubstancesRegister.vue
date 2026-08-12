<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import {
  Beaker,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  Wrench,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-vue-next';

// Search and Filter state
const searchQuery = ref('');
const filterSds = ref('All');
const filterRisk = ref('All');
const filterStatus = ref('All');

// Clear filters
const resetFilters = () => {
  searchQuery.value = '';
  filterSds.value = 'All';
  filterRisk.value = 'All';
  filterStatus.value = 'All';
};

// Filtered substances
const filteredSubstances = computed(() => {
  return store.substances.filter(sub => {
    // Search query match
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      sub.manufacturer.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      sub.location.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      sub.usedFor.toLowerCase().includes(searchQuery.value.toLowerCase());

    // SDS status match
    const matchesSds = filterSds.value === 'All' || sub.sds.status === filterSds.value;

    // Risk Assessment match
    const matchesRisk = filterRisk.value === 'All' || sub.riskAssessment.status === filterRisk.value;

    // Substance status match
    const matchesStatus = filterStatus.value === 'All' || sub.status === filterStatus.value;

    return matchesSearch && matchesSds && matchesRisk && matchesStatus;
  });
});

// Map pictograms to emojis/colors
const getGhsIcon = (pic) => {
  const mapping = {
    GHS02: { char: '🔥', label: 'Flammable' },
    GHS05: { char: '🧪', label: 'Corrosive' },
    GHS06: { char: '☠️', label: 'Toxic' },
    GHS07: { char: '⚠️', label: 'Harmful' },
    GHS08: { char: '👤', label: 'Health Hazard' },
    GHS09: { char: '🌿', label: 'Environmental' }
  };
  return mapping[pic] || { char: '❓', label: pic };
};

const exportCsv = () => {
  store.addToast('Exporting substance register to CSV...', 'success');
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight font-sans">Substance Register</h1>
        <p class="text-xs text-slate-500 mt-1">Portfolio registry of hazardous chemical products, active SDS sheets, GHS warning icons, and approved controls.</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="exportCsv"
          class="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all duration-200 shadow-xs cursor-pointer"
        >
          <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
          <span>Export CSV</span>
        </button>
        <button
          @click="store.navigateTo('haz-substances-add')"
          class="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/10 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Add substance</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Search bar -->
        <div class="relative lg:col-span-2">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by substance name, manufacturer, location..."
            class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
          />
        </div>

        <!-- SDS Filter -->
        <div class="flex flex-col">
          <select
            v-model="filterSds"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-600 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
          >
            <option value="All">SDS Status: All</option>
            <option value="Current">🟢 Current</option>
            <option value="Due Soon">🟡 Due Soon</option>
            <option value="Overdue">🔴 Overdue</option>
            <option value="Missing">⚪ Missing</option>
          </select>
        </div>

        <!-- Risk Assessment Filter -->
        <div class="flex flex-col">
          <select
            v-model="filterRisk"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-600 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
          >
            <option value="All">Risk Assmt: All</option>
            <option value="Approved">🟢 Approved</option>
            <option value="Required">🟠 Required</option>
            <option value="Draft">⚪ Draft</option>
            <option value="Review Required">🟡 Review Required</option>
          </select>
        </div>

        <!-- Substance Status Filter -->
        <div class="flex flex-col">
          <select
            v-model="filterStatus"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-600 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
          >
            <option value="All">Substance: All</option>
            <option value="Active">🟢 Active</option>
            <option value="Draft">⚪ Draft</option>
            <option value="Restricted">🔴 Restricted</option>
            <option value="Archived">⚫ Archived</option>
          </select>
        </div>
      </div>

      <!-- Reset button -->
      <div v-if="searchQuery || filterSds !== 'All' || filterRisk !== 'All' || filterStatus !== 'All'" class="flex justify-end pt-1">
        <button
          @click="resetFilters"
          class="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <RefreshCw class="w-3 h-3" />
          <span>Clear Filters</span>
        </button>
      </div>
    </div>

    <!-- Substance Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th class="py-3.5 px-6">Substance</th>
              <th class="py-3.5 px-4">Manufacturer</th>
              <th class="py-3.5 px-4">GHS</th>
              <th class="py-3.5 px-4">Location</th>
              <th class="py-3.5 px-4 text-right">Quantity</th>
              <th class="py-3.5 px-4">Used For</th>
              <th class="py-3.5 px-4">SDS</th>
              <th class="py-3.5 px-4">Risk</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs font-medium text-slate-600">
            <tr v-if="filteredSubstances.length === 0">
              <td colspan="10" class="py-8 text-center text-slate-400 font-medium">
                No substances match the current filters.
              </td>
            </tr>
            <tr
              v-for="sub in filteredSubstances"
              :key="sub.id"
              class="hover:bg-slate-50/60 transition-colors cursor-pointer"
              @click="store.navigateTo('haz-substances-detail', { substanceId: sub.id })"
            >
              <td class="py-4 px-6 font-bold text-slate-800">
                <span class="hover:text-brand-600 hover:underline block max-w-[160px] truncate">
                  {{ sub.name }}
                </span>
              </td>
              <td class="py-4 px-4 text-slate-500 font-semibold">{{ sub.manufacturer }}</td>
              <td class="py-4 px-4">
                <div class="flex items-center gap-1">
                  <span
                    v-for="pic in sub.hazards.pictograms.slice(0, 3)"
                    :key="pic"
                    class="cursor-help text-sm"
                    :title="getGhsIcon(pic).label"
                  >
                    {{ getGhsIcon(pic).char }}
                  </span>
                  <span v-if="sub.hazards.pictograms.length > 3" class="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 rounded">
                    +{{ sub.hazards.pictograms.length - 3 }}
                  </span>
                </div>
              </td>
              <td class="py-4 px-4 text-slate-500">{{ sub.location }}</td>
              <td class="py-4 px-4 text-right font-bold text-slate-700">
                {{ sub.quantity }} <span class="text-[10px] text-slate-400 font-medium">{{ sub.unit }}</span>
              </td>
              <td class="py-4 px-4 text-slate-500 truncate max-w-[130px]">{{ sub.usedFor }}</td>
              <td class="py-4 px-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  :class="[
                    sub.sds.status === 'Current' ? 'bg-success-50 text-success-700 border-success-100' : '',
                    sub.sds.status === 'Due Soon' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : '',
                    sub.sds.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100' : '',
                    sub.sds.status === 'Missing' ? 'bg-slate-50 text-slate-500 border-slate-200' : ''
                  ]"
                >
                  <span class="w-1.5 h-1.5 rounded-full"
                    :class="[
                      sub.sds.status === 'Current' ? 'bg-success-500' : '',
                      sub.sds.status === 'Due Soon' ? 'bg-yellow-500' : '',
                      sub.sds.status === 'Overdue' ? 'bg-red-500' : '',
                      sub.sds.status === 'Missing' ? 'bg-slate-400' : ''
                    ]"
                  ></span>
                  <span>{{ sub.sds.status }}</span>
                </span>
              </td>
              <td class="py-4 px-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  :class="[
                    sub.riskAssessment.status === 'Approved' ? 'bg-success-50 text-success-700 border-success-100' : '',
                    sub.riskAssessment.status === 'Required' ? 'bg-orange-50 text-orange-700 border-orange-100' : '',
                    sub.riskAssessment.status === 'Draft' ? 'bg-slate-50 text-slate-500 border-slate-200' : '',
                    sub.riskAssessment.status === 'Review Required' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''
                  ]"
                >
                  <span class="w-1.5 h-1.5 rounded-full"
                    :class="[
                      sub.riskAssessment.status === 'Approved' ? 'bg-success-500' : '',
                      sub.riskAssessment.status === 'Required' ? 'bg-orange-500' : '',
                      sub.riskAssessment.status === 'Draft' ? 'bg-slate-400' : '',
                      sub.riskAssessment.status === 'Review Required' ? 'bg-amber-500' : ''
                    ]"
                  ></span>
                  <span>{{ sub.riskAssessment.status === 'Review Required' ? 'Review Required' : sub.riskAssessment.status }}</span>
                </span>
              </td>
              <td class="py-4 px-4">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
                  :class="[
                    sub.status === 'Active' ? 'bg-brand-50 text-brand-700 border-brand-100' : '',
                    sub.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' : '',
                    sub.status === 'Restricted' ? 'bg-red-50 text-red-700 border-red-100' : '',
                    sub.status === 'Archived' ? 'bg-slate-200 text-slate-500 border-slate-300' : ''
                  ]"
                >
                  {{ sub.status }}
                </span>
              </td>
              <td class="py-4 px-6 text-center" @click.stop>
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="store.navigateTo('haz-substances-detail', { substanceId: sub.id })"
                    class="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                    title="View details"
                  >
                    <Eye class="w-4.5 h-4.5" />
                  </button>
                  <button
                    v-if="sub.riskAssessment.status === 'Required'"
                    @click="store.navigateTo('haz-substances-assessment', { substanceId: sub.id })"
                    class="p-1 text-slate-400 hover:text-orange-500 transition-colors"
                    title="Create assessment"
                  >
                    <Wrench class="w-4.5 h-4.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Footer details -->
      <div class="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
        <span>Showing {{ filteredSubstances.length }} of {{ store.substances.length }} registered products</span>
        <span class="text-brand-600">HSEhub Safety Standard</span>
      </div>
    </div>
  </div>
</template>
