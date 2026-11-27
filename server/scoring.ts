import type { CentralDatabaseState, FactoryScorecard } from '../src/types/iso.ts';

export function computeRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score >= 16) return 'Critical';
  if (score >= 10) return 'High';
  if (score >= 5) return 'Medium';
  return 'Low';
}

export function computeAuditCadence(
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
): '3 tháng/lần' | '6 tháng/lần' | '12 tháng/lần' {
  if (riskLevel === 'Critical' || riskLevel === 'High') return '3 tháng/lần';
  if (riskLevel === 'Medium') return '6 tháng/lần';
  return '12 tháng/lần';
}

export function computeScorecards(state: CentralDatabaseState): FactoryScorecard[] {
  const raw = state.factories.map((factory) => {
    // 1. Self-Assessment average (25%)
    const factoryAssessments = state.assessments.filter((a) => a.factoryId === factory.id);
    const selfAvg =
      factoryAssessments.length > 0
        ? factoryAssessments.reduce((sum, a) => sum + a.selfScore, 0) / factoryAssessments.length
        : 78;

    // 2. Audit Checklist compliance (45%)
    const factoryAudits = state.audits.filter((au) => au.factoryId === factory.id);
    const gradedItems = factoryAudits
      .flatMap((au) => au.checklist)
      .filter((item) => item.result !== 'Pending');

    let auditAvg = 84;
    if (gradedItems.length > 0) {
      let totalWeight = 0;
      let earnedWeight = 0;
      for (const item of gradedItems) {
        const w = item.weight || 1;
        totalWeight += w;
        if (item.result === 'Compliant') earnedWeight += w * 1.0;
        else if (item.result === 'OFI') earnedWeight += w * 0.9;
        else if (item.result === 'Minor NC') earnedWeight += w * 0.55;
        else if (item.result === 'Major NC') earnedWeight += w * 0.1;
      }
      auditAvg = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 84;
    }

    // 3. CAPA Closure & Verification (20%)
    const factoryNcs = state.ncs.filter((nc) => nc.factoryId === factory.id);
    const closedOrVerified = factoryNcs.filter(
      (nc) => nc.status === 'Closed' || nc.status === 'Verified'
    ).length;
    const capaScore =
      factoryNcs.length > 0 ? (closedOrVerified / factoryNcs.length) * 100 : 95;

    // 4. Evidence & Document readiness (10%)
    const factoryDocs = state.documents.filter(
      (d) => d.factoryScope === 'ALL' || d.factoryScope === factory.id
    );
    const approvedDocs = factoryDocs.filter((d) => d.status === 'Approved').length;
    const docRate = factoryDocs.length > 0 ? (approvedDocs / factoryDocs.length) * 100 : 85;
    const factoryEvidences = state.evidences.filter((e) => e.factoryId === factory.id);
    const verifiedEv = factoryEvidences.filter((e) => e.verified).length;
    const evRate = factoryEvidences.length > 0 ? (verifiedEv / factoryEvidences.length) * 100 : 80;
    const evidenceScore = docRate * 0.5 + evRate * 0.5;

    // 5. NC Penalties
    const openMajorNcs = factoryNcs.filter(
      (nc) => nc.severity === 'Major NC' && nc.status !== 'Closed'
    ).length;
    const openMinorNcs = factoryNcs.filter(
      (nc) => nc.severity === 'Minor NC' && nc.status !== 'Closed'
    ).length;
    const penaltyPoints = Number((openMajorNcs * 4 + openMinorNcs * 1.2).toFixed(1));

    const weighted =
      selfAvg * 0.25 + auditAvg * 0.45 + capaScore * 0.2 + evidenceScore * 0.1 - penaltyPoints;
    const hybridScore = Math.max(0, Math.min(100, Number(weighted.toFixed(1))));

    const highRiskCount = state.risks.filter(
      (r) =>
        r.factoryId === factory.id &&
        (r.riskLevel === 'High' || r.riskLevel === 'Critical') &&
        r.status !== 'Controlled'
    ).length;

    const grade: 'A+' | 'A' | 'B' | 'C' =
      hybridScore >= 90 ? 'A+' : hybridScore >= 82 ? 'A' : hybridScore >= 72 ? 'B' : 'C';

    const recommendedCadence: '3 tháng/lần' | '6 tháng/lần' | '12 tháng/lần' =
      openMajorNcs > 0 || highRiskCount >= 2 || hybridScore < 75
        ? '3 tháng/lần'
        : highRiskCount === 1 || hybridScore < 86
          ? '6 tháng/lần'
          : '12 tháng/lần';

    return {
      factoryId: factory.id,
      factoryCode: factory.code,
      factoryName: factory.name,
      rank: 1,
      grade,
      hybridScore,
      selfAssessmentScore: Number(selfAvg.toFixed(1)),
      auditComplianceScore: Number(auditAvg.toFixed(1)),
      capaClosureScore: Number(capaScore.toFixed(1)),
      evidenceScore: Number(evidenceScore.toFixed(1)),
      penaltyPoints,
      openMajorNcs,
      openMinorNcs,
      highRiskCount,
      recommendedCadence,
    };
  });

  raw.sort((a, b) => b.hybridScore - a.hybridScore);
  return raw.map((item, idx) => ({ ...item, rank: idx + 1 }));
}
