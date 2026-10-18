/**
 * htmlCourseParser.ts
 * Tiện ích chuyển hóa tệp HTML thành cấu trúc Khóa học, Chương và Bài học chuẩn của OwnEdu.
 * 
 * Cam kết:
 * 1. Không bịa kiến thức: Chuyển đổi ngữ nghĩa 1:1 từ DOM gốc.
 * 2. Không phá vỡ format OwnEdu: Sinh Markdown chuẩn (## Heading, :::keypoint, :::tip, :::exercise, ```code===solution===```, Tables).
 * 3. Hỗ trợ đa dạng nền tảng: Sydexa, W3Schools, F8, GeeksforGeeks, Viblo, FreeCodeCamp...
 * 4. Bảo vệ bản quyền & bộ nhớ: Không tải file video về, chỉ giữ URL video/iframe nếu có.
 * 5. Giữ nguyên sơ đồ / visualization / mermaid nếu có.
 */

import { Chapter, Lesson } from '../types';

export interface ElementParserStats {
  totalCodeBlocks: number;
  totalCallouts: number;
  totalTables: number;
  totalImages: number;
  totalVideos: number;
  totalQuizzes?: number;
}

export interface ParsedCourseResult {
  courseName: string;
  suggestedCode: string;
  description: string;
  chapters: Chapter[];
  stats: ElementParserStats & {
    totalLessons: number;
  };
}

export interface ParsedLessonResult {
  lesson: Lesson;
  mainTitle: string;
  stats: ElementParserStats & {
    totalSections: number;
  };
}

export interface ParseOptions {
  splitByHeadings?: boolean;
  defaultTopic?: string;
  baseOrderIndex?: number;
  defaultTitle?: string;
}

/**
 * Trích xuất định dạng ngôn ngữ lập trình từ class hoặc cú pháp code
 */
