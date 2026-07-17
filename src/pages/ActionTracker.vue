<script setup>
import { computed, ref, watch } from 'vue';
import { store } from '../store';
import DataTable from '../components/DataTable.vue';
import {
  X,
  User,
  Calendar,
  AlertCircle,
  FileDown,
  CheckCircle,
  MessageSquare,
  Plus,
  Send,
  History
} from 'lucide-vue-next';

// Define Table Columns
const columns = [
  { key: 'actionId', label: 'Action ID', sortable: true },
  { key: 'title', label: 'Action Title / Task', sortable: true },
  { key: 'hazardName', label: 'Hazard Reference', sortable: true },
  { key: 'projectName', label: 'Project', sortable: true },
  { key: 'assignedTo', label: 'Assigned To', sortable: true },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'dueDate', label: 'Due Date', sortable: true },
  { key: 'progress', label: 'Progress', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false, class: 'text-right' }
];

// Table Filters
const filters = computed(() => {
  const projects = Array.from(new Set(store.actions.map(a => a.projectName)));
  const assignees = Array.from(new Set(store.actions.map(a => a.assignedTo)));
  return [
    { key: 'status', label: 'Status', options: ['Open', 'In Progress', 'Completed', 'Overdue'] },
    { key: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'] },
    { key: 'projectName', label: 'Project', options: projects },
    { key: 'assignedTo', label: 'Assigned To', options: assignees }
  ];
});

// Bulk Action options
const bulkActions = ['Export CSV Action Log', 'Complete Selected', 'Batch Reassign'];

const handleBulkAction = (event) => {
  const { action, ids } = event;
  if (action === 'Complete Selected') {
    ids.forEach(id => store.updateActionStatus(id, 'Completed', 100));
  } else {
    store.addToast(`Bulk action "${action}" completed for ${ids.length} actions.`);
  }
};

// Selected Action for Detail Slide-over
const selectedAction = ref(null);
const newCommentText = ref('');
const localStatus = ref('');
const localProgress = ref(0);

const openDetail = (actionItem) => {
  selectedAction.value = actionItem;
  localStatus.value = actionItem.status;
  localProgress.value = actionItem.progress;
  newCommentText.value = '';
};

const closeDetail = () => {
  selectedAction.value = null;
};

// Update status handler from detail pane
const applyStatusChange = () => {
  if (!selectedAction.value) return;
  store.updateActionStatus(selectedAction.value.id, localStatus.value, localProgress.value);
  // Auto sync slider if set to Completed
  if (localStatus.value === 'Completed') {
    localProgress.value = 100;
  }
};

// Add comment handler
const submitComment = () => {
  if (!newCommentText.value.trim()) return;
  store.addActionComment(selectedAction.value.id, newCommentText.value, 'Current Auditor');
  newCommentText.value = '';
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">Action Tracker</h1>
        <p class="text-xs text-slate-500 mt-1">Global audit list of all corrective actions, task assignees, due dates, and completion status.</p>
      </div>
    </div>

    <!-- Data Table Card -->
    <div class="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
      <DataTable
        :columns="columns"
        :items="store.actions"
        :filters="filters"
        :bulkActions="bulkActions"
        searchPlaceholder="Search actions by title, assigned owner, hazard name, project..."
        @bulk-action="handleBulkAction"
      >
        <!-- Custom Cells -->
        <template #cell-actionId="{ value }">
          <span class="font-bold text-slate-400 font-mono text-xs">{{ value }}</span>
        </template>

        <template #cell-title="{ item }">
          <button
            @click="openDetail(item)"
            class="font-semibold text-brand-600 hover:text-brand-800 hover:underline text-left block max-w-[200px] truncate"
          >
            {{ item.title }}
          </button>
        </template>

        <template #cell-hazardName="{ item }">
          <button
            @click="store.navigateTo('hazards', { hazardId: item.hazardId })"
            class="text-slate-500 font-medium hover:text-brand-600 transition-colors text-left block max-w-[150px] truncate"
          >
            {{ item.hazardName }}
          </button>
        </template>

        <template #cell-projectName="{ item }">
          <button
            @click="store.navigateTo('projects', { projectId: item.projectId })"
            class="text-slate-600 font-semibold hover:text-brand-600 transition-colors text-left block max-w-[120px] truncate animate-fade-in"
          >
            {{ item.projectName }}
          </button>
        </template>

        <template #cell-priority="{ value }">
          <span
            class="px-2 py-0.5 rounded text-[10px] font-bold"
            :class="[
              value === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : '',
              value === 'Medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : '',
              value === 'Low' ? 'bg-slate-100 text-slate-500 border border-slate-200' : '',
            ]"
          >
            {{ value }}
          </span>
        </template>

        <template #cell-dueDate="{ value, item }">
          <span :class="item.status === 'Overdue' ? 'text-red-600 font-bold' : 'text-slate-500'">
            {{ value }}
          </span>
        </template>

        <template #cell-progress="{ value }">
          <div class="flex items-center gap-2">
            <div class="w-16 bg-slate-100 rounded-full h-1 overflow-hidden">
              <div class="bg-brand-500 h-full rounded-full" :style="{ width: value + '%' }"></div>
            </div>
            <span>{{ value }}%</span>
          </div>
        </template>

        <template #cell-status="{ value }">
          <span
            class="px-2.5 py-0.5 text-[9px] font-bold rounded-full"
            :class="[
              value === 'Completed' ? 'bg-success-50 text-success-700 border border-success-100' : '',
              value === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' : '',
              value === 'Open' ? 'bg-slate-50 text-slate-500 border border-slate-100' : '',
              value === 'Overdue' ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse' : '',
            ]"
          >
            {{ value }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end">
            <button
              @click="openDetail(item)"
              class="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Inspect Action Details"
            >
              <CheckCircle class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Action Details Popup Modal -->
    <div v-if="selectedAction" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <!-- Modal Body -->
      <div class="w-full max-w-lg bg-white max-h-[90vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col p-6 overflow-y-auto animate-fade-in custom-scrollbar">
        <!-- Close & Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-400 font-mono text-xs">{{ selectedAction.actionId }}</span>
              <span class="text-slate-300">/</span>
              <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">{{ selectedAction.priority }} Priority</span>
            </div>
            <h3 class="text-base font-bold text-slate-800 mt-1 truncate max-w-xs">{{ selectedAction.title }}</h3>
          </div>
          <button @click="closeDetail" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Description -->
        <div class="space-y-4 flex-1">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
            <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">{{ selectedAction.description }}</p>
          </div>

          <!-- Quick parameters mapping -->
          <div class="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
            <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <User class="w-4 h-4 text-slate-400" />
              <div>
                <span class="block text-[9px] text-slate-400 leading-none">ASSIGNEE</span>
                <span class="block text-slate-700 mt-0.5">{{ selectedAction.assignedTo }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Calendar class="w-4 h-4 text-slate-400" />
              <div>
                <span class="block text-[9px] text-slate-400 leading-none">DUE DATE</span>
                <span class="block text-slate-700 mt-0.5">{{ selectedAction.dueDate }}</span>
              </div>
            </div>
          </div>

          <!-- Status & Progress Editors -->
          <div class="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Update Progress & Status</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status</label>
                <select
                  v-model="localStatus"
                  @change="applyStatusChange"
                  class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Progress ({{ localProgress }}%)</label>
                <input
                  v-model.number="localProgress"
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  @change="applyStatusChange"
                  class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500 mt-3"
                />
              </div>
            </div>
          </div>

          <!-- Comments Feed -->
          <div class="space-y-3 pt-2">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><MessageSquare class="w-4 h-4 text-slate-400" /> Comment Feed</h4>
            
            <div class="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
              <div
                v-for="(cmt, idx) in selectedAction.comments"
                :key="idx"
                class="text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1"
              >
                <div class="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>{{ cmt.author }}</span>
                  <span>{{ cmt.date }}</span>
                </div>
                <p class="text-slate-600 leading-relaxed">{{ cmt.text }}</p>
              </div>
              <div v-if="!selectedAction.comments || selectedAction.comments.length === 0" class="text-center text-[10px] text-slate-400 py-3">
                No updates or comments logged.
              </div>
            </div>

            <!-- Comment Input Box -->
            <div class="flex gap-2">
              <input
                v-model="newCommentText"
                type="text"
                placeholder="Log a comment/update..."
                @keyup.enter="submitComment"
                class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                @click="submitComment"
                class="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0"
              >
                <Send class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Action Timeline logs -->
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><History class="w-4 h-4 text-slate-400" /> Action Resolution Timeline</h4>
            <div class="relative pl-4 border-l border-slate-100 space-y-3.5 ml-2 text-[10px]">
              <div v-for="(tNode, idx) in selectedAction.timeline" :key="idx" class="relative">
                <span class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white border border-slate-300 flex items-center justify-center">
                  <span class="w-1 h-1 rounded-full bg-slate-400"></span>
                </span>
                <span class="block text-slate-400">{{ tNode.date }}</span>
                <span class="block text-slate-600 font-semibold mt-0.5">{{ tNode.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
