<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Incident & Near-Miss Root Causes'
  },
  subtitle: {
    type: String,
    default: 'Classified safety reports & near-miss investigations'
  },
  data: {
    type: Array,
    required: true // [{ label, value, color }]
  },
  totalLabel: {
    type: String,
    default: 'Total Events'
  }
});

const activeIndex = ref(null);

const total = computed(() => {
  if (!props.data || props.data.length === 0) return 0;
  return props.data.reduce((acc, item) => acc + (item.value || 0), 0);
});

// SVG Donut geometry
const size = 200;
const strokeWidth = 24;
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;

const segments = computed(() => {
  if (!props.data || props.data.length === 0) return [];
  let accumulatedAngle = 0;
  return props.data.map((item, index) => {
    const percentage = total.value > 0 ? (item.value / total.value) * 100 : 0;
    const strokeDash = (percentage / 100) * circumference;
    const strokeOffset = circumference - strokeDash;
    const rotation = (accumulatedAngle / 100) * 360 - 90;
    accumulatedAngle += percentage;

    return {
      ...item,
      percentage: Math.round(percentage),
      strokeDash,
      strokeOffset,
      rotation,
      index
    };
  });
});

const currentHovered = computed(() => {
  if (activeIndex.value !== null && segments.value[activeIndex.value]) {
    return segments.value[activeIndex.value];
  }
  return null;
});
</script>

<template>
  <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-sm font-bold text-slate-800 tracking-tight">{{ title }}</h3>
        <p class="text-xs text-slate-400 mt-0.5">{{ subtitle }}</p>
      </div>
      <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
        YTD Safety
      </span>
    </div>

    <!-- Chart & Legend Container -->
    <div class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
      <!-- Donut SVG -->
      <div class="relative w-44 h-44 shrink-0 flex items-center justify-center">
        <svg :width="size" :height="size" class="transform -rotate-90">
          <circle
            :cx="size / 2"
            :cy="size / 2"
            :r="radius"
            fill="transparent"
            stroke="#f1f5f9"
            :stroke-width="strokeWidth"
          />
          <circle
            v-for="(seg, idx) in segments"
            :key="idx"
            :cx="size / 2"
            :cy="size / 2"
            :r="radius"
            fill="transparent"
            :stroke="seg.color"
            :stroke-width="activeIndex === idx ? strokeWidth + 4 : strokeWidth"
            :stroke-dasharray="`${seg.strokeDash} ${circumference}`"
            :transform="`rotate(${seg.rotation} ${size / 2} ${size / 2})`"
            class="transition-all duration-300 cursor-pointer"
            :style="{ opacity: activeIndex === null || activeIndex === idx ? 1 : 0.45 }"
            @mouseenter="activeIndex = idx"
            @mouseleave="activeIndex = null"
          />
        </svg>

        <!-- Center Label -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <template v-if="currentHovered">
            <span class="text-2xl font-black tracking-tight" :style="{ color: currentHovered.color }">
              {{ currentHovered.value }}
            </span>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider -mt-0.5">
              {{ currentHovered.percentage }}%
            </span>
            <span class="text-[9px] text-slate-400 truncate max-w-[80px]">
              {{ currentHovered.label }}
            </span>
          </template>
          <template v-else>
            <span class="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {{ total }}
            </span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {{ totalLabel }}
            </span>
          </template>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex-1 w-full space-y-2">
        <div
          v-for="(seg, idx) in segments"
          :key="idx"
          @mouseenter="activeIndex = idx"
          @mouseleave="activeIndex = null"
          class="flex items-center justify-between p-1.5 rounded-lg transition-all cursor-pointer text-xs"
          :class="activeIndex === idx ? 'bg-slate-50 shadow-xs' : 'hover:bg-slate-50/50'"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
              :class="activeIndex === idx ? 'scale-125' : ''"
              :style="{ backgroundColor: seg.color }"
            ></span>
            <span class="font-medium text-slate-700 truncate" :class="activeIndex === idx ? 'font-bold text-slate-900' : ''">
              {{ seg.label }}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-2">
            <span class="text-slate-400 font-medium text-[11px]">{{ seg.value }} events</span>
            <span
              class="px-1.5 py-0.5 rounded text-[10px] font-bold"
              :style="{ backgroundColor: `${seg.color}15`, color: seg.color }"
            >
              {{ seg.percentage }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
