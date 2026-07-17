<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { getKinneyRiskLevel } from '../mockData';
import {
  ArrowLeft,
  Briefcase,
  User,
  Calendar,
  ShieldAlert,
  CheckSquare,
  TrendingUp,
  FileText,
  FileDown,
  History,
  Info,
  ChevronRight,
  Plus,
  Play,
  GitCompare,
  Archive,
  X,
  MessageSquare,
  Send
} from 'lucide-vue-next';

const activeTab = ref('hazards'); // 'overview', 'hazards', 'actions', 'documents', 'history'

const assessmentId = computed(() => store.currentParams.assessmentId);
const assessment = computed(() => store.assessments.find(a => a.id === assessmentId.value));

// Core data filtered for this assessment
const assessmentHazards = computed(() => {
  if (!assessment.value) return [];
  return store.hazards.filter(h => h.assessmentId === assessment.value.id);
});

const assessmentActions = computed(() => {
  if (!assessment.value) return [];
  return store.actions.filter(act => act.assessmentId === assessment.value.id);
});

const openActionsCount = computed(() => {
  return assessmentActions.value.filter(a => a.status !== 'Completed').length;
});

const handleExport = () => {
  store.addToast(`Generating and exporting PDF report for: "${assessment.value.title}"...`);
  setTimeout(() => {
    store.addToast(`Report downloaded successfully.`, 'success');
  }, 1500);
};

const triggerArchive = () => {
  if (confirm(`Are you sure you want to archive assessment "${assessment.value.title}"?`)) {
    store.archiveAssessment(assessment.value.id);
  }
};

// Selected Action for Detail modal popup
const selectedAction = ref(null);
const newCommentText = ref('');
const localStatus = ref('');
const localProgress = ref(0);

const openActionDetail = (actionItem) => {
  selectedAction.value = actionItem;
  localStatus.value = actionItem.status;
  localProgress.value = actionItem.progress;
  newCommentText.value = '';
};

const closeActionDetail = () => {
  selectedAction.value = null;
};

const applyStatusChange = () => {
  if (!selectedAction.value) return;
  store.updateActionStatus(selectedAction.value.id, localStatus.value, localProgress.value);
  if (localStatus.value === 'Completed') {
    localProgress.value = 100;
  }
};

const submitComment = () => {
  if (!newCommentText.value.trim()) return;
  store.addActionComment(selectedAction.value.id, newCommentText.value, 'Current Auditor');
  newCommentText.value = '';
};
</script>

