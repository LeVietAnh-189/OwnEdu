import React, { useEffect, useState } from 'react';
import { SettingsAPI } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { Sparkles, Key, Check, X, ExternalLink, ShieldAlert, Cpu } from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const { currentUser } = useUserStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [apiKey, setApiKey] = useState<string>('');
  const [activeModel, setActiveModel] = useState<string>('gemini-1.5-flash');
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !isAdmin) return;
    const fetchSettings = async () => {
      try {
        const data = await SettingsAPI.get();
        setActiveModel(data.activeModel || 'gemini-1.5-flash');
        setHasKey(data.hasGeminiKey);
        setMaskedKey(data.geminiApiKeyMasked || '');
      } catch (err) {
        console.error('Error loading AI settings:', err);
      }
    };
    fetchSettings();
  }, [isOpen, isAdmin]);

  if (!isOpen || !isAdmin) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);
      await SettingsAPI.save({
        ...(apiKey ? { gemini_api_key: apiKey.trim() } : {}),
        active_model: activeModel,
      });

      setMessage('Đã lưu cấu hình AI thành công!');
      setHasKey(Boolean(apiKey || maskedKey));
      setApiKey('');
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      setMessage('Lỗi lưu cấu hình: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white max-w-lg w-full rounded-2xl p-6 border border-slate-200 shadow-2xl relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-orange-600/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Cấu Hình Động Cơ AI (LLM)</h3>
            <p className="text-xs text-slate-500">Kết nối Google Gemini hoặc OpenAI để sinh đề thông minh</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between mb-4">
          <span className="text-slate-600 font-medium">Trạng thái kết nối:</span>
          {hasKey ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Đã liên kết Gemini API Key ({maskedKey})</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Chưa cấu hình API Key (Dùng bộ nội bộ)</span>
            </span>
          )}
        </div>

        {message && (
          <div className="p-3 mb-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold">
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-orange-600" />
                <span>Google Gemini API Key:</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 flex items-center gap-1 underline font-semibold"
              >
                <span>Lấy key miễn phí</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder={hasKey ? '•••••••••••••••••••••••••••• (Đã lưu)' : 'Dán Gemini API Key (AIzaSy...)'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 font-mono focus:border-orange-600 focus:ring-1 focus:ring-orange-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Khóa API được lưu cục bộ trên backend của bạn và dùng trực tiếp để gọi Google Gemini 1.5/2.0.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Lựa chọn mô hình AI (Model):
            </label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:border-orange-600 focus:ring-1 focus:ring-orange-600 focus:outline-none"
            >
              <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Khuyến nghị - Tốc độ cao & Miễn phí)</option>
              <option value="gemini-2.0-flash">Google Gemini 2.0 Flash (Thế hệ mới nhất)</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Lập luận chuyên sâu)</option>
              <option value="offline-smart">Bộ sinh ngữ cảnh nội bộ (Không cần API Key)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu cấu hình AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
