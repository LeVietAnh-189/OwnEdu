/**
 * deviceFingerprint.ts
 * Tiện ích định danh thiết bị và trích xuất vân tay phần cứng / trình duyệt an toàn.
 * Phục vụ cơ chế khóa bản quyền License Key (2 máy / tài khoản PRO).
 */

const DEVICE_ID_STORAGE_KEY = 'ownedu_device_id';

/**
 * Lấy hoặc khởi tạo Device ID ngẫu nhiên, lưu bền vững trong localStorage
 */
export function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!deviceId) {
      // Sinh UUID v4 chuẩn qua Web Crypto API
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = `dev_${crypto.randomUUID()}`;
      } else {
        deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return 'dev_fallback_ephemeral';
  }
}

/**
 * Tạo mã hash vân tay phần cứng/trình duyệt nhẹ (Canvas + Screen + Platform + Timezone)
 */
export function generateDeviceFingerprint(): string {
  try {
    const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}` : 'unknown';
    const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown';
    const language = typeof navigator !== 'undefined' ? (navigator.language || '') : '';
    const platform = typeof navigator !== 'undefined' ? (navigator.platform || '') : '';
    const hardwareConcurrency = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;

    // Canvas fingerprinting đơn giản
    let canvasHash = 'canvas_na';
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f60';
          ctx.fillRect(10, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('OwnEdu,DRM:2.0', 2, 2);
          const dataUrl = canvas.toDataURL();
          // Lấy 32 ký tự cuối của chuỗi base64
          canvasHash = dataUrl.slice(-32);
        }
      } catch {
        canvasHash = 'canvas_sec_error';
      }
    }

    const rawString = `${screenRes}|${timezone}|${language}|${platform}|${hardwareConcurrency}|${canvasHash}`;
    
    // Simple fast DJB2 hash
    let hash = 5381;
    for (let i = 0; i < rawString.length; i++) {
      hash = ((hash << 5) + hash) + rawString.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }

    return `fp_${Math.abs(hash).toString(16)}`;
  } catch {
    return 'fp_generic';
  }
}

/**
 * Trả về tên thiết bị thân thiện, dễ đọc cho người dùng và Admin
 * Ví dụ: "Chrome 128 trên Windows (1920x1080)"
 */
export function getDeviceHumanName(): string {
  if (typeof navigator === 'undefined') return 'Thiết bị người dùng';

  const ua = navigator.userAgent;
  let browser = 'Trình duyệt';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';

  let os = 'Hệ điều hành';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  const resolution = typeof window !== 'undefined' ? ` (${window.screen.width}x${window.screen.height})` : '';

  return `${browser} trên ${os}${resolution}`;
}
