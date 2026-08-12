<script setup>
import { computed, ref, onMounted } from 'vue';
import { store } from '../store';
import {
  Beaker,
  Shield,
  FileText,
  Flame,
  Calendar,
  Layers,
  ArrowLeft,
  Edit2,
  Archive,
  AlertTriangle,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  Settings,
  History
} from 'lucide-vue-next';

// Active substance from route parameter
const substance = computed(() => {
  const sId = store.selectedSubstanceId || store.currentParams.substanceId;
  return store.substances.find(s => s.id === parseInt(sId, 10));
});

// Active Tab
const activeTab = ref('overview');

onMounted(() => {
  if (store.currentParams.tab) {
    activeTab.value = store.currentParams.tab;
  }
});

// SDS Edit Modal State
const showEditSdsModal = ref(false);
const editSdsVersion = ref('');
const editSdsIssueDate = ref('');
const editSdsRevisionDate = ref('');
const editSdsNextReviewDate = ref('');
const hazardsChanged = ref(false);
const isSavingSds = ref(false);

const openEditSdsModal = () => {
  if (substance.value) {
    editSdsVersion.value = substance.value.sds.version;
    editSdsIssueDate.value = substance.value.sds.issueDate;
    editSdsRevisionDate.value = substance.value.sds.revisionDate;
    editSdsNextReviewDate.value = substance.value.sds.nextReviewDate;
  }
  hazardsChanged.value = false;
  showEditSdsModal.value = true;
};

const handleSaveSdsDetails = () => {
  isSavingSds.value = true;
  setTimeout(() => {
    isSavingSds.value = false;
    showEditSdsModal.value = false;

    const sdsUpdate = {
      fileName: 'Manual Record',
      version: editSdsVersion.value,
      issueDate: editSdsIssueDate.value,
      revisionDate: editSdsRevisionDate.value,
      nextReviewDate: editSdsNextReviewDate.value
    };

    // If hazards changed, simulate GHS09 (Environmental Hazard) addition
    if (hazardsChanged.value) {
      const currentPics = [...substance.value.hazards.pictograms];
      if (!currentPics.includes('GHS09')) {
        currentPics.push('GHS09');
      }
      sdsUpdate.hazards = {
        pictograms: currentPics,
        signalWord: substance.value.hazards.signalWord || 'Danger',
        statements: [...substance.value.hazards.statements, 'H411'],
        classes: [...substance.value.hazards.classes, 'Chronic aquatic hazard']
      };
    }

    store.uploadNewSds(substance.value.id, sdsUpdate, hazardsChanged.value);
  }, 600);
};

// Archive flow
const archiveSub = () => {
  if (substance.value) {
    store.archiveSubstance(substance.value.id);
  }
};