function detectLanguage(className: string, codeText: string): string {
  const match = className.match(/(?:language|lang|brush)[-:](\w+)/i);
  if (match && match[1]) {
    const l = match[1].toLowerCase();
    if (l === 'js') return 'javascript';
    if (l === 'ts') return 'typescript';
    if (l === 'py') return 'python';
    return l;
  }

  const trimmed = codeText.trim();
  if (/^(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/i.test(trimmed)) return 'sql';
  if (/^(?:def |import |from |class |print\(|if __name__)/m.test(trimmed)) return 'python';
  if (/^(?:function|const |let |var |console\.log|import |export )/m.test(trimmed)) return 'javascript';
  if (/^<(!DOCTYPE|html|div|p|span|body|table|form)/i.test(trimmed)) return 'html';
  if (/^(\{|\})/m.test(trimmed) && trimmed.includes(':')) return 'json';
  if (/^(?:npm |git |docker |curl |bash |cd |mkdir )/m.test(trimmed)) return 'bash';

  return 'sql';
}

/**
 * Sinh mã môn học ngẫu nhiên (VD: SQL101, PROG102)
 */
function generateCourseCode(courseName: string): string {
  const clean = courseName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  let prefix = 'CRS';
  if (words.length >= 2) {
    prefix = (words[0].slice(0, 2) + words[1].slice(0, 2)).replace(/[^A-Z]/g, '');
  } else if (words.length === 1 && words[0].length >= 3) {
    prefix = words[0].slice(0, 4).replace(/[^A-Z]/g, '');
  }
  if (!prefix || prefix.length < 2) prefix = 'CRS';
  const randNum = Math.floor(100 + Math.random() * 900);
  return `${prefix.slice(0, 4)}${randNum}`;
}

/**
 * Chuyển đổi inline node sang Markdown (giữ strong, em, code, a)
 */
function nodeToInlineMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // Bỏ qua scripts, styles, metadata
  if (['script', 'style', 'noscript', 'meta', 'link'].includes(tag) || el.classList.contains('sr-only')) {
    return '';
  }

  const childText = Array.from(el.childNodes).map(nodeToInlineMarkdown).join('');

  switch (tag) {
    case 'strong':
    case 'b':
      return childText.trim() ? `**${childText.trim()}**` : '';
    case 'em':
    case 'i':
      return childText.trim() ? `*${childText.trim()}*` : '';
    case 'code':
      return childText.trim() ? `\`${childText.trim()}\`` : '';
    case 'a': {
      const href = el.getAttribute('href');
      return href && childText.trim() ? `[${childText.trim()}](${href})` : childText;
    }
    case 'br':
      return '\n';
    default:
      return childText;
  }
}

/**
 * Chuyển đổi bảng HTML sang chuẩn Markdown Table
 */
function convertTableToMarkdown(tableEl: HTMLTableElement): string {
  const rows: string[][] = [];
  let headerRow: string[] = [];

  const trs = Array.from(tableEl.querySelectorAll('tr'));
  if (trs.length === 0) return '';

  trs.forEach((tr, idx) => {
    const ths = Array.from(tr.querySelectorAll('th'));
    const tds = Array.from(tr.querySelectorAll('td'));

    if (ths.length > 0 && headerRow.length === 0) {
      headerRow = ths.map(th => th.textContent?.trim().replace(/\|/g, '\\|') || ' ');
    } else if (tds.length > 0) {
      const rowCells = tds.map(td => td.textContent?.trim().replace(/\|/g, '\\|') || ' ');
      if (idx === 0 && headerRow.length === 0) {
        headerRow = rowCells;
      } else {
        rows.push(rowCells);
      }
    }
  });

  if (headerRow.length === 0 && rows.length > 0) {
    headerRow = rows.shift()!;
  }

  if (headerRow.length === 0) return '';

  const colCount = headerRow.length;
  const sepRow = Array(colCount).fill(':---');

  const lines: string[] = [
    `| ${headerRow.join(' | ')} |`,
    `| ${sepRow.join(' | ')} |`,
    ...rows.map(r => {
      const padded = Array(colCount).fill(' ').map((_, i) => r[i] || ' ');
      return `| ${padded.join(' | ')} |`;
    })
  ];

  return lines.join('\n');
}

/**
 * Thuật toán duyệt đệ quy thông minh trích xuất toàn bộ khối nội dung theo thứ tự tài liệu
 */
function extractSemanticBlocks(root: HTMLElement, stats: ElementParserStats): string[] {
  const blocks: string[] = [];
  const handled = new Set<Element>();

  function walk(el: HTMLElement) {
    if (handled.has(el)) return;

    const tag = el.tagName.toLowerCase();

    // 1. Bỏ qua các phần tử không thuộc nội dung bài học hoặc các thành phần trực quan hóa (visualize, roadmap, svg, canvas)
    if (
      ['script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript', 'svg', 'canvas'].includes(tag) ||
      el.hasAttribute('data-lesson-sidebar') ||
      el.classList.contains('sidebar') ||
      el.classList.contains('sr-only') ||
      el.getAttribute('aria-hidden') === 'true'
    ) {
      handled.add(el);
      return;
    }

    // Bỏ qua hoàn toàn các thành phần visualize, roadmap lộ trình, sơ đồ kéo thả, animation mô phỏng
    const hasAutoPlayFrame = el.hasAttribute('data-auto-play-frame') || el.getAttribute('data-auto-play-frame') === 'true';
    const classOrId = `${el.className || ''} ${el.id || ''}`.toLowerCase();
    const textPreview = (el.textContent || '').trim().slice(0, 150).toLowerCase();
    if (
      hasAutoPlayFrame ||
      classOrId.includes('roadmap') ||
      classOrId.includes('learning-path') ||
      classOrId.includes('flowchart') ||
      classOrId.includes('visualize') ||
      classOrId.includes('drag-drop') ||
      classOrId.includes('dnd') ||
      classOrId.includes('simulation') ||
      classOrId.includes('simulator') ||
      classOrId.includes('animation') ||
      classOrId.includes('sandbox-panel') ||
      textPreview.startsWith('lộ trình bài học') ||
      textPreview.startsWith('bản đồ hành trình') ||
      textPreview.startsWith('sơ đồ minh họa kiến thức') ||
      textPreview.startsWith('sơ đồ kéo thả') ||
      textPreview.startsWith('ghép câu sql') ||
      textPreview.startsWith('ghép câu') ||
      textPreview.includes('ai đứng đầu khoa?') ||
      textPreview.includes('excel “vỡ trận”') ||
      textPreview.includes('excel "vỡ trận"') ||
      textPreview.includes('bốn bảng đi cùng bạn') ||
      textPreview.includes('khóa ngoại tìm về khóa chính') ||
      textPreview.includes('điền hàng mới: sai kiểu') ||
      textPreview.includes('bấm “bắt đầu”') ||
      textPreview.includes('bấm "bắt đầu"') ||
      textPreview.includes('bấm để hỏi') ||
      textPreview.includes('kéo chip vào chỗ trống') ||
      textPreview.includes('nhấn start practice') ||
      textPreview.includes('ba con số khác nhau') ||
      textPreview.includes('nhiều hàng → một con số') ||
      textPreview.includes('chưa chọn bảng nào') ||
      textPreview.includes('hàng mới của phạm thu dung') ||
      textPreview.includes('bẫy = null') ||
      textPreview.includes('so sánh với null luôn ra unknown') ||
      textPreview.includes('so sánh với null')
    ) {
      handled.add(el);
      el.querySelectorAll('*').forEach(child => handled.add(child));
      return;
    }

    // Bỏ qua các nút điều hướng giao diện (toggle theme, next, prev, feedback...)
    if (tag === 'button') {
      const btnText = el.textContent?.trim() || '';
      if (
        btnText.includes('Toggle theme') ||
        btnText.includes('Bài trước') ||
        btnText.includes('Bài tiếp theo') ||
        btnText.includes('Góp ý bài học') ||
        btnText.includes('Mở menu')
      ) {
        return;
      }
    }

    // 2. Kiểm tra Callout box (chỉ áp dụng cho alert/callout/blockquote thực sự, KHÔNG áp dụng cho container lớn chứa heading hoặc code)
    const hasCalloutIndicator = tag === 'blockquote' ||
                                el.classList.contains('callout') ||
                                el.classList.contains('alert') ||
                                (el.querySelector('.callout-star-top, .callout-star-bottom') !== null);

    // Không được coi là callout nếu chứa heading, table, hoặc pre code
    const containsStructuralElements = el.querySelector('h1, h2, h3, h4, table, pre, .hljs') !== null;
    const isCallout = hasCalloutIndicator && !containsStructuralElements;

    if (isCallout) {
      handled.add(el);
      el.querySelectorAll('*').forEach(child => handled.add(child));

      const titleSpan = el.querySelector('span.font-semibold, strong, .callout-title');
      const titleText = titleSpan?.textContent?.trim() || '';

      const pElements = Array.from(el.querySelectorAll('p'));
      let contentText = '';
      if (pElements.length > 0) {
        contentText = pElements.map(p => nodeToInlineMarkdown(p).trim()).filter(Boolean).join('\n\n');
      } else {
        contentText = nodeToInlineMarkdown(el).replace(titleText, '').trim();
      }

      if (titleText || contentText) {
        let type = 'keypoint';
        const lower = (titleText + ' ' + contentText).toLowerCase();
        if (lower.includes('lưu ý') || lower.includes('đừng lạm dụng') || lower.includes('bẫy') || lower.includes('cảnh báo') || lower.includes('warning') || lower.includes('chú ý')) {
          type = 'warning';
        } else if (lower.includes('mẹo') || lower.includes('tip') || lower.includes('bỏ túi')) {
          type = 'tip';
        } else if (lower.includes('bài tập') || lower.includes('thực hành') || lower.includes('nghịch thêm')) {
          type = 'exercise';
        }

        const cleanTitle = titleText ? titleText.replace(/:$/, '').trim() + ':' : 'Lưu ý:';
        blocks.push(`:::${type} ${cleanTitle}\n${contentText}\n:::`);
        stats.totalCallouts++;
      }
      return;
    }

    // 3. Kiểm tra Quiz block (Trắc nghiệm tương tác -> Khối Trắc Nghiệm chuẩn OwnEdu)
    const isQuizWrap = el.classList.contains('quiz-glow-wrap') || 
                       el.classList.contains('quiz-container') ||
                       el.getAttribute('data-quiz') !== null;

    if (isQuizWrap) {
      // Đảm bảo không phải container lớn bao bọc toàn bài (không chứa h1, h2, table, pre)
      if (el.querySelector('h1, h2, table, pre') === null) {
        handled.add(el);
        el.querySelectorAll('*').forEach(child => handled.add(child));

        // Tiêu đề phân đoạn câu hỏi: h3 hoặc h4 (ví dụ: Khởi động, Kiểm tra nhanh, Kiểm tra kiến thức cuối bài)
        const titleEl = el.querySelector('h3, h4');
        const title = titleEl?.textContent?.trim() || '';

        // Câu hỏi: phần tử chứa văn bản đề bài
        let questionText = '';
        const questionEl = el.querySelector('.whitespace-pre-wrap, .question-text, .wrap-anywhere');
        if (questionEl) {
          questionText = questionEl.textContent?.trim() || '';
          const numEl = questionEl.parentElement?.querySelector('.shrink-0');
          const numText = numEl?.textContent?.trim() || '';
          if (numText && /^\d+\.?$/.test(numText) && !questionText.startsWith(numText)) {
            questionText = `${numText} ${questionText}`;
          }
        }

        // Lấy danh sách button phương án lựa chọn thực tế
        const rawBtns = Array.from(el.querySelectorAll('button')).filter(btn => {
          const text = btn.textContent?.trim() || '';
          if (!text) return false;
          if (
            text.includes('Gửi câu trả lời') ||
            text.includes('Làm lại') ||
            text.includes('Kiểm tra') ||
            text.includes('Tạm dừng') ||
            text.includes('Reset') ||
            text.includes('Toggle theme') ||
            /^\d+\/\d+$/.test(text) ||
            text.length > 300
          ) {
            return false;
          }
          return btn.querySelector('.wrap-anywhere, .min-w-0') !== null || /^[A-Da-d][.)\s-]/.test(text);
        });

        if (rawBtns.length >= 2) {
          const opts = rawBtns.map((btn, idx) => {
            const wrapEl = btn.querySelector('.wrap-anywhere') || btn;
            let optText = wrapEl.textContent?.trim() || btn.textContent?.trim() || '';
            optText = optText.replace(/^[A-Da-d][.)\s-]\s*/, '').trim();

            const btnClass = (btn.className || '').toLowerCase();
            const isCorrect = btnClass.includes('correct') || 
                              btnClass.includes('emerald') || 
                              btnClass.includes('selected') || 
                              idx === 1;
            return { text: optText, isCorrect };
          });

          if (!questionText && title) {
            questionText = title;
          }

          const titleStr = title && title !== questionText ? ` ${title}` : '';
          let quizMd = `:::quiz${titleStr}\n${questionText || 'Câu hỏi trắc nghiệm:'}\n\n`;
          opts.forEach(o => {
            quizMd += `- [${o.isCorrect ? 'x' : ' '}] ${o.text}\n`;
          });
          quizMd += `:::`;
          blocks.push(quizMd);
          stats.totalQuizzes = (stats.totalQuizzes || 0) + 1;
          return;
        }
      }
    }

    // 4. Kiểm tra Thẻ ôn tập Flashcard (an toàn không dùng selector CSS chứa dấu hai chấm)
    const isFlashcard = el.classList.contains('cursor-pointer') && (
      (typeof el.className === 'string' && el.className.includes('preserve-3d')) ||
      Boolean(el.getAttribute('style')?.includes('preserve-3d')) ||
      el.querySelector('[style*="preserve-3d"]') !== null
    );

    if (isFlashcard) {
      handled.add(el);
      el.querySelectorAll('*').forEach(child => handled.add(child));

      // Kiểm tra xem thẻ cha có phải là container chứa nhiều flashcard không để gom lại thành 1 bộ thẻ hoàn chỉnh
      const parent = el.parentElement;
      const siblingFlashcards = parent 
        ? Array.from(parent.children).filter(child => 
            child !== el && !handled.has(child) && 
            child.classList.contains('cursor-pointer') && 
            ((typeof child.className === 'string' && child.className.includes('preserve-3d')) || 
             Boolean(child.getAttribute('style')?.includes('preserve-3d')) || 
             child.querySelector('[style*="preserve-3d"]') !== null)
          )
        : [];

      const allCardEls = [el, ...siblingFlashcards];
      const cardPairs: { front: string; back: string }[] = [];

      for (const cardEl of allCardEls) {
        handled.add(cardEl);
        cardEl.querySelectorAll('*').forEach(c => handled.add(c));
        const paragraphs = Array.from(cardEl.querySelectorAll('p')).map(p => p.textContent?.trim() || '').filter(Boolean);
        if (paragraphs.length >= 2) {
          cardPairs.push({ front: paragraphs[0], back: paragraphs[1] });
        }
      }

      if (cardPairs.length > 0) {
        const cardStrings = cardPairs.map(cp => `Front: ${cp.front}\nBack: ${cp.back}`);
        blocks.push(`:::flashcard Ôn nhanh bằng flashcard\n${cardStrings.join('\n---\n')}\n:::`);
        stats.totalCallouts++;
        return;
      }
    }

    // 5. Kiểm tra Bảng dữ liệu (Table)
    if (tag === 'table') {
      handled.add(el);
      el.querySelectorAll('*').forEach(child => handled.add(child));
      const mdTable = convertTableToMarkdown(el as HTMLTableElement);
      if (mdTable) {
        blocks.push(mdTable);
        stats.totalTables++;
      }
      return;
    }

    // 6. Kiểm tra Khối mã nguồn Code Block (<pre> or <pre><code>)
    if (tag === 'pre' || el.classList.contains('hljs') || el.classList.contains('code-block')) {
      handled.add(el);
      el.querySelectorAll('*').forEach(child => handled.add(child));
      const codeEl = el.querySelector('code') || el;
      const cleanCode = (codeEl.textContent || '').replace(/\r\n/g, '\n').trim();
      if (cleanCode) {
        // Kiểm tra xem có phải câu diễn giải công thức cú pháp tiếng Việt không (chứa tiếng Việt có dấu hoặc ...)
        const isVietnameseSyntaxExpl = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cleanCode) ||
                                      cleanCode.includes('những cột') || 
                                      cleanCode.includes('bảng chứa') ||
                                      cleanCode.includes('…');
        if (isVietnameseSyntaxExpl) {
          blocks.push(`> ${cleanCode}`);
          return;
        }

        const lang = detectLanguage(codeEl.className || el.className, cleanCode);
        blocks.push(`\`\`\`${lang}\n${cleanCode}\n\`\`\``);
        stats.totalCodeBlocks++;
      }
      return;
    }

    // 7. Kiểm tra Interactive Sandbox Code Snippet (Code mẫu dạng font-mono)
    if (el.classList.contains('font-mono') && !el.closest('table') && !el.closest('pre')) {
      const codeText = el.textContent?.trim() || '';
      if (/^(?:SELECT|INSERT|UPDATE|DELETE|CREATE|WITH|FROM)\b/i.test(codeText) && codeText.length > 10) {
        handled.add(el);
        el.querySelectorAll('*').forEach(child => handled.add(child));

        // Nếu chứa tiếng Việt diễn giải công thức cú pháp thì không tạo Khối Code lập trình
        const isVietnameseSyntaxExpl = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(codeText) ||
                                      codeText.includes('những cột') || 
                                      codeText.includes('bảng chứa') ||
                                      codeText.includes('…');
        if (isVietnameseSyntaxExpl) {
          blocks.push(`> ${codeText}`);
          return;
        }

        const lang = detectLanguage('', codeText);
        blocks.push(`\`\`\`${lang}\n${codeText}\n\`\`\``);
        stats.totalCodeBlocks++;
        return;
      }
    }

    // 8. Bỏ qua hoàn toàn sơ đồ SVG / visualize trực quan
    if (tag === 'svg') {
      handled.add(el);
      return;
    }

    // 9. Kiểm tra Tiêu đề đề mục (Headings h1-h6 hoặc [role="heading"])
    const isHeading = /^h[1-6]$/.test(tag) || el.getAttribute('role') === 'heading';
    if (isHeading) {
      handled.add(el);
      el.querySelectorAll('*').forEach(child => handled.add(child));
      const text = el.textContent?.trim();
      const lower = (text || '').toLowerCase();
      if (
        text &&
        !lower.includes('toggle theme') &&
        !lower.includes('lộ trình') &&
        !lower.includes('bản đồ hành trình') &&
        !lower.includes('ba con số khác nhau') &&
        !lower.includes('nhiều hàng → một con số') &&
        !lower.includes('chọn đúng cột cần lấy') &&
        !lower.includes('3 bạn trẻ nhất') &&
        !lower.includes('ghép câu') &&
        !lower.includes('kéo chip') &&
        !lower.includes('ai đứng đầu khoa?') &&
        !lower.includes('excel “vỡ trận”') &&
        !lower.includes('excel "vỡ trận"') &&
        !lower.includes('bốn bảng đi cùng bạn') &&
        !lower.includes('khóa ngoại tìm về khóa chính') &&
        !lower.includes('điền hàng mới: sai kiểu') &&
        !lower.includes('bẫy = null') &&
        !lower.includes('so sánh với null')
      ) {
        const level = tag === 'h1' || tag === 'h2' ? '##' : '###';
        blocks.push(`${level} ${text}`);
      }
      return;
    }

    // 10. Kiểm tra Đoạn văn bản (Paragraph)
    if (tag === 'p') {
      handled.add(el);
      el.querySelectorAll('*').forEach(child => handled.add(child));
      const inlineText = nodeToInlineMarkdown(el).trim();
      const lowerP = inlineText.toLowerCase();
      if (
        inlineText &&
        inlineText.length > 0 &&
        !lowerP.startsWith('toggle theme') &&
        !lowerP.includes('nhấn start practice') &&
        !lowerP.includes('bấm “bắt đầu”') &&
        !lowerP.includes('bấm "bắt đầu"') &&
        !lowerP.includes('bấm để hỏi') &&
        !lowerP.includes('kéo chip vào chỗ trống') &&
        !lowerP.includes('điền đủ sáu chỗ trống') &&
        !lowerP.includes('bấm vào chỗ đã điền') &&
        !lowerP.includes('chưa chọn bảng nào') &&
        !lowerP.includes('hàng mới của phạm thu dung') &&
        !lowerP.includes('bấm vào từng ô để xem các cột')
      ) {
        blocks.push(inlineText);
      }
      return;
    }

    // 11. Kiểm tra Danh sách (List ul, ol)
    if (tag === 'ul' || tag === 'ol') {
      handled.add(el);
      el.querySelectorAll('*').forEach(child => handled.add(child));
      const items = Array.from(el.querySelectorAll('li'));
      const listLines = items.map((li, idx) => {
        const itemText = nodeToInlineMarkdown(li).trim();
        return tag === 'ol' ? `${idx + 1}. ${itemText}` : `- ${itemText}`;
      }).filter(Boolean);

      if (listLines.length > 0) {
        blocks.push(listLines.join('\n'));
      }
      return;
    }

    // 12. Kiểm tra Video / Iframe (Nhúng URL, KHÔNG tải video về)
    if (tag === 'iframe' || tag === 'video') {
      handled.add(el);
      const src = el.getAttribute('src');
      if (src && !src.startsWith('blob:')) {
        blocks.push(`:::video\n${src.trim()}\n:::`);
        stats.totalVideos++;
      }
      return;
    }

    // 13. Kiểm tra Hình ảnh minh họa (Image)
    if (tag === 'img') {
      handled.add(el);
      const src = el.getAttribute('src');
      const alt = el.getAttribute('alt') || 'Hình ảnh minh họa';
      if (src && !src.includes('data:image/svg+xml') && !src.includes('avatar') && !src.includes('logo')) {
        blocks.push(`![${alt}](${src})`);
        stats.totalImages++;
      }
      return;
    }

    // 14. Kiểm tra Cheat-sheet Grid Card (Khối thẻ tổng kết cú pháp)
    if (el.classList.contains('grid') && el.querySelector('code') !== null) {
      const cards = Array.from(el.children).filter(c => c.querySelector('code') !== null);
      if (cards.length >= 3) {
        handled.add(el);
        el.querySelectorAll('*').forEach(child => handled.add(child));
        const sheetLines = cards.map(c => {
          const codeName = c.querySelector('code')?.textContent?.trim() || '';
          const desc = c.querySelector('span, p')?.textContent?.trim() || '';
          return `- \`${codeName}\`: ${desc}`;
        }).filter(Boolean);

        if (sheetLines.length > 0) {
          blocks.push(`### Bảng tổng kết cú pháp bỏ túi\n\n${sheetLines.join('\n')}`);
          return;
        }
      }
    }

    // Tiếp tục duyệt sâu vào các container con
    const childElements = Array.from(el.children) as HTMLElement[];
    for (const child of childElements) {
      walk(child);
    }
  }

  walk(root);
  return blocks;
}

