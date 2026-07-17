<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { Archive, RotateCcw, Search, Info } from 'lucide-vue-next';

// Tab State
const activeTab = ref('assessments'); // 'assessments', 'versions'
const searchQuery = ref('');

// Filtered Archived Assessments
const filteredArchivedAssessments = computed(() => {
  const list = store.archive.assessments;
  if (!searchQuery.value) return list;
  const q = searchQuery.value.toLowerCase().trim();
  return list.filter(item => {
    return item.title.toLowerCase().includes(q) ||
           item.project.toLowerCase().includes(q) ||
           item.archiver.toLowerCase().includes(q);
  });
});

// Filtered Archived Versions
const filteredArchivedVersions = computed(() => {
  const list = store.archive.versions;
  if (!searchQuery.value) return list;
  const q = searchQuery.value.toLowerCase().trim();
  return list.filter(item => {
    return item.title.toLowerCase().includes(q) ||
           item.project.toLowerCase().includes(q) ||
           item.version.toLowerCase().includes(q) ||
           item.archiver.toLowerCase().includes(q);
  });
});

const handleRestoreAssessment = (archiveId) => {
  store.restoreAssessment(archiveId);
};

const handleRestoreVersion = (archiveVersion) => {
  store.addToast(`Version "${archiveVersion.version}" restored for parent assessment ID: ${archiveVersion.parentId}.`, 'success');
  // Remove version from archives list
  store.archive.versions = store.archive.versions.filter(v => v.id !== archiveVersion.id);
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">Safety Archive</h1>
        <p class="text-xs text-slate-500 mt-1">Audit, inspect, and restore historically deleted safety records and outdated version releases.</p>
      </div>
    </div>

    <!-- Search & Tabs controls -->
    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Tab selector -->
        <div class="flex items-center gap-2 border border-slate-200 p-1 rounded-xl bg-slate-50 text-xs font-bold w-max">
          <button
            @click="activeTab = 'assessments'"
            class="px-3.5 py-1.5 rounded-lg transition-all"
            :class="activeTab === 'assessments' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-700'"
          >
            Archived Assessments ({{ store.archive.assessments.length }})
          </button>
          <button
            @click="activeTab = 'versions'"
            class="px-3.5 py-1.5 rounded-lg transition-all"
            :class="activeTab === 'versions' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-700'"
          >
            Archived Versions ({{ store.archive.versions.length }})
          </button>
        </div>

        <!-- Search input -->
        <div class="relative w-full max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-4 w-4 text-slate-400" />
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search archived logs..."
            class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>

    <!-- TABLE LIST -->

    <!-- Assessments Tab Table -->
    <div v-if="activeTab === 'assessments'" class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
              <th class="px-5 py-3.5">Archived Assessment</th>
              <th class="px-5 py-3.5">Project Ref</th>
              <th class="px-5 py-3.5">Archived By</th>
              <th class="px-5 py-3.5">Archived Date</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in filteredArchivedAssessments" :key="item.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-5 py-4 font-bold text-slate-700">{{ item.title }}</td>
              <td class="px-5 py-4 font-semibold text-slate-500">{{ item.project }}</td>
              <td class="px-5 py-4 font-semibold text-slate-600">{{ item.archiver }}</td>
              <td class="px-5 py-4 text-slate-400">{{ item.archivedAt }}</td>
              <td class="px-5 py-4 text-right">
                <button
                  @click="handleRestoreAssessment(item.id)"
                  class="bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ml-auto transition-colors"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Restore Assessment</span>
                </button>
              </td>
            </tr>
            <tr v-if="filteredArchivedAssessments.length === 0">
              <td colspan="5" class="text-center py-10 text-slate-400 font-medium">No archived assessments found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Versions Tab Table -->
    <div v-else-if="activeTab === 'versions'" class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
              <th class="px-5 py-3.5">Archived Version Title</th>
              <th class="px-5 py-3.5">Parent Project</th>
              <th class="px-5 py-3.5 text-center">Version ID</th>
              <th class="px-5 py-3.5">Archived By</th>
              <th class="px-5 py-3.5">Archived Date</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in filteredArchivedVersions" :key="item.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-5 py-4 font-bold text-slate-700">{{ item.title }}</td>
              <td class="px-5 py-4 font-semibold text-slate-500">{{ item.project }}</td>
              <td class="px-5 py-4 text-center">
                <span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold">{{ item.version }}</span>
              </td>
              <td class="px-5 py-4 font-semibold text-slate-600">{{ item.archiver }}</td>
              <td class="px-5 py-4 text-slate-400">{{ item.archivedAt }}</td>
              <td class="px-5 py-4 text-right">
                <button
                  @click="handleRestoreVersion(item)"
                  class="bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ml-auto transition-colors"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Restore Version</span>
                </button>
              </td>
            </tr>
            <tr v-if="filteredArchivedVersions.length === 0">
              <td colspan="6" class="text-center py-10 text-slate-400 font-medium">No archived versions found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Info Banner -->
    <div class="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start gap-2.5 text-xs text-blue-700">
      <Info class="w-4.5 h-4.5 shrink-0" />
      <div>
        <span class="block font-bold">Audit Archiving Regulations</span>
        <p class="mt-0.5 leading-relaxed font-semibold">Under regional health and safety regulations (e.g. EU OSHA directives), completed audits and historical risk reports must be kept in safety archives for at least 5 years and remain searchable.</p>
      </div>
    </div>
  </div>
</template>
