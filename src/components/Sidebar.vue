<script setup>
import { computed } from 'vue';
import { store } from '../store';
import {
  LayoutDashboard,
  Briefcase,
  ShieldAlert,
  ClipboardList,
  RefreshCw,
  GitCompare,
  Shield,
  HelpCircle,
  ClipboardCheck,
  Flame,
  Beaker,
  Award
} from 'lucide-vue-next';

// Exact tabs matching the Miro/Whimsical process layout + Guide + TRAs
const navItems = [
  { name: 'RI&E Overview', page: 'dashboard', icon: LayoutDashboard },
  { name: 'Project RI&E List', page: 'project-list', icon: Briefcase },
  { name: 'Hazard Register', page: 'hazards', icon: ShieldAlert },
  { name: 'New Assessment', page: 'new-assessment', icon: ClipboardList },
  { name: 'Start Review', page: 'review', icon: RefreshCw },
  { name: 'Compare Versions', page: 'compare', icon: GitCompare },
  { name: 'Task Safety (TRA)', page: 'tra-dashboard', icon: ClipboardCheck },
  { name: 'Training & Certs', page: 'training-overview', icon: Award },
  { name: 'Workflow Guide', page: 'guide', icon: HelpCircle }
];

const hazNavItems = [
  { name: 'Overview', page: 'haz-substances-overview', icon: Beaker },
  { name: 'Register', page: 'haz-substances-register', icon: ClipboardList }
];

const activePage = computed(() => {
  return store.currentPage;
});
</script>

<template>
  <aside class="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 shrink-0 z-30 shadow-sm">
    <!-- Header/Logo -->
    <div class="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
      <div @click="store.navigateTo('overview')" class="cursor-pointer flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Shield class="w-4 h-4 fill-white/10" />
        </div>
        <div>
          <span class="font-sans font-extrabold text-lg text-slate-800 tracking-tight block">HSE<span class="text-brand-500">Hub</span></span>
          <span class="text-[9px] font-semibold text-slate-400 tracking-wider uppercase block -mt-1">RI&E Management</span>
        </div>
      </div>
    </div>

    <!-- Navigation Links (Exact 6 pages) -->
    <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
      <div v-for="item in navItems" :key="item.page">
        <a
          href="#"
          @click.prevent="store.navigateTo(item.page)"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200"
          :class="[
            activePage === item.page || (item.page === 'training-overview' && activePage === 'employee-certificates')
              ? 'bg-brand-50 text-brand-600 shadow-sm shadow-brand-500/5 font-semibold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          ]"
        >
          <component
            :is="item.icon"
            class="w-4.5 h-4.5 transition-transform duration-200"
            :class="activePage === item.page || (item.page === 'training-overview' && activePage === 'employee-certificates') ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'"
          />
          <span class="flex-1">{{ item.name }}</span>
        </a>
      </div>

      <!-- Divider -->
      <div class="my-4 border-t border-slate-100"></div>

      <!-- Hazardous Substances Heading -->
      <div class="px-3.5 mb-2 flex items-center gap-1.5 text-slate-400">
        <Flame class="w-3.5 h-3.5 text-orange-500" />
        <span class="text-[10px] font-extrabold tracking-wider uppercase">Hazardous Substances</span>
      </div>

      <!-- Hazardous Substances Links -->
      <div v-for="item in hazNavItems" :key="item.page">
        <a
          href="#"
          @click.prevent="store.navigateTo(item.page)"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200"
          :class="[
            activePage === item.page || 
            (item.page === 'haz-substances-overview' && activePage === 'haz-substances-detail') || 
            (item.page === 'haz-substances-overview' && activePage === 'haz-substances-assessment')
              ? 'bg-brand-50 text-brand-600 shadow-sm shadow-brand-500/5 font-semibold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          ]"
        >
          <component
            :is="item.icon"
            class="w-4.5 h-4.5 transition-transform duration-200"
            :class="activePage === item.page || 
                    (item.page === 'haz-substances-overview' && activePage === 'haz-substances-detail') || 
                    (item.page === 'haz-substances-overview' && activePage === 'haz-substances-assessment') ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'"
          />
          <span class="flex-1">{{ item.name }}</span>
        </a>
      </div>
    </nav>

    <!-- Company Badge Footer -->
    <div class="p-4 border-t border-slate-100 bg-slate-50/50">
      <div class="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner">
          OP
        </div>
        <div class="overflow-hidden">
          <span class="block text-xs font-semibold text-slate-700 truncate">{{ store.settings.companyName }}</span>
          <span class="block text-[10px] font-medium text-slate-400 truncate">HSE Enterprise Account</span>
        </div>
      </div>
    </div>
  </aside>
</template>
