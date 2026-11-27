import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  TrendingUp,
  X,
} from 'lucide-react';
import { ComplianceTrendChart, HybridRadarChart } from './Charts';
import type { CentralDatabaseState, ModuleKey } from '../types/iso';

interface ControlTowerViewProps {
  state: CentralDatabaseState;
  scopedFactoryId: string | 'ALL';
  onNavigate: (mod: ModuleKey) => void;
  onSelectFactoryFilter: (factoryId: string) => void;
}

export const ControlTowerView: React.FC<ControlTowerViewProps> = ({
  state,
  scopedFactoryId,
  onNavigate,
  onSelectFactoryFilter,
}) => {
  const [drawerFactoryId, setDrawerFactoryId] = useState<string | null>(null);

  const scorecards = state.scorecards || [];
  const visibleScorecards =
    scopedFactoryId === 'ALL'
      ? scorecards
      : scorecards.filter((s) => s.factoryId === scopedFactoryId);

  const visibleRisks =
    scopedFactoryId === 'ALL'
      ? state.risks
      : state.risks.filter((r) => r.factoryId === scopedFactoryId);

  const visibleNcs =
    scopedFactoryId === 'ALL'
      ? state.ncs
      : state.ncs.filter((n) => n.factoryId === scopedFactoryId);

  const visibleAudits =
    scopedFactoryId === 'ALL'
      ? state.audits
      : state.audits.filter((a) => a.factoryId === scopedFactoryId);

  const avgHybrid =
    visibleScorecards.length > 0
      ? (
          visibleScorecards.reduce((sum, s) => sum + s.hybridScore, 0) /
          visibleScorecards.length
        ).toFixed(1)
      : '0.0';

  const groupBench = {
    selfAssessment:
      scorecards.reduce((s, c) => s + c.selfAssessmentScore, 0) / (scorecards.length || 1),
    auditCompliance:
      scorecards.reduce((s, c) => s + c.auditComplianceScore, 0) / (scorecards.length || 1),
    capaClosure:
      scorecards.reduce((s, c) => s + c.capaClosureScore, 0) / (scorecards.length || 1),
    evidence:
      scorecards.reduce((s, c) => s + c.evidenceScore, 0) / (scorecards.length || 1),
  };

  const openMajorNcs = visibleNcs.filter(
    (n) => n.severity === 'Major NC' && n.status !== 'Closed'
  );
  const openAllNcs = visibleNcs.filter((n) => n.status !== 'Closed');
  const criticalHighRisks = visibleRisks.filter(
    (r) => (r.riskLevel === 'Critical' || r.riskLevel === 'High') && r.status !== 'Controlled'
  );
  const activeAudits = visibleAudits.filter((a) => a.status !== 'Completed');

  const drawerFactory = drawerFactoryId
    ? state.factories.find((f) => f.id === drawerFactoryId) || null
    : null;
  const drawerScorecard = drawerFactoryId
    ? scorecards.find((s) => s.factoryId === drawerFactoryId) || null
    : null;

  const getFactoryStandardCell = (factoryId: string, stdId: string) => {
    const factory = state.factories.find((f) => f.id === factoryId);
    if (!factory || !factory.activeStandards.includes(stdId)) return null;
    const sc = scorecards.find((s) => s.factoryId === factoryId);
    const openNcsForStd = state.ncs.filter(
      (n) => n.factoryId === factoryId && n.standardId === stdId && n.status !== 'Closed'
    );
    const hasMajor = openNcsForStd.some((n) => n.severity === 'Major NC');
    const hasMinor = openNcsForStd.length > 0;
    const base = sc ? sc.hybridScore : 82;
    const adjusted = Math.max(
      55,
      Math.min(100, Number((base - (hasMajor ? 8 : hasMinor ? 3 : 0)).toFixed(0)))
    );
    return { score: adjusted, hasMajor, openCount: openNcsForStd.length };
  };

  return (
    <div className="space-y-6">
      {/* Executive Command Summary Panel (Dark Slate Surface) */}
      <section className="bg-slate-900 text-white rounded-lg p-6 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="text-xs font-medium text-blue-300">
              Trung tâm Điều hành Tuân thủ Tập đoàn SEV
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight mt-0.5 text-white">
              {scopedFactoryId === 'ALL'
                ? 'Tổng quan Hiệu suất ISO Toàn hệ thống (7 Nhà máy)'
                : `Tổng quan Điều hành Nhà máy ${scopedFactoryId}`}
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            Kiến trúc: Quản lý ISO Dynamic · Audit theo Rủi ro · Chấm điểm Hybrid · Dữ liệu Tập trung
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-5">
          <div>
            <div className="text-xs text-slate-400">Điểm Hybrid Trung bình</div>
            <div className="mt-1.5 flex items-baseline gap-2.5">
              <span className="font-mono text-3xl font-bold text-white tabular-nums">
                {avgHybrid}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 tabular-nums">
                <TrendingUp className="h-3.5 w-3.5" />
                +2.4đ kỳ này
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">NC Đang mở (Major / Tổng)</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-red-400 tabular-nums">
                {openMajorNcs.length}
              </span>
              <span className="font-mono text-lg text-slate-400 tabular-nums">
                / {openAllNcs.length} hồ sơ
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Rủi ro Mức Cao & Nghiêm trọng</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-amber-400 tabular-nums">
                {criticalHighRisks.length}
              </span>
              <span className="text-xs text-slate-400">
                Kích hoạt Audit 3 tháng/lần
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Đợt Audit Đang triển khai</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-blue-400 tabular-nums">
                {activeAudits.length}
              </span>
              <span className="text-xs text-slate-400 tabular-nums">
                / {visibleAudits.length} đợt trong kỳ
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Factory Live Command Strip */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Trạng thái 7 Nhà máy (Nhấn vào nhà máy để xem chi tiết)
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('scorecard')}
            className="text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
          >
            <span>Bảng xếp hạng đầy đủ</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
          {scorecards.map((sc) => {
            const isDimmed = scopedFactoryId !== 'ALL' && sc.factoryId !== scopedFactoryId;
            const scoreColor =
              sc.hybridScore >= 88
                ? 'text-emerald-700'
                : sc.hybridScore >= 76
                  ? 'text-blue-700'
                  : sc.hybridScore >= 68
                    ? 'text-amber-700'
                    : 'text-red-700';
            const barColor =
              sc.hybridScore >= 88
                ? 'bg-emerald-600'
                : sc.hybridScore >= 76
                  ? 'bg-blue-700'
                  : sc.hybridScore >= 68
                    ? 'bg-amber-600'
                    : 'bg-red-600';

            return (
              <button
                key={sc.factoryId}
                type="button"
                onClick={() => setDrawerFactoryId(sc.factoryId)}
                className={`bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-3.5 text-left transition-colors ${
                  isDimmed ? 'opacity-40' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-900 truncate">
                    {sc.factoryCode}
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums">#{sc.rank}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className={`font-mono text-2xl font-bold tabular-nums ${scoreColor}`}>
                    {sc.hybridScore}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-600">
                    Hạng {sc.grade}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-sm overflow-hidden">
                  <div className={`h-full ${barColor}`} style={{ width: `${sc.hybridScore}%` }} />
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between tabular-nums">
                  <span>NC mở: {sc.openMajorNcs + sc.openMinorNcs}</span>
                  <span>{sc.recommendedCadence}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Analytical Visualization Split: 6-Month Compliance Trend + 5x5 Risk Matrix */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Xu hướng Điểm Tuân thủ Hybrid (6 Tháng)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Di chuyển chuột qua các mốc tháng để đối chiếu nhà máy dẫn đầu, trung bình và nhóm cần giám sát
                </p>
              </div>
            </div>
            <ComplianceTrendChart scorecards={scorecards} selectedFactoryId={scopedFactoryId} />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Mục tiêu Quý 4: ≥ 85.0 điểm trung bình Tập đoàn</span>
            <span>Tỷ trọng: 25% Tự đánh giá · 45% Audit · 20% CAPA · 10% Bằng chứng</span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Ma trận Rủi ro Quy trình (5×5)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khả năng xảy ra × Mức độ tác động
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('risks')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>Sổ rủi ro</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[5, 4, 3, 2, 1].map((likelihood) =>
                [1, 2, 3, 4, 5].map((impact) => {
                  const score = likelihood * impact;
                  const count = visibleRisks.filter(
                    (r) =>
                      r.likelihood === likelihood &&
                      r.impact === impact &&
                      r.status !== 'Controlled'
                  ).length;
                  let cellBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  if (score >= 16) cellBg = 'bg-red-100 text-red-900 border-red-200';
                  else if (score >= 10) cellBg = 'bg-amber-100 text-amber-900 border-amber-200';
                  else if (score >= 5) cellBg = 'bg-yellow-50 text-yellow-900 border-yellow-200';

                  return (
                    <button
                      key={`${likelihood}-${impact}`}
                      type="button"
                      onClick={() => onNavigate('risks')}
                      title={`Khả năng ${likelihood} × Tác động ${impact} = ${score} điểm (${count} rủi ro)`}
                      className={`h-11 rounded border ${cellBg} flex flex-col items-center justify-center transition-transform hover:scale-[1.03]`}
                    >
                      <span className="font-mono text-xs font-bold tabular-nums">
                        {count > 0 ? count : '·'}
                      </span>
                      <span className="font-mono text-[10px] opacity-70 tabular-nums">
                        {score}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Trục dọc: Khả năng (1→5)</span>
              <span>Trục ngang: Tác động (1→5)</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs tabular-nums">
            <div className="text-slate-600">
              Critical:{' '}
              <strong className="font-mono text-red-700">
                {visibleRisks.filter((r) => r.riskLevel === 'Critical').length}
              </strong>
            </div>
            <div className="text-slate-600">
              High:{' '}
              <strong className="font-mono text-amber-700">
                {visibleRisks.filter((r) => r.riskLevel === 'High').length}
              </strong>
            </div>
            <div className="text-slate-600">
              Controlled:{' '}
              <strong className="font-mono text-emerald-700">
                {visibleRisks.filter((r) => r.status === 'Controlled').length}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* ISO Standard × 7 Factory Compliance Coverage Matrix */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Ma trận Mức độ Sẵn sàng theo Bộ Tiêu chuẩn ISO × 7 Nhà máy
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiển thị trạng thái áp dụng và điểm sẵn sàng thực tế có xét tới các NC đang mở
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('standards')}
            className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
          >
            Cấu hình Tiêu chuẩn Động →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Nhà máy</th>
                {state.standards.map((std) => (
                  <th key={std.id} className="py-3 px-4 text-center">
                    {std.code}
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Chu kỳ Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {visibleScorecards.map((sc) => (
                <tr
                  key={sc.factoryId}
                  onClick={() => setDrawerFactoryId(sc.factoryId)}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900">{sc.factoryCode}</span>
                    <span className="text-slate-500 ml-2 hidden sm:inline">{sc.factoryName}</span>
                  </td>
                  {state.standards.map((std) => {
                    const cell = getFactoryStandardCell(sc.factoryId, std.id);
                    if (!cell) {
                      return (
                        <td key={std.id} className="py-3 px-4 text-center text-slate-300 font-mono">
                          —
                        </td>
                      );
                    }
                    const tone = cell.hasMajor
                      ? 'text-red-700 bg-red-50/70'
                      : cell.score >= 86
                        ? 'text-emerald-700 bg-emerald-50/60'
                        : 'text-amber-700 bg-amber-50/60';
                    return (
                      <td key={std.id} className={`py-3 px-4 text-center font-mono tabular-nums ${tone}`}>
                        <span className="font-bold">{cell.score}%</span>
                        {cell.openCount > 0 && (
                          <span className="ml-1.5 text-[11px] opacity-80">
                            ({cell.openCount} NC)
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                    {sc.recommendedCadence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Split: Priority NC/CAPA Queue & Upcoming Risk-Based Audits */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Hồ sơ NC & CAPA cần ưu tiên xử lý
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('nc-capa')}
              className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              Mở tất cả NC
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {openAllNcs.slice(0, 4).map((nc) => (
              <div key={nc.id} className="px-6 py-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    {nc.severity === 'Major NC' ? (
                      <ShieldAlert className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    )}
                    <span className="font-mono font-semibold text-slate-900">{nc.ncCode}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-medium text-slate-700">{nc.factoryId}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">Điều khoản {nc.clauseCode}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-800 truncate">{nc.title}</p>
                  <div className="mt-1 text-xs text-slate-500">
                    Phụ trách: {nc.owner} · Hạn:{' '}
                    <span className="font-mono tabular-nums">{nc.dueDate}</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold shrink-0 ${
                    nc.severity === 'Major NC' ? 'text-red-700' : 'text-amber-700'
                  }`}
                >
                  {nc.status}
                </span>
              </div>
            ))}
            {openAllNcs.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                Không có NC đang mở trong phạm vi nhà máy này.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Chương trình Audit theo Rủi ro
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('audits')}
              className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              Chấm Checklist
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {visibleAudits.slice(0, 4).map((au) => (
              <div key={au.id} className="px-6 py-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                    <span className="font-mono font-semibold text-slate-900">{au.auditCode}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-medium text-slate-700">{au.factoryId}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{au.standardId}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {au.auditType} · Mức rủi ro {au.riskTriggerLevel}
                  </p>
                  <div className="mt-1 text-xs text-slate-500">
                    Trưởng đoàn: {au.leadAuditor} · Ngày:{' '}
                    <span className="font-mono tabular-nums">{au.plannedDate}</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold shrink-0 ${
                    au.status === 'Completed'
                      ? 'text-emerald-700'
                      : au.status === 'In Progress'
                        ? 'text-blue-700'
                        : 'text-slate-600'
                  }`}
                >
                  {au.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slide-Over Factory Executive Inspector Drawer */}
      {drawerFactory && drawerScorecard && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={() => setDrawerFactoryId(null)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white h-full border-l border-slate-200 overflow-y-auto flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-900 text-white">
              <div>
                <div className="flex items-center gap-2 text-xs text-blue-300">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Hồ sơ Điều hành Nhà máy · Hạng #{drawerScorecard.rank}</span>
                </div>
                <h3 className="font-display text-lg font-bold mt-1">
                  {drawerFactory.code} — {drawerFactory.name}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  {drawerFactory.location} · {drawerFactory.headcount.toLocaleString()} nhân sự · Quản lý: {drawerFactory.isoManager}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerFactoryId(null)}
                className="p-1.5 text-slate-400 hover:text-white"
                aria-label="Đóng chi tiết nhà máy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-500">Điểm Hybrid Tổng hợp</div>
                  <div className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
                    {drawerScorecard.hybridScore}{' '}
                    <span className="text-sm font-normal text-slate-500">
                      / 100 · Hạng {drawerScorecard.grade}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-slate-500">Chu kỳ Audit đề xuất</div>
                  <div className="font-semibold text-blue-700 mt-0.5">
                    {drawerScorecard.recommendedCadence}
                  </div>
                </div>
              </div>

              <HybridRadarChart target={drawerScorecard} benchmark={groupBench} />

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700">
                  Bộ tiêu chuẩn áp dụng ({drawerFactory.activeStandards.length})
                </div>
                <div className="text-xs font-mono text-slate-600">
                  {drawerFactory.activeStandards.join(' · ')}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700">
                  NC đang mở ({drawerScorecard.openMajorNcs + drawerScorecard.openMinorNcs})
                </div>
                <div className="space-y-2">
                  {state.ncs
                    .filter((n) => n.factoryId === drawerFactory.id && n.status !== 'Closed')
                    .map((nc) => (
                      <div key={nc.id} className="text-xs p-2.5 rounded bg-slate-50 border border-slate-200">
                        <div className="flex justify-between font-mono">
                          <span className="font-semibold text-slate-900">{nc.ncCode}</span>
                          <span className={nc.severity === 'Major NC' ? 'text-red-700 font-semibold' : 'text-amber-700'}>
                            {nc.severity}
                          </span>
                        </div>
                        <div className="mt-1 text-slate-700">{nc.title}</div>
                      </div>
                    ))}
                  {drawerScorecard.openMajorNcs + drawerScorecard.openMinorNcs === 0 && (
                    <div className="text-xs text-emerald-700">
                      Không có NC nào đang mở tại nhà máy này.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  onSelectFactoryFilter(drawerFactory.id);
                  setDrawerFactoryId(null);
                  onNavigate('scorecard');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
              >
                Mở Scorecard Nhà máy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
