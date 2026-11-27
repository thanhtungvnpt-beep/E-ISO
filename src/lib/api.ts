import type { CentralDatabaseState, RoleCode } from '../types/iso';

export interface ActorMeta {
  actorName: string;
  actorRole: RoleCode;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export const isoApi = {
  getState: () => request<CentralDatabaseState>('/api/state'),

  resetDemo: (actor: ActorMeta) =>
    request<CentralDatabaseState>('/api/reset', {
      method: 'POST',
      body: JSON.stringify(actor),
    }),

  addFactory: (payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>('/api/factories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addClause: (standardId: string, payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>(`/api/standards/${standardId}/clauses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateClause: (standardId: string, clauseId: string, payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>(`/api/standards/${standardId}/clauses/${clauseId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  addDocument: (payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateDocument: (id: string, payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>(`/api/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  saveAssessment: (payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addEvidence: (payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>('/api/evidences', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  toggleVerifyEvidence: (id: string, verified: boolean, actor: ActorMeta) =>
    request<CentralDatabaseState>(`/api/evidences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ verified, ...actor }),
    }),

  addRisk: (payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>('/api/risks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRisk: (id: string, payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>(`/api/risks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  scheduleAudit: (payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>('/api/audits', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  gradeChecklistItem: (
    auditId: string,
    itemId: string,
    payload: Record<string, unknown> & ActorMeta
  ) =>
    request<CentralDatabaseState>(`/api/audits/${auditId}/checklist/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  createNc: (payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>('/api/ncs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateNc: (id: string, payload: Record<string, unknown> & ActorMeta) =>
    request<CentralDatabaseState>(`/api/ncs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  toggleAlertRule: (id: string, enabled: boolean, actor: ActorMeta) =>
    request<CentralDatabaseState>(`/api/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled, ...actor }),
    }),

  analyzeWithAi: (payload: {
    mode: 'executive' | 'capa_draft' | 'qa';
    prompt?: string;
    factoryId?: string;
    ncId?: string;
  }) =>
    request<{ text: string; model: string }>('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
