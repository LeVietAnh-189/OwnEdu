export interface SePayConfig {
  bankName: string;
  accountNumber: string;
  accountName: string;
  apiKey: string;
}

export interface SePayWebhookPayload {
  id?: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  code?: string | null;
  content?: string;
  transferType?: 'in' | 'out' | string;
  transferAmount?: number;
  accumulated?: number;
  subAccount?: string | null;
  referenceCode?: string;
  description?: string;
}

export class SePayService {
  private config: SePayConfig;

  constructor() {
    this.config = {
      bankName: process.env.SEPAY_BANK_NAME || 'MBBank',
      accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '0987654321',
      accountName: process.env.SEPAY_ACCOUNT_NAME || 'OWNEDU ACADEMY',
      apiKey: process.env.SEPAY_API_KEY || ''
    };
  }

  public getConfig(): SePayConfig {
    return this.config;
  }

  public isConfigured(): boolean {
    return Boolean(
      this.config.accountNumber &&
      this.config.bankName &&
      this.config.accountNumber !== '0987654321'
    );
  }

  /**
   * Sinh URL ảnh VietQR động chuẩn SePay
   */
  public generateQrUrl(params: {
    amount: number;
    paymentCode: string; // e.g. OE123456
  }): string {
    const { bankName, accountNumber, accountName } = this.config;
    const cleanCode = params.paymentCode.trim();

    // Link SePay QR chuẩn
    return `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${encodeURIComponent(bankName)}&amount=${params.amount}&des=${encodeURIComponent(cleanCode)}&template=compact`;
  }

  /**
   * Xác thực Webhook từ SePay (nếu cấu hình API Key)
   */
  public verifyWebhookAuthorization(authHeader?: string): boolean {
    if (!this.config.apiKey) {
      // Nếu chưa đặt API_KEY trong .env thì cho phép qua để test
      return true;
    }
    if (!authHeader) return false;

    // SePay gửi header: "Authorization: Apikey <YOUR_SEPAY_API_KEY>"
    const cleanHeader = authHeader.replace(/^Apikey\s+/i, '').replace(/^Bearer\s+/i, '').trim();
    return cleanHeader === this.config.apiKey.trim();
  }

  /**
   * Bóc tách mã đơn hàng từ nội dung chuyển khoản của SePay
   * Ví dụ: "MBVCB.12345 OE892014 Chuyen khoan Pro VIP" -> "OE892014"
   */
  public extractPaymentCode(text?: string): string | null {
    if (!text) return null;
    const match = text.match(/(OE\d{5,})/i);
    return match ? match[1].toUpperCase() : null;
  }

  /**
   * Tự động truy vấn SePay API kiểm tra xem giao dịch đã đến hay chưa (Fallback cho Webhook)
   */
  public async checkTransactionFromSePay(paymentCode: string, expectedAmount: number): Promise<any | null> {
    if (!this.config.apiKey) return null;
    try {
      const res = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=30', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json() as any;
      if (data && data.transactions && Array.isArray(data.transactions)) {
        const found = data.transactions.find((tx: any) => {
          const content = (tx.transaction_content || tx.content || '').toUpperCase();
          const amountIn = Number(tx.amount_in || tx.transferAmount || 0);
          return content.includes(paymentCode.toUpperCase()) && amountIn >= expectedAmount;
        });
        return found || null;
      }
    } catch (err) {
      console.error('[SePayService] Error checking transaction from SePay API:', err);
    }
    return null;
  }
}

export const sepayService = new SePayService();
