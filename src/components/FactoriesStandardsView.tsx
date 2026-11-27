import React, { useState } from 'react';
import { Building2, Plus, Sliders } from 'lucide-react';
import type { CentralDatabaseState } from '../types/iso';

interface FactoriesStandardsViewProps {
  state: CentralDatabaseState;
  scopedFactoryId: string | 'ALL';
  onAddFactory: (payload: Record<string, unknown>) => Promise<void>;
  onAddClause: (standardId: string, payload: Record<string, unknown>) => Promise<void>;
  onUpdateClause: (
    standardId: string,
    clauseId: string,
    payload: Record<string, unknown>
  ) => Promise<void>;
}

export const FactoriesStandardsView: React.FC<FactoriesStandardsViewProps> = ({
  state,
  scopedFactoryId,
  onAddFactory,
  onAddClause,
  onUpdateClause,
}) => {
  const [selectedStdId, setSelectedStdId] = useState(state.standards[0]?.id || 'ISO-9001');
  const [showAddFactory, setShowAddFactory] = useState(false);
  const [showAddClause, setShowAddClause] = useState(false);

  const [factoryForm, setFactoryForm] = useState({
    code: '',
    name: '',
    location: '',
    country: 'Việt Nam',
    headcount: 600,
    isoManager: '',
    riskProfile: 'Medium',
  });

  const [clauseForm, setClauseForm] = useState({
    clauseCode: '',
    title: '',
    category: 'Operation',
    weight: 10,
    riskCriticality: 'High',
    description: '',
  });

  const activeStd =
    state.standards.find((s) => s.id === selectedStdId) || state.standards[0];

  const visibleFactories =
    scopedFactoryId === 'ALL'
      ? state.factories
      : state.factories.filter((f) => f.id === scopedFactoryId);

  return (
    <div className="space-y-8">
      {/* 7 Factories Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-700" />
            <h2 className="font-display text-base font-semibold text-slate-900">
              Danh sách Nhà máy Tập đoàn ({visibleFactories.length})
            </h2>
          </div>
          {scopedFactoryId === 'ALL' && (
            <button
              type="button"
              onClick={() => setShowAddFactory((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddFactory ? 'Đóng' : 'Thêm Nhà máy'}</span>
            </button>
          )}
        </div>

        {showAddFactory && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onAddFactory(factoryForm);
              setFactoryForm({
                code: '',
                name: '',
                location: '',
                country: 'Việt Nam',
                headcount: 600,
                isoManager: '',
                riskProfile: 'Medium',
              });
              setShowAddFactory(false);
            }}
            className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-6 gap-3"
          >
            <input
              type="text"
              required
              placeholder="Mã (VD: KTECH2)"
              value={factoryForm.code}
              onChange={(e) => setFactoryForm({ ...factoryForm, code: e.target.value })}
              className="rounded border border-slate-200 px-3 py-2 text-sm font-mono"
            />
            <input
              type="text"
              required
              placeholder="Tên nhà máy"
              value={factoryForm.name}
              onChange={(e) => setFactoryForm({ ...factoryForm, name: e.target.value })}
              className="md:col-span-2 rounded border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Khu công nghiệp / Tỉnh"
              value={factoryForm.location}
              onChange={(e) => setFactoryForm({ ...factoryForm, location: e.target.value })}
              className="rounded border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="ISO Manager"
              value={factoryForm.isoManager}
              onChange={(e) => setFactoryForm({ ...factoryForm, isoManager: e.target.value })}
              className="rounded border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
            >
              Lưu Nhà máy
            </button>
          </form>
        )}

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Mã & Tên Nhà máy</th>
                  <th className="py-3 px-4">Địa điểm</th>
                  <th className="py-3 px-4 text-right">Nhân sự</th>
                  <th className="py-3 px-4">ISO Manager</th>
                  <th className="py-3 px-4">Tiêu chuẩn áp dụng</th>
                  <th className="py-3 px-4">Hồ sơ Rủi ro</th>
                  <th className="py-3 px-4">Audit tiếp theo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {visibleFactories.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{fac.code}</div>
                      <div className="text-xs text-slate-500">{fac.name}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      {fac.location} · {fac.country}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {fac.headcount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">
                      {fac.isoManager}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">
                      {fac.activeStandards.join(' · ')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          fac.riskProfile === 'Critical'
                            ? 'text-red-700'
                            : fac.riskProfile === 'High'
                              ? 'text-amber-700'
                              : fac.riskProfile === 'Medium'
                                ? 'text-blue-700'
                                : 'text-emerald-700'
                        }`}
                      >
                        {fac.riskProfile}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums">
                      {fac.nextAuditDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Dynamic ISO Standards Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-700" />
            <h2 className="font-display text-base font-semibold text-slate-900">
              Cấu hình Bộ tiêu chuẩn ISO Động (Dynamic Clauses & Trọng số)
            </h2>
          </div>

          {scopedFactoryId === 'ALL' && (
            <button
              type="button"
              onClick={() => setShowAddClause((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md whitespace-nowrap w-fit"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddClause ? 'Đóng' : 'Thêm Điều khoản Động'}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md w-fit">
          {state.standards.map((std) => (
            <button
              key={std.id}
              type="button"
              onClick={() => setSelectedStdId(std.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeStd?.id === std.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {std.code} ({std.clauses.length})
            </button>
          ))}
        </div>

        {showAddClause && activeStd && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onAddClause(activeStd.id, clauseForm);
              setClauseForm({
                clauseCode: '',
                title: '',
                category: 'Operation',
                weight: 10,
                riskCriticality: 'High',
                description: '',
              });
              setShowAddClause(false);
            }}
            className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-6 gap-3"
          >
            <input
              type="text"
              required
              placeholder="Mã (VD: 9.1.2)"
              value={clauseForm.clauseCode}
              onChange={(e) => setClauseForm({ ...clauseForm, clauseCode: e.target.value })}
              className="rounded border border-slate-200 px-3 py-2 text-sm font-mono"
            />
            <input
              type="text"
              required
              placeholder="Tên điều khoản ISO mới..."
              value={clauseForm.title}
              onChange={(e) => setClauseForm({ ...clauseForm, title: e.target.value })}
              className="md:col-span-2 rounded border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              max={30}
              value={clauseForm.weight}
              onChange={(e) => setClauseForm({ ...clauseForm, weight: Number(e.target.value) })}
              className="rounded border border-slate-200 px-3 py-2 text-sm font-mono"
              aria-label="Trọng số phần trăm"
            />
            <select
              value={clauseForm.riskCriticality}
              onChange={(e) =>
                setClauseForm({ ...clauseForm, riskCriticality: e.target.value })
              }
              className="rounded border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Standard">Standard</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
            >
              Thêm vào {activeStd.code}
            </button>
          </form>
        )}

        {activeStd && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>
                <strong className="text-slate-900">{activeStd.name}</strong> · Phiên bản{' '}
                <span className="font-mono">{activeStd.version}</span>
              </span>
              <span>Chế độ Dynamic: Đang bật</span>
            </div>
            <div className="divide-y divide-slate-100">
              {activeStd.clauses.map((c) => (
                <div
                  key={c.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-bold text-slate-900">
                        Điều khoản {c.clauseCode}
                      </span>
                      <span>·</span>
                      <span>{c.category}</span>
                      <span>·</span>
                      <span
                        className={
                          c.riskCriticality === 'Critical'
                            ? 'font-semibold text-red-700'
                            : c.riskCriticality === 'High'
                              ? 'font-semibold text-amber-700'
                              : 'text-slate-600'
                        }
                      >
                        Mức {c.riskCriticality}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{c.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500">Trọng số:</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      disabled={scopedFactoryId !== 'ALL'}
                      defaultValue={c.weight}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== c.weight) {
                          onUpdateClause(activeStd.id, c.id, { weight: val });
                        }
                      }}
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-xs font-mono text-right tabular-nums"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
