import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Edit3,
  Layers,
  FileCode,
  Clock,
  Video,
  AlignLeft,
  Heading2,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Info,
  Code2,
  Image as ImageIcon,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Plus,
  UploadCloud,
  Crown,
  Youtube,
  CheckCircle2,
  AlertCircle,
  Film,
  Globe,
  EyeOff,
  FileEdit,
  BookOpen,
  Table,
  StickyNote,
  AlignCenter,
  AlignRight,
  Bold,
  Minus,
  X,
  HelpCircle
} from 'lucide-react';
import { AdminAPI, VideoAPI, ImageAPI } from '../services/api';
import { Course, Chapter, Lesson, VideoItem } from '../types';
import { HypertextRenderer } from '../components/HypertextRenderer';
import { SyntaxCodeEditor } from '../components/common/SyntaxCodeEditor';

export type BlockType = 'heading' | 'paragraph' | 'callout' | 'code' | 'image' | 'video' | 'table' | 'quiz' | 'flashcard';

export interface EditorQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface EditorQuizData {
  title?: string;
  question: string;
  options: EditorQuizOption[];
  explanation?: string;
}

export interface EditorFlashcardItem {
  id: string;
  front: string;
  back: string;
}

export interface EditorFlashcardData {
  title?: string;
  description?: string;
  cards: EditorFlashcardItem[];
}

export interface EditorTableData {
  headers: string[];
  rows: string[][];
  alignments: ('left' | 'center' | 'right')[];
  isHeaderBold?: boolean;
}

export interface EditorBlock {
  id: string;
  type: BlockType;
  headingText?: string;
  paragraphText?: string;
  calloutType?: 'keypoint' | 'tip' | 'warning' | 'info' | 'exercise';
  calloutTitle?: string;
  calloutContent?: string;
  codeLang?: string;
  codeText?: string;
  solutionCode?: string;
  imageUrl?: string;
  imageCaption?: string;
  videoUrl?: string;
  videoCaption?: string;
  tableData?: EditorTableData;
  quizData?: EditorQuizData;
  flashcardData?: EditorFlashcardData;
}

const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.trim().match(regExp);
  return match ? match[1] : null;
};

