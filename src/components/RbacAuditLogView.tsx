import React from 'react';
import { History, Lock, RotateCcw, Shield } from 'lucide-react';
import type { CentralDatabaseState, UserAccount } from '../types/iso';

interface RbacAuditLogViewProps {
  state: CentralDatabaseState;
  activeUser: UserAccount;
  onSwitchUser: (userId: string) => void;
  onResetDemo: () => Promise<void>;
}

const RBAC_MATRIX = [
  {
    capability: 'Xem Dashboard & Xếp hạng 7 Nhà máy',
    sev: 'Toàn bộ 7 nhà máy',
    facMgr: 'Chỉ nhà máy được gán (RLS)',
    deptOwner: 'Chỉ nhà máy được gán (RLS)',
    staff: 'Chỉ xem tóm tắt nhà máy',
  },
  {
    capability: 'Cấu hình Tiêu chuẩn ISO Dynamic & Thêm Nhà máy',
    sev: 'Toàn quyền',
    facMgr: 'Chỉ xem',
    deptOwner: 'Chỉ xem',
    staff: 'Không',
  },
  {
    capability: 'Tạo Lịch Audit & Chấm điểm Checklist',
    sev: 'Toàn quyền 7 nhà máy',
    facMgr: 'Đề xuất / Tự đánh giá',
    deptOwner: 'Phối hợp hiện trường',
    staff: 'Chỉ xem',
  },
  {
    capability: 'Mở NC & Phê duyệt Đóng Hiệu lực CAPA',
    sev: 'Xác minh & Đóng hồ sơ',
    facMgr: 'Nộp CAPA & Bằng chứng',
    deptOwner: 'Thực hiện hành động',
    staff: 'Nộp bằng chứng đính kèm',
  },
  {
    capability: 'Kiểm soát Tài liệu (SOP / WI / Control Plan)',
    sev: 'Phê duyệt cấp Tập đoàn',
    facMgr: 'Ban hành & Phê duyệt cấp Nhà máy',
    deptOwner: 'Soạn thảo & Đề xuất',
    staff: 'Đọc bản hành chính thức',
  },
];

export const RbacAuditLogView: React.FC<RbacAuditLogViewProps> = ({
  state,
  activeUser,
  onSwitchUser,
  onResetDemo,
}) => {
  return (
    <div className="space-y-8">
      {/* Active Session & RLS Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-blue-700 mt-0.5 shrink-0" />
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Phiên làm việc hiện tại: {activeUser.fullName} ({activeUser.role})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Row-Level Security (RLS) đang áp dụng phạm vi:{' '}
              <strong className="text-slate-800">
                {activeUser.assignedFactoryId === 'ALL'
                  ? 'Toàn bộ 7 Nhà máy (SEV Admin)'
                  : `Giới hạn dữ liệu riêng nhà máy ${activeUser.assignedFactoryId}`}
              </strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetDemo}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap w-fit"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Khôi phục Dữ liệu Mẫu</span>
        </button>
      </div>

      {/* User Directory & Instant Role Switch */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-700" />
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Tài khoản Phân quyền (Nhấn chọn để kiểm thử RLS trực tiếp)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Họ tên & Email</th>
                <th className="py-3 px-4">Vai trò (RBAC)</th>
                <th className="py-3 px-4">Phạm vi RLS</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4 text-right">Chuyển phiên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {state.users.map((u) => {
                const isCurrent = u.id === activeUser.id;
                return (
                  <tr key={u.id} className={isCurrent ? 'bg-blue-50/50' : 'hover:bg-slate-50'}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.fullName}</div>
                      <div className="text-xs font-mono text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">
                      {u.role}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">
                      {u.assignedFactoryId === 'ALL' ? '7 Nhà máy (ALL)' : u.assignedFactoryId}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{u.department}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => onSwitchUser(u.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded border ${
                          isCurrent
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isCurrent ? 'Đang hoạt động' : 'Mô phỏng vai trò'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-display text-sm font-semibold text-slate-900">
          Ma trận Phân quyền (RBAC & Row-Level Security)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <th className="py-3 px-4">Chức năng / Quyền hạn</th>
                <th className="py-3 px-4">SEV (Admin/Auditor)</th>
                <th className="py-3 px-4">Factory ISO Manager</th>
                <th className="py-3 px-4">Department Owner</th>
                <th className="py-3 px-4">Nhân viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {RBAC_MATRIX.map((row) => (
                <tr key={row.capability}>
                  <td className="py-3 px-4 font-medium text-slate-900">{row.capability}</td>
                  <td className="py-3 px-4 text-emerald-700 font-medium">{row.sev}</td>
                  <td className="py-3 px-4">{row.facMgr}</td>
                  <td className="py-3 px-4">{row.deptOwner}</td>
                  <td className="py-3 px-4 text-slate-500">{row.staff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Trail */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <History className="h-4 w-4 text-blue-700" />
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Nhật ký Hệ thống Tập trung (Audit Log)
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {state.auditLogs.slice(0, 15).map((log) => (
            <div
              key={log.id}
              className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-mono text-slate-400 tabular-nums">{log.timestamp}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="font-semibold text-slate-900">{log.actorName}</span>
                <span className="mx-1.5 text-slate-400">({log.factoryId})</span>
                <span className="text-slate-700">{log.detail}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 shrink-0">
                {log.module} · {log.action}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
