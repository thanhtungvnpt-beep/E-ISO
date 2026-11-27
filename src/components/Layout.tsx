import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Building2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import type { CentralDatabaseState, ModuleKey, UserAccount } from '../types/iso';

interface LayoutProps {
  state: CentralDatabaseState;
  activeModule: ModuleKey;
  onSelectModule: (mod: ModuleKey) => void;
  activeUser: UserAccount;
  users: UserAccount[];
  onSwitchUser: (userId: string) => void;
  selectedFactoryScope: string | 'ALL';
  onChangeFactoryScope: (factoryId: string | 'ALL') => void;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  children: React.ReactNode;
}

interface NavGroup {
  groupLabel: string;
  items: { key: ModuleKey; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: 'Control Tower',
    items: [
      { key: 'control-tower', label: 'Tổng quan Điều hành', icon: LayoutDashboard },
      { key: 'scorecard', label: 'Scorecard & Xếp hạng', icon: Trophy },
      { key: 'risks', label: 'Quản lý Rủi ro', icon: AlertTriangle },
    ],
  },
  {
    groupLabel: 'Tài liệu & Tuân thủ',
    items: [
      { key: 'documents', label: 'Tài liệu & Tự đánh giá', icon: FileText },
    ],
  },
  {
    groupLabel: 'Audit & CAPA',
    items: [
      { key: 'audits', label: 'Audit Program & Checklist', icon: ClipboardCheck },
      { key: 'nc-capa', label: 'Quản lý NC & CAPA', icon: Activity },
    ],
  },
  {
    groupLabel: 'Nền tảng & AI',
    items: [
      { key: 'standards', label: 'Nhà máy & Tiêu chuẩn ISO', icon: Building2 },
      { key: 'rbac', label: 'Phân quyền RBAC & Nhật ký', icon: Users },
      { key: 'ai-assistant', label: 'Trợ lý AI & Cảnh báo', icon: Bot },
    ],
  },
];

const MODULE_TITLES: Record<ModuleKey, string> = {
  'control-tower': 'Tổng quan Control Tower (7 Nhà máy)',
  scorecard: 'Bảng điểm Hybrid & Xếp hạng Nhà máy',
  risks: 'Sổ đăng ký Rủi ro & Tần suất Audit',
  documents: 'Kiểm soát Tài liệu, Tự đánh giá & Bằng chứng',
  audits: 'Chương trình Audit & Chấm điểm Checklist',
  'nc-capa': 'Quản lý Sự không phù hợp (NC) & CAPA',
  standards: 'Quản lý 7 Nhà máy & Tiêu chuẩn ISO Động',
  rbac: 'Phân quyền RBAC, RLS & Nhật ký Hệ thống',
  'ai-assistant': 'Trợ lý AI Gemini & Quy tắc Cảnh báo',
};

const ROLE_LABELS: Record<UserAccount['role'], string> = {
  SEV_ADMIN: 'SEV Admin / Auditor',
  FACTORY_MANAGER: 'Factory ISO Manager',
  DEPT_OWNER: 'Department Owner',
  STAFF: 'Nhân viên',
};

export const Layout: React.FC<LayoutProps> = ({
  state,
  activeModule,
  onSelectModule,
  activeUser,
  users,
  onSwitchUser,
  selectedFactoryScope,
  onChangeFactoryScope,
  onPrimaryAction,
  primaryActionLabel,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const effectiveScope =
    activeUser.assignedFactoryId !== 'ALL' ? activeUser.assignedFactoryId : selectedFactoryScope;

  const openNcCount = state.ncs.filter(
    (n) =>
      n.status !== 'Closed' && (effectiveScope === 'ALL' || n.factoryId === effectiveScope)
  ).length;
  const highRiskCount = state.risks.filter(
    (r) =>
      (r.riskLevel === 'Critical' || r.riskLevel === 'High') &&
      r.status !== 'Controlled' &&
      (effectiveScope === 'ALL' || r.factoryId === effectiveScope)
  ).length;
  const activeAuditCount = state.audits.filter(
    (a) =>
      a.status !== 'Completed' && (effectiveScope === 'ALL' || a.factoryId === effectiveScope)
  ).length;

  const getCountForModule = (key: ModuleKey): number | null => {
    if (key === 'nc-capa' && openNcCount > 0) return openNcCount;
    if (key === 'risks' && highRiskCount > 0) return highRiskCount;
    if (key === 'audits' && activeAuditCount > 0) return activeAuditCount;
    return null;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-200 border-r border-slate-800">
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-white whitespace-nowrap">
            ISO CONTROL PRO
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.groupLabel}>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-500">
              {group.groupLabel}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.key;
                const count = getCountForModule(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onSelectModule(item.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {count !== null && (
                      <span
                        className={`font-mono text-xs tabular-nums shrink-0 ${
                          isActive ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4 bg-slate-900/60">
        <div className="text-[11px] font-medium text-slate-400 mb-1.5">
          Tài khoản RBAC & RLS
        </div>
        <select
          value={activeUser.id}
          onChange={(e) => onSwitchUser(e.target.value)}
          aria-label="Chuyển đổi tài khoản người dùng"
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-100 focus:border-blue-500 focus:outline-none"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName} ({u.assignedFactoryId === 'ALL' ? '7 Nhà máy' : u.assignedFactoryId})
            </option>
          ))}
        </select>
        <div className="mt-2 text-xs text-slate-400 truncate">
          {ROLE_LABELS[activeUser.role]} ·{' '}
          {activeUser.assignedFactoryId === 'ALL'
            ? 'Toàn hệ thống'
            : `Phạm vi ${activeUser.assignedFactoryId}`}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-100/70 text-slate-900">
      {/* Desktop Dark Command Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-full h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb Left — User Context & 1 CTA Right */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline whitespace-nowrap">
                SEV ISO Control
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-slate-900 truncate">
                {MODULE_TITLES[activeModule]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
              <span className="font-medium text-slate-700">{activeUser.fullName}</span>
              <span aria-hidden="true">·</span>
              <span>
                {activeUser.assignedFactoryId === 'ALL'
                  ? 'SEV Toàn cầu'
                  : `RLS ${activeUser.assignedFactoryId}`}
              </span>
            </div>
            <button
              type="button"
              onClick={onPrimaryAction}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              {primaryActionLabel}
            </button>
          </div>
        </header>

        {/* Workspace Global Factory Scope Toolbar */}
        {activeUser.assignedFactoryId === 'ALL' && (
          <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-medium text-slate-500 mr-2 whitespace-nowrap">
                Phạm vi dữ liệu:
              </span>
              <button
                type="button"
                onClick={() => onChangeFactoryScope('ALL')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  selectedFactoryScope === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tất cả 7 Nhà máy
              </button>
              {state.factories.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChangeFactoryScope(f.id)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap ${
                    selectedFactoryScope === f.id
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.code}
                </button>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
