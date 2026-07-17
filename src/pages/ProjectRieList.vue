<script setup>
import { computed, ref, watch } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import {
  Briefcase,
  User,
  MapPin,
  Calendar,
  ClipboardList,
  Play,
  Plus,
  Eye,
  RefreshCw,
  GitCompare
} from 'lucide-vue-next';

// Computed selected project
const project = computed(() => {
  if (store.selectedProjectId === 'all') {
    const dates = store.projects.map(p => p.reviewDueDate).filter(Boolean);
    const earliestDate = dates.length ? dates.sort()[0] : '-';
    return {
      id: 'all',
      name: 'All Projects',
      client: 'Multiple Clients',
      manager: 'Various Managers',
      location: 'Multiple Locations',
      reviewDueDate: earliestDate
    };
  }
  return store.projects.find(p => p.id === store.selectedProjectId) || store.projects[0];
});

// Watch and reset selectedProjectId if invalid
watch(() => store.projects, (newProjects) => {
  if (newProjects.length && store.selectedProjectId !== 'all' && !newProjects.some(p => p.id === store.selectedProjectId)) {
    store.selectedProjectId = newProjects[0].id;
  }
});

// Computed list of assessments belonging to the selected project
const projectAssessments = computed(() => {
  if (!project.value) return [];
  if (project.value.id === 'all') return store.assessments;
  return store.assessments.filter(a => a.projectId === project.value.id);
});

// Search filters
const searchQuery = ref('');

const filteredAssessments = computed(() => {
  if (!searchQuery.value) return projectAssessments.value;
  const q = searchQuery.value.toLowerCase().trim();
  return projectAssessments.value.filter(a => {
    return a.title.toLowerCase().includes(q) ||
           a.area.toLowerCase().includes(q) ||
           a.assessor.toLowerCase().includes(q);
  });
});

const handleStartReview = (ass) => {
  store.cloneAndStartReview(ass.id, 'HSE Auditor');
  store.navigateTo('review');
};

const handleCreateNew = () => {
  store.wizard.info.projectId = project.value.id;
  store.navigateTo('new-assessment');
};
</script>

