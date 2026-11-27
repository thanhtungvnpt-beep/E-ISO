import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createSeedData } from './server/seedData.ts';
import { computeAuditCadence, computeRiskLevel, computeScorecards } from './server/scoring.ts';
import type {
  AuditChecklistItem,
  AuditProgram,
  CentralDatabaseState,
  EvidenceRecord,
  ISODocument,
  NonConformity,
  RiskItem,
  RoleCode,
  SelfAssessment,
} from './src/types/iso.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'iso-db.json');

function loadDb(): CentralDatabaseState {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seeded = createSeedData();
    fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as CentralDatabaseState;
  } catch {
    const seeded = createSeedData();
    fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
}

function saveDb(state: CentralDatabaseState): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const toSave = { ...state };
  delete toSave.scorecards;
  fs.writeFileSync(DB_PATH, JSON.stringify(toSave, null, 2), 'utf-8');
}

function formatNow(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function appendLog(
  db: CentralDatabaseState,
  actorName: string,
  actorRole: RoleCode,
  factoryId: string,
  module: string,
  action: string,
  detail: string
) {
  db.auditLogs.unshift({
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: formatNow(),
    actorName: actorName || 'System Admin',
    actorRole: actorRole || 'SEV_ADMIN',
    factoryId: factoryId || 'ALL',
    module,
    action,
    detail,
  });
  if (db.auditLogs.length > 100) {
    db.auditLogs = db.auditLogs.slice(0, 100);
  }
}

function enrichState(db: CentralDatabaseState): CentralDatabaseState {
  return {
    ...db,
    scorecards: computeScorecards(db),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Health & State
  app.get('/api/state', (_req, res) => {
    const db = loadDb();
    res.json(enrichState(db));
  });

  app.post('/api/reset', (req, res) => {
    const seeded = createSeedData();
    appendLog(
      seeded,
      req.body?.actorName || 'SEV Admin',
      req.body?.actorRole || 'SEV_ADMIN',
      'ALL',
      'System',
      'RESET_DEMO',
      'Khôi phục dữ liệu mẫu chuẩn cho 7 nhà máy.'
    );
    saveDb(seeded);
    res.json(enrichState(seeded));
  });

  // BUILD 01: Factories & Dynamic ISO Standards
  app.post('/api/factories', (req, res) => {
    const db = loadDb();
    const body = req.body;
    const code = String(body.code || '').trim().toUpperCase();
    const name = String(body.name || '').trim();
    if (!code || !name) {
      return res.status(400).json({ error: 'Mã nhà máy và Tên nhà máy là bắt buộc.' });
    }
    const id = code.replace(/\s+/g, '_');
    if (db.factories.some((f) => f.id === id)) {
      return res.status(409).json({ error: `Nhà máy ${code} đã tồn tại.` });
    }
    db.factories.push({
      id,
      code,
      name,
      location: body.location || 'Việt Nam',
      country: body.country || 'Việt Nam',
      headcount: Number(body.headcount) || 500,
      isoManager: body.isoManager || 'Chưa phân công',
      activeStandards: Array.isArray(body.activeStandards) && body.activeStandards.length > 0
        ? body.activeStandards
        : ['ISO-9001'],
      riskProfile: body.riskProfile || 'Medium',
      lastAuditDate: body.lastAuditDate || '2026-11-01',
      nextAuditDate: body.nextAuditDate || '2027-02-01',
    });
    appendLog(db, body.actorName, body.actorRole, id, 'Factories', 'ADD_FACTORY', `Thêm nhà máy mới: ${code} (${name}).`);
    saveDb(db);
    res.json(enrichState(db));
  });

  app.post('/api/standards/:id/clauses', (req, res) => {
    const db = loadDb();
    const std = db.standards.find((s) => s.id === req.params.id);
    if (!std) {
      return res.status(404).json({ error: 'Không tìm thấy tiêu chuẩn ISO.' });
    }
    const { clauseCode, title, category, weight, riskCriticality, description, actorName, actorRole } = req.body;
    if (!clauseCode || !title) {
      return res.status(400).json({ error: 'Mã điều khoản và tiêu đề là bắt buộc.' });
    }
    std.clauses.push({
      id: `c-${Date.now()}`,
      standardId: std.id,
      clauseCode: String(clauseCode).trim(),
      title: String(title).trim(),
      category: category || 'Operation',
      weight: Math.max(1, Math.min(30, Number(weight) || 10)),
      riskCriticality: riskCriticality || 'High',
      description: description || '',
    });
    appendLog(db, actorName, actorRole, 'ALL', 'Dynamic ISO', 'ADD_CLAUSE', `Thêm điều khoản ${clauseCode} vào ${std.code}.`);
    saveDb(db);
    res.json(enrichState(db));
  });

  app.patch('/api/standards/:id/clauses/:clauseId', (req, res) => {
    const db = loadDb();
    const std = db.standards.find((s) => s.id === req.params.id);
    if (!std) return res.status(404).json({ error: 'Standard not found' });
    const clause = std.clauses.find((c) => c.id === req.params.clauseId);
    if (!clause) return res.status(404).json({ error: 'Clause not found' });
    if (req.body.weight !== undefined) clause.weight = Math.max(1, Math.min(30, Number(req.body.weight)));
    if (req.body.riskCriticality) clause.riskCriticality = req.body.riskCriticality;
    appendLog(db, req.body.actorName, req.body.actorRole, 'ALL', 'Dynamic ISO', 'UPDATE_CLAUSE', `Cập nhật trọng số điều khoản ${clause.clauseCode} (${std.code}) thành ${clause.weight}%.`);
    saveDb(db);
    res.json(enrichState(db));
  });

  // BUILD 02: Document Control, Self-Assessment, Evidence
  app.post('/api/documents', (req, res) => {
    const db = loadDb();
    const body = req.body;
    if (!body.docCode || !body.title) {
      return res.status(400).json({ error: 'Mã tài liệu và Tên tài liệu là bắt buộc.' });
    }
    const doc: ISODocument = {
      id: `doc-${Date.now()}`,
      docCode: String(body.docCode).trim().toUpperCase(),
      title: String(body.title).trim(),
      docType: body.docType || 'SOP',
      standardId: body.standardId || 'ISO-9001',
      clauseCode: body.clauseCode || '7.5',
      factoryScope: body.factoryScope || 'ALL',
      version: body.version || 'Rev 1.0',
      owner: body.owner || 'Ban ISO',
      status: body.status || 'Draft',
      updatedAt: new Date().toISOString().slice(0, 10),
      nextReviewDate: body.nextReviewDate || '2027-11-26',
    };
    db.documents.unshift(doc);
    appendLog(db, body.actorName, body.actorRole, doc.factoryScope, 'Document Control', 'CREATE_DOC', `Tạo tài liệu ${doc.docCode} (${doc.version}).`);
    saveDb(db);
    res.json(enrichState(db));
  });

  app.patch('/api/documents/:id', (req, res) => {
    const db = loadDb();
    const doc = db.documents.find((d) => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (req.body.status) doc.status = req.body.status;
    if (req.body.version) doc.version = req.body.version;
    doc.updatedAt = new Date().toISOString().slice(0, 10);
    appendLog(db, req.body.actorName, req.body.actorRole, doc.factoryScope, 'Document Control', 'UPDATE_DOC_STATUS', `Chuyển trạng thái ${doc.docCode} sang ${doc.status}.`);
    saveDb(db);
    res.json(enrichState(db));
  });

  app.post('/api/assessments', (req, res) => {
    const db = loadDb();
    const body = req.body;
    const score = Math.max(0, Math.min(100, Number(body.selfScore)));
    const status: SelfAssessment['status'] =
      score >= 85 ? 'Compliant' : score >= 72 ? 'Partial' : 'Gap Identified';
    const existing = db.assessments.find(
      (a) =>
        a.factoryId === body.factoryId &&
        a.standardId === body.standardId &&
        a.clauseCode === body.clauseCode &&
        a.period === (body.period || 'Q4-2026')
    );
    if (existing) {
      existing.selfScore = score;
      existing.status = status;
      existing.notes = body.notes ?? existing.notes;
      existing.assessedBy = body.assessedBy || existing.assessedBy;
      existing.updatedAt = new Date().toISOString().slice(0, 10);
    } else {
      db.assessments.unshift({
        id: `sa-${Date.now()}`,
        factoryId: body.factoryId,
        standardId: body.standardId,
        clauseId: body.clauseId || 'custom',
        clauseCode: body.clauseCode,
        period: body.period || 'Q4-2026',
        selfScore: score,
        status,
        notes: body.notes || '',
        assessedBy: body.assessedBy || 'Factory ISO Manager',
        updatedAt: new Date().toISOString().slice(0, 10),
      });
    }
    appendLog(db, body.actorName, body.actorRole, body.factoryId, 'Self-Assessment', 'SAVE_ASSESSMENT', `Cập nhật tự đánh giá ${body.factoryId} · ${body.clauseCode}: ${score}/100.`);
    saveDb(db);
    res.json(enrichState(db));
  });

  app.post('/api/evidences', (req, res) => {
    const db = loadDb();
    const body = req.body;
    if (!body.title || !body.fileName) {
      return res.status(400).json({ error: 'Tiêu đề và tên tệp bằng chứng là bắt buộc.' });
    }
    const ev: EvidenceRecord = {
      id: `ev-${Date.now()}`,
      title: String(body.title).trim(),
      factoryId: body.factoryId || 'KHV',
      standardId: body.standardId || 'ISO-9001',
      clauseCode: body.clauseCode || '8.5.1',
      linkedType: body.linkedType || 'SelfAssessment',
      linkedId: body.linkedId || 'general',
      fileName: String(body.fileName).trim(),
      fileSizeKb: Number(body.fileSizeKb) || 512,
      uploadedBy: body.uploadedBy || body.actorName || 'ISO Manager',
      uploadedAt: new Date().toISOString().slice(0, 10),
      verified: Boolean(body.verified),
    };
    db.evidences.unshift(ev);
    appendLog(db, body.actorName, body.actorRole, ev.factoryId, 'Evidence', 'UPLOAD_EVIDENCE', `Tải lên bằng chứng ${ev.fileName} cho ${ev.factoryId}.`);
    saveDb(db);
    res.json(enrichState(db));
  });

  app.patch('/api/evidences/:id', (req, res) => {
    const db = loadDb();
    const ev = db.evidences.find((e) => e.id === req.params.id);
    if (!ev) return res.status(404).json({ error: 'Evidence not found' });
    ev.verified = Boolean(req.body.verified);
    appendLog(db, req.body.actorName, req.body.actorRole, ev.factoryId, 'Evidence', 'VERIFY_EVIDENCE', `${ev.verified ? 'Xác nhận' : 'Hủy xác nhận'} bằng chứng ${ev.fileName}.`);
    saveDb(db);
    res.json(enrichState(db));
  });

  // BUILD 04/03: Risk Register & Risk-based Audit Trigger
  app.post('/api/risks', (req, res) => {
    const db = loadDb();
    const body = req.body;
    const likelihood = Math.max(1, Math.min(5, Number(body.likelihood) || 3));
    const impact = Math.max(1, Math.min(5, Number(body.impact) || 3));
    const riskScore = likelihood * impact;
    const riskLevel = computeRiskLevel(riskScore);
    const risk: RiskItem = {
      id: `rk-${Date.now()}`,
      factoryId: body.factoryId || 'KHV',
      processName: body.processName || 'Sản xuất',
      standardId: body.standardId || 'ISO-9001',
      clauseCode: body.clauseCode || '6.1',
      title: String(body.title || '').trim(),
      description: String(body.description || '').trim(),
      likelihood,
      impact,
      riskScore,
      riskLevel,
      mitigationPlan: String(body.mitigationPlan || '').trim(),
      owner: body.owner || 'Factory Manager',
      auditFrequency: computeAuditCadence(riskLevel),
      status: 'Open',
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    if (!risk.title) return res.status(400).json({ error: 'Tên rủi ro là bắt buộc.' });
    db.risks.unshift(risk);
    appendLog(db, body.actorName, body.actorRole, risk.factoryId, 'Risk Management', 'CREATE_RISK', `Ghi nhận rủi ro ${risk.title} (${risk.riskLevel} · ${risk.riskScore}đ).`);
    saveDb(db);
    res.json(enrichState(db));
  });

  app.patch('/api/risks/:id', (req, res) => {
    const db = loadDb();
    const risk = db.risks.find((r) => r.id === req.params.id);
    if (!risk) return res.status(404).json({ error: 'Risk not found' });
    if (req.body.status) risk.status = req.body.status;
    if (req.body.likelihood !== undefined) risk.likelihood = Math.max(1, Math.min(5, Number(req.body.likelihood)));
    if (req.body.impact !== undefined) risk.impact = Math.max(1, Math.min(5, Number(req.body.impact)));
    risk.riskScore = risk.likelihood * risk.impact;
    risk.riskLevel = computeRiskLevel(risk.riskScore);
    risk.auditFrequency = computeAuditCadence(risk.riskLevel);
    risk.updatedAt = new Date().toISOString().slice(0, 10);
    appendLog(db, req.body.actorName, req.body.actorRole, risk.factoryId, 'Risk Management', 'UPDATE_RISK', `Cập nhật rủi ro "${risk.title}" -> ${risk.status} (${risk.riskScore}đ).`);
    saveDb(db);
    res.json(enrichState(db));
  });

  // BUILD 03: Audit Program & Checklist Execution
  app.post('/api/audits', (req, res) => {
    const db = loadDb();
    const body = req.body;
    const std = db.standards.find((s) => s.id === (body.standardId || 'ISO-9001')) || db.standards[0];
    const auditId = `au-${Date.now()}`;
    const checklist: AuditChecklistItem[] = std.clauses.map((c, idx) => ({
      id: `chk-${Date.now()}-${idx}`,
      auditId,
      clauseId: c.id,
      clauseCode: c.clauseCode,
      clauseTitle: c.title,
      weight: c.weight,
      result: 'Pending',
      auditorNote: '',
      evidenceRef: '',
    }));

    const audit: AuditProgram = {
      id: auditId,
      auditCode: body.auditCode || `AUD-2026-${body.factoryId}-${Math.floor(10 + Math.random() * 89)}`,
      factoryId: body.factoryId || 'KHV',
      standardId: std.id,
      auditType: body.auditType || 'Risk-Based Scheduled',
      riskTriggerLevel: body.riskTriggerLevel || 'High',
      leadAuditor: body.leadAuditor || 'Trần Văn Cường (SEV Lead Auditor)',
      plannedDate: body.plannedDate || '2026-12-15',
      status: 'Planned',
      checklist,
    };
    db.audits.unshift(audit);
    appendLog(db, body.actorName, body.actorRole, audit.factoryId, 'Audit Program', 'SCHEDULE_AUDIT', `Lập lịch Audit ${audit.auditCode} (${audit.auditType}) cho ${audit.factoryId}.`);
    saveDb(db);
    res.json(enrichState(db));
  });

  app.patch('/api/audits/:id/checklist/:itemId', (req, res) => {
    const db = loadDb();
    const audit = db.audits.find((a) => a.id === req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    const item = audit.checklist.find((c) => c.id === req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Checklist item not found' });

    if (req.body.result) item.result = req.body.result;
    if (req.body.auditorNote !== undefined) item.auditorNote = req.body.auditorNote;
    if (req.body.evidenceRef !== undefined) item.evidenceRef = req.body.evidenceRef;

    const allDone = audit.checklist.every((c) => c.result !== 'Pending');
    audit.status = allDone ? 'Completed' : 'In Progress';

    // Auto-create NC if Minor NC or Major NC and requested
    if (
      (item.result === 'Major NC' || item.result === 'Minor NC') &&
      req.body.autoCreateNc &&
      !db.ncs.some((n) => n.auditId === audit.id && n.clauseCode === item.clauseCode)
    ) {
      const factory = db.factories.find((f) => f.id === audit.factoryId);
      const due = new Date();
      due.setDate(due.getDate() + (item.result === 'Major NC' ? 14 : 30));
      db.ncs.unshift({
        id: `nc-${Date.now()}`,
        ncCode: `NC-2026-${audit.factoryId.slice(0, 3)}-${Math.floor(10 + Math.random() * 89)}`,
        factoryId: audit.factoryId,
        auditId: audit.id,
        standardId: audit.standardId,
        clauseCode: item.clauseCode,
        severity: item.result,
        title: `Phát hiện ${item.result} tại điều khoản ${item.clauseCode}: ${item.clauseTitle}`,
        findingDescription: item.auditorNote || `Không đáp ứng yêu cầu điều khoản ${item.clauseCode} trong đợt ${audit.auditCode}.`,
        rootCause: '',
        correctiveAction: '',
        preventiveAction: '',
        owner: factory?.isoManager || 'Factory ISO Manager',
        dueDate: due.toISOString().slice(0, 10),
        status: 'Open',
        effectivenessResult: 'Pending',
        verifiedBy: '',
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }

    appendLog(db, req.body.actorName, req.body.actorRole, audit.factoryId, 'Audit Checklist', 'GRADE_CHECKLIST', `Chấm điều khoản ${item.clauseCode} (${audit.auditCode}) -> ${item.result}.`);
    saveDb(db);
    res.json(enrichState(db));
  });

  // BUILD 03: NC & CAPA Lifecycle
  app.post('/api/ncs', (req, res) => {
    const db = loadDb();
    const body = req.body;
    if (!body.title) return res.status(400).json({ error: 'Tiêu đề NC là bắt buộc.' });
    const nc: NonConformity = {
      id: `nc-${Date.now()}`,
      ncCode: `NC-2026-${String(body.factoryId || 'GEN').slice(0, 3)}-${Math.floor(10 + Math.random() * 89)}`,
      factoryId: body.factoryId || 'KHV',
      auditId: body.auditId || 'manual',
      standardId: body.standardId || 'ISO-9001',
      clauseCode: body.clauseCode || '8.5.1',
      severity: body.severity || 'Minor NC',
      title: String(body.title).trim(),
      findingDescription: String(body.findingDescription || '').trim(),
      rootCause: String(body.rootCause || '').trim(),
      correctiveAction: String(body.correctiveAction || '').trim(),
      preventiveAction: String(body.preventiveAction || '').trim(),
      owner: body.owner || 'Factory ISO Manager',
      dueDate: body.dueDate || '2026-12-20',
      status: body.rootCause && body.correctiveAction ? 'CAPA Submitted' : 'Open',
      effectivenessResult: 'Pending',
      verifiedBy: '',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.ncs.unshift(nc);
    appendLog(db, body.actorName, body.actorRole, nc.factoryId, 'NC & CAPA', 'CREATE_NC', `Mở ${nc.ncCode} (${nc.severity}) tại ${nc.factoryId}.`);
    saveDb(db);
    res.json(enrichState(db));
  });

  app.patch('/api/ncs/:id', (req, res) => {
    const db = loadDb();
    const nc = db.ncs.find((n) => n.id === req.params.id);
    if (!nc) return res.status(404).json({ error: 'NC not found' });

    const b = req.body;
    if (b.rootCause !== undefined) nc.rootCause = b.rootCause;
    if (b.correctiveAction !== undefined) nc.correctiveAction = b.correctiveAction;
    if (b.preventiveAction !== undefined) nc.preventiveAction = b.preventiveAction;
    if (b.status) nc.status = b.status;
    if (b.effectivenessResult) nc.effectivenessResult = b.effectivenessResult;
    if (b.verifiedBy !== undefined) nc.verifiedBy = b.verifiedBy;
    if (nc.status === 'Closed' && !nc.closedAt) {
      nc.closedAt = new Date().toISOString().slice(0, 10);
    }

    appendLog(db, b.actorName, b.actorRole, nc.factoryId, 'NC & CAPA', 'UPDATE_CAPA', `Cập nhật ${nc.ncCode} -> trạng thái ${nc.status} (${nc.effectivenessResult}).`);
    saveDb(db);
    res.json(enrichState(db));
  });

  // BUILD 05: Alert Rules Toggle
  app.patch('/api/alerts/:id', (req, res) => {
    const db = loadDb();
    const rule = db.alertRules.find((r) => r.id === req.params.id);
    if (!rule) return res.status(404).json({ error: 'Alert rule not found' });
    rule.enabled = Boolean(req.body.enabled);
    appendLog(db, req.body.actorName, req.body.actorRole, 'ALL', 'Automation', 'TOGGLE_ALERT', `${rule.enabled ? 'Bật' : 'Tắt'} quy tắc cảnh báo: ${rule.name}.`);
    saveDb(db);
    res.json(enrichState(db));
  });

  // BUILD 05: Server-Side Gemini AI Assistant & CAPA Advisor
  app.post('/api/ai/analyze', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(400).json({
        error: 'Chưa cấu hình GEMINI_API_KEY hợp lệ trong bảng Settings > Secrets của AI Studio.',
      });
    }

    try {
      const db = enrichState(loadDb());
      const { mode, prompt, factoryId, ncId } = req.body as {
        mode?: 'executive' | 'capa_draft' | 'qa';
        prompt?: string;
        factoryId?: string;
        ncId?: string;
      };

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contextSummary = {
        scorecards: db.scorecards,
        openHighRisks: db.risks.filter((r) => r.riskLevel === 'Critical' || r.riskLevel === 'High'),
        openNcs: db.ncs.filter((n) => n.status !== 'Closed'),
        upcomingAudits: db.audits.filter((a) => a.status !== 'Completed'),
      };

      let userPrompt = prompt || 'Hãy phân tích tổng quan tình hình tuân thủ ISO của 7 nhà máy.';
      let systemInstruction =
        'Bạn là Chuyên gia Kiểm toán trưởng & Giám đốc Hệ thống ISO Tập đoàn (SEV Control Tower). ' +
        'Hãy trả lời bằng tiếng Việt chuyên nghiệp, súc tích, có số liệu dẫn chứng chính xác từ dữ liệu 7 nhà máy (KHV, DAAL, DREAM TECH, KTECH, HSTEC, HOJEONGB, HOJEONG VINA) được cung cấp. ' +
        'Đưa ra khuyến nghị hành động cụ thể theo phương pháp Risk-based Audit và Hybrid Scoring.';

      if (mode === 'capa_draft' && ncId) {
        const targetNc = db.ncs.find((n) => n.id === ncId);
        if (!targetNc) {
          return res.status(404).json({ error: 'Không tìm thấy hồ sơ NC để phân tích.' });
        }
        systemInstruction +=
          ' Trả lời theo cấu trúc rõ ràng gồm 3 phần: (1) Phân tích Nguyên nhân gốc (5-Why), (2) Hành động khắc phục tức thời (Corrective Action), (3) Hành động phòng ngừa tái diễn (Preventive Action) và tiêu chí đánh giá hiệu lực.';
        userPrompt = `Phân tích và đề xuất CAPA cho hồ sơ NC sau:\n${JSON.stringify(targetNc, null, 2)}`;
      } else if (factoryId && factoryId !== 'ALL') {
        const facScore = db.scorecards?.find((s) => s.factoryId === factoryId);
        const facRisks = db.risks.filter((r) => r.factoryId === factoryId);
        const facNcs = db.ncs.filter((n) => n.factoryId === factoryId);
        userPrompt = `${userPrompt}\n\nDữ liệu chi tiết nhà máy ${factoryId}:\n${JSON.stringify({ facScore, facRisks, facNcs }, null, 2)}`;
      } else {
        userPrompt = `${userPrompt}\n\nDữ liệu tổng hợp 7 nhà máy:\n${JSON.stringify(contextSummary, null, 2)}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userPrompt,
        config: {
          systemInstruction,
        },
      });

      res.json({
        text: response.text ?? 'Không nhận được phản hồi từ mô hình AI.',
        model: 'gemini-4-hydrogen',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối Gemini API.';
      res.status(502).json({ error: `Gemini API lỗi: ${message}` });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`ISO CONTROL PRO server running on http://0.0.0.0:${port}`);
  });
}

startServer();
