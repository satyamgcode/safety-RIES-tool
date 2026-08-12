import { reactive, ref, watch } from 'vue';
import { generateMockData, calculateKinneyScore, getKinneyRiskLevel } from './mockData';

const rawData = generateMockData();

export const store = reactive({
  // Simplified Routing State (Exactly the 6 pages)
  currentPage: 'overview',
  currentParams: {},

  // Reactive Data
  standardHCodes: [
    { code: 'H220', type: 'Physical', label: 'Extremely flammable gas' },
    { code: 'H222', type: 'Physical', label: 'Extremely flammable aerosol' },
    { code: 'H224', type: 'Physical', label: 'Extremely flammable liquid and vapour' },
    { code: 'H225', type: 'Physical', label: 'Highly flammable liquid and vapour' },
    { code: 'H226', type: 'Physical', label: 'Flammable liquid and vapour' },
    { code: 'H228', type: 'Physical', label: 'Flammable solid' },
    { code: 'H242', type: 'Physical', label: 'Heating may cause a fire' },
    { code: 'H272', type: 'Physical', label: 'May intensify fire; oxidiser' },
    { code: 'H290', type: 'Physical', label: 'May be corrosive to metals' },
    { code: 'H300', type: 'Health', label: 'Fatal if swallowed' },
    { code: 'H301', type: 'Health', label: 'Toxic if swallowed' },
    { code: 'H302', type: 'Health', label: 'Harmful if swallowed' },
    { code: 'H304', type: 'Health', label: 'May be fatal if swallowed and enters airways' },
    { code: 'H310', type: 'Health', label: 'Fatal in contact with skin' },
    { code: 'H311', type: 'Health', label: 'Toxic in contact with skin' },
    { code: 'H312', type: 'Health', label: 'Harmful in contact with skin' },
    { code: 'H314', type: 'Health', label: 'Causes severe skin burns and eye damage' },
    { code: 'H315', type: 'Health', label: 'Causes skin irritation' },
    { code: 'H317', type: 'Health', label: 'May cause an allergic skin reaction' },
    { code: 'H318', type: 'Health', label: 'Causes serious eye damage' },
    { code: 'H319', type: 'Health', label: 'Causes serious eye irritation' },
    { code: 'H330', type: 'Health', label: 'Fatal if inhaled' },
    { code: 'H331', type: 'Health', label: 'Toxic if inhaled' },
    { code: 'H332', type: 'Health', label: 'Harmful if inhaled' },
    { code: 'H334', type: 'Health', label: 'May cause allergy or asthma symptoms or breathing difficulties if inhaled' },
    { code: 'H335', type: 'Health', label: 'May cause respiratory irritation' },
    { code: 'H336', type: 'Health', label: 'May cause drowsiness or dizziness' },
    { code: 'H340', type: 'Health', label: 'May cause genetic defects' },
    { code: 'H350', type: 'Health', label: 'May cause cancer' },
    { code: 'H351', type: 'Health', label: 'Suspected of causing cancer' },
    { code: 'H360', type: 'Health', label: 'May damage fertility or the unborn child' },
    { code: 'H370', type: 'Health', label: 'Causes damage to organs' },
    { code: 'H372', type: 'Health', label: 'Causes damage to organs through prolonged or repeated exposure' },
    { code: 'H373', type: 'Health', label: 'May cause damage to organs through prolonged or repeated exposure' },
    { code: 'H400', type: 'Environmental', label: 'Very toxic to aquatic life' },
    { code: 'H410', type: 'Environmental', label: 'Very toxic to aquatic life with long lasting effects' },
    { code: 'H411', type: 'Environmental', label: 'Toxic to aquatic life with long lasting effects' },
    { code: 'H412', type: 'Environmental', label: 'Harmful to aquatic life with long lasting effects' }
  ],
  projects: rawData.projects,
  assessments: rawData.assessments,
  hazards: rawData.hazards,
  actions: [
    ...rawData.actions,
    {
      id: 9001,
      actionId: "ACT-9001",
      title: "Set up safety nets under roof zone B",
      description: "Rig fall protection nets below the structural propping sector to intercept falling objects or personnel.",
      hazardId: 1001,
      hazardName: "Working at height",
      projectId: 1,
      projectName: "Harbour Expansion Project",
      traId: 1,
      assignedTo: "M. de Vries",
      priority: "High",
      dueDate: "2026-08-15",
      progress: 0,
      status: "Open",
      history: [
        { date: "2026-07-29 11:30", text: "Action created from TRA: Install roof anchor line — zone B." }
      ]
    },
    {
      id: 9002,
      actionId: "ACT-9002",
      title: "Confirm LOTO keys and tags are locked in box",
      description: "Ensure the lockout padlocks are applied to valve reactor release line V-12 and keys are placed in the custody box.",
      hazardId: 2001,
      hazardName: "Dermal contact with sulfuric acid",
      projectId: 4,
      projectName: "Chemical Plant Maintenance Shutdown",
      traId: 2,
      assignedTo: "Amir Patel",
      priority: "High",
      dueDate: "2026-07-31",
      progress: 40,
      status: "In Progress",
      history: [
        { date: "2026-07-29 12:00", text: "Action created from TRA: Reactor Vessel Valve Replacement." }
      ]
    }
  ],
  reviews: rawData.reviews,
  templates: rawData.templates,
  archive: rawData.archive,
  tras: [
    {
      id: 1,
      title: "Install roof anchor line — zone B",
      description: "Work at height to install a permanent anchor line.",
      projectId: 1,
      projectName: "Harbour Expansion Project",
      location: "Roof edge — zone B",
      assessor: "K. Loggix",
      approvedBy: "Toets Veiligheidskunde BV",
      validUntil: "2026-09-30",
      status: "Approved",
      sourceRieId: 1,
      sourceRieName: "Roof & Steel Girder Works",
      steps: [
        {
          id: 1,
          name: "Set up edge protection & access",
          hazards: [
            {
              id: 1001,
              name: "Working at height",
              category: "Safety",
              consequence: "Fall from roof edge",
              sourceHazardId: 1,
              likelihood: 6,
              exposure: 6,
              severity: 15,
              initialRiskScore: 540,
              residualLikelihood: 1,
              residualExposure: 1,
              residualSeverity: 15,
              residualRiskScore: 21,
              controls: [
                { id: 1, type: "Engineering", description: "Perimeter double guardrails and toe-boards", status: "Implemented" },
                { id: 2, type: "PPE", description: "Safety harnesses attached to roof anchor static line", status: "Implemented" }
              ]
            }
          ]
        },
        {
          id: 2,
          name: "Drill & fix anchors",
          hazards: [
            {
              id: 1002,
              name: "Falling tools / objects",
              category: "Safety",
              consequence: "Struck by falling tools below roof",
              sourceHazardId: 4,
              likelihood: 3,
              exposure: 6,
              severity: 7,
              initialRiskScore: 126,
              residualLikelihood: 1,
              residualExposure: 3,
              residualSeverity: 7,
              residualRiskScore: 21,
              controls: [
                { id: 1, type: "Administrative", description: "Establish exclusion safety zone below roof level", status: "Implemented" },
                { id: 2, type: "PPE", description: "Tool lanyards attached to all heavy tools", status: "Implemented" }
              ]
            },
            {
              id: 1003,
              name: "Manual handling of anchor kit",
              category: "Ergonomics",
              consequence: "Back strain from lifting",
              sourceHazardId: 5,
              likelihood: 3,
              exposure: 6,
              severity: 3,
              initialRiskScore: 54,
              residualLikelihood: 1,
              residualExposure: 3,
              residualSeverity: 3,
              residualRiskScore: 9,
              controls: [
                { id: 1, type: "Engineering", description: "Use electric hoist kit to lift anchor materials", status: "Implemented" },
                { id: 2, type: "Administrative", description: "Implement two-person lift team guidelines", status: "Implemented" }
              ]
            }
          ]
        },
        {
          id: 3,
          name: "Load-test & sign off",
          hazards: [
            {
              id: 1004,
              name: "Incomplete fixing – fall risk",
              category: "Safety",
              consequence: "Falls due to anchor failure",
              sourceHazardId: 1,
              likelihood: 3,
              exposure: 3,
              severity: 15,
              initialRiskScore: 135,
              residualLikelihood: 1,
              residualExposure: 1,
              residualSeverity: 15,
              residualRiskScore: 15,
              controls: [
                { id: 1, type: "Administrative", description: "Mandatory mechanical pull-test log check", status: "Implemented" },
                { id: 2, type: "Administrative", description: "Second supervisor sign-off confirmation", status: "Implemented" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 2,
      title: "Reactor Vessel Valve Replacement",
      description: "Isolate reactor vessel lines and replace the main acidic release valve.",
      projectId: 4,
      projectName: "Chemical Plant Maintenance Shutdown",
      location: "Reactor Area - Zone 3",
      assessor: "Amir Patel",
      approvedBy: null,
      validUntil: null,
      status: "Draft",
      sourceRieId: 13,
      sourceRieName: "Reactor Vessel Inspection",
      steps: [
        {
          id: 1,
          name: "Line flushing & Lock-Out Tag-Out (LOTO)",
          hazards: [
            {
              id: 2001,
              name: "Dermal contact with sulfuric acid",
              category: "Chemical",
              consequence: "Severe chemical burns",
              sourceHazardId: 65,
              likelihood: 3,
              exposure: 3,
              severity: 15,
              initialRiskScore: 135,
              residualLikelihood: 1,
              residualExposure: 3,
              residualSeverity: 15,
              residualRiskScore: 45,
              controls: [
                { id: 1, type: "Administrative", description: "Flush reactor line twice, inspect pressure gauges", status: "Implemented" },
                { id: 2, type: "Administrative", description: "Verify LOTO isolation locks and keys", status: "Implemented" },
                { id: 3, type: "PPE", description: "Wear acid-resistant heavy chemical gloves and visor", status: "Implemented" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 3,
      title: "Forklift battery bay replacement",
      description: "Replace heavy lead-acid batteries at the warehouse charging station.",
      projectId: 3,
      projectName: "Warehouse Automation Upgrade",
      location: "Charging station bay A",
      assessor: "Jane Smith",
      approvedBy: null,
      validUntil: null,
      status: "Draft",
      sourceRieId: 9,
      sourceRieName: "AGV Charging Stations",
      steps: [
        {
          id: 1,
          name: "Lifting old battery pack",
          hazards: [
            {
              id: 3001,
              name: "Frequent lifting of heavy warehouse boxes",
              category: "Ergonomics",
              consequence: "Lumbar spine injury",
              sourceHazardId: 59,
              likelihood: 6,
              exposure: 8,
              severity: 7,
              initialRiskScore: 336,
              residualLikelihood: 1,
              residualExposure: 8,
              residualSeverity: 7,
              residualRiskScore: 56,
              controls: [
                { id: 1, type: "Engineering", description: "Use battery hoist crane lift vector", status: "Implemented" },
                { id: 2, type: "Engineering", description: "Hydraulic battery trolley for transit", status: "Implemented" }
              ]
            }
          ]
        }
      ]
    }
  ],
  lmras: [
    {
      id: 1,
      traId: 1,
      decision: "Go",
      by: "Crew B (R. Smit)",
      when: "2026-06-24 07:30",
      location: "Roof edge — zone B",
      comments: "Light wind, within safety limits.",
      answers: { q1: true, q2: true, q3: true, q4: true, q5: true, q6: true }
    },
    {
      id: 2,
      traId: 1,
      decision: "Go",
      by: "M. de Vries",
      when: "2026-06-23 08:00",
      location: "Roof edge — zone B",
      comments: "All clear, guardrails double checked.",
      answers: { q1: true, q2: true, q3: true, q4: true, q5: true, q6: true }
    }
  ],

  // Selected state for the flow
  selectedProjectId: 'all', // Default selected project for the "Project RI&E List"
  selectedAssessmentId: 1, // Default selected assessment for review/comparison
  selectedTraId: 1, // Default selected TRA
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

  // Hazardous Substances State
  selectedSubstanceId: 1,
  substances: [
    {
      id: 1,
      name: "White Spirit",
      manufacturer: "Shell Chemical",
      supplier: "Univar Solutions",
      productCode: "WS-9012",
      casNumber: "64742-82-1",
      site: "Test Project 1",
      location: "Paint Store",
      quantity: 15,
      unit: "L",
      usedFor: "Cleaning and degreasing",
      sds: {
        fileName: "White-Spirit-SDS.pdf",
        version: "3.2",
        issueDate: "2023-04-12",
        revisionDate: "2024-04-12",
        nextReviewDate: "2026-04-12",
        status: "Overdue",
        history: [
          { version: "3.1", fileName: "White-Spirit-SDS-v3.1.pdf", uploadedAt: "2023-04-12", revisionDate: "2023-04-12", hazardChanges: false }
        ]
      },
      hazards: {
        pictograms: ["GHS02", "GHS07", "GHS08", "GHS09"],
        signalWord: "Danger",
        statements: ["H226", "H304", "H315", "H336", "H411"],
        classes: ["Flammable liquids", "Aspiration hazard", "Skin irritation", "STOT SE 3", "Aquatic chronic"]
      },
      storage: { requirements: ["Keep away from ignition", "Keep container closed", "Ventilated area"] },
      exposure: { methods: ["Brush", "Cloth"], routes: ["Skin", "Inhalation", "Eye"] },
      ppe: ["Gloves", "Safety glasses", "Respiratory protection"],
      basicControls: "Use in well-ventilated area. Wear nitrile gloves. Keep away from flames.",
      riskAssessment: {
        status: "Approved",
        hazard: "Vapour inhalation & skin exposure",
        likelihood: 3,
        severity: 3,
        riskScore: 9,
        riskLevel: "Medium",
        existingControls: ["Ventilation", "Gloves", "Safety glasses"],
        additionalControls: ["Use local exhaust ventilation"],
        residualRisk: { likelihood: 2, severity: 3, riskScore: 6, riskLevel: "Medium" },
        approvedBy: "Sarah Jenkins",
        approvedDate: "2024-04-15",
        lastReviewedDate: "2024-04-15",
        nextReviewDate: "2025-04-15"
      },
      status: "Active"
    },
    {
      id: 2,
      name: "Cement CEM I",
      manufacturer: "CEMEX",
      supplier: "Buildbase",
      productCode: "CEM-I-52",
      casNumber: "65997-15-1",
      site: "Test Project 1",
      location: "Materials Yard",
      quantity: 40,
      unit: "bags",
      usedFor: "Concrete mixing and construction",
      sds: {
        fileName: "Cement-CEM-I-SDS.pdf",
        version: "2.0",
        issueDate: "2024-08-20",
        revisionDate: "2025-08-20",
        nextReviewDate: "2026-08-20",
        status: "Due Soon",
        history: [
          { version: "1.0", fileName: "Cement-CEM-I-SDS-v1.0.pdf", uploadedAt: "2024-08-20", revisionDate: "2024-08-20", hazardChanges: false }
        ]
      },
      hazards: {
        pictograms: ["GHS05", "GHS07"],
        signalWord: "Danger",
        statements: ["H315", "H318", "H335"],
        classes: ["Skin irritation", "Serious eye damage", "STOT SE 3"]
      },
      storage: { requirements: ["Keep container closed", "Dry storage"] },
      exposure: { methods: ["Pouring", "Mixing"], routes: ["Skin", "Inhalation", "Eye"] },
      ppe: ["Gloves", "Safety glasses", "Protective clothing", "Respiratory protection"],
      basicControls: "Avoid dust inhalation. Wear dust mask. Wash hands after use.",
      riskAssessment: {
        status: "Approved",
        hazard: "Dust inhalation & eye contact",
        likelihood: 4,
        severity: 3,
        riskScore: 12,
        riskLevel: "Medium",
        existingControls: ["Gloves", "Safety glasses", "Dust mask"],
        additionalControls: ["Wet-mixing where possible"],
        residualRisk: { likelihood: 2, severity: 3, riskScore: 6, riskLevel: "Medium" },
        approvedBy: "Sarah Jenkins",
        approvedDate: "2025-08-22",
        lastReviewedDate: "2025-08-22",
        nextReviewDate: "2026-08-22"
      },
      status: "Active"
    },
    {
      id: 3,
      name: "Diesel",
      manufacturer: "BP",
      supplier: "BP Fuel Solutions",
      productCode: "DSL-100",
      casNumber: "68334-30-5",
      site: "Test Project 1",
      location: "Fuel Store",
      quantity: 1000,
      unit: "L",
      usedFor: "Generators and plant equipment",
      sds: {
        fileName: "Diesel-Fuel-SDS.pdf",
        version: "5.1",
        issueDate: "2024-01-10",
        revisionDate: "2025-01-10",
        nextReviewDate: "2027-01-10",
        status: "Current",
        history: []
      },
      hazards: {
        pictograms: ["GHS02", "GHS08", "GHS09"],
        signalWord: "Warning",
        statements: ["H226", "H351", "H304", "H411"],
        classes: ["Flammable liquids", "Carcinogenicity", "Aspiration hazard", "Aquatic chronic"]
      },
      storage: { requirements: ["Keep away from ignition", "Keep container closed", "Ventilated area", "Bunded storage"] },
      exposure: { methods: ["Pumping", "Refueling"], routes: ["Skin", "Inhalation"] },
      ppe: ["Gloves", "Safety glasses", "Protective clothing"],
      basicControls: "Ensure double-walled storage tank is bunded. Avoid inhalation and contact. Fuel in open air.",
      riskAssessment: {
        status: "Approved",
        hazard: "Spillage & vapour inhalation",
        likelihood: 3,
        severity: 4,
        riskScore: 12,
        riskLevel: "Medium",
        existingControls: ["Bunded tank", "Gloves", "Safety glasses"],
        additionalControls: ["Drip trays during refueling", "Spill kit on-site"],
        residualRisk: { likelihood: 1, severity: 4, riskScore: 4, riskLevel: "Low" },
        approvedBy: "Sarah Jenkins",
        approvedDate: "2025-01-15",
        lastReviewedDate: "2025-01-15",
        nextReviewDate: "2026-01-15"
      },
      status: "Restricted"
    },
    {
      id: 4,
      name: "Bitumen Primer",
      manufacturer: "Soprema",
      supplier: "Soprema Supply",
      productCode: "SOP-BP-20",
      casNumber: "64742-95-6",
      site: "Test Project 1",
      location: "Paint Store",
      quantity: 20,
      unit: "L",
      usedFor: "Surface preparation",
      sds: {
        fileName: "Bitumen-Primer-SDS.pdf",
        version: "3.0",
        issueDate: "2025-10-10",
        revisionDate: "2025-10-10",
        nextReviewDate: "2027-10-10",
        status: "Current",
        history: []
      },
      hazards: {
        pictograms: ["GHS02", "GHS07", "GHS09"],
        signalWord: "Danger",
        statements: ["H226", "H315", "H336"],
        classes: ["Flammable", "Skin irritation", "Other hazards"]
      },
      storage: { requirements: ["Keep away from ignition", "Keep container closed", "Ventilated area"] },
      exposure: { methods: ["Brush", "Roller"], routes: ["Skin", "Inhalation", "Eye"] },
      ppe: ["Gloves", "Safety glasses"],
      basicControls: "Use in ventilated area. Avoid skin contact. Keep away from ignition sources.",
      riskAssessment: {
        status: "Required",
        hazard: "Vapour inhalation",
        likelihood: null,
        severity: null,
        riskScore: null,
        riskLevel: null,
        existingControls: ["Ventilation", "Gloves", "Safety glasses"],
        additionalControls: [],
        residualRisk: { likelihood: null, severity: null, riskScore: null, riskLevel: null }
      },
      status: "Draft"
    }
  ],

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
    if (params.traId) {
      this.selectedTraId = params.traId;
    }
    if (params.substanceId) {
      this.selectedSubstanceId = parseInt(params.substanceId, 10);
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
      'archive', 'settings', 'reports', 'templates', 'risk-matrix', 'workflow',
      'tra-dashboard', 'new-tra', 'tra-details',
      'haz-substances-overview', 'haz-substances-register', 'haz-substances-add', 
      'haz-substances-detail', 'haz-substances-assessment'
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
  },

  // --- TRA BUSINESS LOGIC ---
  createTra(traData) {
    const nextId = this.tras.length > 0 ? Math.max(...this.tras.map(t => t.id)) + 1 : 1;
    const project = this.projects.find(p => p.id === parseInt(traData.projectId, 10));
    const rie = this.assessments.find(a => a.id === parseInt(traData.sourceRieId, 10));
    
    const newTra = {
      id: nextId,
      title: traData.title,
      description: traData.description || '',
      projectId: parseInt(traData.projectId, 10),
      projectName: project ? project.name : 'Unknown Project',
      location: traData.location || '',
      assessor: traData.assessor || 'System',
      approvedBy: null,
      validUntil: null,
      status: 'Draft',
      sourceRieId: rie ? rie.id : null,
      sourceRieName: rie ? rie.title : null,
      steps: []
    };

    if (traData.firstStep) {
      newTra.steps.push({
        id: 1,
        name: traData.firstStep,
        hazards: []
      });
    }

    this.tras.push(newTra);
    this.addToast(`TRA "${newTra.title}" created.`, 'success');
    this.navigateTo('tra-details', { traId: newTra.id });
    return newTra;
  },

  addStepToTra(traId, stepName) {
    const tra = this.tras.find(t => t.id === parseInt(traId, 10));
    if (!tra || tra.status !== 'Draft') return;
    
    const nextStepId = tra.steps.length > 0 ? Math.max(...tra.steps.map(s => s.id)) + 1 : 1;
    tra.steps.push({
      id: nextStepId,
      name: stepName,
      hazards: []
    });
    this.addToast(`Step "${stepName}" added.`, 'success');
  },

  deleteStepFromTra(traId, stepId) {
    const tra = this.tras.find(t => t.id === parseInt(traId, 10));
    if (!tra || tra.status !== 'Draft') return;

    tra.steps = tra.steps.filter(s => s.id !== stepId);
    this.addToast('Step removed.', 'warning');
  },

  addHazardToTraStep(traId, stepId, hazardData) {
    const tra = this.tras.find(t => t.id === parseInt(traId, 10));
    if (!tra || tra.status !== 'Draft') return;

    const step = tra.steps.find(s => s.id === stepId);
    if (!step) return;

    let allHazardIds = [];
    this.tras.forEach(t => {
      t.steps.forEach(s => {
        s.hazards.forEach(h => {
          allHazardIds.push(h.id);
        });
      });
    });
    const nextHazId = allHazardIds.length > 0 ? Math.max(...allHazardIds) + 1 : 1000;

    const likelihood = parseInt(hazardData.likelihood, 10) || 3;
    const exposure = parseInt(hazardData.exposure, 10) || 6;
    const severity = parseInt(hazardData.severity, 10) || 15;
    const initialRiskScore = calculateKinneyScore(likelihood, exposure, severity);

    const resLikelihood = parseInt(hazardData.residualLikelihood, 10) || 1;
    const resExposure = parseInt(hazardData.residualExposure, 10) || 3;
    const resSeverity = parseInt(hazardData.residualSeverity, 10) || severity;
    const residualRiskScore = calculateKinneyScore(resLikelihood, resExposure, resSeverity);

    // If source hazard has controls, pull them in
    let controls = [];
    if (hazardData.controls) {
      controls = JSON.parse(JSON.stringify(hazardData.controls));
    } else if (hazardData.controlMeasures) {
      // If it is a string from manual hazard form
      controls.push({
        id: 1,
        type: 'Engineering',
        description: hazardData.controlMeasures,
        status: 'Implemented'
      });
    }

    const newHaz = {
      id: nextHazId,
      name: hazardData.name,
      category: hazardData.category || 'Safety',
      consequence: hazardData.consequence || '',
      sourceHazardId: hazardData.sourceHazardId ? parseInt(hazardData.sourceHazardId, 10) : null,
      likelihood,
      exposure,
      severity,
      initialRiskScore,
      residualLikelihood: resLikelihood,
      residualExposure: resExposure,
      residualSeverity: resSeverity,
      residualRiskScore,
      controls
    };

    step.hazards.push(newHaz);
    this.addToast(`Hazard "${newHaz.name}" added to step.`, 'success');
  },

  deleteHazardFromTraStep(traId, stepId, hazardId) {
    const tra = this.tras.find(t => t.id === parseInt(traId, 10));
    if (!tra || tra.status !== 'Draft') return;

    const step = tra.steps.find(s => s.id === stepId);
    if (!step) return;

    step.hazards = step.hazards.filter(h => h.id !== hazardId);
    this.addToast('Hazard removed from step.', 'warning');
  },

  recalculateTraHazardRisk(haz) {
    if (!haz.controls) haz.controls = [];
    
    let factor = 1.0;
    haz.controls.forEach(c => {
      const f = c.type === 'Elimination' ? 0.1 : (c.type === 'Substitution' ? 0.2 : (c.type === 'Engineering' ? 0.4 : (c.type === 'Administrative' ? 0.6 : 0.8)));
      factor = factor * f;
    });

    haz.residualLikelihood = Math.max(1, Math.round(haz.likelihood * factor));
    haz.residualExposure = Math.max(1, Math.round(haz.exposure * factor));
    haz.residualSeverity = haz.severity;
    haz.residualRiskScore = calculateKinneyScore(haz.residualLikelihood, haz.residualExposure, haz.residualSeverity);
  },

  addControlToTraHazard(traId, stepId, hazardId, controlData) {
    const tra = this.tras.find(t => t.id === parseInt(traId, 10));
    if (!tra || tra.status !== 'Draft') return;

    const step = tra.steps.find(s => s.id === parseInt(stepId, 10));
    if (!step) return;

    const haz = step.hazards.find(h => h.id === parseInt(hazardId, 10));
    if (!haz) return;

    if (!haz.controls) haz.controls = [];
    
    const nextId = haz.controls.length > 0 ? Math.max(...haz.controls.map(c => c.id)) + 1 : 1;
    haz.controls.push({
      id: nextId,
      type: controlData.type,
      description: controlData.description,
      status: 'Implemented'
    });

    this.recalculateTraHazardRisk(haz);
    this.addToast(`Applied ${controlData.type} control. Residual score is now ${haz.residualRiskScore}.`, 'success');
  },

  deleteControlFromTraHazard(traId, stepId, hazardId, controlId) {
    const tra = this.tras.find(t => t.id === parseInt(traId, 10));
    if (!tra || tra.status !== 'Draft') return;

    const step = tra.steps.find(s => s.id === parseInt(stepId, 10));
    if (!step) return;

    const haz = step.hazards.find(h => h.id === parseInt(hazardId, 10));
    if (!haz) return;

    if (!haz.controls) return;
    haz.controls = haz.controls.filter(c => c.id !== parseInt(controlId, 10));

    this.recalculateTraHazardRisk(haz);
    this.addToast(`Removed control. Residual score is now ${haz.residualRiskScore}.`, 'warning');
  },

  addActionToTraHazard(traId, stepId, hazardId, actionData) {
    const tra = this.tras.find(t => t.id === parseInt(traId, 10));
    if (!tra) return;
    const step = tra.steps.find(s => s.id === parseInt(stepId, 10));
    if (!step) return;
    const haz = step.hazards.find(h => h.id === parseInt(hazardId, 10));
    if (!haz) return;

    const nextId = this.actions.length > 0 ? Math.max(...this.actions.map(a => a.id)) + 1 : 1;
    const newAct = {
      id: nextId,
      actionId: `ACT-${String(nextId).padStart(4, '0')}`,
      title: actionData.title,
      description: actionData.description || 'Corrective action spawned from TRA.',
      hazardId: haz.id,
      hazardName: haz.name,
      projectId: tra.projectId,
      projectName: tra.projectName,
      traId: tra.id,
      assignedTo: actionData.assignedTo,
      priority: actionData.priority || 'Medium',
      dueDate: actionData.dueDate || new Date().toISOString().split('T')[0],
      progress: 0,
      status: 'Open',
      history: [
        { date: new Date().toISOString().replace('T', ' ').substring(0, 16), text: `Action created via TRA: "${tra.title}".` }
      ]
    };

    this.actions.push(newAct);
    this.addToast(`Action "${newAct.title}" assigned to ${newAct.assignedTo}.`, 'success');
    return newAct;
  },

  deleteActionFromTraHazard(actionId) {
    this.actions = this.actions.filter(a => a.id !== parseInt(actionId, 10));
    this.addToast('Action removed.', 'warning');
  },

  approveTra(traId, auditorName) {
    const tra = this.tras.find(t => t.id === parseInt(traId, 10));
    if (!tra || tra.status !== 'Draft') return;

    tra.status = 'Approved';
    tra.approvedBy = auditorName || 'Toets Veiligheidskunde BV';
    const today = new Date();
    today.setMonth(today.getMonth() + 3);
    tra.validUntil = today.toISOString().split('T')[0];

    this.addToast(`TRA "${tra.title}" is now Approved and Valid!`, 'success');
  },

  submitLmra(lmraData) {
    const nextId = this.lmras.length > 0 ? Math.max(...this.lmras.map(l => l.id)) + 1 : 1;
    const hasNoGo = Object.values(lmraData.answers).some(val => val === false);
    const decision = hasNoGo ? 'No-Go' : 'Go';

    const newLmra = {
      id: nextId,
      traId: parseInt(lmraData.traId, 10),
      decision: decision,
      by: lmraData.by || 'Unknown Operator',
      when: new Date().toISOString().replace('T', ' ').substring(0, 16),
      location: lmraData.location || '',
      comments: lmraData.comments || '',
      answers: { ...lmraData.answers }
    };

    this.lmras.push(newLmra);

    if (decision === 'Go') {
      this.addToast('LMRA logged. Crew is cleared for work (GO).', 'success');
    } else {
      this.addToast('LMRA logged. Conditions flagged (NO-GO)!', 'error');
    }
    return newLmra;
  },

  // --- HAZARDOUS SUBSTANCE ACTIONS ---
  addSubstance(substanceData) {
    const nextId = this.substances.length > 0 ? Math.max(...this.substances.map(s => s.id)) + 1 : 1;
    const newSubstance = {
      id: nextId,
      name: substanceData.name,
      manufacturer: substanceData.manufacturer,
      supplier: substanceData.supplier || '',
      productCode: substanceData.productCode || '',
      casNumber: substanceData.casNumber || '',
      site: substanceData.site || 'Test Project 1',
      location: substanceData.location,
      quantity: parseFloat(substanceData.quantity),
      unit: substanceData.unit,
      usedFor: substanceData.usedFor,
      status: 'Draft',
      
      sds: substanceData.sds || {
        fileName: '',
        version: '',
        issueDate: '',
        revisionDate: '',
        nextReviewDate: '',
        status: 'Missing',
        history: []
      },

      hazards: substanceData.hazards || {
        pictograms: [],
        signalWord: '',
        statements: [],
        classes: []
      },

      storage: substanceData.storage || { requirements: [] },
      exposure: substanceData.exposure || { methods: [], routes: [] },
      ppe: substanceData.ppe || [],
      basicControls: substanceData.basicControls || '',

      riskAssessment: substanceData.riskAssessment || {
        status: 'Required',
        hazard: 'Vapour inhalation',
        likelihood: null,
        severity: null,
        riskScore: null,
        riskLevel: null,
        existingControls: substanceData.basicControls ? [substanceData.basicControls] : [],
        additionalControls: [],
        residualRisk: { likelihood: null, severity: null, riskScore: null, riskLevel: null }
      }
    };

    this.substances.push(newSubstance);
    this.addToast(`Substance "${newSubstance.name}" registered successfully.`, 'success');
    return newSubstance;
  },

  updateSubstance(id, substanceData) {
    const sub = this.substances.find(s => s.id === parseInt(id, 10));
    if (!sub) return;

    Object.assign(sub, substanceData);
    this.addToast(`Substance "${sub.name}" updated.`, 'success');
  },

  archiveSubstance(id) {
    const sub = this.substances.find(s => s.id === parseInt(id, 10));
    if (!sub) return;

    sub.status = 'Archived';
    this.addToast(`Substance "${sub.name}" has been archived.`, 'warning');
  },

  uploadNewSds(id, sdsData, hazardChanges) {
    const sub = this.substances.find(s => s.id === parseInt(id, 10));
    if (!sub) return;

    // Preserve old SDS in history
    if (sub.sds.fileName) {
      if (!sub.sds.history) sub.sds.history = [];
      sub.sds.history.push({
        version: sub.sds.version,
        fileName: sub.sds.fileName,
        uploadedAt: new Date().toISOString().split('T')[0],
        revisionDate: sub.sds.revisionDate,
        hazardChanges: !!hazardChanges
      });
    }

    sub.sds.fileName = sdsData.fileName;
    sub.sds.version = sdsData.version;
    sub.sds.issueDate = sdsData.issueDate;
    sub.sds.revisionDate = sdsData.revisionDate;
    sub.sds.nextReviewDate = sdsData.nextReviewDate;
    sub.sds.status = 'Current';

    if (hazardChanges) {
      if (sdsData.hazards) {
        sub.hazards = sdsData.hazards;
      }
      sub.riskAssessment.status = 'Review Required';
      this.addToast(`SDS updated. Hazards changed: Risk assessment marked as Review Required.`, 'warning');
    } else {
      this.addToast(`New SDS version ${sdsData.version} uploaded successfully.`, 'success');
    }
  },

  approveRiskAssessment(id, assessmentData) {
    const sub = this.substances.find(s => s.id === parseInt(id, 10));
    if (!sub) return;

    sub.riskAssessment.status = 'Approved';
    sub.riskAssessment.hazard = assessmentData.hazard || 'Vapour inhalation';
    sub.riskAssessment.likelihood = assessmentData.likelihood;
    sub.riskAssessment.severity = assessmentData.severity;
    sub.riskAssessment.riskScore = assessmentData.riskScore;
    sub.riskAssessment.riskLevel = assessmentData.riskLevel;
    sub.riskAssessment.existingControls = assessmentData.existingControls || [];
    sub.riskAssessment.additionalControls = assessmentData.additionalControls || [];
    
    sub.riskAssessment.residualRisk = {
      likelihood: assessmentData.residualLikelihood,
      severity: assessmentData.residualSeverity,
      riskScore: assessmentData.residualRiskScore,
      riskLevel: assessmentData.residualRiskLevel
    };

    const today = new Date();
    sub.riskAssessment.lastReviewedDate = today.toISOString().split('T')[0];
    
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    sub.riskAssessment.nextReviewDate = nextYear.toISOString().split('T')[0];

    sub.status = 'Active';
    this.addToast(`Risk assessment approved. Substance "${sub.name}" is now Active.`, 'success');
  },

  updateSdsStatus(id, newStatus) {
    const sub = this.substances.find(s => s.id === parseInt(id, 10));
    if (!sub) return;

    sub.sds.status = newStatus;
    this.addToast(`Simulated SDS status for "${sub.name}" updated to ${newStatus}.`, 'info');
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
