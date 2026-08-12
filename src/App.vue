<script setup>
import { computed } from 'vue';
import { store } from './store';

// Import Layout Components
import Sidebar from './components/Sidebar.vue';

// Import Core and Detailed Pages
import RieOverview from './pages/RieOverview.vue';
import ProjectRieList from './pages/ProjectRieList.vue';
import HazardRegister from './pages/HazardRegister.vue';
import NewAssessment from './pages/NewAssessment.vue';
import StartReview from './pages/StartReview.vue';
import CompareVersions from './pages/CompareVersions.vue';
import WorkflowGuide from './pages/WorkflowGuide.vue';

import Dashboard from './pages/Dashboard.vue';
import ProjectList from './pages/ProjectList.vue';
import ProjectDetails from './pages/ProjectDetails.vue';
import AssessmentList from './pages/AssessmentList.vue';
import AssessmentDetails from './pages/AssessmentDetails.vue';
import CreateAssessment from './pages/CreateAssessment.vue';
import ActionTracker from './pages/ActionTracker.vue';
import ReviewQueue from './pages/ReviewQueue.vue';
import VersionComparison from './pages/VersionComparison.vue';
import Archive from './pages/Archive.vue';
import Settings from './pages/Settings.vue';
import Reports from './pages/Reports.vue';
import Templates from './pages/Templates.vue';
import RiskMatrixPage from './pages/RiskMatrixPage.vue';
import Workflow from './pages/Workflow.vue';
import HazardDetails from './pages/HazardDetails.vue';

// Import TRA Pages
import TraDashboard from './pages/TraDashboard.vue';
import NewTra from './pages/NewTra.vue';
import TraDetails from './pages/TraDetails.vue';

// Import Hazardous Substances Pages
import HazSubstancesOverview from './pages/HazSubstancesOverview.vue';
import HazSubstancesRegister from './pages/HazSubstancesRegister.vue';
import HazSubstancesAddWizard from './pages/HazSubstancesAddWizard.vue';
import HazSubstancesDetail from './pages/HazSubstancesDetail.vue';
import HazSubstancesRiskAssessment from './pages/HazSubstancesRiskAssessment.vue';

const activeComponent = computed(() => {
  const page = store.currentPage;
  const params = store.currentParams;

  if (page === 'overview') return RieOverview;
  if (page === 'dashboard') return Dashboard;
  
  if (page === 'projects') {
    return params.projectId ? ProjectDetails : ProjectList;
  }
  if (page === 'assessments') {
    return params.assessmentId ? AssessmentDetails : AssessmentList;
  }
  if (page === 'hazards') {
    return params.hazardId ? HazardDetails : HazardRegister;
  }

  if (page === 'project-list') return ProjectRieList;
  if (page === 'new-assessment') return NewAssessment;
  if (page === 'review') return StartReview;
  if (page === 'compare') return CompareVersions;
  if (page === 'guide') return WorkflowGuide;
  
  if (page === 'create-assessment') return CreateAssessment;
  if (page === 'actions') return ActionTracker;
  if (page === 'review-queue') return ReviewQueue;
  if (page === 'version-comparison') return VersionComparison;
  
  if (page === 'archive') return Archive;
  if (page === 'settings') return Settings;
  if (page === 'reports') return Reports;
  if (page === 'templates') return Templates;
  if (page === 'risk-matrix') return RiskMatrixPage;
  if (page === 'workflow') return Workflow;

  // TRA pages mapping
  if (page === 'tra-dashboard') return TraDashboard;
  if (page === 'new-tra') return NewTra;
  if (page === 'tra-details') return TraDetails;

  // Hazardous Substances pages mapping
  if (page === 'haz-substances-overview') return HazSubstancesOverview;
  if (page === 'haz-substances-register') return HazSubstancesRegister;
  if (page === 'haz-substances-add') return HazSubstancesAddWizard;
  if (page === 'haz-substances-detail') return HazSubstancesDetail;
  if (page === 'haz-substances-assessment') return HazSubstancesRiskAssessment;

  return RieOverview;
});
</script>

<template>
  <div class="min-h-screen flex bg-slate-50/50 antialiased font-sans">
    <!-- Sidebar Left Navigation (6 Items) -->
    <Sidebar />

    <!-- Main Workspace Container -->
    <main class="flex-1 h-screen overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-10">
      <!-- Transition wrapper for fluid navigation feel -->
      <transition name="fade" mode="out-in">
        <component :is="activeComponent" />
      </transition>
    </main>

    <!-- Global Toast Alert Overlays (Top-Right viewport) -->
    <div class="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <transition-group name="toast-anim">
        <div
          v-for="toast in store.toasts"
          :key="toast.id"
          class="pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold bg-white/95 backdrop-blur-md"
          :class="[
            toast.type === 'success' ? 'border-success-100 text-success-800 bg-success-50/95 shadow-success-500/5' : '',
            toast.type === 'warning' ? 'border-warning-100 text-warning-800 bg-warning-50/95 shadow-warning-500/5' : '',
            toast.type === 'error' ? 'border-red-100 text-red-800 bg-red-50/95 shadow-red-500/5' : '',
          ]"
        >
          <span class="leading-relaxed">{{ toast.message }}</span>
          <button
            @click="store.toasts = store.toasts.filter(t => t.id !== toast.id)"
            class="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<style>
/* Page transition fades */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Toast transition slide-ins */
.toast-anim-enter-active {
  animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.toast-anim-leave-active {
  animation: toastOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes toastIn {
  from { transform: translateY(-20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes toastOut {
  from { transform: translateY(0) scale(1); opacity: 1; }
  to { transform: translateY(-10px) scale(0.95); opacity: 0; }
}
</style>
