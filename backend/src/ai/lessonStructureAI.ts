import { db } from '../db/hybridStore.js';

export interface StructureLessonResult {
  title: string;
  markdown: string;
  stats: {
    totalHeadings: number;
    totalParagraphs: number;
    totalCallouts: number;
    totalTables: number;
    totalCodeBlocks: number;
    totalQuizzes?: number;
  };
  usedAI: boolean;
  provider?: string;
  model?: string;
}

/**
 * Trích xuất và dọn dẹp nội dung HTML thô trước khi chuyển tới AI LLM để tiết kiệm token và tăng độ chính xác
 */
function cleanHtmlForPrompt(rawHtml: string): string {
  if (!rawHtml) return '';

  // 1. Loại bỏ các thẻ không liên quan (script, style, svg đường dẫn dài, base64 ảnh)
  let cleaned = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/data:image\/[^;]+;base64,[^"'\s]+/gi, '[IMAGE]')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<canvas\b[^>]*>[\s\S]*?<\/canvas>/gi, '')
    .replace(/<(?:div|section)\b[^>]*(?:roadmap|visualize|drag-drop|learning-path|dnd|animation|simulator|simulation)[^>]*>[\s\S]*?<\/(?:div|section)>/gi, '');

  // 2. Giới hạn độ dài an toàn cho LLM context (khoảng 60,000 ký tự)
  if (cleaned.length > 60000) {
    cleaned = cleaned.slice(0, 60000) + '\n...[Nội dung còn tiếp]';
  }

  return cleaned;
}

/**
 * Gọi AI (Gemini hoặc OpenAI) để quan sát và phân tách các khối bài giảng chuẩn OwnEdu
 */
export async function structureLessonWithAI(
  htmlContent: string,
  options: { lessonTitle?: string } = {}
): Promise<StructureLessonResult> {
  const settings = db.getSettings();
  const geminiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;
  const openaiKey = process.env.OPENAI_API_KEY || settings.openaiApiKey;
  const activeModel = settings.activeModel || 'gemini-3.5-flash';

  const cleanedHtml = cleanHtmlForPrompt(htmlContent);

  const systemPrompt = `Bạn là Trợ lý AI Chuyên gia Sư phạm & Kiến trúc nội dung của nền tảng giáo dục OwnEdu.
Nhiệm vụ của bạn là quan sát tài liệu HTML hoặc văn bản bài học được cung cấp, nhận diện cấu trúc thị giác và phân tách thành các KHỐI BÀI GIẢNG CHUẨN CỦA OWNEDU (OwnEdu Visual Blocks).

QUY TẮC NHẬN DIỆN VÀ PHÂN TÁCH KHỐI BẮT BUỘC (TUÂN THỦ 100%):
1. TIÊU ĐỀ ĐỀ MỤC (Heading Block):
   - Các chỗ chữ to, in đậm, đề mục chương mục, thẻ h1, h2, h3 -> Chuyển thành Tiêu đề Markdown cấp 2:
     ## Tên tiêu đề mục
   - Tuyệt đối không nhét văn bản giải thích vào cùng dòng tiêu đề.

2. ĐOẠN VĂN BẢN (Paragraph Block):
   - Chữ thường, văn bản giải thích mặc định -> Chuyển thành từng đoạn văn bản rõ ràng.
   - Giữa các đoạn văn BẮT BUỘC phải có 1 dòng trống kép (\\n\\n) để hệ thống nhận diện thành các khối Đoạn văn độc lập.

3. KHỐI GHI CHÚ / HỘP NỔI BẬT (Callout Block):
   - Chữ đổi màu, có khung màu bao quanh, hộp highlight, ghi chú, cảnh báo, mẹo hay, bẫy cú pháp, bài tập -> Dùng cú pháp OwnEdu Callout đóng mở nghiêm ngặt:
     :::tip Mẹo hay:
     Nội dung mẹo ở đây...
     :::
     Hoặc :::warning Lưu ý quan trọng: ... :::
     Hoặc :::keypoint Điểm cốt lõi: ... :::
     Hoặc :::exercise Bài tập thực hành: ... :::
   - BẮT BUỘC mỗi khối Callout phải mở bằng ":::loại Tiêu đề" và đóng bằng ":::" trên một dòng riêng biệt.

4. KHỐI BẢNG (Table Block):
   - Nội dung bảng dữ liệu, so sánh cột -> Dùng bảng chuẩn Markdown:
     | Cột 1 | Cột 2 |
     | :--- | :--- |
     | Giá trị 1 | Giá trị 2 |

5. KHỐI MÃ NGUỒN CODE (Code Block):
   - CHỈ TẠO KHỐI CODE (\`\`\`sql ... \`\`\`) khi đó là MÃ NGUỒN LẬP TRÌNH THỰC TẾ (code có thể chạy được, code mẫu chuẩn tiếng Anh hoặc chỗ nhập code, ví dụ: SELECT id, name FROM users;).
   - CẢNH BÁO QUAN TRỌNG - TUYỆT ĐỐI KHÔNG NHẬN DIỆN NHẦM VỚI VĂN BẢN DIỄN GIẢI:
     Khi gặp các câu giải thích công thức cú pháp có chứa từ khóa code nhưng lại pha trộn từ ngữ tiếng Việt (Ví dụ: "SELECT những cột bạn muốn FROM bảng chứa chúng;", "UPDATE bảng SET cột = giá trị WHERE điều_kiện;", "SELECT … FROM sinh_vien;"):
     -> ĐÂY LÀ ĐOẠN VĂN BẢN (Paragraph Block) HOẶC TRÍCH DẪN (> ...), TUYỆT ĐỐI KHÔNG ĐƯỢC BIẾN NÓ THÀNH KHỐI CODE LẬP TRÌNH!
     -> Khối code trong OwnEdu là nơi học viên thực hành gõ code/chấm điểm, các câu cú pháp diễn giải tiếng Việt nếu cho vào khối code sẽ khiến hệ thống nhận nhầm thành bài tập code.

6. KHỐI CÂU HỎI TRẮC NGHIỆM (Quiz Block):
   - Khi gặp câu hỏi trắc nghiệm kiểm tra kiến thức (câu hỏi nhiều lựa chọn, radio buttons):
     BẮT BUỘC TRÍCH XUẤT ĐẦY ĐỦ NỘI DUNG CÂU HỎI (Ví dụ: "1. Bảng sinh_vien có 6 hàng. Câu SELECT COUNT(*), MIN(diem_tb), MAX(diem_tb) FROM sinh_vien; trả về bao nhiêu HÀNG kết quả?").
     TUYỆT ĐỐI KHÔNG ĐƯỢC chỉ lấy mỗi nhãn đề mục (như "Kiểm tra nhanh", "Khởi động") rồi bỏ mất nội dung câu hỏi!
     Nếu có tiêu đề phân đoạn (như "Kiểm tra nhanh", "Khởi động", "Kiểm tra kiến thức"), hãy đặt cạnh :::quiz:
     :::quiz Kiểm tra nhanh
     1. Bảng sinh_vien có 6 hàng. Câu SELECT COUNT(*), MIN(diem_tb), MAX(diem_tb) FROM sinh_vien; trả về bao nhiêu HÀNG kết quả?
     - [ ] 6 hàng, mỗi sinh viên một hàng
     - [ ] 3 hàng, mỗi hàm một hàng
     - [x] 1 hàng, gồm 3 cột
     - [ ] Báo lỗi vì không được đặt ba hàm trong cùng một SELECT
     > Lời giải thích chi tiết nếu có
     :::
     * LƯU Ý QUAN TRỌNG: Bỏ các ký tự tiền tố "A. ", "B. ", "C. ", "D. " ở đầu các phương án vì hệ thống OwnEdu tự động hiển thị nút tròn A/B/C/D.

7. LOẠI BỎ HOÀN TOÀN CÁC PHẦN VISUALIZE TRỰC QUAN & HOẠT HỌA MÔ PHỎNG (CRITICAL):
   - TUYỆT ĐỐI BỎ HOÀN TOÀN các thành phần trực quan hóa (visualize), hoạt họa mô phỏng mà OwnEdu không có:
     * "Lộ trình bài học", "Bản đồ hành trình" (chứa sơ đồ visualize, milestone map, interactive roadmap).
     * "Sơ đồ minh họa kiến thức" (kéo thả, sơ đồ động, canvas, SVG flow diagram, graph interactive nodes).
     * Các khối mô phỏng hoạt họa trực quan (animation, simulator, demo có nút "Bắt đầu" để chạy animation, ví dụ: 'COUNT(*) · COUNT(cột) · COUNT(DISTINCT): ba con số khác nhau', 'Hàm tổng hợp: nhiều hàng → một con số', 'SELECT: chọn đúng cột cần lấy', 'ORDER BY + LIMIT: 3 bạn trẻ nhất'...).
     * BỎ HOÀN TOÀN cả tiêu đề ####, cả code block và câu chữ của các widget hoạt họa này (như "Bấm 'Bắt đầu' để xem...", "Nhấn Start Practice để kết nối.").
     * Các bài tập tương tác ghép câu kéo thả chip ("Ghép câu SQL tổng kết cả bài", "Kéo chip vào chỗ trống, hoặc bấm chip rồi bấm chỗ trống...").
     * BỎ HOÀN TOÀN, KHÔNG clone và KHÔNG tạo bất kỳ khối nào cho các phần visualize/hoạt họa này.
   - Bỏ qua các thành phần web ngoại lai (thanh menu điều hướng trang, nút bài trước/tiếp theo, góp ý, toggle theme, footer, ads, sidebar, nút bấm vô nghĩa).

8. KHỐI THẺ FLASHCARD TƯƠNG TÁC (Flashcard Block):
   - Khi gặp mục 'Ôn nhanh bằng flashcard', thẻ ghi nhớ lật mặt (thẻ 3D có mặt trước và mặt sau) hoặc phần tóm tắt khái niệm/câu hỏi ôn tập nhanh:
     Dùng cú pháp khối Flashcard chuẩn OwnEdu:
     :::flashcard Ôn nhanh bằng flashcard
     Front: Câu hỏi hoặc khái niệm mặt trước
     Back: Câu trả lời hoặc giải thích chi tiết mặt sau
     ---
     Front: Câu hỏi thứ hai
     Back: Câu trả lời thứ hai
     :::
     * Gom tất cả các thẻ trong cùng một phần vào một khối :::flashcard duy nhất, ngăn cách giữa các thẻ bằng "---".

9. NGUYÊN TẮC BẢO TOÀN KIẾN THỨC:
   - 100% giữ nguyên vẹn kiến thức, thuật ngữ, câu lệnh và ví dụ từ tài liệu gốc.
   - TUYỆT ĐỐI KHÔNG BỊA ĐẶT THÊM KIẾN THỨC NGOÀI NGUỒN.

ĐẦU RA BẮT BUỘC:
Trả về duy nhất định dạng JSON thuần túy (không bọc trong \`\`\`json):
{
  "title": "Tên bài học ngắn gọn súc tích",
  "markdown": "Toàn bộ nội dung đã được phân tách thành các khối chuẩn xác như quy tắc trên"
}`;

  // 1. Thử gọi Google Gemini nếu có key
  if (geminiKey) {
    try {
      const candidateModels = [
        activeModel && activeModel !== 'offline-smart' ? activeModel : 'gemini-3.5-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-3.8-flash',
        'gemini-flash-latest'
      ];
      const uniqueModels = Array.from(new Set(candidateModels));

      for (const model of uniqueModels) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          let response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: systemPrompt },
                  { text: `NỘI DUNG TÀI LIỆU BÀI HỌC CẦN PHÂN TÁCH:\n---\n${cleanedHtml}\n---` }
                ]
              }],
              generationConfig: {
                response_mime_type: 'application/json',
                temperature: 0.1,
              }
            }),
            signal: AbortSignal.timeout(45000)
          });

          if (response.status === 503) {
            await new Promise(r => setTimeout(r, 1500));
            response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: systemPrompt },
                    { text: `NỘI DUNG TÀI LIỆU BÀI HỌC CẦN PHÂN TÁCH:\n---\n${cleanedHtml}\n---` }
                  ]
                }],
                generationConfig: {
                  response_mime_type: 'application/json',
                  temperature: 0.1,
                }
              }),
              signal: AbortSignal.timeout(45000)
            });
          }

          if (response.ok) {
            const data = (await response.json()) as any;
            const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const cleanText = textResponse.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
              const parsed = JSON.parse(cleanText);
              if (parsed.markdown) {
                const stats = countMarkdownBlocks(parsed.markdown);
                return {
                  title: parsed.title || options.lessonTitle || 'Bài giảng OwnEdu',
                  markdown: parsed.markdown.trim(),
                  stats,
                  usedAI: true,
                  provider: 'Google Gemini',
                  model
                };
              }
            }
          } else {
            const errText = await response.text();
            console.error(`[AI Structure] Gemini model ${model} returned error (${response.status}):`, errText);
          }
        } catch (mErr: any) {
          console.error(`[AI Structure] Gemini model ${model} failed:`, mErr.message);
        }
      }
    } catch (err: any) {
      console.warn('[AI Structure] Gemini call encountered error:', err.message);
    }
  }

  // 2. Thử gọi OpenAI nếu có key
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `NỘI DUNG TÀI LIỆU BÀI HỌC CẦN PHÂN TÁCH:\n---\n${cleanedHtml}\n---` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(45000)
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.markdown) {
            const stats = countMarkdownBlocks(parsed.markdown);
            return {
              title: parsed.title || options.lessonTitle || 'Bài giảng OwnEdu',
              markdown: parsed.markdown.trim(),
              stats,
              usedAI: true,
              provider: 'OpenAI',
              model: 'gpt-4o-mini'
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[AI Structure] OpenAI call encountered error:', err.message);
    }
  }

  // 3. Fallback bóc tách ngữ nghĩa thông minh nếu AI tạm thời quá tải hoặc chưa cấu hình
  console.log('[AI Structure] Falling back to smart semantic local extractor (zero failure guarantee)...');
  return fallbackLocalStructure(cleanedHtml, options.lessonTitle);
}