<template>
  <div class="space-y-6 pb-12" v-if="assessment">
    <!-- Breadcrumb / Back Navigation -->
    <div class="flex items-center justify-between">
      <button
        @click="store.navigateTo(store.lastAssessmentListPage)"
        class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Back to Assessments</span>
      </button>

      <div class="flex items-center gap-2">
        <button
          @click="store.navigateTo('actions')"
          class="text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <CheckSquare class="w-3.5 h-3.5 text-slate-500" />
          <span>Action Tracker</span>
        </button>
        <button
          @click="store.navigateTo('version-comparison')"
          class="text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <GitCompare class="w-3.5 h-3.5" />
          <span>Compare Versions</span>
        </button>
        <button
          @click="triggerArchive"
          class="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 border border-red-100 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <Archive class="w-3.5 h-3.5" />
          <span>Archive Assessment</span>
        </button>
      </div>
    </div>

    <!-- Main Header Card -->
    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 flex-wrap">
            <button
              @click="store.navigateTo('projects', { projectId: assessment.projectId })"
              class="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1"
            >
              <Briefcase class="w-3 h-3 text-brand-500" />
              {{ assessment.projectName }}
            </button>
            <span class="text-slate-300">/</span>
            <span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">{{ assessment.version }}</span>
            <span
              class="px-2.5 py-0.5 text-[10px] font-bold rounded-full border"
              :class="[
                assessment.status === 'Published' ? 'bg-success-50 text-success-700 border-success-100' : '',
                assessment.status === 'Under Review' ? 'bg-blue-50 text-blue-700 border-blue-100' : '',
                assessment.status === 'Draft' ? 'bg-slate-50 text-slate-500 border-slate-100' : ''
              ]"
            >
              {{ assessment.status }}
            </span>
          </div>
          <h2 class="text-xl font-extrabold text-slate-800 tracking-tight mt-2 font-sans">{{ assessment.title }}</h2>
          <span class="text-xs text-slate-400 block mt-1">Evaluation Area: <span class="font-bold text-slate-600">{{ assessment.area }}</span></span>
        </div>

        <!-- Meta list -->
        <div class="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div class="flex items-center gap-2">
            <User class="w-4 h-4 text-slate-400" />
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">ASSESSOR</span>
              <span class="block text-slate-700 mt-0.5">{{ assessment.assessor }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Info class="w-4 h-4 text-slate-400" />
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">METHOD</span>
              <span class="block text-slate-700 mt-0.5">{{ assessment.method }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-slate-400" />
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">AUDIT DUE</span>
              <span class="block text-slate-700 mt-0.5 text-warning font-bold">{{ assessment.reviewDate }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-slate-400" />
            <div>
              <span class="block text-[10px] text-slate-400 leading-none">LAST UPDATE</span>
              <span class="block text-slate-700 mt-0.5">{{ assessment.updatedAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
          INI
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Initial</span>
          <span class="text-lg font-black text-slate-800 leading-none mt-1 block">{{ assessment.highestInitialRisk }}</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
          <TrendingUp class="w-5 h-5" />
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Residual</span>
          <span class="text-lg font-black text-red-600 leading-none mt-1 block" v-if="assessment.highestResidualRisk > 0">
            {{ assessment.highestResidualRisk }}
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ml-1.5 align-middle" :class="getKinneyRiskLevel(assessment.highestResidualRisk).color">
              {{ getKinneyRiskLevel(assessment.highestResidualRisk).name }}
            </span>
          </span>
          <span class="text-lg font-black text-slate-400 leading-none mt-1 block" v-else>0</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
          <ShieldAlert class="w-5 h-5" />
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Hazards</span>
          <span class="text-lg font-black text-slate-800 leading-none mt-1 block">{{ assessmentHazards.length }}</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
          <CheckSquare class="w-5 h-5" />
        </div>
        <div>
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Open Actions</span>
          <span class="text-lg font-black text-slate-800 leading-none mt-1 block" :class="openActionsCount > 0 ? 'text-orange-600 font-bold animate-pulse' : ''">{{ openActionsCount }}</span>
        </div>
      </div>
    </div>

    <!-- Tabs Menu -->
    <div class="flex items-center gap-2 border-b border-slate-100 pb-px">
      <button
        @click="activeTab = 'hazards'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'hazards' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Hazards Register ({{ assessmentHazards.length }})
      </button>
      <button
        @click="activeTab = 'actions'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'actions' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Action Items ({{ assessmentActions.length }})
      </button>
      <button
        @click="activeTab = 'overview'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'overview' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Overview / Scope
      </button>
      <button
        @click="activeTab = 'documents'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'documents' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Documents ({{ assessment.documents?.length || 0 }})
      </button>
      <button
        @click="activeTab = 'history'"
        class="px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150"
        :class="activeTab === 'history' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
      >
        Version History ({{ assessment.history?.length || 0 }})
      </button>
    </div>

    <!-- TAB ACTIONS -->

    <!-- Tab: Overview -->
    <div v-if="activeTab === 'overview'" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Info class="w-4 h-4 text-slate-400" /> Evaluation Scope & Description</h4>
      <p class="text-sm text-slate-600 leading-relaxed max-w-3xl">{{ assessment.description }}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50 text-xs">
        <div>
          <h5 class="font-bold text-slate-700 uppercase tracking-wider mb-2">Scope Checklist</h5>
          <ul class="space-y-2 text-slate-600 font-semibold">
            <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-success"></span> Workspace ergonomic guidelines and postural profiles</li>
            <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-success"></span> Hazardous chemical handling, storage, and ventilation safety</li>
            <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-success"></span> Scaffolding structural certificate and heights protection protocols</li>
          </ul>
        </div>
        <div>
          <h5 class="font-bold text-slate-700 uppercase tracking-wider mb-2">Assessor Notes</h5>
          <p class="text-slate-500 leading-relaxed">Regular safety check conducted under OSHA regulations. Edge protection scaffolding anchor checks must be documented prior to starting work daily.</p>
        </div>
      </div>
    </div>

    <!-- Tab: Hazards -->
    <div v-else-if="activeTab === 'hazards'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Identified Assessment Hazards</h4>
        <button
          @click="store.navigateTo('create-assessment')"
          class="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 hover:bg-brand-100 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add New Hazard</span>
        </button>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
                <th class="px-4 py-3">Hazard ID</th>
                <th class="px-4 py-3">Hazard</th>
                <th class="px-4 py-3">Category</th>
                <th class="px-4 py-3">Location</th>
                <th class="px-4 py-3 text-center">Initial Risk</th>
                <th class="px-4 py-3 text-center">Residual Risk</th>
                <th class="px-4 py-3 text-center">Controls</th>
                <th class="px-4 py-3 text-center">Actions</th>
                <th class="px-4 py-3">Owner</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="haz in assessmentHazards"
                :key="haz.id"
                @click="store.navigateTo('hazards', { hazardId: haz.id })"
                class="hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <td class="px-4 py-3 font-bold text-slate-400">{{ haz.hazardId }}</td>
                <td class="px-4 py-3 font-bold text-slate-700 group-hover:text-brand-600 transition-colors max-w-[180px] truncate">{{ haz.name }}</td>
                <td class="px-4 py-3 font-semibold text-slate-500">{{ haz.category }}</td>
                <td class="px-4 py-3 text-slate-400 max-w-[120px] truncate">{{ haz.location }}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-400">{{ haz.initialRiskScore }}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-800">
                  <div class="flex items-center justify-center gap-1.5">
                    <span>{{ haz.residualRiskScore }}</span>
                    <span class="w-2 h-2 rounded-full" :class="getKinneyRiskLevel(haz.residualRiskScore).color.split(' ')[0]"></span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-600">{{ haz.controls?.length || 0 }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="px-1.5 py-0.5 rounded font-bold"
                    :class="haz.openActionsCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'"
                  >
                    {{ haz.openActionsCount }}
                  </span>
                </td>
                <td class="px-4 py-3 font-semibold text-slate-600">{{ haz.owner }}</td>
                <td class="px-4 py-3 text-right">
                  <button class="text-brand-600 hover:underline font-bold text-xs">Inspect</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab: Actions -->
    <div v-else-if="activeTab === 'actions'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Assessment Action Tracker</h4>
        <button
          @click="store.navigateTo('actions')"
          class="text-xs font-bold text-brand-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Manage All Actions
        </button>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
                <th class="px-4 py-3">Action ID</th>
                <th class="px-4 py-3">Title / Task</th>
                <th class="px-4 py-3">Hazard Reference</th>
                <th class="px-4 py-3">Assigned To</th>
                <th class="px-4 py-3">Priority</th>
                <th class="px-4 py-3">Due Date</th>
                <th class="px-4 py-3">Progress</th>
                <th class="px-4 py-3 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="act in assessmentActions"
                :key="act.id"
                @click="openActionDetail(act)"
                class="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td class="px-4 py-3 font-bold text-slate-400">{{ act.actionId }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700 truncate max-w-[200px]">{{ act.title }}</td>
                <td class="px-4 py-3 text-slate-400 truncate max-w-[150px]">{{ act.hazardName }}</td>
                <td class="px-4 py-3 font-semibold text-slate-600">{{ act.assignedTo }}</td>
                <td class="px-4 py-3 font-bold">
                  <span
                    class="px-2 py-0.5 rounded text-[10px]"
                    :class="[
                      act.priority === 'High' ? 'bg-red-50 text-red-600' : '',
                      act.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' : '',
                      act.priority === 'Low' ? 'bg-slate-100 text-slate-500' : '',
                    ]"
                  >
                    {{ act.priority }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-500" :class="act.status === 'Overdue' ? 'text-red-500 font-bold' : ''">{{ act.dueDate }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div class="bg-brand-500 h-full rounded-full" :style="{ width: act.progress + '%' }"></div>
                    </div>
                    <span>{{ act.progress }}%</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right">
                  <span
                    class="px-2.5 py-0.5 text-[9px] font-bold rounded-full"
                    :class="[
                      act.status === 'Completed' ? 'bg-success-50 text-success-700 border border-success-100' : '',
                      act.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' : '',
                      act.status === 'Open' ? 'bg-slate-50 text-slate-500 border border-slate-100' : '',
                      act.status === 'Overdue' ? 'bg-red-50 text-red-700 border border-red-100' : '',
                    ]"
                  >
                    {{ act.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="assessmentActions.length === 0">
                <td colspan="8" class="text-center py-6 text-slate-400">No action items defined.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab: Documents -->
    <div v-else-if="activeTab === 'documents'" class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div class="divide-y divide-slate-100">
        <div
          v-for="doc in assessment.documents"
          :key="doc.name"
          class="p-4 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-brand-50 text-brand-600 flex items-center justify-center font-black text-[9px]">
              {{ doc.type }}
            </div>
            <div>
              <span class="block font-semibold text-slate-700">{{ doc.name }}</span>
              <span class="block text-[10px] text-slate-400 mt-0.5">Size: {{ doc.size }} | Revision Date: {{ doc.date }}</span>
            </div>
          </div>
          <button
            @click="store.addToast(`File download completed: ${doc.name}`)"
            class="p-2 border border-slate-200 hover:bg-white rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            <FileDown class="w-4 h-4" />
          </button>
        </div>
        <div v-if="!assessment.documents || assessment.documents.length === 0" class="text-center py-6 text-slate-400 text-xs">
          No files attached to this assessment.
        </div>
      </div>
    </div>

    <!-- Tab: History -->
    <div v-else-if="activeTab === 'history'" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment Revision Trail</h4>
        <button
          @click="store.navigateTo('review-queue')"
          class="text-xs font-bold text-brand-500 hover:text-brand-700 bg-brand-50 border border-brand-100 hover:bg-brand-100 px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          <span>Conduct Audit / Version Upgrade</span>
        </button>
      </div>

      <div class="relative pl-6 border-l-2 border-slate-100 space-y-6 ml-3 text-xs">
        <div v-for="(hLog, hIdx) in assessment.history" :key="hIdx" class="relative">
          <span class="absolute -left-9 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
          </span>

          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded text-[10px]">{{ hLog.version }}</span>
              <span class="text-slate-400">{{ hLog.date }}</span>
              <span class="text-slate-300">|</span>
              <span class="font-medium text-slate-500">Author: {{ hLog.author }}</span>
            </div>
            <p class="text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">{{ hLog.comment }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Details Popup Modal -->
    <div v-if="selectedAction" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-xs">
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
          <button @click="closeActionDetail" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Description -->
        <div class="space-y-4 flex-1 text-left">
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
                  class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-700"
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
                class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700 bg-white"
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
  <div v-else class="text-center py-20 text-slate-400 bg-white border border-slate-100 rounded-2xl">
    Assessment record not found.
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
