export type RoleCode = 'SEV_ADMIN' | 'FACTORY_MANAGER' | 'DEPT_OWNER' | 'STAFF';

export type ModuleKey =
  | 'control-tower'
  | 'scorecard'
  | 'risks'
  | 'documents'
  | 'audits'
  | 'nc-capa'
  | 'standards'
  | 'rbac'
  | 'ai-assistant';

export interface Factory {
  id: string;
  code: string;
  name: string;
  location: string;
  country: string;
  headcount: number;
  isoManager: string;
  activeStandards: string[];
  riskProfile: 'Low' | 'Medium' | 'High' | 'Critical';
  lastAuditDate: string;
  nextAuditDate: string;
}

export interface ISOClause {
  id: string;
  standardId: string;
  clauseCode: string;
  title: string;
  category: string;
  weight: number;
  riskCriticality: 'Standard' | 'High' | 'Critical';
  description: string;
}

export interface ISOStandard {
  id: string;
  code: string;
  name: string;
  version: string;
  isDynamicEnabled: boolean;
  clauses: ISOClause[];
}

export interface ISODocument {
  id: string;
  docCode: string;
  title: string;
  docType: 'SOP' | 'WI' | 'Manual' | 'Form' | 'Control Plan';
  standardId: string;
  clauseCode: string;
  factoryScope: string; // 'ALL' or factoryId
  version: string;
  owner: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Obsolete';
  updatedAt: string;
  nextReviewDate: string;
}

export interface SelfAssessment {
  id: string;
  factoryId: string;
  standardId: string;
  clauseId: string;
  clauseCode: string;
  period: string;
  selfScore: number; // 0-100
  status: 'Compliant' | 'Partial' | 'Gap Identified';
  notes: string;
  assessedBy: string;
  updatedAt: string;
}

export interface EvidenceRecord {
  id: string;
  title: string;
  factoryId: string;
  standardId: string;
  clauseCode: string;
  linkedType: 'SelfAssessment' | 'AuditChecklist' | 'CAPA';
  linkedId: string;
  fileName: string;
  fileSizeKb: number;
  uploadedBy: string;
  uploadedAt: string;
  verified: boolean;
}

export interface RiskItem {
  id: string;
  factoryId: string;
  processName: string;
  standardId: string;
  clauseCode: string;
  title: string;
  description: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  riskScore: number; // 1-25
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  mitigationPlan: string;
  owner: string;
  auditFrequency: '3 tháng/lần' | '6 tháng/lần' | '12 tháng/lần';
  status: 'Open' | 'Mitigating' | 'Controlled';
  updatedAt: string;
}

export interface AuditChecklistItem {
  id: string;
  auditId: string;
  clauseId: string;
  clauseCode: string;
  clauseTitle: string;
  weight: number;
  result: 'Pending' | 'Compliant' | 'OFI' | 'Minor NC' | 'Major NC';
  auditorNote: string;
  evidenceRef: string;
}

export interface AuditProgram {
  id: string;
  auditCode: string;
  factoryId: string;
  standardId: string;
  auditType: 'Risk-Based Scheduled' | 'Surveillance' | 'Follow-up' | 'Unannounced';
  riskTriggerLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  leadAuditor: string;
  plannedDate: string;
  status: 'Planned' | 'In Progress' | 'Completed';
  checklist: AuditChecklistItem[];
}

export interface NonConformity {
  id: string;
  ncCode: string;
  factoryId: string;
  auditId: string;
  standardId: string;
  clauseCode: string;
  severity: 'Major NC' | 'Minor NC' | 'OFI';
  title: string;
  findingDescription: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  owner: string;
  dueDate: string;
  status: 'Open' | 'CAPA Submitted' | 'Implemented' | 'Verified' | 'Closed';
  effectivenessResult: 'Pending' | 'Effective' | 'Ineffective';
  verifiedBy: string;
  createdAt: string;
  closedAt?: string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: RoleCode;
  assignedFactoryId: string | 'ALL';
  department: string;
  active: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: RoleCode;
  factoryId: string;
  module: string;
  action: string;
  detail: string;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: 'Critical' | 'Warning' | 'Info';
  enabled: boolean;
  triggeredCount: number;
}

export interface FactoryScorecard {
  factoryId: string;
  factoryCode: string;
  factoryName: string;
  rank: number;
  grade: 'A+' | 'A' | 'B' | 'C';
  hybridScore: number;
  selfAssessmentScore: number;
  auditComplianceScore: number;
  capaClosureScore: number;
  evidenceScore: number;
  penaltyPoints: number;
  openMajorNcs: number;
  openMinorNcs: number;
  highRiskCount: number;
  recommendedCadence: '3 tháng/lần' | '6 tháng/lần' | '12 tháng/lần';
}

export interface CentralDatabaseState {
  factories: Factory[];
  standards: ISOStandard[];
  documents: ISODocument[];
  assessments: SelfAssessment[];
  evidences: EvidenceRecord[];
  risks: RiskItem[];
  audits: AuditProgram[];
  ncs: NonConformity[];
  users: UserAccount[];
  auditLogs: AuditLogEntry[];
  alertRules: AlertRule[];
  scorecards?: FactoryScorecard[];
}
