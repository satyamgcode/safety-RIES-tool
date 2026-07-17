<script setup>
import { ref, computed } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import DataTable from '../components/DataTable.vue';
import { Plus, X, Eye, FileSpreadsheet, Trash2 } from 'lucide-vue-next';

// Define Table Columns
const columns = [
  { key: 'name', label: 'Project Name', sortable: true },
  { key: 'client', label: 'Client', sortable: true },
  { key: 'location', label: 'Location', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'assessmentsCount', label: 'RI&Es', sortable: true, class: 'text-center' },
  { key: 'highestRiskScore', label: 'Highest Risk', sortable: true, class: 'text-center' },
  { key: 'openActionsCount', label: 'Open Actions', sortable: true, class: 'text-center' },
  { key: 'reviewDueDate', label: 'Review Due', sortable: true },
  { key: 'manager', label: 'Manager', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false, class: 'text-right' }
];

// Define filters for the DataTable
const filters = computed(() => {
  const managers = Array.from(new Set(store.projects.map(p => p.manager)));
  const clients = Array.from(new Set(store.projects.map(p => p.client)));
  return [
    { key: 'status', label: 'Status', options: ['Active', 'Planning', 'Completed', 'On Hold'] },
    { key: 'manager', label: 'Manager', options: managers },
    { key: 'client', label: 'Client', options: clients }
  ];
});

// Bulk Action options
const bulkActions = ['Export PDF Register', 'Export CSV Register', 'Archive Selected'];

const handleBulkAction = (event) => {
  const { action, ids } = event;
  store.addToast(`Bulk action "${action}" triggered for project IDs: ${ids.join(', ')}.`);
};

// Modal for adding a project
const showNewProjectModal = ref(false);
const newProject = ref({
  name: '',
  client: '',
  location: '',
  status: 'Active',
  manager: '',
  description: '',
  reviewDueDate: new Date(2027, 0, 1).toISOString().split('T')[0]
});

const submitProject = () => {
  if (!newProject.value.name || !newProject.value.client || !newProject.value.manager) {
    store.addToast('Please fill in name, client, and manager fields.', 'error');
    return;
  }
  
  store.addProject({
    name: newProject.value.name,
    client: newProject.value.client,
    location: newProject.value.location || 'HQ Site',
    status: newProject.value.status,
    manager: newProject.value.manager,
    description: newProject.value.description || 'Custom project.',
    reviewDueDate: newProject.value.reviewDueDate
  });

  // Reset & close
  newProject.value = { name: '', client: '', location: '', status: 'Active', manager: '', description: '', reviewDueDate: '2027-01-01' };
  showNewProjectModal.value = false;
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">Active Projects</h1>
        <p class="text-xs text-slate-500 mt-1">Manage, filter, and track assessments and safety hazards across active operations.</p>
      </div>
      <button
        @click="showNewProjectModal = true"
        class="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/10 flex items-center gap-2 transition-all duration-150 hover:scale-102"
      >
        <Plus class="w-4 h-4" />
        <span>New Project</span>
      </button>
    </div>

    <!-- Data Table Card -->
    <div class="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
      <DataTable
        :columns="columns"
        :items="store.projects"
        :filters="filters"
        :bulkActions="bulkActions"
        searchPlaceholder="Search projects by name, client, location, manager..."
        @bulk-action="handleBulkAction"
      >
        <!-- Custom Cells -->
        <template #cell-name="{ item }">
          <button
            @click="store.navigateTo('projects', { projectId: item.id })"
            class="font-semibold text-brand-600 hover:text-brand-800 hover:underline text-left block max-w-xs truncate"
          >
            {{ item.name }}
          </button>
        </template>

        <template #cell-status="{ value }">
          <span
            class="px-2.5 py-0.5 text-[10px] font-bold rounded-full border"
            :class="[
              value === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-100' : '',
              value === 'Planning' ? 'bg-slate-50 text-slate-600 border-slate-100' : '',
              value === 'Completed' ? 'bg-success-50 text-success-700 border-success-100' : '',
              value === 'On Hold' ? 'bg-orange-50 text-orange-700 border-orange-100' : ''
            ]"
          >
            {{ value }}
          </span>
        </template>

        <template #cell-highestRiskScore="{ item }">
          <div class="flex items-center justify-center gap-1.5" v-if="item.highestRiskScore > 0">
            <span class="font-bold text-slate-800 text-xs">{{ item.highestRiskScore }}</span>
            <span class="w-2 h-2 rounded-full" :class="getKinneyRiskLevel(item.highestRiskScore).color.split(' ')[0]"></span>
          </div>
          <span v-else class="text-slate-400 font-medium text-xs">No Risk</span>
        </template>

        <template #cell-openActionsCount="{ value }">
          <span
            class="px-2 py-0.5 rounded-full font-bold text-xs"
            :class="value > 0 ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-slate-50 text-slate-400'"
          >
            {{ value }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <button
              @click="store.navigateTo('projects', { projectId: item.id })"
              class="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="View Project Details"
            >
              <Eye class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Slide-over Modal for New Project -->
    <div v-if="showNewProjectModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-200">
      <div class="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-in">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 class="text-base font-bold text-slate-800">Add New Project</h3>
            <p class="text-xs text-slate-400">Initialize a new project site and assign a manager.</p>
          </div>
          <button @click="showNewProjectModal = false" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="submitProject" class="space-y-4 flex-1">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Name *</label>
            <input
              v-model="newProject.name"
              type="text"
              required
              placeholder="e.g. Harbour Paving & Dredging"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Client *</label>
              <input
                v-model="newProject.client"
                type="text"
                required
                placeholder="e.g. Port Authority Inc."
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
              <input
                v-model="newProject.location"
                type="text"
                placeholder="e.g. Quay 15, Rotterdam"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Manager *</label>
              <select
                v-model="newProject.manager"
                required
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="" disabled>Select Manager</option>
                <option value="Sarah Jenkins">Sarah Jenkins</option>
                <option value="Markus Vance">Markus Vance</option>
                <option value="David Chen">David Chen</option>
                <option value="Elena Rostova">Elena Rostova</option>
                <option value="Amir Patel">Amir Patel</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Status</label>
              <select
                v-model="newProject.status"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="Active">Active</option>
                <option value="Planning">Planning</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Review Due Date</label>
            <input
              v-model="newProject.reviewDueDate"
              type="date"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Scope / Description</label>
            <textarea
              v-model="newProject.description"
              rows="4"
              placeholder="Outline the operations, hazards profile, and work specifications..."
              class="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              @click="showNewProjectModal = false"
              class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/10"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