// Convert markdown text to visual blocks
const parseMarkdownToBlocks = (raw: string): EditorBlock[] => {
  if (!raw || !raw.trim()) {
    return [
      {
        id: `blk_${Date.now()}_1`,
        type: 'paragraph',
        paragraphText: ''
      }
    ];
  }

  const lines = raw.split(/\r?\n/);
  const blocks: EditorBlock[] = [];
  let i = 0;
  let counter = 1;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Heading (#, ##, ###, ####, etc.)
    if (/^#{1,6}\s+/.test(line)) {
      const heading = line.replace(/^#+\s*/, '').trim();
      blocks.push({
        id: `blk_${Date.now()}_${counter++}`,
        type: 'heading',
        headingText: heading
      });
      i++;
      continue;
    }

    // 2. Video block (:::video [caption]\nurl\n:::)
    if (line.trim().startsWith(':::video')) {
      const caption = line.trim().slice(8).trim();
      const contentLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        contentLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(':::')) {
        i++;
      }

      blocks.push({
        id: `blk_${Date.now()}_${counter++}`,
        type: 'video',
        videoUrl: contentLines.join('\n').trim(),
        videoCaption: caption
      });
      continue;
    }

    // 2.3 Flashcard block (:::flashcard [title])
    if (line.trim().startsWith(':::flashcard')) {
      const fcTitle = line.trim().slice(12).trim();
      const contentLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        contentLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(':::')) {
        i++;
      }

      const cards: EditorFlashcardItem[] = [];
      const cardChunks: string[][] = [[]];
      for (const fLine of contentLines) {
        if (fLine.trim() === '---' || fLine.trim() === '===') {
          cardChunks.push([]);
        } else {
          cardChunks[cardChunks.length - 1].push(fLine);
        }
      }

      for (const chunk of cardChunks) {
        if (chunk.length === 0) continue;
        let front = '';
        let back = '';
        let activeField: 'front' | 'back' | null = null;

        for (const cLine of chunk) {
          const trimmed = cLine.trim();
          if (!trimmed) continue;

          const frontMatch = trimmed.match(/^(?:Front|Mặt\s*trước|Hỏi|\*\*Hỏi\*\*|Q):\s*(.*)$/i);
          const backMatch = trimmed.match(/^(?:Back|Mặt\s*sau|Trả\s*lời|\*\*Trả\s*lời\*\*|A|Đáp\s*án):\s*(.*)$/i);

          if (frontMatch) {
            activeField = 'front';
            front = (front ? front + '\n' : '') + frontMatch[1].trim();
          } else if (backMatch) {
            activeField = 'back';
            back = (back ? back + '\n' : '') + backMatch[1].trim();
          } else if (activeField === 'front') {
            front = (front ? front + '\n' : '') + trimmed;
          } else if (activeField === 'back') {
            back = (back ? back + '\n' : '') + trimmed;
          } else if (!front) {
            front = trimmed;
            activeField = 'front';
          } else {
            back = (back ? back + '\n' : '') + trimmed;
            activeField = 'back';
          }
        }

        if (front || back) {
          cards.push({
            id: `card_${Date.now()}_${cards.length + 1}`,
            front: front.trim() || 'Câu hỏi / Khái niệm',
            back: back.trim() || 'Câu trả lời / Giải thích'
          });
        }
      }

      if (cards.length === 0) {
        cards.push({
          id: `card_${Date.now()}_1`,
          front: 'Khái niệm hoặc câu hỏi ôn tập',
          back: 'Câu trả lời hoặc giải thích chi tiết'
        });
      }

      blocks.push({
        id: `blk_${Date.now()}_${counter++}`,
        type: 'flashcard',
        flashcardData: {
          title: fcTitle || 'Ôn nhanh bằng flashcard',
          description: 'Nhấp vào từng thẻ để lật và tự kiểm tra trước khi làm quiz.',
          cards
        }
      });
      continue;
    }

    // 2.5 Quiz block (:::quiz [title])
    if (line.trim().startsWith(':::quiz')) {
      const qCaption = line.trim().slice(7).trim();
      const contentLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        contentLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(':::')) {
        i++;
      }

      let title = qCaption;
      const options: EditorQuizOption[] = [];
      let explanation = '';
      const questionLines: string[] = [];

      for (const rawL of contentLines) {
        const trimmed = rawL.trim();
        const optMatch = trimmed.match(/^-\s*\[([ xX*])\]\s*(.*)$/) || trimmed.match(/^-\s*\(([ xX*])\)\s*(.*)$/);
        if (optMatch) {
          const isCorrect = optMatch[1].toLowerCase() === 'x' || optMatch[1] === '*';
          const cleanText = optMatch[2].replace(/^[A-Da-d][.)\s-]\s*/, '').trim() || optMatch[2].trim();
          options.push({
            id: `opt_${Date.now()}_${options.length + 1}`,
            text: cleanText,
            isCorrect
          });
        } else if (trimmed.startsWith('- ')) {
          const cleanText = trimmed.slice(2).replace(/^[A-Da-d][.)\s-]\s*/, '').trim() || trimmed.slice(2).trim();
          options.push({
            id: `opt_${Date.now()}_${options.length + 1}`,
            text: cleanText,
            isCorrect: options.length === 0
          });
        } else if (trimmed.startsWith('>')) {
          explanation = (explanation ? explanation + '\n' : '') + trimmed.replace(/^>\s*/, '').trim();
        } else if (trimmed.length > 0 && options.length === 0) {
          questionLines.push(trimmed.replace(/^\*\*|\*\*$/g, '').trim());
        }
      }

      let question = '';
      if (questionLines.length > 1 && !title) {
        if (questionLines[0].length < 45 && !questionLines[0].includes('?')) {
          title = questionLines[0];
          question = questionLines.slice(1).join('\n\n');
        } else {
          question = questionLines.join('\n\n');
        }
      } else {
        question = questionLines.join('\n\n');
      }

      if (!question && title) {
        question = title;
        title = '';
      }

      if (options.length === 0) {
        options.push(
          { id: 'opt_1', text: 'Phương án A (Đáp án đúng)', isCorrect: true },
          { id: 'opt_2', text: 'Phương án B', isCorrect: false }
        );
      }

      if (!options.some(o => o.isCorrect)) {
        options[0].isCorrect = true;
      }

      blocks.push({
        id: `blk_${Date.now()}_${counter++}`,
        type: 'quiz',
        quizData: {
          title,
          question: question || 'Câu hỏi trắc nghiệm:',
          options,
          explanation
        }
      });
      continue;
    }

    // 3. Callout block (:::keypoint, :::tip, etc.)
    if (line.trim().startsWith(':::')) {
      const header = line.trim().slice(3).trim();
      const spaceIdx = header.indexOf(' ');
      const rawType = (spaceIdx !== -1 ? header.slice(0, spaceIdx) : header).toLowerCase();
      const validTypes: ('keypoint' | 'tip' | 'warning' | 'info' | 'exercise')[] = ['keypoint', 'tip', 'warning', 'info', 'exercise'];
      const normalizedType = rawType === 'baitap' || rawType === 'task' ? 'exercise' : rawType;
      const calloutType = validTypes.includes(normalizedType as any) ? (normalizedType as any) : 'keypoint';
      const calloutTitle = spaceIdx !== -1 ? header.slice(spaceIdx + 1).trim() : '';

      const contentLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        contentLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(':::')) {
        i++;
      }

      // Tự động nhận diện bài tập trắc nghiệm cũ chuyển hóa thành Khối Trắc Nghiệm chuẩn
      if (calloutType === 'exercise' && calloutTitle.toLowerCase().includes('trắc nghiệm')) {
        let question = '';
        const options: EditorQuizOption[] = [];
        for (const cL of contentLines) {
          const trimmed = cL.trim();
          if (trimmed.startsWith('- ')) {
            options.push({
              id: `opt_${Date.now()}_${options.length + 1}`,
              text: trimmed.slice(2).trim(),
              isCorrect: options.length === 0
            });
          } else if (trimmed.length > 0 && options.length === 0) {
            question = (question ? question + '\n' : '') + trimmed.replace(/^\*\*|\*\*$/g, '').trim();
          }
        }
        if (options.length > 0) {
          blocks.push({
            id: `blk_${Date.now()}_${counter++}`,
            type: 'quiz',
            quizData: {
              question: question || calloutTitle,
              options,
              explanation: ''
            }
          });
          continue;
        }
      }

      // Tự động nhận diện khối ôn tập Hỏi/Trả lời chuyển hóa thành Khối Flashcard chuẩn
      const isQACallout = contentLines.some(l => /\b(hỏi|\*\*hỏi\*\*|front)\b/i.test(l)) &&
                          contentLines.some(l => /\b(trả lời|\*\*trả lời\*\*|back)\b/i.test(l));
      if (isQACallout) {
        const cards: EditorFlashcardItem[] = [];
        let front = '';
        let back = '';
        let active: 'front' | 'back' | null = null;
        for (const cL of contentLines) {
          const tr = cL.trim();
          if (!tr) continue;
          const fM = tr.match(/^(?:Front|Mặt\s*trước|Hỏi|\*\*Hỏi\*\*|Q):\s*(.*)$/i);
          const bM = tr.match(/^(?:Back|Mặt\s*sau|Trả\s*lời|\*\*Trả\s*lời\*\*|A|Đáp\s*án):\s*(.*)$/i);
          if (fM) {
            if (front && back) {
              cards.push({ id: `card_${Date.now()}_${cards.length + 1}`, front, back });
              front = '';
              back = '';
            }
            active = 'front';
            front = fM[1].trim();
          } else if (bM) {
            active = 'back';
            back = bM[1].trim();
          } else if (active === 'front') {
            front = (front ? front + '\n' : '') + tr;
          } else if (active === 'back') {
            back = (back ? back + '\n' : '') + tr;
          }
        }
        if (front && back) {
          cards.push({ id: `card_${Date.now()}_${cards.length + 1}`, front, back });
        }
        if (cards.length > 0) {
          blocks.push({
            id: `blk_${Date.now()}_${counter++}`,
            type: 'flashcard',
            flashcardData: {
              title: calloutTitle || 'Ôn nhanh bằng flashcard',
              description: 'Nhấp vào từng thẻ để lật và tự kiểm tra trước khi làm quiz.',
              cards
            }
          });
          continue;
        }
      }

      blocks.push({
        id: `blk_${Date.now()}_${counter++}`,
        type: 'callout',
        calloutType,
        calloutTitle,
        calloutContent: contentLines.join('\n').trim()
      });
      continue;
    }

    // 3. Code block (```lang)
    if (line.trim().startsWith('```')) {
      const codeLang = line.trim().slice(3).trim() || 'sql';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++;
      }
      const rawFullCode = codeLines.join('\n');
      const SOLUTION_REGEX = /\r?\n\s*(?:--|\/\/|#|\/\*|<!--)?\s*===solution===\s*(?:\*\/|-->)?\r?\n?/i;
      let parsedCodeText = rawFullCode;
      let parsedSolutionCode: string | undefined = undefined;

      if (SOLUTION_REGEX.test(rawFullCode)) {
        const parts = rawFullCode.split(SOLUTION_REGEX);
        parsedCodeText = parts[0];
        parsedSolutionCode = parts.slice(1).join('\n').trim();
      } else {
        // Check if followed by :::solution
        let lookAhead = i;
        while (lookAhead < lines.length && lines[lookAhead].trim().length === 0) {
          lookAhead++;
        }
        if (lookAhead < lines.length && lines[lookAhead].trim().startsWith(':::solution')) {
          i = lookAhead + 1;
          const solLines: string[] = [];
          while (i < lines.length && !lines[i].trim().startsWith(':::')) {
            solLines.push(lines[i]);
            i++;
          }
          if (i < lines.length && lines[i].trim().startsWith(':::')) {
            i++;
          }
          parsedSolutionCode = solLines.join('\n').trim();
        }
      }

      blocks.push({
        id: `blk_${Date.now()}_${counter++}`,
        type: 'code',
        codeLang,
        codeText: parsedCodeText,
        solutionCode: parsedSolutionCode
      });
      continue;
    }

    // 4. Image (![alt](url))
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      blocks.push({
        id: `blk_${Date.now()}_${counter++}`,
        type: 'image',
        imageCaption: imgMatch[1],
        imageUrl: imgMatch[2]
      });
      i++;
      continue;
    }

    // 5. Table block (| Header 1 | Header 2 |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const isSep = nextLine.startsWith('|') && nextLine.endsWith('|') && nextLine.slice(1, -1).split('|').every(c => /^[\s:-]+$/.test(c) && c.includes('-'));
        if (isSep) {
          const rawHeaders = line.trim().slice(1, -1).split('|').map(s => s.trim());
          const sepCells = nextLine.slice(1, -1).split('|').map(s => s.trim());
          const alignments: ('left' | 'center' | 'right')[] = sepCells.map(c => {
            const hasLeft = c.startsWith(':');
            const hasRight = c.endsWith(':');
            if (hasLeft && hasRight) return 'center';
            if (hasRight) return 'right';
            return 'left';
          });

          let isHeaderBold = false;
          const headers = rawHeaders.map(h => {
            if (h.startsWith('**') && h.endsWith('**') && h.length >= 4) {
              isHeaderBold = true;
              return h.slice(2, -2).trim();
            }
            return h;
          });

          i += 2;
          const rows: string[][] = [];
          while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
            const rowCells = lines[i].trim().slice(1, -1).split('|').map(s => s.trim());
            while (rowCells.length < headers.length) rowCells.push('');
            rows.push(rowCells.slice(0, headers.length));
            i++;
          }

          blocks.push({
            id: `blk_${Date.now()}_${counter++}`,
            type: 'table',
            tableData: {
              headers: headers.length > 0 ? headers : ['', ''],
              rows: rows.length > 0 ? rows : [Array(headers.length || 2).fill('')],
              alignments: alignments.length === headers.length ? alignments : Array(headers.length || 2).fill('center'),
              isHeaderBold
            }
          });
          continue;
        }
      }
    }

    // 6. Paragraph
    if (line.trim().length === 0) {
      i++;
      continue;
    }

    const pLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim().length > 0 &&
      !lines[i].trim().startsWith(':::') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].startsWith('#') &&
      !lines[i].trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/) &&
      !lines[i].trim().startsWith('|')
    ) {
      pLines.push(lines[i]);
      i++;
    }

    blocks.push({
      id: `blk_${Date.now()}_${counter++}`,
      type: 'paragraph',
      paragraphText: pLines.join('\n').trim()
    });
  }

  return blocks.length > 0 ? blocks : [{ id: `blk_${Date.now()}_1`, type: 'paragraph', paragraphText: '' }];
};

