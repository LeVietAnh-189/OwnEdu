import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Laptop, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Sparkles,
  ArrowRight,
  Lock,
  Copy,
  Check
} from 'lucide-react';
import { LicenseAPI } from '../../services/api';
import { LicenseKeyItem } from '../../types';
import { getDeviceHumanName, getOrCreateDeviceId, generateDeviceFingerprint } from '../../utils/deviceFingerprint';
import { LicenseChatModal } from './LicenseChatModal';

interface DeviceActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (license: LicenseKeyItem) => void;
  courseTitle?: string;
}

export const DeviceActivationModal: React.FC<DeviceActivationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  courseTitle
}) => {
  const [licenses, setLicenses] = useState<LicenseKeyItem[]>([]);
  const [manualKey, setManualKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedKeyForChat, setSelectedKeyForChat] = useState<LicenseKeyItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const deviceName = getDeviceHumanName();
  const deviceId = getOrCreateDeviceId();
  const fingerprint = generateDeviceFingerprint();

  const fetchLicenses = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await LicenseAPI.getMyLicenses();
      setLicenses(data || []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách License Key:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLicenses();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActivate = async (keyToUse: string) => {
    if (!keyToUse.trim()) {
      setErrorMessage('Vui lòng nhập mã License Key.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await LicenseAPI.activateLicense({
        key: keyToUse.trim(),
        deviceId,
        deviceFingerprint: fingerprint,
        deviceName
      });

      if (res.success && res.license) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onSuccess(res.license!);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Kích hoạt không thành công.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Đã xảy ra lỗi khi kích hoạt License Key.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openChatForSlot = (lic: LicenseKeyItem) => {
    setSelectedKeyForChat(lic);
    setIsChatOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Xác Thực Bản Quyền Thiết Bị</h3>
                <p className="text-amber-100 text-xs mt-0.5">Khóa học PRO được bảo vệ tối đa 2 thiết bị cá nhân / tài khoản</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Target Course Note */}
            {courseTitle && (
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 flex items-start space-x-2.5">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-900">
                  Bạn đang truy cập tài nguyên PRO của <strong>{courseTitle}</strong>. Vui lòng liên kết máy tính này với 1 trong 2 License Key của bạn để bắt đầu học.
                </div>
              </div>
            )}

            {/* Current Device Identification */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Thiết bị hiện tại của bạn</div>
                  <div className="text-sm font-bold text-slate-800">{deviceName}</div>
                  <div className="text-[11px] font-mono text-slate-400">ID: {deviceId.slice(0, 16)}...</div>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-lg">
                Máy tính này
              </span>
            </div>

            {/* Error / Success Notifications */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-start space-x-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="font-semibold">{successMessage}</div>
              </div>
            )}

            {/* Slot Keys Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2 Slot Bản Quyền Của Bạn
                </span>
                <span className="text-xs text-slate-400">Tối đa 2 máy cùng lúc</span>
              </div>

              {isLoading ? (
                <div className="text-center py-6 text-xs text-slate-400">Đang kiểm tra thông tin bản quyền...</div>
              ) : licenses.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                  Bạn chưa có License Key PRO nào. Vui lòng nâng cấp tài khoản để nhận 2 License Key.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {licenses.map((lic) => {
                    const isBoundThisDevice = lic.boundDevice?.deviceId === deviceId;
                    const isBoundOtherDevice = lic.boundDevice && !isBoundThisDevice;
                    const isAvailable = !lic.boundDevice;

                    return (
                      <div
                        key={lic.id}
                        className={`rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                          isBoundThisDevice
                            ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/30'
                            : isBoundOtherDevice
                            ? 'bg-slate-50/80 border-slate-200'
                            : 'bg-white border-amber-200 hover:border-amber-400 shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700 flex items-center">
                              <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-500" />
                              Slot {lic.slotIndex}
                            </span>
                            {isBoundThisDevice ? (
                              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center">
                                <Check className="w-3 h-3 mr-1" /> Đã kết nối
                              </span>
                            ) : isBoundOtherDevice ? (
                              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                                Đã gắn máy khác
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                Còn trống
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between bg-slate-100/70 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800 mb-2">
                            <span>{lic.key}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(lic.key)}
                              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                              title="Sao chép mã"
                            >
                              {copiedKey === lic.key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-500 min-h-[36px]">
                            {isBoundThisDevice ? (
                              <span className="text-emerald-700">Đang hoạt động trên máy tính này.</span>
                            ) : isBoundOtherDevice ? (
                              <span className="text-slate-600">Đang gắn: <strong>{lic.boundDevice?.deviceName}</strong></span>
                            ) : (
                              <span>Chưa gắn vào thiết bị nào. Sẵn sàng kích hoạt.</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          {isBoundThisDevice ? (
                            <button
                              type="button"
                              onClick={() => handleActivate(lic.key)}
                              disabled={isSubmitting}
                              className="w-full py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                            >
                              Đồng bộ lại thiết bị
                            </button>
                          ) : isAvailable ? (
                            <button
                              type="button"
                              onClick={() => handleActivate(lic.key)}
                              disabled={isSubmitting}
                              className="w-full py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-1"
                            >
                              <span>Kích hoạt máy này</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openChatForSlot(lic)}
                              className="w-full py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center justify-center space-x-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Xin đổi máy này</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Manual Key Input Alternative */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Hoặc nhập mã License Key khác của bạn:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  placeholder="OE-PRO-XXXX-XXXX"
                  className="flex-1 px-3.5 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => handleActivate(manualKey)}
                  disabled={!manualKey.trim() || isSubmitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Xác Thực
                </button>
              </div>
            </div>

            {/* Bottom Support Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center space-x-1.5 group"
              >
                <MessageSquare className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Máy tính bị hỏng hoặc bạn vừa đổi máy mới? Bấm vào đây để Chat với Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support Chat Modal */}
      <LicenseChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          fetchLicenses(); // Refresh lại sau khi đóng chat
        }}
        targetKey={selectedKeyForChat}
        onKeyResetSuccess={() => {
          fetchLicenses();
        }}
      />
    </>
  );
};