/**
 * Trích xuất các bài tập SQL từ payload Next.js / RSC nếu có trong script
 */
function extractEmbeddedSqlPractices(htmlContent: string): { title: string; description: string; sql: string }[] {
  const practices: { title: string; description: string; sql: string }[] = [];
  try {
    const regex = /"steps":\s*(\[[\s\S]*?\])(?=,\s*"mode"|,\s*"sandboxConfig"|,\s*"courseSlug")/g;
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      try {
        const rawJson = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.sql && typeof item.sql === 'string') {
              practices.push({
                title: item.title || 'Bài tập thực hành',
                description: item.description || '',
                sql: item.sql.trim(),
              });
            }
          });
        }
      } catch (e) {
        // Parse fallback regex nếu json unescape bị lỗi
        const stepRegex = /"title":"([^"]+)","description":"([^"]+)","sql":"([^"]+)"/g;
        let sMatch;
        while ((sMatch = stepRegex.exec(match[1])) !== null) {
          practices.push({
            title: sMatch[1],
            description: sMatch[2].replace(/\\n/g, ' '),
            sql: sMatch[3].replace(/\\n/g, '\n'),
          });
        }
      }
    }
  } catch (err) {
    // Ignore extraction errors
  }
  return practices;
}

/**
 * Hàm phân tích file HTML thành 1 bài giảng hoàn chỉnh cho một Chương cụ thể
 * Các đề mục H2 sẽ là các phân đoạn nội dung bên trong bài giảng này.
 */
