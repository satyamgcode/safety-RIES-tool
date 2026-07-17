<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import {
  ArrowLeft,
  Briefcase,
  User,
  MapPin,
  Calendar,
  FileText,
  ShieldAlert,
  CheckSquare,
  FileDown,
  ChevronRight,
  TrendingUp,
  History,
  Info
} from 'lucide-vue-next';

// Tab state
const activeTab = ref('assessments'); // 'assessments', 'documents', 'timeline'

const projectId = computed(() => store.currentParams.projectId);
const project = computed(() => store.projects.find(p => p.id === projectId.value));

// Core metrics for this project
const projectAssessments = computed(() => {
  if (!project.value) return [];
  return store.assessments.filter(a => a.projectId === project.value.id);
});

const projectHazards = computed(() => {
  if (!project.value) return [];
  return store.hazards.filter(h => h.projectId === project.value.id);
});

const projectActions = computed(() => {
  if (!project.value) return [];
  return store.actions.filter(act => act.projectId === project.value.id);
});

const openActionsCount = computed(() => {
  return projectActions.value.filter(a => a.status !== 'Completed').length;
});

const highestRisk = computed(() => {
  if (projectHazards.value.length === 0) return 0;
  return Math.max(...projectHazards.value.map(h => h.residualRiskScore));
});

// Mock timeline logs
const projectMilestones = [
  { date: '2026-01-10', title: 'Project Kick-off & Site Handover', type: 'system', desc: 'Site access granted and initial project logistics established.' },
  { date: '2026-02-14', title: 'Initial Baseline RI&E Draft Completed', type: 'rie', desc: 'Identified 25 height safety and machinery hazards.' },
  { date: '2026-03-01', title: 'Safety Audit & Gate Review 1', type: 'audit', desc: 'Board review completed. Edge protection measures approved.' },
  { date: '2026-04-15', title: 'Published Assessment Revision v2.0', type: 'rie', desc: 'Updated hazard controls with dual-lanyard harness requirements.' },
  { date: '2026-06-12', title: 'Action Items Remediation Campaign', type: 'action', desc: '14 safety signage action items closed by operators.' }
];
</script>

