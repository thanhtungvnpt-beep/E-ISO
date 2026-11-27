import React, { useState } from 'react';
import { CalendarPlus, Plus } from 'lucide-react';
import type { CentralDatabaseState, RiskItem } from '../types/iso';

interface RiskManagementViewProps {
  state: CentralDatabaseState;
  scopedFactoryId: string | 'ALL';
  onAddRisk: (payload: Record<string, unknown>) => Promise<void>;
  onUpdateRisk: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onTriggerAuditFromRisk: (risk: RiskItem) => Promise<void>;
}

export const RiskManagementView: React.FC<RiskManagementViewProps> = ({
  state,
  scopedFactoryId,
  onAddRisk,
  onUpdateRisk,
  onTriggerAuditFromRisk,
}) => {
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'Critical' | 'High' | 'Medium' | 'Low'>('ALL');
  const [factoryFilter, setFactoryFilter] = useState<string>(scopedFactoryId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    factoryId: scopedFactoryId === 'ALL' ? 'HOJEONG_VINA' : scopedFactoryId,
    processName: '',
    standardId: 'ISO-9001',
    clauseCode: '6.1',
    title: '',
    description: '',
    likelihood: 3,
    impact: 4,
    mitigationPlan: '',
    owner: '',
  });

  const effectiveFactoryFilter = scopedFactoryId === 'ALL' ? factoryFilter : scopedFactoryId;

  const visibleRisks = state.risks.filter((r) => {
    if (effectiveFactoryFilter !== 'ALL' && r.factoryId !== effectiveFactoryFilter) return false;
    if (levelFilter !== 'ALL' && r.riskLevel !== levelFilter) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await onAddRisk(form);
      setForm((prev) => ({ ...prev, title: '', description: '', mitigationPlan: '', processName: '' }));
      setShowAddForm(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            {(['ALL', 'Critical', 'High', 'Medium', 'Low'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  levelFilter === lvl
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl === 'ALL' ? 'Tất cả mức' : lvl}
              </button>
            ))}
          </div>

          {scopedFactoryId === 'ALL' && (
            <select
              value={factoryFilter}
              onChange={(e) => setFactoryFilter(e.target.value)}
              aria-label="Lọc theo nhà máy"
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="ALL">Tất cả 7 nhà máy</option>
              {state.factories.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} — {f.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md whitespace-nowrap w-fit"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? 'Đóng biểu mẫu' : 'Thêm Rủi ro Quy trình'}</span>
        </button>
      </div>

      {/* Add Risk Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
        >
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Đăng ký Rủi ro Mới (Tự động tính Chu kỳ Audit)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nhà máy</label>
              <select
                value={form.factoryId}
                disabled={scopedFactoryId !== 'ALL'}
                onChange={(e) => setForm({ ...form, factoryId: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                {state.factories.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tiêu chuẩn ISO</label>
              <select
                value={form.standardId}
                onChange={(e) => setForm({ ...form, standardId: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                {state.standards.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Công đoạn / Quy trình</label>
              <input
                type="text"
                required
                placeholder="VD: Dây chuyền Sơn tĩnh điện"
                value={form.processName}
                onChange={(e) => setForm({ ...form, processName: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Tên rủi ro</label>
              <input
                type="text"
                required
                placeholder="Mô tả ngắn gọn nguy cơ mất tuân thủ hoặc sự cố..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Khả năng (1–5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.likelihood}
                  onChange={(e) => setForm({ ...form, likelihood: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tác động (1–5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.impact}
                  onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Kế hoạch giảm thiểu</label>
              <input
                type="text"
                placeholder="Biện pháp kiểm soát phòng ngừa..."
                value={form.mitigationPlan}
                onChange={(e) => setForm({ ...form, mitigationPlan: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Người phụ trách</label>
              <input
                type="text"
                placeholder="Họ và tên trưởng bộ phận"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              Điểm rủi ro dự kiến: {form.likelihood * form.impact} / 25
            </div>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md disabled:opacity-50"
            >
              {busy ? 'Đang lưu...' : 'Lưu Rủi ro vào Hệ thống'}
            </button>
          </div>
        </form>
      )}

      {/* Risk Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Nhà máy & Quy trình</th>
                <th className="py-3 px-4">Mô tả Rủi ro</th>
                <th className="py-3 px-4 text-right">Điểm (L×I)</th>
                <th className="py-3 px-4">Mức độ</th>
                <th className="py-3 px-4">Tần suất Audit</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {visibleRisks.map((risk) => (
                <tr key={risk.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-slate-900">{risk.factoryId}</div>
                    <div className="text-xs text-slate-500">{risk.processName}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {risk.standardId} · {risk.clauseCode}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top max-w-md">
                    <div className="font-medium text-slate-900">{risk.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{risk.mitigationPlan}</div>
                    <div className="text-xs text-slate-400 mt-1">Phụ trách: {risk.owner}</div>
                  </td>
                  <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums">
                    <span className="font-bold text-slate-900">{risk.riskScore}</span>
                    <div className="text-[11px] text-slate-400">
                      {risk.likelihood}×{risk.impact}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <span
                      className={`text-xs font-semibold ${
                        risk.riskLevel === 'Critical'
                          ? 'text-red-700'
                          : risk.riskLevel === 'High'
                            ? 'text-amber-700'
                            : risk.riskLevel === 'Medium'
                              ? 'text-blue-700'
                              : 'text-emerald-700'
                      }`}
                    >
                      {risk.riskLevel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-top text-xs font-medium text-slate-700 whitespace-nowrap">
                    {risk.auditFrequency}
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <select
                      value={risk.status}
                      onChange={(e) => onUpdateRisk(risk.id, { status: e.target.value })}
                      aria-label={`Trạng thái rủi ro ${risk.title}`}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      <option value="Open">Open</option>
                      <option value="Mitigating">Mitigating</option>
                      <option value="Controlled">Controlled</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 align-top text-right">
                    <button
                      type="button"
                      onClick={() => onTriggerAuditFromRisk(risk)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded border border-blue-200 whitespace-nowrap"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      <span>Tạo Audit</span>
                    </button>
                  </td>
                </tr>
              ))}
              {visibleRisks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                    Không có rủi ro nào phù hợp với điều kiện lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