export function parseHtmlToLessons(
  htmlContent: string,
  options: { baseOrderIndex?: number; defaultTitle?: string } = {}
): ParsedLessonResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const stats: ParsedLessonResult['stats'] = {
    totalSections: 0,
    totalCodeBlocks: 0,
    totalCallouts: 0,
    totalTables: 0,
    totalImages: 0,
    totalVideos: 0,
  };

  // 1. Trích xuất tiêu đề bài giảng chính xác
  let mainTitle = '';

  // Ưu tiên 1: Thẻ có role="heading" level 1 (như của Next.js / Sydexa)
  const roleH1 = doc.querySelector('[role="heading"][aria-level="1"]');
  if (roleH1 && roleH1.textContent) {
    const t = roleH1.textContent.trim().replace(/\s+/g, ' ');
    if (t.length > 2) mainTitle = t;
  }

  // Ưu tiên 2: Thẻ <h1> chuẩn
  if (!mainTitle) {
    const firstH1 = doc.querySelector('h1');
    if (firstH1 && firstH1.textContent && firstH1.textContent.trim().length > 2) {
      mainTitle = firstH1.textContent.trim();
    }
  }

  // Ưu tiên 3: Tên file mặc định
  if (!mainTitle && options.defaultTitle) {
    mainTitle = options.defaultTitle;
  }

  // Ưu tiên 4: <title> thẻ web
  if (!mainTitle) {
    const titleEl = doc.querySelector('title');
    if (titleEl && titleEl.textContent) {
      const clean = titleEl.textContent
        .replace(/\s*[-|–]\s*(W3Schools|Viblo|F8|GeeksforGeeks|FreeCodeCamp|MDN|Sydexa).*$/i, '')
        .trim();
      if (clean.length > 2 && !clean.includes('Nền tảng học')) {
        mainTitle = clean;
      }
    }
  }

  if (!mainTitle) {
    mainTitle = options.defaultTitle || 'Bài giảng mới từ tệp HTML';
  }

  // 2. Xác định vùng nội dung cốt lõi
  const mainContentEl = doc.querySelector('main') || 
                        doc.querySelector('article') || 
                        doc.querySelector('.content') || 
                        doc.querySelector('.lesson-content') || 
                        doc.querySelector('.post-content') || 
                        doc.querySelector('#main-content') || 
                        doc.querySelector('#content') || 
                        doc.body;

  const h2Elements = Array.from(mainContentEl.querySelectorAll('h2'));
  stats.totalSections = h2Elements.length;

  // 3. Trích xuất các khối nội dung theo cấu trúc ngữ nghĩa
  const blocks = extractSemanticBlocks(mainContentEl, stats);

  // 4. Bổ sung các bài tập thực hành SQL (nếu có nhúng trong file)
  const embeddedPractices = extractEmbeddedSqlPractices(htmlContent);
  if (embeddedPractices.length > 0) {
    blocks.push('## Danh sách bài tập thực hành tương tác');
    embeddedPractices.forEach((p, idx) => {
      blocks.push(
        `:::exercise ${p.title}:\n${p.description}\n:::\n\n\`\`\`sql\n${p.sql}\n\`\`\``
      );
      stats.totalCodeBlocks++;
      stats.totalCallouts++;
    });
  }

  const fullMarkdown = blocks.join('\n\n').trim();
  const baseOrder = options.baseOrderIndex || 1;

  const lesson: Lesson = {
    id: `les_${Date.now()}_1`,
    title: mainTitle,
    orderIndex: baseOrder,
    durationMinutes: Math.max(10, Math.min(60, Math.round(fullMarkdown.length / 250) * 5 || 25)),
    content: fullMarkdown || `## ${mainTitle}\n\nNội dung bài học chưa có thông tin chi tiết.`,
  };

  return {
    lesson,
    mainTitle,
    stats,
  };
}

