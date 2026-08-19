<script setup>
import { ref, computed, onMounted } from 'vue';
import { store } from '../store';
import { 
  Link2, 
  FileImage, 
  Copy, 
  Check, 
  Download, 
  RotateCcw, 
  Trash2, 
  HelpCircle, 
  Info, 
  AlertCircle, 
  ExternalLink,
  ClipboardCheck,
  History,
  Image as ImageIcon
} from 'lucide-vue-next';

// State variables
const imageUrl = ref('');
const isPending = ref(false);
const errorMsg = ref('');
const base64Output = ref('');
const mimeType = ref('');
const imageDimensions = ref({ width: 0, height: 0 });
const fileSize = ref(0);
const includePrefix = ref(true);
const useProxyFallback = ref(true);
const copied = ref(false);
const showS3Guide = ref(false);
const conversionHistory = ref([]);

// Load history on mount
onMounted(() => {
  try {
    const saved = localStorage.getItem('hse_image_base64_history');
    if (saved) {
      conversionHistory.value = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load history', e);
  }
});

// Save history helper
const saveHistory = () => {
  try {
    localStorage.setItem('hse_image_base64_history', JSON.stringify(conversionHistory.value));
  } catch (e) {
    console.error('Failed to save history', e);
  }
};

// Clear history
const clearHistory = () => {
  conversionHistory.value = [];
  saveHistory();
  store.addToast('Conversion history cleared.', 'warning');
};

// Remove single history item
const deleteHistoryItem = (index) => {
  conversionHistory.value.splice(index, 1);
  saveHistory();
};

// Load item from history
const loadFromHistory = (item) => {
  imageUrl.value = item.url;
  base64Output.value = item.base64;
  mimeType.value = item.mimeType;
  fileSize.value = item.fileSize;
  imageDimensions.value = item.dimensions;
  errorMsg.value = '';
  store.addToast('Loaded conversion from history.', 'success');
};

// Extract file size in human-readable format
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate URL format
const isValidUrl = computed(() => {
  if (!imageUrl.value) return false;
  try {
    new URL(imageUrl.value);
    return true;
  } catch (_) {
    return false;
  }
});

// Computed Base64 Output with prefix option
const finalBase64 = computed(() => {
  if (!base64Output.value) return '';
  if (includePrefix.value) {
    return `data:${mimeType.value};base64,${base64Output.value}`;
  }
  return base64Output.value;
});

// Convert URL to base64
const convertImage = async () => {
  if (!isValidUrl.value) {
    errorMsg.value = 'Please enter a valid URL (starting with http:// or https://)';
    return;
  }

  isPending.value = true;
  errorMsg.value = '';
  base64Output.value = '';
  mimeType.value = '';
  imageDimensions.value = { width: 0, height: 0 };
  fileSize.value = 0;

  let urlToFetch = imageUrl.value;
  let usedProxy = false;

  try {
    // Attempt direct fetch first
    let response;
    try {
      response = await fetch(urlToFetch, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (directError) {
      // Fallback to CORS proxy if enabled
      if (useProxyFallback.value) {
        usedProxy = true;
        // Use allorigins proxy to bypass CORS
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl.value)}`;
        response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error('CORS Proxy also failed to retrieve the image.');
        }
      } else {
        throw new Error('Direct request blocked by CORS policy. Enable "Use CORS proxy as fallback" or verify CORS settings on your S3 bucket.');
      }
    }

    const blob = await response.blob();
    mimeType.value = blob.type || 'image/png';
    fileSize.value = blob.size;

    // Convert blob to base64
    const reader = new FileReader();
    const resultPromise = new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
    });

    reader.readAsDataURL(blob);
    const base64Data = await resultPromise;
    base64Output.value = base64Data;

    // Load into temporary image to extract dimensions
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        imageDimensions.value = { width: img.naturalWidth, height: img.naturalHeight };
        resolve();
      };
      img.onerror = () => {
        // Safe fallback if dimension check fails
        imageDimensions.value = { width: 0, height: 0 };
        resolve();
      };
      img.src = `data:${mimeType.value};base64,${base64Data}`;
    });

    // Add to history
    const filename = imageUrl.value.substring(imageUrl.value.lastIndexOf('/') + 1).split('?')[0] || 'aws-image';
    const historyItem = {
      id: Date.now(),
      name: filename,
      url: imageUrl.value,
      base64: base64Data,
      mimeType: mimeType.value,
      fileSize: blob.size,
      dimensions: { ...imageDimensions.value },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      usedProxy
    };

    // Remove duplicates of same URL to keep history clean
    conversionHistory.value = [historyItem, ...conversionHistory.value.filter(item => item.url !== imageUrl.value)].slice(0, 8);
    saveHistory();

    store.addToast('Image successfully converted to Base64!', 'success');
  } catch (err) {
    console.error(err);
    errorMsg.value = err.message || 'An error occurred while fetching or converting the image.';
    store.addToast('Conversion failed. Check console or URL.', 'error');
  } finally {
    isPending.value = false;
  }
};

// Copy base64 string to clipboard
const copyToClipboard = async () => {
  if (!finalBase64.value) return;
  try {
    await navigator.clipboard.writeText(finalBase64.value);
    copied.value = true;
    store.addToast('Base64 string copied to clipboard!', 'success');
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    store.addToast('Failed to copy to clipboard.', 'error');
  }
};

// Download base64 as a .txt file
const downloadBase64 = () => {
  if (!finalBase64.value) return;
  try {
    const filename = imageUrl.value.substring(imageUrl.value.lastIndexOf('/') + 1).split('?')[0] || 'image';
    const textFilename = `${filename.split('.')[0] || 'aws-image'}-base64.txt`;
    const blob = new Blob([finalBase64.value], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = textFilename;
    link.click();
    URL.revokeObjectURL(link.href);
    store.addToast('Base64 text file downloaded!', 'success');
  } catch (err) {
    store.addToast('Download failed.', 'error');
  }
};

// Reset form
const clearAll = () => {
  imageUrl.value = '';
  base64Output.value = '';
  mimeType.value = '';
  imageDimensions.value = { width: 0, height: 0 };
  fileSize.value = 0;
  errorMsg.value = '';
};
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-800 font-sans">AWS Image to Base64 Converter</h1>
        <p class="text-sm text-slate-500 mt-1">
          Paste any public AWS S3 bucket image URL to decode it into a Base64 string for direct inline embedding.
        </p>
      </div>
      <button 
        @click="showS3Guide = !showS3Guide"
        class="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600 cursor-pointer text-left"
      >
        <HelpCircle class="w-4.5 h-4.5 text-slate-500" />
        S3 CORS Setup Guide
      </button>
    </div>

    <!-- S3 CORS Guide (Collapsible) -->
    <transition name="fade">
      <div v-if="showS3Guide" class="bg-brand-50/50 border border-brand-100 rounded-2xl p-5 md:p-6 space-y-4">
        <div class="flex items-start gap-3">
          <Info class="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <h3 class="font-semibold text-slate-800 text-sm md:text-base">Why direct fetch might fail (CORS)</h3>
            <p class="text-xs md:text-sm text-slate-600 mt-1">
              AWS S3 buckets reject cross-origin requests by default. If your S3 bucket does not have CORS enabled, client browsers block direct fetches. To fix this, configure the CORS policy in your AWS Console.
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="font-bold text-xs text-slate-700 uppercase tracking-wider">Recommended S3 CORS Configuration (JSON)</h4>
          <pre class="bg-slate-900 text-slate-200 text-[11px] md:text-xs font-mono p-4 rounded-xl overflow-x-auto shadow-inner">
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": [],
        "MaxAgeSeconds": 3000
    }
]</pre>
        </div>
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-brand-700 bg-white/70 px-3.5 py-2.5 rounded-lg border border-brand-100 gap-2">
          <span>Need help? Configure CORS in: AWS Console > S3 Bucket > Permissions > Cross-origin resource sharing (CORS)</span>
          <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/ManageCorsUsing.html" target="_blank" class="flex items-center gap-1 font-bold hover:underline shrink-0">
            AWS Docs <ExternalLink class="w-3 h-3" />
          </a>
        </div>
      </div>
    </transition>

    <!-- Main Workspace -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Input Panel -->
      <div class="lg:col-span-7 space-y-6">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <Link2 class="w-5 h-5 text-brand-500" />
            Image Source & Options
          </h2>

          <!-- URL Input -->
          <div class="space-y-2">
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">AWS S3 Image URL</label>
            <div class="relative">
              <input 
                v-model="imageUrl"
                type="text" 
                placeholder="https://your-bucket-name.s3.amazonaws.com/image.jpg..."
                class="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
                :disabled="isPending"
                @keyup.enter="convertImage"
              />
              <button 
                v-if="imageUrl" 
                @click="clearAll"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Clear input"
              >
                <RotateCcw class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[11px] text-slate-400">Supports PNG, JPG, GIF, WEBP, SVG, and SVG-XML images.</p>
          </div>

          <!-- Configuration Toggles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <!-- Toggle: include prefix -->
            <label class="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 cursor-pointer transition-colors bg-slate-50/30">
              <input 
                v-model="includePrefix"
                type="checkbox" 
                class="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <span class="block text-sm font-semibold text-slate-700">Include Data URI Prefix</span>
                <span class="block text-[11px] text-slate-400 mt-0.5">Prepends <code class="bg-slate-100 px-1 rounded text-[10px]">data:image/...;base64,</code></span>
              </div>
            </label>

            <!-- Toggle: Proxy fallback -->
            <label class="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 cursor-pointer transition-colors bg-slate-50/30">
              <input 
                v-model="useProxyFallback"
                type="checkbox" 
                class="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <span class="block text-sm font-semibold text-slate-700">CORS Proxy Fallback</span>
                <span class="block text-[11px] text-slate-400 mt-0.5">Proxy fetches if AWS blocks direct request</span>
              </div>
            </label>
          </div>

          <!-- Convert Button & Status -->
          <div class="flex items-center gap-4 pt-3 border-t border-slate-50">
            <button 
              @click="convertImage"
              :disabled="isPending || !imageUrl"
              class="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-brand-500/10 cursor-pointer"
            >
              <FileImage v-if="!isPending" class="w-4 h-4" />
              <svg v-else class="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isPending ? 'Processing Image...' : 'Convert to Base64' }}
            </button>

            <button 
              v-if="base64Output || errorMsg"
              @click="clearAll"
              class="px-4 py-3 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-medium rounded-xl text-sm transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>

          <!-- Error Alert -->
          <div v-if="errorMsg" class="bg-red-50 border border-red-100 text-red-800 text-xs md:text-sm p-4 rounded-xl flex gap-3">
            <AlertCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div class="space-y-1">
              <span class="font-semibold block">Failed to convert image</span>
              <p class="leading-relaxed">{{ errorMsg }}</p>
            </div>
          </div>
        </div>

        <!-- Output Result Panel -->
        <div v-if="base64Output" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider">Base64 Output</h3>
            <span class="text-xs text-slate-400 font-semibold">{{ formatSize(fileSize) }} string</span>
          </div>

          <div class="relative">
            <textarea
              readonly
              :value="finalBase64"
              rows="8"
              class="w-full font-mono text-[11px] md:text-xs bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 select-all"
            ></textarea>
            
            <div class="absolute bottom-4 right-4 flex items-center gap-2">
              <button 
                @click="copyToClipboard"
                class="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
              >
                <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" :class="copied ? 'text-success-400' : ''" />
                {{ copied ? 'Copied' : 'Copy Output' }}
              </button>
              
              <button 
                @click="downloadBase64"
                class="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer animate-none"
                title="Download as Text File"
              >
                <Download class="w-3.5 h-3.5 text-slate-500" />
                Download TXT
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Info/Preview Sidebar Panel -->
      <div class="lg:col-span-5 space-y-6">
        <!-- Live Preview Card -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <ImageIcon class="w-4.5 h-4.5 text-brand-500" />
            Image Preview
          </h3>
          
          <div class="border-2 border-dashed border-slate-200 rounded-xl min-h-[220px] flex flex-col items-center justify-center bg-slate-50/50 p-4 relative overflow-hidden">
            <!-- Success Preview -->
            <template v-if="base64Output">
              <img 
                :src="`data:${mimeType};base64,${base64Output}`" 
                alt="Uploaded AWS Source Image"
                class="max-h-[300px] w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200"
              />
              
              <!-- Floating Overlay Stats -->
              <div class="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur text-white text-[10px] px-3 py-2 rounded-lg flex items-center justify-between font-mono">
                <span>{{ imageDimensions.width }} x {{ imageDimensions.height }} px</span>
                <span>{{ mimeType }}</span>
              </div>
            </template>

            <!-- Loading Placeholder -->
            <div v-else-if="isPending" class="flex flex-col items-center text-slate-400 gap-2">
              <div class="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-500 animate-spin"></div>
              <span class="text-xs font-medium">Fetching AWS resource...</span>
            </div>

            <!-- Empty Placeholder -->
            <div v-else class="flex flex-col items-center text-slate-400 text-center gap-2 py-8">
              <FileImage class="w-10 h-10 text-slate-300 stroke-[1.5]" />
              <div>
                <span class="block text-xs font-semibold text-slate-500">No Image Loaded</span>
                <span class="block text-[11px] text-slate-400 max-w-[200px] mt-0.5 mx-auto">
                  Paste a URL and click convert to load the preview.
                </span>
              </div>
            </div>
          </div>

          <!-- Metadata Properties Table -->
          <div v-if="base64Output" class="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs space-y-2">
            <div class="flex justify-between border-b border-slate-200 pb-2">
              <span class="font-medium text-slate-500">MIME Type:</span>
              <span class="font-mono text-slate-800 font-bold text-right">{{ mimeType }}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200 pb-2">
              <span class="font-medium text-slate-500">Resolution:</span>
              <span class="font-mono text-slate-800 font-bold text-right">{{ imageDimensions.width }} × {{ imageDimensions.height }} px</span>
            </div>
            <div class="flex justify-between border-b border-slate-200 pb-2">
              <span class="font-medium text-slate-500">Data Size:</span>
              <span class="font-mono text-slate-800 font-bold text-right">{{ formatSize(fileSize) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium text-slate-500">String Length:</span>
              <span class="font-mono text-slate-800 font-bold text-right">{{ finalBase64.length.toLocaleString() }} chars</span>
            </div>
          </div>
        </div>

        <!-- Recent Conversion History -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <History class="w-4.5 h-4.5 text-brand-500" />
              Recent Converts
            </h3>
            <button 
              v-if="conversionHistory.length > 0" 
              @click="clearHistory"
              class="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <!-- Empty History -->
          <div v-if="conversionHistory.length === 0" class="text-center py-6 border border-dashed border-slate-100 rounded-xl">
            <span class="text-xs text-slate-400 block">History log is empty.</span>
          </div>

          <!-- History items -->
          <div v-else class="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            <div 
              v-for="(item, idx) in conversionHistory" 
              :key="item.id"
              class="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/10 transition-all cursor-pointer"
              @click="loadFromHistory(item)"
            >
              <div class="min-w-0 flex-1 pr-3">
                <span class="block text-xs font-semibold text-slate-700 truncate group-hover:text-brand-600 transition-colors">{{ item.name }}</span>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] text-slate-400 font-medium">{{ item.timestamp }}</span>
                  <span class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">{{ formatSize(item.fileSize) }}</span>
                  <span v-if="item.usedProxy" class="text-[9px] bg-amber-50 border border-amber-100 text-amber-700 px-1 rounded font-bold">Proxied</span>
                </div>
              </div>
              
              <button 
                @click.stop="deleteHistoryItem(idx)"
                class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Delete history item"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles matching standard pages transition */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
