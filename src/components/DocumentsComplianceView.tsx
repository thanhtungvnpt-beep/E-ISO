import React, { useState } from 'react';
import { Check, FilePlus2, FileText, Paperclip, ShieldCheck } from 'lucide-react';
import type { CentralDatabaseState } from '../types/iso';

interface DocumentsComplianceViewProps {
  state: CentralDatabaseState;
  scopedFactoryId: string | 'ALL';
  onAddDocument: (payload: Record<string, unknown>) => Promise<void>;
  onUpdateDocument: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onSaveAssessment: (payload: Record<string, unknown>) => Promise<void>;
  onAddEvidence: (payload: Record<string, unknown>) => Promise<void>;
  onToggleVerifyEvidence: (id: string, verified: boolean) => Promise<void>;
}

export const DocumentsComplianceView: React.FC<DocumentsComplianceViewProps> = ({
  state,
  scopedFactoryId,
  onAddDocument,
  onUpdateDocument,
  onSaveAssessment,
  onAddEvidence,
  onToggleVerifyEvidence,
}) => {
  const [subTab, setSubTab] = useState<'docs' | 'self-assessment' | 'evidence'>('docs');
  const [search, setSearch] = useState('');
  const [showDocForm, setShowDocForm] = useState(false);

  const [docForm, setDocForm] = useState({
    docCode: '',
    title: '',
    docType: 'SOP',
    standardId: 'ISO-9001',
    clauseCode: '7.5',
    factoryScope: scopedFactoryId === 'ALL' ? 'ALL' : scopedFactoryId,
    version: 'Rev 1.0',
    owner: 'Ban ISO',
    status: 'In Review',
  });

  const [saForm, setSaForm] = useState({
    factoryId: scopedFactoryId === 'ALL' ? 'KHV' : scopedFactoryId,
    standardId: 'ISO-9001',
    clauseCode: '8.5.1',
    selfScore: 88,
    notes: '',
    assessedBy: 'Factory ISO Manager',
  });

  const [evForm, setEvForm] = useState({
    title: '',
    factoryId: scopedFactoryId === 'ALL' ? 'KHV' : scopedFactoryId,
    standardId: 'ISO-9001',
    clauseCode: '8.5.1',
    linkedType: 'SelfAssessment',
    fileName: '',
    fileSizeKb: 640,
  });

  const docs = state.documents.filter((d) => {
    if (scopedFactoryId !== 'ALL' && d.factoryScope !== 'ALL' && d.factoryScope !== scopedFactoryId) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.docCode.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.clauseCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const assessments = state.assessments.filter(
    (a) => scopedFactoryId === 'ALL' || a.factoryId === scopedFactoryId
  );

  const evidences = state.evidences.filter(
    (e) => scopedFactoryId === 'ALL' || e.factoryId === scopedFactoryId
  );

  return (
    <div className="space-y-6">
      {/* Sub-module Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md w-fit">
          <button
            type="button"
            onClick={() => setSubTab('docs')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              subTab === 'docs'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kiểm soát Tài liệu ({docs.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('self-assessment')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              subTab === 'self-assessment'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tự đánh giá Nhà máy ({assessments.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('evidence')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              subTab === 'evidence'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kho Bằng chứng ({evidences.length})
          </button>
        </div>

        {subTab === 'docs' && (
          <div className="flex items-center gap-3">
            <input
              type="search"
              placeholder="Tìm mã SOP, tên tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 w-56"
            />
            <button
              type="button"
              onClick={() => setShowDocForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md whitespace-nowrap"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              <span>{showDocForm ? 'Đóng' : 'Ban hành Tài liệu'}</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: DOCUMENT CONTROL */}
      {subTab === 'docs' && (
        <div className="space-y-4">
          {showDocForm && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onAddDocument(docForm);
                setDocForm((p) => ({ ...p, docCode: '', title: '' }));
                setShowDocForm(false);
              }}
              className="bg-white border border-slate-200 rounded-lg p-6 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mã tài liệu</label>
                <input
                  type="text"
                  required
                  placeholder="SOP-QA-019"
                  value={docForm.docCode}
                  onChange={(e) => setDocForm({ ...docForm, docCode: e.target.value })}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Tên tài liệu</label>
                <input
                  type="text"
                  required
                  placeholder="Quy trình kiểm soát..."
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Loại / Phiên bản</label>
                <div className="flex gap-2">
                  <select
                    value={docForm.docType}
                    onChange={(e) => setDocForm({ ...docForm, docType: e.target.value })}
                    className="rounded border border-slate-200 px-2 py-2 text-sm w-1/2"
                  >
                    <option value="SOP">SOP</option>
                    <option value="WI">WI</option>
                    <option value="Control Plan">Control Plan</option>
                    <option value="Form">Form</option>
                    <option value="Manual">Manual</option>
                  </select>
                  <input
                    type="text"
                    value={docForm.version}
                    onChange={(e) => setDocForm({ ...docForm, version: e.target.value })}
                    className="rounded border border-slate-200 px-2 py-2 text-sm font-mono w-1/2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tiêu chuẩn & Điều khoản</label>
                <div className="flex gap-2">
                  <select
                    value={docForm.standardId}
                    onChange={(e) => setDocForm({ ...docForm, standardId: e.target.value })}
                    className="rounded border border-slate-200 px-2 py-2 text-sm w-2/3"
                  >
                    {state.standards.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={docForm.clauseCode}
                    onChange={(e) => setDocForm({ ...docForm, clauseCode: e.target.value })}
                    className="rounded border border-slate-200 px-2 py-2 text-sm font-mono w-1/3"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phạm vi áp dụng</label>
                <select
                  value={docForm.factoryScope}
                  disabled={scopedFactoryId !== 'ALL'}
                  onChange={(e) => setDocForm({ ...docForm, factoryScope: e.target.value })}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="ALL">Toàn bộ 7 Nhà máy</option>
                  {state.factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex items-end justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
                >
                  Lưu & Đưa vào Kiểm soát
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Mã Tài liệu</th>
                    <th className="py-3 px-4">Tên Tài liệu & Điều khoản</th>
                    <th className="py-3 px-4">Phạm vi</th>
                    <th className="py-3 px-4">Phiên bản</th>
                    <th className="py-3 px-4">Cập nhật</th>
                    <th className="py-3 px-4">Trạng thái Phê duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {docs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>{doc.docCode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{doc.title}</div>
                        <div className="text-xs text-slate-500">
                          {doc.docType} · {doc.standardId} · Điều khoản {doc.clauseCode} · {doc.owner}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700">
                        {doc.factoryScope === 'ALL' ? '7 Nhà máy' : doc.factoryScope}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">{doc.version}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums">
                        {doc.updatedAt}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={doc.status}
                          onChange={(e) => onUpdateDocument(doc.id, { status: e.target.value })}
                          aria-label={`Trạng thái tài liệu ${doc.docCode}`}
                          className={`rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold ${
                            doc.status === 'Approved'
                              ? 'text-emerald-700'
                              : doc.status === 'In Review'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="In Review">In Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Obsolete">Obsolete</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SELF-ASSESSMENT */}
      {subTab === 'self-assessment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onSaveAssessment(saForm);
              setSaForm((p) => ({ ...p, notes: '' }));
            }}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6 space-y-4 h-fit"
          >
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Cập nhật Tự đánh giá (Kỳ Q4-2026)
            </h3>
            <p className="text-xs text-slate-500">
              Điểm tự đánh giá chiếm 25% trọng số trong bảng điểm Hybrid của nhà máy.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nhà máy</label>
              <select
                value={saForm.factoryId}
                disabled={scopedFactoryId !== 'ALL'}
                onChange={(e) => setSaForm({ ...saForm, factoryId: e.target.value })}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              >
                {state.factories.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} — {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tiêu chuẩn</label>
                <select
                  value={saForm.standardId}
                  onChange={(e) => setSaForm({ ...saForm, standardId: e.target.value })}
                  className="w-full rounded border border-slate-200 px-2.5 py-2 text-sm"
                >
                  {state.standards.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Điều khoản</label>
                <input
                  type="text"
                  value={saForm.clauseCode}
                  onChange={(e) => setSaForm({ ...saForm, clauseCode: e.target.value })}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Điểm tự chấm</span>
                <span className="font-mono font-bold text-blue-700 tabular-nums">
                  {saForm.selfScore} / 100
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={saForm.selfScore}
                onChange={(e) => setSaForm({ ...saForm, selfScore: Number(e.target.value) })}
                className="w-full accent-blue-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Ghi chú tuân thủ / Khoảng trống (Gap)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Mô tả thực trạng hồ sơ và hiện trường..."
                value={saForm.notes}
                onChange={(e) => setSaForm({ ...saForm, notes: e.target.value })}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
            >
              Lưu & Tính lại Điểm Hybrid
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 font-display text-sm font-semibold text-slate-900">
              Kết quả Tự đánh giá theo Điều khoản ISO
            </div>
            <div className="divide-y divide-slate-100">
              {assessments.map((sa) => (
                <div key={sa.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-900">{sa.factoryId}</span> ·{' '}
                      <span className="font-mono">{sa.standardId}</span> · Điều khoản{' '}
                      <span className="font-mono">{sa.clauseCode}</span> · {sa.period}
                    </div>
                    <p className="mt-1 text-sm text-slate-800">{sa.notes}</p>
                    <div className="mt-1 text-xs text-slate-400">
                      Đánh giá bởi {sa.assessedBy} · {sa.updatedAt}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                      {sa.selfScore}
                      <span className="text-xs text-slate-400 font-normal">/100</span>
                    </div>
                    <div
                      className={`text-xs font-semibold ${
                        sa.status === 'Compliant'
                          ? 'text-emerald-700'
                          : sa.status === 'Partial'
                            ? 'text-amber-700'
                            : 'text-red-700'
                      }`}
                    >
                      {sa.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVIDENCE REPOSITORY */}
      {subTab === 'evidence' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onAddEvidence(evForm);
              setEvForm((p) => ({ ...p, title: '', fileName: '' }));
            }}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6 space-y-4 h-fit"
          >
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Nộp Bằng chứng Tuân thủ / CAPA
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nhà máy</label>
              <select
                value={evForm.factoryId}
                disabled={scopedFactoryId !== 'ALL'}
                onChange={(e) => setEvForm({ ...evForm, factoryId: e.target.value })}
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Tên bằng chứng</label>
              <input
                type="text"
                required
                placeholder="VD: Ảnh lắp đặt khay chống tràn"
                value={evForm.title}
                onChange={(e) => setEvForm({ ...evForm, title: e.target.value })}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tên tệp đính kèm</label>
              <input
                type="text"
                required
                placeholder="VD: CAPA_HV01_Evidence.pdf"
                value={evForm.fileName}
                onChange={(e) => setEvForm({ ...evForm, fileName: e.target.value })}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Liên kết</label>
                <select
                  value={evForm.linkedType}
                  onChange={(e) => setEvForm({ ...evForm, linkedType: e.target.value })}
                  className="w-full rounded border border-slate-200 px-2 py-2 text-sm"
                >
                  <option value="SelfAssessment">Self-Assessment</option>
                  <option value="AuditChecklist">Audit Checklist</option>
                  <option value="CAPA">CAPA</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Điều khoản</label>
                <input
                  type="text"
                  value={evForm.clauseCode}
                  onChange={(e) => setEvForm({ ...evForm, clauseCode: e.target.value })}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
            >
              Tải lên Kho Bằng chứng
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 font-display text-sm font-semibold text-slate-900">
              Danh sách Bằng chứng Tập trung (S3 / Private Storage)
            </div>
            <div className="divide-y divide-slate-100">
              {evidences.map((ev) => (
                <div key={ev.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-900">{ev.factoryId}</span>
                      <span>·</span>
                      <span>{ev.linkedType}</span>
                      <span>·</span>
                      <span className="font-mono">Điều khoản {ev.clauseCode}</span>
                    </div>
                    <div className="mt-1 font-medium text-sm text-slate-900">{ev.title}</div>
                    <div className="mt-0.5 text-xs font-mono text-slate-500">
                      {ev.fileName} ({ev.fileSizeKb} KB) · {ev.uploadedBy} · {ev.uploadedAt}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleVerifyEvidence(ev.id, !ev.verified)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border whitespace-nowrap shrink-0 ${
                      ev.verified
                        ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
                        : 'text-slate-700 border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {ev.verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    <span>{ev.verified ? 'Đã xác nhận' : 'Xác nhận'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