/**
 * Thuật toán bóc tách dự phòng khi AI bị quá tải tạm thời (503)
 */
function fallbackLocalStructure(html: string, fallbackTitle?: string): StructureLessonResult {
  const blocks: string[] = [];

  // 1. Loại bỏ các thẻ visualize, svg, roadmap
  let cleanText = html
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<canvas\b[^>]*>[\s\S]*?<\/canvas>/gi, '')
    .replace(/<(?:div|section)\b[^>]*(?:roadmap|visualize|drag-drop|learning-path|dnd|animation|simulator|simulation|interactive-panel)[^>]*>[\s\S]*?<\/(?:div|section)>/gi, '');

  // 2. Tìm câu hỏi trắc nghiệm quiz
  const quizRegex = /<(?:div|section)\b[^>]*(?:quiz|question)[^>]*>([\s\S]*?)<\/(?:div|section)>/gi;
  let qMatch;
  while ((qMatch = quizRegex.exec(cleanText)) !== null) {
    const rawQuiz = qMatch[1];

    // Trích xuất các phương án lựa chọn
    const opts: { text: string; isCorrect: boolean }[] = [];
    const optRegex = /<(?:button|li|div)\b([^>]*)>([\s\S]*?)<\/(?:button|li|div)>/gi;
    let oM;
    while ((oM = optRegex.exec(rawQuiz)) !== null) {
      const attrs = (oM[1] || '').toLowerCase();
      const rawInner = oM[2];
      const cleanInner = rawInner.replace(/<[^>]+>/g, '').trim();
      const isOptionLike =
        attrs.includes('option') ||
        attrs.includes('choice') ||
        attrs.includes('flex') ||
        attrs.includes('radio') ||
        /^[A-Da-d][.)\s-]/.test(cleanInner);

      if (
        cleanInner &&
        cleanInner.length < 250 &&
        isOptionLike &&
        !cleanInner.includes('Kiểm tra kết quả') &&
        !cleanInner.includes('Làm lại')
      ) {
        const isCorrect =
          attrs.includes('correct') ||
          attrs.includes('emerald') ||
          attrs.includes('selected') ||
          attrs.includes('true') ||
          attrs.includes('active');
        const cleanText = cleanInner.replace(/^[A-Da-d][.)\s-]\s*/, '').trim() || cleanInner;
        opts.push({ text: cleanText, isCorrect });
      }
    }

    // Trích xuất tiêu đề đề mục và nội dung câu hỏi
    const textElements: string[] = [];
    const textRegex = /<(?:h[1-6]|p|div)\b[^>]*>([\s\S]*?)<\/(?:h[1-6]|p|div)>/gi;
    let tM;
    while ((tM = textRegex.exec(rawQuiz)) !== null) {
      const tText = tM[1].replace(/<[^>]+>/g, '').trim();
      if (
        tText &&
        tText.length > 3 &&
        !tText.includes('Kiểm tra kết quả') &&
        !tText.includes('Làm lại') &&
        !opts.some(o => o.text === tText || tText.includes(o.text))
      ) {
        if (!textElements.includes(tText)) {
          textElements.push(tText);
        }
      }
    }

    let title = '';
    let question = '';

    if (textElements.length >= 2) {
      title = textElements[0];
      question = textElements.slice(1).join('\n\n');
    } else if (textElements.length === 1) {
      if (textElements[0].length < 40 && !textElements[0].includes('?')) {
        title = textElements[0];
        question = textElements[0];
      } else {
        question = textElements[0];
      }
    }

    if (opts.length > 0) {
      if (!opts.some(o => o.isCorrect)) {
        opts[0].isCorrect = true;
      }
      const titleStr = title && title !== question ? ` ${title}` : '';
      let qMd = `:::quiz${titleStr}\n${question || 'Câu hỏi trắc nghiệm:'}\n\n`;
      opts.forEach((o) => {
        qMd += `- [${o.isCorrect ? 'x' : ' '}] ${o.text}\n`;
      });
      qMd += `:::`;
      blocks.push(qMd);
    }
  }

  // 3. Tìm các khối code
  const codeRegex = /<pre\b[^>]*>[\s\S]*?<code(?:\s+class="[^"]*language-([^"\s]+)[^"]*")?[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>|<pre\b[^>]*>([\s\S]*?)<\/pre>/gi;
  let cMatch;
  while ((cMatch = codeRegex.exec(cleanText)) !== null) {
    const lang = cMatch[1] || 'sql';
    const rawC = cMatch[2] || cMatch[3] || '';
    const cleanCode = rawC.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
    if (cleanCode && cleanCode.length > 5) {
      const isVietnameseSyntaxExpl = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cleanCode) ||
                                    cleanCode.includes('những cột') || 
                                    cleanCode.includes('bảng chứa') ||
                                    cleanCode.includes('…');
      if (isVietnameseSyntaxExpl) {
        blocks.push(`> ${cleanCode}`);
      } else {
        blocks.push(`\`\`\`${lang}\n${cleanCode}\n\`\`\``);
      }
    }
  }

  // 4. Tìm các tiêu đề heading
  const headingRegex = /<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let hMatch;
  let detectedTitle = fallbackTitle || '';
  while ((hMatch = headingRegex.exec(cleanText)) !== null) {
    const text = hMatch[2].replace(/<[^>]+>/g, '').trim();
    const lowerH = text.toLowerCase();
    if (
      text &&
      !lowerH.includes('toggle theme') &&
      !lowerH.includes('lộ trình') &&
      !lowerH.includes('bản đồ hành trình') &&
      !lowerH.includes('ba con số khác nhau') &&
      !lowerH.includes('nhiều hàng → một con số') &&
      !lowerH.includes('chọn đúng cột cần lấy') &&
      !lowerH.includes('3 bạn trẻ nhất') &&
      !lowerH.includes('ghép câu') &&
      !lowerH.includes('kéo chip')
    ) {
      if (!detectedTitle) detectedTitle = text;
      blocks.push(`## ${text}`);
    }
  }

  // 5. Tìm các đoạn văn bản
  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(cleanText)) !== null) {
    const pText = pMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const lowerP = pText.toLowerCase();
    if (
      pText.length > 15 &&
      !lowerP.startsWith('toggle theme') &&
      !lowerP.includes('lộ trình bài học') &&
      !lowerP.includes('sơ đồ minh họa') &&
      !lowerP.includes('nhấn start practice') &&
      !lowerP.includes('bấm “bắt đầu”') &&
      !lowerP.includes('bấm "bắt đầu"') &&
      !lowerP.includes('kéo chip vào chỗ trống') &&
      !lowerP.includes('điền đủ sáu chỗ trống') &&
      !lowerP.includes('bấm vào chỗ đã điền')
    ) {
      blocks.push(pText);
    }
  }

  const markdown = blocks.join('\n\n').trim();
  const stats = countMarkdownBlocks(markdown);

  return {
    title: detectedTitle || fallbackTitle || 'Bài giảng OwnEdu',
    markdown,
    stats,
    usedAI: false,
    provider: 'Bộ Bóc Tách Ngữ Nghĩa Cục Bộ (Local Smart)',
    model: 'offline-smart'
  };
}

