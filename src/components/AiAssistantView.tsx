import React, { useState } from 'react';
import { Bell, Bot, Send } from 'lucide-react';
import { isoApi } from '../lib/api';
import type { CentralDatabaseState } from '../types/iso';

interface AiAssistantViewProps {
  state: CentralDatabaseState;
  scopedFactoryId: string | 'ALL';
  onToggleAlert: (id: string, enabled: boolean) => Promise<void>;
}

const PRESET_PROMPTS = [
  {
    label: 'Phân tích rủi ro & Xếp hạng 7 Nhà máy',
    prompt:
      'Hãy phân tích toàn diện tình hình tuân thủ ISO và các rủi ro trọng yếu trên 7 nhà máy hiện tại. Chỉ rõ nhà máy nào cần ưu tiên Audit khẩn cấp trong tháng tới và giải thích lý do.',
  },
  {
    label: 'Đánh giá tiến độ đóng CAPA & Major NC',
    prompt:
      'Tổng hợp các Major NC và Minor NC chưa đóng, đánh giá tác động lên điểm Hybrid và đề xuất lộ trình đôn đốc từng nhà máy.',
  },
  {
    label: 'Soạn Báo cáo Điều hành Ban Giám đốc SEV',
    prompt:
      'Hãy viết một bản tóm tắt điều hành (Executive Summary) gửi Ban Giám đốc SEV về kết quả Scorecard Q4-2026 của 7 nhà máy và 3 khuyến nghị chiến lược.',
  },
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  state,
  scopedFactoryId,
  onToggleAlert,
}) => {
  const [targetFactory, setTargetFactory] = useState<string>(scopedFactoryId);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);

  const runAnalysis = async (customPrompt?: string) => {
    const q = (customPrompt ?? prompt).trim();
    if (!q) return;
    setLoading(true);
    setErrorText(null);
    try {
      const res = await isoApi.analyzeWithAi({
        mode: customPrompt ? 'executive' : 'qa',
        prompt: q,
        factoryId: scopedFactoryId === 'ALL' ? targetFactory : scopedFactoryId,
      });
      setResponseText(res.text);
      setUsedModel(res.model);
    } catch (err: unknown) {
      setErrorText(err instanceof Error ? err.message : 'Lỗi gọi Gemini AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Gemini AI ISO Control Tower Assistant */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Bot className="h-5 w-5 text-blue-700" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Trợ lý AI Phân tích Rủi ro & Tuân thủ ISO (Gemini)
              </h2>
              <p className="text-xs text-slate-500">
                Kết nối trực tiếp dữ liệu thời gian thực của 7 nhà máy qua Server-Side Gemini API
              </p>
            </div>
          </div>

          {scopedFactoryId === 'ALL' && (
            <select
              value={targetFactory}
              onChange={(e) => setTargetFactory(e.target.value)}
              aria-label="Phạm vi nhà máy phân tích"
              className="rounded border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="ALL">Phân tích cả 7 Nhà máy</option>
              {state.factories.map((f) => (
                <option key={f.id} value={f.id}>
                  Riêng {f.code}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Preset Analysis Buttons */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-500">Tác vụ phân tích nhanh:</div>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={loading}
                onClick={() => {
                  setPrompt(preset.prompt);
                  runAnalysis(preset.prompt);
                }}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAnalysis();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Đặt câu hỏi cho Trợ lý ISO (VD: Tại sao HOJEONG VINA bị hạ điểm Hybrid?)..."
            className="flex-1 rounded-md border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md disabled:opacity-50 whitespace-nowrap"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{loading ? 'Đang phân tích...' : 'Gửi phân tích'}</span>
          </button>
        </form>

        {/* Output Panel */}
        {errorText && (
          <div className="p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
            {errorText}
          </div>
        )}

        {loading && (
          <div className="p-6 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-500">
            Đang tổng hợp dữ liệu Scorecard, Risk Register và NC/CAPA để phân tích...
          </div>
        )}

        {!loading && responseText && (
          <div className="p-5 rounded-md bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-800">Kết quả Phân tích AI</span>
              {usedModel && <span className="font-mono">{usedModel}</span>}
            </div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {responseText}
            </div>
          </div>
        )}
      </div>

      {/* Right: Automated Alert Rules */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-700" />
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Quy tắc Cảnh báo Tự động
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {state.alertRules.map((rule) => (
            <div key={rule.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">{rule.name}</div>
                <button
                  type="button"
                  onClick={() => onToggleAlert(rule.id, !rule.enabled)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded border shrink-0 ${
                    rule.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {rule.enabled ? 'Đang bật' : 'Đã tắt'}
                </button>
              </div>
              <div className="text-[11px] font-mono text-slate-500 break-all">
                {rule.condition}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span
                  className={
                    rule.severity === 'Critical'
                      ? 'text-red-700 font-semibold'
                      : rule.severity === 'Warning'
                        ? 'text-amber-700 font-semibold'
                        : 'text-blue-700'
                  }
                >
                  Mức {rule.severity}
                </span>
                <span className="font-mono tabular-nums">
                  Đã kích hoạt: {rule.triggeredCount} lần
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
