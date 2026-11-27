import React, { useState } from 'react';
import { CalendarPlus, CheckCircle2, ClipboardList } from 'lucide-react';
import type { AuditChecklistItem, CentralDatabaseState } from '../types/iso';

interface AuditProgramChecklistViewProps {
  state: CentralDatabaseState;
  scopedFactoryId: string | 'ALL';
  onScheduleAudit: (payload: Record<string, unknown>) => Promise<void>;
  onGradeItem: (
    auditId: string,
    itemId: string,
    payload: Record<string, unknown>
  ) => Promise<void>;
}

export const AuditProgramChecklistView: React.FC<AuditProgramChecklistViewProps> = ({
  state,
  scopedFactoryId,
  onScheduleAudit,
  onGradeItem,
}) => {
  const visibleAudits = state.audits.filter(
    (a) => scopedFactoryId === 'ALL' || a.factoryId === scopedFactoryId
  );

  const [selectedAuditId, setSelectedAuditId] = useState<string>(visibleAudits[0]?.id || '');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [autoCreateNc, setAutoCreateNc] = useState(true);
  const [scheduleForm, setScheduleForm] = useState({
    factoryId: scopedFactoryId === 'ALL' ? 'HOJEONG_VINA' : scopedFactoryId,
    standardId: 'ISO-9001',
    auditType: 'Risk-Based Scheduled',
    riskTriggerLevel: 'High',
    leadAuditor: 'Trần Văn Cường (SEV Lead Auditor)',
    plannedDate: '2026-12-18',
  });

  const activeAudit =
    visibleAudits.find((a) => a.id === selectedAuditId) || visibleAudits[0] || null;

  const computeAuditLiveCompliance = (items: AuditChecklistItem[]) => {
    const graded = items.filter((i) => i.result !== 'Pending');
    if (graded.length === 0) return null;
    let totalW = 0;
    let earnedW = 0;
    for (const i of graded) {
      const w = i.weight || 1;
      totalW += w;
      if (i.result === 'Compliant') earnedW += w;
      else if (i.result === 'OFI') earnedW += w * 0.9;
      else if (i.result === 'Minor NC') earnedW += w * 0.55;
      else if (i.result === 'Major NC') earnedW += w * 0.1;
    }
    return ((earnedW / totalW) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-600">
          Chấm điểm Checklist trực tiếp sẽ tự động cập nhật Điểm Hybrid toàn hệ thống và có thể tự động mở NC.
        </div>
        <button
          type="button"
          onClick={() => setShowScheduleForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md whitespace-nowrap w-fit"
        >
          <CalendarPlus className="h-4 w-4" />
          <span>{showScheduleForm ? 'Đóng biểu mẫu' : 'Lập lịch Audit Mới'}</span>
        </button>
      </div>

      {showScheduleForm && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onScheduleAudit(scheduleForm);
            setShowScheduleForm(false);
          }}
          className="bg-white border border-slate-200 rounded-lg p-6 grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nhà máy</label>
            <select
              value={scheduleForm.factoryId}
              disabled={scopedFactoryId !== 'ALL'}
              onChange={(e) => setScheduleForm({ ...scheduleForm, factoryId: e.target.value })}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            >
              {state.factories.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bộ tiêu chuẩn</label>
            <select
              value={scheduleForm.standardId}
              onChange={(e) => setScheduleForm({ ...scheduleForm, standardId: e.target.value })}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            >
              {state.standards.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Loại Audit</label>
            <select
              value={scheduleForm.auditType}
              onChange={(e) => setScheduleForm({ ...scheduleForm, auditType: e.target.value })}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="Risk-Based Scheduled">Risk-Based Scheduled</option>
              <option value="Surveillance">Surveillance</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Unannounced">Unannounced</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Ngày kế hoạch</label>
            <input
              type="date"
              value={scheduleForm.plannedDate}
              onChange={(e) => setScheduleForm({ ...scheduleForm, plannedDate: e.target.value })}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
            >
              Tạo Đợt Audit
            </button>
          </div>
        </form>
      )}

      {/* Split Layout: Audit Program List + Interactive Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-display text-sm font-semibold text-slate-900">
            Chương trình Audit ({visibleAudits.length})
          </div>
          <div className="divide-y divide-slate-100">
            {visibleAudits.map((au) => {
              const selected = activeAudit?.id === au.id;
              const score = computeAuditLiveCompliance(au.checklist);
              return (
                <button
                  key={au.id}
                  type="button"
                  onClick={() => setSelectedAuditId(au.id)}
                  className={`w-full text-left px-5 py-3.5 transition-colors ${
                    selected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-900">{au.auditCode}</span>
                    <span
                      className={`font-semibold ${
                        au.status === 'Completed'
                          ? 'text-emerald-700'
                          : au.status === 'In Progress'
                            ? 'text-blue-700'
                            : 'text-slate-500'
                      }`}
                    >
                      {au.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {au.factoryId} · {au.standardId}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{au.auditType}</span>
                    <span className="font-mono tabular-nums">
                      {score !== null ? `${score}%` : 'Chưa chấm'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Checklist Panel */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
          {activeAudit ? (
            <>
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ClipboardList className="h-3.5 w-3.5 text-blue-700" />
                    <span className="font-mono font-semibold text-slate-900">
                      {activeAudit.auditCode}
                    </span>
                    <span>·</span>
                    <span>{activeAudit.factoryId}</span>
                    <span>·</span>
                    <span>Trưởng đoàn: {activeAudit.leadAuditor}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900 mt-0.5">
                    Checklist Đánh giá {activeAudit.standardId} ({activeAudit.plannedDate})
                  </h3>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoCreateNc}
                    onChange={(e) => setAutoCreateNc(e.target.checked)}
                    className="rounded border-slate-300 text-blue-700"
                  />
                  <span>Tự động mở NC khi chọn Minor/Major NC</span>
                </label>
              </div>

              {/* Live Audit Progress & Projected Compliance Bar */}
              {(() => {
                const total = activeAudit.checklist.length;
                const graded = activeAudit.checklist.filter((c) => c.result !== 'Pending').length;
                const pct = total > 0 ? Math.round((graded / total) * 100) : 0;
                const liveScore = computeAuditLiveCompliance(activeAudit.checklist);
                return (
                  <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-medium text-slate-600 whitespace-nowrap tabular-nums">
                        Tiến độ chấm: {graded}/{total} điều khoản ({pct}%)
                      </span>
                      <div className="h-1.5 flex-1 max-w-xs bg-slate-200 rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-blue-700 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-700 tabular-nums">
                      Điểm Audit tạm tính:{' '}
                      <strong className="text-blue-700">
                        {liveScore !== null ? `${liveScore}%` : 'Chưa có'}
                      </strong>
                    </div>
                  </div>
                );
              })()}

              <div className="divide-y divide-slate-100">
                {activeAudit.checklist.map((item) => (
                  <div key={item.id} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-mono text-slate-500">
                          Điều khoản {item.clauseCode} · Trọng số {item.weight}%
                        </div>
                        <div className="text-sm font-semibold text-slate-900 mt-0.5">
                          {item.clauseTitle}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md w-fit shrink-0">
                        {(['Compliant', 'OFI', 'Minor NC', 'Major NC'] as const).map((resOpt) => {
                          const active = item.result === resOpt;
                          let activeStyle = 'bg-white text-slate-900 shadow-xs';
                          if (active && resOpt === 'Compliant') {
                            activeStyle = 'bg-emerald-600 text-white';
                          } else if (active && resOpt === 'OFI') {
                            activeStyle = 'bg-blue-700 text-white';
                          } else if (active && resOpt === 'Minor NC') {
                            activeStyle = 'bg-amber-600 text-white';
                          } else if (active && resOpt === 'Major NC') {
                            activeStyle = 'bg-red-600 text-white';
                          }
                          return (
                            <button
                              key={resOpt}
                              type="button"
                              onClick={() =>
                                onGradeItem(activeAudit.id, item.id, {
                                  result: resOpt,
                                  autoCreateNc,
                                })
                              }
                              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                                active ? activeStyle : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {resOpt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        defaultValue={item.auditorNote}
                        placeholder="Ghi chú phát hiện của Auditor..."
                        onBlur={(e) => {
                          if (e.target.value !== item.auditorNote) {
                            onGradeItem(activeAudit.id, item.id, {
                              auditorNote: e.target.value,
                            });
                          }
                        }}
                        className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800"
                      />
                      <input
                        type="text"
                        defaultValue={item.evidenceRef}
                        placeholder="Mã bằng chứng đối chiếu..."
                        onBlur={(e) => {
                          if (e.target.value !== item.evidenceRef) {
                            onGradeItem(activeAudit.id, item.id, {
                              evidenceRef: e.target.value,
                            });
                          }
                        }}
                        className="rounded border border-slate-200 px-3 py-1.5 text-xs font-mono text-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-sm text-slate-500">
              <CheckCircle2 className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              Chưa có đợt Audit nào trong phạm vi hiển thị.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
