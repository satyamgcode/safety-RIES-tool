<script setup>
import { store } from '../store';
import {
  LayoutDashboard,
  Briefcase,
  ShieldAlert,
  ClipboardList,
  RefreshCw,
  GitCompare,
  ArrowRight,
  ShieldCheck,
  Flame,
  Info
} from 'lucide-vue-next';

// Process Flow Steps
const flowSteps = [
  {
    step: 1,
    title: 'RI&E Overview',
    subtitle: 'Portfolio Monitoring',
    desc: 'The corporate dashboard monitor. Inspectors look here to get a high-level view of all site locations, spot overdue audits, and find projects lacking active assessments.',
    icon: LayoutDashboard,
    color: 'bg-blue-500 text-white shadow-blue-500/20',
    link: 'overview'
  },
  {
    step: 2,
    title: 'Project RI&E List',
    subtitle: 'Project Site Scopes',
    desc: 'Drill down into a specific project. Review all active and archived assessments for that site, inspect versions, and start safety reviews or new folders.',
    icon: Briefcase,
    color: 'bg-brand-500 text-white shadow-brand-500/20',
    link: 'project-list'
  },
  {
    step: 3,
    title: 'New Assessment',
    subtitle: '6-Step Creation Wizard',
    desc: 'Create an assessment from scratch using a guided wizard: General Info -> Workspace Areas -> Hazard Inventories -> Kinney Scoring -> Control Hierarchy -> Sign off.',
    icon: ClipboardList,
    color: 'bg-purple-500 text-white shadow-purple-500/20',
    link: 'new-assessment'
  },
  {
    step: 4,
    title: 'Hazard Register',
    subtitle: 'Hazard & Control Registry',
    desc: 'Deep-dive into individual hazards. Open details to adjust Kinney parameters, implement hierarchy controls (Engineering,PPE), and toggle corrective actions.',
    icon: ShieldAlert,
    color: 'bg-red-500 text-white shadow-red-500/20',
    link: 'hazards'
  },
  {
    step: 5,
    title: 'Start Review',
    subtitle: 'Cloned Audit Loop',
    desc: 'Clone an existing assessment into a new draft, adjust risk levels using slide ranges to reflect current site audits, enter inspector notes, and publish the upgrade.',
    icon: RefreshCw,
    color: 'bg-orange-500 text-white shadow-orange-500/20',
    link: 'review'
  },
  {
    step: 6,
    title: 'Compare Versions',
    subtitle: 'Side-by-Side Review',
    desc: 'Compare version diff logs (e.g. v1.0 vs v2.0). Review changes in Kinney scores, added/removed hazards, and count resolved safety actions.',
    icon: GitCompare,
    color: 'bg-success-500 text-white shadow-success-500/20',
    link: 'compare'
  }
];
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans flex items-center gap-2">
        <ShieldCheck class="w-6 h-6 text-brand-500" />
        <span>Workflow Guide</span>
      </h1>
      <p class="text-xs text-slate-500 mt-1">Understanding the 6-stage professional Risk Inventory & Evaluation (RI&E) lifecycle flow.</p>
    </div>

    <!-- Visual Process Timeline Grid -->
    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-8">
      <div class="border-b border-slate-50 pb-3 flex items-center justify-between">
        <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">The Risk Mitigation Loop</h3>
        <span class="text-[10px] text-slate-400 font-bold flex items-center gap-1">
          <Info class="w-3.5 h-3.5 text-slate-400" />
          Click any step node to open that workspace view.
        </span>
      </div>

      <!-- Timeline path (vertical on mobile, grid on desktop) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        <div
          v-for="step in flowSteps"
          :key="step.step"
          @click="store.navigateTo(step.link)"
          class="group border border-slate-100 bg-slate-50/50 p-5 rounded-2xl space-y-4 hover:bg-white hover:border-brand-100 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 flex flex-col justify-between"
        >
          <div class="space-y-3">
            <!-- Node Header -->
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Stage {{ step.step }} of 6
              </span>
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-md" :class="step.color">
                <component :is="step.icon" class="w-4 h-4" />
              </div>
            </div>

            <!-- Node Titles -->
            <div>
              <h4 class="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-brand-600 transition-colors">
                {{ step.title }}
              </h4>
              <span class="text-[10px] text-slate-400 font-bold block mt-0.5">{{ step.subtitle }}</span>
            </div>

            <!-- Node Description -->
            <p class="text-[11px] text-slate-400 leading-relaxed font-semibold">
              {{ step.desc }}
            </p>
          </div>

          <!-- Bottom trigger link -->
          <div class="pt-2 border-t border-slate-100/50 flex items-center justify-between text-[9px] font-bold text-brand-600 select-none">
            <span>Enter Stage Workspace</span>
            <ArrowRight class="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>

    <!-- Methodology details card -->
    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-3">
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Flame class="w-4.5 h-4.5 text-brand-500" />
          <span>Risk Assessment Methodology</span>
        </h4>
        <p class="text-xs text-slate-500 leading-relaxed">
          HSEHub utilizes the industrial **Finekin-Kinney Risk Assessment Formula** to quantitatively measure hazard severity. By establishing numeric values for Likelihood, Exposure, and Severity, safety officers ensure objective prioritization:
        </p>
        <div class="text-[11px] font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
          <span class="block">🧮 Formula: <span class="text-slate-800 font-extrabold">Likelihood (L) &times; Exposure (E) &times; Severity (S) = Risk Score</span></span>
          <span class="block">🛡️ Objective: Apply controls to reduce coordinates to a safe Residual Score (&lt; 20).</span>
        </div>
      </div>

      <div class="space-y-3">
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck class="w-4.5 h-4.5 text-success" />
          <span>Hierarchy of Safety Controls</span>
        </h4>
        <p class="text-xs text-slate-500 leading-relaxed">
          When mitigating risks, the system prioritizes measures matching the **HSE Hierarchy of Controls**. Higher hierarchy layers yield larger risk reduction vectors:
        </p>
        <div class="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-600">
          <div class="bg-red-50 p-2 rounded-lg text-center border border-red-100 text-red-700">
            <span class="block">1. Elimination</span>
            <span class="text-[8px] font-semibold block mt-0.5">Removes hazard (90% reduction)</span>
          </div>
          <div class="bg-blue-50 p-2 rounded-lg text-center border border-blue-100 text-blue-700">
            <span class="block">2. Engineering</span>
            <span class="text-[8px] font-semibold block mt-0.5">Physical barrier (60% reduction)</span>
          </div>
          <div class="bg-slate-50 p-2 rounded-lg text-center border border-slate-100 text-slate-600">
            <span class="block">3. PPE / Admin</span>
            <span class="text-[8px] font-semibold block mt-0.5">Protective gear (30% reduction)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
