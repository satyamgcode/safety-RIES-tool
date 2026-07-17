<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'line' // 'line' or 'bar'
  },
  data: {
    type: Array,
    required: true // e.g., [{ label: 'Jan', value: 30 }]
  },
  height: {
    type: Number,
    default: 200
  },
  color: {
    type: String,
    default: '#0284c7' // Blue primary
  },
  colorGradient: {
    type: Array,
    default: () => ['#0284c7', '#0284c7']
  }
});

const activeBarIndex = ref(null);
const activeLineIndex = ref(null);

const maxVal = computed(() => {
  const vals = props.data.map(d => d.value);
  const max = Math.max(...vals, 1);
  // Round up to nearest nice interval
  return Math.ceil(max * 1.15);
});

// Dimensions
const padding = { top: 20, right: 20, bottom: 30, left: 40 };
const svgWidth = 500;
const svgHeight = 220;

const chartWidth = svgWidth - padding.left - padding.right;
const chartHeight = svgHeight - padding.top - padding.bottom;

// Line points generator
const linePoints = computed(() => {
  if (props.data.length === 0) return '';
  return props.data.map((d, i) => {
    const x = padding.left + (i / (props.data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.value / maxVal.value) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });
});

const linePath = computed(() => {
  if (linePoints.value.length === 0) return '';
  return linePoints.value.reduce((acc, p, i) => {
    return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');
});

const areaPath = computed(() => {
  if (linePoints.value.length === 0) return '';
  const first = linePoints.value[0];
  const last = linePoints.value[linePoints.value.length - 1];
  
  let path = `M ${first.x} ${padding.top + chartHeight} `;
  path += linePoints.value.reduce((acc, p) => acc + `L ${p.x} ${p.y} `, '');
  path += `L ${last.x} ${padding.top + chartHeight} Z`;
  return path;
});

// Bar dimensions generator
const bars = computed(() => {
  const barCount = props.data.length;
  const totalBarSpacingRatio = 0.4; // 40% spacing, 60% bar width
  const rawBarWidth = chartWidth / barCount;
  const spacing = rawBarWidth * totalBarSpacingRatio;
  const barWidth = rawBarWidth - spacing;

  return props.data.map((d, i) => {
    const x = padding.left + i * rawBarWidth + spacing / 2;
    const h = (d.value / maxVal.value) * chartHeight;
    const y = padding.top + chartHeight - h;
    return {
      x,
      y,
      width: barWidth,
      height: Math.max(h, 4), // At least a small sliver
      label: d.label,
      value: d.value,
      color: d.color // Optional specific color override
    };
  });
});

// Y-axis gridlines
const yTicks = computed(() => {
  const steps = 4;
  const ticks = [];
  for (let i = 0; i <= steps; i++) {
    const val = Math.round((maxVal.value / steps) * i);
    const y = padding.top + chartHeight - (i / steps) * chartHeight;
    ticks.push({ val, y });
  }
  return ticks;
});
</script>

<template>
  <div class="w-full select-none">
    <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" width="100%" class="overflow-visible font-sans">
      <!-- Defs for gradients -->
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.0" />
        </linearGradient>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#0284c7" />
        </linearGradient>
      </defs>

      <!-- Horizontal gridlines -->
      <g opacity="0.08">
        <line
          v-for="tick in yTicks"
          :key="tick.y"
          :x1="padding.left"
          :y1="tick.y"
          :x2="svgWidth - padding.right"
          :y2="tick.y"
          stroke="#1e293b"
          stroke-width="1.5"
          stroke-dasharray="3 3"
        />
      </g>

      <!-- Y Axis Values -->
      <g class="text-[10px] fill-slate-400 font-medium">
        <text
          v-for="tick in yTicks"
          :key="'txt-' + tick.y"
          :x="padding.left - 10"
          :y="tick.y + 3.5"
          text-anchor="end"
        >
          {{ tick.val }}
        </text>
      </g>

      <!-- Render Bar Chart -->
      <g v-if="type === 'bar'">
        <g
          v-for="(bar, i) in bars"
          :key="i"
          @mouseenter="activeBarIndex = i"
          @mouseleave="activeBarIndex = null"
          class="cursor-pointer"
        >
          <!-- Rounded Bar Background (hover) -->
          <rect
            :x="bar.x - 2"
            :y="padding.top - 5"
            :width="bar.width + 4"
            :height="chartHeight + 10"
            fill="#f1f5f9"
            :opacity="activeBarIndex === i ? 0.4 : 0"
            rx="6"
            class="transition-opacity duration-150"
          />
          <!-- The Bar -->
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            :fill="bar.color || 'url(#barGrad)'"
            rx="4"
            class="transition-all duration-300 origin-bottom scale-y-100"
          />
          <!-- Value on top of bar on hover -->
          <text
            v-if="activeBarIndex === i"
            :x="bar.x + bar.width / 2"
            :y="bar.y - 6"
            text-anchor="middle"
            class="text-[10px] font-bold fill-brand-600 animate-fade-in"
          >
            {{ bar.value }}
          </text>
        </g>
      </g>

      <!-- Render Line Chart -->
      <g v-if="type === 'line'">
        <!-- Area fill under line -->
        <path
          :d="areaPath"
          fill="url(#lineGrad)"
        />

        <!-- The line itself -->
        <path
          :d="linePath"
          fill="none"
          stroke="#0284c7"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="transition-all duration-300"
        />

        <!-- Node points -->
        <g
          v-for="(p, i) in linePoints"
          :key="i"
          @mouseenter="activeLineIndex = i"
          @mouseleave="activeLineIndex = null"
          class="cursor-pointer"
        >
          <!-- Outer glow/hover circle -->
          <circle
            :cx="p.x"
            :cy="p.y"
            r="8"
            fill="#0284c7"
            :opacity="activeLineIndex === i ? 0.25 : 0"
            class="transition-opacity duration-150"
          />
          <!-- Main circle node -->
          <circle
            :cx="p.x"
            :cy="p.y"
            r="4"
            fill="#ffffff"
            stroke="#0284c7"
            stroke-width="2.5"
          />
          <!-- Tooltip text when hovered -->
          <g v-if="activeLineIndex === i" class="pointer-events-none">
            <rect
              :x="p.x - 24"
              :y="p.y - 28"
              width="48"
              height="20"
              rx="4"
              fill="#1e293b"
              class="shadow-lg"
            />
            <text
              :x="p.x"
              :y="p.y - 15"
              text-anchor="middle"
              class="text-[9px] font-bold fill-white"
            >
              {{ p.value }}
            </text>
          </g>
        </g>
      </g>

      <!-- X Axis Labels -->
      <g class="text-[10px] fill-slate-400 font-semibold">
        <!-- Labels for Bar -->
        <text
          v-if="type === 'bar'"
          v-for="(bar, i) in bars"
          :key="'lbl-bar-' + i"
          :x="bar.x + bar.width / 2"
          :y="svgHeight - 10"
          text-anchor="middle"
        >
          {{ bar.label }}
        </text>

        <!-- Labels for Line -->
        <text
          v-if="type === 'line'"
          v-for="(p, i) in linePoints"
          :key="'lbl-line-' + i"
          :x="p.x"
          :y="svgHeight - 10"
          text-anchor="middle"
        >
          {{ p.label }}
        </text>
      </g>
    </svg>
  </div>
</template>