// GHS symbols mapping
const getGhsDetails = (pic) => {
  const mapping = {
    GHS02: { char: '🔥', label: 'Flammable', color: 'bg-red-50 text-red-700 border-red-100' },
    GHS05: { char: '🧪', label: 'Corrosive', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    GHS06: { char: '☠️', label: 'Toxic', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    GHS07: { char: '⚠️', label: 'Harmful/Irritant', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    GHS08: { char: '👤', label: 'Health Hazard', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    GHS09: { char: '🌿', label: 'Environmental Hazard', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
  };
  return mapping[pic] || { char: '❓', label: pic, color: 'bg-slate-50 text-slate-600 border-slate-100' };
};

const getGhsExplanation = (pic) => {
  const explanations = {
    GHS02: 'Flammable: Indicates flammable liquids, gases, aerosols, solids, self-reactive substances, pyrophoric liquids/solids, and self-heating substances that pose fire risks.',
    GHS05: 'Corrosive: Indicates chemicals that can cause severe skin burns, serious eye damage, and metal corrosion upon exposure.',
    GHS06: 'Toxic: Indicates acute toxicity; indicates chemicals that can cause severe toxicity, fatal poisoning, or critical harm if swallowed, inhaled, or absorbed through the skin.',
    GHS07: 'Harmful / Irritant: Indicates skin, eye, or respiratory irritation, skin sensitizing effects, narcotic effects (causing drowsiness/dizziness), and lower acute toxic risk.',
    GHS08: 'Health Hazard: Indicates potential carcinogenicity, respiratory sensitizer, reproductive toxicity, mutagenicity, aspiration danger, and target organ toxicity over chronic exposure.',
    GHS09: 'Environmental Hazard: Indicates acute or long-term hazards to the aquatic environment (fish, algae, crustacea, and ecosystems).'
  };
  return explanations[pic] || 'No description available.';
};

// SDS Status simulation buttons
const setSdsStatus = (status) => {
  store.updateSdsStatus(substance.value.id, status);
};
</script>

<template>
  <div v-if="substance" class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <button
          @click="store.navigateTo('haz-substances-overview')"
          class="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Back to Register</span>
        </button>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-black text-slate-800 tracking-tight font-sans">{{ substance.name }}</h1>
          <span
            class="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border"
            :class="[
              substance.status === 'Active' ? 'bg-brand-50 text-brand-700 border-brand-100' : '',
              substance.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' : '',
              substance.status === 'Restricted' ? 'bg-red-50 text-red-700 border-red-100' : '',
              substance.status === 'Archived' ? 'bg-slate-200 text-slate-500 border-slate-300' : ''
            ]"
          >
            {{ substance.status }}
          </span>
        </div>
        <p class="text-xs text-slate-500 font-semibold">{{ substance.manufacturer }}</p>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="store.navigateTo('haz-substances-assessment', { substanceId: substance.id })"
          class="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Edit2 class="w-4 h-4 text-slate-500" />
          <span>Edit Assessment</span>
        </button>
        <button
          v-if="substance.status !== 'Archived'"
          @click="archiveSub"
          class="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-100 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <Archive class="w-4 h-4" />
          <span>Archive</span>
        </button>
      </div>
    </div>

    <!-- Tabs Navigation Bar -->
    <div class="flex border-b border-slate-100 overflow-x-auto gap-1">
      <button
        v-for="tab in ['overview', 'hazards', 'sds', 'risk-assessment']"
        :key="tab"
        @click="activeTab = tab"
        class="px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap"
        :class="[
          activeTab === tab
            ? 'border-brand-500 text-brand-600 font-black'
            : 'border-transparent text-slate-400 hover:text-slate-600'
        ]"
      >
        {{ tab.replace('-', ' ') }}
      </button>
    </div>

    <!-- TAB CONTENTS -->
    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-64">
      
      <!-- OVERVIEW TAB -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <div class="border-b border-slate-50 pb-2">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Product Information</h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Manufacturer</span>
            <span class="text-sm font-bold text-slate-800 mt-1 block">{{ substance.manufacturer }}</span>
          </div>

          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Supplier</span>
            <span class="text-sm font-bold text-slate-800 mt-1 block">{{ substance.supplier || '—' }}</span>
          </div>

          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Product Code</span>
            <span class="text-sm font-mono font-bold text-slate-800 mt-1 block">{{ substance.productCode || '—' }}</span>
          </div>

          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">CAS Number</span>
            <span class="text-sm font-mono font-bold text-slate-800 mt-1 block">{{ substance.casNumber || '—' }}</span>
          </div>

          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Storage Location</span>
            <span class="text-sm font-bold text-slate-800 mt-1 block">{{ substance.location }}</span>
          </div>

          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Quantity</span>
            <span class="text-sm font-bold text-slate-800 mt-1 block">
              {{ substance.quantity }} <span class="text-xs text-slate-400 font-medium">{{ substance.unit }}</span>
            </span>
          </div>
        </div>

        <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Used For</span>
          <span class="text-sm font-semibold text-slate-700 mt-1 block">{{ substance.usedFor }}</span>
        </div>
      </div>

      <!-- HAZARDS TAB -->
      <div v-if="activeTab === 'hazards'" class="space-y-6">
        <div class="border-b border-slate-50 pb-2">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>GHS Warning Classification</span>
            <span class="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Source: Supplier SDS</span>
          </h3>
        </div>

        <!-- Pictogram list -->
        <div class="space-y-4">
          <h4 class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hazard Pictograms</h4>
          <div v-if="substance.hazards.pictograms.length === 0" class="text-xs text-slate-400 italic">
            No hazard warnings recorded for this substance.
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="pic in substance.hazards.pictograms"
              :key="pic"
              class="flex items-center gap-3 p-3.5 border rounded-xl"
              :class="getGhsDetails(pic).color"
            >
              <span class="text-2xl select-none">{{ getGhsDetails(pic).char }}</span>
              <div>
                <span class="text-xs font-bold block">{{ pic }}</span>
                <span class="text-[9px] font-semibold opacity-75 uppercase tracking-wide">{{ getGhsDetails(pic).label }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <!-- Signal Word -->
          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Signal Word</span>
            <span class="text-base font-extrabold mt-1 block"
              :class="substance.hazards.signalWord === 'Danger' ? 'text-red-600' : 'text-amber-600'"
            >
              {{ substance.hazards.signalWord || 'None' }}
            </span>
          </div>

          <!-- Hazard Classes -->
          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Hazard Classes</span>
            <div class="flex flex-wrap gap-1 mt-1.5">
              <span
                v-for="hc in substance.hazards.classes"
                :key="hc"
                class="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded"
              >
                {{ hc }}
              </span>
              <span v-if="!substance.hazards.classes?.length" class="text-xs text-slate-400 italic">No hazard classes specified</span>
            </div>
          </div>
        </div>

        <!-- Hazard statements -->
        <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Hazard Statements (H-Codes)</span>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <div
              v-for="hs in substance.hazards.statements"
              :key="hs"
              class="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 font-mono text-[11px] text-slate-700 font-bold"
            >
              <AlertCircle class="w-3.5 h-3.5 text-orange-500" />
              <span>{{ hs }}</span>
            </div>
            <div v-if="!substance.hazards.statements?.length" class="text-xs text-slate-400 italic col-span-3">No codes specified</div>
          </div>
        </div>

        <!-- GHS Meanings detailed explanation -->
        <div class="space-y-3 pt-2">
          <h4 class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Classification Meaning / Explanations</h4>
          <div class="space-y-2.5">
            <div
              v-for="pic in substance.hazards.pictograms"
              :key="`explain-${pic}`"
              class="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50"
            >
              <span class="text-xl p-1.5 bg-white rounded-lg border border-slate-150 shadow-xs shrink-0 select-none">
                {{ getGhsDetails(pic).char }}
              </span>
              <div>
                <h5 class="text-xs font-extrabold text-slate-800">{{ pic }} — {{ getGhsDetails(pic).label }}</h5>
                <p class="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                  {{ getGhsExplanation(pic) }}
                </p>
              </div>
            </div>
            <div v-if="substance.hazards.pictograms.length === 0" class="text-xs text-slate-400 italic">
              No classifications available.
            </div>
          </div>
        </div>
      </div>

      <!-- SDS TAB -->
      <div v-if="activeTab === 'sds'" class="space-y-6">
        <div class="border-b border-slate-50 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Safety Data Sheet Details</h3>
            <p class="text-[10px] text-slate-400 mt-0.5">Supplier SDS version and revision dates registered in the database.</p>
          </div>
          <button
            @click="openEditSdsModal"
            class="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
            <span>Edit SDS Dates</span>
          </button>
        </div>

        <!-- Current SDS details -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <!-- Manual Record Details -->
          <div class="md:col-span-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between gap-4">
            <div class="flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                <FileText class="w-5.5 h-5.5" />
              </div>
              <div class="space-y-1">
                <h4 class="text-xs font-black text-slate-400 uppercase tracking-wider">Active SDS Record</h4>
                <span class="text-sm font-extrabold text-slate-800 block">Manual Date Registration Logged</span>
                <p class="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Hazard classifications and dates have been verified manually against the manufacturer's sheet.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4 border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-600">
              <div>
                <span class="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">SDS Version</span>
                <span class="text-slate-800 block mt-0.5">{{ substance.sds.version || 'N/A' }}</span>
              </div>
              <div>
                <span class="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Issue Date</span>
                <span class="text-slate-800 block mt-0.5">{{ substance.sds.issueDate || '—' }}</span>
              </div>
              <div>
                <span class="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Revision Date</span>
                <span class="text-slate-800 block mt-0.5">{{ substance.sds.revisionDate || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Status badge -->
          <div class="p-5 rounded-2xl border flex flex-col justify-between"
            :class="[
              substance.sds.status === 'Current' ? 'bg-success-50/30 border-success-100 text-success-800' : '',
              substance.sds.status === 'Due Soon' ? 'bg-yellow-50/30 border-yellow-100 text-yellow-800' : '',
              substance.sds.status === 'Overdue' ? 'bg-red-50/30 border-red-100 text-red-800' : '',
              substance.sds.status === 'Missing' ? 'bg-slate-50 border-slate-200 text-slate-500' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-extrabold uppercase tracking-wider block">SDS Status</span>
              <span class="w-2 h-2 rounded-full"
                :class="[
                  substance.sds.status === 'Current' ? 'bg-success-500' : '',
                  substance.sds.status === 'Due Soon' ? 'bg-yellow-500' : '',
                  substance.sds.status === 'Overdue' ? 'bg-red-500' : '',
                  substance.sds.status === 'Missing' ? 'bg-slate-400' : ''
                ]"
              ></span>
            </div>
            <div class="mt-2.5">
              <span class="text-2xl font-black block leading-none">{{ substance.sds.status }}</span>
              <span class="text-[10px] font-bold mt-1.5 block opacity-75">
                Next Review Date: {{ substance.sds.nextReviewDate || 'Required' }}
              </span>
            </div>
          </div>
        </div>

        <!-- SDS Date Simulation Buttons for Demo -->
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <div class="flex items-center gap-1.5 text-slate-500">
            <Settings class="w-4 h-4" />
            <h4 class="text-[10px] font-extrabold uppercase tracking-wider">Demo Simulation Tools</h4>
          </div>
          <p class="text-[10px] text-slate-400 leading-tight">Change the SDS date status to evaluate Attention Required listing and dashboard metrics:</p>
          <div class="flex flex-wrap gap-2">
            <button
              @click="setSdsStatus('Overdue')"
              class="bg-white hover:bg-red-50 text-red-700 hover:text-red-900 border border-red-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Set Overdue 🔴
            </button>
            <button
              @click="setSdsStatus('Due Soon')"
              class="bg-white hover:bg-yellow-50 text-yellow-700 hover:text-yellow-900 border border-yellow-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Set Due Soon 🟡
            </button>
            <button
              @click="setSdsStatus('Current')"
              class="bg-white hover:bg-success-50 text-success-700 hover:text-success-900 border border-success-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Set Current 🟢
            </button>
          </div>
        </div>

        <!-- Version History Table -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center gap-1.5 text-slate-500">
            <History class="w-4.5 h-4.5" />
            <h4 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Version History</h4>
          </div>
          
          <div class="border border-slate-100 rounded-xl overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th class="py-2.5 px-4">Version</th>
                  <th class="py-2.5 px-4">Safety Data Sheet (PDF)</th>
                  <th class="py-2.5 px-4">Revision Date</th>
                  <th class="py-2.5 px-4 text-center">Hazard Changed</th>
                  <th class="py-2.5 px-4 text-right">Archived Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                <tr v-if="!substance.sds.history?.length">
                  <td colspan="5" class="py-4 px-4 text-center text-slate-400 italic">
                    No historical SDS versions archived.
                  </td>
                </tr>
                <tr v-for="(h, idx) in substance.sds.history" :key="idx" class="hover:bg-slate-50/30 transition-colors">
                  <td class="py-2.5 px-4 font-mono font-bold text-slate-700">v{{ h.version }}</td>
                  <td class="py-2.5 px-4 text-slate-500 truncate max-w-[200px]">{{ h.fileName }}</td>
                  <td class="py-2.5 px-4 text-slate-400 font-semibold">{{ h.revisionDate }}</td>
                  <td class="py-2.5 px-4 text-center">
                    <span v-if="h.hazardChanges" class="px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-bold rounded-full border border-red-100">
                      Yes
                    </span>
                    <span v-else class="text-slate-400">—</span>
                  </td>
                  <td class="py-2.5 px-4 text-right text-slate-400 font-semibold">{{ h.uploadedAt }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- RISK ASSESSMENT TAB -->
      <div v-if="activeTab === 'risk-assessment'" class="space-y-6">
        <!-- Review warning if hazard classification changed -->
        <div v-if="substance.riskAssessment.status === 'Review Required'" class="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div class="flex-1">
            <h5 class="text-xs font-bold text-red-800">⚠️ Hazard information changed</h5>
            <p class="text-[10px] text-red-600 font-medium mt-0.5 leading-relaxed">
              Please review the risk assessment. The supplier SDS details have updated the warning metrics.
            </p>
          </div>
          <button
            @click="store.navigateTo('haz-substances-assessment', { substanceId: substance.id })"
            class="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer self-center"
          >
            Review Assessment
          </button>
        </div>

        <div class="border-b border-slate-50 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Risk Evaluation & Control Measures</h3>
          </div>
          <button
            @click="store.navigateTo('haz-substances-assessment', { substanceId: substance.id })"
            class="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <span>View Assessment</span>
          </button>
        </div>

        <!-- Scores Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">RA Status</span>
              <span class="text-xs font-bold text-slate-800 mt-1 block">{{ substance.riskAssessment.status }}</span>
            </div>
            <span class="w-2 h-2 rounded-full"
              :class="[
                substance.riskAssessment.status === 'Approved' ? 'bg-success-500' : '',
                substance.riskAssessment.status === 'Required' ? 'bg-orange-500' : '',
                substance.riskAssessment.status === 'Draft' ? 'bg-slate-400' : '',
                substance.riskAssessment.status === 'Review Required' ? 'bg-amber-500' : ''
              ]"
            ></span>
          </div>

          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Residual Risk</span>
            <span class="text-xs font-bold mt-1 block"
              :class="[
                substance.riskAssessment.residualRisk?.riskLevel === 'Low' ? 'text-success-600' : '',
                substance.riskAssessment.residualRisk?.riskLevel === 'Medium' ? 'text-amber-600 font-bold' : '',
                substance.riskAssessment.residualRisk?.riskLevel === 'High' ? 'text-red-600 font-bold' : '',
              ]"
            >
              {{ substance.riskAssessment.residualRisk?.riskLevel || 'Required' }} (Score: {{ substance.riskAssessment.residualRisk?.riskScore || '—' }})
            </span>
          </div>

          <div class="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Last Assessment Date</span>
            <span class="text-xs font-bold text-slate-800 mt-1 block">{{ substance.riskAssessment.lastReviewedDate || 'Pending' }}</span>
          </div>
        </div>

        <!-- Controls checklist -->
        <div class="space-y-3">
          <h4 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Required Safety Controls</h4>
          <div v-if="!substance.riskAssessment.existingControls?.length" class="text-xs text-slate-400 italic">
            No safety controls defined yet.
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              v-for="ctrl in [...(substance.riskAssessment.existingControls || []), ...(substance.riskAssessment.additionalControls || [])]"
              :key="ctrl"
              class="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700"
            >
              <CheckCircle2 class="w-4.5 h-4.5 text-success shrink-0" />
              <span>{{ ctrl }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- EDIT SDS DETAILS MODAL -->
    <div v-if="showEditSdsModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-5 animate-scale-in">
        <div class="flex items-center justify-between border-b border-slate-50 pb-3">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Edit SDS Details</h3>
          <button @click="showEditSdsModal = false" class="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
            Close
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3.5">
            <div class="flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">SDS Version *</label>
              <input
                v-model="editSdsVersion"
                type="text"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
              />
            </div>
            <div class="flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Issue Date</label>
              <input
                v-model="editSdsIssueDate"
                type="date"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
              />
            </div>
            <div class="flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Revision Date *</label>
              <input
                v-model="editSdsRevisionDate"
                type="date"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
              />
            </div>
            <div class="flex flex-col">
              <label class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Next Review *</label>
              <input
                v-model="editSdsNextReviewDate"
                type="date"
                class="bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          <!-- Hazards changed checkbox -->
          <label class="flex items-start gap-2.5 p-3 bg-red-50/50 border border-red-100 rounded-xl cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="hazardsChanged"
              class="rounded text-red-600 focus:ring-red-500 w-4.5 h-4.5 mt-0.5"
            />
            <div>
              <span class="text-xs font-bold text-red-800 block">Hazard classification has changed</span>
              <span class="text-[9px] text-red-600 leading-tight block mt-0.5 font-semibold">
                Checking this flags the Risk Assessment as Review Required due to hazard changes.
              </span>
            </div>
          </label>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-2">
          <button
            @click="showEditSdsModal = false"
            class="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="handleSaveSdsDetails"
            :disabled="isSavingSds"
            class="bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <span v-if="isSavingSds">Saving...</span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="py-12 text-center text-slate-400">
    Substance not found.
  </div>
</template>
