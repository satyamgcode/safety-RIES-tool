<script setup>
import { ref, computed, watch } from 'vue';
import {
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Eye,
  Settings2,
  Trash2,
  SlidersHorizontal,
  Download
} from 'lucide-vue-next';

const props = defineProps({
  columns: {
    type: Array,
    required: true // e.g., [{ key: 'name', label: 'Project Name', sortable: true }]
  },
  items: {
    type: Array,
    required: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Search records...'
  },
  filters: {
    type: Array,
    default: () => [] // e.g., [{ key: 'status', label: 'Status', options: [...] }]
  },
  bulkActions: {
    type: Array,
    default: () => [] // e.g., ['Export CSV', 'Archive Selected']
  },
  rowClickable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['view', 'edit', 'bulk-action', 'selection-change', 'row-click']);

// Core State
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const sortBy = ref('');
const sortDesc = ref(false);
const selectedRows = ref(new Set());

// Active filters state
const activeFilters = ref({});
props.filters.forEach(f => {
  activeFilters.value[f.key] = '';
});

// Column visibility state
const visibleColumnKeys = ref(props.columns.map(c => c.key));
const showColSettings = ref(false);
const showFilterDropdown = ref(false);

// Reset pagination when search/filter changes
watch([searchQuery, activeFilters], () => {
  currentPage.value = 1;
  selectedRows.value.clear();
  emit('selection-change', []);
}, { deep: true });

// Toggle columns
const toggleColumn = (key) => {
  const idx = visibleColumnKeys.value.indexOf(key);
  if (idx > -1) {
    if (visibleColumnKeys.value.length > 1) { // Keep at least one visible
      visibleColumnKeys.value.splice(idx, 1);
    }
  } else {
    visibleColumnKeys.value.push(key);
  }
};

// Filtered and sorted items
const filteredItems = computed(() => {
  let result = [...props.items];

  // 1. Search Query (Across all keys)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(item => {
      return props.columns.some(col => {
        const val = item[col.key];
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }

  // 2. Filters
  Object.keys(activeFilters.value).forEach(key => {
    const val = activeFilters.value[key];
    if (val) {
      result = result.filter(item => {
        if (item[key] === undefined) return false;
        return String(item[key]) === String(val);
      });
    }
  });

  // 3. Sorting
  if (sortBy.value) {
    const colKey = sortBy.value;
    result.sort((a, b) => {
      let valA = a[colKey];
      let valB = b[colKey];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (valA < valB) return sortDesc.value ? 1 : -1;
      if (valA > valB) return sortDesc.value ? -1 : 1;
      return 0;
    });
  }

  return result;
});

// Paginated items
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredItems.value.slice(start, end);
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / pageSize.value) || 1;
});

// Sorting handler
const toggleSort = (key) => {
  const col = props.columns.find(c => c.key === key);
  if (!col || col.sortable === false) return;

  if (sortBy.value === key) {
    if (sortDesc.value) {
      sortBy.value = '';
      sortDesc.value = false;
    } else {
      sortDesc.value = true;
    }
  } else {
    sortBy.value = key;
    sortDesc.value = false;
  }
};

// Row selection helpers
const isAllSelected = computed(() => {
  if (paginatedItems.value.length === 0) return false;
  return paginatedItems.value.every(item => selectedRows.value.has(item.id));
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    paginatedItems.value.forEach(item => selectedRows.value.delete(item.id));
  } else {
    paginatedItems.value.forEach(item => selectedRows.value.add(item.id));
  }
  emit('selection-change', Array.from(selectedRows.value));
};

const toggleSelectRow = (id) => {
  if (selectedRows.value.has(id)) {
    selectedRows.value.delete(id);
  } else {
    selectedRows.value.add(id);
  }
  emit('selection-change', Array.from(selectedRows.value));
};

// Clear all selection
const clearSelection = () => {
  selectedRows.value.clear();
  emit('selection-change', []);
};

// Trigger Bulk Action
const triggerBulk = (action) => {
  emit('bulk-action', { action, ids: Array.from(selectedRows.value) });
  clearSelection();
};
</script>

