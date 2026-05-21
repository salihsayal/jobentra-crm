export const mockCustomers = [
  { id: 'c1', companyName: 'Mercedes-Benz AG', contactPerson: 'Dr. Klaus Weber', email: 'k.weber@mercedes.de', phone: '+49 711 170', industry: 'Automotive', status: 'ACTIVE', isArchived: false },
  { id: 'c2', companyName: 'Siemens Healthineers', contactPerson: 'Anna Müller', email: 'a.mueller@siemens.de', phone: '+49 9131 180', industry: 'Healthcare', status: 'ACTIVE', isArchived: false },
  { id: 'c3', companyName: 'Deutsche Bank', contactPerson: 'Thomas Schmidt', email: 't.schmidt@db.com', phone: '+49 69 9100', industry: 'Finance', status: 'LEAD', isArchived: false },
  { id: 'c4', companyName: 'SAP SE', contactPerson: 'Laura Fischer', email: 'l.fischer@sap.com', phone: '+49 6227 7474', industry: 'Technology', status: 'ACTIVE', isArchived: false },
  { id: 'c5', companyName: 'Bosch Rexroth', contactPerson: 'Martin Schulz', email: 'm.schulz@bosch.de', phone: '+49 9352 180', industry: 'Manufacturing', status: 'INACTIVE', isArchived: false },
  { id: 'c6', companyName: 'Allianz SE', contactPerson: 'Petra Wagner', email: 'p.wagner@allianz.de', phone: '+49 89 38000', industry: 'Insurance', status: 'LEAD', isArchived: false },
  { id: 'c7', companyName: 'Adidas AG', contactPerson: 'Jan Becker', email: 'j.becker@adidas.com', phone: '+49 9132 840', industry: 'Retail', status: 'ACTIVE', isArchived: false },
  { id: 'c8', companyName: 'Lufthansa Technik', contactPerson: 'Sabine Koch', email: 's.koch@lht.dlh.de', phone: '+49 40 50700', industry: 'Aviation', status: 'ACTIVE', isArchived: false },
];