<template>
  <div class="space-y-6 pb-12" v-if="project">
    <!-- Back Navigation -->
    <button
      @click="store.navigateTo('projects')"
      class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
    >
      <ArrowLeft class="w-3.5 h-3.5" />
      <span>Back to Project List</span>
    </button>

    <!-- Main Header card -->
    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 flex-wrap">
            <span class="px-2 py-0.5 bg-brand-50 text-brand-600 rounded text-xs font-bold uppercase tracking-wider">Project ID: #{{ project.id }}</span>
            <span
              class="px-2.5 py-0.5 text-[10px] font-bold rounded-full border"
              :class="[
                project.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-100' : '',
                project.status === 'Planning' ? 'bg-slate-50 text-slate-600 border-slate-100' : '',
                project.status === 'Completed' ? 'bg-success-50 text-success-700 border-success-100' : '',
                project.status === 'On Hold' ? 'bg-orange-50 text-orange-700 border-orange-100' : ''
              ]"
            >
              {{ project.status }}
            </span>
          </div>
          <h2 class="text-xl font-extrabold text-slate-800 tracking-tight mt-2 font-sans">{{ project.name }}</h2>
          <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5"><Briefcase class="w-3 h-3 text-slate-400 shrink-0" /> Client: <span class="font-bold text-slate-600">{{ project.client }}</span></p>
        </div>

        <!-- Meta list -->
        <div class="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div class="flex items-center gap-2">
            <User class="w-4 h-4 text-slate-400" />
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">MANAGER</span>
              <span class="block text-slate-700 mt-0.5 truncate">{{ project.manager }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <MapPin class="w-4 h-4 text-slate-400" />
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">LOCATION</span>
              <span class="block text-slate-700 mt-0.5 truncate max-w-[120px]">{{ project.location }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-slate-400" />
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">START DATE</span>
              <span class="block text-slate-700 mt-0.5">{{ project.startDate || '2026-01-10' }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-slate-400" />
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">REVIEW DUE</span>
              <span class="block text-slate-700 mt-0.5 text-warning font-bold">{{ project.reviewDueDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats summary grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
          <FileText class="w-5 h-5" />
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">RI&E Assessments</span>
          <span class="text-xl font-black text-slate-800 leading-none mt-1 block">{{ projectAssessments.length }}</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
          <ShieldAlert class="w-5 h-5" />
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Active Hazards</span>
          <span class="text-xl font-black text-slate-800 leading-none mt-1 block">{{ projectHazards.length }}</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
          <CheckSquare class="w-5 h-5" />
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Open Actions</span>
          <span class="text-xl font-black text-slate-800 leading-none mt-1 block">{{ openActionsCount }}</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-700">
          <TrendingUp class="w-5 h-5" />
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Risk Score</span>
          <span class="text-xl font-black text-red-700 leading-none mt-1 block" v-if="highestRisk > 0">
            {{ highestRisk }}
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 align-middle" :class="getKinneyRiskLevel(highestRisk).color">
              {{ getKinneyRiskLevel(highestRisk).name }}
            </span>
          </span>
          <span class="text-xl font-black text-slate-400 leading-none mt-1 block" v-else>0</span>
        </div>
      </div>
    </div>

    <!-- Description / Scope -->
    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Info class="w-4 h-4 text-slate-400" /> Scope / Description</h3>
      <p class="text-sm text-slate-600 mt-2.5 leading-relaxed">{{ project.description }}</p>
    </div>

    <!-- Tabs selection -->
    <div class="flex items-center gap-2 border-b border-slate-100 pb-px">
      <button
        @click="activeTab = 'assessments'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'assessments' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Assessments ({{ projectAssessments.length }})
      </button>
      <button
        @click="activeTab = 'documents'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'documents' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Documents (3)
      </button>
      <button
        @click="activeTab = 'timeline'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'timeline' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Timeline History
      </button>
    </div>

    <!-- TAB CONTENTS -->

    <!-- Tab 1: Assessments -->
    <div v-if="activeTab === 'assessments'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Project RI&Es</h4>
        <button
          @click="store.wizard.info.projectId = project.id; store.navigateTo('create-assessment')"
          class="text-xs font-bold text-brand-500 hover:text-brand-700 bg-brand-50 border border-brand-100 hover:bg-brand-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
        >
          Add Assessment
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="ass in projectAssessments"
          :key="ass.id"
          @click="store.navigateTo('assessments', { assessmentId: ass.id })"
          class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 space-y-3 relative group"
        >
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">{{ ass.version }}</span>
            <span
              class="px-2 py-0.5 text-[9px] font-bold rounded-full"
              :class="[
                ass.status === 'Published' ? 'bg-success-50 text-success-700 border border-success-100' : '',
                ass.status === 'Under Review' ? 'bg-blue-50 text-blue-700 border border-blue-100' : '',
                ass.status === 'Draft' ? 'bg-slate-50 text-slate-500 border border-slate-100' : ''
              ]"
            >
              {{ ass.status }}
            </span>
          </div>

          <div>
            <h4 class="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{{ ass.title }}</h4>
            <span class="text-[11px] text-slate-400 block mt-0.5">Area: {{ ass.area }}</span>
          </div>

          <div class="grid grid-cols-3 gap-2.5 text-center text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl">
            <div>
              <span class="block text-[9px] text-slate-400">HAZARDS</span>
              <span class="block text-slate-700 mt-0.5">{{ ass.hazardsCount }}</span>
            </div>
            <div>
              <span class="block text-[9px] text-slate-400">RESIDUAL RISK</span>
              <span class="block text-red-600 mt-0.5 font-bold" v-if="ass.highestResidualRisk > 0">{{ ass.highestResidualRisk }}</span>
              <span class="block text-slate-400 mt-0.5" v-else>0</span>
            </div>
            <div>
              <span class="block text-[9px] text-slate-400">ACTIONS</span>
              <span class="block text-slate-700 mt-0.5" :class="ass.openActionsCount > 0 ? 'text-orange-600 font-bold' : ''">{{ ass.openActionsCount }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-50 font-medium">
            <span>Assessor: {{ ass.assessor }}</span>
            <span>Due: {{ ass.reviewDate }}</span>
          </div>
        </div>
        
        <div v-if="projectAssessments.length === 0" class="col-span-2 text-center text-slate-400 py-10 bg-white border border-slate-100 rounded-2xl">
          No assessments created for this project yet. Click "Add Assessment" to begin.
        </div>
      </div>
    </div>

    <!-- Tab 2: Documents -->
    <div v-else-if="activeTab === 'documents'" class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div class="p-4 border-b border-slate-100 flex items-center justify-between">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Dossier / Files</h4>
        <button
          @click="store.addToast('Uploading files is not available in mock frontend mode.')"
          class="text-xs font-bold text-brand-500 hover:text-brand-700 bg-brand-50 border border-brand-100 hover:bg-brand-100 px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          Upload Doc
        </button>
      </div>

      <div class="divide-y divide-slate-100">
        <div class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-red-50 text-red-500 flex items-center justify-center font-bold text-[10px]">PDF</div>
            <div>
              <span class="block font-semibold text-slate-700">Project_Safety_Plan_and_HSE_Directives_2026.pdf</span>
              <span class="block text-[10px] text-slate-400 mt-0.5">Size: 4.8 MB | Uploaded by Markus Vance | 2026-01-15</span>
            </div>
          </div>
          <button @click="store.addToast('Mock file downloaded: Safety Plan.')" class="p-2 border border-slate-200 hover:bg-white rounded-lg text-slate-500 hover:text-slate-700 transition-colors">
            <FileDown class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-[10px]">DWG</div>
            <div>
              <span class="block font-semibold text-slate-700">Structural_Layout_Quay4_DetailedDrawing.dwg</span>
              <span class="block text-[10px] text-slate-400 mt-0.5">Size: 18.2 MB | Uploaded by Sarah Jenkins | 2026-02-02</span>
            </div>
          </div>
          <button @click="store.addToast('Mock file downloaded: Drawing.')" class="p-2 border border-slate-200 hover:bg-white rounded-lg text-slate-500 hover:text-slate-700 transition-colors">
            <FileDown class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-orange-50 text-orange-500 flex items-center justify-center font-bold text-[10px]">XLS</div>
            <div>
              <span class="block font-semibold text-slate-700">Environmental_Impact_Baseline_Data.xlsx</span>
              <span class="block text-[10px] text-slate-400 mt-0.5">Size: 1.1 MB | Uploaded by External Auditor | 2026-03-20</span>
            </div>
          </div>
          <button @click="store.addToast('Mock file downloaded: Baseline Data.')" class="p-2 border border-slate-200 hover:bg-white rounded-lg text-slate-500 hover:text-slate-700 transition-colors">
            <FileDown class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Tab 3: Timeline -->
    <div v-else-if="activeTab === 'timeline'" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit and Milestone Timeline</h4>

      <div class="relative pl-6 border-l-2 border-slate-100 space-y-6 ml-3">
        <div v-for="(mile, idx) in projectMilestones" :key="idx" class="relative">
          <!-- Timeline point dot -->
          <span class="absolute -left-9 top-1 w-4 h-4 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center z-10">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
          </span>

          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{{ mile.date }}</span>
              <span
                class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                :class="[
                  mile.type === 'rie' ? 'bg-blue-100 text-blue-700' : '',
                  mile.type === 'audit' ? 'bg-purple-100 text-purple-700' : '',
                  mile.type === 'action' ? 'bg-orange-100 text-orange-700' : '',
                  mile.type === 'system' ? 'bg-slate-100 text-slate-700' : '',
                ]"
              >
                {{ mile.type }}
              </span>
            </div>
            <h4 class="text-sm font-bold text-slate-800">{{ mile.title }}</h4>
            <p class="text-xs text-slate-500 leading-relaxed max-w-xl">{{ mile.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-20 text-slate-400 bg-white border border-slate-100 rounded-2xl">
    Project record not found.
  </div>
</template>
