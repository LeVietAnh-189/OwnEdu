import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  ShieldCheck, 
  MessageSquare, 
  Laptop, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Sparkles,
  Bot
} from 'lucide-react';
import { LicenseAPI } from '../../services/api';
import { LicenseChatTicket, LicenseKeyItem } from '../../types';
import { getDeviceHumanName, getOrCreateDeviceId } from '../../utils/deviceFingerprint';

interface LicenseChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetKey?: LicenseKeyItem | null;
  onKeyResetSuccess?: () => void;
}

export const LicenseChatModal: React.FC<LicenseChatModalProps> = ({
  isOpen,
  onClose,
  targetKey,
  onKeyResetSuccess
}) => {
  const [ticket, setTicket] = useState<LicenseChatTicket | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const deviceName = getDeviceHumanName();
  const deviceId = getOrCreateDeviceId();

  const loadTicket = async () => {
    try {
      const tickets = await LicenseAPI.getChatTickets();
      if (tickets && tickets.length > 0) {
        setTicket(tickets[0]);
      }
    } catch (err) {
      console.error('Error fetching chat tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTicket();
      // Polling nhẹ mỗi 5 giây để nhận tin nhắn mới từ Admin
      const interval = setInterval(loadTicket, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const msg = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const updated = await LicenseAPI.sendChatMessage({
        message: msg,
        targetKeyId: targetKey?.id,
        deviceInfoSnapshot: `${deviceName} (ID: ${deviceId.slice(-6)})`
      });
      setTicket(updated);
      if (onKeyResetSuccess && updated.status === 'RESOLVED') {
        onKeyResetSuccess();
      }
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Không thể gửi tin nhắn.');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickTemplate = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-slate-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-base">Hỗ Trợ Bản Quyền & Đổi Thiết Bị</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Admin Trực Tuyến
                </span>
              </div>
              <p className="text-xs text-slate-500">Trao đổi trực tiếp để xin cấp lại hoặc hủy liên kết máy cũ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Device Snapshot Info */}
        <div className="px-6 py-2 bg-slate-50/80 border-b border-slate-100 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <Laptop className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <span className="truncate">Thiết bị hiện tại: <strong>{deviceName}</strong></span>
          </div>
          {targetKey && (
            <span className="font-mono bg-indigo-100/70 text-indigo-800 px-2 py-0.5 rounded font-semibold text-[11px]">
              Slot {targetKey.slotIndex} ({targetKey.key})
            </span>
          )}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              <Clock className="w-5 h-5 animate-spin mr-2" /> Đang tải hộp thoại hỗ trợ...
            </div>
          ) : !ticket || ticket.messages.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-700 text-sm">Chưa có tin nhắn nào</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Gửi tin nhắn bên dưới nếu bạn vừa đổi máy tính mới, cài lại Windows hoặc máy cũ gặp sự cố để Admin hỗ trợ reset key nhanh nhất.
              </p>

              {/* Quick Prompt Templates */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => handleQuickTemplate(`Chào Admin, em vừa đổi sang laptop mới, nhờ Admin reset giúp em ${targetKey ? `Slot ${targetKey.slotIndex} (${targetKey.key})` : 'License Key'} để em học bài tiếp ạ.`)}
                  className="text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 px-3 py-1.5 rounded-lg transition-colors text-left"
                >
                  💻 Em vừa đổi máy tính mới
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTemplate('Chào Admin, máy tính của em vừa cài lại Win nên bị mất mã thiết bị cũ, Admin hỗ trợ reset slot giúp em với ạ.')}
                  className="text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 px-3 py-1.5 rounded-lg transition-colors text-left"
                >
                  🔄 Máy tính vừa cài lại Windows
                </button>
              </div>
            </div>
          ) : (
            ticket.messages.map((m) => {
              const isUser = m.senderRole === 'USER';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {isUser ? 'Bạn' : m.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    {m.deviceInfoSnapshot && (
                      <div className={`mt-2 pt-1.5 border-t text-[10px] flex items-center ${
                        isUser ? 'border-indigo-500/50 text-indigo-200' : 'border-slate-100 text-slate-400'
                      }`}>
                        <Laptop className="w-3 h-3 mr-1" />
                        {m.deviceInfoSnapshot}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập lý do xin đổi máy hoặc câu hỏi cho Admin..."
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm flex items-center transition-all shadow-md shadow-indigo-100"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Gửi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
