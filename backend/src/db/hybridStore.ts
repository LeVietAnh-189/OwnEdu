import fs from 'fs';
import path from 'path';
import { 
  DocumentItem, 
  DocumentChunk, 
  Exam, 
  Question, 
  ExamAttempt, 
  GradeReport, 
  User, 
  UserRole,
  Course,
  TokenUsageLog,
  VideoItem,
  GenerationProgressEvent,
  SystemServiceConfig,
  PaymentOrder,
  PaymentPlan,
  PaymentPlanId,
  PaymentOrderStatus,
  UserCompletedLesson,
  RankBadge,
  RankTier,
  UserRankProfile,
  LeaderboardResponse,
  LicenseKeyItem,
  LicenseDeviceBinding,
  LicenseChatTicket,
  LicenseChatMessage
} from '../types.js';

export interface SystemSettings {
  geminiApiKey?: string;
  openaiApiKey?: string;
  activeModel: 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gpt-4o-mini' | 'offline-smart';
}

export const DEFAULT_SYSTEM_SERVICES: SystemServiceConfig[] = [
  {
    id: 'author-svc',
    name: 'Author Service',
    key: 'auth',
    port: 3001,
    status: 'RUNNING',
    description: 'Xác thực tài khoản, kiểm soát phiên đăng nhập JWT & phân quyền Super Admin / Admin',
    maintenanceMessage: 'Hệ thống xác thực tài khoản đang bảo trì định kỳ. Các phiên đăng nhập hiện tại vẫn hoạt động bình thường.',
    estimatedEndTime: '',
    allowAdminBypass: true
  },
  {
    id: 'payment-svc',
    name: 'Payment Service',
    key: 'payment',
    port: 3002,
    status: 'RUNNING',
    description: 'Cổng thanh toán học phí, đăng ký gói Pro và đối soát hóa đơn giao dịch',
    maintenanceMessage: 'Cổng thanh toán đang bảo trì định kỳ để nâng cấp kênh thanh toán. Các khóa học đã sở hữu vẫn học bình thường.',
    estimatedEndTime: '',
    allowAdminBypass: true
  },
  {
    id: 'product-svc',
    name: 'Product Service',
    key: 'product',
    port: 3003,
    status: 'RUNNING',
    description: 'Quản lý danh mục khóa học, kho giáo trình và đề thi khảo thí thông minh',
    maintenanceMessage: 'Hệ thống khóa học và đề thi đang trong quá trình đồng bộ dữ liệu bảo trì.',
    estimatedEndTime: '',
    allowAdminBypass: true
  },
  {
    id: 'cart-svc',
    name: 'Cart Service',
    key: 'cart',
    port: 3004,
    status: 'RUNNING',
    description: 'Giỏ hàng đăng ký môn học, tiến độ học tập và lưu vết bài thi của học viên',
    maintenanceMessage: 'Hệ thống giỏ hàng & đăng ký môn học đang bảo trì hệ thống.',
    estimatedEndTime: '',
    allowAdminBypass: true
  }
];

export const DEFAULT_PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: 'PRO_MONTHLY',
    name: 'Gói 1 Tháng',
    price: 2000,
    durationDays: 30,
    description: 'Trải nghiệm toàn diện các tính năng AI & Video chất lượng cao',
    features: [
      'Tạo đề thi AI không giới hạn từ tài liệu giáo trình',
      'Chấm điểm tự luận Rubric chi tiết 4 tiêu chí',
      'Xem video bài giảng Cloudflare R2 Streaming độ nét cao',
      'Tải tài liệu, giáo trình đính kèm (.pdf, .docx)',
      'Huy hiệu Pro VIP nổi bật'
    ]
  },
  {
    id: 'PRO_QUARTERLY',
    name: 'Gói 3 Tháng (Tiết kiệm 15%)',
    price: 249000,
    durationDays: 90,
    description: 'Lựa chọn lý tưởng theo học kỳ dành cho sinh viên',
    features: [
      'Tất cả quyền lợi của Gói 1 Tháng',
      'Tiết kiệm 48.000 VNĐ so với mua lẻ từng tháng',
      'Ưu tiên tốc độ xử lý khi bóc tách giáo trình',
      'Không giới hạn dung lượng lưu trữ tài liệu',
      'Chứng chỉ hoàn thành khóa học có mã QR xác thực'
    ],
    isPopular: true
  },
  {
    id: 'PRO_YEARLY',
    name: 'Gói 1 Năm (Siêu Tiết Kiệm)',
    price: 799000,
    durationDays: 365,
    description: 'Đồng hành cả năm học với chi phí tiết kiệm hơn 33%',
    features: [
      'Tất cả quyền lợi của Gói 3 Tháng',
      'Tiết kiệm gần 400.000 VNĐ / năm',
      'Truy cập sớm các mô hình AI mới nhất',
      'Đặc quyền tải toàn bộ tài nguyên đồ án & giáo trình',
      'Hỗ trợ kỹ thuật 1-1 từ đội ngũ giảng viên'
    ]
  }
];

interface DatabaseSchema {
  users: User[];
  documents: DocumentItem[];
  documentChunks: DocumentChunk[];
  exams: Exam[];
  examAttempts: ExamAttempt[];
  gradeReports: GradeReport[];
  settings?: SystemSettings;
  courses?: Course[];
  videos?: VideoItem[];
  tokenLogs?: TokenUsageLog[];
  services?: SystemServiceConfig[];
  paymentOrders?: PaymentOrder[];
  activeUserId?: string;
  completedLessons?: UserCompletedLesson[];
  licenseKeys?: LicenseKeyItem[];
  licenseChatTickets?: LicenseChatTicket[];
}

const resolveDataDir = (): string => {
  if (fs.existsSync(path.resolve(process.cwd(), 'data'))) {
    return path.resolve(process.cwd(), 'data');
  }
  if (fs.existsSync(path.resolve(process.cwd(), '../data'))) {
    return path.resolve(process.cwd(), '../data');
  }
  return path.resolve(process.cwd(), 'data');
};
const DATA_DIR = resolveDataDir();
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function cleanMojibake(str: string): string {
  if (!str) return str;
  if (/Ä|á»|Æ|áº/.test(str)) {
    try {
      const fixed = Buffer.from(str, 'latin1').toString('utf8');
      if (fixed && !/Ä|á»|Æ|áº/.test(fixed)) return fixed;
    } catch {}
  }
  return str;
}

