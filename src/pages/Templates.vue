<script setup>
import { ref } from 'vue';
import { store } from '../store';
import {
  Files,
  HardHat,
  Monitor,
  Box,
  Factory,
  Zap,
  FlaskConical,
  X,
  PlusCircle,
  Play,
  Info
} from 'lucide-vue-next';

// Map icon string to component reference
const iconMap = {
  HardHat,
  Monitor,
  Box,
  Factory,
  Zap,
  FlaskConical
};

// Selected Template details state
const selectedTemplate = ref(null);

const openTemplate = (tpl) => {
  selectedTemplate.value = tpl;
};

const closeTemplate = () => {
  selectedTemplate.value = null;
};

const initializeWithTemplate = (tpl) => {
  // Pre-load wizard state
  store.wizard.step = 1;
  store.wizard.info = {
    projectId: 1, // Harbour Expansion
    title: `${tpl.name} - Initial Run`,
    area: 'Zone A',
    method: 'Finekin-Kinney',
    assessor: 'Current User',
    reviewDate: new Date(2027, 0, 1).toISOString().split('T')[0],
    description: `Initialized via HSE Template: ${tpl.name}. ${tpl.description}`
  };

  // Convert template hazards format into wizard hazards
  store.wizard.hazards = tpl.hazards.map(h => {
    // Map Kinney score back to coordinates for simulation
    let l = 3, e = 6, s = 15;
    if (h.initialRisk > 400) { l = 6; e = 8; s = 15; }
    else if (h.initialRisk > 200) { l = 4; e = 6; s = 15; }
    
    return {
      name: h.name,
      consequence: `Possible occupational incident related to ${h.name.toLowerCase()}`,
      category: h.category,
      likelihood: l,
      exposure: e,
      severity: s,
      whoIsExposed: 'Field operatives and crew'
    };
  });

  store.addToast(`Wizard preloaded with template: "${tpl.name}".`, 'success');
  store.navigateTo('create-assessment');
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">RI&E Templates</h1>
        <p class="text-xs text-slate-500 mt-1">Predefined industry-standard safety lists to quickly initialize risk evaluations for standard operations.</p>
      </div>
    </div>

    <!-- Template Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="tpl in store.templates"
        :key="tpl.id"
        @click="openTemplate(tpl)"
        class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-4 group"
      >
        <div class="space-y-2">
          <!-- Render mapped icon -->
          <div class="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
            <component :is="iconMap[tpl.icon] || Files" class="w-5 h-5" />
          </div>
          <h3 class="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors leading-snug">{{ tpl.name }}</h3>
          <p class="text-xs text-slate-400 leading-relaxed truncate">{{ tpl.description }}</p>
        </div>

        <div class="pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span>Hazards: {{ tpl.hazards?.length || 0 }} items</span>
          <span class="text-brand-600 group-hover:underline flex items-center gap-0.5">Inspect Template &rarr;</span>
        </div>
      </div>
    </div>

    <!-- Slide-over Template Detail modal -->
    <div v-if="selectedTemplate" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
      <div class="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-in">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div class="flex items-center gap-2.5">
            <component :is="iconMap[selectedTemplate.icon] || Files" class="w-5 h-5 text-brand-500" />
            <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-sans">{{ selectedTemplate.name }}</h3>
          </div>
          <button @click="closeTemplate" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Contents -->
        <div class="space-y-4 flex-1">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <p class="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">{{ selectedTemplate.description }}</p>
          </div>

          <!-- Hazards mapping lists -->
          <div class="space-y-2.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prepopulated Hazard Registry ({{ selectedTemplate.hazards?.length || 0 }})</label>
            
            <div class="space-y-2">
              <div
                v-for="h in selectedTemplate.hazards"
                :key="h.name"
                class="text-xs p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start justify-between gap-3"
              >
                <div class="min-w-0">
                  <span class="block font-bold text-slate-700 truncate">{{ h.name }}</span>
                  <span class="block text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Category: {{ h.category }}</span>
                </div>
                <div class="shrink-0 text-right">
                  <span class="block text-[10px] font-bold text-slate-400">Initial: {{ h.initialRisk }}</span>
                  <span class="block text-[10px] font-bold text-slate-700 mt-1">Residual: {{ h.residualRisk }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button @click="closeTemplate" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white text-xs font-bold transition-all">Close</button>
          <button
            @click="initializeWithTemplate(selectedTemplate)"
            class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/10 flex items-center gap-1.5 transition-all"
          >
            <Play class="w-3.5 h-3.5 fill-current" />
            <span>Use Template to Create RI&E</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
