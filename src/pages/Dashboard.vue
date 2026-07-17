<script setup>
import { computed, ref } from 'vue';
import { store } from '../store';
import { calculateKinneyScore, getKinneyRiskLevel } from '../mockData';
import SvgChart from '../components/SvgChart.vue';
import {
  Briefcase,
  ClipboardCheck,
  ShieldAlert,
  CheckSquare,
  AlertTriangle,
  Flame,
  LineChart,
  Grid,
  History,
  ArrowRight,
  TrendingUp,
  FileClock
} from 'lucide-vue-next';

// KPI computations
const totalProjects = computed(() => store.projects.length);
const totalAssessments = computed(() => store.assessments.length);
const totalHazards = computed(() => store.hazards.length);
const openActionsCount = computed(() => store.actions.filter(a => a.status !== 'Completed').length);
const overdueReviewsCount = computed(() => store.reviews.filter(r => r.status === 'Overdue').length);
const highestRiskScore = computed(() => Math.max(...store.hazards.map(h => h.residualRiskScore), 0));
const avgResidualRisk = computed(() => {
  if (store.hazards.length === 0) return 0;
  const sum = store.hazards.reduce((acc, h) => acc + h.residualRiskScore, 0);
  return Math.round(sum / store.hazards.length);
});

// Chart 1: Risk Trend (Line chart of average risk score over last 6 months)
const trendData = [
  { label: 'Feb', value: 85 },
  { label: 'Mar', value: 78 },
  { label: 'Apr', value: 64 },
  { label: 'May', value: 58 },
  { label: 'Jun', value: 52 },
  { label: 'Jul', value: 46 } // Average residual risk drops as controls are applied
];

// Chart 2: Risk Category Distribution (Bar chart)
const hazardCategories = computed(() => {
  const cats = ['Safety', 'Ergonomics', 'Chemical', 'Biological', 'Physical', 'Electrical', 'Psychosocial'];
  return cats.map(cat => {
    const count = store.hazards.filter(h => h.category === cat).length;
    let color = '#0284c7';
    if (cat === 'Safety') color = '#ef4444';
    else if (cat === 'Chemical') color = '#eab308';
    else if (cat === 'Electrical') color = '#f97316';
    return { label: cat, value: count, color };
  });
});

// Chart 3: Monthly Reviews Scheduled vs Completed (Bar chart)
const reviewMonths = [
  { label: 'Mar', value: 8 },
  { label: 'Apr', value: 12 },
  { label: 'May', value: 10 },
  { label: 'Jun', value: 15 },
  { label: 'Jul', value: 9 }
];

// Top 10 Highest Risks
const top10Risks = computed(() => {
  return [...store.hazards]
    .sort((a, b) => b.residualRiskScore - a.residualRiskScore)
    .slice(0, 10);
});

// Recent Published Assessments
const recentAssessments = computed(() => {
  return store.assessments
    .filter(a => a.status === 'Published')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
});

// Upcoming Reviews
const upcomingReviews = computed(() => {
  return store.reviews
    .filter(r => r.status !== 'Completed')
    .sort((a, b) => a.reviewDueDate.localeCompare(b.reviewDueDate))
    .slice(0, 5);
});

// Interactive Matrix Filter State
const selectedMatrixCell = ref(null); // { likelihood, severity }
const selectCell = (l, s) => {
  if (selectedMatrixCell.value && selectedMatrixCell.value.l === l && selectedMatrixCell.value.s === s) {
    selectedMatrixCell.value = null; // Clear filter
  } else {
    selectedMatrixCell.value = { l, s };
  }
};

// Map Kinney scores to standard 5x5 matrix cells for visual grouping on dashboard
// Kinney Likelihood (1-10) -> Matrix Likelihood (1-5)
// Kinney Severity (1-100) -> Matrix Consequence (1-5)
const getMatrixCoords = (haz) => {
  let l = 1;
  if (haz.residualLikelihood >= 8) l = 5;
  else if (haz.residualLikelihood >= 6) l = 4;
  else if (haz.residualLikelihood >= 4) l = 3;
  else if (haz.residualLikelihood >= 2) l = 2;

  let s = 1;
  if (haz.residualSeverity >= 40) s = 5;
  else if (haz.residualSeverity >= 15) s = 4;
  else if (haz.residualSeverity >= 7) s = 3;
  else if (haz.residualSeverity >= 3) s = 2;

  return { l, s };
};

const matrixCellHazards = computed(() => {
  if (!selectedMatrixCell.value) return [];
  const { l, s } = selectedMatrixCell.value;
  return store.hazards.filter(h => {
    const coords = getMatrixCoords(h);
    return coords.l === l && coords.s === s;
  });
});

