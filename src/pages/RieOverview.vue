<script setup>
import { computed } from 'vue';
import { store } from '../store';
import {
  Building,
  Briefcase,
  ShieldAlert,
  ClipboardList,
  RefreshCw,
  GitCompare,
  AlertTriangle,
  Flame,
  CheckCircle
} from 'lucide-vue-next';

// Exact cards from your reference image
const cards = [
  {
    tag: 'ALL PROJECTS',
    title: 'RI&E Overview',
    desc: 'Portfolio monitor for overdue reviews and projects without RI&E.',
    page: 'dashboard',
    icon: Building,
    bgColor: 'border-l-blue-500'
  },
  {
    tag: 'PROJECT',
    title: 'Project RI&E List',
    desc: 'View all assessments for one project and create a new RI&E.',
    page: 'project-list',
    icon: Briefcase,
    bgColor: 'border-l-brand-500'
  },
  {
    tag: 'SINGLE RI&E',
    title: 'Hazard Register',
    desc: 'Hazards, Kinney scoring, risk matrix and action plan.',
    page: 'hazards',
    icon: ShieldAlert,
    bgColor: 'border-l-red-500'
  },
  {
    tag: 'WIZARD',
    title: 'New Assessment',
    desc: 'Six-step wizard to create a complete RI&E assessment.',
    page: 'new-assessment',
    icon: ClipboardList,
    bgColor: 'border-l-purple-500'
  },
  {
    tag: 'REVIEW',
    title: 'Start Review',
    desc: 'Clone an assessment, update hazards and publish changes.',
    page: 'review',
    icon: RefreshCw,
    bgColor: 'border-l-orange-500'
  },
  {
    tag: 'COMPARE',
    title: 'Compare Versions',
    desc: 'Compare two published versions and view every change.',
    page: 'compare',
    icon: GitCompare,
    bgColor: 'border-l-success-500'
  }
];

const handleCardClick = (page) => {
  if (page !== 'overview') {
    store.navigateTo(page);
  }
};

// Overview Statistics for portfolio monitoring
const totalProjects = computed(() => store.projects.length);
const overdueReviews = computed(() => store.reviews.filter(r => r.status === 'Overdue'));
const projectsWithoutRie = computed(() => {
  return store.projects.filter(p => p.assessmentsCount === 0);
});
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header visual matching reference -->
    <div>
      <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">List of risks (RI&E)</h1>
      <p class="text-sm text-slate-500 mt-1">Below is the list of identified risks. Click on any risk to see more details.</p>
    </div>

    <!-- The 6 launchpad cards exactly matching the reference image grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="card in cards"
        :key="card.title"
        @click="handleCardClick(card.page)"
        class="bg-white p-6 rounded-2xl border border-slate-100 border-l-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4"
        :class="[card.bgColor, card.page === 'overview' ? 'ring-2 ring-brand-500/10 bg-brand-50/5' : '']"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded tracking-widest uppercase">
              {{ card.tag }}
            </span>
            <component :is="card.icon" class="w-4.5 h-4.5 text-slate-400" />
          </div>
          <h3 class="font-extrabold text-slate-800 text-sm leading-snug">{{ card.title }}</h3>
          <p class="text-xs text-slate-400 leading-relaxed font-semibold">{{ card.desc }}</p>
        </div>
        <div class="text-[10px] font-bold text-brand-600 text-right flex items-center justify-end gap-1 select-none">
          <span v-if="card.page === 'overview'">Active Dashboard</span>
          <span v-else>Open View &rarr;</span>
        </div>
      </div>
    </div>

    <!-- Portfolio Monitoring Dashboard details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
      <!-- Overdue Reviews Alerts -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-50 pb-3">
          <AlertTriangle class="w-5 h-5 text-warning" />
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Overdue Safety Reviews ({{ overdueReviews.length }})</h3>
        </div>

        <div class="space-y-3">
          <div
            v-for="rev in overdueReviews.slice(0, 3)"
            :key="rev.id"
            @click="store.navigateTo('review', { assessmentId: rev.assessmentId })"
            class="flex items-start justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div>
              <span class="block text-xs font-bold text-slate-800">{{ rev.assessmentName }}</span>
              <span class="block text-[10px] text-slate-400 mt-1">Project Site: {{ rev.projectName }}</span>
            </div>
            <span class="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-600 rounded-full border border-red-200 animate-pulse shrink-0">
              Overdue Since: {{ rev.reviewDueDate }}
            </span>
          </div>
        </div>
      </div>

      <!-- Action items required -->
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-50 pb-3">
          <Building class="w-5 h-5 text-brand-500" />
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Projects Without Assessments</h3>
        </div>

        <div class="space-y-3">
          <div
            v-for="proj in projectsWithoutRie.slice(0, 3)"
            :key="proj.id"
            @click="store.navigateTo('project-list', { projectId: proj.id })"
            class="flex items-start justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div>
              <span class="block text-xs font-bold text-slate-800">{{ proj.name }}</span>
              <span class="block text-[10px] text-slate-400 mt-1">Location: {{ proj.location }} | Manager: {{ proj.manager }}</span>
            </div>
            <button class="text-[9px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100 hover:bg-brand-100 transition-colors">
              Initialize RI&E
            </button>
          </div>
          <div v-if="projectsWithoutRie.length === 0" class="text-center text-xs text-slate-400 py-6">
            <CheckCircle class="w-8 h-8 text-success mx-auto mb-1" />
            <span>All projects have active safety assessments mapped.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
