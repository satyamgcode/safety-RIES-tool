<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Site Inspections & Audit Results by Domain'
  },
  subtitle: {
    type: String,
    default: 'Compliance pass rate vs corrective findings recorded'
  },
  data: {
    type: Array,
    required: true // [{ category: 'Housekeeping', passed: 18, findings: 2 }, ...]
  }
});

const hoveredIndex = ref(null);
const hoveredType = ref(null);

const maxVal = computed(() => {
  if (!props.data || props.data.length === 0) return 10;
  const allValues = props.data.flatMap(d => [d.passed || 0, d.findings || 0]);
  const max = Math.max(...allValues, 10);
  return Math.ceil(max * 1.25);
});

// SVG Chart dimensions
const svgWidth = 520;
const svgHeight = 210;
const padding = { top: 25, right: 20, bottom: 40, left: 35 };

const chartWidth = svgWidth - padding.left - padding.right;
const chartHeight = svgHeight - padding.top - padding.bottom;

const categoryWidth = computed(() => {
  if (!props.data || props.data.length === 0) return chartWidth;
  return chartWidth / props.data.length;
});

const barWidth = 14;
const barGap = 4;

// Y-axis grid ticks
const yTicks = computed(() => {
  const count = 4;
  const step = maxVal.value / count;
  const ticks = [];
  for (let i = 0; i <= count; i++) {
    const val = Math.round(i * step);
    const y = padding.top + chartHeight - (val / maxVal.value) * chartHeight;
    ticks.push({ val, y });
  }
  return ticks;
});
</script>

<template>
  <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
    <!-- Header with Legend -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h3 class="text-sm font-bold text-slate-800 tracking-tight">{{ title }}</h3>
        <p class="text-xs text-slate-400 mt-0.5">{{ subtitle }}</p>
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-4 text-xs font-semibold">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-emerald-500"></span>
          <span class="text-slate-600">Passed / Compliant</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-amber-500"></span>
          <span class="text-slate-600">Findings Raised</span>
        </div>
      </div>
    </div>

    <!-- SVG Chart -->
    <div class="mt-4 relative w-full overflow-x-auto">
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="w-full h-auto"
        style="min-width: 380px;"
      >
        <!-- Horizontal Grid Lines -->
        <g class="text-slate-200">
          <line
            v-for="(tick, idx) in yTicks"
            :key="idx"
            :x1="padding.left"
            :y1="tick.y"
            :x2="svgWidth - padding.right"
            :y2="tick.y"
            stroke="currentColor"
            stroke-dasharray="3,3"
            stroke-width="1"
          />
          <!-- Y-axis text -->
          <text
            v-for="(tick, idx) in yTicks"
            :key="'txt-' + idx"
            :x="padding.left - 8"
            :y="tick.y + 3"
            text-anchor="end"
            class="text-[9px] fill-slate-400 font-semibold"
          >
            {{ tick.val }}
          </text>
        </g>

        <!-- Bars per Category -->
        <g v-for="(cat, idx) in data" :key="idx">
          <!-- Category Center X -->
          <!-- Passed bar -->
          <rect
            :x="padding.left + (idx * categoryWidth) + (categoryWidth / 2) - barWidth - (barGap / 2)"
            :y="padding.top + chartHeight - (cat.passed / maxVal) * chartHeight"
            :width="barWidth"
            :height="(cat.passed / maxVal) * chartHeight"
            rx="3"
            class="fill-emerald-500 hover:fill-emerald-600 transition-colors cursor-pointer"
            @mouseenter="hoveredIndex = idx; hoveredType = 'passed'"
            @mouseleave="hoveredIndex = null; hoveredType = null"
          />

          <!-- Findings bar -->
          <rect
            :x="padding.left + (idx * categoryWidth) + (categoryWidth / 2) + (barGap / 2)"
            :y="padding.top + chartHeight - (cat.findings / maxVal) * chartHeight"
            :width="barWidth"
            :height="(cat.findings / maxVal) * chartHeight"
            rx="3"
            class="fill-amber-500 hover:fill-amber-600 transition-colors cursor-pointer"
            @mouseenter="hoveredIndex = idx; hoveredType = 'findings'"
            @mouseleave="hoveredIndex = null; hoveredType = null"
          />

          <!-- Value Labels on Hover -->
          <text
            v-if="hoveredIndex === idx && hoveredType === 'passed'"
            :x="padding.left + (idx * categoryWidth) + (categoryWidth / 2) - barWidth / 2 - (barGap / 2)"
            :y="padding.top + chartHeight - (cat.passed / maxVal) * chartHeight - 5"
            text-anchor="middle"
            class="text-[10px] fill-emerald-700 font-bold"
          >
            {{ cat.passed }}
          </text>

          <text
            v-if="hoveredIndex === idx && hoveredType === 'findings'"
            :x="padding.left + (idx * categoryWidth) + (categoryWidth / 2) + barWidth / 2 + (barGap / 2)"
            :y="padding.top + chartHeight - (cat.findings / maxVal) * chartHeight - 5"
            text-anchor="middle"
            class="text-[10px] fill-amber-700 font-bold"
          >
            {{ cat.findings }}
          </text>

          <!-- X-Axis Category Label -->
          <text
            :x="padding.left + (idx * categoryWidth) + (categoryWidth / 2)"
            :y="svgHeight - 12"
            text-anchor="middle"
            class="text-[10px] font-medium"
            :class="hoveredIndex === idx ? 'fill-slate-900 font-bold' : 'fill-slate-500'"
          >
            {{ cat.category }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>