function countMarkdownBlocks(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  let totalHeadings = 0;
  let totalCodeBlocks = 0;
  let totalCallouts = 0;
  let totalTables = 0;
  let totalParagraphs = 0;
  let totalQuizzes = 0;

  let inCode = false;
  let inCallout = false;
  let inQuiz = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('```')) {
      if (!inCode) {
        totalCodeBlocks++;
        inCode = true;
      } else {
        inCode = false;
      }
      continue;
    }
    if (inCode) continue;

    if (line.startsWith(':::quiz')) {
      totalQuizzes++;
      inQuiz = true;
      continue;
    }
    if (inQuiz) {
      if (line.startsWith(':::')) {
        inQuiz = false;
      }
      continue;
    }

    if (line.startsWith(':::')) {
      if (!inCallout) {
        totalCallouts++;
        inCallout = true;
      } else {
        inCallout = false;
      }
      continue;
    }
    if (inCallout) continue;

    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        totalTables++;
        inTable = true;
      }
      continue;
    } else {
      inTable = false;
    }

    if (line.startsWith('#')) {
      totalHeadings++;
      continue;
    }

    if (line.length > 0) {
      totalParagraphs++;
    }
  }

  return {
    totalHeadings,
    totalParagraphs,
    totalCallouts,
    totalTables,
    totalCodeBlocks,
    totalQuizzes
  };
}
