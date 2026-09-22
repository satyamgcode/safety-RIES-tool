import { reactive, ref, watch } from 'vue';
import { generateMockData, calculateKinneyScore, getKinneyRiskLevel } from './mockData';

const rawData = generateMockData();

const relativeDate = (daysOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

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
  projects: rawData.projects.map(p => {
    if (p.id === 1) p.name = "Shantanu Test Thursday";
    if (p.id === 2) p.name = "Test project 1";
    if (p.id === 3) p.name = "Warehouse fit-out";
    if (p.id === 5) p.name = "A12 viaduct";
    return p;
  }),
  selectedCompanyId: 1,
  companies: [
    {
      id: 1,
      name: 'Shopify / Safety Systems NL',
      displayName: 'Shopify',
      type: 'Specialist Contractor',
      category: 'Digital & Site Safety Solutions',
      status: 'Active',
      verificationStatus: 'Verified Contractor',
      tier: 'Tier 1',
      logo: 'S',
      logoColor: 'from-emerald-500 to-green-600',
      email: 'shantanupujari5@gmail.com',
      phone: '+31 356 563 5635',
      manager: 'Shantanu Pujari',
      kvk: '45656',
      vat: 'NL58464544353B01',
      address: {
        street: 'Gasthuisstraat',
        number: '24',
        postalCode: '4161CC',
        city: 'Heukelum',
        country: 'Netherlands'
      },
      website: 'https://safetysys.nl',
      vcaCertification: 'VCA** Petrochemical Certified',
      safetyScore: 95,
      zeroLtiDays: 310,
      activeProjectsCount: 2,
      lastAuditDate: '2026-08-15',
      lastLogin: 'Monday, 21-09-2026',
      insurancePolicy: 'AVB-90281-NL (Cover: €5,000,000)'
    },
    {
      id: 2,
      name: 'Loggix Bouw',
      displayName: 'Loggix Bouw',
      type: 'General Contractor',
      category: 'Structural & Concrete Construction',
      status: 'Active',
      verificationStatus: 'Verified Contractor',
      tier: 'Tier 1',
      logo: 'LB',
      logoColor: 'from-blue-500 to-indigo-600',
      email: 'operations@loggixbouw.nl',
      phone: '+31 20 555 1234',
      manager: 'Jeroen Lutmers',
      kvk: '34198212',
      vat: 'NL849302194B01',
      address: {
        street: 'Industrieweg',
        number: '12',
        postalCode: '1014AB',
        city: 'Amsterdam',
        country: 'Netherlands'
      },
      website: 'https://loggixbouw.nl',
      vcaCertification: 'VCA** Corporate Certified',
      safetyScore: 94,
      zeroLtiDays: 142,
      activeProjectsCount: 3,
      lastAuditDate: '2026-07-20',
      lastLogin: 'Friday, 18-09-2026',
      insurancePolicy: 'AVB-44120-NL (Cover: €10,000,000)'
    },
    {
      id: 3,
      name: 'Hijs & Transport BV',
      displayName: 'Hijs & Transport',
      type: 'Heavy Equipment & Lifting',
      category: 'Mobile Cranes & Logistics',
      status: 'Active',
      verificationStatus: 'Verified Contractor',
      tier: 'Tier 1',
      logo: 'HT',
      logoColor: 'from-amber-500 to-orange-600',
      email: 'planning@hijstransport.nl',
      phone: '+31 10 440 9800',
      manager: 'Markus Vance',
      kvk: '24991021',
      vat: 'NL992019481B01',
      address: {
        street: 'Havenkade',
        number: '88',
        postalCode: '3089KK',
        city: 'Rotterdam',
        country: 'Netherlands'
      },
      website: 'https://hijstransport.nl',
      vcaCertification: 'VCA** Heavy Lifting Certified',
      safetyScore: 98,
      zeroLtiDays: 450,
      activeProjectsCount: 2,
      lastAuditDate: '2026-09-02',
      lastLogin: 'Today, 08:30 AM',
      insurancePolicy: 'AVB-88120-LIFT (Cover: €15,000,000)'
    },
    {
      id: 4,
      name: 'Scaffolding NL',
      displayName: 'Scaffolding NL',
      type: 'Work at Height Specialist',
      category: 'Scaffolding & Edge Protection',
      status: 'Active',
      verificationStatus: 'Verified Contractor',
      tier: 'Tier 2',
      logo: 'SN',
      logoColor: 'from-purple-500 to-indigo-600',
      email: 'veiligheid@scaffolding.nl',
      phone: '+31 30 777 4411',
      manager: 'Marc Dubois',
      kvk: '30129481',
      vat: 'NL773910294B01',
      address: {
        street: 'Steigerweg',
        number: '5',
        postalCode: '3542CA',
        city: 'Utrecht',
        country: 'Netherlands'
      },
      website: 'https://scaffolding.nl',
      vcaCertification: 'VCA* Scaffolding Certified',
      safetyScore: 91,
      zeroLtiDays: 98,
      activeProjectsCount: 2,
      lastAuditDate: '2026-06-11',
      lastLogin: 'Yesterday, 16:15',
      insurancePolicy: 'AVB-19920-WH (Cover: €5,000,000)'
    }
  ],
  companyDocuments: [
    {
      id: 1,
      companyId: 1,
      title: 'Corporate Liability Insurance Policy (AVB)',
      category: 'Insurance',
      documentNumber: 'POL-AVB-2026-90281',
      fileName: 'Corporate_Liability_Insurance_2026_Shopify.pdf',
      fileSize: '2.4 MB',
      issuedDate: '2026-01-01',
      validUntil: '2027-01-01',
      status: 'Verified',
      uploadedBy: 'Shantanu Pujari',
      reviewer: 'L. Hofman',
      verifiedAt: '2026-01-15'
    },
    {
      id: 2,
      companyId: 1,
      title: 'Chamber of Commerce (KVK) Handelsregister Extract',
      category: 'Legal Registration',
      documentNumber: 'KVK-45656-NL',
      fileName: 'KVK_Commercial_Register_Extract_2026.pdf',
      fileSize: '1.1 MB',
      issuedDate: '2026-01-10',
      validUntil: '2027-01-10',
      status: 'Verified',
      uploadedBy: 'Shantanu Pujari',
      reviewer: 'L. Hofman',
      verifiedAt: '2026-01-16'
    },
    {
      id: 3,
      companyId: 1,
      title: 'VCA** Corporate Petrochemical Safety Certificate',
      category: 'Safety Certification',
      documentNumber: 'VCA-CORP-45656',
      fileName: 'VCA_Company_Accreditation_Certificate.pdf',
      fileSize: '3.8 MB',
      issuedDate: '2024-05-12',
      validUntil: '2027-05-12',
      status: 'Verified',
      uploadedBy: 'Shantanu Pujari',
      reviewer: 'Safety Board NL',
      verifiedAt: '2024-05-20'
    },
    {
      id: 4,
      companyId: 1,
      title: 'Proof of Registered Office Address & Good Standing',
      category: 'Compliance',
      documentNumber: 'ADDR-4161CC-24',
      fileName: 'Proof_Of_Address_Gasthuisstraat_Heukelum.pdf',
      fileSize: '890 KB',
      issuedDate: '2026-02-01',
      validUntil: '2027-02-01',
      status: 'Verified',
      uploadedBy: 'Shantanu Pujari',
      reviewer: 'L. Hofman',
      verifiedAt: '2026-02-05'
    },
    {
      id: 5,
      companyId: 1,
      title: 'Signed HSE Framework Safety Charter & Pledge',
      category: 'HSE Protocol',
      documentNumber: 'HSE-CHARTER-2026',
      fileName: 'Signed_HSE_Safety_Charter_and_Site_Induction.pdf',
      fileSize: '1.6 MB',
      issuedDate: '2026-01-12',
      validUntil: '2027-01-12',
      status: 'Verified',
      uploadedBy: 'Shantanu Pujari',
      reviewer: 'Sophie Dubois',
      verifiedAt: '2026-01-14'
    },
    {
      id: 6,
      companyId: 1,
      title: 'Tax Good Standing & BTW Nil-Arrears Declaration',
      category: 'Tax & Financial',
      documentNumber: 'BELASTING-2026-09',
      fileName: 'WKA_Tax_Authority_Declaration_Q3_2026.pdf',
      fileSize: '740 KB',
      issuedDate: '2026-07-01',
      validUntil: '2026-10-01',
      status: 'Expiring Soon',
      uploadedBy: 'Shantanu Pujari',
      reviewer: 'Finance Team',
      verifiedAt: '2026-07-05'
    }
  ],
  employees: [
    { id: 1, name: 'Tom Willemsen', role: 'Machinist', company: 'Hijs & Transport BV', projectIds: [1, 2] },
    { id: 2, name: 'Sven Bakker', role: 'Voorman', company: 'Loggix Bouw', projectIds: [2] },
    { id: 3, name: 'Karim El Idrissi', role: 'Elektromonteur', company: 'Elektro Peters', projectIds: [2] },
    { id: 4, name: 'Jeroen Lutmers', role: 'Projectleader', company: 'Loggix Bouw', projectIds: [2] },
    { id: 5, name: 'Bram Koster', role: 'Sloper', company: 'Van Dijk Infra', projectIds: [2] },
    { id: 6, name: 'Ria Smit', role: 'Dakdekker', company: 'Dakwerken Jansen BV', projectIds: [2] },
    { id: 7, name: 'Pieter de Jong', role: 'Timmerman', company: 'Loggix Bouw', projectIds: [1, 2, 5] },
    { id: 8, name: 'Jan de Vries', role: 'Lasser', company: 'SteelWorks BV', projectIds: [2] },
    { id: 9, name: 'Arthur King', role: 'Elektricien', company: 'ElectroTech', projectIds: [2, 3] },
    { id: 10, name: 'Sophie Dubois', role: 'Veiligheidskundige', company: 'HSE Consultant', projectIds: [3] },
    { id: 11, name: 'Marc Dubois', role: 'Steigerbouwer', company: 'Scaffolding NL', projectIds: [1, 5] },
    { id: 12, name: 'M. de Vries', role: 'Mechanical Supervisor', company: 'Loggix Bouw', projectIds: [1, 2] },
    { id: 13, name: 'L. Hofman', role: 'HSE Coordinator', company: 'Apex Industrial Holdings', projectIds: [1, 2] },
    { id: 14, name: 'Shantanu Pujari', role: 'Solutions Architect & Lead', company: 'Shopify / Safety Systems NL', projectIds: [1, 2] },
    { id: 15, name: 'Anika Sharma', role: 'Site Safety Specialist', company: 'Shopify / Safety Systems NL', projectIds: [1] }
  ],
  certificateTypes: [
    { id: 'bhv', name: 'BHV Bedrijfshulpverlening (BHV)', validityMonths: 12, satisfies: null },
    { id: 'vca-vol', name: 'VCA-VOL VCA VOL (leidinggevenden)', validityMonths: 120, satisfies: 'vca-b' },
    { id: 'vca-b', name: 'VCA-B VCA Basisveiligheid', validityMonths: 120, satisfies: null },
    { id: 'nen3140', name: 'NEN3140 NEN 3140 (VOP)', validityMonths: 36, satisfies: null },
    { id: 'heights', name: 'Safe Working at Heights', validityMonths: 24, satisfies: null },
    { id: 'forklift', name: 'Forklift Operator Certificate', validityMonths: 60, satisfies: null }
  ],
  certificates: [
    { id: 1, employeeId: 1, typeId: 'bhv', certificateNumber: 'BHV-2291', issuer: 'HSE NL', issuedOn: relativeDate(-65 - 365), expiresOn: relativeDate(-65), status: 'Expired', history: [] },
    { id: 2, employeeId: 2, typeId: 'bhv', certificateNumber: 'BHV-1982', issuer: 'Safety First', issuedOn: relativeDate(-40 - 365), expiresOn: relativeDate(-40), status: 'Expired', history: [] },
    { id: 3, employeeId: 3, typeId: 'nen3140', certificateNumber: 'NEN-1092', issuer: 'Electro Tech', issuedOn: relativeDate(36 - 1095), expiresOn: relativeDate(36), status: 'Expiring', history: [] },
    { id: 4, employeeId: 4, typeId: 'bhv', certificateNumber: 'BHV-77410', issuer: 'Loggix Training', issuedOn: relativeDate(47 - 365), expiresOn: relativeDate(47), status: 'Expiring', history: [] },
    { id: 5, employeeId: 5, typeId: 'vca-b', certificateNumber: 'VB-1298', issuer: 'VCA NL', issuedOn: relativeDate(57 - 3650), expiresOn: relativeDate(57), status: 'Expiring', history: [] },
    { id: 6, employeeId: 6, typeId: 'bhv', certificateNumber: 'BHV-2009', issuer: 'Safety Training BV', issuedOn: relativeDate(69 - 365), expiresOn: relativeDate(69), status: 'Expiring', history: [] },
    { id: 7, employeeId: 1, typeId: 'forklift', certificateNumber: 'FL-8812', issuer: 'Transport Safety', issuedOn: relativeDate(-300), expiresOn: relativeDate(-300 + 1800), status: 'Valid', history: [] },
    { id: 8, employeeId: 2, typeId: 'vca-b', certificateNumber: 'VB-8291', issuer: 'VCA NL', issuedOn: relativeDate(-500), expiresOn: relativeDate(-500 + 3650), status: 'Valid', history: [] },
    { id: 9, employeeId: 3, typeId: 'vca-b', certificateNumber: 'VB-7711', issuer: 'VCA NL', issuedOn: relativeDate(-200), expiresOn: relativeDate(-200 + 3650), status: 'Valid', history: [] },
    { id: 10, employeeId: 4, typeId: 'vca-vol', certificateNumber: 'VV-100231', issuer: 'VCA Infra', issuedOn: relativeDate(-2200), expiresOn: relativeDate(-2200 + 3650), status: 'Valid', history: [] },
    { id: 11, employeeId: 5, typeId: 'heights', certificateNumber: 'WH-9082', issuer: 'Fall Safety NL', issuedOn: relativeDate(-150), expiresOn: relativeDate(-150 + 730), status: 'Valid', history: [] },
    { id: 12, employeeId: 7, typeId: 'vca-b', certificateNumber: 'VB-4311', issuer: 'VCA NL', issuedOn: relativeDate(-400), expiresOn: relativeDate(-400 + 3650), status: 'Valid', history: [] },
    { id: 13, employeeId: 7, typeId: 'heights', certificateNumber: 'WH-3091', issuer: 'Fall Safety NL', issuedOn: relativeDate(-250), expiresOn: relativeDate(-250 + 730), status: 'Valid', history: [] },
    { id: 14, employeeId: 7, typeId: 'bhv', certificateNumber: 'BHV-5511', issuer: 'Safety Training BV', issuedOn: relativeDate(-180), expiresOn: relativeDate(-180 + 365), status: 'Valid', history: [] },
    { id: 15, employeeId: 8, typeId: 'vca-b', certificateNumber: 'VB-3891', issuer: 'VCA NL', issuedOn: relativeDate(-300), expiresOn: relativeDate(-300 + 3650), status: 'Valid', history: [] },
    { id: 16, employeeId: 8, typeId: 'nen3140', certificateNumber: 'NEN-9021', issuer: 'Electro Tech', issuedOn: relativeDate(-200), expiresOn: relativeDate(-200 + 1095), status: 'Valid', history: [] },
    { id: 17, employeeId: 8, typeId: 'bhv', certificateNumber: 'BHV-6622', issuer: 'Safety Training BV', issuedOn: relativeDate(-120), expiresOn: relativeDate(-120 + 365), status: 'Valid', history: [] },
    { id: 18, employeeId: 9, typeId: 'vca-b', certificateNumber: 'VB-5522', issuer: 'VCA NL', issuedOn: relativeDate(-150), expiresOn: relativeDate(-150 + 3650), status: 'Valid', history: [] },
    { id: 19, employeeId: 9, typeId: 'nen3140', certificateNumber: 'NEN-8812', issuer: 'Electro Tech', issuedOn: relativeDate(-100), expiresOn: relativeDate(-100 + 1095), status: 'Valid', history: [] },
    { id: 20, employeeId: 9, typeId: 'bhv', certificateNumber: 'BHV-7733', issuer: 'Safety Training BV', issuedOn: relativeDate(-80), expiresOn: relativeDate(-80 + 365), status: 'Valid', history: [] },
    { id: 21, employeeId: 10, typeId: 'vca-vol', certificateNumber: 'VV-99002', issuer: 'VCA Infra', issuedOn: relativeDate(-600), expiresOn: relativeDate(-600 + 3650), status: 'Valid', history: [] },
    { id: 22, employeeId: 10, typeId: 'bhv', certificateNumber: 'BHV-8822', issuer: 'Safety Training BV', issuedOn: relativeDate(-300), expiresOn: relativeDate(-300 + 365), status: 'Valid', history: [] },
    { id: 23, employeeId: 10, typeId: 'heights', certificateNumber: 'WH-4422', issuer: 'Fall Safety NL', issuedOn: relativeDate(-200), expiresOn: relativeDate(-200 + 730), status: 'Valid', history: [] },
    { id: 24, employeeId: 11, typeId: 'vca-b', certificateNumber: 'VB-6611', issuer: 'VCA NL', issuedOn: relativeDate(-500), expiresOn: relativeDate(-500 + 3650), status: 'Valid', history: [] },
    { id: 25, employeeId: 11, typeId: 'heights', certificateNumber: 'WH-5511', issuer: 'Fall Safety NL', issuedOn: relativeDate(-100), expiresOn: relativeDate(-100 + 730), status: 'Valid', history: [] },
    { id: 26, employeeId: 11, typeId: 'bhv', certificateNumber: 'BHV-9944', issuer: 'Safety Training BV', issuedOn: relativeDate(-50), expiresOn: relativeDate(-50 + 365), status: 'Valid', history: [] },
    { id: 27, employeeId: 6, typeId: 'vca-b', certificateNumber: 'VB-9988', issuer: 'VCA NL', issuedOn: relativeDate(-450), expiresOn: relativeDate(-450 + 3650), status: 'Valid', history: [] },
    { id: 28, employeeId: 12, typeId: 'vca-b', certificateNumber: 'VB-8899', issuer: 'VCA NL', issuedOn: relativeDate(-100), expiresOn: relativeDate(-100 + 3650), status: 'Valid', history: [] },
    { id: 29, employeeId: 12, typeId: 'heights', certificateNumber: 'WH-1211', issuer: 'Fall Safety NL', issuedOn: relativeDate(-750), expiresOn: relativeDate(-750 + 730), status: 'Expired', history: [] },
    { id: 30, employeeId: 14, typeId: 'vca-vol', certificateNumber: 'VV-880011', issuer: 'VCA Infra', issuedOn: relativeDate(-300), expiresOn: relativeDate(-300 + 3650), status: 'Valid', history: [] },
    { id: 31, employeeId: 14, typeId: 'bhv', certificateNumber: 'BHV-44911', issuer: 'Safety First NL', issuedOn: relativeDate(-120), expiresOn: relativeDate(-120 + 365), status: 'Valid', history: [] },
    { id: 32, employeeId: 15, typeId: 'vca-b', certificateNumber: 'VB-99120', issuer: 'VCA NL', issuedOn: relativeDate(-180), expiresOn: relativeDate(-180 + 3650), status: 'Valid', history: [] },
    { id: 33, employeeId: 15, typeId: 'heights', certificateNumber: 'WH-66120', issuer: 'Fall Safety NL', issuedOn: relativeDate(-90), expiresOn: relativeDate(-90 + 730), status: 'Valid', history: [] }
  ],
  projectRequirements: {
    1: ['vca-b', 'heights'],
    2: ['vca-b', 'bhv'],
    3: ['vca-b'],
    5: ['vca-b']
  },
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
  permits: [
    {
      id: 1,
      permitNumber: 'PTW-0001',
      type: 'Hot Work',
      title: 'test bhushan',
      location: 'kharadi',
      projectId: 1,
      projectName: 'Shantanu Test Thursday',
      requestedBy: 'M. de Vries',
      holderId: 12,
      holderName: 'M. de Vries',
      approvedBy: 'L. Hofman',
      validFrom: '2026-08-13',
      validTo: '2026-08-13',
      status: 'Closed',
      requiredCertificateIds: ['vca-b'],
      precautions: [
        { id: 1, description: 'Fire extinguisher on site', confirmed: false },
        { id: 2, description: 'Gas checks done', confirmed: false }
      ],
      timeline: [
        { status: 'Active', timestamp: '2026-08-13 13:14:39', by: 'M. de Vries' },
        { status: 'Closed', timestamp: '2026-08-13 13:24:35', by: 'Shantanu' }
      ]
    },
    {
      id: 2,
      permitNumber: 'PTW-0002',
      type: 'Hot Work',
      title: 'test bhushan title',
      location: 'kharadi',
      projectId: 1,
      projectName: 'Shantanu Test Thursday',
      requestedBy: 'M. de Vries',
      holderId: 12,
      holderName: 'M. de Vries',
      approvedBy: 'L. Hofman',
      validFrom: '2026-08-13',
      validTo: '2026-08-13',
      status: 'Closed',
      requiredCertificateIds: ['vca-b'],
      precautions: [
        { id: 1, description: 'test 2', confirmed: true },
        { id: 2, description: 'test 3', confirmed: false }
      ],
      timeline: [
        { status: 'Active', timestamp: '2026-08-13 13:14:39', by: 'M. de Vries' },
        { status: 'Closed', timestamp: '2026-08-13 13:24:35', by: 'Shantanu' }
      ]
    },
    {
      id: 3,
      permitNumber: 'PTW-0003',
      type: 'Confined Space',
      title: 'test 3 for steps checked',
      location: 'pune',
      projectId: 1,
      projectName: 'Shantanu Test Thursday',
      requestedBy: 'M. de Vries',
      holderId: 12,
      holderName: 'M. de Vries',
      approvedBy: 'L. Hofman',
      validFrom: '2026-07-31',
      validTo: '2026-08-20',
      status: 'Closed',
      requiredCertificateIds: ['vca-b', 'bhv'],
      precautions: [
        { id: 1, description: 'test precaution A', confirmed: true },
        { id: 2, description: 'test precaution B', confirmed: true }
      ],
      timeline: [
        { status: 'Active', timestamp: '2026-07-31 09:00:00', by: 'M. de Vries' },
        { status: 'Closed', timestamp: '2026-08-20 17:00:00', by: 'Shantanu' }
      ]
    },
    {
      id: 4,
      permitNumber: 'PTW-0004',
      type: 'Electrical',
      title: 'testing for the loggs',
      location: 'netherlands',
      projectId: 1,
      projectName: 'Shantanu Test Thursday',
      requestedBy: 'M. de Vries',
      holderId: 12,
      holderName: 'M. de Vries',
      approvedBy: 'L. Hofman',
      validFrom: '2026-08-08',
      validTo: '2026-08-11',
      status: 'Closed',
      requiredCertificateIds: ['vca-b', 'nen3140'],
      precautions: [
        { id: 1, description: 'Circuit locked and tagged', confirmed: true },
        { id: 2, description: 'Voltage checked', confirmed: true }
      ],
      timeline: [
        { status: 'Active', timestamp: '2026-08-08 08:30:00', by: 'M. de Vries' },
        { status: 'Closed', timestamp: '2026-08-11 16:30:00', by: 'Shantanu' }
      ]
    },
    {
      id: 5,
      permitNumber: 'PTW-0005',
      type: 'working with electrical currents',
      title: 'testing the input',
      location: 'pune kharadi',
      projectId: 1,
      projectName: 'Shantanu Test Thursday',
      requestedBy: 'M. de Vries',
      holderId: null,
      holderName: 'Unassigned',
      approvedBy: 'L. Hofman',
      validFrom: '2026-08-13',
      validTo: '2026-08-20',
      status: 'Closed',
      requiredCertificateIds: ['vca-b'],
      precautions: [
        { id: 1, description: 'Insulated tools checked', confirmed: false }
      ],
      timeline: [
        { status: 'Active', timestamp: '2026-08-13 10:00:00', by: 'M. de Vries' },
        { status: 'Closed', timestamp: '2026-08-20 12:00:00', by: 'Shantanu' }
      ]
    },
    {
      id: 6,
      permitNumber: 'PTW-0006',
      type: 'sdsa',
      title: 'sdsa',
      location: 'asdsa',
      projectId: 1,
      projectName: 'Shantanu Test Thursday',
      requestedBy: 'M. de Vries',
      holderId: 7,
      holderName: 'Pieter de Jong',
      approvedBy: 'L. Hofman',
      validFrom: '2026-08-21',
      validTo: '2026-08-21',
      status: 'Active',
      requiredCertificateIds: ['vca-b'],
      precautions: [
        { id: 1, description: 'precaution 1', confirmed: false }
      ],
      timeline: [
        { status: 'Active', timestamp: '2026-08-21 08:00:00', by: 'Pieter de Jong' }
      ]
    }
  ],
  equipment: [
    { id: 1, name: 'Liebherr L1-24 Tower Crane', tag: 'CRANE-01', type: 'Heavy Lifting', projectId: 1, operator: 'Tom Willemsen', status: 'Operational', certStatus: 'Certified', nextInspection: '2026-11-20', location: 'Zone A - Crane Pad' },
    { id: 2, name: 'Genie Z-45 Articulated Boom Lift', tag: 'MEWP-04', type: 'Work at Height', projectId: 1, operator: 'Marc Dubois', status: 'Operational', certStatus: 'Certified', nextInspection: '2026-10-15', location: 'Facade North' },
    { id: 3, name: 'Atlas Copco QAS 60 Generator', tag: 'GEN-02', type: 'Power Supply', projectId: 1, operator: 'Arthur King', status: 'In Use', certStatus: 'Due Soon', nextInspection: '2026-09-28', location: 'Temporary Substation' },
    { id: 4, name: 'CAT 320 Hydraulic Excavator', tag: 'EXC-07', type: 'Earthmoving', projectId: 1, operator: 'Bram Koster', status: 'Operational', certStatus: 'Certified', nextInspection: '2026-12-05', location: 'Foundation Trench' },
    { id: 5, name: 'JLG 1930ES Electric Scissor Lift', tag: 'MEWP-09', type: 'Work at Height', projectId: 2, operator: 'Sven Bakker', status: 'Operational', certStatus: 'Certified', nextInspection: '2026-10-30', location: 'Central Atrium' },
    { id: 6, name: 'Hilti Vac-40 Dust Extractor', tag: 'DUST-01', type: 'Air / Dust Control', projectId: 2, operator: 'Karim El Idrissi', status: 'Operational', certStatus: 'Certified', nextInspection: '2026-11-12', location: 'Zone 2 Floor 3' },
    { id: 7, name: 'Toyota 2.5T Electric Forklift', tag: 'FL-03', type: 'Material Handling', projectId: 2, operator: 'Tom Willemsen', status: 'Operational', certStatus: 'Certified', nextInspection: '2026-10-02', location: 'Loading Bay B' },
    { id: 8, name: 'Kaeser M50 Mobile Air Compressor', tag: 'COMP-03', type: 'Pneumatics', projectId: 3, operator: 'Jan de Vries', status: 'Operational', certStatus: 'Certified', nextInspection: '2026-11-01', location: 'Warehouse Sector 4' },
    { id: 9, name: 'Manitou MT 625 Telehandler', tag: 'TH-01', type: 'Material Handling', projectId: 5, operator: 'Pieter de Jong', status: 'Operational', certStatus: 'Certified', nextInspection: '2026-10-22', location: 'Pylon 3 West' }
  ],
  inspections: [
    { id: 1, nr: 332, inspectionNumber: 'INSP-2026-001', type: 'Quarterly', description: 'Perimeter fencing, scaffolding toe-boards & edge protection review', projectId: 1, inspector: 'Sophie Dubois', location: 'Rotterdam Port - Quay 4', scheduledDate: '2026-09-22', status: 'Scheduled', findingsCount: 2, actionsCount: 3, passedChecks: 18 },
    { id: 2, nr: 330, inspectionNumber: 'INSP-2026-002', type: 'Quarterly', description: 'Temporary distribution boards and earth-leakage breakers verification', projectId: 1, inspector: 'Amir Patel', location: 'Rotterdam Port - Quay 4', scheduledDate: '2026-09-18', status: 'Completed', findingsCount: 1, actionsCount: 2, passedChecks: 14 },
    { id: 3, nr: 328, inspectionNumber: 'INSP-2026-003', type: 'Werkbus', description: 'Verification of harness test stamps and anchor line tensioning', projectId: 1, inspector: 'L. Hofman', location: 'Zone B - Roof edge', scheduledDate: '2026-09-15', status: 'Completed', findingsCount: 0, actionsCount: 0, passedChecks: 16 },
    { id: 4, nr: 327, inspectionNumber: 'INSP-2026-004', type: 'Quarterly', description: 'Flammables locker ventilation, spill kits and SDS accessibility', projectId: 1, inspector: 'Sophie Dubois', location: 'Chemical store', scheduledDate: '2026-09-25', status: 'Scheduled', findingsCount: 0, actionsCount: 0, passedChecks: 12 },
    { id: 5, nr: 325, inspectionNumber: 'INSP-2026-005', type: 'Quarterly', description: 'Aerosol concentration check during ceiling drywall demolition', projectId: 2, inspector: 'Markus Vance', location: 'Amsterdam HQ - Block B', scheduledDate: '2026-09-20', status: 'Completed', findingsCount: 2, actionsCount: 4, passedChecks: 15 },
    { id: 6, nr: 324, inspectionNumber: 'INSP-2026-006', type: 'Werkbus', description: 'Fire extinguisher pressure checks and escape corridor clearance', projectId: 2, inspector: 'Sophie Dubois', location: 'Floor 3 - Atrium', scheduledDate: '2026-09-24', status: 'Scheduled', findingsCount: 1, actionsCount: 1, passedChecks: 19 },
    { id: 7, nr: 322, inspectionNumber: 'INSP-2026-007', type: 'Quarterly', description: 'Slings, shackles and ground load-bearing pad inspection', projectId: 1, inspector: 'Amir Patel', location: 'Crane pad Zone A', scheduledDate: '2026-09-12', status: 'Completed', findingsCount: 2, actionsCount: 3, passedChecks: 10 },
    { id: 8, nr: 320, inspectionNumber: 'INSP-2026-008', type: 'Quarterly', description: 'Dust extraction and ventilation performance test', projectId: 3, inspector: 'Jane Smith', location: 'Munich Warehouse Center', scheduledDate: '2026-09-19', status: 'Completed', findingsCount: 3, actionsCount: 5, passedChecks: 11 },
    { id: 9, nr: 318, inspectionNumber: 'INSP-2026-009', type: 'Monthly', description: 'Housekeeping and waste segregation round, all decks', projectId: 1, inspector: 'Sophie Dubois', location: 'Quay 4 - all bays', scheduledDate: '2026-08-28', status: 'Completed', findingsCount: 4, actionsCount: 4, passedChecks: 22 },
    { id: 10, nr: 317, inspectionNumber: 'INSP-2026-010', type: 'Monthly', description: 'PPE and fall-arrest register spot-check, crew B and C', projectId: 1, inspector: 'L. Hofman', location: 'Muster point 2', scheduledDate: '2026-08-14', status: 'Completed', findingsCount: 3, actionsCount: 3, passedChecks: 17 },
    { id: 11, nr: 316, inspectionNumber: 'INSP-2026-011', type: 'Pre-lift', description: 'Tower crane pre-lift rigging and ground condition check', projectId: 1, inspector: 'Tom Willemsen', location: 'Crane pad Zone A', scheduledDate: '2026-09-05', status: 'Completed', findingsCount: 1, actionsCount: 2, passedChecks: 12 },
    { id: 12, nr: 315, inspectionNumber: 'INSP-2026-012', type: 'Pre-lift', description: 'Mobile crane outrigger and sling certification review', projectId: 1, inspector: 'Amir Patel', location: 'Laydown area East', scheduledDate: '2026-07-30', status: 'Completed', findingsCount: 2, actionsCount: 2, passedChecks: 9 }
  ],
  // --- Incidents module (mirrors prod #/incidents: NR/DATE/TYPE/PROJECT/DESC/COMPANY/STATUS) ---
  incidents: [
    { id: 1, nr: 262, date: '2026-01-23', type: 'Accident (No Negligence)', projectId: 1, projectName: 'Shantanu Test Thursday', description: 'Ankle twist on uneven quay surface during night shift', companyName: 'Loggix Bouw', severity: 'Medium', findingsCount: 2, actionsCount: 3, status: 'Open', reporter: 'M. de Vries' },
    { id: 2, nr: 261, date: '2026-01-23', type: 'Dangerous Situation', projectId: 2, projectName: 'Test project 1', description: 'Unsecured cable tray above walkway, near-miss reported', companyName: 'Elektro Peters', severity: 'High', findingsCount: 1, actionsCount: 2, status: 'Open', reporter: 'Karim El Idrissi' },
    { id: 3, nr: 260, date: '2026-01-18', type: 'Near-miss', projectId: 1, projectName: 'Shantanu Test Thursday', description: 'Falling shackle from crane hook, exclusion zone held', companyName: 'Hijs & Transport BV', severity: 'High', findingsCount: 2, actionsCount: 2, status: 'In Review', reporter: 'Tom Willemsen' },
    { id: 4, nr: 259, date: '2026-01-10', type: 'Dangerous Situation', projectId: 1, projectName: 'Shantanu Test Thursday', description: 'Gas monitor alarm in confined sump, evacuated correctly', companyName: 'Scaffolding NL', severity: 'Critical', findingsCount: 3, actionsCount: 4, status: 'Open', reporter: 'L. Hofman' },
    { id: 5, nr: 258, date: '2025-12-20', type: 'Accident (No Negligence)', projectId: 3, projectName: 'Warehouse fit-out', description: 'Forklift mirror strike on racking, no injury', companyName: 'Loggix Bouw', severity: 'Low', findingsCount: 1, actionsCount: 1, status: 'Closed', reporter: 'Sven Bakker' },
    { id: 6, nr: 257, date: '2025-12-12', type: 'Near-miss', projectId: 2, projectName: 'Test project 1', description: 'Dust cloud above OEL during drywall cutting', companyName: 'Van Dijk Infra', severity: 'Medium', findingsCount: 1, actionsCount: 2, status: 'Closed', reporter: 'Bram Koster' },
    { id: 7, nr: 264, date: '2026-03-04', type: 'Near-miss', projectId: 1, projectName: 'Shantanu Test Thursday', description: 'Scaffold coupler dropped from second lift, no injury', companyName: 'Scaffolding NL', severity: 'Medium', findingsCount: 1, actionsCount: 2, status: 'Closed', reporter: 'Marc Dubois' },
    { id: 8, nr: 265, date: '2026-04-11', type: 'Dangerous Situation', projectId: 1, projectName: 'Shantanu Test Thursday', description: 'Temporary cable crossing walkway without ramp cover', companyName: 'Elektro Peters', severity: 'Medium', findingsCount: 2, actionsCount: 2, status: 'Closed', reporter: 'Amir Patel' },
    { id: 9, nr: 266, date: '2026-05-19', type: 'Near-miss', projectId: 1, projectName: 'Shantanu Test Thursday', description: 'Reversing telehandler near-miss with banksman out of position', companyName: 'Hijs & Transport BV', severity: 'High', findingsCount: 2, actionsCount: 3, status: 'In Review', reporter: 'Tom Willemsen' },
    { id: 10, nr: 267, date: '2026-06-22', type: 'Dangerous Situation', projectId: 1, projectName: 'Shantanu Test Thursday', description: 'Flammables locker left unlocked over weekend', companyName: 'Loggix Bouw', severity: 'High', findingsCount: 1, actionsCount: 2, status: 'Open', reporter: 'Sophie Dubois' },
    { id: 11, nr: 268, date: '2026-07-15', type: 'Near-miss', projectId: 1, projectName: 'Shantanu Test Thursday', description: 'Harness lanyard clipped to non-rated rail during inspection', companyName: 'Scaffolding NL', severity: 'Medium', findingsCount: 1, actionsCount: 1, status: 'Closed', reporter: 'L. Hofman' },
    { id: 12, nr: 269, date: '2026-08-09', type: 'Accident (No Negligence)', projectId: 1, projectName: 'Shantanu Test Thursday', description: 'Splinter injury during formwork stripping, first aid only', companyName: 'Loggix Bouw', severity: 'Low', findingsCount: 1, actionsCount: 1, status: 'Closed', reporter: 'Pieter de Jong' },
    { id: 13, nr: 270, date: '2026-09-02', type: 'Dangerous Situation', projectId: 1, projectName: 'Shantanu Test Thursday', description: 'Dust extraction hose detached in enclosed stairwell', companyName: 'Van Dijk Infra', severity: 'Medium', findingsCount: 2, actionsCount: 2, status: 'Open', reporter: 'Bram Koster' }
  ],
  // --- Findings module (mirrors prod #/findings: NR/TYPE/DATE/KIND/FINDING) ---
  findings: [
    { id: 1, nr: 586, type: 'Inspection', date: '2026-08-18', projectId: 1, projectName: 'Shantanu Test Thursday', kind: 'Scaffold check / INSP-2026-001', title: 'Missing toe-board on bay 4, second lift', reporter: 'Sophie Dubois', actionsCount: 2, status: 'Open' },
    { id: 2, nr: 585, type: 'Inspection', date: '2026-08-05', projectId: 1, projectName: 'Shantanu Test Thursday', kind: 'LOTO audit / INSP-2026-002', title: 'Distribution board earth-leakage sticker expired', reporter: 'Amir Patel', actionsCount: 1, status: 'Open' },
    { id: 3, nr: 576, type: 'Inspection', date: '2026-01-23', projectId: 2, projectName: 'Test project 1', kind: 'Schaftuimte / 330', title: 'Test finding - emergency exit blocked by pallets', reporter: 'Pratiksha P Dubale', actionsCount: 10, status: 'Open' },
    { id: 4, nr: 574, type: 'Inspection', date: '2026-01-21', projectId: 2, projectName: 'Test project 1', kind: 'Interne regels procedures zijn b...', title: 'abc - PPE register incomplete for subcontractor crew', reporter: 'Pratiksha P Dubale', actionsCount: 1, status: 'In Progress' },
    { id: 5, nr: 570, type: 'Inspection', date: '2025-11-10', projectId: 1, projectName: 'Shantanu Test Thursday', kind: 'Is de brdrjfswagen opgeruimd ...', title: 'Work bus housekeeping - oil spill kit missing', reporter: 'Shantanu ss Pujari', actionsCount: 0, status: 'Closed' },
    { id: 6, nr: 569, type: 'Incident', date: '2026-01-23', projectId: 1, projectName: 'Shantanu Test Thursday', kind: 'Incident 262 - ankle twist', title: 'Uneven surface lighting below 50 lux on quay', reporter: 'M. de Vries', actionsCount: 3, status: 'Open' },
    { id: 7, nr: 568, type: 'Incident', date: '2026-01-10', projectId: 1, projectName: 'Shantanu Test Thursday', kind: 'Incident 259 - gas alarm', title: 'Sump ventilation fan undersized for volume', reporter: 'L. Hofman', actionsCount: 4, status: 'Open' }
  ],
  siteCheckIns: [
    { id: 1, employeeId: 1, name: 'Tom Willemsen', company: 'Hijs & Transport BV', role: 'Machinist / Crane Operator', checkInTime: '06:45 AM', badgeNumber: 'SITE-081', certStatus: 'Valid', certName: 'Forklift & VCA-B', projectId: 1, status: 'On Site' },
    { id: 2, employeeId: 7, name: 'Pieter de Jong', company: 'Loggix Bouw', role: 'Carpenter & Formwork', checkInTime: '07:10 AM', badgeNumber: 'SITE-082', certStatus: 'Valid', certName: 'VCA-B & Heights', projectId: 1, status: 'On Site' },
    { id: 3, employeeId: 11, name: 'Marc Dubois', company: 'Scaffolding NL', role: 'Lead Scaffolder', checkInTime: '07:20 AM', badgeNumber: 'SITE-083', certStatus: 'Valid', certName: 'Working at Heights', projectId: 1, status: 'On Site' },
    { id: 4, employeeId: 12, name: 'M. de Vries', company: 'Loggix Bouw', role: 'Mechanical Supervisor', checkInTime: '07:30 AM', badgeNumber: 'SITE-084', certStatus: 'Valid', certName: 'VCA-B', projectId: 1, status: 'On Site' },
    { id: 5, employeeId: 13, name: 'L. Hofman', company: 'Apex Industrial Holdings', role: 'HSE Coordinator', checkInTime: '08:00 AM', badgeNumber: 'SITE-085', certStatus: 'Valid', certName: 'HSE Lead', projectId: 1, status: 'On Site' },
    { id: 6, employeeId: 4, name: 'Jeroen Lutmers', company: 'Loggix Bouw', role: 'Project Leader', checkInTime: '08:15 AM', badgeNumber: 'SITE-086', certStatus: 'Valid', certName: 'VCA-VOL', projectId: 1, status: 'On Site' },
    { id: 7, employeeId: 2, name: 'Sven Bakker', company: 'Loggix Bouw', role: 'Voorman', checkInTime: '07:00 AM', badgeNumber: 'SITE-101', certStatus: 'Expiring', certName: 'BHV Expiring', projectId: 2, status: 'On Site' },
    { id: 8, employeeId: 3, name: 'Karim El Idrissi', company: 'Elektro Peters', role: 'Elektromonteur', checkInTime: '07:15 AM', badgeNumber: 'SITE-102', certStatus: 'Valid', certName: 'NEN 3140', projectId: 2, status: 'On Site' },
    { id: 9, employeeId: 5, name: 'Bram Koster', company: 'Van Dijk Infra', role: 'Sloper', checkInTime: '07:30 AM', badgeNumber: 'SITE-103', certStatus: 'Valid', certName: 'Heights', projectId: 2, status: 'On Site' },
    { id: 10, employeeId: 6, name: 'Ria Smit', company: 'Dakwerken Jansen BV', role: 'Dakdekker', checkInTime: '07:45 AM', badgeNumber: 'SITE-104', certStatus: 'Valid', certName: 'VCA-B', projectId: 2, status: 'On Site' },
    { id: 11, employeeId: 8, name: 'Jan de Vries', company: 'SteelWorks BV', role: 'Lasser', checkInTime: '08:00 AM', badgeNumber: 'SITE-105', certStatus: 'Valid', certName: 'VCA-B & NEN 3140', projectId: 2, status: 'On Site' }
  ],
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
      status: "Active",
      reviews: [
        {
          id: 101,
          date: "2024-04-15",
          reviewer: "Sarah Jenkins",
          type: "Risk Assessment Review",
          notes: "Initial risk assessment review approved. Basic controls are sufficient.",
          nextReviewDate: "2025-04-15"
        }
      ]
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
      status: "Active",
      reviews: [
        {
          id: 102,
          date: "2025-08-22",
          reviewer: "Sarah Jenkins",
          type: "Risk Assessment Review",
          notes: "Periodic review. Ensure dust masks are stored properly and checked for seal integrity.",
          nextReviewDate: "2026-08-22"
        }
      ]
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
      status: "Restricted",
      reviews: [
        {
          id: 103,
          date: "2025-01-15",
          reviewer: "Sarah Jenkins",
          type: "Full Substance Review",
          notes: "Fuel store primer check and bunded tank integrity verified. No leakage found.",
          nextReviewDate: "2026-01-15"
        }
      ]
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
      status: "Draft",
      reviews: []
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
    const validPages = [
      'overview', 'dashboard', 'projects', 'assessments', 'hazards', 
      'project-list', 'new-assessment', 'review', 'compare', 'guide',
      'create-assessment', 'actions', 'review-queue', 'version-comparison',
      'archive', 'settings', 'reports', 'templates', 'risk-matrix', 'workflow',
      'tra-dashboard', 'new-tra', 'tra-details',
      'haz-substances-overview', 'haz-substances-register', 'haz-substances-add', 
      'haz-substances-detail', 'haz-substances-assessment',
      'training-overview', 'employee-certificates', 'image-to-base64',
      'permits-dashboard', 'permit-details', 'project-dashboard',
      'company-dashboard'
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
      reviews: substanceData.reviews || [],
      
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
  },

  conductSubstanceReview(substanceId, reviewData) {
    const sub = this.substances.find(s => s.id === parseInt(substanceId, 10));
    if (!sub) return;

    const reviewId = sub.reviews && sub.reviews.length > 0 ? Math.max(...sub.reviews.map(r => r.id)) + 1 : 101;
    const today = new Date().toISOString().split('T')[0];

    const newReview = {
      id: reviewId,
      date: today,
      reviewer: reviewData.reviewer || 'Senior Safety Inspector',
      type: reviewData.type || 'Full Substance Audit',
      notes: reviewData.notes || '',
      nextReviewDate: reviewData.nextReviewDate
    };

    if (!sub.reviews) sub.reviews = [];
    sub.reviews.unshift(newReview);

    if (sub.status === 'Draft') {
      sub.status = 'Active';
    }

    if (reviewData.type === 'SDS Review') {
      sub.sds.revisionDate = today;
      sub.sds.nextReviewDate = reviewData.nextReviewDate;
      sub.sds.status = 'Current';
    } else if (reviewData.type === 'Risk Assessment Review') {
      sub.riskAssessment.lastReviewedDate = today;
      sub.riskAssessment.nextReviewDate = reviewData.nextReviewDate;
      if (sub.riskAssessment.status === 'Review Required' || sub.riskAssessment.status === 'Required') {
        sub.riskAssessment.status = 'Approved';
      }
    } else {
      sub.sds.revisionDate = today;
      sub.sds.nextReviewDate = reviewData.nextReviewDate;
      sub.sds.status = 'Current';

      sub.riskAssessment.lastReviewedDate = today;
      sub.riskAssessment.nextReviewDate = reviewData.nextReviewDate;
      if (sub.riskAssessment.status === 'Review Required' || sub.riskAssessment.status === 'Required') {
        sub.riskAssessment.status = 'Approved';
      }
    }

    this.addToast(`Safety review logged for "${sub.name}".`, 'success');
  },

  conductAssessmentReview(reviewId, auditNotes, upgradeVersion) {
    const rev = this.reviews.find(r => r.id === parseInt(reviewId, 10));
    if (!rev) return;

    rev.status = 'Completed';
    rev.conductedDate = new Date().toISOString().split('T')[0];
    rev.notes = auditNotes;

    if (upgradeVersion) {
      this.publishReviewedVersion(rev.assessmentId, auditNotes);
    } else {
      this.addToast(`Assessment "${rev.assessmentName}" review signed off.`, 'success');
    }
  },

  // --- TRAINING & CERTIFICATE ACTIONS ---
  updateCertificateStatus(cert) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(cert.expiresOn);
    expiry.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      cert.status = 'Expired';
    } else if (diffDays <= 90) {
      cert.status = 'Expiring';
    } else {
      cert.status = 'Valid';
    }
    return cert.status;
  },

  addCertificate(employeeId, certData) {
    const typeId = certData.typeId;
    let validityMonths = 12;
    if (typeId === 'custom') {
      validityMonths = parseInt(certData.customValidityMonths, 10) || 12;
    } else {
      const type = this.certificateTypes.find(t => t.id === typeId);
      if (type) validityMonths = type.validityMonths;
    }

    const issued = new Date(certData.issuedOn);
    const expires = new Date(issued);
    expires.setMonth(expires.getMonth() + validityMonths);
    const expiresOn = expires.toISOString().split('T')[0];

    const newId = this.certificates.length > 0 ? Math.max(...this.certificates.map(c => c.id)) + 1 : 1;
    
    const newCert = {
      id: newId,
      employeeId: parseInt(employeeId, 10),
      typeId: typeId === 'custom' ? 'custom' : typeId,
      customName: typeId === 'custom' ? certData.customName : null,
      certificateNumber: certData.certificateNumber,
      issuer: certData.issuer,
      issuedOn: certData.issuedOn,
      expiresOn: expiresOn,
      status: 'Valid',
      history: []
    };

    this.updateCertificateStatus(newCert);
    this.certificates.push(newCert);

    const emp = this.employees.find(e => e.id === parseInt(employeeId, 10));
    const certName = typeId === 'custom' ? certData.customName : this.certificateTypes.find(t => t.id === typeId)?.name;
    this.addToast(`Certificate "${certName}" assigned to ${emp?.name || 'employee'}.`, 'success');
  },

  renewCertificate(certId, renewData) {
    const cert = this.certificates.find(c => c.id === parseInt(certId, 10));
    if (!cert) return;

    if (!cert.history) cert.history = [];
    cert.history.push({
      certificateNumber: cert.certificateNumber,
      issuer: cert.issuer,
      issuedOn: cert.issuedOn,
      expiresOn: cert.expiresOn,
      renewedAt: new Date().toISOString().split('T')[0]
    });

    cert.certificateNumber = renewData.certificateNumber;
    cert.issuer = renewData.issuer;
    cert.issuedOn = renewData.issuedOn;

    let validityMonths = 12;
    if (cert.typeId === 'custom') {
      validityMonths = parseInt(renewData.customValidityMonths, 10) || 12;
      if (renewData.customName) cert.customName = renewData.customName;
    } else {
      const type = this.certificateTypes.find(t => t.id === cert.typeId);
      if (type) validityMonths = type.validityMonths;
    }

    const issued = new Date(renewData.issuedOn);
    const expires = new Date(issued);
    expires.setMonth(expires.getMonth() + validityMonths);
    cert.expiresOn = expires.toISOString().split('T')[0];

    this.updateCertificateStatus(cert);

    const emp = this.employees.find(e => e.id === cert.employeeId);
    const certName = cert.typeId === 'custom' ? cert.customName : this.certificateTypes.find(t => t.id === cert.typeId)?.name;
    this.addToast(`Certificate "${certName}" renewed for ${emp?.name || 'employee'}.`, 'success');
  },

  deleteCertificate(certId) {
    const certIndex = this.certificates.findIndex(c => c.id === parseInt(certId, 10));
    if (certIndex === -1) return;

    const cert = this.certificates[certIndex];
    const certName = cert.typeId === 'custom' ? cert.customName : this.certificateTypes.find(t => t.id === cert.typeId)?.name;
    
    this.certificates.splice(certIndex, 1);
    this.addToast(`Certificate "${certName}" has been removed.`, 'warning');
  },

  getProjectCompliance(projectId) {
    const projId = parseInt(projectId, 10);
    const workers = this.employees.filter(e => e.projectIds.includes(projId));
    if (workers.length === 0) return { workersCount: 0, gaps: 0, percentage: 100 };

    const requirements = this.projectRequirements[projId] || ['vca-b'];
    let totalRequirements = workers.length * requirements.length;
    let gaps = 0;

    workers.forEach(w => {
      const wCerts = this.certificates.filter(c => c.employeeId === w.id);
      
      requirements.forEach(req => {
        const hasCert = wCerts.some(c => {
          const status = this.updateCertificateStatus(c);
          if (status === 'Expired') return false;

          if (c.typeId === req) return true;

          const certType = this.certificateTypes.find(t => t.id === c.typeId);
          if (certType && certType.satisfies === req) return true;

          return false;
        });

        if (!hasCert) {
          gaps++;
        }
      });
    });

    const percentage = totalRequirements > 0 ? Math.round(((totalRequirements - gaps) / totalRequirements) * 100) : 100;
    return {
      workersCount: workers.length,
      gaps,
      percentage
    };
  },

  addEmployee(empData) {
    const newId = this.employees.length > 0 ? Math.max(...this.employees.map(e => e.id)) + 1 : 1;
    const newEmp = {
      id: newId,
      name: empData.name,
      role: empData.role,
      company: empData.company,
      projectIds: empData.projectIds || []
    };
    this.employees.push(newEmp);
    this.addToast(`Employee "${empData.name}" has been added successfully.`, 'success');
  },

  addPermit(permitData) {
    const nextId = this.permits.length > 0 ? Math.max(...this.permits.map(p => p.id)) + 1 : 1;
    const permitNumber = `PTW-${String(nextId).padStart(4, '0')}`;
    
    // Find project name
    const project = this.projects.find(p => p.id === parseInt(permitData.projectId, 10));
    const projName = project ? project.name : 'Unknown Project';

    // Find holder name
    const employee = permitData.holderId ? this.employees.find(e => e.id === parseInt(permitData.holderId, 10)) : null;
    const empName = employee ? employee.name : 'Unassigned';

    const newPermit = {
      id: nextId,
      permitNumber,
      type: permitData.type,
      title: permitData.title,
      location: permitData.location || '',
      projectId: parseInt(permitData.projectId, 10),
      projectName: projName,
      requestedBy: permitData.requestedBy,
      holderId: employee ? employee.id : null,
      holderName: empName,
      approvedBy: permitData.approvedBy || '',
      validFrom: permitData.validFrom,
      validTo: permitData.validTo,
      status: 'Awaiting Approval',
      requiredCertificateIds: permitData.requiredCertificateIds || [],
      precautions: (permitData.precautions || []).map((p, idx) => ({
        id: idx + 1,
        description: p.description || p,
        confirmed: false
      })),
      timeline: [
        { 
          status: 'Created', 
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), 
          by: permitData.requestedBy 
        }
      ]
    };

    this.permits.push(newPermit);
    this.addToast(`Work Permit "${newPermit.title}" created. Awaiting approval.`, 'success');
    this.navigateTo('permits-dashboard');
    return newPermit;
  },

  togglePrecaution(permitId, precautionId) {
    const permit = this.permits.find(p => p.id === parseInt(permitId, 10));
    if (!permit) return;
    const precaution = permit.precautions.find(p => p.id === parseInt(precautionId, 10));
    if (precaution) {
      precaution.confirmed = !precaution.confirmed;
    }
  },

  approvePermit(permitId, approvedBy) {
    const permit = this.permits.find(p => p.id === parseInt(permitId, 10));
    if (!permit) return;
    permit.status = 'Active';
    permit.approvedBy = approvedBy || 'L. Hofman';
    if (!permit.timeline) permit.timeline = [];
    permit.timeline.unshift({
      status: 'Active',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      by: approvedBy || 'L. Hofman'
    });
    this.addToast(`Work Permit "${permit.title}" has been approved and is now Active.`, 'success');
  },

  closePermit(permitId, closedBy) {
    const permit = this.permits.find(p => p.id === parseInt(permitId, 10));
    if (!permit) return;
    permit.status = 'Closed';
    if (!permit.timeline) permit.timeline = [];
    permit.timeline.unshift({
      status: 'Closed',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      by: closedBy || 'Shantanu'
    });
    this.addToast(`Work Permit "${permit.title}" has been closed.`, 'warning');
  },

  assignPermit(permitId, employeeId) {
    const permit = this.permits.find(p => p.id === parseInt(permitId, 10));
    if (!permit) return;
    
    if (employeeId === 'null' || !employeeId) {
      const oldHolder = permit.holderName;
      permit.holderId = null;
      permit.holderName = 'Unassigned';
      permit.assignedEmployeeIds = [];
      if (!permit.timeline) permit.timeline = [];
      permit.timeline.unshift({
        status: 'Reassigned',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        by: 'System'
      });
      this.addToast(`Work Permit is now Unassigned.`, 'info');
      return;
    }

    const employee = this.employees.find(e => e.id === parseInt(employeeId, 10));
    if (!employee) return;
    
    const oldHolder = permit.holderName;
    permit.holderId = employee.id;
    permit.holderName = employee.name;
    permit.assignedEmployeeIds = [employee.id];

    if (!permit.timeline) permit.timeline = [];
    permit.timeline.unshift({
      status: 'Reassigned',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      by: 'System'
    });

    this.addToast(`Work Permit reassigned to ${employee.name}.`, 'success');
  },

  assignEmployeeToPermit(permitId, employeeId) {
    const permit = this.permits.find(p => p.id === parseInt(permitId, 10));
    if (!permit) return;
    if (!permit.assignedEmployeeIds) permit.assignedEmployeeIds = [];
    
    const empId = parseInt(employeeId, 10);
    if (permit.assignedEmployeeIds.includes(empId)) return;
    
    const employee = this.employees.find(e => e.id === empId);
    if (!employee) return;
    
    permit.assignedEmployeeIds.push(empId);
    
    // Update legacy single holder for backward compatibility
    permit.holderId = empId;
    permit.holderName = employee.name;

    if (!permit.timeline) permit.timeline = [];
    permit.timeline.unshift({
      status: 'Worker Assigned',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      by: 'System'
    });

    this.addToast(`${employee.name} assigned to work permit.`, 'success');
  },

  removeEmployeeFromPermit(permitId, employeeId) {
    const permit = this.permits.find(p => p.id === parseInt(permitId, 10));
    if (!permit) return;
    if (!permit.assignedEmployeeIds) permit.assignedEmployeeIds = [];
    
    const empId = parseInt(employeeId, 10);
    permit.assignedEmployeeIds = permit.assignedEmployeeIds.filter(id => id !== empId);
    
    const employee = this.employees.find(e => e.id === empId);
    const name = employee ? employee.name : 'Worker';

    // Update legacy single holder for backward compatibility
    if (permit.assignedEmployeeIds.length > 0) {
      const nextEmp = this.employees.find(e => e.id === permit.assignedEmployeeIds[0]);
      permit.holderId = nextEmp ? nextEmp.id : null;
      permit.holderName = nextEmp ? nextEmp.name : 'Unassigned';
    } else {
      permit.holderId = null;
      permit.holderName = 'Unassigned';
    }

    if (!permit.timeline) permit.timeline = [];
    permit.timeline.unshift({
      status: 'Worker Removed',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      by: 'System'
    });

    this.addToast(`${name} removed from permit.`, 'warning');
  },

  // --- Project Dashboard Helpers ---
  toggleActionStatus(actionId) {
    const act = this.actions.find(a => a.id === actionId);
    if (!act) return;
    if (act.status === 'Completed') {
      act.status = 'In Progress';
      this.addToast(`Action #${act.id} marked as In Progress.`, 'info');
    } else {
      act.status = 'Completed';
      this.addToast(`Action #${act.id} marked as Completed!`, 'success');
    }
  },

  getProjectEquipment(projectId) {
    if (!projectId || projectId === 'all') return this.equipment || [];
    const pId = parseInt(projectId, 10);
    return (this.equipment || []).filter(e => e.projectId === pId);
  },

  getProjectInspections(projectId) {
    if (!projectId || projectId === 'all') return this.inspections || [];
    const pId = parseInt(projectId, 10);
    return (this.inspections || []).filter(i => i.projectId === pId);
  },

  getProjectCheckIns(projectId) {
    if (!projectId || projectId === 'all') return this.siteCheckIns || [];
    const pId = parseInt(projectId, 10);
    return (this.siteCheckIns || []).filter(c => c.projectId === pId);
  },

  getProjectIncidents(projectId) {
    if (!projectId || projectId === 'all') return this.incidents || [];
    const pId = parseInt(projectId, 10);
    return (this.incidents || []).filter(i => i.projectId === pId);
  },

  getProjectFindings(projectId) {
    if (!projectId || projectId === 'all') return this.findings || [];
    const pId = parseInt(projectId, 10);
    return (this.findings || []).filter(f => f.projectId === pId);
  },

  addIncident(data) {
    const nextId = this.incidents.length > 0 ? Math.max(...this.incidents.map(i => i.id)) + 1 : 1;
    const nextNr = Math.max(...this.incidents.map(i => i.nr)) + 1;
    const project = this.projects.find(p => p.id === parseInt(data.projectId, 10));
    this.incidents.unshift({
      id: nextId, nr: nextNr, date: new Date().toISOString().split('T')[0],
      type: data.type || 'Dangerous Situation', projectId: parseInt(data.projectId, 10),
      projectName: project ? project.name : '', description: data.description || '',
      companyName: data.companyName || '', severity: data.severity || 'Medium',
      findingsCount: 0, actionsCount: 0, status: 'Open', reporter: data.reporter || 'Current User'
    });
    this.addToast(`Incident #${nextNr} reported.`, 'success');
  },

  addFinding(data) {
    const nextId = this.findings.length > 0 ? Math.max(...this.findings.map(f => f.id)) + 1 : 1;
    const nextNr = Math.max(...this.findings.map(f => f.nr)) + 1;
    const project = this.projects.find(p => p.id === parseInt(data.projectId, 10));
    this.findings.unshift({
      id: nextId, nr: nextNr, type: data.type || 'Inspection', date: new Date().toISOString().split('T')[0],
      projectId: parseInt(data.projectId, 10), projectName: project ? project.name : '',
      kind: data.kind || '', title: data.title || '', reporter: data.reporter || 'Current User',
      actionsCount: 0, status: 'Open'
    });
    this.addToast(`Finding #${nextNr} registered.`, 'success');
  },

  getProjectIncidentDistribution(projectId) {
    const list = this.getProjectIncidents(projectId);
    if (!list || list.length === 0) return [];
    const colors = { 'Accident (No Negligence)': '#ef4444', 'Dangerous Situation': '#f97316', 'Near-miss': '#eab308', 'Inspection': '#0284c7' };
    const map = {};
    list.forEach(i => { map[i.type] = (map[i.type] || 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value, color: colors[label] || '#8b5cf6' }));
  },

  getProjectInspectionDistribution(projectId) {
    const list = this.getProjectInspections(projectId);
    if (!list || list.length === 0) return [];
    // Group by inspection type: Passed vs Findings
    const map = {};
    list.forEach(i => {
      const key = i.type || 'General';
      if (!map[key]) map[key] = { category: key, passed: 0, findings: 0 };
      map[key].passed += i.passedChecks || 0;
      map[key].findings += i.findingsCount || 0;
    });
    return Object.values(map).slice(0, 5);
  },

  // --- Company Dashboard Helpers ---
  getCompany(companyId) {
    if (!companyId) return this.companies[0];
    const cId = parseInt(companyId, 10);
    return this.companies.find(c => c.id === cId) || this.companies[0];
  },

  getCompanyEmployees(companyId) {
    const comp = this.getCompany(companyId);
    if (!comp) return [];
    return this.employees.filter(e => {
      const eComp = (e.company || '').toLowerCase();
      const cName = (comp.name || '').toLowerCase();
      const cDisplay = (comp.displayName || '').toLowerCase();
      return eComp.includes(cDisplay) || cName.includes(eComp);
    });
  },

  getCompanyProjects(companyId) {
    const compEmployees = this.getCompanyEmployees(companyId);
    const pIds = new Set();
    compEmployees.forEach(e => {
      (e.projectIds || []).forEach(id => pIds.add(id));
    });
    // If no direct projectIds, default to first 2 projects
    if (pIds.size === 0) {
      pIds.add(1);
      pIds.add(2);
    }
    return this.projects.filter(p => pIds.has(p.id));
  },

  getCompanyDocuments(companyId) {
    const cId = parseInt(companyId, 10);
    return (this.companyDocuments || []).filter(d => d.companyId === cId);
  },

  getCompanyPermits(companyId) {
    const compEmployees = this.getCompanyEmployees(companyId);
    const empIds = new Set(compEmployees.map(e => e.id));
    return (this.permits || []).filter(p => {
      if (p.holderId && empIds.has(p.holderId)) return true;
      if (p.assignedEmployeeIds && p.assignedEmployeeIds.some(id => empIds.has(id))) return true;
      return false;
    });
  },

  getCompanyCertStats(companyId) {
    const compEmployees = this.getCompanyEmployees(companyId);
    const empIds = new Set(compEmployees.map(e => e.id));
    const certs = (this.certificates || []).filter(c => empIds.has(c.employeeId));

    const valid = certs.filter(c => c.status === 'Valid').length;
    const expiring = certs.filter(c => c.status === 'Expiring').length;
    const expired = certs.filter(c => c.status === 'Expired').length;
    const total = certs.length;

    const rate = total > 0 ? Math.round((valid / total) * 100) : 100;
    return {
      valid,
      expiring,
      expired,
      total,
      rate,
      chartData: [
        { label: 'Valid / Compliant', value: valid || 4, color: '#10b981' },
        { label: 'Expiring Soon (<60d)', value: expiring || 1, color: '#f59e0b' },
        { label: 'Expired / Action Needed', value: expired || 0, color: '#ef4444' }
      ]
    };
  },

  addCompanyDocument(doc) {
    const newDoc = {
      id: Date.now(),
      companyId: doc.companyId || 1,
      title: doc.title,
      category: doc.category || 'General Compliance',
      documentNumber: doc.documentNumber || `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      fileName: doc.fileName || 'Uploaded_Document.pdf',
      fileSize: '1.8 MB',
      issuedDate: new Date().toISOString().split('T')[0],
      validUntil: doc.validUntil || '2027-01-01',
      status: 'Verified',
      uploadedBy: 'Current User',
      reviewer: 'HSE Compliance Lead',
      verifiedAt: new Date().toISOString().split('T')[0]
    };
    if (!this.companyDocuments) this.companyDocuments = [];
    this.companyDocuments.unshift(newDoc);
    this.addToast(`Document "${newDoc.title}" uploaded and verified successfully!`, 'success');
  }
});

// Initialize assignedEmployeeIds for mock permits
if (store.permits) {
  store.permits.forEach(p => {
    if (!p.assignedEmployeeIds) {
      p.assignedEmployeeIds = p.holderId ? [p.holderId] : [];
    }
  });
}

// Hash sync listener
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    store.syncRouteFromHash();
  });
  store.syncRouteFromHash();
}
export default store;
