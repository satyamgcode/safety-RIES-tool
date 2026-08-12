<script setup>
import { ref, reactive, computed } from 'vue';
import { store } from '../store';
import { X, CheckCircle, AlertTriangle, Play, HelpCircle } from 'lucide-vue-next';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  tra: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'success']);

// Form states
const operatorName = ref('');
const comments = ref('');

const answers = reactive({
  q1: null,
  q2: null,
  q3: null,
  q4: null,
  q5: null,
  q6: null
});

const questions = [
  { id: 'q1', text: 'Do you understand the task steps and related hazards?' },
  { id: 'q2', text: 'Are all specified control measures (guardrails, harnesses, LOTO, vents) in place?' },
  { id: 'q3', text: 'Is your personal protective equipment (PPE) inspected, fitting, and ready?' },
  { id: 'q4', text: 'Are current site conditions (weather, gas levels, illumination) safe?' },
  { id: 'q5', text: 'Is there a designated emergency contact, evacuation path, and rescue plan?' },
  { id: 'q6', text: 'Do you feel fit, alert, and healthy to carry out the work safely?' }
];

// Computed: Check if form is fully answered
const isFormValid = computed(() => {
  return operatorName.value.trim().length > 0 && 
         answers.q1 !== null && 
         answers.q2 !== null && 
         answers.q3 !== null && 
         answers.q4 !== null && 
         answers.q5 !== null && 
         answers.q6 !== null;
});

// Computed: Check if the check yields a Go or No-Go
const computedDecision = computed(() => {
  if (answers.q1 === false || answers.q2 === false || answers.q3 === false || answers.q4 === false || answers.q5 === false || answers.q6 === false) {
    return 'No-Go';
  }
  return 'Go';
});

const resetForm = () => {
  operatorName.value = '';
  comments.value = '';
  answers.q1 = null;
  answers.q2 = null;
  answers.q3 = null;
  answers.q4 = null;
  answers.q5 = null;
  answers.q6 = null;
};

const handleCancel = () => {
  resetForm();
  emit('close');
};

const handleSubmit = () => {
  if (!isFormValid.value) return;

  const result = store.submitLmra({
    traId: props.tra.id,
    by: operatorName.value,
    location: props.tra.location,
    comments: comments.value,
    answers: { ...answers }
  });

  resetForm();
  emit('success', result);
  emit('close');
};

// Autofill Go check for debugging convenience
const handleAutofillGo = () => {
  operatorName.value = 'Operator Crew Lead';
  comments.value = 'All on-site criteria verified. Wind levels light.';
  answers.q1 = true;
  answers.q2 = true;
  answers.q3 = true;
  answers.q4 = true;
  answers.q5 = true;
  answers.q6 = true;
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
  >
    <div
      class="bg-white w-full max-w-2xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div class="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="font-extrabold text-slate-800 text-sm tracking-tight">Perform Last Minute Risk Analysis (LMRA)</h3>
          <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{{ tra.title }}</p>
        </div>
        <button
          @click="handleCancel"
          class="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        
        <!-- Quick autofill & notes -->
        <div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 justify-between">
          <div class="space-y-1">
            <h4 class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <HelpCircle class="w-4 h-4 text-brand-500" />
              <span>On-Site Go / No-Go Safeguard</span>
            </h4>
            <p class="text-[11px] text-slate-500 leading-relaxed font-medium">
              Run this check directly at the work spot before execution. If **any** checkbox is answered **No**, the check yields a **No-Go** and work must halt.
            </p>
          </div>
          <button 
            type="button"
            @click="handleAutofillGo" 
            class="text-[10px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-xl shrink-0 transition-colors"
          >
            Autofill (Go)
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Operator details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessed By (Crew / Lead) <span class="text-red-500">*</span></label>
              <input
                v-model="operatorName"
                type="text"
                placeholder="e.g. Crew B (R. Smit)"
                class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Location (Verified)</label>
              <input
                :value="tra.location"
                type="text"
                class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-400 bg-slate-100 focus:outline-none cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          <!-- Questions checklist -->
          <div class="space-y-3.5 pt-2">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Safety Checklist Questions</label>
            
            <div
              v-for="q in questions"
              :key="q.id"
              class="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors"
            >
              <span class="text-xs font-semibold text-slate-700 leading-relaxed">{{ q.text }}</span>
              
              <!-- Yes/No options -->
              <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-sm">
                <button
                  type="button"
                  @click="answers[q.id] = true"
                  class="px-3 py-1 rounded text-[10px] font-bold transition-all"
                  :class="[
                    answers[q.id] === true
                      ? 'bg-success-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-700'
                  ]"
                >
                  Yes
                </button>
                <button
                  type="button"
                  @click="answers[q.id] = false"
                  class="px-3 py-1 rounded text-[10px] font-bold transition-all"
                  :class="[
                    answers[q.id] === false
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-700'
                  ]"
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <!-- Remarks comments -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments / On-Site notes</label>
            <textarea
              v-model="comments"
              rows="2"
              placeholder="e.g. Wind within limit, grid isolated successfully."
              class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            ></textarea>
          </div>
        </form>
      </div>

      <!-- Footer with decision display -->
      <div class="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <!-- Live decision preview -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Result:</span>
          <span 
            v-if="operatorName.trim().length > 0 && (answers.q1 !== null || answers.q2 !== null || answers.q3 !== null || answers.q4 !== null || answers.q5 !== null || answers.q6 !== null)"
            class="px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider"
            :class="[
              computedDecision === 'Go' ? 'bg-success-50 text-success-700 border-success-200' : 'bg-red-50 text-red-700 border-red-200'
            ]"
          >
            {{ computedDecision }}
          </span>
          <span class="text-xs text-slate-400 font-semibold italic" v-else>Fill checklist...</span>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="handleCancel"
            class="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-xs border border-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleSubmit"
            :disabled="!isFormValid"
            class="font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all text-white"
            :class="[
              isFormValid 
                ? 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/10 cursor-pointer' 
                : 'bg-slate-300 shadow-none cursor-not-allowed'
            ]"
          >
            <Play class="w-3.5 h-3.5 fill-white/10" />
            <span>Submit LMRA Check</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