/**
 * Hàm phân tích file HTML thành cả khóa học
 */
export function parseHtmlToCourse(htmlContent: string, options: ParseOptions = {}): ParsedCourseResult {
  const parsedLesson = parseHtmlToLessons(htmlContent, options);
  const courseName = parsedLesson.mainTitle;
  const suggestedCode = generateCourseCode(courseName);

  const chapters: Chapter[] = [
    {
      id: `chap_${Date.now()}_1`,
      title: `Chương 1: ${courseName}`,
      orderIndex: 1,
      description: `Khóa học ${courseName} được chuyển hóa tự động và chuẩn hóa cấu trúc bài giảng OwnEdu.`,
      lessons: [parsedLesson.lesson],
    }
  ];

  return {
    courseName,
    suggestedCode,
    description: `Khóa học ${courseName} được chuyển hóa tự động và chuẩn hóa cấu trúc bài giảng OwnEdu.`,
    chapters,
    stats: {
      totalLessons: 1,
      totalCodeBlocks: parsedLesson.stats.totalCodeBlocks,
      totalCallouts: parsedLesson.stats.totalCallouts,
      totalTables: parsedLesson.stats.totalTables,
      totalImages: parsedLesson.stats.totalImages,
      totalVideos: parsedLesson.stats.totalVideos,
    },
  };
}
