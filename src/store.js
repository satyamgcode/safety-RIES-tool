import { reactive, ref, watch } from 'vue';
import { generateMockData, calculateKinneyScore, getKinneyRiskLevel } from './mockData';

const rawData = generateMockData();

export const store = reactive({
  // Simplified Routing State (Exactly the 6 pages)
  currentPage: 'overview',
  currentParams: {},

  // Reactive Data
  projects: rawData.projects,
  assessments: rawData.assessments,
  hazards: rawData.hazards,
  actions: rawData.actions,
  reviews: rawData.reviews,
  templates: rawData.templates,
  archive: rawData.archive,

  // Selected state for the flow
  selectedProjectId: 'all', // Default selected project for the "Project RI&E List"
  selectedAssessmentId: 1, // Default selected assessment for review/comparison
  lastAssessmentListPage: 'project-list', // Keeps track of where the user came from: 'project-list' or 'assessments'
  lastHazardSource: 'register', // Keeps track of where the user came from: 'register' or 'assessment-details'

  // Settings Configuration
  settings: {
    companyName: 'Apex Industrial Holdings',
    riskMethod: 'Finekin-Kinney',
    notifications: {
      emailOnOverdue: true,
      slackOnCriticalRisk: true,
      weeklySummary: false
    },
    riskThresholds: {
      low: 20,
      medium: 70,
      high: 200,
      critical: 320
    }
  },

  // Toast Notifications
  toasts: [],

  // Step wizard temporary state (simplified to a clean multi-step experience)
  wizard: {
    step: 1,
    info: {
      projectId: 1,
      title: '',
      area: '',
      method: 'Finekin-Kinney',
      assessor: 'John Doe',
      reviewDate: '',
      description: ''
    },
    hazards: []
  },

  // --- TOAST ACTIONS ---
  addToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 4000);
  },

  // --- DATA MUTATING ACTIONS FOR REGISTRY ---
  updateActionStatus(actionId, status, progress) {
    const act = this.actions.find(a => a.id === actionId);
    if (!act) return;
    
    act.status = status;
    act.progress = progress;
    act.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 10);
    
    const haz = this.hazards.find(h => h.id === act.hazardId);
    if (haz) {
      const openActions = this.actions.filter(a => a.hazardId === haz.id && a.status !== 'Completed').length;
      haz.openActionsCount = openActions;
    }

    this.addToast(`Action "${act.title}" updated to ${status}.`, 'success');
  },

  addControlToHazard(hazardId, control) {
    const haz = this.hazards.find(h => h.id === hazardId);
    if (!haz) return;

    if (!haz.controls) {
      haz.controls = [];
    }

    const nextId = haz.controls.length + 1;
    haz.controls.push({
      id: nextId,
      ...control
    });

    const factor = control.type === 'Elimination' ? 0.1 : (control.type === 'Engineering' ? 0.4 : 0.7);
    haz.residualLikelihood = Math.max(1, Math.round(haz.residualLikelihood * factor));
    haz.residualExposure = Math.max(1, Math.round(haz.residualExposure * factor));
    haz.residualRiskScore = calculateKinneyScore(haz.residualLikelihood, haz.residualExposure, haz.residualSeverity);
    
    this.addToast(`New ${control.type} control applied. Residual risk score updated to ${haz.residualRiskScore}.`, 'success');
  },

  addActionToHazard(hazardId, action) {
    const haz = this.hazards.find(h => h.id === hazardId);
    if (!haz) return;

    const nextId = Math.max(...this.actions.map(a => a.id)) + 1;
    const newAct = {
      id: nextId,
      actionId: `ACT-${String(nextId).padStart(4, '0')}`,
      title: action.title,
      description: action.description || '',
      hazardId: haz.id,
      hazardName: haz.name,
      hazardUid: haz.hazardId,
      assessmentId: haz.assessmentId,
      assessmentName: haz.assessmentName,
      projectId: haz.projectId,
      projectName: haz.projectName,
      assignedTo: action.assignedTo,
      priority: action.priority,
      dueDate: action.dueDate,
      status: 'Open',
      progress: 0,
      comments: [],
      attachments: [],
      timeline: [
        { date: new Date().toISOString().replace('T', ' ').substring(0, 16), text: "Action created by user." }
      ]
    };

    this.actions.push(newAct);

    // Recalculate open actions count on the hazard
    const hazActions = this.actions.filter(act => act.hazardId === haz.id);
    const openHazActions = hazActions.filter(act => act.status !== "Completed");
    haz.openActionsCount = openHazActions.length;

    // Recalculate open actions count on the assessment & project
    const ass = this.assessments.find(a => a.id === haz.assessmentId);
    if (ass) {
      const assActions = this.actions.filter(act => act.assessmentId === ass.id && act.status !== "Completed");
      ass.openActionsCount = assActions.length;
    }
    const p = this.projects.find(proj => proj.id === haz.projectId);
    if (p) {
      const pActions = this.actions.filter(act => act.projectId === p.id && act.status !== "Completed");
      p.openActionsCount = pActions.length;
    }

    this.addToast(`Action "${newAct.title}" successfully spawned.`, 'success');
  },

  addActionComment(actionId, text, author) {
    const act = this.actions.find(a => a.id === actionId);
    if (!act) return;
    if (!act.comments) {
      act.comments = [];
    }
    act.comments.push({
      author: author || 'User',
      date: new Date().toISOString().replace('T', ' ').substring(0, 10),
      text: text
    });
    this.addToast('Comment added successfully.', 'success');
  },

  deleteControlFromHazard(hazardId, controlId) {
    const haz = this.hazards.find(h => h.id === hazardId);
    if (!haz || !haz.controls) return;
    haz.controls = haz.controls.filter(c => c.id !== controlId);

    // Recalculate residual risk score
    let factor = 1.0;
    haz.controls.forEach(ctrl => {
      const f = ctrl.type === 'Elimination' ? 0.1 : (ctrl.type === 'Engineering' ? 0.4 : 0.7);
      factor = factor * f;
    });
    haz.residualLikelihood = Math.max(1, Math.round(haz.likelihood * factor));
    haz.residualExposure = Math.max(1, Math.round(haz.exposure * factor));
    haz.residualRiskScore = calculateKinneyScore(haz.residualLikelihood, haz.residualExposure, haz.residualSeverity);

    this.addToast('Control removed. Residual risk score updated.', 'success');
  },

  // --- ROUTING ACTIONS ---
  navigateTo(page, params = {}) {
    this.currentPage = page;
    this.currentParams = params;
    
    // Set default selection IDs if passed
    if (params.projectId) {
      this.selectedProjectId = params.projectId;
    }
    if (params.assessmentId) {
      this.selectedAssessmentId = params.assessmentId;
    }

    if (page === 'project-list') {
      this.lastAssessmentListPage = 'project-list';
    } else if (page === 'assessments' && !params.assessmentId) {
      this.lastAssessmentListPage = 'assessments';
    }

    if (page === 'hazards' && !params.hazardId) {
      this.lastHazardSource = 'register';
    } else if (page === 'assessments' && params.assessmentId) {
      this.lastHazardSource = 'assessment-details';
    }

    let hash = `#/${page}`;
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  syncRouteFromHash() {
    const hash = window.location.hash || '#/overview';
    const page = hash.replace(/^#\//, '') || 'overview';
    // Fallback if not valid page
    const validPages = [
      'overview', 'dashboard', 'projects', 'assessments', 'hazards', 
      'project-list', 'new-assessment', 'review', 'compare', 'guide',
      'create-assessment', 'actions', 'review-queue', 'version-comparison',
      'archive', 'settings', 'reports', 'templates', 'risk-matrix', 'workflow'
    ];
    this.currentPage = validPages.includes(page) ? page : 'overview';

    if (this.currentPage === 'project-list') {
      this.lastAssessmentListPage = 'project-list';
    } else if (this.currentPage === 'assessments' && !this.currentParams?.assessmentId) {
      this.lastAssessmentListPage = 'assessments';
    }

    if (this.currentPage === 'hazards' && !this.currentParams?.hazardId) {
      this.lastHazardSource = 'register';
    } else if (this.currentPage === 'assessments' && this.currentParams?.assessmentId) {
      this.lastHazardSource = 'assessment-details';
    }
  },

  // --- DATA MUTATIONS FOR FLOW ---
  
  // 1. Wizard Publishing
  publishWizardAssessment() {
    const pId = parseInt(this.wizard.info.projectId, 10);
    const project = this.projects.find(p => p.id === pId);
    if (!project) return;

    const getControlFactor = (type) => {
      if (type === 'Elimination') return 0.1;
      if (type === 'Substitution') return 0.2;
      if (type === 'Engineering') return 0.4;
      if (type === 'Administrative') return 0.6;
      if (type === 'PPE') return 0.8;
      return 0.4;
    };

    const calculatedHazards = this.wizard.hazards.map(h => {
      const initialScore = calculateKinneyScore(h.likelihood || 3, h.exposure || 6, h.severity || 15);
      const ctrl = h.controls && h.controls[0] ? h.controls[0] : { type: 'Engineering', description: '' };
      const factor = getControlFactor(ctrl.type);
      const residualLikelihood = Math.max(1, Math.round((h.likelihood || 3) * factor));
      const residualExposure = Math.max(1, Math.round((h.exposure || 6) * factor));
      const residualSeverity = h.severity || 15;
      const residualScore = calculateKinneyScore(residualLikelihood, residualExposure, residualSeverity);

      return {
        initialScore,
        residualLikelihood,
        residualExposure,
        residualSeverity,
        residualScore,
        controls: [ctrl]
      };
    });

    const maxInitialRisk = calculatedHazards.length > 0 ? Math.max(...calculatedHazards.map(ch => ch.initialScore)) : 0;
    const maxResidualRisk = calculatedHazards.length > 0 ? Math.max(...calculatedHazards.map(ch => ch.residualScore)) : 0;

    const newAssId = Math.max(...this.assessments.map(a => a.id)) + 1;
    const newAss = {
      id: newAssId,
      projectId: pId,
      projectName: project.name,
      title: this.wizard.info.title || 'Untitled Assessment',
      area: this.wizard.info.area || 'General Area',
      status: 'Published',
      version: 'v1.0',
      method: this.wizard.info.method,
      highestInitialRisk: maxInitialRisk,
      highestResidualRisk: maxResidualRisk,
      hazardsCount: this.wizard.hazards.length,
      openActionsCount: 0,
      reviewDate: this.wizard.info.reviewDate || new Date(2027, 0, 1).toISOString().split('T')[0],
      assessor: this.wizard.info.assessor,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 10),
      description: this.wizard.info.description || 'Created via wizard.',
      history: [{
        version: 'v1.0',
        author: this.wizard.info.assessor || 'John Doe',
        date: new Date().toISOString().replace('T', ' ').substring(0, 10),
        comment: 'Initial creation and hazard identification via wizard.'
      }]
    };

    // Add wizard hazards to store
    this.wizard.hazards.forEach((h, idx) => {
      const hId = Math.max(...this.hazards.map(item => item.id)) + 1 + idx;
      const calc = calculatedHazards[idx];
      this.hazards.push({
        id: hId,
        hazardId: `HAZ-${String(hId).padStart(4, '0')}`,
        name: h.name,
        consequence: h.consequence || 'Potential injury',
        category: h.category || 'Safety',
        projectId: pId,
        projectName: project.name,
        assessmentId: newAssId,
        assessmentName: newAss.title,
        location: newAss.area,
        likelihood: h.likelihood || 3,
        exposure: h.exposure || 6,
        severity: h.severity || 15,
        initialRiskScore: calc.initialScore,
        residualLikelihood: calc.residualLikelihood,
        residualExposure: calc.residualExposure,
        residualSeverity: calc.residualSeverity,
        residualRiskScore: calc.residualScore,
        status: 'Mitigated',
        controls: calc.controls,
        owner: newAss.assessor,
        openActionsCount: 0,
        whoIsExposed: 'Site Workers',
        riskTrend: 'Stable'
      });
    });

    this.assessments.push(newAss);
    project.assessmentsCount++;

    // Reset wizard
    this.wizard = {
      step: 1,
      info: { projectId: 1, title: '', area: '', method: 'Finekin-Kinney', assessor: 'John Doe', reviewDate: '', description: '' },
      hazards: []
    };

    this.addToast(`Assessment "${newAss.title}" published successfully.`, 'success');
    this.selectedProjectId = pId;
    this.navigateTo('project-list');
  },

  // 2. Clone Assessment & Start Review
  cloneAndStartReview(assessmentId, reviewerName) {
    const original = this.assessments.find(a => a.id === assessmentId);
    if (!original) return;

    const newId = Math.max(...this.assessments.map(a => a.id)) + 1;
    const cloned = JSON.parse(JSON.stringify(original));
    
    cloned.id = newId;
    cloned.parentId = original.id; // Track parent to archive later
    cloned.status = 'Under Review';
    cloned.version = `v${(parseFloat(original.version.replace('v', ''))).toFixed(1)} (Review)`;
    cloned.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 10);
    cloned.assessor = reviewerName;
    cloned.history = [{
      version: cloned.version,
      author: reviewerName,
      date: cloned.updatedAt,
      comment: `Cloned version generated for audit reviews.`
    }, ...(original.history || [])];

    this.assessments.push(cloned);

    // Copy hazards
    const originalHazards = this.hazards.filter(h => h.assessmentId === original.id);
    originalHazards.forEach((h, idx) => {
      const newHId = Math.max(...this.hazards.map(item => item.id)) + 1;
      const hCloned = JSON.parse(JSON.stringify(h));
      hCloned.id = newHId;
      hCloned.hazardId = `HAZ-${String(newHId).padStart(4, '0')}`;
      hCloned.assessmentId = newId;
      hCloned.assessmentName = cloned.title;
      this.hazards.push(hCloned);
    });

    this.selectedAssessmentId = newId;
    this.addToast(`Cloned "${original.title}" for audit reviews.`, 'success');
  },

  // 3. Publish New Version after Review
  publishReviewedVersion(assessmentId, auditNotes) {
    const ass = this.assessments.find(a => a.id === assessmentId);
    if (!ass) return;

    // Transition state from Under Review to Published
    ass.status = 'Published';
    
    // Set actual new version number e.g. v1.0 (Review) -> v2.0
    const currentVerNum = Math.floor(parseFloat(ass.version.replace('v', '')));
    const nextVer = `v${(currentVerNum + 1.0).toFixed(1)}`;
    const oldVer = ass.version;
    ass.version = nextVer;

    if (!ass.history) {
      ass.history = [];
    }
    ass.history.unshift({
      version: nextVer,
      author: ass.assessor,
      date: new Date().toISOString().replace('T', ' ').substring(0, 10),
      comment: `Upgraded version published. Audit notes: ${auditNotes}`
    });

    // Archive the parent/original version so it doesn't clutter active dashboard
    if (ass.parentId) {
      this.archiveAssessment(ass.parentId);
    }

    this.addToast(`Safety review finished! Version upgraded to ${nextVer}.`, 'success');
    this.navigateTo('compare');
  },

  // 4. Archive Assessment
  archiveAssessment(assessmentId) {
    const idx = this.assessments.findIndex(a => a.id === assessmentId);
    if (idx === -1) return;

    const ass = this.assessments[idx];
    if (!this.archive) {
      this.archive = { assessments: [], versions: [] };
    }
    this.archive.assessments.push({
      id: ass.id,
      title: ass.title,
      projectName: ass.projectName,
      version: ass.version,
      archiver: 'HSE Specialist',
      archivedAt: new Date().toISOString().replace('T', ' ').substring(0, 10)
    });

    this.assessments.splice(idx, 1);
    this.addToast(`Assessment "${ass.title}" archived successfully.`, 'success');
  },

  // 5. Restore Assessment
  restoreAssessment(archiveId) {
    if (!this.archive || !this.archive.assessments) return;
    const idx = this.archive.assessments.findIndex(a => a.id === archiveId);
    if (idx === -1) return;

    const archivedAss = this.archive.assessments[idx];
    this.assessments.push({
      id: archivedAss.id,
      projectId: 1, // mapping default
      projectName: archivedAss.projectName,
      title: archivedAss.title,
      area: 'Restored Area',
      status: 'Published',
      version: archivedAss.version,
      method: 'Finekin-Kinney',
      highestInitialRisk: 120,
      highestResidualRisk: 24,
      hazardsCount: 5,
      openActionsCount: 0,
      reviewDate: new Date(2027, 0, 1).toISOString().split('T')[0],
      assessor: archivedAss.archiver,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 10),
      description: 'Restored from safety archive.'
    });

    this.archive.assessments.splice(idx, 1);
    this.addToast(`Assessment "${archivedAss.title}" restored successfully.`, 'success');
    this.navigateTo('project-list');
  }
});

// Hash sync listener
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    store.syncRouteFromHash();
  });
  store.syncRouteFromHash();
}
export default store;