// Serialize visual blocks back to Markdown
const serializeBlocksToMarkdown = (blocks: EditorBlock[]): string => {
  const parts: string[] = [];

  for (const block of blocks) {
    if (block.type === 'heading') {
      if (block.headingText && block.headingText.trim()) {
        parts.push(`## ${block.headingText.trim()}`);
      }
    } else if (block.type === 'paragraph') {
      if (block.paragraphText && block.paragraphText.trim()) {
        parts.push(block.paragraphText.trim());
      }
    } else if (block.type === 'callout') {
      const type = block.calloutType || 'keypoint';
      const title = block.calloutTitle ? ` ${block.calloutTitle.trim()}` : '';
      const content = block.calloutContent ? block.calloutContent.trim() : '';
      parts.push(`:::${type}${title}\n${content}\n:::`);
    } else if (block.type === 'code') {
      const lang = block.codeLang || 'sql';
      const code = block.codeText || '';
      if (block.solutionCode && block.solutionCode.trim()) {
        parts.push(`\`\`\`${lang}\n${code}\n===solution===\n${block.solutionCode.trim()}\n\`\`\``);
      } else {
        parts.push(`\`\`\`${lang}\n${code}\n\`\`\``);
      }
    } else if (block.type === 'image') {
      if (block.imageUrl) {
        parts.push(`![${block.imageCaption || ''}](${block.imageUrl})`);
      }
    } else if (block.type === 'video') {
      if (block.videoUrl) {
        const caption = block.videoCaption ? ` ${block.videoCaption.trim()}` : '';
        parts.push(`:::video${caption}\n${block.videoUrl.trim()}\n:::`);
      }
    } else if (block.type === 'table' && block.tableData) {
      const { headers = [], rows = [], alignments = [], isHeaderBold = true } = block.tableData;
      if (headers.length > 0) {
        const colCount = headers.length;
        const formattedHeaders = headers.map(h => {
          const clean = (h || '').trim();
          if (!clean) return ' ';
          return isHeaderBold ? `**${clean}**` : clean;
        });
        const headerLine = `| ${formattedHeaders.join(' | ')} |`;

        const alignCells = Array.from({ length: colCount }).map((_, cIdx) => {
          const align = alignments[cIdx] || 'left';
          if (align === 'center') return ':---:';
          if (align === 'right') return '---:';
          return ':---';
        });
        const alignLine = `| ${alignCells.join(' | ')} |`;

        const rowLines = rows.map(r => {
          const cells = Array.from({ length: colCount }).map((_, cIdx) => (r[cIdx] || '').trim() || ' ');
          return `| ${cells.join(' | ')} |`;
        });

        parts.push([headerLine, alignLine, ...rowLines].join('\n'));
      }
    } else if (block.type === 'quiz' && block.quizData) {
      const title = block.quizData.title && block.quizData.title.trim() ? ` ${block.quizData.title.trim()}` : '';
      const q = block.quizData.question || 'Câu hỏi trắc nghiệm:';
      const opts = (block.quizData.options || []).map(o => `- [${o.isCorrect ? 'x' : ' '}] ${o.text}`).join('\n');
      const expl = block.quizData.explanation && block.quizData.explanation.trim() ? `\n> ${block.quizData.explanation.trim()}` : '';
      parts.push(`:::quiz${title}\n${q}\n\n${opts}${expl}\n:::`);
    } else if (block.type === 'flashcard' && block.flashcardData) {
      const title = block.flashcardData.title && block.flashcardData.title.trim() ? ` ${block.flashcardData.title.trim()}` : '';
      const cards = block.flashcardData.cards || [];
      const cardTexts = cards.map(c => `Front: ${c.front.trim()}\nBack: ${c.back.trim()}`);
      parts.push(`:::flashcard${title}\n${cardTexts.join('\n---\n')}\n:::`);
    }
  }

  return parts.join('\n\n');
};