<template>
  <div class="space-y-4">
    <!-- Controls bar: Search, Filter toggle, Column settings, Bulk Actions -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
        />
      </div>

      <!-- Action items -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Bulk Action Dropdown (shows when rows selected) -->
        <div v-if="selectedRows.size > 0" class="flex items-center gap-2 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-lg text-sm text-brand-700 animate-fade-in">
          <span class="font-semibold">{{ selectedRows.size }} selected</span>
          <div class="h-4 w-[1px] bg-brand-200"></div>
          <div class="relative group">
            <button class="flex items-center gap-1 font-medium hover:text-brand-900 focus:outline-none">
              Bulk Actions <ChevronDown class="w-4 h-4" />
            </button>
            <div class="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block hover:block z-20">
              <button
                v-for="act in bulkActions"
                :key="act"
                @click="triggerBulk(act)"
                class="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Download class="w-3.5 h-3.5 text-slate-400" v-if="act.toLowerCase().includes('export')" />
                <Trash2 class="w-3.5 h-3.5 text-red-400" v-else-if="act.toLowerCase().includes('delete') || act.toLowerCase().includes('archive')" />
                <span>{{ act }}</span>
              </button>
            </div>
          </div>
          <button @click="clearSelection" class="text-xs hover:underline text-slate-500 ml-2">Clear</button>
        </div>

        <!-- Filter Dropdown Toggle -->
        <div v-if="filters.length > 0" class="relative">
          <button
            @click="showFilterDropdown = !showFilterDropdown; showColSettings = false"
            class="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            :class="Object.values(activeFilters).some(v => v !== '') ? 'bg-brand-50/50 border-brand-200 text-brand-600' : ''"
          >
            <SlidersHorizontal class="w-4 h-4" />
            <span>Filters</span>
          </button>

          <!-- Filter Popup -->
          <div v-if="showFilterDropdown" class="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-4 space-y-3">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Records</h4>
            <div v-for="filter in filters" :key="filter.key" class="space-y-1">
              <label class="text-xs font-medium text-slate-600">{{ filter.label }}</label>
              <select
                v-model="activeFilters[filter.key]"
                class="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
              >
                <option value="">All</option>
                <option v-for="opt in filter.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="flex justify-end pt-2 border-t border-slate-100">
              <button
                @click="Object.keys(activeFilters).forEach(k => activeFilters[k] = ''); showFilterDropdown = false"
                class="text-xs font-semibold text-brand-600 hover:underline"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Column Visibility Toggle -->
        <div class="relative">
          <button
            @click="showColSettings = !showColSettings; showFilterDropdown = false"
            class="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Settings2 class="w-4 h-4" />
            <span>Columns</span>
          </button>

          <!-- Column list -->
          <div v-if="showColSettings" class="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-4 space-y-2">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Toggle Columns</h4>
            <div v-for="col in columns" :key="col.key" class="flex items-center gap-2.5">
              <input
                type="checkbox"
                :id="`col-${col.key}`"
                :checked="visibleColumnKeys.includes(col.key)"
                @change="toggleColumn(col.key)"
                class="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
              />
              <label :for="`col-${col.key}`" class="text-xs text-slate-700 font-medium cursor-pointer select-none">{{ col.label }}</label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto max-h-[500px] custom-scrollbar">
        <table class="w-full text-left border-collapse table-auto">
          <!-- Sticky Header -->
          <thead class="sticky top-0 bg-slate-50/90 backdrop-blur-md border-b border-slate-100 z-10">
            <tr>
              <!-- Master Checkbox -->
              <th class="w-12 px-4 py-3 text-center align-middle">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </th>
              <!-- Column Headers -->
              <th
                v-for="col in columns.filter(c => visibleColumnKeys.includes(c.key))"
                :key="col.key"
                @click="toggleSort(col.key)"
                class="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider select-none cursor-pointer"
                :class="[col.sortable !== false ? 'hover:text-slate-800' : 'cursor-default', col.class]"
              >
                <div class="flex items-center gap-1.5">
                  <span>{{ col.label }}</span>
                  <span v-if="col.sortable !== false" class="flex flex-col text-slate-400">
                    <ChevronUp v-if="sortBy === col.key && !sortDesc" class="w-3 h-3 text-brand-600" />
                    <ChevronDown v-else-if="sortBy === col.key && sortDesc" class="w-3 h-3 text-brand-600" />
                    <SlidersHorizontal v-else class="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-300" />
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in paginatedItems"
              :key="item.id"
              class="hover:bg-slate-50/80 transition-colors group"
              :class="[
                selectedRows.has(item.id) ? 'bg-brand-50/20' : '',
                rowClickable ? 'cursor-pointer' : ''
              ]"
              @click="rowClickable && emit('row-click', item)"
            >
              <!-- Row Checkbox -->
              <td class="px-4 py-3.5 text-center align-middle">
                <input
                  type="checkbox"
                  :checked="selectedRows.has(item.id)"
                  @click.stop="toggleSelectRow(item.id)"
                  class="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </td>
              <!-- Data cells -->
              <td
                v-for="col in columns.filter(c => visibleColumnKeys.includes(c.key))"
                :key="col.key"
                class="px-5 py-3.5 text-sm text-slate-600 whitespace-nowrap"
                :class="col.class"
              >
                <!-- Scoped slot for custom rendering -->
                <slot :name="`cell-${col.key}`" :item="item" :value="item[col.key]">
                  {{ item[col.key] === undefined || item[col.key] === null ? '-' : item[col.key] }}
                </slot>
              </td>
            </tr>
            <!-- Empty state -->
            <tr v-if="filteredItems.length === 0">
              <td :colspan="visibleColumnKeys.length + 1" class="text-center py-10 text-slate-400">
                <div class="max-w-xs mx-auto flex flex-col items-center">
                  <SlidersHorizontal class="w-8 h-8 text-slate-300 mb-2" />
                  <span class="text-sm font-medium">No records found matching search or filters.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
        <div>
          Showing <span class="font-semibold text-slate-700">{{ filteredItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0 }}</span>
          to <span class="font-semibold text-slate-700">{{ Math.min(currentPage * pageSize, filteredItems.length) }}</span>
          of <span class="font-semibold text-slate-700">{{ filteredItems.length }}</span> records
        </div>

        <div class="flex items-center gap-4">
          <!-- Rows per page -->
          <div class="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              v-model="pageSize"
              @change="currentPage = 1"
              class="border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium text-slate-700"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>

          <!-- Navigation controls -->
          <div class="flex items-center gap-1.5">
            <button
              @click="currentPage = 1"
              :disabled="currentPage === 1"
              class="p-1.5 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronsLeft class="w-4 h-4" />
            </button>
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="p-1.5 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>

            <span class="font-medium text-slate-700">Page {{ currentPage }} of {{ totalPages }}</span>

            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="p-1.5 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
            <button
              @click="currentPage = totalPages"
              :disabled="currentPage === totalPages"
              class="p-1.5 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronsRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
