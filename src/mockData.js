// HSEHub - RI&E Management Mock Data Generator
// Programmatically generates: 10 Projects, 35 Assessments, 240 Hazards, 500 Actions, 80 Reviews.
// Fully interconnected and realistic for Health, Safety, and Environment management.

// Kinney Risk Score calculation: Likelihood (0.1 to 10) * Exposure (0.5 to 10) * Severity (1 to 100)
export function calculateKinneyScore(l, e, s) {
  return Math.round(l * e * s);
}

export function getKinneyRiskLevel(score) {
  if (score < 20) return { name: 'Low', color: 'text-success-700 bg-success-50 border-success-200' };
  if (score < 70) return { name: 'Medium', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
  if (score < 150) return { name: 'High', color: 'text-warning-700 bg-warning-50 border-warning-200' };
  if (score < 320) return { name: 'Very High', color: 'text-red-700 bg-red-50 border-red-200' };
  return { name: 'Critical', color: 'text-purple-700 bg-purple-50 border-purple-200' };
}

// 5x5 Matrix risk mapping (Likelihood 1-5, Severity 1-5)
export function getMatrixRiskLevel(likelihood, severity) {
  const score = likelihood * severity;
  if (score <= 4) return { name: 'Low', score, color: 'text-success-700 bg-success-50 border-success-200', cellColor: 'bg-green-500' };
  if (score <= 9) return { name: 'Medium', score, color: 'text-yellow-700 bg-yellow-50 border-yellow-200', cellColor: 'bg-yellow-500' };
  if (score <= 16) return { name: 'High', score, color: 'text-warning-700 bg-warning-50 border-warning-200', cellColor: 'bg-orange-500' };
  return { name: 'Critical', score, color: 'text-red-700 bg-red-50 border-red-200', cellColor: 'bg-red-500' };
}

// Sample values for generator
const managers = ["Sarah Jenkins", "Markus Vance", "David Chen", "Elena Rostova", "Amir Patel"];
const assessors = ["John Doe", "Jane Smith", "Bob Jones", "Alice Williams", "Carlos Santana", "Maya Lin", "Thomas Wright", "Rachel Green"];
const clients = ["Port Authority", "Global Tech Corp", "Logistics Hub Inc", "Apex Chemicals", "PowerGrid Corp", "AutoMfg Solutions", "CoolingTech Ltd", "Tank Cleaning Services Co", "Skyrise Maintenance Group", "BioLab Solutions"];
const locations = ["Rotterdam Port - Quay 4", "Amsterdam HQ - Block B", "Munich Warehouse Center", "Ludwigshafen Chemical Park", "Stuttgart Grid Station", "Gothenburg Plant A", "Dublin Data Center", "Antwerp Depot Tank 12", "London Office - Floor 24", "Boston Research Biotech lab"];

const projectNames = [
  "Harbour Expansion Project",
  "Office Relocation & Fit-out",
  "Warehouse Automation Upgrade",
  "Chemical Plant Maintenance Shutdown",
  "Electrical Grid Overhaul Phase 2",
  "Automotive Assembly Line Retrofit",
  "Data Center Cooling Installation",
  "Confined Space Tank Cleaning Campaign",
  "High-Rise Glass Replacement",
  "Laboratory Bio-Safety Setup"
];

const categories = ["Safety", "Ergonomics", "Chemical", "Biological", "Physical", "Electrical", "Psychosocial"];

const hazardLibrary = {
  "Safety": [
    { name: "Working at Height on Scaffolding", consequence: "Fall leading to fractures or fatality", likelihood: 3, exposure: 6, severity: 15 },
    { name: "Slipping hazard due to wet surface", consequence: "Minor injuries, bruises, or sprains", likelihood: 6, exposure: 3, severity: 3 },
    { name: "Struck by moving forklift in aisles", consequence: "Severe crushing injuries or death", likelihood: 2, exposure: 6, severity: 40 },
    { name: "Falling debris from upper decks", consequence: "Head injuries, concussions", likelihood: 3, exposure: 3, severity: 15 },
    { name: "Manual handling of heavy metal flanges", consequence: "Back strain, musculoskeletal disorders", likelihood: 6, exposure: 6, severity: 7 },
    { name: "Entanglement in rotating machinery", consequence: "Amputation, severe lacerations", likelihood: 2, exposure: 6, severity: 40 }
  ],
  "Ergonomics": [
    { name: "Prolonged screen time at non-adjustable desks", consequence: "Repetitive strain injury (RSI), eye strain", likelihood: 6, exposure: 10, severity: 3 },
    { name: "Frequent lifting of heavy warehouse boxes", consequence: "Lumbar spine injury, chronic back pain", likelihood: 6, exposure: 8, severity: 7 },
    { name: "Awkward posture during wiring assembly", consequence: "Neck and shoulder fatigue", likelihood: 6, exposure: 6, severity: 3 },
    { name: "Repetitive sorting of high-speed parcel belt", consequence: "Wrist tendonitis, fatigue", likelihood: 6, exposure: 8, severity: 3 }
  ],
  "Chemical": [
    { name: "Inhalation of toxic benzene vapors", consequence: "Carcinogenic risk, acute poisoning, lung damage", likelihood: 2, exposure: 6, severity: 40 },
    { name: "Dermal contact with corrosive sulfuric acid", consequence: "Severe chemical burns, skin scarring", likelihood: 3, exposure: 3, severity: 15 },
    { name: "Inhalation of dust during concrete cutting", consequence: "Silicosis, long term lung impairment", likelihood: 6, exposure: 6, severity: 15 },
    { name: "Flammable solvent storage near ignition source", consequence: "Explosion, thermal burns, facility damage", likelihood: 1, exposure: 3, severity: 100 }
  ],
  "Biological": [
    { name: "Exposure to aerosolized pathogen in biosafety hood", consequence: "Infection, severe respiratory illness", likelihood: 2, exposure: 6, severity: 15 },
    { name: "Contact with contaminated waste water in sump", consequence: "Gastrointestinal illness, Weil's disease", likelihood: 3, exposure: 3, severity: 7 },
    { name: "Legionella growth in cooling tower system", consequence: "Outbreak of Legionnaires' disease (fatal pneumonia)", likelihood: 2, exposure: 6, severity: 40 }
  ],
  "Physical": [
    { name: "Excessive noise in compressor room (>85dB)", consequence: "Noise-induced hearing loss, tinnitus", likelihood: 6, exposure: 10, severity: 7 },
    { name: "Hand-arm vibration from pneumatic drill", consequence: "Vibration white finger, nerve damage", likelihood: 6, exposure: 6, severity: 7 },
    { name: "Heat stress in boiler room operations", consequence: "Heat exhaustion, heat stroke, collapse", likelihood: 3, exposure: 6, severity: 15 }
  ],
  "Electrical": [
    { name: "Contact with exposed live conductors in panel", consequence: "Electric shock, electrocution, cardiac arrest", likelihood: 2, exposure: 3, severity: 100 },
    { name: "Overloaded extension sockets in server room", consequence: "Electrical fire, smoke inhalation", likelihood: 3, exposure: 6, severity: 15 },
    { name: "Flashover during high-voltage switching", consequence: "Severe arc flash burns, blast injury", likelihood: 1, exposure: 2, severity: 100 }
  ],
  "Psychosocial": [
    { name: "High workload and tight project deadlines", consequence: "Burnout, stress-related illness, fatigue", likelihood: 6, exposure: 8, severity: 3 },
    { name: "Lone working in isolated electrical substation", consequence: "Lack of immediate assistance in emergency", likelihood: 3, exposure: 3, severity: 15 }
  ]
};

// Generates baseline mock data collections
export function generateMockData() {
  const projects = [];
  const assessments = [];
  const hazards = [];
  const actions = [];
  const reviews = [];
  
  // 1. Generate 10 Projects
  for (let i = 0; i < 10; i++) {
    projects.push({
      id: i + 1,
      name: projectNames[i],
      client: clients[i],
      location: locations[i],
      status: i === 8 ? "On Hold" : (i === 9 ? "Planning" : (i % 3 === 0 ? "Completed" : "Active")),
      manager: managers[i % managers.length],
      assessmentsCount: 0,
      openActionsCount: 0,
      highestRiskScore: 0,
      reviewDueDate: new Date(2026, 8 + i, 15).toISOString().split('T')[0],
      description: `Comprehensive risk assessment and hazard mitigation project for the ${projectNames[i]} located at ${locations[i]} for our client ${clients[i]}. Managed under HSE standards.`,
      startDate: new Date(2026, 0, 10).toISOString().split('T')[0],
      endDate: new Date(2026, 11, 20).toISOString().split('T')[0]
    });
  }

  // 2. Distribute exactly 35 Assessments across projects
  // Projects 0-4 get 4 assessments (20). Projects 5-9 get 3 assessments (15). Total = 35.
  const assessmentNames = [
    // Project 1
    "Roof & Steel Girder Works", "Deep Foundation Excavation", "Mobile Crane Lift Operation", "Site Office Ergonomics",
    // Project 2
    "Furniture Assembly", "Network Infrastructure Cabinets", "Main Power Cable Feed", "Air Handling Unit Assembly",
    // Project 3
    "AGV Charging Stations", "High-Bay Pallet Racks Assembly", "Robotic Arms Setup", "Dock Leveler Installation",
    // Project 4
    "Reactor Vessel Inspection", "Sulfuric Acid Valve Replacement", "Scaffolding in Process Area", "Steam Line Insulation",
    // Project 5
    "Switchgear Testing", "Transformer Oil Sampling", "Cable Pulling in Trench", 
    // Project 6
    "Conveyor Roller Replacement", "Pneumatic Press Calibration", "Overhead Crane Commissioning",
    // Project 7
    "Chiller Piping Installation", "Rack Airflow Testing", "Backup Generator Wiring",
    // Project 8
    "Sludge Removal & Washdown", "Gas Monitoring Calibration", "Confined Entry Ventilation Setup",
    // Project 9
    "Suspended Platform Setup", "Window Gasket Resealing", "Mast Climber Inspection",
    // Project 10
    "Bio-Safety Cabinet Validation", "Autoclave Piping Test", "Hazardous Waste System Install"
  ];

  let assIdx = 0;
  for (let pId = 1; pId <= 10; pId++) {
    const proj = projects.find(p => p.id === pId);
    const count = pId <= 5 ? 4 : 3;
    
    for (let aNum = 0; aNum < count; aNum++) {
      const aId = assIdx + 1;
      const status = aId % 7 === 0 ? "Draft" : (aId % 6 === 0 ? "Under Review" : "Published");
      const assessorName = assessors[aId % assessors.length];
      const version = status === "Published" ? `v${(aId % 3) + 2}.0` : `v1.0`;
      
      assessments.push({
        id: aId,
        projectId: pId,
        projectName: proj.name,
        title: assessmentNames[assIdx] || `Assessment ${aId}`,
        area: `Zone ${aId % 4 + 1} - ${proj.location.split(' - ')[1] || 'Site A'}`,
        status: status,
        version: version,
        method: aId % 3 === 0 ? "Finekin-Kinney" : "5x5 Risk Matrix",
        highestInitialRisk: 0,
        highestResidualRisk: 0,
        hazardsCount: 0,
        openActionsCount: 0,
        reviewDate: new Date(2026, 7 + (aId % 5), 10 + (aId % 15)).toISOString().split('T')[0],
        assessor: assessorName,
        updatedAt: new Date(2026, 6, 16 - (aId % 10)).toISOString().split('T')[0] + " 10:30",
        description: `This assessment covers hazard identification and risk control measures for the '${assessmentNames[assIdx]}' activities. Operations are carried out under the standard Operating Procedures.`,
        documents: [
          { name: `SOP-${aId}-Work_Safety_v2.pdf`, size: "2.4 MB", type: "PDF", date: "2026-04-12" },
          { name: `Permit_To_Work_Template.docx`, size: "850 KB", type: "DOCX", date: "2026-05-01" },
          { name: `Site_Layout_Drawing_A1.dwg`, size: "14.2 MB", type: "CAD", date: "2026-01-20" }
        ],
        history: [
          { version: "v1.0", author: assessorName, date: "2026-02-14", comment: "Initial creation and hazard brainstorming" },
          { version: "v1.1", author: proj.manager, date: "2026-03-01", comment: "Added control measures for height safety" },
          { version: "v2.0", author: assessorName, date: "2026-04-15", comment: "Published v2 after safety board walkthrough" }
        ]
      });
      assIdx++;
    }
  }

  // 3. Distribute exactly 240 Hazards across 35 Assessments
  // Assessments 0-29 get 7 hazards (210 hazards). Assessments 30-34 get 6 hazards (30 hazards). Total = 240 hazards.
  let hazIdx = 0;
  for (let aId = 1; aId <= 35; aId++) {
    const ass = assessments.find(a => a.id === aId);
    const count = aId <= 30 ? 7 : 6;
    
    for (let hNum = 0; hNum < count; hNum++) {
      const hId = hazIdx + 1;
      // Get category cyclically
      const cat = categories[hazIdx % categories.length];
      const libItems = hazardLibrary[cat];
      const template = libItems[hId % libItems.length];
      
      // Calculate initial risk
      const initialLikelihood = template.likelihood;
      const initialExposure = template.exposure;
      const initialSeverity = template.severity;
      const initialRiskScore = calculateKinneyScore(initialLikelihood, initialExposure, initialSeverity);
      
      // Residual risk values (lowered due to controls)
      const residualLikelihood = Math.max(1, Math.round(initialLikelihood * 0.4));
      const residualExposure = Math.max(1, Math.round(initialExposure * 0.6));
      const residualSeverity = initialSeverity; // Severity typically remains the same, likelihood/exposure drop
      const residualRiskScore = calculateKinneyScore(residualLikelihood, residualExposure, residualSeverity);

      const status = residualRiskScore > 100 ? "Open" : "Mitigated";

      // Controls array inside hazard
      const controlsCount = (hId % 3) + 2; // 2 to 4 controls
      const hazardControls = [];
      const controlTypes = ["Elimination", "Substitution", "Engineering", "Administrative", "PPE"];
      
      for (let c = 0; c < controlsCount; c++) {
        const hierarchyType = controlTypes[(hId + c) % controlTypes.length];
        let desc = "";
        if (hierarchyType === "PPE") desc = "Equip workers with certified PPE: safety harnesses, high-visibility vest, safety boots, and hard hat.";
        else if (hierarchyType === "Administrative") desc = "Implement regular toolbox talks, permit-to-work requirements, and daily supervisor checks.";
        else if (hierarchyType === "Engineering") desc = "Install standard collective edge protection (double guardrails, toe-boards) and safety netting.";
        else if (hierarchyType === "Substitution") desc = "Replace manual task with hydraulic lift systems where feasible.";
        else desc = "Complete structural pre-assembly at ground level, eliminating the task requirement altogether.";

        hazardControls.push({
          id: c + 1,
          type: hierarchyType,
          description: desc,
          responsible: assessors[(hId + c) % assessors.length],
          status: c === 0 ? "Implemented" : (c === 1 && hId % 2 === 0 ? "In Progress" : "Implemented"),
          effectiveness: 100 - (c * 20),
          implementedDate: new Date(2026, 4, 1 + c).toISOString().split('T')[0],
          reviewDate: new Date(2026, 10, 15).toISOString().split('T')[0]
        });
      }

      hazards.push({
        id: hId,
        hazardId: `HAZ-${String(hId).padStart(4, '0')}`,
        name: template.name,
        consequence: template.consequence,
        category: cat,
        projectId: ass.projectId,
        projectName: ass.projectName,
        assessmentId: ass.id,
        assessmentName: ass.title,
        location: `${locations[ass.projectId - 1].split(' - ')[1] || 'Zone B'}, Section ${hNum + 1}`,
        likelihood: initialLikelihood,
        exposure: initialExposure,
        severity: initialSeverity,
        initialRiskScore: initialRiskScore,
        residualLikelihood: residualLikelihood,
        residualExposure: residualExposure,
        residualSeverity: residualSeverity,
        residualRiskScore: residualRiskScore,
        status: status,
        controls: hazardControls,
        owner: assessors[hId % assessors.length],
        reviewDate: ass.reviewDate,
        openActionsCount: 0,
        whoIsExposed: "Field technicians, operators, and subcontractors working in direct vicinity.",
        riskTrend: hId % 4 === 0 ? "Increasing" : (hId % 4 === 1 ? "Decreasing" : "Stable")
      });

      hazIdx++;
    }
  }

  // 4. Distribute exactly 500 Actions across the 240 Hazards
  // 1st action for all 240 hazards (240 actions).
  // 2nd action for all 240 hazards (now 480 actions).
  // 3rd action for first 20 hazards. Total = 500.
  const actionTemplates = [
    { title: "Conduct refresher training on Height Safety Regulations", desc: "Ensure all personnel working on-site hold valid height-work licenses and hold a tool-box talk." },
    { title: "Inspect scaffold load logs and anchor brackets", desc: "Check structural reports for the safety platforms and sign off the safety tags before morning shift." },
    { title: "Review PPE supply inventory and order replacement harnesses", desc: "Make sure dual-lanyard harnesses with shock absorbers are stocked and ready in the warehouse." },
    { title: "Install extra warning signage and barrier tape", desc: "Demarcate the safety zone boundary under the lift vector to block pedestrian transit." },
    { title: "Verify daily chemical ventilation fan levels", desc: "Check differential pressure meters and log results in the chemical control room register." },
    { title: "Calibrate localized gas monitors", desc: "Run standard gas mixtures to calibrate lower explosion limits (LEL) and carbon monoxide sensors." },
    { title: "Develop confined space rescue deployment chart", desc: "Establish emergency paths and contact numbers for the local emergency unit." },
    { title: "Review workspace ergonomics posture guides", desc: "Publish updated workstation adjustment guidelines on the HSE intranet hub." }
  ];

  let actIdx = 0;
  
  // Helper to add actions
  const addAction = (hId, subId) => {
    const haz = hazards.find(h => h.id === hId);
    const actId = actIdx + 1;
    const priority = actId % 3 === 0 ? "High" : (actId % 3 === 1 ? "Medium" : "Low");
    const status = actId % 4 === 0 ? "Overdue" : (actId % 3 === 0 ? "Completed" : (actId % 2 === 0 ? "In Progress" : "Open"));
    const progress = status === "Completed" ? 100 : (status === "In Progress" ? 50 : 0);
    const tpl = actionTemplates[actId % actionTemplates.length];
    
    actions.push({
      id: actId,
      actionId: `ACT-${String(actId).padStart(4, '0')}`,
      title: `${tpl.title} (${subId})`,
      description: tpl.desc,
      hazardId: haz.id,
      hazardName: haz.name,
      hazardUid: haz.hazardId,
      assessmentId: haz.assessmentId,
      assessmentName: haz.assessmentName,
      projectId: haz.projectId,
      projectName: haz.projectName,
      assignedTo: assessors[actId % assessors.length],
      priority: priority,
      dueDate: new Date(2026, 6 + (actId % 4), 10 + (actId % 15)).toISOString().split('T')[0],
      status: status,
      progress: progress,
      comments: [
        { author: haz.owner, date: "2026-06-10", text: "Assigned action. Please prioritize this before the safety audit next week." },
        { author: assessors[actId % assessors.length], date: "2026-06-14", text: "Procured required parts, scheduling installation for Monday." }
      ],
      attachments: [
        { name: "Safety_Audit_Notes.txt", size: "12 KB", type: "TXT" }
      ],
      timeline: [
        { date: "2026-06-10 09:00", text: "Action created by System automatically based on high initial risk." },
        { date: "2026-06-12 14:15", text: `Assigned to ${assessors[actId % assessors.length]} for execution.` }
      ]
    });
    
    actIdx++;
  };

  // Add 1st action to all 240 hazards
  for (let h = 1; h <= 240; h++) {
    addAction(h, "Phase 1");
  }
  // Add 2nd action to all 240 hazards
  for (let h = 1; h <= 240; h++) {
    addAction(h, "Phase 2");
  }
  // Add 3rd action to the first 20 hazards
  for (let h = 1; h <= 20; h++) {
    addAction(h, "Review");
  }

  // 5. Generate exactly 80 Reviews
  // Distributed across assessments.
  let revIdx = 0;
  for (let i = 0; i < 80; i++) {
    const aId = (i % 35) + 1;
    const ass = assessments.find(a => a.id === aId);
    const revId = i + 1;
    const reviewer = managers[i % managers.length];
    const status = i % 5 === 0 ? "Overdue" : (i % 4 === 0 ? "Scheduled" : "Completed");
    
    reviews.push({
      id: revId,
      assessmentId: ass.id,
      assessmentName: ass.title,
      projectId: ass.projectId,
      projectName: ass.projectName,
      currentVersion: ass.version,
      highestRiskScore: 0, // calculated later
      reviewDueDate: new Date(2026, 7 + (i % 4), 5 + (i % 20)).toISOString().split('T')[0],
      status: status,
      reviewer: reviewer,
      conductedDate: status === "Completed" ? new Date(2026, 5, 10 + (i % 15)).toISOString().split('T')[0] : null,
      notes: status === "Completed" ? "Completed periodic review of the safety controls. Some hazard levels adjusted down after edge-guards were fully welded." : "Upcoming regular audit."
    });
  }

  // Compile calculations and links back to projects and assessments
  // Fill counts and highest scores
  hazards.forEach(h => {
    // Increment assessment hazard count
    const ass = assessments.find(a => a.id === h.assessmentId);
    if (ass) {
      ass.hazardsCount++;
      if (h.initialRiskScore > ass.highestInitialRisk) {
        ass.highestInitialRisk = h.initialRiskScore;
      }
      if (h.residualRiskScore > ass.highestResidualRisk) {
        ass.highestResidualRisk = h.residualRiskScore;
      }
    }
    
    // Add open actions count to hazard
    const hazActions = actions.filter(act => act.hazardId === h.id);
    const openHazActions = hazActions.filter(act => act.status !== "Completed");
    h.openActionsCount = openHazActions.length;
  });

  assessments.forEach(ass => {
    const p = projects.find(proj => proj.id === ass.projectId);
    if (p) {
      p.assessmentsCount++;
      if (ass.highestResidualRisk > p.highestRiskScore) {
        p.highestRiskScore = ass.highestResidualRisk;
      }
    }
    
    const assActions = actions.filter(act => act.assessmentId === ass.id && act.status !== "Completed");
    ass.openActionsCount = assActions.length;
    if (p) {
      p.openActionsCount += assActions.length;
    }
  });

  // Calculate highest risk in reviews
  reviews.forEach(r => {
    const ass = assessments.find(a => a.id === r.assessmentId);
    if (ass) {
      r.highestRiskScore = ass.highestResidualRisk;
    }
  });

  // Templates details
  const templates = [
    {
      id: "tpl-construction",
      name: "Construction Site RI&E",
      icon: "HardHat",
      category: "Construction",
      description: "Standard template for civil engineering, commercial building construction, and heavy machinery work sites.",
      hazards: [
        { name: "Working at Height on Scaffolding", category: "Safety", initialRisk: 270, residualRisk: 48 },
        { name: "Falling Debris from Upper Decks", category: "Safety", initialRisk: 135, residualRisk: 24 },
        { name: "Manual Handling of Heavy Girders", category: "Ergonomics", initialRisk: 252, residualRisk: 36 },
        { name: "Exposure to High Level Concrete Dust", category: "Chemical", initialRisk: 540, residualRisk: 54 }
      ]
    },
    {
      id: "tpl-office",
      name: "Corporate Office Ergonomics",
      icon: "Monitor",
      category: "Office / Admin",
      description: "Standard template for office spaces, focus areas include desks, screen workspaces, ventilation, and stress factors.",
      hazards: [
        { name: "Non-adjustable chair ergonomic strain", category: "Ergonomics", initialRisk: 180, residualRisk: 18 },
        { name: "Exposed computer wiring under desks", category: "Electrical", initialRisk: 90, residualRisk: 18 },
        { name: "Poor air circulation and temperature drift", category: "Physical", initialRisk: 75, residualRisk: 15 },
        { name: "High workload and tight digital deadlines", category: "Psychosocial", initialRisk: 144, residualRisk: 48 }
      ]
    },
    {
      id: "tpl-warehouse",
      name: "Warehouse & Logistics Hub",
      icon: "Box",
      category: "Logistics",
      description: "Template covering shelving assembly, inventory storage, forklift traffic, loading docks, and material handling safety.",
      hazards: [
        { name: "Struck by moving forklift in storage aisle", category: "Safety", initialRisk: 480, residualRisk: 48 },
        { name: "Frequent overhead lifting of bulky packaging", category: "Ergonomics", initialRisk: 336, residualRisk: 42 },
        { name: "Collapse of overloaded storage rack", category: "Safety", initialRisk: 400, residualRisk: 20 },
        { name: "High noise during automated sorter system runs", category: "Physical", initialRisk: 140, residualRisk: 28 }
      ]
    },
    {
      id: "tpl-factory",
      name: "Industrial Factory & Production Line",
      icon: "Factory",
      category: "Manufacturing",
      description: "Covers hazards associated with automated packaging lines, rotating equipment, high heat components, and machine safety zones.",
      hazards: [
        { name: "Entanglement in rotating drive shaft", category: "Safety", initialRisk: 480, residualRisk: 48 },
        { name: "Repetitive parts sorting at assembly station", category: "Ergonomics", initialRisk: 144, residualRisk: 36 },
        { name: "High voltage breaker switching panel contact", category: "Electrical", initialRisk: 600, residualRisk: 60 },
        { name: "Loud industrial compressor noise exposure", category: "Physical", initialRisk: 420, residualRisk: 42 }
      ]
    },
    {
      id: "tpl-electrical",
      name: "High Voltage Electrical Substation",
      icon: "Zap",
      category: "Utilities",
      description: "Risk evaluation model for grid network installations, electrical distribution centers, and live cabinet works.",
      hazards: [
        { name: "Direct contact with 10kV power rails", category: "Electrical", initialRisk: 600, residualRisk: 60 },
        { name: "Arc Flash discharge during breaker check", category: "Electrical", initialRisk: 200, residualRisk: 20 },
        { name: "Lone working in isolated substation building", category: "Psychosocial", initialRisk: 90, residualRisk: 45 },
        { name: "Thermal burns from hot transformer fins", category: "Physical", initialRisk: 120, residualRisk: 12 }
      ]
    },
    {
      id: "tpl-chemical",
      name: "Chemical Reactor & Acid Storage Tank",
      icon: "FlaskConical",
      category: "Chemical Process",
      description: "Assessment template targeting toxic leakages, chemical valve swaps, corrosive splashing, and explosion hazards.",
      hazards: [
        { name: "Inhalation of toxic benzene vapors in gallery", category: "Chemical", initialRisk: 480, residualRisk: 48 },
        { name: "Dermal splattering of corrosive sulfuric acid", category: "Chemical", initialRisk: 135, residualRisk: 27 },
        { name: "Solvent vapor cloud ignition near hot line", category: "Chemical", initialRisk: 300, residualRisk: 30 },
        { name: "Entering nitrogen-purged inert reactor vessel", category: "Safety", initialRisk: 1000, residualRisk: 100 }
      ]
    }
  ];

  return {
    projects,
    assessments,
    hazards,
    actions,
    reviews,
    templates,
    archive: {
      assessments: [
        { id: 101, title: "Old Jetty Demolition", project: "Harbour Expansion Project", category: "Safety", archiver: "John Doe", archivedAt: "2026-03-12" },
        { id: 102, title: "Temporary Boiler Room Installation", project: "Chemical Plant Maintenance Shutdown", category: "Physical", archiver: "David Chen", archivedAt: "2026-05-18" },
        { id: 103, title: "A4 Office Wiring Audit", project: "Office Relocation & Fit-out", category: "Electrical", archiver: "Sarah Jenkins", archivedAt: "2026-06-02" }
      ],
      versions: [
        { id: 201, title: "Roof & Steel Girder Works - v1.0 Archive", parentId: 1, version: "v1.0", project: "Harbour Expansion Project", archiver: "System Auto", archivedAt: "2026-02-14" },
        { id: 202, title: "Network Infrastructure Cabinets - v1.1 Archive", parentId: 6, version: "v1.1", project: "Office Relocation & Fit-out", archiver: "Jane Smith", archivedAt: "2026-03-01" },
        { id: 203, title: "Robotic Arms Setup - v2.0 Archive", parentId: 11, version: "v2.0", project: "Warehouse Automation Upgrade", archiver: "Thomas Wright", archivedAt: "2026-04-15" }
      ]
    }
  };
}