const cellColors5x5 = [
  // rows represent Likelihood (5 down to 1), cols represent Severity (1 to 5)
  ['bg-orange-400', 'bg-orange-500', 'bg-red-500', 'bg-red-600', 'bg-red-700'], // L5
  ['bg-yellow-400', 'bg-orange-400', 'bg-orange-500', 'bg-red-500', 'bg-red-600'], // L4
  ['bg-green-400', 'bg-yellow-400', 'bg-orange-400', 'bg-orange-500', 'bg-red-500'], // L3
  ['bg-green-500', 'bg-green-400', 'bg-yellow-400', 'bg-orange-400', 'bg-orange-500'], // L2
  ['bg-green-600', 'bg-green-500', 'bg-green-400', 'bg-yellow-400', 'bg-orange-400']  // L1
];
// Matrix row labels correspond to index 0 = L5, 1 = L4, 2 = L3, 3 = L2, 4 = L1
const getCellBgColor = (l, s) => {
  // L coords: 5 is index 0, 1 is index 4
  const rIdx = 5 - l;
  const cIdx = s - 1;
  return cellColors5x5[rIdx]?.[cIdx] || 'bg-slate-200';
};

const getCellCount = (l, s) => {
  return store.hazards.filter(h => {
    const coords = getMatrixCoords(h);
    return coords.l === l && coords.s === s;
  }).length;
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">RI&E Dashboard</h1>
        <p class="text-xs text-slate-500 mt-1">Real-time safety profiles, risk distributions, and action tracking for your corporation.</p>
      </div>
      <div class="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm">
        <span class="w-2 h-2 rounded-full bg-success"></span>
        System Status: All active mitigations verified
      </div>
    </div>

    <!-- KPI Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <!-- KPI 1 -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Projects</span>
          <Briefcase class="w-4 h-4 text-slate-400" />
        </div>
        <div class="mt-2.5">
          <span class="block text-2xl font-black text-slate-800 leading-none">{{ totalProjects }}</span>
          <span class="text-[10px] text-slate-400 font-semibold mt-1 block">Active Sites</span>
        </div>
      </div>
      <!-- KPI 2 -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">RI&Es</span>
          <ClipboardCheck class="w-4 h-4 text-slate-400" />
        </div>
        <div class="mt-2.5">
          <span class="block text-2xl font-black text-slate-800 leading-none">{{ totalAssessments }}</span>
          <span class="text-[10px] text-success-600 font-bold mt-1 flex items-center gap-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-success inline-block"></span> Published
          </span>
        </div>
      </div>
      <!-- KPI 3 -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Hazards</span>
          <ShieldAlert class="w-4 h-4 text-slate-400" />
        </div>
        <div class="mt-2.5">
          <span class="block text-2xl font-black text-slate-800 leading-none">{{ totalHazards }}</span>
          <span class="text-[10px] text-slate-400 font-semibold mt-1 block">Identified Risks</span>
        </div>
      </div>
      <!-- KPI 4 -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Open Actions</span>
          <CheckSquare class="w-4 h-4 text-brand-500" />
        </div>
        <div class="mt-2.5">
          <span class="block text-2xl font-black text-slate-800 leading-none">{{ openActionsCount }}</span>
          <span class="text-[10px] text-slate-400 font-semibold mt-1 block">Pending Review</span>
        </div>
      </div>
      <!-- KPI 5 -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Overdue Reviews</span>
          <AlertTriangle class="w-4 h-4 text-warning" />
        </div>
        <div class="mt-2.5">
          <span class="block text-2xl font-black" :class="overdueReviewsCount > 0 ? 'text-warning font-black' : 'text-slate-800'">
            {{ overdueReviewsCount }}
          </span>
          <span class="text-[10px] font-semibold mt-1 block" :class="overdueReviewsCount > 0 ? 'text-warning font-bold' : 'text-slate-400'">
            Audit Critical
          </span>
        </div>
      </div>
      <!-- KPI 6 -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Highest Risk</span>
          <Flame class="w-4 h-4 text-red-500" />
        </div>
        <div class="mt-2.5">
          <span class="block text-2xl font-black text-red-600 leading-none">{{ highestRiskScore }}</span>
          <span class="text-[10px] text-red-500 font-bold mt-1 block">Critical Zone Kinney</span>
        </div>
      </div>
      <!-- KPI 7 -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Avg Residual</span>
          <TrendingUp class="w-4 h-4 text-success" />
        </div>
        <div class="mt-2.5">
          <span class="block text-2xl font-black text-slate-800 leading-none">{{ avgResidualRisk }}</span>
          <span class="text-[10px] text-success-600 font-bold mt-1 block">Kinney (Safe Level)</span>
        </div>
      </div>
    </div>

    <!-- Charts Grid (2 columns: Trend and Categories) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-slate-50 pb-3">
          <div class="flex items-center gap-2">
            <LineChart class="w-4 h-4 text-brand-500" />
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Safety Risk Trend</h3>
          </div>
          <span class="text-xs font-semibold text-success bg-success-50 px-2 py-0.5 rounded-full">-38% over 6mo</span>
        </div>
        <p class="text-xs text-slate-400">Average Kinney risk index over the last 6 calendar months showing drop due to control implementations.</p>
        <SvgChart type="line" :data="trendData" />
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-slate-50 pb-3">
          <div class="flex items-center gap-2">
            <Grid class="w-4 h-4 text-brand-500" />
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Hazard Categories</h3>
          </div>
          <span class="text-xs font-semibold text-slate-400">Total Categories: 7</span>
        </div>
        <p class="text-xs text-slate-400">Total identified hazards broken down by their core occupational health and safety categories.</p>
        <SvgChart type="bar" :data="hazardCategories" />
      </div>
    </div>

    <!-- Interactive Risk Matrix & Top 10 Risks -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- 5x5 Matrix Card (cols span 5) -->
      <div class="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <div class="border-b border-slate-50 pb-3">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Interactive 5x5 Risk Matrix</h3>
            <p class="text-xs text-slate-400 mt-1">Select cells to filter and inspect hazards below. Based on Residual risk coords.</p>
          </div>

          <!-- The Matrix itself -->
          <div class="mt-6 flex flex-col items-center">
            <!-- Table layout for 5x5 matrix -->
            <div class="flex items-start">
              <!-- Y-axis Label (Likelihood) -->
              <div class="h-48 flex items-center justify-center">
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest origin-center -rotate-90 -translate-x-3 w-4 block whitespace-nowrap">Likelihood (1-5)</span>
              </div>
              <div>
                <!-- Matrix Grid -->
                <div class="grid grid-rows-5 gap-1.5 w-56 h-48 select-none">
                  <!-- Rows 5 down to 1 -->
                  <div v-for="l in [5, 4, 3, 2, 1]" :key="'row-'+l" class="grid grid-cols-5 gap-1.5 h-full">
                    <button
                      v-for="s in [1, 2, 3, 4, 5]"
                      :key="'cell-'+l+'-'+s"
                      @click="selectCell(l, s)"
                      class="h-full rounded-md font-bold text-[10px] text-white flex items-center justify-center transition-all relative overflow-hidden"
                      :class="[
                        getCellBgColor(l, s),
                        selectedMatrixCell && selectedMatrixCell.l === l && selectedMatrixCell.s === s
                          ? 'ring-2 ring-slate-800 scale-105 shadow-md z-10 font-black'
                          : 'opacity-90 hover:opacity-100 hover:scale-102 shadow-sm'
                      ]"
                    >
                      <span>{{ getCellCount(l, s) }}</span>
                    </button>
                  </div>
                </div>
                <!-- X-axis Label (Severity) -->
                <div class="grid grid-cols-5 gap-1.5 w-56 text-center text-[9px] font-black text-slate-400 mt-2">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
                <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mt-2.5">
                  Severity / Consequence (1-5)
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cell detail filter results -->
        <div class="mt-4 pt-3 border-t border-slate-100">
          <div v-if="selectedMatrixCell" class="space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-600">Cell Details (L:{{ selectedMatrixCell.l }}, S:{{ selectedMatrixCell.s }})</span>
              <span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{{ matrixCellHazards.length }} Hazards</span>
            </div>
            <div class="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              <div
                v-for="haz in matrixCellHazards"
                :key="haz.id"
                @click="store.navigateTo('hazards', { hazardId: haz.id })"
                class="text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-brand-300 hover:bg-brand-50/20 cursor-pointer transition-all flex items-center justify-between"
              >
                <span class="truncate font-medium text-slate-700 w-3/4">{{ haz.name }}</span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100">Score {{ haz.residualRiskScore }}</span>
              </div>
              <div v-if="matrixCellHazards.length === 0" class="text-center text-[11px] text-slate-400 py-2">
                No active hazards mapped to this combination cell.
              </div>
            </div>
          </div>
          <div v-else class="text-center text-xs text-slate-400 bg-slate-50 py-3 rounded-xl border border-dashed border-slate-200">
            Click any cell above to filter individual hazards.
          </div>
        </div>
      </div>

      <!-- Top 10 Risks (cols span 7) -->
      <div class="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="border-b border-slate-50 pb-3 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Top 10 Highest Risks</h3>
            <p class="text-xs text-slate-400 mt-1">Highest ranking hazards currently open in active projects.</p>
          </div>
          <button @click="store.navigateTo('hazards')" class="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            Hazard Register <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="text-slate-400 border-b border-slate-50">
                <th class="py-2 font-bold uppercase">Hazard ID</th>
                <th class="py-2 font-bold uppercase">Hazard Title</th>
                <th class="py-2 font-bold uppercase">Project</th>
                <th class="py-2 font-bold text-center uppercase">Initial</th>
                <th class="py-2 font-bold text-center uppercase">Residual</th>
                <th class="py-2 font-bold text-right uppercase">Level</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="haz in top10Risks"
                :key="haz.id"
                @click="store.navigateTo('hazards', { hazardId: haz.id })"
                class="hover:bg-slate-50/50 cursor-pointer transition-colors"
              >
                <td class="py-2.5 font-bold text-slate-400">{{ haz.hazardId }}</td>
                <td class="py-2.5 font-semibold text-slate-700 truncate max-w-[160px]">{{ haz.name }}</td>
                <td class="py-2.5 text-slate-500 truncate max-w-[130px]">{{ haz.projectName }}</td>
                <td class="py-2.5 text-center text-slate-400 font-medium">{{ haz.likelihood * haz.exposure * haz.severity }}</td>
                <td class="py-2.5 text-center font-bold text-red-600">{{ haz.residualRiskScore }}</td>
                <td class="py-2.5 text-right">
                  <span class="px-2 py-0.5 text-[9px] font-bold rounded-full" :class="getKinneyRiskLevel(haz.residualRiskScore).color">
                    {{ getKinneyRiskLevel(haz.residualRiskScore).name }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Bottom Lists Section: Upcoming reviews, Published assessments, Activity logs -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Published Assessments -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="border-b border-slate-50 pb-3 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Recently Published</h3>
          <button @click="store.navigateTo('assessments')" class="text-xs font-bold text-brand-600 hover:underline">View All</button>
        </div>
        <div class="space-y-3">
          <div
            v-for="ass in recentAssessments"
            :key="ass.id"
            @click="store.navigateTo('assessments', { assessmentId: ass.id })"
            class="flex items-start gap-3 p-2.5 rounded-xl border border-slate-50 hover:bg-slate-50 cursor-pointer transition-all"
          >
            <div class="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs">
              {{ ass.version }}
            </div>
            <div class="flex-1 min-w-0">
              <span class="block text-xs font-semibold text-slate-700 truncate">{{ ass.title }}</span>
              <span class="block text-[10px] text-slate-400 truncate mt-0.5">{{ ass.projectName }}</span>
            </div>
            <span class="text-[9px] font-bold text-slate-400 shrink-0">{{ ass.updatedAt.split(' ')[0] }}</span>
          </div>
        </div>
      </div>

      <!-- Upcoming Reviews -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="border-b border-slate-50 pb-3 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Upcoming Audits</h3>
          <button @click="store.navigateTo('review-queue')" class="text-xs font-bold text-brand-600 hover:underline">Queue</button>
        </div>
        <div class="space-y-3">
          <div
            v-for="rev in upcomingReviews"
            :key="rev.id"
            @click="store.navigateTo('review-queue')"
            class="flex items-start justify-between p-2.5 rounded-xl border border-slate-50 hover:bg-slate-50 cursor-pointer transition-all"
          >
            <div class="flex items-start gap-2.5 min-w-0">
              <FileClock class="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <div class="min-w-0">
                <span class="block text-xs font-semibold text-slate-700 truncate">{{ rev.assessmentName }}</span>
                <span class="block text-[10px] text-slate-400 mt-0.5">Auditor: {{ rev.reviewer }}</span>
              </div>
            </div>
            <span
              class="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
              :class="rev.status === 'Overdue' ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-orange-50 text-orange-600 border border-orange-200'"
            >
              {{ rev.reviewDueDate }}
            </span>
          </div>
        </div>
      </div>

      <!-- Recent Log Activity -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div class="border-b border-slate-50 pb-3">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">HSE Action Tracker Feed</h3>
        </div>
        <div class="space-y-3">
          <div
            v-for="act in store.actions.slice(0, 4)"
            :key="act.id"
            @click="store.navigateTo('actions')"
            class="flex items-start gap-3 p-2 border-l-2 border-brand-200 hover:bg-slate-50 cursor-pointer transition-all"
          >
            <div class="flex-1 min-w-0">
              <span class="block text-xs font-bold text-slate-700 truncate">{{ act.title }}</span>
              <span class="block text-[10px] text-slate-500 truncate mt-0.5">
                For hazard: <span class="font-medium text-slate-600">{{ act.hazardName }}</span>
              </span>
              <span class="block text-[9px] text-slate-400 mt-1">Assignee: {{ act.assignedTo }} | Priority: <span class="font-semibold" :class="act.priority === 'High' ? 'text-red-500' : 'text-slate-500'">{{ act.priority }}</span></span>
            </div>
            <span
              class="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
              :class="act.status === 'Completed' ? 'bg-success-100 text-success-700' : (act.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700')"
            >
              {{ act.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
