import { useCallback, useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { ControlTowerView } from './components/ControlTowerView';
import { ScorecardRankingView } from './components/ScorecardRankingView';
import { RiskManagementView } from './components/RiskManagementView';
import { DocumentsComplianceView } from './components/DocumentsComplianceView';
import { AuditProgramChecklistView } from './components/AuditProgramChecklistView';
import { NcCapaView } from './components/NcCapaView';
import { FactoriesStandardsView } from './components/FactoriesStandardsView';
import { RbacAuditLogView } from './components/RbacAuditLogView';
import { AiAssistantView } from './components/AiAssistantView';
import { isoApi, type ActorMeta } from './lib/api';
import type { CentralDatabaseState, ModuleKey, RiskItem } from './types/iso';

export default function App() {
  const [state, setState] = useState<CentralDatabaseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleKey>('control-tower');
  const [activeUserId, setActiveUserId] = useState<string>('u-1');
  const [selectedFactoryScope, setSelectedFactoryScope] = useState<string | 'ALL'>('ALL');
  const [selectedFactoryFilter, setSelectedFactoryFilter] = useState<string>('KHV');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const notify = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }, []);

  const fetchState = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await isoApi.getState();
      setState(data);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Không thể tải dữ liệu hệ thống.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  if (loading && !state) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 space-y-3">
          <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-4/5 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (loadError || !state) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h1 className="font-display text-base font-bold text-slate-900">
            Lỗi kết nối ISO CONTROL PRO
          </h1>
          <p className="text-sm text-red-700">{loadError || 'Không có dữ liệu.'}</p>
          <button
            type="button"
            onClick={fetchState}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const activeUser =
    state.users.find((u) => u.id === activeUserId) || state.users[0];
  const scopedFactoryId =
    activeUser.assignedFactoryId !== 'ALL' ? activeUser.assignedFactoryId : selectedFactoryScope;

  const actor: ActorMeta = {
    actorName: activeUser.fullName,
    actorRole: activeUser.role,
  };

  const applyMutation = async (
    promise: Promise<CentralDatabaseState>,
    successMsg: string
  ) => {
    try {
      const next = await promise;
      setState(next);
      notify('ok', successMsg);
    } catch (err: unknown) {
      notify('err', err instanceof Error ? err.message : 'Thao tác thất bại.');
    }
  };

  const handleTriggerAuditFromRisk = async (risk: RiskItem) => {
    await applyMutation(
      isoApi.scheduleAudit({
        ...actor,
        factoryId: risk.factoryId,
        standardId: risk.standardId,
        auditType: 'Risk-Based Scheduled',
        riskTriggerLevel: risk.riskLevel,
        plannedDate: '2026-12-12',
      }),
      `Đã tạo lịch Risk-Based Audit cho ${risk.factoryId} (${risk.riskLevel}).`
    );
    setActiveModule('audits');
  };

  const primaryActionLabel =
    activeModule === 'ai-assistant' ? 'Về Control Tower' : 'Trợ lý AI Gemini';

  const handlePrimaryAction = () => {
    if (activeModule === 'ai-assistant') {
      setActiveModule('control-tower');
    } else {
      setActiveModule('ai-assistant');
    }
  };

  return (
    <Layout
      state={state}
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      activeUser={activeUser}
      users={state.users}
      onSwitchUser={(id) => {
        setActiveUserId(id);
        const found = state.users.find((u) => u.id === id);
        if (found) {
          if (found.assignedFactoryId !== 'ALL') {
            setSelectedFactoryFilter(found.assignedFactoryId);
          }
          notify(
            'ok',
            `Đã chuyển sang ${found.fullName} (${
              found.assignedFactoryId === 'ALL'
                ? 'Phạm vi 7 nhà máy'
                : `RLS: ${found.assignedFactoryId}`
            }).`
          );
        }
      }}
      selectedFactoryScope={selectedFactoryScope}
      onChangeFactoryScope={(scope) => {
        setSelectedFactoryScope(scope);
        if (scope !== 'ALL') setSelectedFactoryFilter(scope);
      }}
      onPrimaryAction={handlePrimaryAction}
      primaryActionLabel={primaryActionLabel}
    >
      {toast && (
        <div
          role="status"
          className={`mb-5 px-4 py-2.5 rounded-md border text-xs font-medium flex items-center justify-between ${
            toast.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-4 text-xs underline opacity-80 hover:opacity-100"
          >
            Đóng
          </button>
        </div>
      )}

      {activeModule === 'control-tower' && (
        <ControlTowerView
          state={state}
          scopedFactoryId={scopedFactoryId}
          onNavigate={setActiveModule}
          onSelectFactoryFilter={setSelectedFactoryFilter}
        />
      )}

      {activeModule === 'scorecard' && (
        <ScorecardRankingView
          state={state}
          scopedFactoryId={scopedFactoryId}
          selectedFactoryFilter={selectedFactoryFilter}
          onChangeFactoryFilter={setSelectedFactoryFilter}
        />
      )}

      {activeModule === 'risks' && (
        <RiskManagementView
          state={state}
          scopedFactoryId={scopedFactoryId}
          onAddRisk={(p) => applyMutation(isoApi.addRisk({ ...p, ...actor }), 'Đã lưu rủi ro mới.')}
          onUpdateRisk={(id, p) =>
            applyMutation(isoApi.updateRisk(id, { ...p, ...actor }), 'Đã cập nhật trạng thái rủi ro.')
          }
          onTriggerAuditFromRisk={handleTriggerAuditFromRisk}
        />
      )}

      {activeModule === 'documents' && (
        <DocumentsComplianceView
          state={state}
          scopedFactoryId={scopedFactoryId}
          onAddDocument={(p) =>
            applyMutation(isoApi.addDocument({ ...p, ...actor }), 'Đã ban hành tài liệu mới.')
          }
          onUpdateDocument={(id, p) =>
            applyMutation(isoApi.updateDocument(id, { ...p, ...actor }), 'Đã cập nhật tài liệu.')
          }
          onSaveAssessment={(p) =>
            applyMutation(
              isoApi.saveAssessment({ ...p, ...actor }),
              'Đã lưu tự đánh giá và cập nhật Điểm Hybrid.'
            )
          }
          onAddEvidence={(p) =>
            applyMutation(isoApi.addEvidence({ ...p, ...actor }), 'Đã tải lên bằng chứng.')
          }
          onToggleVerifyEvidence={(id, verified) =>
            applyMutation(
              isoApi.toggleVerifyEvidence(id, verified, actor),
              verified ? 'Đã xác nhận bằng chứng.' : 'Đã bỏ xác nhận bằng chứng.'
            )
          }
        />
      )}

      {activeModule === 'audits' && (
        <AuditProgramChecklistView
          state={state}
          scopedFactoryId={scopedFactoryId}
          onScheduleAudit={(p) =>
            applyMutation(isoApi.scheduleAudit({ ...p, ...actor }), 'Đã tạo đợt Audit mới.')
          }
          onGradeItem={(auditId, itemId, p) =>
            applyMutation(
              isoApi.gradeChecklistItem(auditId, itemId, { ...p, ...actor }),
              'Đã lưu kết quả Checklist & tính lại Điểm Hybrid.'
            )
          }
        />
      )}

      {activeModule === 'nc-capa' && (
        <NcCapaView
          state={state}
          scopedFactoryId={scopedFactoryId}
          onCreateNc={(p) =>
            applyMutation(isoApi.createNc({ ...p, ...actor }), 'Đã mở hồ sơ NC mới.')
          }
          onUpdateNc={(id, p) =>
            applyMutation(isoApi.updateNc(id, { ...p, ...actor }), 'Đã cập nhật CAPA & Hiệu lực.')
          }
        />
      )}

      {activeModule === 'standards' && (
        <FactoriesStandardsView
          state={state}
          scopedFactoryId={scopedFactoryId}
          onAddFactory={(p) =>
            applyMutation(isoApi.addFactory({ ...p, ...actor }), 'Đã thêm nhà máy mới.')
          }
          onAddClause={(stdId, p) =>
            applyMutation(
              isoApi.addClause(stdId, { ...p, ...actor }),
              'Đã thêm điều khoản ISO động.'
            )
          }
          onUpdateClause={(stdId, clauseId, p) =>
            applyMutation(
              isoApi.updateClause(stdId, clauseId, { ...p, ...actor }),
              'Đã cập nhật trọng số điều khoản.'
            )
          }
        />
      )}

      {activeModule === 'rbac' && (
        <RbacAuditLogView
          state={state}
          activeUser={activeUser}
          onSwitchUser={(id) => setActiveUserId(id)}
          onResetDemo={() =>
            applyMutation(isoApi.resetDemo(actor), 'Đã khôi phục dữ liệu mẫu 7 nhà máy.')
          }
        />
      )}

      {activeModule === 'ai-assistant' && (
        <AiAssistantView
          state={state}
          scopedFactoryId={scopedFactoryId}
          onToggleAlert={(id, enabled) =>
            applyMutation(
              isoApi.toggleAlertRule(id, enabled, actor),
              enabled ? 'Đã bật quy tắc cảnh báo.' : 'Đã tắt quy tắc cảnh báo.'
            )
          }
        />
      )}
    </Layout>
  );
}
