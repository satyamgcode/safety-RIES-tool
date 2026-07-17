<script setup>
import { computed } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import DataTable from '../components/DataTable.vue';
import { FileDown, Eye, Copy, ClipboardCheck, Trash2 } from 'lucide-vue-next';

// Define Table Columns
const columns = [
  { key: 'status', label: 'Status', sortable: true },
  { key: 'projectName', label: 'Project', sortable: true },
  { key: 'title', label: 'Assessment / Title', sortable: true },
  { key: 'version', label: 'Version', sortable: true, class: 'text-center' },
  { key: 'area', label: 'Area / Zone', sortable: true },
  { key: 'highestInitialRisk', label: 'Initial Risk', sortable: true, class: 'text-center' },
  { key: 'highestResidualRisk', label: 'Residual Risk', sortable: true, class: 'text-center' },
  { key: 'hazardsCount', label: 'Hazards', sortable: true, class: 'text-center' },
  { key: 'openActionsCount', label: 'Actions', sortable: true, class: 'text-center' },
  { key: 'reviewDate', label: 'Review Date', sortable: true },
  { key: 'assessor', label: 'Assessor', sortable: true },
  { key: 'updatedAt', label: 'Updated', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false, class: 'text-right' }
];

// Table Filters
const filters = computed(() => {
  const projects = Array.from(new Set(store.assessments.map(a => a.projectName)));
  const assessors = Array.from(new Set(store.assessments.map(a => a.assessor)));
  return [
    { key: 'status', label: 'Status', options: ['Published', 'Under Review', 'Draft'] },
    { key: 'projectName', label: 'Project', options: projects },
    { key: 'assessor', label: 'Assessor', options: assessors }
  ];
});

// Bulk Action options
const bulkActions = ['Export PDF Reports', 'Clone Selected', 'Batch Start Audits', 'Archive Selected'];

const handleBulkAction = (event) => {
  const { action, ids } = event;
  if (action === 'Clone Selected') {
    ids.forEach(id => store.cloneAssessment(id));
  } else if (action === 'Archive Selected') {
    ids.forEach(id => store.archiveAssessment(id));
  } else {
    store.addToast(`Bulk action "${action}" completed for ${ids.length} assessments.`);
  }
};

const handleExport = (title) => {
  store.addToast(`Generating and exporting RI&E dossier for: "${title}"...`);
  // simulate pdf downloader
  setTimeout(() => {
    store.addToast(`File ready: RI&E-${title.replace(/\s+/g, '_')}_Report.pdf`, 'success');
  }, 1500);
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">RI&E Assessments</h1>
        <p class="text-xs text-slate-500 mt-1">Global list of all safety assessments, hazard indices, review lifecycles, and publication versions.</p>
      </div>
      <button
        @click="store.navigateTo('create-assessment')"
        class="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/10 flex items-center gap-2 transition-all duration-150 hover:scale-102"
      >
        <span>Create Assessment Wizard</span>
      </button>
    </div>

    <!-- Data Table Card -->
    <div class="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
      <DataTable
        :columns="columns"
        :items="store.assessments"
        :filters="filters"
        :bulkActions="bulkActions"
        searchPlaceholder="Search assessments by project, title, assessor, location..."
        @bulk-action="handleBulkAction"
      >
        <!-- Custom Cells -->
        <template #cell-status="{ value }">
          <span
            class="px-2 py-0.5 text-[10px] font-bold rounded-full border"
            :class="[
              value === 'Published' ? 'bg-success-50 text-success-700 border-success-100' : '',
              value === 'Under Review' ? 'bg-blue-50 text-blue-700 border-blue-100' : '',
              value === 'Draft' ? 'bg-slate-50 text-slate-500 border-slate-100' : ''
            ]"
          >
            {{ value }}
          </span>
        </template>

        <template #cell-projectName="{ item }">
          <button
            @click="store.navigateTo('projects', { projectId: item.projectId })"
            class="font-semibold text-slate-600 hover:text-brand-600 transition-colors text-left block max-w-[150px] truncate"
          >
            {{ item.projectName }}
          </button>
        </template>

        <template #cell-title="{ item }">
          <button
            @click="store.navigateTo('assessments', { assessmentId: item.id })"
            class="font-semibold text-brand-600 hover:text-brand-800 hover:underline text-left block max-w-[200px] truncate"
          >
            {{ item.title }}
          </button>
        </template>

        <template #cell-version="{ value }">
          <span class="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
            {{ value }}
          </span>
        </template>

        <template #cell-highestInitialRisk="{ value }">
          <span class="font-bold text-slate-400 text-xs">{{ value }}</span>
        </template>

        <template #cell-highestResidualRisk="{ value }">
          <div class="flex items-center justify-center gap-1.5" v-if="value > 0">
            <span class="font-bold text-slate-800 text-xs">{{ value }}</span>
            <span class="w-2 h-2 rounded-full" :class="getKinneyRiskLevel(value).color.split(' ')[0]"></span>
          </div>
          <span v-else class="text-slate-400 font-medium text-xs">-</span>
        </template>

        <template #cell-hazardsCount="{ value }">
          <span class="font-semibold text-slate-700 text-xs">{{ value }}</span>
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
          <div class="flex items-center justify-end gap-0.5">
            <button
              @click="store.navigateTo('assessments', { assessmentId: item.id })"
              class="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="View Detail"
            >
              <Eye class="w-4 h-4" />
            </button>
            <button
              @click="store.cloneAssessment(item.id)"
              class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Clone Assessment"
            >
              <Copy class="w-4 h-4" />
            </button>
            <button
              @click="store.navigateTo('review-queue')"
              class="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Conduct Safety Review"
            >
              <ClipboardCheck class="w-4 h-4" />
            </button>
            <button
              @click="handleExport(item.title)"
              class="p-1.5 text-slate-400 hover:text-success-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Export PDF report"
            >
              <FileDown class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>
