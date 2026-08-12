<script setup>
import { ref, computed } from 'vue';
import { store } from '../store';
import { ArrowLeft, Info, HelpCircle } from 'lucide-vue-next';

// Form state
const title = ref('');
const description = ref('');
const location = ref('');
const assessor = ref('HSE Officer');
const sourceRieId = ref('');
const firstStep = ref('Preparation & set-up');

// Get all published RIE assessments for the source RIE dropdown
const availableRies = computed(() => {
  return store.assessments.filter(a => a.status === 'Published');
});

// For selecting a project (linked to source RIE selection or standalone)
const selectedProjectId = ref('1'); // Default to Project 1

// Dynamic update of project and location when source RIE is chosen
const handleSourceRieChange = () => {
  if (sourceRieId.value) {
    const selectedRie = store.assessments.find(a => a.id === parseInt(sourceRieId.value, 10));
    if (selectedRie) {
      selectedProjectId.value = selectedRie.projectId;
      location.value = selectedRie.area;
      if (!title.value) {
        title.value = `${selectedRie.title} Task`;
      }
    }
  }
};

const handleCancel = () => {
  store.navigateTo('tra-dashboard');
};

const handleSubmit = () => {
  if (!title.value.trim()) {
    store.addToast('Please enter a TRA title.', 'error');
    return;
  }

  const newTra = store.createTra({
    title: title.value,
    description: description.value,
    projectId: selectedProjectId.value,
    location: location.value,
    assessor: assessor.value,
    sourceRieId: sourceRieId.value,
    firstStep: firstStep.value
  });
};
</script>

<template>
  <div class="space-y-6 pb-16 max-w-6xl mx-auto font-sans">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-3 border-b border-slate-100 pb-4">
      <button
        @click="handleCancel"
        class="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
      </button>
      <div>
        <h1 class="text-xl font-extrabold text-slate-800 tracking-tight">New TRA</h1>
        <p class="text-xs text-slate-400">Create a Task Risk Analysis for specialized safety audits.</p>
      </div>
    </div>

    <!-- Dual Column Layout: Form and Guide -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      <!-- Form Column -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div>
          <h2 class="text-base font-bold text-slate-800">Scope of this task analysis</h2>
          <p class="text-xs text-slate-400 mt-0.5">Describe the task and (optionally) link the RI&E it sits under. Next, you'll add steps and pull in hazards.</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Title Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">TRA title <span class="text-red-500">*</span></label>
            <input
              v-model="title"
              type="text"
              placeholder="e.g. Install roof anchor line — zone B"
              class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>

          <!-- Description Textarea -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Task description</label>
            <textarea
              v-model="description"
              rows="3"
              placeholder="What is being done?"
              class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            ></textarea>
          </div>

          <!-- Location and Assessor Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Location / work area</label>
              <input
                v-model="location"
                type="text"
                placeholder="e.g. Roof edge — zone B"
                class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessor</label>
              <input
                v-model="assessor"
                type="text"
                placeholder="Name or department"
                class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <!-- Source RI&E and First Step Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Source RIE selection -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>Source RI&E (optional)</span>
                <HelpCircle class="w-3 h-3 text-slate-400" title="Connect this TRA to a parent RIE to inherit hazard guidelines" />
              </label>
              <select
                v-model="sourceRieId"
                @change="handleSourceRieChange"
                class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">— none —</option>
                <option v-for="rie in availableRies" :key="rie.id" :value="rie.id">
                  {{ rie.projectName }} • {{ rie.title }} ({{ rie.version }})
                </option>
              </select>
            </div>

            <!-- First Step title -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">First step</label>
              <input
                v-model="firstStep"
                type="text"
                placeholder="e.g. Preparation & set-up"
                class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <!-- Standalone project dropdown (only visible if no Source RIE is selected) -->
          <div class="space-y-1.5" v-if="!sourceRieId">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Project site</label>
            <select
              v-model="selectedProjectId"
              class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option v-for="p in store.projects" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-4 border-t border-slate-100 justify-end">
            <button
              type="button"
              @click="handleCancel"
              class="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-xs border border-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-brand-500/10 flex items-center gap-1.5 transition-all"
            >
              <span>Create TRA & add hazards →</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Instruction / Guide Column -->
      <div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 space-y-4">
        <h3 class="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
          <Info class="w-4 h-4 text-brand-500" />
          <span>How a TRA works</span>
        </h3>

        <ul class="space-y-3.5 text-xs text-slate-600">
          <li class="flex gap-2">
            <span class="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">1</span>
            <span>Create the TRA shell and break the task down into sequential execution steps.</span>
          </li>
          <li class="flex gap-2">
            <span class="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">2</span>
            <span>For each step, **pull hazards from the parent RI&E** or create custom task-specific ones, calculating Kinney risk scores.</span>
          </li>
          <li class="flex gap-2">
            <span class="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">3</span>
            <span>Approve the analysis – this **freezes the TRA** to prevent editing and stamps it with a 3-month validation date.</span>
          </li>
          <li class="flex gap-2">
            <span class="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">4</span>
            <span>Crews perform an on-site **LMRA (Last Minute Risk Analysis)** checklist against the approved TRA before every shift start.</span>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>