export const mockCandidates = [
  { id: 'ca1', firstName: 'Maximilian', lastName: 'Hoffmann', email: 'm.hoffmann@email.de', phone: '+49 170 1234567', status: 'IN_PROCESS', skills: ['Java', 'Spring Boot', 'AWS', 'Kubernetes'], isArchived: false },
  { id: 'ca2', firstName: 'Sophie', lastName: 'Bauer', email: 's.bauer@email.de', phone: '+49 151 9876543', status: 'NEW', skills: ['Python', 'TensorFlow', 'PyTorch', 'MLOps'], isArchived: false },
  { id: 'ca3', firstName: 'Lukas', lastName: 'Krüger', email: 'l.krueger@email.de', phone: '+49 173 5551234', status: 'PLACED', skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'], isArchived: false },
  { id: 'ca4', firstName: 'Hannah', lastName: 'Schneider', email: 'h.schneider@email.de', phone: '+49 162 3456789', status: 'IN_PROCESS', skills: ['SAP', 'ABAP', 'Fiori', 'HANA'], isArchived: false },
  { id: 'ca5', firstName: 'Felix', lastName: 'Wagner', email: 'f.wagner@email.de', phone: '+49 176 1112233', status: 'REJECTED', skills: ['C++', 'Qt', 'Embedded', 'Linux'], isArchived: false },
  { id: 'ca6', firstName: 'Emma', lastName: 'Zimmermann', email: 'e.zimmermann@email.de', phone: '+49 157 4445566', status: 'NEW', skills: ['Data Science', 'R', 'SQL', 'Tableau'], isArchived: false },
  { id: 'ca7', firstName: 'Jonas', lastName: 'Schäfer', email: 'j.schaefer@email.de', phone: '+49 171 7778899', status: 'IN_PROCESS', skills: ['DevOps', 'Docker', 'Jenkins', 'Terraform'], isArchived: false },
  { id: 'ca8', firstName: 'Mia', lastName: 'Koch', email: 'm.koch@email.de', phone: '+49 179 2223344', status: 'NEW', skills: ['UX Design', 'Figma', 'Sketch', 'User Research'], isArchived: false },
];

export const mockJobs = [
  { id: 'j1', title: 'Senior Java Entwickler', customerName: 'Mercedes-Benz AG', status: 'OPEN', salaryRange: '75.000 - 95.000 EUR', isArchived: false },
  { id: 'j2', title: 'Data Scientist', customerName: 'Siemens Healthineers', status: 'OPEN', salaryRange: '65.000 - 85.000 EUR', isArchived: false },
  { id: 'j3', title: 'Frontend Architect', customerName: 'SAP SE', status: 'DRAFT', salaryRange: '80.000 - 100.000 EUR', isArchived: false },
  { id: 'j4', title: 'DevOps Engineer', customerName: 'Adidas AG', status: 'OPEN', salaryRange: '70.000 - 90.000 EUR', isArchived: false },
  { id: 'j5', title: 'Embedded Systems Engineer', customerName: 'Bosch Rexroth', status: 'CLOSED', salaryRange: '68.000 - 88.000 EUR', isArchived: false },
  { id: 'j6', title: 'Cloud Architect', customerName: 'Deutsche Bank', status: 'OPEN', salaryRange: '90.000 - 120.000 EUR', isArchived: false },
  { id: 'j7', title: 'SAP Berater', customerName: 'Allianz SE', status: 'DRAFT', salaryRange: '60.000 - 80.000 EUR', isArchived: false },
  { id: 'j8', title: 'Full-Stack Developer', customerName: 'Lufthansa Technik', status: 'OPEN', salaryRange: '65.000 - 85.000 EUR', isArchived: false },
];

export const mockBillings = [
  { id: 'b1', invoiceNumber: 'INV-2025-0042', customerName: 'Mercedes-Benz AG', candidateName: 'Maximilian Hoffmann', amount: 15000.00, currency: 'EUR', status: 'PAID', dueDate: '2025-03-15', isArchived: false },
  { id: 'b2', invoiceNumber: 'INV-2025-0043', customerName: 'Siemens Healthineers', candidateName: 'Lukas Krüger', amount: 22500.00, currency: 'EUR', status: 'SENT', dueDate: '2025-06-01', isArchived: false },
  { id: 'b3', invoiceNumber: 'INV-2025-0044', customerName: 'Adidas AG', candidateName: null, amount: 8500.00, currency: 'EUR', status: 'DRAFT', dueDate: null, isArchived: false },
  { id: 'b4', invoiceNumber: 'INV-2025-0045', customerName: 'SAP SE', candidateName: 'Hannah Schneider', amount: 30000.00, currency: 'EUR', status: 'PAID', dueDate: '2025-04-01', isArchived: false },
  { id: 'b5', invoiceNumber: 'INV-2025-0046', customerName: 'Bosch Rexroth', candidateName: null, amount: 12000.00, currency: 'EUR', status: 'CANCELLED', dueDate: null, isArchived: false },
  { id: 'b6', invoiceNumber: 'INV-2025-0047', customerName: 'Lufthansa Technik', candidateName: 'Sophie Bauer', amount: 18000.00, currency: 'EUR', status: 'SENT', dueDate: '2025-07-15', isArchived: false },
];

const STORAGE_KEY = 'jobentra-mock-data';

function loadFromStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveAllMockData() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      customers: mockCustomers,
      candidates: mockCandidates,
      jobs: mockJobs,
      billings: mockBillings,
    }));
  } catch { /* quota or unavailable */ }
}

export function restoreFromStorage() {
  const saved = loadFromStorage();
  if (!saved) return false;
  if (saved.customers) { mockCustomers.length = 0; mockCustomers.push(...saved.customers); }
  if (saved.candidates) { mockCandidates.length = 0; mockCandidates.push(...saved.candidates); }
  if (saved.jobs) { mockJobs.length = 0; mockJobs.push(...saved.jobs); }
  if (saved.billings) { mockBillings.length = 0; mockBillings.push(...saved.billings); }
  return true;
}

export function resetAllMockData() {
  localStorage.removeItem(STORAGE_KEY);
  if (typeof window !== 'undefined') window.location.reload();
}

export function searchAllEntities(query) {
  const q = query.toLowerCase().trim();
  if (!q) return { customers: [], candidates: [], jobs: [] };

  return {
    customers: mockCustomers.filter(c =>
      c.companyName.toLowerCase().includes(q) ||
      c.contactPerson?.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q)
    ),
    candidates: mockCandidates.filter(c =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.skills?.some(s => s.toLowerCase().includes(q))
    ),
    jobs: mockJobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.customerName.toLowerCase().includes(q) ||
      j.salaryRange?.toLowerCase().includes(q)
    ),
  };
}
