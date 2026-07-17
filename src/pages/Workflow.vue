<script setup>
import {
  Building,
  Briefcase,
  ClipboardList,
  ShieldAlert,
  Flame,
  Wrench,
  ShieldCheck,
  CheckSquare,
  FileClock,
  CheckCircle2,
  History,
  Archive,
  ArrowRight,
  GitBranch
} from 'lucide-vue-next';

// Process steps list
const steps = [
  {
    id: 1,
    title: 'Company',
    desc: 'Establish safety policy, set up default Kinney risk formula parameters, and map corporate locations.',
    icon: Building,
    color: 'border-blue-200 text-blue-600 bg-blue-50/50'
  },
  {
    id: 2,
    title: 'Projects',
    desc: 'Organize specific project sites, map physical locations, and assign HSE managers.',
    icon: Briefcase,
    color: 'border-blue-200 text-blue-600 bg-blue-50/50'
  },
  {
    id: 3,
    title: 'Assessment',
    desc: 'Brainstorm tasks and activities, compile drafts, and assign lead safety inspectors.',
    icon: ClipboardList,
    color: 'border-blue-200 text-blue-600 bg-blue-50/50'
  },
  {
    id: 4,
    title: 'Hazards',
    desc: 'Identify occupational hazards, classify categories, and describe potential consequences.',
    icon: ShieldAlert,
    color: 'border-red-200 text-red-600 bg-red-50/50'
  },
  {
    id: 5,
    title: 'Risk Scoring',
    desc: 'Evaluate raw risks using Kinney method coords: Likelihood x Exposure x Severity = Initial Score.',
    icon: Flame,
    color: 'border-red-200 text-red-600 bg-red-50/50'
  },
  {
    id: 6,
    title: 'Controls',
    desc: 'Apply controls matching the HSE hierarchy: Elimination, Substitution, Engineering, Admin, PPE.',
    icon: Wrench,
    color: 'border-brand-200 text-brand-600 bg-brand-50/50'
  },
  {
    id: 7,
    title: 'Residual Risk',
    desc: 'Recalculate hazard score based on applied control effectiveness. Map onto 5x5 matrix cells.',
    icon: ShieldCheck,
    color: 'border-brand-200 text-brand-600 bg-brand-50/50'
  },
  {
    id: 8,
    title: 'Actions',
    desc: 'Track and assign corrective tasks for high-risk hazards with priority levels and due dates.',
    icon: CheckSquare,
    color: 'border-orange-200 text-orange-600 bg-orange-50/50'
  },
  {
    id: 9,
    title: 'Review',
    desc: 'Conduct annual audit cycles, verify edge protect controls, and submit inspector logs.',
    icon: FileClock,
    color: 'border-purple-200 text-purple-600 bg-purple-50/50'
  },
  {
    id: 10,
    title: 'Publish',
    desc: 'Approve and sign off on assessments, setting active status to Published.',
    icon: CheckCircle2,
    color: 'border-success-200 text-success-600 bg-success-50/50'
  },
  {
    id: 11,
    title: 'Version History',
    desc: 'Store comparative records. Track version increments (v1.0 -> v2.0) and baseline shifts.',
    icon: History,
    color: 'border-success-200 text-success-600 bg-success-50/50'
  },
  {
    id: 12,
    title: 'Archive',
    desc: 'Move completed audits to safety archives for compliance storage. Restore anytime.',
    icon: Archive,
    color: 'border-slate-200 text-slate-500 bg-slate-50'
  }
];
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans flex items-center gap-2">
          <GitBranch class="w-6 h-6 text-brand-500" />
          <span>RI&E Lifecycle Workflow</span>
        </h1>
        <p class="text-xs text-slate-500 mt-1">A Whimsical/Miro style interactive flowchart mapping out the complete corporate risk evaluation lifecycle.</p>
      </div>
    </div>

    <!-- Miro Board Canvas -->
    <div class="bg-slate-50 border border-slate-200 rounded-3xl p-8 relative overflow-hidden shadow-inner min-h-[500px]">
      <!-- Background Dot Grid -->
      <div class="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>

      <!-- Diagram Layout -->
      <div class="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 max-w-6xl mx-auto">
        <!-- Loop process steps -->
        <div
          v-for="(step, idx) in steps"
          :key="step.id"
          class="relative flex flex-col justify-between bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group hover:-translate-y-1 z-10"
          :class="step.color"
        >
          <!-- SVG Connector arrows for Desktop (shows for all but last items) -->
          <div
            v-if="idx < steps.length - 1 && (idx + 1) % 4 !== 0"
            class="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-0.5 border-t-2 border-dashed border-slate-300 z-0 pointer-events-none"
          >
            <!-- Tiny arrowhead -->
            <div class="absolute -right-1.5 -top-[3px] border-l-4 border-l-slate-400 border-y-4 border-y-transparent"></div>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <!-- Step indicator badge -->
              <span class="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 font-extrabold text-[10px] text-slate-500 flex items-center justify-center">
                {{ step.id }}
              </span>
              <!-- Render mapped icon -->
              <component :is="step.icon" class="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h4 class="font-extrabold text-slate-800 text-sm tracking-tight">{{ step.title }}</h4>
              <p class="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-semibold">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