export const AdminLessonEditorPage: React.FC = () => {
  const { courseId, chapterId, lessonId } = useParams<{ courseId: string; chapterId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);

  const [activeTab, setActiveTab] = useState<'VISUAL' | 'RAW' | 'PREVIEW'>('VISUAL');
  const [title, setTitle] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [rawContent, setRawContent] = useState<string>('');
  const [isPublishingCourse, setIsPublishingCourse] = useState<boolean>(false);
  const activeTableInputRef = React.useRef<{
    blockId: string;
    type: 'header' | 'cell';
    rowIdx?: number;
    colIdx: number;
    element: HTMLInputElement;
  } | null>(null);

  const handleTogglePublishCourse = async () => {
    if (!course) return;
    const nextStatus: 'draft' | 'published' = course.status === 'draft' ? 'published' : 'draft';
    try {
      setIsPublishingCourse(true);
      await AdminAPI.updateCourse(course.id, { status: nextStatus });
      setCourse(prev => prev ? { ...prev, status: nextStatus } : null);
      if (nextStatus === 'published') {
        alert('Đã xuất bản khóa học! Học viên trên hệ thống hiện đã có thể nhìn thấy khóa học này.');
      } else {
        alert('Đã chuyển khóa học về bản nháp. Khóa học hiện đã được ẩn khỏi danh sách của học viên.');
      }
    } catch (err: any) {
      alert('Không thể cập nhật trạng thái khóa học: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setIsPublishingCourse(false);
    }
  };

  const isFreeCourse = course ? (course.isFreeTier !== false && course.tierRequired !== 'PRO') : true;

  // Video management states for Free vs Pro (inside video blocks)
  const [availableVideos, setAvailableVideos] = useState<VideoItem[]>([]);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [blockUploadMsg, setBlockUploadMsg] = useState<{ [blockId: string]: { type: 'success' | 'error'; text: string } }>({});

  const handleUploadBlockVideo = async (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isFreeCourse) {
      alert('Khóa học Free chỉ hỗ trợ gắn link YouTube.');
      return;
    }
    try {
      setUploadingBlockId(blockId);
      setBlockUploadMsg(prev => ({ ...prev, [blockId]: { type: 'success', text: 'Đang tải lên Cloudflare R2...' } }));
      const uploaded = await VideoAPI.upload(file, file.name, courseId);
      setAvailableVideos(prev => [uploaded, ...prev.filter(v => v.id !== uploaded.id)]);
      updateBlock(blockId, { videoUrl: uploaded.storageUrl, videoCaption: file.name.replace(/\.[^/.]+$/, '') });
      setBlockUploadMsg(prev => ({
        ...prev,
        [blockId]: { type: 'success', text: `Đã lưu video vào Cloudflare R2!` }
      }));
    } catch (err: any) {
      setBlockUploadMsg(prev => ({
        ...prev,
        [blockId]: { type: 'error', text: err.response?.data?.error?.message || err.message || 'Lỗi khi tải video lên R2.' }
      }));
    } finally {
      setUploadingBlockId(null);
      e.target.value = '';
    }
  };

  const [uploadingImageBlockId, setUploadingImageBlockId] = useState<string | null>(null);
  const [imageUploadMsg, setImageUploadMsg] = useState<{ [blockId: string]: { type: 'success' | 'error'; text: string } }>({});

  const handleUploadBlockImage = async (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImageBlockId(blockId);
      setImageUploadMsg(prev => ({ ...prev, [blockId]: { type: 'success', text: 'Đang tải ảnh lên...' } }));
      const res = await ImageAPI.upload(file);
      updateBlock(blockId, {
        imageUrl: res.url,
        imageCaption: (blocks.find(b => b.id === blockId)?.imageCaption) || file.name.replace(/\.[^/.]+$/, '')
      });
      setImageUploadMsg(prev => ({ ...prev, [blockId]: { type: 'success', text: 'Đã tải ảnh lên thành công!' } }));
    } catch (err: any) {
      setImageUploadMsg(prev => ({
        ...prev,
        [blockId]: { type: 'error', text: err.response?.data?.error?.message || err.message || 'Lỗi khi tải ảnh từ máy tính.' }
      }));
    } finally {
      setUploadingImageBlockId(null);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const loadLessonData = async () => {
      setIsLoading(true);
      try {
        VideoAPI.list().then(vids => setAvailableVideos(vids)).catch(() => { });
        const courses = await AdminAPI.getCourses();
        const foundCourse = courses.find(c => c.id === courseId);
        if (!foundCourse) {
          alert('Không tìm thấy khóa học!');
          navigate('/admin');
          return;
        }
        setCourse(foundCourse);

        const foundChapter = (foundCourse.chapters || []).find(ch => ch.id === chapterId);
        if (!foundChapter) {
          alert('Không tìm thấy chương học này!');
          navigate('/admin');
          return;
        }
        setChapter(foundChapter);

        if (lessonId && lessonId !== 'new') {
          const foundLesson = (foundChapter.lessons || []).find(l => l.id === lessonId);
          if (foundLesson) {
            setLesson(foundLesson);
            setTitle(foundLesson.title || '');
            setDurationMinutes(foundLesson.durationMinutes || 15);
            const parsedBlocks = parseMarkdownToBlocks(foundLesson.content || '');
            // If legacy lesson had a top videoUrl and it is not already in blocks, prepend it as a video block at the top
            if (foundLesson.videoUrl?.trim() && !parsedBlocks.some(b => b.type === 'video' && b.videoUrl?.trim() === foundLesson.videoUrl?.trim())) {
              parsedBlocks.unshift({
                id: `blk_legacy_vid_${Date.now()}`,
                type: 'video',
                videoUrl: foundLesson.videoUrl.trim(),
                videoCaption: 'Video bài giảng'
              });
            }
            setBlocks(parsedBlocks);
            setRawContent(foundLesson.content || '');
          } else {
            alert('Không tìm thấy bài học!');
            navigate('/admin');
            return;
          }
        } else {
          // Creating brand new lesson
          setTitle('');
          setDurationMinutes(15);
          const sampleBlocks: EditorBlock[] = [
            {
              id: 'b1',
              type: 'paragraph',
              paragraphText: 'Nhập nội dung mở đầu bài học ở đây...'
            },
            {
              id: 'b2',
              type: 'callout',
              calloutType: 'keypoint',
              calloutTitle: 'Điểm then chốt của bài học:',
              calloutContent: 'Ghi chú kiến thức bản lề quan trọng nhất mà học viên bắt buộc phải nắm được.'
            }
          ];
          setBlocks(sampleBlocks);
          setRawContent(serializeBlocksToMarkdown(sampleBlocks));
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu bài học:', err);
        alert('Không thể tải bài học. Vui lòng thử lại!');
        navigate('/admin');
      } finally {
        setIsLoading(false);
      }
    };

    loadLessonData();
  }, [courseId, chapterId, lessonId, navigate]);

  // Block Manipulation Handlers
  const addBlock = (type: BlockType, extra?: Partial<EditorBlock>) => {
    const newBlock: EditorBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      ...extra
    };

    if (type === 'heading' && !newBlock.headingText) {
      newBlock.headingText = 'Tiêu đề mục mới';
    } else if (type === 'paragraph' && !newBlock.paragraphText) {
      newBlock.paragraphText = '';
    } else if (type === 'callout') {
      newBlock.calloutType = extra?.calloutType || 'keypoint';
      newBlock.calloutTitle = extra?.calloutTitle || (
        newBlock.calloutType === 'keypoint' ? 'Điểm then chốt của bài học:' :
          newBlock.calloutType === 'tip' ? 'Mẹo hay / Lưu ý:' :
            newBlock.calloutType === 'warning' ? 'Cảnh báo quan trọng:' :
              newBlock.calloutType === 'exercise' ? 'Bài tập:' : 'Thông tin bổ sung:'
      );
      newBlock.calloutContent = extra?.calloutContent || (
        newBlock.calloutType === 'exercise'
          ? 'Nhập yêu cầu hoặc câu hỏi bài tập tại đây...'
          : 'Nhập nội dung cần đóng khung nổi bật ở đây...'
      );
    } else if (type === 'code') {
      newBlock.codeLang = extra?.codeLang || 'sql';
      newBlock.codeText = '';
    } else if (type === 'image') {
      newBlock.imageUrl = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop';
      newBlock.imageCaption = 'Sơ đồ minh họa';
    } else if (type === 'video') {
      newBlock.videoUrl = '';
      newBlock.videoCaption = 'Video bài giảng';
    } else if (type === 'table') {
      newBlock.tableData = extra?.tableData || {
        headers: ['', '', ''],
        rows: [
          ['', '', ''],
          ['', '', '']
        ],
        alignments: ['center', 'center', 'center'],
        isHeaderBold: false
      };
    } else if (type === 'quiz') {
      newBlock.quizData = extra?.quizData || {
        question: 'Câu hỏi trắc nghiệm kiểm tra kiến thức?',
        options: [
          { id: 'opt_1', text: 'Phương án A (Đáp án đúng)', isCorrect: true },
          { id: 'opt_2', text: 'Phương án B', isCorrect: false },
          { id: 'opt_3', text: 'Phương án C', isCorrect: false },
          { id: 'opt_4', text: 'Phương án D', isCorrect: false },
        ],
        explanation: 'Giải thích chi tiết vì sao phương án này chính xác...'
      };
    } else if (type === 'flashcard') {
      newBlock.flashcardData = extra?.flashcardData || {
        title: 'Ôn nhanh bằng flashcard',
        description: 'Nhấp vào từng thẻ để lật và tự kiểm tra trước khi làm quiz.',
        cards: [
          {
            id: `card_${Date.now()}_1`,
            front: 'Cơ sở dữ liệu (database) là gì?',
            back: 'Nơi lưu trữ dữ liệu có tổ chức, được quản lý bởi DBMS (PostgreSQL, MySQL, SQL Server...). Giúp lưu trữ, truy xuất và bảo vệ dữ liệu hiệu quả.'
          },
          {
            id: `card_${Date.now()}_2`,
            front: 'Bảng (Table) trong database gồm những thành phần nào?',
            back: 'Gồm các hàng (rows/records) đại diện cho từng thực thể và các cột (columns/fields) đại diện cho các thuộc tính.'
          }
        ]
      };
    }

    setBlocks(prev => [...prev, newBlock]);
  };

  const updateTableHeader = (blockId: string, colIdx: number, value: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId || !b.tableData) return b;
      const newHeaders = [...b.tableData.headers];
      newHeaders[colIdx] = value;
      return { ...b, tableData: { ...b.tableData, headers: newHeaders } };
    }));
  };

  const updateTableCell = (blockId: string, rowIdx: number, colIdx: number, value: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId || !b.tableData) return b;
      const newRows = b.tableData.rows.map((row, rI) => {
        if (rI !== rowIdx) return row;
        const newRow = [...row];
        newRow[colIdx] = value;
        return newRow;
      });
      return { ...b, tableData: { ...b.tableData, rows: newRows } };
    }));
  };

  const handleApplyBoldToTableSelection = (blockId: string) => {
    const active = activeTableInputRef.current;
    if (!active || active.blockId !== blockId || !active.element) return;
    const input = active.element;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const original = input.value || '';

    let updated = '';
    let newStart = start;
    let newEnd = end;

    if (start !== end) {
      const selected = original.substring(start, end);
      if (selected.startsWith('**') && selected.endsWith('**') && selected.length >= 4) {
        const unwrapped = selected.slice(2, -2);
        updated = original.substring(0, start) + unwrapped + original.substring(end);
        newEnd = start + unwrapped.length;
      } else {
        const wrapped = `**${selected}**`;
        updated = original.substring(0, start) + wrapped + original.substring(end);
        newEnd = start + wrapped.length;
      }
    } else {
      if (original.startsWith('**') && original.endsWith('**') && original.length >= 4) {
        updated = original.slice(2, -2);
        newStart = 0;
        newEnd = updated.length;
      } else if (original.trim()) {
        updated = `**${original}**`;
        newStart = 0;
        newEnd = updated.length;
      }
    }

    if (updated !== original) {
      if (active.type === 'header') {
        updateTableHeader(blockId, active.colIdx, updated);
      } else if (active.type === 'cell' && typeof active.rowIdx === 'number') {
        updateTableCell(blockId, active.rowIdx, active.colIdx, updated);
      }
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(newStart, newEnd);
      }, 0);
    }
  };

  const addTableColumn = (blockId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId || !b.tableData) return b;
      const newHeaders = [...b.tableData.headers, ''];
      const newAligns = [...b.tableData.alignments, 'center' as const];
      const newRows = b.tableData.rows.map(row => [...row, '']);
      return { ...b, tableData: { ...b.tableData, headers: newHeaders, alignments: newAligns, rows: newRows } };
    }));
  };

  const removeTableColumn = (blockId: string, colIdx?: number) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId || !b.tableData || b.tableData.headers.length <= 1) return b;
      const targetIdx = typeof colIdx === 'number' ? colIdx : b.tableData.headers.length - 1;
      const newHeaders = b.tableData.headers.filter((_, idx) => idx !== targetIdx);
      const newAligns = b.tableData.alignments.filter((_, idx) => idx !== targetIdx);
      const newRows = b.tableData.rows.map(row => row.filter((_, idx) => idx !== targetIdx));
      return { ...b, tableData: { ...b.tableData, headers: newHeaders, alignments: newAligns, rows: newRows } };
    }));
  };

  const addTableRow = (blockId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId || !b.tableData) return b;
      const emptyRow = Array(b.tableData.headers.length).fill('');
      return { ...b, tableData: { ...b.tableData, rows: [...b.tableData.rows, emptyRow] } };
    }));
  };

  const removeTableRow = (blockId: string, rowIdx?: number) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId || !b.tableData || b.tableData.rows.length <= 1) return b;
      const targetIdx = typeof rowIdx === 'number' ? rowIdx : b.tableData.rows.length - 1;
      const newRows = b.tableData.rows.filter((_, idx) => idx !== targetIdx);
      return { ...b, tableData: { ...b.tableData, rows: newRows } };
    }));
  };

  const updateBlock = (id: string, updates: Partial<EditorBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleSelectCalloutType = (block: EditorBlock, newType: 'keypoint' | 'tip' | 'warning' | 'info' | 'exercise') => {
    const defaultTitles = [
      'Điểm then chốt của bài học:',
      'Điểm then chốt:',
      'Mẹo hay / Lưu ý:',
      'Mẹo hay / Lưu ý',
      'Cảnh báo quan trọng:',
      'Thông tin bổ sung:',
      'Bài tập:',
      'Bài tập thực hành:'
    ];
    const isDefault = !block.calloutTitle || defaultTitles.includes(block.calloutTitle.trim());
    const newTitle = isDefault ? (
      newType === 'keypoint' ? 'Điểm then chốt của bài học:' :
        newType === 'tip' ? 'Mẹo hay / Lưu ý:' :
          newType === 'warning' ? 'Cảnh báo quan trọng:' :
            newType === 'exercise' ? 'Bài tập:' : 'Thông tin bổ sung:'
    ) : block.calloutTitle;

    updateBlock(block.id, {
      calloutType: newType,
      calloutTitle: newTitle
    });
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) {
      setBlocks([{ id: `blk_${Date.now()}`, type: 'paragraph', paragraphText: '' }]);
      return;
    }
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'UP' | 'DOWN') => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[newIdx];
    newBlocks[newIdx] = temp;
    setBlocks(newBlocks);
  };

  // Sync to raw markdown before switching tabs
  const handleSwitchTab = (targetTab: 'VISUAL' | 'RAW' | 'PREVIEW') => {
    if (activeTab === 'VISUAL') {
      setRawContent(serializeBlocksToMarkdown(blocks));
    } else if (activeTab === 'RAW') {
      setBlocks(parseMarkdownToBlocks(rawContent));
    }
    setActiveTab(targetTab);
  };

  const handleSaveLesson = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài học!');
      return;
    }
    if (!course || !chapter) return;

    try {
      setIsSaving(true);
      const finalContent = activeTab === 'RAW' ? rawContent.trim() : serializeBlocksToMarkdown(blocks).trim();

      const firstVideoBlock = blocks.find(b => b.type === 'video' && b.videoUrl?.trim());

      const savedLesson: Lesson = {
        id: lesson?.id || `les_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: title.trim(),
        orderIndex: lesson?.orderIndex ?? ((chapter.lessons?.length || 0) + 1),
        durationMinutes: Number(durationMinutes) || 15,
        content: finalContent,
        videoUrl: firstVideoBlock?.videoUrl?.trim() || undefined,
        updatedAt: new Date().toISOString()
      };

      // Update chapters array
      const existingChapters = course.chapters || [];
      const updatedChapters = existingChapters.map(ch => {
        if (ch.id !== chapter.id) return ch;
        const curLessons = ch.lessons || [];
        const isEditing = curLessons.some(l => l.id === savedLesson.id);
        const newLessons = isEditing
          ? curLessons.map(l => l.id === savedLesson.id ? savedLesson : l)
          : [...curLessons, savedLesson];
        return { ...ch, lessons: newLessons };
      });

      await AdminAPI.updateCourse(course.id, {
        chapters: updatedChapters
      });

      alert('Đã lưu bài giảng thành công!');
      navigate('/admin');
    } catch (err: any) {
      alert('Không thể lưu bài giảng: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setIsSaving(false);
    }
  };

  const currentPreviewContent = activeTab === 'RAW' ? rawContent : serializeBlocksToMarkdown(blocks);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center space-y-3">
        <div className="space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Đang tải không gian soạn bài giảng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col w-full">

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="Quay lại trang quản trị"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>

            <div className="h-5 w-px bg-slate-200 shrink-0" />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
                <span className="hover:text-slate-700 transition">{course?.name || 'Khóa học'}</span>
                {course?.status === 'draft' ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    Bản nháp
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Công khai
                  </span>
                )}
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-slate-700 font-semibold">{chapter?.title || 'Chương học'}</span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 truncate">
                {title ? title : (lesson ? 'Chỉnh sửa bài giảng' : 'Soạn bài giảng mới')}
              </h2>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => handleSwitchTab('VISUAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${activeTab === 'VISUAL'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
              title="Soạn thảo trực quan kiểu Word"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Soạn trực quan</span>
              <span className="md:hidden">Soạn</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('PREVIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${activeTab === 'PREVIEW'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
              title="Xem trước giao diện học viên"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('RAW')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${activeTab === 'RAW'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Chế độ mã Markdown thô"
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Save & Publish Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {course && (
              <button
                type="button"
                onClick={handleTogglePublishCourse}
                disabled={isPublishingCourse}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 ${course.status === 'draft'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                title={course.status === 'draft' ? 'Xuất bản khóa học để học viên nhìn thấy' : 'Chuyển về bản nháp để ẩn khỏi học viên'}
              >
                {isPublishingCourse ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : course.status === 'draft' ? (
                  <Globe className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{course.status === 'draft' ? 'Xuất bản khóa học' : 'Chuyển về nháp'}</span>
                <span className="sm:hidden">{course.status === 'draft' ? 'Xuất bản' : 'Về nháp'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveLesson}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Bài Giảng</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Main Page Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Top Info Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Tên bài học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Tư duy quan hệ và INNER JOIN"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: VISUAL WYSIWYG EDITOR (KIỂU WORD / NOTION) */}
        {activeTab === 'VISUAL' && (
          <div className="space-y-5">
            {/* Blocks Canvas */}
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="relative group bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:border-orange-300 transition-all p-5 space-y-3"
                >
                  {/* Floating Action Controls */}
                  <div className="absolute right-4 top-4 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs px-2 py-1 rounded-xl border border-slate-200 shadow-2xs z-10">
                    <button
                      type="button"
                      onClick={() => moveBlock(index, 'UP')}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                      title="Di chuyển lên"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(index, 'DOWN')}
                      disabled={index === blocks.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                      title="Di chuyển xuống"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Xóa khối này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. HEADING BLOCK */}
                  {block.type === 'heading' && (
                    <div className="space-y-1.5 pr-24">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Heading2 className="w-3.5 h-3.5 text-orange-500" />
                        <span>Tiêu đề mục lớn (H2)</span>
                      </div>
                      <input
                        type="text"
                        value={block.headingText || ''}
                        onChange={(e) => updateBlock(block.id, { headingText: e.target.value })}
                        placeholder="Nhập tiêu đề mục (ví dụ: Câu hỏi mà bảng sinh_vien không trả lời nổi)..."
                        className="w-full text-lg sm:text-xl font-black text-slate-900 border-0 border-b border-transparent hover:border-slate-200 focus:border-orange-500 focus:outline-none py-1 bg-transparent transition"
                      />
                    </div>
                  )}

                  {/* 2. PARAGRAPH BLOCK */}
                  {block.type === 'paragraph' && (
                    <div className="space-y-1.5 pr-24">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                        <span>Đoạn văn bản</span>
                      </div>
                      <textarea
                        rows={Math.max(2, Math.min(8, (block.paragraphText || '').split('\n').length + 1))}
                        value={block.paragraphText || ''}
                        onChange={(e) => updateBlock(block.id, { paragraphText: e.target.value })}
                        placeholder="Gõ nội dung bài viết bình thường như trong Word... (Gõ `từ_khóa` để đóng khung từ khóa, **chữ** để in đậm)"
                        className="w-full text-sm text-slate-800 leading-relaxed border border-slate-100 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50/40 focus:bg-white transition"
                      />
                    </div>
                  )}

                  {/* 3. CALLOUT BOX (EXACT VISUAL MATCH) */}
                  {block.type === 'callout' && (
                    <div className="space-y-2.5 pr-14">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Màu khung:
                        </span>
                        <div className="flex items-center gap-1 text-xs">
                          <button
                            type="button"
                            onClick={() => handleSelectCalloutType(block, 'keypoint')}
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${block.calloutType === 'keypoint'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              }`}
                          >
                            Bản lề (Tím)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectCalloutType(block, 'tip')}
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${block.calloutType === 'tip'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                          >
                            Mẹo hay (Xanh lá)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectCalloutType(block, 'warning')}
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${block.calloutType === 'warning'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                              }`}
                          >
                            Cảnh báo (Vàng)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectCalloutType(block, 'info')}
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${block.calloutType === 'info'
                              ? 'bg-sky-600 text-white shadow-2xs'
                              : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                              }`}
                          >
                            Lưu ý (Xanh dương)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectCalloutType(block, 'exercise')}
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${block.calloutType === 'exercise'
                              ? 'bg-orange-600 text-white shadow-2xs'
                              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                              }`}
                          >
                            Bài tập (Cam)
                          </button>
                        </div>
                      </div>

                      {/* The Visual Box */}
                      <div
                        className={`rounded-2xl border p-5 shadow-xs relative overflow-hidden space-y-2.5 transition-colors ${block.calloutType === 'tip'
                          ? 'border-emerald-300 bg-emerald-50/50'
                          : block.calloutType === 'warning'
                            ? 'border-amber-300 bg-amber-50/50'
                            : block.calloutType === 'info'
                              ? 'border-sky-300 bg-sky-50/50'
                              : block.calloutType === 'exercise'
                                ? 'border-orange-300 bg-orange-50/50'
                                : 'border-indigo-400 bg-indigo-50/50'
                          }`}
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${block.calloutType === 'tip'
                            ? 'bg-emerald-500'
                            : block.calloutType === 'warning'
                              ? 'bg-amber-500'
                              : block.calloutType === 'info'
                                ? 'bg-sky-500'
                                : block.calloutType === 'exercise'
                                  ? 'bg-orange-500'
                                  : 'bg-indigo-600'
                            }`}
                        />

                        <div className="flex items-start gap-3">
                          {block.calloutType === 'tip' ? (
                            <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                          ) : block.calloutType === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                          ) : block.calloutType === 'info' ? (
                            <Info className="w-5 h-5 text-sky-600 shrink-0 mt-1" />
                          ) : block.calloutType === 'exercise' ? (
                            <BookOpen className="w-5 h-5 text-orange-600 shrink-0 mt-1" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
                          )}

                          <div className="flex-1 space-y-2.5">
                            <input
                              type="text"
                              value={block.calloutTitle || ''}
                              onChange={(e) => updateBlock(block.id, { calloutTitle: e.target.value })}
                              placeholder={
                                block.calloutType === 'exercise'
                                  ? 'Tiêu đề bài tập (ví dụ: Bài tập thực hành 1:)...'
                                  : 'Tiêu đề khung ghi chú (ví dụ: Đây là bài bản lề của cả khóa:)...'
                              }
                              className="w-full font-bold text-sm text-slate-900 bg-transparent border-0 border-b border-slate-300/60 pb-1 focus:outline-none focus:border-indigo-500 transition"
                            />
                            <textarea
                              rows={3}
                              value={block.calloutContent || ''}
                              onChange={(e) => updateBlock(block.id, { calloutContent: e.target.value })}
                              placeholder={
                                block.calloutType === 'exercise'
                                  ? 'Nhập yêu cầu hoặc câu hỏi bài tập cần học viên làm tại đây...'
                                  : 'Nhập nội dung cần đóng khung nổi bật...'
                              }
                              className="w-full text-xs sm:text-sm text-slate-800 leading-relaxed bg-transparent border-0 focus:outline-none resize-y"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. CODE BLOCK */}
                  {block.type === 'code' && (
                    <div className="space-y-3 pr-14">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Code2 className="w-3.5 h-3.5 text-orange-500" />
                          <span>Khối code lập trình</span>
                        </div>
                        <select
                          value={block.codeLang || 'sql'}
                          onChange={(e) => updateBlock(block.id, { codeLang: e.target.value })}
                          className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="sql">SQL</option>
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="python">Python</option>
                          <option value="html">HTML</option>
                          <option value="css">CSS</option>
                          <option value="json">JSON</option>
                          <option value="bash">Bash / Terminal</option>
                        </select>
                      </div>

                      {/* Code khởi tạo / Đề bài */}
                      <div className="space-y-1">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden shadow-2xs focus-within:bg-white focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
                          <SyntaxCodeEditor
                            value={block.codeText || ''}
                            onChange={(val) => updateBlock(block.id, { codeText: val })}
                            language={block.codeLang || 'sql'}
                            placeholder="Nhập code bài tập hoặc mã khởi tạo ở đây..."
                            rows={6}
                          />
                        </div>
                      </div>

                      {/* Đáp án mẫu (Xem đáp án) */}
                      {block.solutionCode === undefined ? (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => updateBlock(block.id, { solutionCode: '' })}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Thêm đáp án</span>
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-3.5 space-y-2.5 shadow-2xs animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                              <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span>Đáp án</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateBlock(block.id, { solutionCode: undefined })}
                              className="text-[11px] text-slate-400 hover:text-rose-600 font-bold transition cursor-pointer"
                              title="Xóa đáp án mẫu"
                            >
                              Xóa đáp án
                            </button>
                          </div>

                          <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden shadow-2xs focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10">
                            <SyntaxCodeEditor
                              value={block.solutionCode || ''}
                              onChange={(val) => updateBlock(block.id, { solutionCode: val })}
                              language={block.codeLang || 'sql'}
                              placeholder="Nhập code đáp án mẫu chính xác ở đây..."
                              rows={5}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. IMAGE BLOCK */}
                  {block.type === 'image' && (
                    <div className="space-y-2.5 pr-14">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>Hình ảnh minh họa</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Nạp ảnh từ máy tính hoặc dán URL
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        {/* Upload from Computer Button */}
                        <label className="border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/20 hover:bg-orange-50/50 transition-all rounded-xl px-4 py-2 flex items-center justify-center gap-2 cursor-pointer group text-center shrink-0">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                            className="hidden"
                            onChange={(e) => handleUploadBlockImage(block.id, e)}
                            disabled={uploadingImageBlockId === block.id}
                          />
                          {uploadingImageBlockId === block.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
                          ) : (
                            <UploadCloud className="w-3.5 h-3.5 text-orange-600 group-hover:scale-110 transition-transform" />
                          )}
                          <span className="text-xs font-bold text-slate-700 group-hover:text-orange-700">
                            {uploadingImageBlockId === block.id ? 'Đang tải ảnh...' : 'Nạp ảnh từ máy tính'}
                          </span>
                        </label>

                        {/* Caption input */}
                        <input
                          type="text"
                          value={block.imageCaption || ''}
                          onChange={(e) => updateBlock(block.id, { imageCaption: e.target.value })}
                          placeholder="Chú thích ảnh (tùy chọn)..."
                          className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                        />
                      </div>

                      {/* Direct URL input (optional fallback) */}
                      <input
                        type="url"
                        value={block.imageUrl || ''}
                        onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
                        placeholder="Hoặc dán link ảnh trực tiếp (https://...)"
                        className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white font-mono text-slate-700"
                      />

                      {/* Upload feedback */}
                      {imageUploadMsg[block.id] && (
                        <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${imageUploadMsg[block.id].type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                          {imageUploadMsg[block.id].type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                          <span>{imageUploadMsg[block.id].text}</span>
                        </div>
                      )}

                      {/* Image Preview */}
                      {block.imageUrl && (
                        <div className="mt-3 text-center p-3 rounded-2xl bg-slate-50 border border-slate-100 relative group/img">
                          <img
                            src={block.imageUrl}
                            alt={block.imageCaption || 'Preview'}
                            className="max-h-64 mx-auto rounded-xl object-cover shadow-2xs"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                            }}
                          />
                          {block.imageCaption && (
                            <p className="text-xs text-slate-500 italic mt-2">{block.imageCaption}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. VIDEO BLOCK */}
                  {block.type === 'video' && (
                    <div className="space-y-3 pr-14">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Video className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Khối Video bài giảng</span>
                        </div>

                        {/* Tier Badge */}
                        {isFreeCourse ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Youtube className="w-3 h-3 text-red-500" />
                            <span>Khóa Free: Dán link YouTube</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Crown className="w-3 h-3 text-amber-600" />
                            <span>Khóa PRO: Tải lên Cloudflare R2</span>
                          </span>
                        )}
                      </div>

                      {/* FREE COURSE: ONLY YOUTUBE LINK */}
                      {isFreeCourse ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="relative">
                            <Youtube className="w-3.5 h-3.5 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="url"
                              value={block.videoUrl || ''}
                              onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value })}
                              placeholder="Dán link YouTube (https://www.youtube.com/watch?v=... hoặc https://youtu.be/...)"
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white font-mono"
                            />
                          </div>
                          <input
                            type="text"
                            value={block.videoCaption || ''}
                            onChange={(e) => updateBlock(block.id, { videoCaption: e.target.value })}
                            placeholder="Chú thích hoặc tiêu đề video (tùy chọn)..."
                            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                          />
                        </div>
                      ) : (
                        /* PRO COURSE: UPLOAD TO R2 OR PICK FROM R2 LIBRARY */
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {/* Upload Button */}
                            <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 transition-all rounded-xl px-3.5 py-2 flex items-center justify-center gap-2 cursor-pointer group text-center shrink-0">
                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.mkv"
                                className="hidden"
                                onChange={(e) => handleUploadBlockVideo(block.id, e)}
                                disabled={uploadingBlockId === block.id}
                              />
                              {uploadingBlockId === block.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                              ) : (
                                <UploadCloud className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                              )}
                              <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700">
                                {uploadingBlockId === block.id ? 'Đang tải lên R2...' : 'Tải video lên R2'}
                              </span>
                            </label>

                            {/* Existing R2 videos selector */}
                            {availableVideos.length > 0 && (
                              <select
                                value={block.videoUrl || ''}
                                onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value })}
                                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none cursor-pointer max-w-xs truncate"
                                title="Chọn từ danh sách video R2 đã có"
                              >
                                <option value="">-- Chọn video R2 đã có --</option>
                                {availableVideos.map(v => (
                                  <option key={v.id} value={v.storageUrl}>
                                    {v.title || v.filename}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Caption */}
                            <input
                              type="text"
                              value={block.videoCaption || ''}
                              onChange={(e) => updateBlock(block.id, { videoCaption: e.target.value })}
                              placeholder="Chú thích video (tùy chọn)..."
                              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                            />
                          </div>

                          {/* Direct R2 URL field */}
                          <input
                            type="text"
                            value={block.videoUrl || ''}
                            onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value })}
                            placeholder="Đường dẫn file video Cloudflare R2 (https://...)"
                            className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white font-mono text-indigo-900"
                          />

                          {blockUploadMsg[block.id] && (
                            <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${blockUploadMsg[block.id].type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}>
                              {blockUploadMsg[block.id].type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                              <span>{blockUploadMsg[block.id].text}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Video Player Preview */}
                      {block.videoUrl && (
                        <div className="mt-3 text-center p-3 rounded-2xl bg-slate-900 border border-slate-800 max-w-2xl mx-auto overflow-hidden">
                          {extractYoutubeId(block.videoUrl) ? (
                            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md">
                              <iframe
                                src={`https://www.youtube.com/embed/${extractYoutubeId(block.videoUrl)}`}
                                title={block.videoCaption || 'Video xem trước'}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <video
                              src={block.videoUrl}
                              controls
                              className="aspect-video w-full rounded-xl object-contain bg-black shadow-md"
                              onError={(e) => {
                                (e.target as any).style.display = 'none';
                              }}
                            />
                          )}
                          {block.videoCaption && (
                            <p className="text-xs text-slate-300 italic mt-2">{block.videoCaption}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7. TABLE BLOCK */}
                  {block.type === 'table' && block.tableData && (
                    <div className="space-y-3 pr-14">
                      {/* Top Control Bar of Table */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <Table className="w-4 h-4 text-blue-600" />
                            <span>Khối Bảng</span>
                          </div>

                          <div className="h-4 w-px bg-slate-200" />

                          {/* Column count stepper */}
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-2xs">
                            <span className="text-[11px] text-slate-400">Cột:</span>
                            <button
                              type="button"
                              disabled={block.tableData.headers.length <= 1}
                              onClick={() => removeTableColumn(block.id)}
                              className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                              title="Giảm 1 cột"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-4 text-center font-bold text-blue-700">{block.tableData.headers.length}</span>
                            <button
                              type="button"
                              disabled={block.tableData.headers.length >= 8}
                              onClick={() => addTableColumn(block.id)}
                              className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                              title="Thêm 1 cột"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Row count stepper */}
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-2xs">
                            <span className="text-[11px] text-slate-400">Hàng:</span>
                            <button
                              type="button"
                              disabled={block.tableData.rows.length <= 1}
                              onClick={() => removeTableRow(block.id)}
                              className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                              title="Giảm 1 hàng"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-4 text-center font-bold text-blue-700">{block.tableData.rows.length}</span>
                            <button
                              type="button"
                              disabled={block.tableData.rows.length >= 50}
                              onClick={() => addTableRow(block.id)}
                              className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                              title="Thêm 1 hàng"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Formatting controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleApplyBoldToTableSelection(block.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer bg-slate-900 text-white hover:bg-slate-800 shadow-2xs active:scale-95"
                            title="Bôi đen văn bản trong ô rồi bấm nút này để in đậm"
                          >
                            <Bold className="w-3.5 h-3.5" />
                            <span>In đậm</span>
                          </button>
                        </div>
                      </div>

                      {/* Interactive Editable Table Grid */}
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                        <table className="w-full border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-slate-100/90 border-b border-slate-200">
                              <th className="w-10 px-2 py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                #
                              </th>
                              {block.tableData.headers.map((head, colIdx) => (
                                <th key={colIdx} className="p-2 border-l border-slate-200 min-w-[130px]">
                                  <div className="relative flex items-center">
                                    <input
                                      type="text"
                                      value={head}
                                      onFocus={(e) => {
                                        activeTableInputRef.current = {
                                          blockId: block.id,
                                          type: 'header',
                                          colIdx,
                                          element: e.currentTarget
                                        };
                                      }}
                                      onChange={(e) => updateTableHeader(block.id, colIdx, e.target.value)}
                                      placeholder={`Cột ${colIdx + 1}`}
                                      className={`w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-400 focus:outline-none transition text-center font-bold text-slate-800 text-xs sm:text-sm ${block.tableData!.headers.length > 1 ? 'pr-7' : ''
                                        }`}
                                    />
                                    {block.tableData!.headers.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeTableColumn(block.id, colIdx)}
                                        className="absolute right-1 text-slate-300 hover:text-rose-600 p-0.5 rounded cursor-pointer transition"
                                        title={`Xóa cột ${colIdx + 1}`}
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {block.tableData.rows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-slate-50/70 group/row transition-colors">
                                <td className="px-2 py-2 text-center text-xs font-bold text-slate-400 bg-slate-50/50">
                                  <div className="flex items-center justify-center gap-1">
                                    <span>{rowIdx + 1}</span>
                                    {block.tableData!.rows.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeTableRow(block.id, rowIdx)}
                                        className="opacity-0 group-hover/row:opacity-100 text-slate-300 hover:text-rose-600 p-0.5 rounded cursor-pointer transition"
                                        title={`Xóa hàng ${rowIdx + 1}`}
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                {row.map((cell, colIdx) => (
                                  <td key={colIdx} className="p-1.5 border-l border-slate-100">
                                    <input
                                      type="text"
                                      value={cell}
                                      onFocus={(e) => {
                                        activeTableInputRef.current = {
                                          blockId: block.id,
                                          type: 'cell',
                                          rowIdx,
                                          colIdx,
                                          element: e.currentTarget
                                        };
                                      }}
                                      onChange={(e) => updateTableCell(block.id, rowIdx, colIdx, e.target.value)}
                                      placeholder="..."
                                      className={`w-full bg-white border border-transparent hover:border-slate-200 focus:border-blue-400 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs sm:text-sm text-slate-800 transition text-left ${cell.startsWith('**') && cell.endsWith('**') && cell.length >= 4 ? 'font-bold text-slate-900' : 'font-normal'
                                        }`}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 8. QUIZ BLOCK (Khối Trắc Nghiệm) */}
                  {block.type === 'quiz' && block.quizData && (
                    <div className="space-y-4 pr-14">
                      {/* Top Bar of Quiz Block */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-purple-50/80 border border-purple-200/80 rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-purple-950 block">Khối Câu Hỏi Trắc Nghiệm</span>
                            <span className="text-[11px] text-purple-700">Tạo câu hỏi tương tác nhiều lựa chọn kiểm tra kiến thức</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const currentOpts = block.quizData?.options || [];
                            const nextLetter = String.fromCharCode(65 + currentOpts.length);
                            const newOpt: EditorQuizOption = {
                              id: `opt_${Date.now()}_${currentOpts.length + 1}`,
                              text: `Phương án ${nextLetter}`,
                              isCorrect: false
                            };
                            updateBlock(block.id, {
                              quizData: {
                                ...block.quizData!,
                                options: [...currentOpts, newOpt]
                              }
                            });
                          }}
                          disabled={(block.quizData.options?.length || 0) >= 6}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm phương án</span>
                        </button>
                      </div>

                      {/* Question Textarea */}
                      {/* Title and Question */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Tiêu đề khối (tùy chọn):
                          </label>
                          <input
                            type="text"
                            value={block.quizData.title || ''}
                            onChange={(e) => updateBlock(block.id, {
                              quizData: {
                                ...block.quizData!,
                                title: e.target.value
                              }
                            })}
                            placeholder="Ví dụ: Kiểm tra nhanh, Khởi động..."
                            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm font-semibold text-slate-800 transition"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                            <span>Nội dung câu hỏi:</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            rows={2}
                            value={block.quizData.question || ''}
                            onChange={(e) => updateBlock(block.id, {
                              quizData: {
                                ...block.quizData!,
                                question: e.target.value
                              }
                            })}
                            placeholder="Nhập nội dung câu hỏi trắc nghiệm chi tiết tại đây..."
                            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm font-semibold text-slate-900 resize-none transition"
                          />
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>Các phương án lựa chọn (Bấm nút tròn để chọn 1 đáp án đúng):</span>
                          <span className="text-[11px] font-normal text-slate-400">Tối thiểu 2, tối đa 6 phương án</span>
                        </label>
                        <div className="space-y-2">
                          {block.quizData.options.map((opt, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            return (
                              <div
                                key={opt.id || optIdx}
                                className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
                                  opt.isCorrect 
                                    ? 'border-emerald-300 bg-emerald-50/60 shadow-xs' 
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                {/* Radio check for correct answer */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedOpts = block.quizData!.options.map((o, idx) => ({
                                      ...o,
                                      isCorrect: idx === optIdx
                                    }));
                                    updateBlock(block.id, {
                                      quizData: {
                                        ...block.quizData!,
                                        options: updatedOpts
                                      }
                                    });
                                  }}
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all cursor-pointer ${
                                    opt.isCorrect
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                  title={opt.isCorrect ? 'Đáp án đúng' : 'Bấm để chọn làm đáp án đúng'}
                                >
                                  {opt.isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : letter}
                                </button>

                                {/* Option text input */}
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => {
                                    const updatedOpts = block.quizData!.options.map((o, idx) => 
                                      idx === optIdx ? { ...o, text: e.target.value } : o
                                    );
                                    updateBlock(block.id, {
                                      quizData: {
                                        ...block.quizData!,
                                        options: updatedOpts
                                      }
                                    });
                                  }}
                                  placeholder={`Nội dung phương án ${letter}...`}
                                  className={`flex-1 bg-transparent px-2.5 py-1.5 text-xs sm:text-sm focus:outline-none ${
                                    opt.isCorrect ? 'font-bold text-emerald-950' : 'font-normal text-slate-800'
                                  }`}
                                />

                                {opt.isCorrect && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-800 shrink-0">
                                    Đáp án đúng
                                  </span>
                                )}

                                {/* Delete option button if > 2 */}
                                {block.quizData!.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const remaining = block.quizData!.options.filter((_, idx) => idx !== optIdx);
                                      if (opt.isCorrect && remaining.length > 0) {
                                        remaining[0].isCorrect = true;
                                      }
                                      updateBlock(block.id, {
                                        quizData: {
                                          ...block.quizData!,
                                          options: remaining
                                        }
                                      });
                                    }}
                                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                    title="Xóa phương án này"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Explanation Input */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>Lời giải thích chi tiết (hiển thị khi học viên trả lời xong):</span>
                        </label>
                        <input
                          type="text"
                          value={block.quizData.explanation || ''}
                          onChange={(e) => updateBlock(block.id, {
                            quizData: {
                              ...block.quizData!,
                              explanation: e.target.value
                            }
                          })}
                          placeholder="Giải thích vì sao đáp án này đúng, căn cứ kiến thức bài học..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 text-xs text-slate-700 transition"
                        />
                      </div>
                    </div>
                  )}

                  {/* 8. FLASHCARD BLOCK */}
                  {block.type === 'flashcard' && block.flashcardData && (
                    <div className="space-y-4 pr-14">
                      {/* Flashcard Header / Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-indigo-950 block">Khối Flashcard (Thẻ ghi nhớ lật tương tác)</span>
                            <span className="text-[11px] text-indigo-700">Bộ thẻ ôn tập 3D lật mặt giúp người học tự kiểm tra kiến thức</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const currentCards = block.flashcardData?.cards || [];
                            const newCard: EditorFlashcardItem = {
                              id: `card_${Date.now()}_${currentCards.length + 1}`,
                              front: `Khái niệm / Câu hỏi ${currentCards.length + 1}`,
                              back: `Câu trả lời / Giải thích chi tiết cho thẻ ${currentCards.length + 1}`
                            };
                            updateBlock(block.id, {
                              flashcardData: {
                                ...block.flashcardData!,
                                cards: [...currentCards, newCard]
                              }
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm thẻ mới</span>
                        </button>
                      </div>

                      {/* Title & Description Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Tiêu đề bộ thẻ:
                          </label>
                          <input
                            type="text"
                            value={block.flashcardData.title || ''}
                            onChange={(e) => updateBlock(block.id, {
                              flashcardData: {
                                ...block.flashcardData!,
                                title: e.target.value
                              }
                            })}
                            placeholder="Ví dụ: Ôn nhanh bằng flashcard"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs font-semibold text-slate-900 transition"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Mô tả / Hướng dẫn:
                          </label>
                          <input
                            type="text"
                            value={block.flashcardData.description || ''}
                            onChange={(e) => updateBlock(block.id, {
                              flashcardData: {
                                ...block.flashcardData!,
                                description: e.target.value
                              }
                            })}
                            placeholder="Ví dụ: Nhấp vào từng thẻ để lật và tự kiểm tra trước khi làm quiz."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs text-slate-700 transition"
                          />
                        </div>
                      </div>

                      {/* Cards List */}
                      <div className="space-y-3 pt-1">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>Danh sách thẻ trong bộ ({block.flashcardData.cards.length} thẻ):</span>
                        </label>

                        {block.flashcardData.cards.map((card, cardIdx) => (
                          <div
                            key={card.id || cardIdx}
                            className="p-3.5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/30 via-white to-purple-50/20 space-y-3 relative group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                                Thẻ #{cardIdx + 1}
                              </span>

                              {block.flashcardData!.cards.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const remaining = block.flashcardData!.cards.filter((_, idx) => idx !== cardIdx);
                                    updateBlock(block.id, {
                                      flashcardData: {
                                        ...block.flashcardData!,
                                        cards: remaining
                                      }
                                    });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1"
                                  title="Xóa thẻ này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* FRONT INPUT */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-indigo-800 flex items-center gap-1">
                                  <span>Mặt trước (Khái niệm / Câu hỏi):</span>
                                </label>
                                <textarea
                                  rows={3}
                                  value={card.front}
                                  onChange={(e) => {
                                    const updatedCards = block.flashcardData!.cards.map((c, idx) => 
                                      idx === cardIdx ? { ...c, front: e.target.value } : c
                                    );
                                    updateBlock(block.id, {
                                      flashcardData: {
                                        ...block.flashcardData!,
                                        cards: updatedCards
                                      }
                                    });
                                  }}
                                  placeholder="Nhập câu hỏi hoặc khái niệm cần ghi nhớ..."
                                  className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs text-slate-900 resize-y"
                                />
                              </div>

                              {/* BACK INPUT */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                                  <span>Mặt sau (Giải thích / Đáp án):</span>
                                </label>
                                <textarea
                                  rows={3}
                                  value={card.back}
                                  onChange={(e) => {
                                    const updatedCards = block.flashcardData!.cards.map((c, idx) => 
                                      idx === cardIdx ? { ...c, back: e.target.value } : c
                                    );
                                    updateBlock(block.id, {
                                      flashcardData: {
                                        ...block.flashcardData!,
                                        cards: updatedCards
                                      }
                                    });
                                  }}
                                  placeholder="Nhập câu trả lời hoặc định nghĩa chi tiết..."
                                  className="w-full p-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 text-xs text-slate-900 resize-y"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))}

              {/* Add Block Bottom Banner */}
              <div className="p-4 sm:p-5 rounded-3xl border-2 border-dashed border-slate-200 bg-white/90 space-y-3">
                <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-orange-500" />
                  <span>Thêm khối tiếp theo:</span>
                </div>

                <div className="flex flex-wrap items-center justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => addBlock('paragraph')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>Đoạn văn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('heading')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Heading2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Tiêu đề mục (H2)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('callout', { calloutType: 'tip' })}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200/80 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>Khối Ghi Chú</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('flashcard')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/80 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Khối Flashcard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('quiz')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200/80 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                    <span>Khối Trắc Nghiệm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('table')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Khối Bảng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('code')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Code2 className="w-3.5 h-3.5 text-orange-400" />
                    <span>Khối Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('image')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Hình ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlock('video')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/80 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RAW TEXT MARKDOWN */}
        {activeTab === 'RAW' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Mã nguồn văn bản bài học (Markdown)
              </label>
              <span className="text-[11px] text-slate-400">
                Chế độ xem mã nguồn dành cho người dùng chuyên sâu
              </span>
            </div>
            <textarea
              rows={20}
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Nhập nội dung markdown thô..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        )}

        {/* TAB 3: LIVE PREVIEW (GIAO DIỆN HỌC VIÊN CHUẨN SÁNG) */}
        {activeTab === 'PREVIEW' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm space-y-6">

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium flex-wrap">
              <span>Trang chủ</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span>{course?.name}</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-700 font-semibold">{chapter?.title}</span>
            </div>

            <div className="space-y-2 border-b border-slate-100 pb-5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {title || 'Tiêu đề bài học chưa đặt'}
              </h1>
              {blocks.some(b => b.type === 'video' && b.videoUrl?.trim()) && (
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold border border-indigo-100">
                    <Video className="w-3.5 h-3.5" />
                    <span>Có video bài giảng</span>
                  </span>
                </div>
              )}
            </div>

            {currentPreviewContent ? (
              <HypertextRenderer content={currentPreviewContent} />
            ) : (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl">
                Chưa có nội dung nào trong bài học.
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
};
