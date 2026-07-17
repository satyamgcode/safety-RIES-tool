<script setup>
import { ref } from 'vue';
import { store } from '../store';
import {
  FileText,
  FileDown,
  FileSpreadsheet,
  Download,
  Loader2,
  Settings,
  Sparkles
} from 'lucide-vue-next';

// Report templates array
const reports = [
  {
    id: 'rep-rie',
    title: 'Assessment Report Dossier',
    desc: 'Generates a compilation of active projects, matching assessments, safety levels, and published version history logs.',
    formats: ['PDF', 'Excel', 'CSV']
  },
  {
    id: 'rep-hazards',
    title: 'Global Hazard Register Log',
    desc: 'Compiles all raw occupational safety hazards, Kinney formula components, and owner assignment sheets.',
    formats: ['Excel', 'CSV']
  },
  {
    id: 'rep-matrix',
    title: 'Risk Matrix Distribution Summary',
    desc: 'Extracts 5x5 cell hazard counts, risk score trends, and critical coordinate listings for corporate compliance.',
    formats: ['PDF', 'Excel']
  },
  {
    id: 'rep-executive',
    title: 'Executive HSE Safety Briefing',
    desc: 'High-level dashboard aggregates, average residual risk improvements, overdue audit counts, and monthly trends.',
    formats: ['PDF']
  },
  {
    id: 'rep-actions',
    title: 'Action Item Remediation Report',
    desc: 'Tracks all corrective task titles, assignees, progress sliders, due dates, and completion status records.',
    formats: ['PDF', 'Excel', 'CSV']
  },
  {
    id: 'rep-reviews',
    title: 'Periodic Audit & Review Queue Ledger',
    desc: 'Extracts review calendars, overdue audit markers, conducting managers, and inspector signature registers.',
    formats: ['PDF', 'CSV']
  }
];

// Tracking loading states for each export button
const loadingExports = ref({}); // e.g. { 'rep-rie-PDF': true }

const triggerExport = (reportId, reportTitle, format) => {
  const key = `${reportId}-${format}`;
  loadingExports.value[key] = true;
  
  store.addToast(`Preparing data and rendering ${format} report for: "${reportTitle}"...`);
  
  // Simulate network compilation delay
  setTimeout(() => {
    loadingExports.value[key] = false;
    const filename = `${reportTitle.replace(/\s+/g, '_')}_Report.${format.toLowerCase()}`;
    store.addToast(`Export file ready: ${filename}`, 'success');
  }, 1200);
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">Safety Reports</h1>
        <p class="text-xs text-slate-500 mt-1">Compile data, generate safety reports, and export compliance registers for government audits.</p>
      </div>
    </div>

    <!-- Report Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="rep in reports"
        :key="rep.id"
        class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col justify-between space-y-4"
      >
        <div class="space-y-2">
          <div class="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
            <FileText class="w-5 h-5" />
          </div>
          <h3 class="font-bold text-slate-800 text-sm leading-snug">{{ rep.title }}</h3>
          <p class="text-xs text-slate-400 leading-relaxed">{{ rep.desc }}</p>
        </div>

        <!-- Export buttons container -->
        <div class="pt-3 border-t border-slate-50 space-y-2">
          <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Export Document Formats</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="fmt in rep.formats"
              :key="fmt"
              @click="triggerExport(rep.id, rep.title, fmt)"
              :disabled="loadingExports[`${rep.id}-${fmt}`]"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 hover:bg-slate-50"
              :class="[
                fmt === 'PDF' ? 'bg-red-50/50 text-red-700 border-red-100 hover:bg-red-100/50' : '',
                fmt === 'Excel' ? 'bg-success-50/50 text-success-700 border-success-100 hover:bg-success-100/50' : '',
                fmt === 'CSV' ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' : ''
              ]"
            >
              <Loader2 class="w-3.5 h-3.5 animate-spin" v-if="loadingExports[`${rep.id}-${fmt}`]" />
              <FileDown class="w-3.5 h-3.5" v-else-if="fmt === 'PDF'" />
              <FileSpreadsheet class="w-3.5 h-3.5" v-else-if="fmt === 'Excel'" />
              <Download class="w-3.5 h-3.5 text-slate-400" v-else />
              <span>{{ fmt }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
