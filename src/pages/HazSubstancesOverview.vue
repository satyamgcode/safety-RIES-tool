<script setup>
import { computed } from 'vue';
import { store } from '../store';
import {
  Beaker,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Plus,
  ArrowRight,
  Eye,
  AlertCircle,
  FileText,
  Wrench,
  Info
} from 'lucide-vue-next';

// KPI computations
const activeSubstances = computed(() => store.substances.filter(s => s.status !== 'Archived'));
const totalProducts = computed(() => store.substances.length);
const overdueSdsCount = computed(() => store.substances.filter(s => s.sds.status === 'Overdue').length);
const restrictedCount = computed(() => store.substances.filter(s => s.status === 'Restricted').length);

// Attention items
const attentionItems = computed(() => {
  const items = [];
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);
  const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

  store.substances.forEach(sub => {
    // 1. SDS Overdue Check (by status or next review date)
    const isSdsOverdue = sub.sds.status === 'Overdue' || (sub.sds.nextReviewDate && sub.sds.nextReviewDate < todayStr);
    if (isSdsOverdue) {
      items.push({
        id: sub.id,
        substance: sub.name,
        type: 'sds-overdue',
        label: `SDS review overdue (${sub.sds.nextReviewDate || 'Required'})`,
        color: 'bg-red-50 border-red-100 text-red-800',
        badgeColor: 'bg-red-500 text-white',
        icon: AlertCircle,
        actionLabel: 'Audit SDS',
        action: () => store.navigateTo('haz-substances-detail', { substanceId: sub.id, tab: 'reviews' })
      });
    }

    // 2. Risk Assessment Overdue Check
    const isRaOverdue = sub.riskAssessment.nextReviewDate && sub.riskAssessment.nextReviewDate < todayStr;
    if (isRaOverdue) {
      items.push({
        id: sub.id,
        substance: sub.name,
        type: 'ra-overdue',
        label: `Risk assessment review overdue (${sub.riskAssessment.nextReviewDate})`,
        color: 'bg-red-50 border-red-100 text-red-800',
        badgeColor: 'bg-red-500 text-white',
        icon: ShieldAlert,
        actionLabel: 'Audit RA',
        action: () => store.navigateTo('haz-substances-detail', { substanceId: sub.id, tab: 'reviews' })
      });
    }

    // 3. Risk Assessment Required (Initial)
    if (sub.riskAssessment.status === 'Required') {
      items.push({
        id: sub.id,
        substance: sub.name,
        type: 'ra-required',
        label: 'Initial risk assessment required',
        color: 'bg-orange-50 border-orange-100 text-orange-800',
        badgeColor: 'bg-orange-500 text-white',
        icon: ShieldAlert,
        actionLabel: 'Create assessment',
        action: () => store.navigateTo('haz-substances-assessment', { substanceId: sub.id })
      });
    }

    // 4. SDS Due Soon Check
    const isSdsDueSoon = sub.sds.status === 'Due Soon' || (sub.sds.nextReviewDate && sub.sds.nextReviewDate >= todayStr && sub.sds.nextReviewDate <= thirtyDaysLaterStr);
    if (isSdsDueSoon && !isSdsOverdue) {
      items.push({
        id: sub.id,
        substance: sub.name,
        type: 'sds-due-soon',
        label: `SDS review due soon (${sub.sds.nextReviewDate})`,
        color: 'bg-yellow-50 border-yellow-100 text-yellow-800',
        badgeColor: 'bg-yellow-500 text-slate-900',
        icon: AlertTriangle,
        actionLabel: 'Review',
        action: () => store.navigateTo('haz-substances-detail', { substanceId: sub.id, tab: 'reviews' })
      });
    }

    // 5. Risk Assessment Due Soon Check
    const isRaDueSoon = sub.riskAssessment.nextReviewDate && sub.riskAssessment.nextReviewDate >= todayStr && sub.riskAssessment.nextReviewDate <= thirtyDaysLaterStr;
    if (isRaDueSoon && !isRaOverdue) {
      items.push({
        id: sub.id,
        substance: sub.name,
        type: 'ra-due-soon',
        label: `Risk assessment review due soon (${sub.riskAssessment.nextReviewDate})`,
        color: 'bg-yellow-50 border-yellow-100 text-yellow-800',
        badgeColor: 'bg-yellow-500 text-slate-900',
        icon: AlertTriangle,
        actionLabel: 'Review',
        action: () => store.navigateTo('haz-substances-detail', { substanceId: sub.id, tab: 'reviews' })
      });
    }

    // 6. Risk Assessment Marked for Review (due to hazard changes)
    if (sub.riskAssessment.status === 'Review Required') {
      items.push({
        id: sub.id,
        substance: sub.name,
        type: 'ra-review',
        label: 'Risk assessment review required (hazards changed)',
        color: 'bg-amber-50 border-amber-100 text-amber-800',
        badgeColor: 'bg-amber-500 text-white',
        icon: ShieldAlert,
        actionLabel: 'Review assessment',
        action: () => store.navigateTo('haz-substances-assessment', { substanceId: sub.id })
      });
    }
  });
  return items;
});

