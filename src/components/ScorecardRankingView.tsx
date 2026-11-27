import React, { useState } from 'react';
import { Download, Trophy } from 'lucide-react';
import { HybridRadarChart } from './Charts';
import type { CentralDatabaseState } from '../types/iso';

interface ScorecardRankingViewProps {
  state: CentralDatabaseState;
  scopedFactoryId: string | 'ALL';
  selectedFactoryFilter: string;
  onChangeFactoryFilter: (id: string) => void;
}

export const ScorecardRankingView: React.FC<ScorecardRankingViewProps> = ({
  state,
  scopedFactoryId,
  selectedFactoryFilter,
  onChangeFactoryFilter,
}) => {
  const [gradeFilter, setGradeFilter] = useState<'ALL' | 'A+' | 'A' | 'B' | 'C'>('ALL');
  const scorecards = state.scorecards || [];

  const filtered = scorecards.filter((sc) => {
    if (scopedFactoryId !== 'ALL' && sc.factoryId !== scopedFactoryId) return false;
    if (gradeFilter !== 'ALL' && sc.grade !== gradeFilter) return false;
    return true;
  });

  const activeDetail =
    scorecards.find((s) => s.factoryId === selectedFactoryFilter) ||
    filtered[0] ||
    scorecards[0];

  const benchmark = {
    selfAssessment:
      scorecards.reduce((s, c) => s + c.selfAssessmentScore, 0) / (scorecards.length || 1),
    auditCompliance:
      scorecards.reduce((s, c) => s + c.auditComplianceScore, 0) / (scorecards.length || 1),
    capaClosure:
      scorecards.reduce((s, c) => s + c.capaClosureScore, 0) / (scorecards.length || 1),
    evidence:
      scorecards.reduce((s, c) => s + c.evidenceScore, 0) / (scorecards.length || 1),
  };

  const handleExportCsv = () => {
    const header = [
      'Hang',
      'Ma Nha may',
      'Ten Nha may',
      'Diem Hybrid',
      'Xep loai',
      'Tu danh gia (25%)',
      'Audit Compliance (45%)',
      'Dong CAPA (20%)',
      'Bang chung (10%)',
      'Diem tru NC',
      'Major NC mo',
      'Minor NC mo',
      'Chu ky Audit de xuat',
    ];
    const rows = filtered.map((s) => [
      s.rank,
      s.factoryCode,
      `"${s.factoryName}"`,
      s.hybridScore,
      s.grade,
      s.selfAssessmentScore,
      s.auditComplianceScore,
      s.capaClosureScore,
      s.evidenceScore,
      s.penaltyPoints,
      s.openMajorNcs,
      s.openMinorNcs,
      `"${s.recommendedCadence}"`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ISO_Control_Pro_Scorecard_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-md w-fit">
          {(['ALL', 'A+', 'A', 'B', 'C'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGradeFilter(g)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                gradeFilter === g
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {g === 'ALL' ? 'Tất cả Hạng' : `Hạng ${g}`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap w-fit"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Xuất CSV Bảng xếp hạng</span>
        </button>
      </div>

      {/* Selected Factory Scorecard + SVG Radar Benchmark */}
      {activeDetail && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs text-slate-500">
                  Hồ sơ Scorecard · Xếp hạng #{activeDetail.rank} trên 7 nhà máy
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                  {activeDetail.factoryCode} — {activeDetail.factoryName}
                </h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-blue-700 tabular-nums">
                  {activeDetail.hybridScore.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">
                  / 100 · Xếp loại {activeDetail.grade}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <div>
                <div className="text-xs text-slate-500">Tự đánh giá (25%)</div>
                <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                  {activeDetail.selfAssessmentScore}%
                </div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${activeDetail.selfAssessmentScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Audit (45%)</div>
                <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                  {activeDetail.auditComplianceScore}%
                </div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${activeDetail.auditComplianceScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Đóng CAPA (20%)</div>
                <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                  {activeDetail.capaClosureScore}%
                </div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-amber-600"
                    style={{ width: `${activeDetail.capaClosureScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Bằng chứng (10%)</div>
                <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                  {activeDetail.evidenceScore}%
                </div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-slate-700"
                    style={{ width: `${activeDetail.evidenceScore}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-6 text-xs text-slate-600 tabular-nums">
              <span>
                Major NC mở: <strong className="text-red-700">{activeDetail.openMajorNcs}</strong>
              </span>
              <span>
                Minor NC mở: <strong className="text-amber-700">{activeDetail.openMinorNcs}</strong>
              </span>
              <span>
                Điểm trừ NC: <strong className="text-red-700">-{activeDetail.penaltyPoints}</strong>
              </span>
              <span>
                Tần suất Audit đề xuất:{' '}
                <strong className="text-blue-700">{activeDetail.recommendedCadence}</strong>
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 flex justify-center">
            <HybridRadarChart target={activeDetail} benchmark={benchmark} />
          </div>
        </div>
      )}

      {/* Ranking Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-blue-700" />
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Bảng xếp hạng Tuân thủ Hybrid (Nhấn dòng để đối chiếu Radar)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            0.25×Tự đánh giá + 0.45×Audit + 0.20×CAPA + 0.10×Bằng chứng − Điểm trừ NC
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-16">Hạng</th>
                <th className="py-3 px-4">Nhà máy</th>
                <th className="py-3 px-4 text-right">Điểm Hybrid</th>
                <th className="py-3 px-4 text-center">Xếp loại</th>
                <th className="py-3 px-4 text-right">Tự đánh giá</th>
                <th className="py-3 px-4 text-right">Audit</th>
                <th className="py-3 px-4 text-right">CAPA</th>
                <th className="py-3 px-4 text-right">Trừ NC</th>
                <th className="py-3 px-4">Chu kỳ Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((sc) => {
                const isSelected = activeDetail?.factoryId === sc.factoryId;
                return (
                  <tr
                    key={sc.factoryId}
                    onClick={() => onChangeFactoryFilter(sc.factoryId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 tabular-nums">
                      #{sc.rank}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{sc.factoryCode}</div>
                      <div className="text-xs text-slate-500">{sc.factoryName}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {sc.hybridScore.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-mono text-xs font-semibold ${
                          sc.grade === 'A+' || sc.grade === 'A'
                            ? 'text-emerald-700'
                            : sc.grade === 'B'
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }`}
                      >
                        {sc.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {sc.selfAssessmentScore.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {sc.auditComplianceScore.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {sc.capaClosureScore.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-700 tabular-nums">
                      {sc.penaltyPoints > 0 ? `-${sc.penaltyPoints}` : '0.0'}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {sc.recommendedCadence}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-slate-500">
                    Không có nhà máy nào khớp với bộ lọc hạng đã chọn.
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
