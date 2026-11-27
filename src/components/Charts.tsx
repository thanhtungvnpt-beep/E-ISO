import React, { useState } from 'react';
import type { FactoryScorecard } from '../types/iso';

interface ComplianceTrendChartProps {
  scorecards: FactoryScorecard[];
  selectedFactoryId: string | 'ALL';
}

const MONTHS = ['T6/26', 'T7/26', 'T8/26', 'T9/26', 'T10/26', 'T11/26'];

export const ComplianceTrendChart: React.FC<ComplianceTrendChartProps> = ({
  scorecards,
  selectedFactoryId,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const avgNow =
    scorecards.length > 0
      ? scorecards.reduce((s, c) => s + c.hybridScore, 0) / scorecards.length
      : 82;
  const topFactory = scorecards[0];
  const watchFactory = scorecards[scorecards.length - 1];
  const focusFactory =
    selectedFactoryId !== 'ALL'
      ? scorecards.find((s) => s.factoryId === selectedFactoryId)
      : null;

  // Deterministic historical curve anchored to live current Hybrid scores
  const buildSeries = (currentVal: number, deltas: number[]) =>
    deltas.map((d) => Math.max(50, Math.min(100, Number((currentVal + d).toFixed(1)))));

  const groupSeries = buildSeries(avgNow, [-5.4, -4.1, -3.2, -2.0, -0.9, 0]);
  const topSeries = buildSeries(topFactory?.hybridScore ?? 92, [-3.8, -2.9, -2.1, -1.4, -0.6, 0]);
  const watchSeries = buildSeries(
    (focusFactory ?? watchFactory)?.hybridScore ?? 71,
    [-4.2, -2.5, -3.5, -1.8, -0.7, 0]
  );

  const width = 560;
  const height = 210;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const minY = 55;
  const maxY = 100;

  const toX = (idx: number) => padL + (idx / (MONTHS.length - 1)) * plotW;
  const toY = (val: number) =>
    padT + plotH - ((Math.max(minY, Math.min(maxY, val)) - minY) / (maxY - minY)) * plotH;

  const toPath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');

  const watchLabel = focusFactory
    ? `${focusFactory.factoryCode}`
    : `${watchFactory?.factoryCode ?? 'Watchlist'}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="inline-block w-3 h-0.5 bg-emerald-600" />
            <span>Dẫn đầu ({topFactory?.factoryCode})</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="inline-block w-3 h-0.5 bg-blue-700" />
            <span>Trung bình Tập đoàn</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="inline-block w-3 h-0.5 bg-amber-600" />
            <span>{focusFactory ? `Đang chọn (${watchLabel})` : `Cần chú ý (${watchLabel})`}</span>
          </div>
        </div>
        {hoveredIdx !== null && (
          <div className="font-mono text-xs text-slate-600 tabular-nums">
            {MONTHS[hoveredIdx]} · {topFactory?.factoryCode}: {topSeries[hoveredIdx]} · TB:{' '}
            {groupSeries[hoveredIdx]} · {watchLabel}: {watchSeries[hoveredIdx]}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-52 overflow-visible select-none"
        role="img"
        aria-label="Biểu đồ xu hướng điểm tuân thủ Hybrid 6 tháng"
      >
        {[60, 70, 80, 90, 100].map((tick) => {
          const y = toY(tick);
          return (
            <g key={tick}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke={tick === 85 ? '#93c5fd' : '#e2e8f0'}
                strokeDasharray={tick === 85 ? '4 4' : undefined}
                strokeWidth={1}
              />
              <text
                x={padL - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Threshold Label */}
        <text
          x={width - padR}
          y={toY(85) - 5}
          textAnchor="end"
          className="fill-blue-600 text-[9px] font-medium"
        >
          Chuẩn SEV (85đ)
        </text>

        {/* Paths */}
        <path d={toPath(topSeries)} fill="none" stroke="#059669" strokeWidth={2.25} />
        <path d={toPath(groupSeries)} fill="none" stroke="#1d4ed8" strokeWidth={2.25} />
        <path
          d={toPath(watchSeries)}
          fill="none"
          stroke="#d97706"
          strokeWidth={2.25}
          strokeDasharray="5 3"
        />

        {/* Points & Hover Columns */}
        {MONTHS.map((m, idx) => {
          const x = toX(idx);
          const isHovered = hoveredIdx === idx;
          return (
            <g
              key={m}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {isHovered && (
                <line
                  x1={x}
                  y1={padT}
                  x2={x}
                  y2={height - padB}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                />
              )}
              <circle
                cx={x}
                cy={toY(topSeries[idx])}
                r={isHovered ? 4.5 : 3}
                fill="#059669"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <circle
                cx={x}
                cy={toY(groupSeries[idx])}
                r={isHovered ? 4.5 : 3}
                fill="#1d4ed8"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <circle
                cx={x}
                cy={toY(watchSeries[idx])}
                r={isHovered ? 4.5 : 3}
                fill="#d97706"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                className={`text-[10px] font-mono ${
                  isHovered ? 'fill-slate-900 font-semibold' : 'fill-slate-500'
                }`}
              >
                {m}
              </text>
              <rect
                x={x - 24}
                y={padT}
                width={48}
                height={plotH}
                fill="transparent"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

interface HybridRadarChartProps {
  target: FactoryScorecard;
  benchmark: {
    selfAssessment: number;
    auditCompliance: number;
    capaClosure: number;
    evidence: number;
  };
}

export const HybridRadarChart: React.FC<HybridRadarChartProps> = ({ target, benchmark }) => {
  const size = 250;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 84;

  const axes = [
    {
      label: 'Tự đánh giá',
      val: target.selfAssessmentScore,
      bench: benchmark.selfAssessment,
      angle: -Math.PI / 2,
    },
    {
      label: 'Audit',
      val: target.auditComplianceScore,
      bench: benchmark.auditCompliance,
      angle: 0,
    },
    {
      label: 'Đóng CAPA',
      val: target.capaClosureScore,
      bench: benchmark.capaClosure,
      angle: Math.PI / 2,
    },
    {
      label: 'Bằng chứng',
      val: target.evidenceScore,
      bench: benchmark.evidence,
      angle: Math.PI,
    },
  ];

  const getPoint = (score: number, angle: number) => {
    const r = (Math.max(0, Math.min(100, score)) / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const targetPoly = axes
    .map((a) => getPoint(a.val, a.angle).map((n) => n.toFixed(1)).join(','))
    .join(' ');
  const benchPoly = axes
    .map((a) => getPoint(a.bench, a.angle).map((n) => n.toFixed(1)).join(','))
    .join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-60 h-60"
        role="img"
        aria-label={`Biểu đồ radar 4 trụ cột Hybrid của ${target.factoryCode}`}
      >
        {[25, 50, 75, 100].map((ring) => {
          const pts = axes
            .map((a) => getPoint(ring, a.angle).map((n) => n.toFixed(1)).join(','))
            .join(' ');
          return (
            <polygon
              key={ring}
              points={pts}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          );
        })}

        {axes.map((a) => {
          const [x, y] = getPoint(100, a.angle);
          const [lx, ly] = getPoint(122, a.angle);
          return (
            <g key={a.label}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="#cbd5e1" strokeWidth={1} />
              <text
                x={lx}
                y={ly + 3}
                textAnchor="middle"
                className="fill-slate-700 text-[10px] font-semibold"
              >
                {a.label}
              </text>
            </g>
          );
        })}

        <polygon
          points={benchPoly}
          fill="#94a3b8"
          fillOpacity={0.14}
          stroke="#64748b"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        <polygon
          points={targetPoly}
          fill="#1d4ed8"
          fillOpacity={0.2}
          stroke="#1d4ed8"
          strokeWidth={2}
        />
        {axes.map((a) => {
          const [px, py] = getPoint(a.val, a.angle);
          return <circle key={a.label} cx={px} cy={py} r={3.5} fill="#1d4ed8" />;
        })}
      </svg>

      <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
        <span className="inline-flex items-center gap-1.5 font-medium text-blue-800">
          <span className="inline-block w-2.5 h-2.5 bg-blue-700/25 border border-blue-700" />
          {target.factoryCode}
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-500">
          <span className="inline-block w-2.5 h-2.5 bg-slate-400/20 border border-slate-500 border-dashed" />
          TB 7 Nhà máy
        </span>
      </div>
    </div>
  );
};
