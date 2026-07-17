<script setup>
import { ref } from 'vue';
import { store } from '../store';
import { Settings, Save, ShieldAlert, Bell, Building } from 'lucide-vue-next';

// Local form bindings copied from store
const companyName = ref(store.settings.companyName);
const defaultMethod = ref(store.settings.riskMethod);
const emailNotification = ref(store.settings.notifications.emailOnOverdue);
const slackNotification = ref(store.settings.notifications.slackOnCriticalRisk);
const summaryNotification = ref(store.settings.notifications.weeklySummary);

const lowThreshold = ref(store.settings.riskThresholds.low);
const mediumThreshold = ref(store.settings.riskThresholds.medium);
const highThreshold = ref(store.settings.riskThresholds.high);
const criticalThreshold = ref(store.settings.riskThresholds.critical);

const saveSettings = () => {
  store.settings.companyName = companyName.value;
  store.settings.riskMethod = defaultMethod.value;
  store.settings.notifications.emailOnOverdue = emailNotification.value;
  store.settings.notifications.slackOnCriticalRisk = slackNotification.value;
  store.settings.notifications.weeklySummary = summaryNotification.value;

  store.settings.riskThresholds.low = lowThreshold.value;
  store.settings.riskThresholds.medium = mediumThreshold.value;
  store.settings.riskThresholds.high = highThreshold.value;
  store.settings.riskThresholds.critical = criticalThreshold.value;

  store.addToast('System settings saved successfully.', 'success');
};
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">System Settings</h1>
        <p class="text-xs text-slate-500 mt-1">Configure company profiles, default risk scoring thresholds, and automatic notification integrations.</p>
      </div>
      <button
        @click="saveSettings"
        class="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/10 flex items-center gap-2 transition-all duration-150 hover:scale-102"
      >
        <Save class="w-4 h-4" />
        <span>Save Configuration</span>
      </button>
    </div>

    <!-- Forms Layout (Two columns) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column: Company & Notifications -->
      <div class="space-y-6">
        <!-- Company Profile -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Building class="w-4.5 h-4.5 text-brand-500" /> Organization Profile</h3>
          
          <div class="space-y-3">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Company Name</label>
              <input
                v-model="companyName"
                type="text"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-slate-50 focus:bg-white"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Default Evaluation Formula</label>
              <select
                v-model="defaultMethod"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
              >
                <option value="Finekin-Kinney">Finekin-Kinney (L x E x S)</option>
                <option value="5x5 Risk Matrix">5x5 Risk Matrix (L x S)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Notification settings -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Bell class="w-4.5 h-4.5 text-brand-500" /> Notifications & webhooks</h3>
          
          <div class="space-y-3 text-xs">
            <div class="flex items-start gap-3 p-2.5 rounded-xl border border-slate-50 hover:bg-slate-50/50 transition-colors">
              <input
                type="checkbox"
                id="chk-notif-email"
                v-model="emailNotification"
                class="w-4.5 h-4.5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer mt-0.5"
              />
              <label for="chk-notif-email" class="font-bold text-slate-700 cursor-pointer select-none">
                Email notification on overdue reviews
                <span class="block text-[9px] text-slate-400 font-semibold mt-0.5">Send alerts automatically to the assigned project manager.</span>
              </label>
            </div>

            <div class="flex items-start gap-3 p-2.5 rounded-xl border border-slate-50 hover:bg-slate-50/50 transition-colors">
              <input
                type="checkbox"
                id="chk-notif-slack"
                v-model="slackNotification"
                class="w-4.5 h-4.5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer mt-0.5"
              />
              <label for="chk-notif-slack" class="font-bold text-slate-700 cursor-pointer select-none">
                Slack alert on critical risk identified
                <span class="block text-[9px] text-slate-400 font-semibold mt-0.5">Post an instant warning in the safety channel if a Kinney score exceeding 320 is logged.</span>
              </label>
            </div>

            <div class="flex items-start gap-3 p-2.5 rounded-xl border border-slate-50 hover:bg-slate-50/50 transition-colors">
              <input
                type="checkbox"
                id="chk-notif-summary"
                v-model="summaryNotification"
                class="w-4.5 h-4.5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer mt-0.5"
              />
              <label for="chk-notif-summary" class="font-bold text-slate-700 cursor-pointer select-none">
                Weekly digest summary compilation
                <span class="block text-[9px] text-slate-400 font-semibold mt-0.5">Deliver a safety digest of resolved action logs every Friday morning.</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Risk Thresholds -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><ShieldAlert class="w-4.5 h-4.5 text-brand-500" /> Risk Evaluation Thresholds</h3>
        <p class="text-xs text-slate-400">Configure Kinney score ranges for automatic classification. Levels color-code hazard listings throughout reports.</p>

        <div class="space-y-4 text-xs font-semibold text-slate-600">
          <div class="grid grid-cols-2 gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="text-xs font-bold text-success-700">Low Risk Limit</span>
            <input
              v-model.number="lowThreshold"
              type="number"
              class="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-right bg-white"
            />
          </div>

          <div class="grid grid-cols-2 gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="text-xs font-bold text-yellow-700">Medium Risk Limit</span>
            <input
              v-model.number="mediumThreshold"
              type="number"
              class="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-right bg-white"
            />
          </div>

          <div class="grid grid-cols-2 gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="text-xs font-bold text-warning-700">High Risk Limit</span>
            <input
              v-model.number="highThreshold"
              type="number"
              class="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-right bg-white"
            />
          </div>

          <div class="grid grid-cols-2 gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="text-xs font-bold text-red-700">Critical Risk Limit</span>
            <input
              v-model.number="criticalThreshold"
              type="number"
              class="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-right bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
