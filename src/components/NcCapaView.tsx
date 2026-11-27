import React, { useState } from 'react';
import { Bot, CheckCircle2, Plus, ShieldAlert } from 'lucide-react';
import { isoApi } from '../lib/api';
import type { CentralDatabaseState, NonConformity } from '../types/iso';

interface NcCapaViewProps {
  state: CentralDatabaseState;
  scopedFactoryId: string | 'ALL';
  onCreateNc: (payload: Record<string, unknown>) => Promise<void>;
  onUpdateNc: (id: string, payload: Record<string, unknown>) => Promise<void>;
}

export const NcCapaView: React.FC<NcCapaViewProps> = ({
  state,
  scopedFactoryId,
  onCreateNc,
  onUpdateNc,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN_GROUP' | 'CLOSED'>('ALL');
  const [showNewForm, setShowNewForm] = useState(false);

  const visibleNcs = state.ncs.filter((nc) => {
    if (scopedFactoryId !== 'ALL' && nc.factoryId !== scopedFactoryId) return false;
    if (statusFilter === 'OPEN_GROUP' && nc.status === 'Closed') return false;
    if (statusFilter === 'CLOSED' && nc.status !== 'Closed') return false;
    return true;
  });

  const [selectedNcId, setSelectedNcId] = useState<string>(visibleNcs[0]?.id || '');
  const selectedNc: NonConformity | null =
    visibleNcs.find((n) => n.id === selectedNcId) || visibleNcs[0] || null;

  const [capaDraft, setCapaDraft] = useState<{
    ncId: string;
    rootCause: string;
    correctiveAction: string;
    preventiveAction: string;
    status: NonConformity['status'];
    effectivenessResult: NonConformity['effectivenessResult'];
  } | null>(null);

  const activeDraft =
    capaDraft && capaDraft.ncId === selectedNc?.id
      ? capaDraft
      : selectedNc
        ? {
            ncId: selectedNc.id,
            rootCause: selectedNc.rootCause,
            correctiveAction: selectedNc.correctiveAction,
            preventiveAction: selectedNc.preventiveAction,
            status: selectedNc.status,
            effectivenessResult: selectedNc.effectivenessResult,
          }
        : null;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [newNcForm, setNewNcForm] = useState({
    factoryId: scopedFactoryId === 'ALL' ? 'KTECH' : scopedFactoryId,
    standardId: 'ISO-9001',
    clauseCode: '8.7',
    severity: 'Minor NC',
    title: '',
    findingDescription: '',
    owner: 'Phạm Quốc Bảo',
    dueDate: '2026-12-20',
  });

  const handleAiSuggestCapa = async () => {
    if (!selectedNc) return;
    setAiLoading(true);
    setAiError(null);
    setAiMessage(null);
    try {
      const res = await isoApi.analyzeWithAi({
        mode: 'capa_draft',
        ncId: selectedNc.id,
      });
      setAiMessage(res.text);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Không thể kết nối AI Assistant.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Create Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md w-fit">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Tất cả NC ({state.ncs.filter((n) => scopedFactoryId === 'ALL' || n.factoryId === scopedFactoryId).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OPEN_GROUP')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'OPEN_GROUP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Đang xử lý CAPA
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CLOSED')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'CLOSED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Đã đóng & Hiệu lực
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md whitespace-nowrap w-fit"
        >
          <Plus className="h-4 w-4" />
          <span>{showNewForm ? 'Đóng' : 'Mở Hồ sơ NC Mới'}</span>
        </button>
      </div>

      {showNewForm && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onCreateNc(newNcForm);
            setNewNcForm((p) => ({ ...p, title: '', findingDescription: '' }));
            setShowNewForm(false);
          }}
          className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
        >
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Ghi nhận Sự không phù hợp (Non-Conformity)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nhà máy</label>
              <select
                value={newNcForm.factoryId}
                disabled={scopedFactoryId !== 'ALL'}
                onChange={(e) => setNewNcForm({ ...newNcForm, factoryId: e.target.value })}
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Mức độ</label>
              <select
                value={newNcForm.severity}
                onChange={(e) => setNewNcForm({ ...newNcForm, severity: e.target.value })}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="Major NC">Major NC</option>
                <option value="Minor NC">Minor NC</option>
                <option value="OFI">OFI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Điều khoản</label>
              <input
                type="text"
                value={newNcForm.clauseCode}
                onChange={(e) => setNewNcForm({ ...newNcForm, clauseCode: e.target.value })}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hạn hoàn thành</label>
              <input
                type="date"
                value={newNcForm.dueDate}
                onChange={(e) => setNewNcForm({ ...newNcForm, dueDate: e.target.value })}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              required
              placeholder="Tiêu đề phát hiện NC..."
              value={newNcForm.title}
              onChange={(e) => setNewNcForm({ ...newNcForm, title: e.target.value })}
              className="rounded border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Chi tiết bằng chứng hiện trường..."
              value={newNcForm.findingDescription}
              onChange={(e) => setNewNcForm({ ...newNcForm, findingDescription: e.target.value })}
              className="rounded border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
            >
              Tạo Hồ sơ NC
            </button>
          </div>
        </form>
      )}

      {/* Split NC Queue & CAPA Lifecycle Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-display text-sm font-semibold text-slate-900">
            Danh sách NC ({visibleNcs.length})
          </div>
          <div className="divide-y divide-slate-100">
            {visibleNcs.map((nc) => {
              const active = selectedNc?.id === nc.id;
              return (
                <button
                  key={nc.id}
                  type="button"
                  onClick={() => {
                    setSelectedNcId(nc.id);
                    setCapaDraft(null);
                    setAiMessage(null);
                    setAiError(null);
                  }}
                  className={`w-full text-left px-5 py-3.5 transition-colors ${
                    active ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-900">{nc.ncCode}</span>
                    <span
                      className={`font-semibold ${
                        nc.severity === 'Major NC'
                          ? 'text-red-700'
                          : nc.severity === 'Minor NC'
                            ? 'text-amber-700'
                            : 'text-blue-700'
                      }`}
                    >
                      {nc.severity}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-900 line-clamp-2">
                    {nc.title}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {nc.factoryId} · Điều khoản {nc.clauseCode}
                    </span>
                    <span className="font-medium text-slate-700">{nc.status}</span>
                  </div>
                </button>
              );
            })}
            {visibleNcs.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                Không có hồ sơ NC nào trong bộ lọc này.
              </div>
            )}
          </div>
        </div>

        {/* CAPA Lifecycle & Verification Detail */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6">
          {selectedNc && activeDraft ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                    <span className="font-mono font-semibold text-slate-900">
                      {selectedNc.ncCode}
                    </span>
                    <span>·</span>
                    <span>{selectedNc.factoryId}</span>
                    <span>·</span>
                    <span>{selectedNc.standardId} ({selectedNc.clauseCode})</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 mt-1">
                    {selectedNc.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">{selectedNc.findingDescription}</p>
                </div>

                <button
                  type="button"
                  onClick={handleAiSuggestCapa}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>{aiLoading ? 'Đang phân tích...' : 'AI Gợi ý Root Cause & CAPA'}</span>
                </button>
              </div>

              {/* 5-Stage CAPA Lifecycle Stepper */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {(
                  [
                    { key: 'Open', label: '1. Mở NC' },
                    { key: 'CAPA Submitted', label: '2. Nộp CAPA' },
                    { key: 'Implemented', label: '3. Thực hiện' },
                    { key: 'Verified', label: '4. Xác minh' },
                    { key: 'Closed', label: '5. Đóng' },
                  ] as const
                ).map((step, idx) => {
                  const order = ['Open', 'CAPA Submitted', 'Implemented', 'Verified', 'Closed'];
                  const currentIdx = order.indexOf(activeDraft.status);
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => setCapaDraft({ ...activeDraft, status: step.key })}
                      className={`py-2 px-2 rounded text-[11px] font-semibold text-center border transition-colors ${
                        isCurrent
                          ? 'bg-blue-700 text-white border-blue-700'
                          : isDone
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {step.label}
                    </button>
                  );
                })}
              </div>

              {aiError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
                  {aiError}
                </div>
              )}

              {aiMessage && (
                <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  <div className="font-semibold text-blue-800 mb-1.5">
                    Đề xuất từ Gemini AI Control Tower:
                  </div>
                  {aiMessage}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. Phân tích Nguyên nhân gốc (Root Cause - 5 Why)
                  </label>
                  <textarea
                    rows={2}
                    value={activeDraft.rootCause}
                    onChange={(e) =>
                      setCapaDraft({ ...activeDraft, rootCause: e.target.value })
                    }
                    placeholder="Nhập nguyên nhân gốc..."
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Hành động Khắc phục (Corrective Action)
                  </label>
                  <textarea
                    rows={2}
                    value={activeDraft.correctiveAction}
                    onChange={(e) =>
                      setCapaDraft({ ...activeDraft, correctiveAction: e.target.value })
                    }
                    placeholder="Hành động khắc phục sự không phù hợp..."
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. Hành động Phòng ngừa tái diễn (Preventive Action)
                  </label>
                  <textarea
                    rows={2}
                    value={activeDraft.preventiveAction}
                    onChange={(e) =>
                      setCapaDraft({ ...activeDraft, preventiveAction: e.target.value })
                    }
                    placeholder="Chuẩn hóa quy trình, Poka-Yoke, đào tạo..."
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Trạng thái Workflow CAPA
                    </label>
                    <select
                      value={activeDraft.status}
                      onChange={(e) =>
                        setCapaDraft({
                          ...activeDraft,
                          status: e.target.value as NonConformity['status'],
                        })
                      }
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="Open">Open (Mới mở)</option>
                      <option value="CAPA Submitted">CAPA Submitted (Đã nộp kế hoạch)</option>
                      <option value="Implemented">Implemented (Đã thực hiện)</option>
                      <option value="Verified">Verified (Auditor xác minh)</option>
                      <option value="Closed">Closed (Đóng hồ sơ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Đánh giá Hiệu lực (Effectiveness Verification)
                    </label>
                    <select
                      value={activeDraft.effectivenessResult}
                      onChange={(e) =>
                        setCapaDraft({
                          ...activeDraft,
                          effectivenessResult: e.target.value as NonConformity['effectivenessResult'],
                        })
                      }
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="Pending">Pending (Chờ đánh giá)</option>
                      <option value="Effective">Effective (Đạt hiệu lực)</option>
                      <option value="Ineffective">Ineffective (Chưa đạt, làm lại)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div className="text-xs text-slate-500">
                    Phụ trách: {selectedNc.owner} · Hạn: <span className="font-mono">{selectedNc.dueDate}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateNc(selectedNc.id, {
                        rootCause: activeDraft.rootCause,
                        correctiveAction: activeDraft.correctiveAction,
                        preventiveAction: activeDraft.preventiveAction,
                        status: activeDraft.status,
                        effectivenessResult: activeDraft.effectivenessResult,
                        verifiedBy:
                          activeDraft.status === 'Verified' || activeDraft.status === 'Closed'
                            ? 'SEV Lead Auditor'
                            : '',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Lưu & Cập nhật CAPA</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-500">
              Chọn một hồ sơ NC bên trái để thực hiện quy trình CAPA & Verification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
