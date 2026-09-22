<script setup>
import { ref } from 'vue';
import { store } from '../store';
import { X, UploadCloud, FileText, CheckCircle2, ShieldCheck } from 'lucide-vue-next';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  companyId: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['close']);

const title = ref('');
const category = ref('Insurance');
const validUntil = ref(new Date(2027, 0, 1).toISOString().split('T')[0]);
const selectedFileName = ref('');

const categories = [
  'Insurance',
  'Legal Registration',
  'Safety Certification',
  'Compliance',
  'HSE Protocol',
  'Tax & Financial'
];

const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFileName.value = file.name;
    if (!title.value) {
      title.value = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
    }
  }
};

const submitDocument = () => {
  if (!title.value) {
    store.addToast('Please enter a document title.', 'error');
    return;
  }

  store.addCompanyDocument({
    companyId: props.companyId,
    title: title.value,
    category: category.value,
    fileName: selectedFileName.value || `${title.value.replace(/\s+/g, '_')}.pdf`,
    validUntil: validUntil.value
  });

  // Reset form
  title.value = '';
  category.value = 'Insurance';
  selectedFileName.value = '';
  emit('close');
};
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
  >
    <div
      class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
            <ShieldCheck class="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-800">Upload Compliance Document</h3>
            <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Corporate Verification Vault</span>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Body -->
      <div class="p-6 space-y-4">
        <!-- Document Title -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Document Title <span class="text-red-500">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="e.g. Corporate Liability Insurance Policy (AVB)"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <!-- Category & Valid Until Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              v-model="category"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Valid Until
            </label>
            <input
              v-model="validUntil"
              type="date"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <!-- Drag & Drop Upload Zone -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            File Attachment (PDF, JPG, PNG)
          </label>
          <label
            class="border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
          >
            <input type="file" @change="handleFileSelect" class="hidden" accept=".pdf,.doc,.docx,.png,.jpg" />
            <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
              <UploadCloud class="w-5 h-5" />
            </div>
            <span class="text-xs font-bold text-slate-700" v-if="selectedFileName">
              Selected: {{ selectedFileName }}
            </span>
            <template v-else>
              <span class="text-xs font-bold text-slate-700">Click to choose or drag & drop</span>
              <span class="text-[11px] text-slate-400 mt-0.5">Maximum file size 25MB</span>
            </template>
          </label>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          @click="emit('close')"
          class="px-4 py-2 border border-slate-200 hover:bg-white text-slate-600 font-semibold text-xs rounded-xl transition-colors"
        >
          Cancel
        </button>

        <button
          @click="submitDocument"
          class="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all hover:scale-102"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>Upload & Verify</span>
        </button>
      </div>
    </div>
  </div>
</template>