export class HybridStore {
  private data: DatabaseSchema;
  private sseClients: Map<string, (event: GenerationProgressEvent) => void> = new Map();

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        // Auto-clean any existing mojibake strings
        if (parsed.documents) {
          parsed.documents.forEach(d => {
            d.filename = cleanMojibake(d.filename);
          });
        }
        if (parsed.exams) {
          parsed.exams.forEach(e => {
            e.title = cleanMojibake(e.title);
          });
        }
        if (parsed.users) {
          parsed.users.forEach((u: any) => {
            if (u.role === 'STUDENT' || u.role === 'TEACHER') {
              u.role = 'USER';
            }
          });
          if (!parsed.users.some(u => u.role === 'ADMIN')) {
            parsed.users.push({
              id: 'usr_admin_default',
              email: 'admin@ownedu.edu.vn',
              fullName: 'Quản Trị Viên (Admin)',
              role: 'ADMIN',
              tier: 'PRO'
            });
          }
        }
        if (!parsed.courses) {
          parsed.courses = [];
        }
        if (!parsed.tokenLogs || parsed.tokenLogs.length === 0) {
          parsed.tokenLogs = [
            {
              id: 'tok_01',
              timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
              feature: 'EXAM_GENERATION',
              model: 'gemini-1.5-flash',
              inputTokens: 3840,
              outputTokens: 1420,
              totalTokens: 5260,
              costUsd: 0.0018,
              refId: 'exam_sample_01'
            },
            {
              id: 'tok_02',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              feature: 'ESSAY_GRADING',
              model: 'gemini-1.5-flash',
              inputTokens: 1250,
              outputTokens: 680,
              totalTokens: 1930,
              costUsd: 0.0007,
              refId: 'attempt_sample_01'
            }
          ];
        }
        if (!parsed.settings) {
          parsed.settings = {
            geminiApiKey: process.env.GEMINI_API_KEY || '',
            openaiApiKey: process.env.OPENAI_API_KEY || '',
            activeModel: (process.env.GEMINI_API_KEY ? 'gemini-1.5-flash' : 'offline-smart') as any
          };
        }
        if (!parsed.services || parsed.services.length === 0) {
          parsed.services = JSON.parse(JSON.stringify(DEFAULT_SYSTEM_SERVICES));
        }
        if (!parsed.paymentOrders) {
          parsed.paymentOrders = [];
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read store.json, reinitializing memory store.');
    }
    const initial = this.getSeedData();
    this.persist(initial);
    return initial;
  }

  private persist(state: DatabaseSchema = this.data): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving to store.json:', err);
    }
  }

  // --- SSE Event Dispatcher for Real-time Progress ---
  public registerSSEClient(jobId: string, callback: (event: GenerationProgressEvent) => void) {
    this.sseClients.set(jobId, callback);
  }

  public unregisterSSEClient(jobId: string) {
    this.sseClients.delete(jobId);
  }

  public emitSSEProgress(event: GenerationProgressEvent) {
    const cb = this.sseClients.get(event.jobId);
    if (cb) {
      cb(event);
    }
  }

  // --- Users & Roles ---
  public getCurrentUser(): User {
    if (this.data.activeUserId) {
      const found = this.data.users.find(u => u.id === this.data.activeUserId);
      if (found) return found;
    }
    return this.data.users[0];
  }

  public switchCurrentUserRole(targetRole: UserRole): User {
    let user = this.data.users.find(u => u.role === targetRole);
    if (!user) {
      if (targetRole === 'ADMIN') {
        user = {
          id: 'usr_admin_default',
          email: 'admin@ownedu.edu.vn',
          fullName: 'Quản Trị Viên (Admin)',
          role: 'ADMIN',
          tier: 'PRO'
        };
        this.data.users.push(user);
      } else {
        user = {
          id: 'usr_default_student',
          email: 'sinhvien@ownedu.vn',
          fullName: 'Nguyễn Văn Nam (Học viên/Giảng viên)',
          role: 'USER',
          tier: 'PRO'
        };
        this.data.users.unshift(user);
      }
    }
    this.data.activeUserId = user.id;
    this.persist();
    return user;
  }

  public getUsers(): User[] {
    if (this.data.users.length < 3) {
      this.data.users = [
        {
          id: 'usr_0001',
          code: 'OE-0001',
          fullName: 'Nguyễn Văn A',
          email: 'anv@gmail.com',
          tier: 'FREE',
          role: 'USER'
        },
        {
          id: 'usr_0002',
          code: 'OE-0002',
          fullName: 'Nguyễn Văn B',
          email: 'bnv@gmail.com',
          tier: 'FREE',
          role: 'USER'
        },
        {
          id: 'usr_0003',
          code: 'OE-0003',
          fullName: 'Nguyễn Văn C',
          email: 'cnv@gmail.com',
          tier: 'PRO',
          role: 'USER'
        },
        {
          id: 'usr_admin_default',
          code: 'OE-0000',
          fullName: 'Quản Trị Viên (Admin)',
          email: 'admin@ownedu.edu.vn',
          tier: 'PRO',
          role: 'ADMIN'
        }
      ];
      this.persist();
    }
    this.data.users.forEach((u, idx) => {
      if (!u.code) {
        u.code = u.role === 'ADMIN' ? 'OE-0000' : `OE-${String(idx + 1).padStart(4, '0')}`;
      }
    });
    return this.data.users;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.tier !== undefined) user.tier = updates.tier;
    if (updates.fullName !== undefined) user.fullName = updates.fullName;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.code !== undefined) user.code = updates.code;
    if (updates.proExpiresAt !== undefined) user.proExpiresAt = updates.proExpiresAt;
    this.persist();
    return user;
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public deleteUser(id: string): boolean {
    const initLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.persist();
    return this.data.users.length < initLen;
  }

  // --- Payment & Pro VIP Orders (SePay VietQR) ---
  public getPaymentPlans(): PaymentPlan[] {
    return DEFAULT_PAYMENT_PLANS;
  }

  public getPaymentPlan(planId: PaymentPlanId): PaymentPlan | undefined {
    return DEFAULT_PAYMENT_PLANS.find(p => p.id === planId);
  }

  public getPaymentOrders(userId?: string): PaymentOrder[] {
    if (!this.data.paymentOrders) {
      this.data.paymentOrders = [];
    }
    if (userId) {
      return this.data.paymentOrders.filter(o => o.userId === userId);
    }
    return this.data.paymentOrders;
  }

  public getPaymentOrderByCode(orderCode: number): PaymentOrder | undefined {
    if (!this.data.paymentOrders) return undefined;
    return this.data.paymentOrders.find(o => o.orderCode === orderCode);
  }

  public getPaymentOrderByPaymentCode(paymentCode: string): PaymentOrder | undefined {
    if (!this.data.paymentOrders) return undefined;
    const clean = paymentCode.toUpperCase().trim();
    return this.data.paymentOrders.find(o => o.paymentCode.toUpperCase() === clean);
  }

  public createPaymentOrder(order: PaymentOrder): PaymentOrder {
    if (!this.data.paymentOrders) {
      this.data.paymentOrders = [];
    }
    this.data.paymentOrders.unshift(order);
    this.persist();
    return order;
  }

  public updatePaymentOrderStatus(
    orderCode: number, 
    status: PaymentOrderStatus, 
    paidAt?: string, 
    rawWebhookData?: any
  ): PaymentOrder | undefined {
    if (!this.data.paymentOrders) return undefined;
    const order = this.data.paymentOrders.find(o => o.orderCode === orderCode);
    if (!order) return undefined;

    order.status = status;
    if (paidAt) order.paidAt = paidAt;
    if (rawWebhookData) order.rawWebhookData = rawWebhookData;

    // Tự động nâng cấp tài khoản nếu thanh toán thành công
    if (status === 'PAID') {
      const plan = this.getPaymentPlan(order.planId);
      const days = plan ? plan.durationDays : 30;
      this.upgradeUserToPro(order.userId, days);
    }

    this.persist();
    return order;
  }

  public upgradeUserToPro(userId: string, durationDays: number = 30): User | undefined {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return undefined;

    user.tier = 'PRO';
    const now = new Date();
    let currentExpiry = user.proExpiresAt ? new Date(user.proExpiresAt) : null;
    let baseDate = (currentExpiry && currentExpiry.getTime() > now.getTime()) ? currentExpiry : now;
    
    const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    user.proExpiresAt = newExpiry.toISOString();

    // Tự động cấp 2 License Keys cho người dùng PRO
    this.generateUserLicenseKeys(user.id, user.proExpiresAt);

    this.persist();
    return user;
  }

  // --- License Keys & Device DRM Management ---
  private generateRandomLicenseCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randPart = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `OE-PRO-${randPart(4)}-${randPart(4)}`;
  }

  public getLicenseKeys(userId?: string): LicenseKeyItem[] {
    if (!this.data.licenseKeys) {
      this.data.licenseKeys = [];
    }
    if (userId) {
      return this.data.licenseKeys.filter(k => k.userId === userId);
    }
    return this.data.licenseKeys;
  }

  public getLicenseKeyByCode(key: string): LicenseKeyItem | undefined {
    if (!this.data.licenseKeys) this.data.licenseKeys = [];
    const clean = (key || '').trim().toUpperCase();
    return this.data.licenseKeys.find(k => k.key.toUpperCase() === clean);
  }

  public generateUserLicenseKeys(userId: string, expiresAt?: string, orderCode?: number): LicenseKeyItem[] {
    if (!this.data.licenseKeys) this.data.licenseKeys = [];
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return [];

    const finalExpiry = expiresAt || user.proExpiresAt || new Date(Date.now() + 365 * 86400000).toISOString();
    const existing = this.data.licenseKeys.filter(k => k.userId === userId);

    // Cập nhật hạn dùng cho các key đã có nếu user gia hạn
    existing.forEach(k => {
      k.expiresAt = finalExpiry;
      k.status = 'ACTIVE';
      if (orderCode) k.orderCode = orderCode;
    });

    const neededSlots = [1, 2].filter(slot => !existing.some(k => k.slotIndex === slot));
    const now = new Date().toISOString();

    for (const slot of neededSlots) {
      let code = this.generateRandomLicenseCode();
      while (this.data.licenseKeys.some(k => k.key === code)) {
        code = this.generateRandomLicenseCode();
      }

      const newKey: LicenseKeyItem = {
        id: `lic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        key: code,
        userId: user.id,
        userEmail: user.email,
        orderCode,
        slotIndex: slot as 1 | 2,
        status: 'ACTIVE',
        boundDevice: null,
        expiresAt: finalExpiry,
        createdAt: now,
        updatedAt: now
      };
      this.data.licenseKeys.unshift(newKey);
      existing.push(newKey);
    }

    this.persist();
    return existing.sort((a, b) => a.slotIndex - b.slotIndex);
  }

  public activateLicenseKey(params: {
    userId: string;
    key: string;
    deviceId: string;
    deviceFingerprint: string;
    deviceName: string;
    ip: string;
  }): { success: boolean; message: string; license?: LicenseKeyItem } {
    if (!this.data.licenseKeys) this.data.licenseKeys = [];
    const license = this.getLicenseKeyByCode(params.key);

    if (!license) {
      return { success: false, message: 'Mã License Key không tồn tại trên hệ thống.' };
    }

    if (license.userId !== params.userId) {
      return { success: false, message: 'Mã License Key này thuộc về tài khoản học viên khác.' };
    }

    if (license.status !== 'ACTIVE') {
      return { success: false, message: 'Mã License Key này đã bị thu hồi hoặc hết hạn.' };
    }

    const now = new Date().toISOString();

    // Trường hợp 1: Key đã gắn vào một thiết bị
    if (license.boundDevice) {
      // Nếu chính là thiết bị này -> Cho phép cập nhật IP & Last Active
      if (license.boundDevice.deviceId === params.deviceId) {
        license.boundDevice.lastIp = params.ip || license.boundDevice.lastIp;
        license.boundDevice.lastActiveAt = now;
        license.boundDevice.deviceName = params.deviceName || license.boundDevice.deviceName;
        license.updatedAt = now;
        this.persist();
        return { success: true, message: 'Thiết bị đã được xác thực thành công.', license };
      }

      // Nếu là thiết bị khác -> Báo lỗi xung đột (Conflict)
      return {
        success: false,
        message: `Mã key này đang được liên kết với thiết bị "${license.boundDevice.deviceName}". Mỗi License Key chỉ được sử dụng trên 1 máy tính.`
      };
    }

    // Trường hợp 2: Key đang trống -> Gắn vào thiết bị hiện tại
    license.boundDevice = {
      deviceId: params.deviceId,
      deviceFingerprint: params.deviceFingerprint,
      deviceName: params.deviceName || 'Thiết bị người dùng',
      activatedAt: now,
      lastIp: params.ip || '127.0.0.1',
      lastActiveAt: now
    };
    license.updatedAt = now;
    this.persist();

    return {
      success: true,
      message: `Kích hoạt thành công trên ${license.boundDevice.deviceName}! Bạn đã mở khóa toàn quyền học tập trên máy tính này.`,
      license
    };
  }

  public verifyDeviceAccess(userId: string, deviceId: string, ip?: string): {
    isAuthorized: boolean;
    reason?: string;
    license?: LicenseKeyItem;
  } {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return { isAuthorized: false, reason: 'USER_NOT_FOUND' };

    // Tài khoản ADMIN luôn được quyền truy cập quản trị
    if (user.role === 'ADMIN') {
      return { isAuthorized: true };
    }

    // Nếu tài khoản không phải PRO thì không có quyền xem tài nguyên PRO
    if (user.tier !== 'PRO') {
      return { isAuthorized: false, reason: 'NOT_PRO_USER' };
    }

    const userKeys = this.getLicenseKeys(userId);
    // Nếu chưa có key nào được cấp (e.g. tài khoản PRO cũ chưa sinh key), tự động cấp
    if (userKeys.length === 0) {
      this.generateUserLicenseKeys(userId, user.proExpiresAt);
    }

    const boundKey = this.getLicenseKeys(userId).find(
      k => k.status === 'ACTIVE' && k.boundDevice && k.boundDevice.deviceId === deviceId
    );

    if (boundKey && boundKey.boundDevice) {
      // Cập nhật vết IP và thời gian hoạt động mới nhất
      boundKey.boundDevice.lastActiveAt = new Date().toISOString();
      if (ip) boundKey.boundDevice.lastIp = ip;
      this.persist();
      return { isAuthorized: true, license: boundKey };
    }

    return { isAuthorized: false, reason: 'DEVICE_NOT_ACTIVATED' };
  }

  public adminResetLicenseSlot(keyIdOrCode: string): { success: boolean; message: string; license?: LicenseKeyItem } {
    if (!this.data.licenseKeys) this.data.licenseKeys = [];
    const license = this.data.licenseKeys.find(
      k => k.id === keyIdOrCode || k.key.toUpperCase() === keyIdOrCode.toUpperCase()
    );

    if (!license) {
      return { success: false, message: 'Không tìm thấy License Key cần reset.' };
    }

    const oldDeviceName = license.boundDevice?.deviceName || 'thiết bị cũ';
    license.boundDevice = null;
    license.updatedAt = new Date().toISOString();

    // Thêm tin nhắn hệ thống vào ticket chat của user nếu có
    const ticket = this.getChatTicketByUserId(license.userId);
    if (ticket) {
      ticket.messages.push({
        id: `msg_sys_${Date.now()}`,
        senderId: 'sys_admin',
        senderRole: 'ADMIN',
        senderName: 'Hệ Thống OwnEdu (Admin)',
        message: `Admin đã hủy liên kết thiết bị (${oldDeviceName}) cho Slot ${license.slotIndex} [${license.key}]. Bạn có thể kích hoạt lại trên thiết bị mới ngay bây giờ!`,
        timestamp: new Date().toISOString()
      });
      ticket.status = 'RESOLVED';
      ticket.updatedAt = new Date().toISOString();
    }

    this.persist();
    return {
      success: true,
      message: `Đã hủy liên kết thiết bị thành công cho Slot ${license.slotIndex} (${license.key}). Mã hiện đã sẵn sàng cho máy mới.`,
      license
    };
  }

  // --- License Support Live Chat Tickets ---
  public getChatTickets(userId?: string): LicenseChatTicket[] {
    if (!this.data.licenseChatTickets) {
      this.data.licenseChatTickets = [];
    }
    if (userId) {
      return this.data.licenseChatTickets.filter(t => t.userId === userId);
    }
    return this.data.licenseChatTickets;
  }

  public getChatTicketByUserId(userId: string): LicenseChatTicket | undefined {
    return this.getChatTickets().find(t => t.userId === userId);
  }

  public sendChatMessage(params: {
    userId: string;
    senderId: string;
    senderRole: 'USER' | 'ADMIN';
    senderName: string;
    message: string;
    targetKeyId?: string;
    deviceInfoSnapshot?: string;
  }): LicenseChatTicket {
    if (!this.data.licenseChatTickets) this.data.licenseChatTickets = [];
    const user = this.data.users.find(u => u.id === params.userId);
    let ticket = this.getChatTicketByUserId(params.userId);
    const now = new Date().toISOString();

    if (!ticket) {
      ticket = {
        id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: params.userId,
        userName: user?.fullName || 'Học viên',
        userEmail: user?.email || '',
        targetKeyId: params.targetKeyId,
        status: 'OPEN',
        messages: [],
        createdAt: now,
        updatedAt: now
      };
      this.data.licenseChatTickets.unshift(ticket);
    }

    ticket.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: params.senderId,
      senderRole: params.senderRole,
      senderName: params.senderName,
      message: params.message,
      timestamp: now,
      deviceInfoSnapshot: params.deviceInfoSnapshot
    });

    if (params.senderRole === 'USER') {
      ticket.status = 'OPEN';
    }
    ticket.updatedAt = now;
    if (params.targetKeyId) ticket.targetKeyId = params.targetKeyId;

    this.persist();
    return ticket;
  }

  public resolveChatTicket(ticketId: string): boolean {
    if (!this.data.licenseChatTickets) return false;
    const t = this.data.licenseChatTickets.find(item => item.id === ticketId);
    if (!t) return false;
    t.status = 'RESOLVED';
    t.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }



  // --- Documents ---
  public getDocuments(userId?: string): DocumentItem[] {
    if (userId) {
      return this.data.documents.filter(d => d.userId === userId && d.status !== 'ARCHIVED');
    }
    return this.data.documents.filter(d => d.status !== 'ARCHIVED');
  }

  public getDocumentById(id: string): DocumentItem | undefined {
    return this.data.documents.find(d => d.id === id);
  }

  public addDocument(doc: DocumentItem): DocumentItem {
    this.data.documents.unshift(doc);
    this.persist();
    return doc;
  }

  public updateDocument(id: string, updates: Partial<DocumentItem>): DocumentItem | undefined {
    const doc = this.getDocumentById(id);
    if (doc) {
      Object.assign(doc, updates, { updatedAt: new Date().toISOString() });
      this.persist();
    }
    return doc;
  }

  public deleteDocument(id: string): boolean {
    const doc = this.getDocumentById(id);
    if (doc) {
      doc.status = 'ARCHIVED';
      doc.updatedAt = new Date().toISOString();
      this.persist();
      return true;
    }
    return false;
  }

  // --- Document Chunks ---
  public getChunksByDocumentId(documentId: string): DocumentChunk[] {
    return this.data.documentChunks
      .filter(c => c.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  public addChunks(chunks: DocumentChunk[]): void {
    this.data.documentChunks.push(...chunks);
    this.persist();
  }

  // --- Exams ---
  public getExams(): Exam[] {
    return this.data.exams;
  }

  public getExamById(id: string): Exam | undefined {
    return this.data.exams.find(e => e.id === id);
  }

  public addExam(exam: Exam): Exam {
    this.data.exams.unshift(exam);
    this.persist();
    return exam;
  }

  public updateExam(id: string, updates: Partial<Exam>): Exam | undefined {
    const exam = this.getExamById(id);
    if (exam) {
      Object.assign(exam, updates, { updatedAt: new Date().toISOString() });
      this.persist();
    }
    return exam;
  }

  public deleteExam(id: string): boolean {
    const idx = this.data.exams.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.data.exams.splice(idx, 1);
      this.data.examAttempts = this.data.examAttempts.filter(a => a.examId !== id);
      this.persist();
      return true;
    }
    return false;
  }

  public updateQuestion(examId: string, qId: string, updates: Partial<Question>): Question | undefined {
    const exam = this.getExamById(examId);
    if (exam) {
      const q = exam.questions.find(item => item.id === qId);
      if (q) {
        Object.assign(q, updates);
        exam.updatedAt = new Date().toISOString();
        this.persist();
        return q;
      }
    }
    return undefined;
  }

  // --- Attempts (Phiên thi) ---
  public getAttempts(userId?: string): ExamAttempt[] {
    if (userId) {
      return this.data.examAttempts.filter(a => a.userId === userId);
    }
    return this.data.examAttempts;
  }

  public getAttemptById(id: string): ExamAttempt | undefined {
    return this.data.examAttempts.find(a => a.id === id);
  }

  public addAttempt(attempt: ExamAttempt): ExamAttempt {
    this.data.examAttempts.unshift(attempt);
    this.persist();
    return attempt;
  }

  // Fast Auto-Save with JSONB atomic emulation
  public saveAttemptAnswer(
    attemptId: string, 
    questionId: string, 
    payload: { type: 'MCQ' | 'ESSAY'; selectedOption?: string; essayText?: string }
  ): { savedAt: string } {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt) {
      throw new Error('ATTEMPT_NOT_FOUND');
    }
    if (attempt.status !== 'IN_PROGRESS') {
      throw new Error('ATTEMPT_ALREADY_SUBMITTED');
    }

    const savedAt = new Date().toISOString();
    const existing = attempt.answers[questionId] || { isFlagged: false };

    attempt.answers[questionId] = {
      type: payload.type,
      selectedOption: payload.selectedOption,
      essayText: payload.essayText,
      wordCount: payload.essayText ? payload.essayText.trim().split(/\s+/).filter(Boolean).length : 0,
      isFlagged: existing.isFlagged || false,
      savedAt,
    };
    attempt.updatedAt = savedAt;
    this.persist();

    return { savedAt };
  }

  public toggleAttemptFlag(attemptId: string, questionId: string): boolean {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt) return false;
    const existing = attempt.answers[questionId] || { 
      type: 'MCQ', 
      isFlagged: false, 
      savedAt: new Date().toISOString() 
    };
    existing.isFlagged = !existing.isFlagged;
    attempt.answers[questionId] = existing;
    attempt.updatedAt = new Date().toISOString();
    this.persist();
    return existing.isFlagged;
  }

  public updateAttempt(id: string, updates: Partial<ExamAttempt>): ExamAttempt | undefined {
    const attempt = this.getAttemptById(id);
    if (attempt) {
      Object.assign(attempt, updates, { updatedAt: new Date().toISOString() });
      this.persist();
    }
    return attempt;
  }

  // --- Grade Reports ---
  public getGradeReportByAttemptId(attemptId: string): GradeReport | undefined {
    return this.data.gradeReports.find(r => r.attemptId === attemptId);
  }

  public addGradeReport(report: GradeReport): GradeReport {
    const existingIdx = this.data.gradeReports.findIndex(r => r.attemptId === report.attemptId);
    if (existingIdx >= 0) {
      this.data.gradeReports[existingIdx] = report;
    } else {
      this.data.gradeReports.unshift(report);
    }
    this.persist();
    return report;
  }

  public updateGradeReport(attemptId: string, updates: Partial<GradeReport>): GradeReport | undefined {
    const report = this.getGradeReportByAttemptId(attemptId);
    if (report) {
      Object.assign(report, updates, { updatedAt: new Date().toISOString() });
      this.persist();
    }
    return report;
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    if (!this.data.settings) {
      this.data.settings = {
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        activeModel: (process.env.GEMINI_API_KEY ? 'gemini-3.5-flash' : 'offline-smart') as any,
      };
    }
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    this.data.settings = { ...current, ...updates };
    this.persist();
    return this.data.settings;
  }

  // --- System Services Maintenance ---
  public getServices(): SystemServiceConfig[] {
    if (!this.data.services || this.data.services.length === 0) {
      this.data.services = JSON.parse(JSON.stringify(DEFAULT_SYSTEM_SERVICES));
      this.persist();
    }
    return this.data.services || [];
  }

  public getServiceByKey(key: string): SystemServiceConfig | undefined {
    return this.getServices().find(s => s.key === key || s.id === key);
  }

  public updateService(id: string, updates: Partial<SystemServiceConfig>): SystemServiceConfig | null {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === id || s.key === id);
    if (index === -1) return null;

    services[index] = {
      ...services[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.services = services;
    this.persist();
    return services[index];
  }

  // --- Courses Management (Admin) ---
  public getCourses(): Course[] {
    if (!this.data.courses || this.data.courses.length === 0) {
      this.data.courses = [
        {
          id: 'course-1',
          code: 'PROG101',
          name: 'Lập Trình Web Fullstack Hiện Đại với React & Node.js',
          description: 'Học lập trình web từ cơ bản đến nâng cao: React 19, TypeScript, REST API, TailwindCSS và cơ chế xác thực JWT.',
          department: 'Công nghệ thông tin',
          topic: 'Lập trình',
          isFreeTier: true,
          tierRequired: 'FREE',
          documentIds: ['doc_microservices_sample'],
          videoIds: [],
          createdAt: '2026-09-20T10:00:00.000Z'
        },
        {
          id: 'course-2',
          code: 'DCK101',
          name: 'Docker & Kubernetes Thực Chiến Cho DevOps',
          description: 'Làm chủ Docker Container, Docker Compose đa dịch vụ, tối ưu Dockerfile và triển khai Kubernetes cluster thực tế.',
          department: 'Hệ thống thông tin',
          topic: 'Docker',
          isFreeTier: false,
          tierRequired: 'PRO',
          documentIds: [],
          videoIds: [],
          createdAt: '2026-09-22T08:30:00.000Z'
        },
        {
          id: 'course-3',
          code: 'ENG101',
          name: 'Tiếng Anh Chuyên Ngành CNTT & Luyện Phỏng Vấn IT',
          description: 'Nâng cao vốn từ vựng tiếng Anh chuyên ngành công nghệ, bóc tách tài liệu kỹ thuật và luyện trả lời phỏng vấn IT chuẩn quốc tế.',
          department: 'Ngoại ngữ',
          topic: 'Tiếng Anh',
          isFreeTier: true,
          tierRequired: 'FREE',
          documentIds: [],
          videoIds: [],
          createdAt: '2026-09-23T14:15:00.000Z'
        },
        {
          id: 'course-4',
          code: 'GIT101',
          name: 'Git & GitHub Nâng Cao: CI/CD, Gitflow & Quản Trị Nhóm',
          description: 'Quản trị mã nguồn chuyên nghiệp, xử lý conflict nâng cao, rebase, cherry-pick và thiết lập quy trình tự động hóa GitHub Actions.',
          department: 'Kỹ thuật phần mềm',
          topic: 'Git & Github',
          isFreeTier: false,
          tierRequired: 'PRO',
          documentIds: [],
          videoIds: [],
          createdAt: '2026-09-24T16:00:00.000Z'
        },
        {
          id: 'course-5',
          code: 'AI102',
          name: 'Trí Tuệ Nhân Tạo & Bloom Taxonomy trong Đánh Giá Khảo Thí',
          description: 'Khám phá mô hình AI tạo sinh (LLM), kỹ thuật Prompt Engineering và quy chuẩn 4 cấp độ tư duy Bloom trong ra đề thi.',
          department: 'Khoa học máy tính',
          topic: 'Lập trình',
          isFreeTier: false,
          tierRequired: 'PRO',
          documentIds: ['doc_microservices_sample'],
          videoIds: [],
          createdAt: '2026-09-25T09:00:00.000Z'
        }
      ];
      this.persist();
    }
    return this.data.courses;
  }

  public getCourse(id: string): Course | null {
    return (this.data.courses || []).find(c => c.id === id) || null;
  }

  public addCourse(course: Course): Course {
    if (!this.data.courses) this.data.courses = [];
    this.data.courses.unshift(course);
    this.persist();
    return course;
  }

  public updateCourse(id: string, updates: Partial<Course>): Course | null {
    if (!this.data.courses) return null;
    const index = this.data.courses.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.data.courses[index] = { ...this.data.courses[index], ...updates };
    this.persist();
    return this.data.courses[index];
  }

  public deleteCourse(id: string): boolean {
    if (!this.data.courses) return false;
    const initialLen = this.data.courses.length;
    this.data.courses = this.data.courses.filter(c => c.id !== id);
    this.persist();
    return this.data.courses.length < initialLen;
  }

  // --- Video Materials Management ---
  public getVideos(): VideoItem[] {
    return this.data.videos || [];
  }

  public getVideo(id: string): VideoItem | null {
    return (this.data.videos || []).find(v => v.id === id) || null;
  }

  public addVideo(video: VideoItem): VideoItem {
    if (!this.data.videos) this.data.videos = [];
    this.data.videos.unshift(video);
    this.persist();
    return video;
  }

  public updateVideo(id: string, updates: Partial<VideoItem>): VideoItem | null {
    if (!this.data.videos) return null;
    const index = this.data.videos.findIndex(v => v.id === id);
    if (index === -1) return null;
    this.data.videos[index] = { ...this.data.videos[index], ...updates };
    this.persist();
    return this.data.videos[index];
  }

  public deleteVideo(id: string): boolean {
    if (!this.data.videos) return false;
    const initialLen = this.data.videos.length;
    this.data.videos = this.data.videos.filter(v => v.id !== id);
    this.persist();
    return this.data.videos.length < initialLen;
  }

  // --- Token Logs & Analytics (Admin) ---
  public getTokenLogs(): TokenUsageLog[] {
    return this.data.tokenLogs || [];
  }

  public logTokenUsage(log: TokenUsageLog): void {
    if (!this.data.tokenLogs) this.data.tokenLogs = [];
    this.data.tokenLogs.unshift(log);
    this.persist();
  }

  // --- Admin System Stats ---
  public getAdminStats() {
    const documents = this.getDocuments();
    const totalStorageBytes = documents.reduce((acc, d) => acc + (d.fileSizeBytes || 0), 0);
    const totalChunks = this.data.documentChunks.length;
    const exams = this.getExams();
    const attempts = this.data.examAttempts;
    const tokens = this.getTokenLogs();
    const totalTokens = tokens.reduce((acc, t) => acc + (t.totalTokens || 0), 0);
    const totalCost = tokens.reduce((acc, t) => acc + (t.costUsd || 0), 0);

    const userList = this.getUsers();
    return {
      usersCount: userList.length,
      documentsCount: documents.length,
      totalStorageBytes,
      totalChunks,
      examsCount: exams.length,
      attemptsCount: attempts.length,
      coursesCount: (this.data.courses || []).length,
      tokensTotal: totalTokens,
      estimatedCostUsd: Number(totalCost.toFixed(4)),
      activeModel: this.getSettings().activeModel,
      serverUptimeSeconds: Math.floor(process.uptime()),
      users: userList,
      courses: this.data.courses || []
    };
  }

  public static readonly RANK_TIERS: Record<RankTier, RankBadge> = {
    NEWBIE: {
      tier: 'NEWBIE',
      title: 'Tân Binh',
      icon: '🥉',
      minLessons: 0,
      color: 'text-amber-700 border-amber-300 bg-amber-50',
      bgGradient: 'from-amber-600 to-amber-700'
    },
    DILIGENT: {
      tier: 'DILIGENT',
      title: 'Chăm Chỉ',
      icon: '🥈',
      minLessons: 10,
      color: 'text-slate-700 border-slate-300 bg-slate-100',
      bgGradient: 'from-slate-500 to-slate-700'
    },
    WARRIOR: {
      tier: 'WARRIOR',
      title: 'Chiến Thần',
      icon: '🥇',
      minLessons: 30,
      color: 'text-amber-800 border-amber-400 bg-amber-100',
      bgGradient: 'from-amber-500 to-orange-500'
    },
    ELITE: {
      tier: 'ELITE',
      title: 'Tinh Anh',
      icon: '💎',
      minLessons: 60,
      color: 'text-cyan-700 border-cyan-300 bg-cyan-50',
      bgGradient: 'from-cyan-500 to-blue-600'
    },
    MASTER: {
      tier: 'MASTER',
      title: 'Huyền Thoại',
      icon: '👑',
      minLessons: 100,
      color: 'text-purple-700 border-purple-300 bg-purple-50',
      bgGradient: 'from-purple-600 via-pink-600 to-amber-500'
    }
  };

  public getRankBadge(count: number): RankBadge {
    if (count >= 100) return HybridStore.RANK_TIERS.MASTER;
    if (count >= 60) return HybridStore.RANK_TIERS.ELITE;
    if (count >= 30) return HybridStore.RANK_TIERS.WARRIOR;
    if (count >= 10) return HybridStore.RANK_TIERS.DILIGENT;
    return HybridStore.RANK_TIERS.NEWBIE;
  }

  // --- User Completed Lessons & Leaderboard ---
  public getCompletedLessons(userId: string): UserCompletedLesson[] {
    if (!this.data.completedLessons) {
      this.data.completedLessons = [];
    }
    return this.data.completedLessons.filter(l => l.userId === userId);
  }

  public getCompletedLessonIds(userId: string, courseId?: string): string[] {
    const list = this.getCompletedLessons(userId);
    if (courseId) {
      return list.filter(l => l.courseId === courseId).map(l => l.lessonId);
    }
    return list.map(l => l.lessonId);
  }

  public toggleLessonCompletion(userId: string, courseId: string, lessonId: string): {
    completed: boolean;
    completedLessonIds: string[];
    totalCompleted: number;
    rankBadge: RankBadge;
  } {
    if (!this.data.completedLessons) {
      this.data.completedLessons = [];
    }

    const existingIndex = this.data.completedLessons.findIndex(
      l => l.userId === userId && l.lessonId === lessonId
    );

    let completed = false;
    if (existingIndex >= 0) {
      this.data.completedLessons.splice(existingIndex, 1);
      completed = false;
    } else {
      this.data.completedLessons.push({
        id: `cpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        courseId,
        lessonId,
        completedAt: new Date().toISOString()
      });
      completed = true;
    }

    this.persist();

    const userCompleted = this.getCompletedLessons(userId);
    const completedLessonIds = userCompleted.map(l => l.lessonId);
    const totalCompleted = userCompleted.length;
    const rankBadge = this.getRankBadge(totalCompleted);

    return {
      completed,
      completedLessonIds,
      totalCompleted,
      rankBadge
    };
  }

  public getLeaderboard(timeframe: 'weekly' | 'all' = 'weekly', currentUserId: string): LeaderboardResponse {
    if (!this.data.completedLessons || this.data.completedLessons.length === 0) {
      this.seedInitialCompletedLessons();
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const users = this.data.users || [];
    const completedLessons = this.data.completedLessons || [];

    const profiles: UserRankProfile[] = users.map(u => {
      const uLessons = completedLessons.filter(l => l.userId === u.id);
      const totalCount = uLessons.length;
      const weeklyLessons = uLessons.filter(l => new Date(l.completedAt) >= monday);
      const weeklyCount = weeklyLessons.length;

      const daysSet = new Set(uLessons.map(l => l.completedAt.split('T')[0]));
      const streakDays = Math.min(daysSet.size, 14) || (totalCount > 0 ? 1 : 0);

      const latest = [...uLessons].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        tier: u.tier,
        avatarChar: (u.fullName || 'U').charAt(0).toUpperCase(),
        totalCompletedLessons: totalCount,
        weeklyCompletedLessons: weeklyCount,
        currentStreakDays: streakDays,
        rankBadge: this.getRankBadge(totalCount),
        rankPosition: 0,
        lastActiveAt: latest ? latest.completedAt : undefined
      };
    });

    profiles.sort((a, b) => {
      if (timeframe === 'weekly') {
        if (b.weeklyCompletedLessons !== a.weeklyCompletedLessons) {
          return b.weeklyCompletedLessons - a.weeklyCompletedLessons;
        }
      }
      if (b.totalCompletedLessons !== a.totalCompletedLessons) {
        return b.totalCompletedLessons - a.totalCompletedLessons;
      }
      return a.fullName.localeCompare(b.fullName, 'vi');
    });

    profiles.forEach((p, idx) => {
      p.rankPosition = idx + 1;
    });

    const myRank = profiles.find(p => p.userId === currentUserId) || {
      userId: currentUserId,
      fullName: 'Học viên',
      email: '',
      role: 'USER',
      tier: 'FREE',
      avatarChar: 'H',
      totalCompletedLessons: 0,
      weeklyCompletedLessons: 0,
      currentStreakDays: 0,
      rankBadge: this.getRankBadge(0),
      rankPosition: profiles.length + 1
    };

    return {
      timeframe,
      leaderboard: profiles,
      myRank,
      stats: {
        totalStudents: users.length,
        totalCompletedLessons: completedLessons.length,
        topPerformer: profiles[0] || null
      }
    };
  }

  public seedInitialCompletedLessons(): void {
    if (this.data.completedLessons && this.data.completedLessons.length > 0) return;

    const sampleData: Array<{ userId: string; courseId: string; lessonId: string; daysAgo: number }> = [
      // usr_0001 (Nguyễn Văn A - Top 1 Chiến Thần)
      { userId: 'usr_0001', courseId: 'course-1', lessonId: 'les-1', daysAgo: 0 },
      { userId: 'usr_0001', courseId: 'course-1', lessonId: 'les-2', daysAgo: 0 },
      { userId: 'usr_0001', courseId: 'course-1', lessonId: 'les-3', daysAgo: 1 },
      { userId: 'usr_0001', courseId: 'course-2', lessonId: 'les-4', daysAgo: 1 },
      { userId: 'usr_0001', courseId: 'course-2', lessonId: 'les-5', daysAgo: 2 },
      { userId: 'usr_0001', courseId: 'course-3', lessonId: 'les-6', daysAgo: 2 },
      { userId: 'usr_0001', courseId: 'course-3', lessonId: 'les-7', daysAgo: 3 },
      { userId: 'usr_0001', courseId: 'course-4', lessonId: 'les-8', daysAgo: 3 },
      { userId: 'usr_0001', courseId: 'course-4', lessonId: 'les-9', daysAgo: 4 },
      { userId: 'usr_0001', courseId: 'course-5', lessonId: 'les-10', daysAgo: 4 },
      { userId: 'usr_0001', courseId: 'course-5', lessonId: 'les-11', daysAgo: 5 },
      { userId: 'usr_0001', courseId: 'course-1', lessonId: 'les-12', daysAgo: 6 },
      // usr_0003 (Nguyễn Văn C - Top 2 Chăm Chỉ)
      { userId: 'usr_0003', courseId: 'course-1', lessonId: 'les-1', daysAgo: 0 },
      { userId: 'usr_0003', courseId: 'course-1', lessonId: 'les-2', daysAgo: 1 },
      { userId: 'usr_0003', courseId: 'course-2', lessonId: 'les-4', daysAgo: 1 },
      { userId: 'usr_0003', courseId: 'course-3', lessonId: 'les-6', daysAgo: 2 },
      { userId: 'usr_0003', courseId: 'course-3', lessonId: 'les-7', daysAgo: 3 },
      { userId: 'usr_0003', courseId: 'course-4', lessonId: 'les-8', daysAgo: 4 },
      { userId: 'usr_0003', courseId: 'course-5', lessonId: 'les-10', daysAgo: 5 },
      // usr_0002 (Nguyễn Văn B - Top 3)
      { userId: 'usr_0002', courseId: 'course-1', lessonId: 'les-1', daysAgo: 1 },
      { userId: 'usr_0002', courseId: 'course-2', lessonId: 'les-4', daysAgo: 2 },
      { userId: 'usr_0002', courseId: 'course-3', lessonId: 'les-6', daysAgo: 3 },
      { userId: 'usr_0002', courseId: 'course-4', lessonId: 'les-8', daysAgo: 4 },
      // usr_admin_default
      { userId: 'usr_admin_default', courseId: 'course-1', lessonId: 'les-1', daysAgo: 2 },
      { userId: 'usr_admin_default', courseId: 'course-2', lessonId: 'les-4', daysAgo: 3 }
    ];

    const now = Date.now();
    this.data.completedLessons = sampleData.map((item, idx) => ({
      id: `cpl_seed_${idx + 1}`,
      userId: item.userId,
      courseId: item.courseId,
      lessonId: item.lessonId,
      completedAt: new Date(now - item.daysAgo * 86400000).toISOString()
    }));

    this.persist();
  }

  // --- Seed Data Initializer ---
  private getSeedData(): DatabaseSchema {
    const defaultUser: User = {
      id: 'usr_default_student',
      email: 'sinhvien@ownedu.vn',
      fullName: 'Nguyễn Văn Nam (Học viên/Giảng viên)',
      role: 'USER',
      tier: 'PRO'
    };

    const adminUser: User = {
      id: 'usr_admin_default',
      email: 'admin@ownedu.edu.vn',
      fullName: 'Quản Trị Viên (Admin)',
      role: 'ADMIN',
      tier: 'PRO'
    };

    const doc1Id = 'doc_microservices_sample';
    const sampleDoc: DocumentItem = {
      id: doc1Id,
      userId: defaultUser.id,
      filename: 'Kien_truc_Phan_mem_Microservices.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 2458000,
      storagePath: '/uploads/Kien_truc_Phan_mem_Microservices.pdf',
      pageCount: 38,
      status: 'PARSED',
      totalWords: 8420,
      chunksCount: 6,
      extractedOutline: [
        { title: 'Chương 1: Tổng quan Kiến trúc Microservices & Monolith', page: 1 },
        { title: 'Chương 2: Cơ chế Giao tiếp & Message Queue (RabbitMQ)', page: 12 },
        { title: 'Chương 3: Quản trị Dữ liệu Phân tán & Saga Pattern', page: 24 },
        { title: 'Chương 4: Đánh giá & Giám sát Hệ thống Phân tán', page: 32 }
      ],
      createdAt: '2026-09-18T10:00:00.000Z',
      updatedAt: '2026-09-18T10:05:00.000Z'
    };

    const chunks: DocumentChunk[] = [
      {
        id: 'chunk_1',
        documentId: doc1Id,
        chunkIndex: 0,
        pageNumber: 1,
        chapterTitle: 'Chương 1: Khái niệm Cốt lõi',
        contentText: 'Kiến trúc Microservices là một mô hình phát triển phần mềm trong đó ứng dụng được cấu thành từ nhiều dịch vụ nhỏ, độc lập, có thể triển khai riêng rẽ và tự quản lý dữ liệu. Mỗi dịch vụ tập trung vào một nghiệp vụ chuyên biệt (Domain-Driven Design).',
        tokenEstimate: 280,
        createdAt: '2026-09-18T10:02:00.000Z'
      },
      {
        id: 'chunk_2',
        documentId: doc1Id,
        chunkIndex: 1,
        pageNumber: 12,
        chapterTitle: 'Chương 2: Giao tiếp Bất đồng bộ qua Message Queue',
        contentText: 'Trong môi trường phân tán, gọi đồng bộ HTTP/REST API dễ dẫn đến nghẽn chuỗi (cascading failure). Việc sử dụng Message Queue như RabbitMQ hoặc Kafka giúp phân tách (decoupling) dịch vụ, cân bằng tải (load leveling) và tăng tính chịu lỗi.',
        tokenEstimate: 310,
        createdAt: '2026-09-18T10:03:00.000Z'
      },
      {
        id: 'chunk_3',
        documentId: doc1Id,
        chunkIndex: 2,
        pageNumber: 24,
        chapterTitle: 'Chương 3: Quản trị Giao dịch Phân tán với Saga Pattern',
        contentText: 'Do quy tắc Database-per-Service, ta không thể sử dụng Two-Phase Commit (2PC) vì gây khóa tài nguyên diện rộng và độ trễ cao. Saga Pattern chia giao dịch lớn thành chuỗi các local transactions, mỗi bước thành công sẽ kích hoạt bước kế tiếp. Khi xảy ra lỗi, Saga kích hoạt các hành động bù trừ (compensating transactions) để hoàn tác trạng thái.',
        tokenEstimate: 340,
        createdAt: '2026-09-18T10:04:00.000Z'
      }
    ];

    const examId = 'exam_microservices_midterm';
    const sampleExam: Exam = {
      id: examId,
      documentId: doc1Id,
      creatorUserId: defaultUser.id,
      title: 'Kiểm tra Giữa kỳ - Kiến trúc Phần mềm Microservices',
      description: 'Đề kiểm tra trắc nghiệm kết hợp tự luận đánh giá năng lực theo 4 mức độ nhận thức Bloom Taxonomy.',
      suggestedDurationMinutes: 45,
      totalScore: 10.0,
      status: 'PUBLISHED',
      accessCode: 'MICRO-2026',
      config: {
        mcqCount: 4,
        essayCount: 1,
        bloomLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'],
        targetAudience: 'UNIVERSITY',
        language: 'vi',
        timeLimitMinutes: 45
      },
      questions: [
        {
          id: 'q_01',
          examId,
          orderIndex: 1,
          type: 'MCQ',
          bloomLevel: 'REMEMBER',
          content: 'Đặc trưng nào sau đây KHÔNG PHẢI là nguyên lý cốt lõi của kiến trúc Microservices?',
          points: 1.5,
          options: [
            { key: 'A', content: 'Mỗi dịch vụ sở hữu cơ sở dữ liệu độc lập (Database per Service)' },
            { key: 'B', content: 'Triển khai tất cả dịch vụ trong cùng một tệp nén WAR/JAR duy nhất' },
            { key: 'C', content: 'Có khả năng co giãn (scale) độc lập từng dịch vụ' },
            { key: 'D', content: 'Giao tiếp qua mạng thông qua API hoặc Event Bus' }
          ],
          correctAnswer: 'B',
          explanation: 'Việc gom toàn bộ code vào một tệp nén đơn khối là đặc điểm của Monolithic Architecture, trái ngược với tính chất độc lập của Microservices.'
        },
        {
          id: 'q_02',
          examId,
          orderIndex: 2,
          type: 'MCQ',
          bloomLevel: 'UNDERSTAND',
          content: 'Trong kiến trúc phân tán, cơ chế nào giải quyết tốt nhất bài toán giao dịch đa dịch vụ mà không gây khóa dữ liệu tập trung (Distributed Lock)?',
          points: 2.0,
          options: [
            { key: 'A', content: 'Giao thức Two-Phase Commit (2PC)' },
            { key: 'B', content: 'Saga Pattern (Choreography hoặc Orchestration)' },
            { key: 'C', content: 'Shared Database Pattern' },
            { key: 'D', content: 'Distributed Mutex Lock' }
          ],
          correctAnswer: 'B',
          explanation: 'Saga Pattern chia giao dịch thành chuỗi các local transactions kèm compensating actions, phù hợp nhất với hệ thống phân tán vì bảo đảm tính nhất quán sau cùng (Eventual Consistency) mà không khóa DB.'
        },
        {
          id: 'q_03',
          examId,
          orderIndex: 3,
          type: 'MCQ',
          bloomLevel: 'APPLY',
          content: 'Khi một hệ thống thương mại điện tử gặp tình trạng traffic tăng vọt vào ngày Black Friday, giải pháp kiến trúc nào giúp bảo vệ Document Service & AI Worker không bị quá tải HTTP?',
          points: 2.0,
          options: [
            { key: 'A', content: 'Tăng timeout của HTTP Request từ 30s lên 5 phút' },
            { key: 'B', content: 'Chuyển toàn bộ cuộc gọi sang giao thức gRPC đồng bộ' },
            { key: 'C', content: 'Đưa các tác vụ nặng vào Message Queue để xử lý bất đồng bộ theo cơ chế Backpressure' },
            { key: 'D', content: 'Khởi động lại toàn bộ máy chủ mỗi 15 phút' }
          ],
          correctAnswer: 'C',
          explanation: 'Message Queue cho phép áp dụng kỹ thuật Rate Limiting / Load Leveling, worker tiêu thụ tin nhắn theo năng lực xử lý (Backpressure), ngăn ngừa sập dịch vụ.'
        },
        {
          id: 'q_04',
          examId,
          orderIndex: 4,
          type: 'MCQ',
          bloomLevel: 'ANALYZE',
          content: 'Điều gì xảy ra nếu một bước trong chuỗi Saga Choreography bị thất bại giữa chừng?',
          points: 2.0,
          options: [
            { key: 'A', content: 'Cơ sở dữ liệu tự động rollback bằng lệnh ROLLBACK SQL của máy chủ chính' },
            { key: 'B', content: 'Hệ thống phát sinh sự kiện thất bại để các dịch vụ trước đó thực hiện giao dịch bù trừ (Compensating Transactions)' },
            { key: 'C', content: 'Hệ thống dừng hoạt động và yêu cầu can thiệp thủ công ngay lập tức' },
            { key: 'D', content: 'Bỏ qua bước lỗi và tiếp tục các bước còn lại' }
          ],
          correctAnswer: 'B',
          explanation: 'Saga duy trì tính nhất quán bằng cách phát sự kiện lỗi để kích hoạt các hàm bồi hoàn (Compensating transactions) đã chuẩn bị sẵn theo thứ tự đảo ngược.'
        },
        {
          id: 'q_05',
          examId,
          orderIndex: 5,
          type: 'ESSAY',
          bloomLevel: 'ANALYZE',
          content: 'Hãy phân tích ưu và nhược điểm của việc tách riêng Document Service và AI Worker Service qua Message Queue thay vì gọi đồng bộ qua REST API. Đưa ra ví dụ minh họa gắn với bài toán OwnEdu.',
          points: 2.5,
          benchmarkAnswer: 'Ưu điểm: Tách riêng qua Message Queue giúp giảm tải API Gateway, loại bỏ rủi ro HTTP Timeout khi LLM xử lý lâu (30-60s), cho phép scale AI Worker theo số lượng GPU độc lập. Nhược điểm: Tăng độ phức tạp kiến trúc và phải xây dựng kênh báo tiến độ bất đồng bộ (SSE/WebSocket). Ví dụ: Khi người dùng tải tài liệu 50 trang, Document Service bóc tách xong đẩy job vào queue, AI Worker nhận job xử lý ngầm và gửi tiến độ % qua SSE.',
          rubric: [
            {
              criteria: 'Phân tích được ít nhất 2 ưu điểm cốt lõi (chống nghẽn HTTP timeout, scale độc lập theo tải GPU)',
              maxPoints: 1.0
            },
            {
              criteria: 'Chỉ ra được ít nhất 1 nhược điểm thực tế (độ phức tạp vận hành, cần cơ chế SSE để báo kết quả)',
              maxPoints: 0.5
            },
            {
              criteria: 'Lấy được ví dụ minh họa thực tế gắn liền với luồng xử lý tài liệu của OwnEdu',
              maxPoints: 1.0
            }
          ]
        }
      ],
      createdAt: '2026-09-18T10:10:00.000Z',
      updatedAt: '2026-09-18T10:15:00.000Z'
    };

    const attemptId = 'att_sample_student_01';
    const sampleAttempt: ExamAttempt = {
      id: attemptId,
      examId,
      userId: defaultUser.id,
      startedAt: '2026-09-18T14:00:00.000Z',
      expiresAt: '2026-09-18T14:45:00.000Z',
      submittedAt: '2026-09-18T14:35:12.000Z',
      status: 'GRADED',
      submissionType: 'MANUAL',
      answers: {
        'q_01': {
          type: 'MCQ',
          selectedOption: 'B',
          savedAt: '2026-09-18T14:05:10.000Z',
          isFlagged: false
        },
        'q_02': {
          type: 'MCQ',
          selectedOption: 'B',
          savedAt: '2026-09-18T14:12:30.000Z',
          isFlagged: false
        },
        'q_03': {
          type: 'MCQ',
          selectedOption: 'C',
          savedAt: '2026-09-18T14:18:45.000Z',
          isFlagged: false
        },
        'q_04': {
          type: 'MCQ',
          selectedOption: 'A', // Chọn sai để thấy được phân tích lỗ hổng kiến thức
          savedAt: '2026-09-18T14:22:10.000Z',
          isFlagged: true
        },
        'q_05': {
          type: 'ESSAY',
          essayText: 'Việc tách riêng Document Service và AI Worker qua Message Queue mang lại ưu điểm vượt trội: chống nghẽn đường truyền HTTP do LLM sinh bài mất 30-45s, đồng thời có thể co giãn số lượng worker tùy theo card đồ họa GPU. Nhược điểm là phát sinh độ trễ bất đồng bộ và hệ thống cần thêm kênh SSE để báo % về cho giao diện web. Ví dụ: khi học sinh gửi lệnh sinh đề 15 câu trắc nghiệm, hệ thống xếp job vào hàng đợi RabbitMQ thay vì bắt trình duyệt chờ đơ trang.',
          wordCount: 104,
          savedAt: '2026-09-18T14:34:00.000Z',
          isFlagged: false
        }
      },
      createdAt: '2026-09-18T14:00:00.000Z',
      updatedAt: '2026-09-18T14:35:12.000Z'
    };

    const sampleGradeReport: GradeReport = {
      id: 'rep_sample_01',
      attemptId,
      examId,
      userId: defaultUser.id,
      mcqScore: 5.5,
      essayScore: 2.5,
      finalScore: 8.0,
      aiScore: 8.0,
      status: 'FINALIZED',
      correctMcqCount: 3,
      totalMcqCount: 4,
      completionTimeSeconds: 2112, // ~35 minutes
      mcqDetails: [
        {
          questionId: 'q_01',
          selectedOption: 'B',
          correctAnswer: 'B',
          isCorrect: true,
          points: 1.5,
          explanation: 'Đúng. Việc gom vào WAR/JAR là bản chất của kiến trúc Monolith.'
        },
        {
          questionId: 'q_02',
          selectedOption: 'B',
          correctAnswer: 'B',
          isCorrect: true,
          points: 2.0,
          explanation: 'Đúng. Saga Pattern chia nhỏ thành local transactions và duy trì Eventual Consistency.'
        },
        {
          questionId: 'q_03',
          selectedOption: 'C',
          correctAnswer: 'C',
          isCorrect: true,
          points: 2.0,
          explanation: 'Đúng. Message Queue áp dụng Backpressure ngăn ngừa sập hệ thống.'
        },
        {
          questionId: 'q_04',
          selectedOption: 'A',
          correctAnswer: 'B',
          isCorrect: false,
          points: 0.0,
          explanation: 'Sai. Trong Saga không thể dùng ROLLBACK SQL tập trung mà phải dùng Compensating Transactions.'
        }
      ],
      rubricEvaluations: [
        {
          questionId: 'q_05',
          earnedPoints: 2.5,
          maxPoints: 2.5,
          generalComment: 'Bài viết lập luận rất sắc sảo, nêu bật được bản chất chống nghẽn HTTP và khả năng co giãn độc lập của AI Worker.',
          rubricEvaluations: [
            {
              criteria: 'Phân tích được ít nhất 2 ưu điểm cốt lõi (chống nghẽn HTTP timeout, scale độc lập theo tải GPU)',
              earnedPoints: 1.0,
              maxPoints: 1.0,
              feedback: 'Rất tốt. Đã phân tích đúng khía cạnh tránh treo kết nối HTTP và scale GPU.'
            },
            {
              criteria: 'Chỉ ra được ít nhất 1 nhược điểm thực tế (độ phức tạp vận hành, cần cơ chế SSE để báo kết quả)',
              earnedPoints: 0.5,
              maxPoints: 0.5,
              feedback: 'Chính xác. Đã chỉ rõ thách thức về độ trễ bất đồng bộ và cần kênh SSE.'
            },
            {
              criteria: 'Lấy được ví dụ minh họa thực tế gắn liền với luồng xử lý tài liệu của OwnEdu',
              earnedPoints: 1.0,
              maxPoints: 1.0,
              feedback: 'Ví dụ sinh đề 15 câu qua RabbitMQ rất thực tế và gắn sát bối cảnh OwnEdu.'
            }
          ]
        }
      ],
      bloomAnalytics: {
        REMEMBER: { correctOrEarned: 1.5, total: 1.5, percentage: 100 },
        UNDERSTAND: { correctOrEarned: 2.0, total: 2.0, percentage: 100 },
        APPLY: { correctOrEarned: 2.0, total: 2.0, percentage: 100 },
        ANALYZE: { correctOrEarned: 2.5, total: 4.5, percentage: 55.6 }
      },
      knowledgeGaps: [
        {
          topic: 'Cơ chế Phục hồi Lỗi trong Saga Pattern (Compensating Transactions)',
          issue: 'Bạn nhầm lẫn việc rollback cơ sở dữ liệu phân tán với lệnh ROLLBACK của SQL truyền thống ở Câu 04.',
          recommendedStudy: 'Đọc lại Chương 3 (Trang 24-28 trong tài liệu: Kien_truc_Phan_mem_Microservices.pdf)'
        }
      ],
      auditLogs: [],
      createdAt: '2026-09-18T14:35:15.000Z',
      updatedAt: '2026-09-18T14:35:15.000Z'
    };

    return {
      users: [defaultUser, adminUser],
      documents: [],
      documentChunks: [],
      exams: [],
      examAttempts: [],
      gradeReports: [],
      services: JSON.parse(JSON.stringify(DEFAULT_SYSTEM_SERVICES)),
      paymentOrders: []
    };
  }
}

export const db = new HybridStore();
