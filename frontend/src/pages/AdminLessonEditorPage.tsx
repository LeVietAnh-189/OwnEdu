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
  Table,
  StickyNote,
  AlignCenter,
  AlignRight,
  Bold,
  Minus,
  X
} from 'lucide-react';
import { AdminAPI, VideoAPI, ImageAPI } from '../services/api';
import { Course, Chapter, Lesson, VideoItem } from '../types';
import { HypertextRenderer } from '../components/HypertextRenderer';

export type BlockType = 'heading' | 'paragraph' | 'callout' | 'code' | 'image' | 'video' | 'table';

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
  calloutType?: 'keypoint' | 'tip' | 'warning' | 'info';
  calloutTitle?: string;
  calloutContent?: string;
  codeLang?: string;
  codeText?: string;
  imageUrl?: string;
  imageCaption?: string;
  videoUrl?: string;
  videoCaption?: string;
  tableData?: EditorTableData;
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

    // 1. Heading (## or #)
    if (line.startsWith('## ') || line.startsWith('# ')) {
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

    // 3. Callout block (:::keypoint, :::tip, etc.)
    if (line.trim().startsWith(':::')) {
      const header = line.trim().slice(3).trim();
      const spaceIdx = header.indexOf(' ');
      const rawType = (spaceIdx !== -1 ? header.slice(0, spaceIdx) : header).toLowerCase();
      const validTypes: ('keypoint' | 'tip' | 'warning' | 'info')[] = ['keypoint', 'tip', 'warning', 'info'];
      const calloutType = validTypes.includes(rawType as any) ? (rawType as any) : 'keypoint';
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
      blocks.push({
        id: `blk_${Date.now()}_${counter++}`,
        type: 'code',
        codeLang,
        codeText: codeLines.join('\n')
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
      parts.push(`\`\`\`${lang}\n${code}\n\`\`\``);
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
        VideoAPI.list().then(vids => setAvailableVideos(vids)).catch(() => {});
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
        newBlock.calloutType === 'warning' ? 'Cảnh báo quan trọng:' : 'Thông tin bổ sung:'
      );
      newBlock.calloutContent = 'Nhập nội dung cần đóng khung nổi bật ở đây...';
    } else if (type === 'code') {
      newBlock.codeLang = extra?.codeLang || 'sql';
      newBlock.codeText = '-- Viết câu lệnh truy vấn mẫu ở đây\nSELECT * FROM sinh_vien;';
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'VISUAL'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'PREVIEW'
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
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                activeTab === 'RAW'
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 ${
                  course.status === 'draft'
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
                            onClick={() => updateBlock(block.id, { calloutType: 'keypoint' })}
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              block.calloutType === 'keypoint'
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            }`}
                          >
                            Bản lề (Tím)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBlock(block.id, { calloutType: 'tip' })}
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              block.calloutType === 'tip'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            Mẹo hay (Xanh lá)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBlock(block.id, { calloutType: 'warning' })}
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              block.calloutType === 'warning'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                            }`}
                          >
                            Cảnh báo (Vàng)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBlock(block.id, { calloutType: 'info' })}
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              block.calloutType === 'info'
                                ? 'bg-sky-600 text-white shadow-2xs'
                                : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                            }`}
                          >
                            Lưu ý (Xanh dương)
                          </button>
                        </div>
                      </div>

                      {/* The Visual Box */}
                      <div
                        className={`rounded-2xl border p-5 shadow-xs relative overflow-hidden space-y-2.5 transition-colors ${
                          block.calloutType === 'tip'
                            ? 'border-emerald-300 bg-emerald-50/50'
                            : block.calloutType === 'warning'
                            ? 'border-amber-300 bg-amber-50/50'
                            : block.calloutType === 'info'
                            ? 'border-sky-300 bg-sky-50/50'
                            : 'border-indigo-400 bg-indigo-50/50'
                        }`}
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            block.calloutType === 'tip'
                              ? 'bg-emerald-500'
                              : block.calloutType === 'warning'
                              ? 'bg-amber-500'
                              : block.calloutType === 'info'
                              ? 'bg-sky-500'
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
                          ) : (
                            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
                          )}

                          <div className="flex-1 space-y-2.5">
                            <input
                              type="text"
                              value={block.calloutTitle || ''}
                              onChange={(e) => updateBlock(block.id, { calloutTitle: e.target.value })}
                              placeholder="Tiêu đề khung ghi chú (ví dụ: Đây là bài bản lề của cả khóa:)..."
                              className="w-full font-bold text-sm text-slate-900 bg-transparent border-0 border-b border-slate-300/60 pb-1 focus:outline-none focus:border-indigo-500 transition"
                            />
                            <textarea
                              rows={3}
                              value={block.calloutContent || ''}
                              onChange={(e) => updateBlock(block.id, { calloutContent: e.target.value })}
                              placeholder="Nhập nội dung cần đóng khung nổi bật..."
                              className="w-full text-xs sm:text-sm text-slate-800 leading-relaxed bg-transparent border-0 focus:outline-none resize-y"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. CODE BLOCK */}
                  {block.type === 'code' && (
                    <div className="space-y-2 pr-14">
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

                      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xs">
                        <textarea
                          rows={5}
                          value={block.codeText || ''}
                          onChange={(e) => updateBlock(block.id, { codeText: e.target.value })}
                          placeholder="Nhập code ở đây..."
                          className="w-full p-4 bg-transparent text-xs sm:text-sm font-mono text-emerald-300 focus:outline-none resize-y leading-relaxed"
                        />
                      </div>
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
                        <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                          imageUploadMsg[block.id].type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
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
                            <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                              blockUploadMsg[block.id].type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
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
                                      className={`w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-400 focus:outline-none transition text-center font-bold text-slate-800 text-xs sm:text-sm ${
                                        block.tableData!.headers.length > 1 ? 'pr-7' : ''
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
                                      className={`w-full bg-white border border-transparent hover:border-slate-200 focus:border-blue-400 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs sm:text-sm text-slate-800 transition text-left ${
                                        cell.startsWith('**') && cell.endsWith('**') && cell.length >= 4 ? 'font-bold text-slate-900' : 'font-normal'
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
