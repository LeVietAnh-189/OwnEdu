import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  X,
  CreditCard,
  Building2,
  User as UserIcon,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { PaymentAPI } from '../../services/api';
import { PaymentOrder, PaymentPlan, PaymentPlanId } from '../../types';
import { useUserStore } from '../../store/userStore';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, fetchCurrentUser } = useUserStore();

  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<PaymentPlanId>('PRO_QUARTERLY');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isMockPaying, setIsMockPaying] = useState(false);
  
  // Current active order
  const [currentOrder, setCurrentOrder] = useState<PaymentOrder | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60);
  const [isSuccessState, setIsSuccessState] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch plans on open
  useEffect(() => {
    if (isOpen) {
      setIsSuccessState(false);
      setErrorMessage(null);
      setCurrentOrder(null);
      setTimeLeftSeconds(15 * 60);

      const loadPlans = async () => {
        try {
          const data = await PaymentAPI.getPlans();
          if (data && data.plans && data.plans.length > 0) {
            setPlans(data.plans);
          }
        } catch (err) {
          console.error('Failed to load payment plans:', err);
        }
      };
      loadPlans();
    }
  }, [isOpen]);

  // Countdown timer for pending order
  useEffect(() => {
    if (!currentOrder || currentOrder.status !== 'PENDING' || isSuccessState) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentOrder, isSuccessState]);

  // Polling check order status every 2.5 seconds
  useEffect(() => {
    if (!currentOrder || currentOrder.status !== 'PENDING' || isSuccessState) return;

    const pollInterval = setInterval(async () => {
      try {
        const orderData = await PaymentAPI.getOrder(currentOrder.orderCode);
        if (orderData && orderData.status === 'PAID') {
          setCurrentOrder(orderData);
          setIsSuccessState(true);
          await fetchCurrentUser();
          if (onSuccess) onSuccess();
        }
      } catch (e) {
        // Ignore silent polling network errors
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [currentOrder, isSuccessState]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateOrder = async () => {
    try {
      setIsCreatingOrder(true);
      setErrorMessage(null);
      const res = await PaymentAPI.createOrder(selectedPlanId);
      if (res && res.order) {
        setCurrentOrder(res.order);
        setTimeLeftSeconds(15 * 60);
      }
    } catch (err: any) {
      console.error('Error creating SePay payment order:', err);
      setErrorMessage(err?.response?.data?.error?.message || err?.message || 'Không thể tạo mã thanh toán.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleMockPay = async () => {
    if (!currentOrder) return;
    try {
      setIsMockPaying(true);
      const res = await PaymentAPI.mockPay(currentOrder.orderCode);
      if (res && res.order) {
        setCurrentOrder(res.order);
        setIsSuccessState(true);
        await fetchCurrentUser();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('Error executing mock payment:', err);
      setErrorMessage(err?.message || 'Lỗi khi mô phỏng thanh toán.');
    } finally {
      setIsMockPaying(false);
    }
  };

  const handleManualCheckStatus = async () => {
    if (!currentOrder) return;
    try {
      setIsCheckingStatus(true);
      const orderData = await PaymentAPI.getOrder(currentOrder.orderCode);
      if (orderData && orderData.status === 'PAID') {
        setCurrentOrder(orderData);
        setIsSuccessState(true);
        await fetchCurrentUser();
        if (onSuccess) onSuccess();
      } else {
        alert('Hệ thống chưa nhận được biến động số dư cho mã này. Vui lòng thử lại sau vài giây!');
      }
    } catch (e) {
      alert('Không thể kết nối đến máy chủ thanh toán.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-6 text-white overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 -top-12 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-black/15 hover:bg-black/30 text-white/90 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Crown className="w-6 h-6 text-amber-200 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Nâng Cấp Gói Pro VIP</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/25 text-white border border-white/30">
                  SePay VietQR
                </span>
              </div>
              <p className="text-orange-100 text-xs sm:text-sm mt-0.5 font-medium">
                Mở khóa không giới hạn tính năng AI Khảo thí & Kho bài giảng Video Cloudflare R2
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STATE 1: SUCCESSFUL UPGRADE SCREEN */}
          {isSuccessState ? (
            <div className="text-center py-8 px-4 space-y-4">
              <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 mx-auto flex items-center justify-center animate-bounce shadow-lg shadow-orange-500/20">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900">Nâng Cấp Thành Công! 🎉</h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Chúc mừng bạn! Tài khoản <strong className="text-slate-900">{currentUser?.fullName}</strong> đã được nâng cấp lên hạng <strong>Học viên Pro VIP</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 max-w-md mx-auto text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-900">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Đặc quyền đã được kích hoạt ngay lập tức:</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1 pl-6 list-disc">
                  <li>Tạo đề thi AI không giới hạn từ tài liệu giáo trình</li>
                  <li>Chấm tự luận Rubric AI chi tiết 4 tiêu chí</li>
                  <li>Xem toàn bộ video bài giảng Cloudflare R2 Streaming độ nét cao</li>
                  <li>Huy hiệu Pro VIP vương miện hoàng gia</li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white shadow-lg shadow-orange-600/30 hover:opacity-95 transition cursor-pointer active:scale-95"
                >
                  Bắt Đầu Trải Nghiệm Ngay
                </button>
              </div>
            </div>
          ) : currentOrder ? (
            /* STATE 2: PENDING PAYMENT SEPAY VIETQR SCREEN */
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-orange-50/90 border border-orange-200/90">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
                  <span className="text-xs font-bold text-orange-950">
                    Đang chờ hệ thống SePay ghi nhận biến động số dư...
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-orange-700 border border-orange-200 text-xs font-black shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  <span>{formatTimer(timeLeftSeconds)}</span>
                </div>
              </div>

              {/* QR Code and Bank Details Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left: SePay VietQR Image */}
                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                  <div className="relative p-2 bg-white rounded-2xl shadow-md border border-slate-200 max-w-[240px]">
                    {currentOrder.qrCode ? (
                      <img 
                        src={currentOrder.qrCode} 
                        alt="SePay VietQR" 
                        className="w-full h-auto rounded-xl object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                        Đang tạo mã SePay VietQR...
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-3">
                    Mở app ngân hàng bất kỳ để quét mã VietQR tự động điền tiền & mã giao dịch
                  </p>
                </div>

                {/* Right: Bank Transfer Details */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> Ngân hàng nhận
                      </span>
                      <span className="font-bold text-slate-800">
                        {currentOrder.bankName || 'MBBank'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Số tài khoản
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 font-mono text-sm">
                          {currentOrder.accountNumber || '0987654321'}
                        </span>
                        <button
                          onClick={() => handleCopy(currentOrder.accountNumber || '0987654321', 'acc')}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                          title="Sao chép số tài khoản"
                        >
                          {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-orange-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 font-medium">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Chủ tài khoản
                      </span>
                      <span className="font-bold text-slate-800 uppercase">
                        {currentOrder.accountName || 'OWNEDU ACADEMY'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Zap className="w-3.5 h-3.5 text-orange-500" /> Số tiền chuyển
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-orange-600 text-base">
                          {formatCurrency(currentOrder.amount)}
                        </span>
                        <button
                          onClick={() => handleCopy(String(currentOrder.amount), 'amount')}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                          title="Sao chép số tiền"
                        >
                          {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-orange-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 bg-amber-50/60 p-2 rounded-xl border border-amber-200/60">
                      <span className="flex items-center gap-1.5 font-bold text-amber-900">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Nội dung CK
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-300 font-mono text-xs">
                          {currentOrder.paymentCode}
                        </span>
                        <button
                          onClick={() => handleCopy(currentOrder.paymentCode, 'code')}
                          className="p-1 rounded-md hover:bg-white text-slate-500 hover:text-slate-800 transition"
                          title="Sao chép nội dung chuyển khoản"
                        >
                          {copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-orange-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions and Sandbox Simulator Button */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleManualCheckStatus}
                      disabled={isCheckingStatus}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                      <span>Kiểm tra trạng thái biến động số dư</span>
                    </button>

                    {/* MOCK SANDBOX SIMULATOR BUTTON (Cực kỳ giá trị khi test localhost & bảo vệ đồ án) */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-dashed border-orange-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-orange-950 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-orange-600" /> Chế độ Sandbox / Test Demo
                        </span>
                        <span className="text-[10px] text-orange-700 font-bold">Không tốn tiền thật</span>
                      </div>
                      <button
                        onClick={handleMockPay}
                        disabled={isMockPaying}
                        className="w-full py-2 rounded-lg text-xs font-black bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:opacity-90 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        {isMockPaying ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
                        )}
                        <span>Mô Phỏng SePay Xác Nhận Tiền Vào Ngay</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setCurrentOrder(null)}
                      className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      Đổi gói cước khác
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* STATE 3: SELECT PLAN SCREEN */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative p-5 rounded-3xl cursor-pointer transition-all border-2 text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/15'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                          Phổ Biến Nhất
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900">{plan.name}</h4>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                            isSelected ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>

                        <div>
                          <div className="text-2xl font-black text-slate-900">
                            {formatCurrency(plan.price)}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Thời hạn {plan.durationDays} ngày
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4 space-y-1.5">
                        {plan.features.slice(0, 3).map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
                  className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white shadow-xl shadow-orange-600/25 hover:from-orange-500 hover:to-amber-500 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {isCreatingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tạo mã SePay VietQR...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 text-amber-200 fill-amber-300" />
                      <span>Thanh Toán Ngay Qua VietQR (SePay)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