<template>
  <div class="space-y-6 pb-12" v-if="project">
    <!-- Header Selection -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">Project RI&E List</h1>
        <p class="text-xs text-slate-500 mt-1">Select a site to view safety assessments, active hazards, and start review cycles.</p>
      </div>

      <!-- Dropdown and actions selector -->
      <div class="flex items-center gap-3">
        <button
          @click="store.navigateTo('hazards')"
          class="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all duration-150"
        >
          <span>Hazard Register</span>
        </button>
        <!-- Dropdown selector -->
        <div class="flex items-center gap-2.5">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Site:</label>
          <select
            v-model="store.selectedProjectId"
            class="border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white text-slate-700 shadow-sm"
          >
            <option value="all">All Projects</option>
            <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Project Metadata Cards -->
    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
          <Briefcase class="w-4.5 h-4.5" />
        </div>
        <div>
          <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Client</span>
          <span class="block text-xs font-semibold text-slate-700 truncate max-w-[130px]">{{ project.client }}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
          <User class="w-4.5 h-4.5" />
        </div>
        <div>
          <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Project Manager</span>
          <span class="block text-xs font-semibold text-slate-700 truncate max-w-[130px]">{{ project.manager }}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
          <MapPin class="w-4.5 h-4.5" />
        </div>
        <div>
          <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Location</span>
          <span class="block text-xs font-semibold text-slate-700 truncate max-w-[130px]">{{ project.location }}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
          <Calendar class="w-4.5 h-4.5" />
        </div>
        <div>
          <span class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Next Audit Review</span>
          <span class="block text-xs font-bold text-warning-700">{{ project.reviewDueDate }}</span>
        </div>
      </div>
    </div>

    <!-- Search and Actions Bar -->
    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 flex-wrap">
      <div class="relative w-full max-w-md">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search assessments for this site..."
          class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <button
        @click="handleCreateNew"
        class="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/10 flex items-center gap-1.5 transition-all"
      >
        <Plus class="w-4 h-4" />
        <span>Create New RI&E</span>
      </button>
    </div>

    <!-- Assessments table grid -->
    <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
              <th class="px-5 py-3.5">Project</th>
              <th class="px-5 py-3.5">RI&E Assessment / Description</th>
              <th class="px-5 py-3.5">Assessment Area</th>
              <th class="px-5 py-3.5 text-center">Version</th>
              <th class="px-5 py-3.5 text-center">Highest Kinney Risk</th>
              <th class="px-5 py-3.5 text-center">Hazards Count</th>
              <th class="px-5 py-3.5">Review Date</th>
              <th class="px-5 py-3.5">Assessor</th>
              <th class="px-5 py-3.5">Status</th>
              <th class="px-5 py-3.5 text-right">Audit Trigger</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="ass in filteredAssessments"
              :key="ass.id"
              class="hover:bg-slate-50 transition-colors cursor-pointer"
              @click="store.navigateTo('assessments', { assessmentId: ass.id })"
            >
              <td class="px-5 py-4 font-semibold text-slate-700">
                {{ ass.projectName }}
              </td>
              <td class="px-5 py-4">
                <span class="block font-bold text-slate-800 text-sm leading-snug">{{ ass.title }}</span>
                <span class="block text-[10px] text-slate-400 mt-1 truncate max-w-xs">{{ ass.description }}</span>
              </td>
              <td class="px-5 py-4 font-semibold text-slate-500">{{ ass.area }}</td>
              <td class="px-5 py-4 text-center">
                <span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold">{{ ass.version }}</span>
              </td>
              <td class="px-5 py-4 text-center font-bold">
                <div class="flex items-center justify-center gap-1.5" v-if="ass.highestResidualRisk > 0">
                  <span>{{ ass.highestResidualRisk }}</span>
                  <span class="w-1.5 h-1.5 rounded-full" :class="getKinneyRiskLevel(ass.highestResidualRisk).color.split(' ')[0]"></span>
                </div>
                <span v-else class="text-slate-400">-</span>
              </td>
              <td class="px-5 py-4 text-center font-semibold text-slate-700">{{ ass.hazardsCount }}</td>
              <td class="px-5 py-4 text-slate-500 font-medium">{{ ass.reviewDate }}</td>
              <td class="px-5 py-4 font-semibold text-slate-600">{{ ass.assessor }}</td>
              <td class="px-5 py-4">
                <span
                  class="px-2 py-0.5 rounded-full text-[9px] font-bold border"
                  :class="[
                    ass.status === 'Published' ? 'bg-success-50 text-success-700 border-success-100' : '',
                    ass.status === 'Under Review' ? 'bg-blue-50 text-blue-700 border-blue-100' : '',
                    ass.status === 'Draft' ? 'bg-slate-50 text-slate-500 border-slate-100' : '',
                  ]"
                >
                  {{ ass.status }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    @click.stop="handleStartReview(ass)"
                    class="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    title="Audit Review"
                  >
                    <RefreshCw class="w-3 h-3" />
                    <span>Audit Review</span>
                  </button>
                  <button
                    @click.stop="store.selectedAssessmentId = ass.id; store.navigateTo('compare')"
                    class="bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    title="Compare Versions"
                  >
                    <GitCompare class="w-3 h-3" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredAssessments.length === 0">
              <td colspan="10" class="text-center py-12 text-slate-400">
                <div class="max-w-xs mx-auto">
                  <ClipboardList class="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <span class="block font-medium">No assessments exist for this project.</span>
                  <button @click="handleCreateNew" class="mt-3 bg-brand-50 hover:bg-brand-100 border border-brand-100 text-brand-600 font-semibold px-3 py-1.5 rounded-xl">
                    Create Initial Assessment
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
