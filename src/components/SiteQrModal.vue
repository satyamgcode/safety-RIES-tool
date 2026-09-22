<script setup>
import {
  X,
  Printer,
  QrCode,
  MapPin,
  Phone,
  HardHat,
  Eye,
  ShieldAlert,
  CheckCircle2,
  Download
} from 'lucide-vue-next';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  project: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const printBadge = () => {
  window.print();
};
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
  >
    <div
      class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
            <QrCode class="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-800">Site Induction & Check-In Pass</h3>
            <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Digital Site Access Gate</span>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Printable Card Content -->
      <div class="p-6 overflow-y-auto space-y-6 text-center" id="printable-site-badge">
        <div class="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-xs">
          <!-- SVG QR Code Visual Representation -->
          <svg class="w-44 h-44 mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="white" />
            <!-- Corners -->
            <rect x="10" y="10" width="24" height="24" rx="3" fill="#0284c7" />
            <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
            <rect x="18" y="18" width="8" height="8" fill="#0284c7" />

            <rect x="66" y="10" width="24" height="24" rx="3" fill="#0284c7" />
            <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
            <rect x="74" y="18" width="8" height="8" fill="#0284c7" />

            <rect x="10" y="66" width="24" height="24" rx="3" fill="#0284c7" />
            <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
            <rect x="18" y="74" width="8" height="8" fill="#0284c7" />

            <!-- Pattern dots -->
            <rect x="42" y="12" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="52" y="12" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="42" y="24" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="52" y="28" width="6" height="6" rx="1" fill="#0f172a" />
            
            <rect x="12" y="42" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="22" y="46" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="32" y="42" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="42" y="42" width="16" height="16" rx="2" fill="#0284c7" />
            <rect x="64" y="42" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="74" y="46" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="84" y="42" width="6" height="6" rx="1" fill="#0f172a" />

            <rect x="42" y="66" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="52" y="72" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="42" y="82" width="6" height="6" rx="1" fill="#0f172a" />
            <rect x="66" y="66" width="10" height="6" rx="1" fill="#0f172a" />
            <rect x="80" y="74" width="8" height="8" rx="1" fill="#0f172a" />
            <rect x="68" y="84" width="12" height="6" rx="1" fill="#0f172a" />
          </svg>
          <span class="block text-[11px] font-bold text-slate-500 mt-2">Scan for Mobile Site Check-In</span>
        </div>

        <div>
          <h2 class="text-lg font-black text-slate-800 tracking-tight">{{ project.name }}</h2>
          <p class="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5">
            <MapPin class="w-3.5 h-3.5 text-slate-400" />
            {{ project.location }}
          </p>
        </div>

        <!-- Emergency & Safety Instructions -->
        <div class="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-semibold">Emergency Assembly Point:</span>
            <span class="font-extrabold text-slate-800">Muster Point Alpha (Main Gate)</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-semibold">Site Safety Officer:</span>
            <span class="font-extrabold text-slate-800">{{ project.manager }} (+31 6 1234 5678)</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-semibold">Mandatory Site Induction:</span>
            <span class="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              <CheckCircle2 class="w-3 h-3" /> Required for all personnel
            </span>
          </div>
        </div>

        <!-- Mandatory PPE Badges -->
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mandatory Site PPE</span>
          <div class="flex items-center justify-center gap-2 flex-wrap">
            <span class="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
              ⛑️ Safety Helmet
            </span>
            <span class="px-2.5 py-1 bg-yellow-50 text-yellow-800 rounded-lg text-xs font-bold border border-yellow-200">
              🦺 High-Vis Vest (Class 2)
            </span>
            <span class="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg text-xs font-bold border border-blue-200">
              🥾 S3 Safety Boots
            </span>
            <span class="px-2.5 py-1 bg-purple-50 text-purple-800 rounded-lg text-xs font-bold border border-purple-200">
              👓 Safety Glasses
            </span>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          @click="emit('close')"
          class="px-4 py-2 border border-slate-200 hover:bg-white text-slate-600 font-semibold text-xs rounded-xl transition-colors"
        >
          Close
        </button>

        <button
          @click="printBadge"
          class="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all hover:scale-102"
        >
          <Printer class="w-4 h-4" />
          <span>Print Induction Poster</span>
        </button>
      </div>
    </div>
  </div>
</template>