// Map GHS warning pictograms to emojis & labels
const getGhsIcon = (pic) => {
  const mapping = {
    GHS02: { char: '🔥', label: 'Flammable' },
    GHS05: { char: '🧪', label: 'Corrosive' },
    GHS06: { char: '☠️', label: 'Toxic' },
    GHS07: { char: '⚠️', label: 'Harmful' },
    GHS08: { char: '👤', label: 'Health Hazard' },
    GHS09: { char: '🌿', label: 'Environmental' }
  };
  return mapping[pic] || { char: '❓', label: pic };
};

const ghsLegends = [
  { id: 'GHS02', char: '🔥', name: 'GHS02 Flammable', desc: 'Fire risk, volatile liquids, solvents, fuels' },
  { id: 'GHS05', char: '🧪', name: 'GHS05 Corrosive', desc: 'Acid/alkali, severe skin burns, eye damage' },
  { id: 'GHS06', char: '☠️', name: 'GHS06 Toxic', desc: 'Severe poison hazard, fatal exposure danger' },
  { id: 'GHS07', char: '⚠️', name: 'GHS07 Harmful', desc: 'Irritant, narcotic effects, skin sensitizer' },
  { id: 'GHS08', char: '👤', name: 'GHS08 Health Hazard', desc: 'Chronic organ toxicity, respiratory, carcinogens' },
  { id: 'GHS09', char: '🌿', name: 'GHS09 Environmental', desc: 'Severe aquatic hazard, ecological hazard' }
];
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-800 tracking-tight font-sans">Hazardous Substances</h1>
        <div class="flex items-center gap-2 mt-1.5">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Site:</span>
          <span class="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs">Test Project 1</span>
        </div>
      </div>
      <button
        @click="store.navigateTo('haz-substances-add')"
        class="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/10 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shrink-0"
      >
        <Plus class="w-4 h-4" />
        <span>Add substance</span>
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- On Site -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">On Site</span>
          <Beaker class="w-4.5 h-4.5 text-brand-500" />
        </div>
        <div class="mt-4">
          <span class="block text-3xl font-black text-slate-800 leading-none">{{ activeSubstances.length }}</span>
          <span class="text-[10px] text-slate-400 font-bold mt-1 block">Active on site</span>
        </div>
      </div>

      <!-- Products -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Products</span>
          <FileText class="w-4.5 h-4.5 text-slate-500" />
        </div>
        <div class="mt-4">
          <span class="block text-3xl font-black text-slate-800 leading-none">{{ totalProducts }}</span>
          <span class="text-[10px] text-slate-400 font-bold mt-1 block">Total registered</span>
        </div>
      </div>

      <!-- SDS Overdue -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">SDS Overdue</span>
          <AlertCircle class="w-4.5 h-4.5 text-red-500 animate-pulse" />
        </div>
        <div class="mt-4">
          <span class="block text-3xl font-black" :class="overdueSdsCount > 0 ? 'text-red-600' : 'text-slate-800'">{{ overdueSdsCount }}</span>
          <span class="text-[10px] font-bold mt-1 block" :class="overdueSdsCount > 0 ? 'text-red-500' : 'text-slate-400'">Action required</span>
        </div>
      </div>

      <!-- Restricted -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-bold uppercase tracking-wider">Restricted</span>
          <AlertTriangle class="w-4.5 h-4.5 text-amber-500" />
        </div>
        <div class="mt-4">
          <span class="block text-3xl font-black text-slate-800 leading-none">{{ restrictedCount }}</span>
          <span class="text-[10px] text-slate-400 font-bold mt-1 block">Control required</span>
        </div>
      </div>
    </div>

    <!-- Attention Required -->
    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div class="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
        <AlertTriangle class="w-4.5 h-4.5 text-amber-500" />
        <h2 class="text-base font-extrabold text-slate-800 uppercase tracking-wider">Attention Required</h2>
      </div>

      <div v-if="attentionItems.length === 0" class="py-6 text-center">
        <p class="text-sm font-medium text-slate-400">No issues require immediate attention. All SDS and risk assessments are up to date.</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="item in attentionItems"
          :key="`${item.type}-${item.id}`"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-sm"
          :class="item.color"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100 shrink-0">
              <component :is="item.icon" class="w-4.5 h-4.5" />
            </div>
            <div>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide inline-block mb-1" :class="item.badgeColor">
                {{ item.label }}
              </span>
              <h4 class="text-sm font-extrabold text-slate-800 leading-tight">{{ item.substance }}</h4>
            </div>
          </div>
          <button
            @click="item.action"
            class="inline-flex items-center justify-center gap-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <span>{{ item.actionLabel }}</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Substance Register & GHS Legend Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
      <!-- Substance Register -->
      <div class="xl:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
          <div class="flex items-center gap-2">
            <Beaker class="w-4.5 h-4.5 text-brand-500" />
            <h2 class="text-base font-extrabold text-slate-800 uppercase tracking-wider">Substance Register</h2>
          </div>
          <button
            @click="store.navigateTo('haz-substances-register')"
            class="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
          >
            View Full Register
          </button>
        </div>

        <div class="overflow-x-auto -mx-6">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th class="py-3 px-6">Substance</th>
                <th class="py-3 px-4">Manufacturer</th>
                <th class="py-3 px-4">GHS</th>
                <th class="py-3 px-4">Location</th>
                <th class="py-3 px-4 text-right">Quantity</th>
                <th class="py-3 px-4">Used For</th>
                <th class="py-3 px-4">SDS</th>
                <th class="py-3 px-4">Risk</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs font-medium text-slate-600">
              <tr
                v-for="sub in store.substances"
                :key="sub.id"
                class="hover:bg-slate-50/60 transition-colors cursor-pointer"
                @click="store.navigateTo('haz-substances-detail', { substanceId: sub.id })"
              >
                <td class="py-4 px-6 font-bold text-slate-800">
                  <span class="hover:text-brand-600 hover:underline block max-w-[150px] truncate">
                    {{ sub.name }}
                  </span>
                </td>
                <td class="py-4 px-4 text-slate-500 font-semibold">{{ sub.manufacturer }}</td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-1">
                    <span
                      v-for="pic in sub.hazards.pictograms.slice(0, 3)"
                      :key="pic"
                      class="cursor-help text-sm"
                      :title="getGhsIcon(pic).label"
                    >
                      {{ getGhsIcon(pic).char }}
                    </span>
                    <span v-if="sub.hazards.pictograms.length > 3" class="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 rounded">
                      +{{ sub.hazards.pictograms.length - 3 }}
                    </span>
                  </div>
                </td>
                <td class="py-4 px-4 text-slate-500">{{ sub.location }}</td>
                <td class="py-4 px-4 text-right font-bold text-slate-700">
                  {{ sub.quantity }} <span class="text-[10px] text-slate-400 font-medium">{{ sub.unit }}</span>
                </td>
                <td class="py-4 px-4 text-slate-500 truncate max-w-[120px]">{{ sub.usedFor }}</td>
                <td class="py-4 px-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    :class="[
                      sub.sds.status === 'Current' ? 'bg-success-50 text-success-700 border-success-100' : '',
                      sub.sds.status === 'Due Soon' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : '',
                      sub.sds.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100' : '',
                      sub.sds.status === 'Missing' ? 'bg-slate-50 text-slate-500 border-slate-200' : ''
                    ]"
                  >
                    <span class="w-1.5 h-1.5 rounded-full"
                      :class="[
                        sub.sds.status === 'Current' ? 'bg-success-500' : '',
                        sub.sds.status === 'Due Soon' ? 'bg-yellow-500' : '',
                        sub.sds.status === 'Overdue' ? 'bg-red-500' : '',
                        sub.sds.status === 'Missing' ? 'bg-slate-400' : ''
                      ]"
                    ></span>
                    <span>{{ sub.sds.status }}</span>
                  </span>
                </td>
                <td class="py-4 px-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    :class="[
                      sub.riskAssessment.status === 'Approved' ? 'bg-success-50 text-success-700 border-success-100' : '',
                      sub.riskAssessment.status === 'Required' ? 'bg-orange-50 text-orange-700 border-orange-100' : '',
                      sub.riskAssessment.status === 'Draft' ? 'bg-slate-50 text-slate-500 border-slate-200' : '',
                      sub.riskAssessment.status === 'Review Required' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''
                    ]"
                  >
                    <span class="w-1.5 h-1.5 rounded-full"
                      :class="[
                        sub.riskAssessment.status === 'Approved' ? 'bg-success-500' : '',
                        sub.riskAssessment.status === 'Required' ? 'bg-orange-500' : '',
                        sub.riskAssessment.status === 'Draft' ? 'bg-slate-400' : '',
                        sub.riskAssessment.status === 'Review Required' ? 'bg-amber-500' : ''
                      ]"
                    ></span>
                    <span>{{ sub.riskAssessment.status === 'Review Required' ? 'Review Required' : sub.riskAssessment.status }}</span>
                  </span>
                </td>
                <td class="py-4 px-4">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
                    :class="[
                      sub.status === 'Active' ? 'bg-brand-50 text-brand-700 border-brand-100' : '',
                      sub.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' : '',
                      sub.status === 'Restricted' ? 'bg-red-50 text-red-700 border-red-100' : '',
                      sub.status === 'Archived' ? 'bg-slate-200 text-slate-500 border-slate-300' : ''
                    ]"
                  >
                    {{ sub.status }}
                  </span>
                </td>
                <td class="py-4 px-6 text-center" @click.stop>
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="store.navigateTo('haz-substances-detail', { substanceId: sub.id })"
                      class="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                      title="View details"
                    >
                      <Eye class="w-4.5 h-4.5" />
                    </button>
                    <button
                      v-if="sub.riskAssessment.status === 'Required'"
                      @click="store.navigateTo('haz-substances-assessment', { substanceId: sub.id })"
                      class="p-1 text-slate-400 hover:text-orange-500 transition-colors"
                      title="Create assessment"
                    >
                      <Wrench class="w-4.5 h-4.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- GHS Hazard Legend Card -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 self-start">
        <div class="border-b border-slate-50 pb-3 flex items-center gap-2">
          <Flame class="w-4 h-4 text-orange-500 animate-pulse" />
          <h3 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">GHS Hazard Legend</h3>
        </div>
        <p class="text-[10px] text-slate-400 leading-relaxed font-semibold">
          Regulatory warning symbols used in the portfolio register:
        </p>
        <div class="space-y-3">
          <div v-for="legend in ghsLegends" :key="legend.id" class="flex items-start gap-2.5 text-[11px] font-medium text-slate-600 border-b border-slate-50/50 pb-2.5 last:border-0 last:pb-0">
            <span class="text-lg shrink-0 select-none p-1 bg-slate-50 rounded-lg border border-slate-100 shadow-xs">{{ legend.char }}</span>
            <div>
              <span class="font-extrabold text-slate-700 block text-[10px]">{{ legend.name }}</span>
              <span class="text-[9px] text-slate-400 block mt-0.5 leading-normal font-semibold">{{ legend.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
