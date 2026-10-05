import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  Code2, 
  Image as ImageIcon, 
  Video, 
  Eye, 
  Edit3, 
  Save, 
  ChevronRight, 
  Clock, 
  Heading2, 
  AlignLeft, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Layers, 
  FileCode,
  Check
} from 'lucide-react';
import { Lesson } from '../types';
import { HypertextRenderer } from './HypertextRenderer';

export type BlockType = 'heading' | 'paragraph' | 'callout' | 'code' | 'image' | 'video';

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
}

interface LessonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
  initialLesson?: Lesson | null;
  chapterTitle?: string;
  courseName?: string;
}

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

    // 2. Callout block (:::keypoint, :::tip, etc.)
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

    // 5. Paragraph
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
      !lines[i].trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
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
    }
  }

  return parts.join('\n\n');
};

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLesson,
  chapterTitle = 'Chương 1',
  courseName = 'Khóa học'
}) => {
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'RAW' | 'PREVIEW'>('VISUAL');
  const [title, setTitle] = useState<string>(initialLesson?.title || '');
  const [durationMinutes, setDurationMinutes] = useState<number>(initialLesson?.durationMinutes || 15);
  const [videoUrl, setVideoUrl] = useState<string>(initialLesson?.videoUrl || '');
  
  // Visual blocks state
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  // Raw markdown (synced)
  const [rawContent, setRawContent] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialLesson) {
        setTitle(initialLesson.title || '');
        setDurationMinutes(initialLesson.durationMinutes || 15);
        setVideoUrl(initialLesson.videoUrl || '');
        const parsed = parseMarkdownToBlocks(initialLesson.content || '');
        setBlocks(parsed);
        setRawContent(initialLesson.content || '');
      } else {
        setTitle('');
        setDurationMinutes(15);
        setVideoUrl('');
        const sampleBlocks: EditorBlock[] = [
          {
            id: 'b1',
            type: 'paragraph',
            paragraphText: 'Nhập nội dung mở đầu bài học ở đây để giải thích khái niệm cơ bản...'
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
      setActiveTab('VISUAL');
    }
  }, [initialLesson, isOpen]);

  if (!isOpen) return null;

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
    }

    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<EditorBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) {
      // Keep at least one empty paragraph
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

  // Sync to raw markdown before switching to RAW or PREVIEW
  const handleSwitchTab = (targetTab: 'VISUAL' | 'RAW' | 'PREVIEW') => {
    if (activeTab === 'VISUAL') {
      setRawContent(serializeBlocksToMarkdown(blocks));
    } else if (activeTab === 'RAW') {
      setBlocks(parseMarkdownToBlocks(rawContent));
    }
    setActiveTab(targetTab);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài học!');
      return;
    }
    const finalContent = activeTab === 'RAW' ? rawContent.trim() : serializeBlocksToMarkdown(blocks).trim();
    
    const savedLesson: Lesson = {
      id: initialLesson?.id || `les_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      orderIndex: initialLesson?.orderIndex ?? 1,
      durationMinutes: Number(durationMinutes) || 15,
      content: finalContent,
      videoUrl: videoUrl.trim() || undefined,
      updatedAt: new Date().toISOString()
    };
    onSave(savedLesson);
    onClose();
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const embedVideoSrc = getEmbedUrl(videoUrl);
  const currentPreviewContent = activeTab === 'RAW' ? rawContent : serializeBlocksToMarkdown(blocks);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 truncate">
                {initialLesson ? 'Chỉnh Sửa Bài Giảng' : 'Tạo Bài Giảng Mới'}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {courseName} &bull; <span className="font-semibold text-slate-700">{chapterTitle}</span>
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => handleSwitchTab('VISUAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'VISUAL'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Soạn thảo trực quan kiểu Word, thấy trước ngay các khung đóng hộp"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Soạn trực quan (Kiểu Word)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab('PREVIEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'PREVIEW'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem trước (Preview)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab('RAW')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  activeTab === 'RAW'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Chế độ mã nguồn văn bản thô"
              >
                <FileCode className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          
          {/* Main Info Card (Always visible at top) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Tên bài học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Tư duy quan hệ và INNER JOIN"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Thời lượng (phút)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Video link */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Video bài giảng đính kèm (Tùy chọn)</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  Dán link YouTube (https://youtube.com/watch?v=...) hoặc để trống
                </span>
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition font-mono"
              />
            </div>
          </div>

          {/* TAB 1: SOẠN THẢO TRỰC QUAN (KIỂU WORD / NOTION) */}
          {activeTab === 'VISUAL' && (
            <div className="space-y-4">
              
              {/* Visual Toolbar (Thanh công cụ chèn nội dung) */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-2.5 shadow-sm flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
                  <span>+ Chèn vào bài:</span>
                </span>

                {/* Button Add Paragraph */}
                <button
                  type="button"
                  onClick={() => addBlock('paragraph')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Thêm đoạn văn bản thường"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đoạn văn</span>
                </button>

                {/* Button Add Heading */}
                <button
                  type="button"
                  onClick={() => addBlock('heading')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Thêm tiêu đề mục lớn"
                >
                  <Heading2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Tiêu đề mục</span>
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Button Add Keypoint Box */}
                <button
                  type="button"
                  onClick={() => addBlock('callout', { calloutType: 'keypoint' })}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/80 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Hộp đóng khung ghi chú bản lề (màu tím/xanh neon)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Khung Bản Lề</span>
                </button>

                {/* Button Add Tip Box */}
                <button
                  type="button"
                  onClick={() => addBlock('callout', { calloutType: 'tip' })}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/80 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Hộp đóng khung mẹo hay (màu xanh lá)"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Khung Mẹo Hay</span>
                </button>

                {/* Button Add Warning Box */}
                <button
                  type="button"
                  onClick={() => addBlock('callout', { calloutType: 'warning' })}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200/80 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Hộp đóng khung cảnh báo (màu vàng)"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Khung Cảnh Báo</span>
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Button Add Code */}
                <button
                  type="button"
                  onClick={() => addBlock('code')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-slate-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Chèn khối code có định dạng cú pháp"
                >
                  <Code2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Khối Code</span>
                </button>

                {/* Button Add Image */}
                <button
                  type="button"
                  onClick={() => addBlock('image')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Chèn ảnh minh họa"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hình ảnh</span>
                </button>
              </div>

              {/* Blocks Canvas (Trang tài liệu trực quan) */}
              <div className="space-y-4 pb-12">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="relative group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-orange-300 transition-all p-4 space-y-2.5"
                  >
                    {/* Block Toolbar Floating on Right Top */}
                    <div className="absolute right-3 top-3 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs z-10">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 'UP')}
                        disabled={index === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                        title="Di chuyển lên"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 'DOWN')}
                        disabled={index === blocks.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-3 w-px bg-slate-200 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Xóa khối này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 1. BLOCK: HEADING */}
                    {block.type === 'heading' && (
                      <div className="space-y-1 pr-20">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Heading2 className="w-3 h-3 text-orange-500" />
                          <span>Tiêu đề mục lớn (H2)</span>
                        </div>
                        <input
                          type="text"
                          value={block.headingText || ''}
                          onChange={(e) => updateBlock(block.id, { headingText: e.target.value })}
                          placeholder="Nhập tiêu đề mục (ví dụ: Câu hỏi mà bảng sinh_vien không trả lời nổi)..."
                          className="w-full text-base sm:text-lg font-black text-slate-900 border-0 border-b border-transparent hover:border-slate-200 focus:border-orange-500 focus:outline-none py-1 bg-transparent placeholder:text-slate-300 transition"
                        />
                      </div>
                    )}

                    {/* 2. BLOCK: PARAGRAPH */}
                    {block.type === 'paragraph' && (
                      <div className="space-y-1 pr-20">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <AlignLeft className="w-3 h-3 text-slate-400" />
                          <span>Đoạn văn bản thường</span>
                        </div>
                        <textarea
                          rows={Math.max(2, Math.min(8, (block.paragraphText || '').split('\n').length + 1))}
                          value={block.paragraphText || ''}
                          onChange={(e) => updateBlock(block.id, { paragraphText: e.target.value })}
                          placeholder="Gõ nội dung bài viết tự nhiên như trong Word... (Gõ `từ_khóa` để đóng khung từ khóa, **chữ** để in đậm)"
                          className="w-full text-xs sm:text-sm text-slate-800 leading-relaxed border border-slate-100 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-slate-50/30 focus:bg-white transition"
                        />
                      </div>
                    )}

                    {/* 3. BLOCK: CALLOUT BOX (WYSIWYG EXACT LOOK) */}
                    {block.type === 'callout' && (
                      <div className="space-y-2 pr-12">
                        {/* Callout Type Selector Pills */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Loại khung:
                          </span>
                          <div className="flex items-center gap-1 text-xs">
                            <button
                              type="button"
                              onClick={() => updateBlock(block.id, { calloutType: 'keypoint' })}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
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
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
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
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
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
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                                block.calloutType === 'info'
                                  ? 'bg-sky-600 text-white shadow-2xs'
                                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                              }`}
                            >
                              Lưu ý (Xanh dương)
                            </button>
                          </div>
                        </div>

                        {/* Visually Styled Box - Just like Sydexa! */}
                        <div
                          className={`rounded-2xl border p-4 shadow-2xs relative overflow-hidden space-y-2 transition-colors ${
                            block.calloutType === 'tip'
                              ? 'border-emerald-300 bg-emerald-50/50'
                              : block.calloutType === 'warning'
                              ? 'border-amber-300 bg-amber-50/50'
                              : block.calloutType === 'info'
                              ? 'border-sky-300 bg-sky-50/50'
                              : 'border-indigo-400 bg-indigo-50/50'
                          }`}
                        >
                          {/* Accent Bar */}
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

                          <div className="flex items-start gap-2.5">
                            {block.calloutType === 'tip' ? (
                              <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                            ) : block.calloutType === 'warning' ? (
                              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                            ) : block.calloutType === 'info' ? (
                              <Info className="w-5 h-5 text-sky-600 shrink-0 mt-1" />
                            ) : (
                              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
                            )}

                            <div className="flex-1 space-y-2">
                              {/* Editable Callout Title */}
                              <input
                                type="text"
                                value={block.calloutTitle || ''}
                                onChange={(e) => updateBlock(block.id, { calloutTitle: e.target.value })}
                                placeholder="Tiêu đề khung (ví dụ: Đây là bài bản lề của cả khóa:)..."
                                className="w-full font-bold text-sm text-slate-900 bg-transparent border-0 border-b border-slate-300/60 pb-1 focus:outline-none focus:border-indigo-500 transition"
                              />

                              {/* Editable Callout Body */}
                              <textarea
                                rows={3}
                                value={block.calloutContent || ''}
                                onChange={(e) => updateBlock(block.id, { calloutContent: e.target.value })}
                                placeholder="Nhập nội dung cần đóng khung ghi nhớ..."
                                className="w-full text-xs sm:text-sm text-slate-800 leading-relaxed bg-transparent border-0 focus:outline-none resize-y"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. BLOCK: CODE SNIPPET */}
                    {block.type === 'code' && (
                      <div className="space-y-2 pr-12">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Code2 className="w-3 h-3 text-orange-500" />
                            <span>Khối mã code lập trình</span>
                          </div>
                          <select
                            value={block.codeLang || 'sql'}
                            onChange={(e) => updateBlock(block.id, { codeLang: e.target.value })}
                            className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 focus:outline-none cursor-pointer"
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

                        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xs">
                          <textarea
                            rows={4}
                            value={block.codeText || ''}
                            onChange={(e) => updateBlock(block.id, { codeText: e.target.value })}
                            placeholder="Nhập đoạn mã code ở đây..."
                            className="w-full p-3 bg-transparent text-xs font-mono text-emerald-300 focus:outline-none resize-y leading-relaxed"
                          />
                        </div>
                      </div>
                    )}

                    {/* 5. BLOCK: IMAGE */}
                    {block.type === 'image' && (
                      <div className="space-y-2 pr-12">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <ImageIcon className="w-3 h-3 text-slate-500" />
                          <span>Hình ảnh minh họa</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="url"
                            value={block.imageUrl || ''}
                            onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
                            placeholder="Dán link ảnh (https://...)"
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white"
                          />
                          <input
                            type="text"
                            value={block.imageCaption || ''}
                            onChange={(e) => updateBlock(block.id, { imageCaption: e.target.value })}
                            placeholder="Chú thích ảnh (tùy chọn)..."
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white"
                          />
                        </div>
                        {block.imageUrl && (
                          <div className="mt-2 text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <img
                              src={block.imageUrl}
                              alt={block.imageCaption || 'Preview'}
                              className="max-h-48 mx-auto rounded-lg object-cover shadow-2xs"
                              onError={(e) => {
                                (e.target as any).style.display = 'none';
                              }}
                            />
                            {block.imageCaption && (
                              <p className="text-[11px] text-slate-500 italic mt-1">{block.imageCaption}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                ))}

                {/* Add Block Quick Bar at Bottom */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white/90 space-y-2.5">
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-orange-500" />
                    <span>Thêm khối tiếp theo:</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => addBlock('paragraph')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      Đoạn văn
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock('heading')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      Tiêu đề mục (H2)
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock('callout', { calloutType: 'keypoint' })}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white transition cursor-pointer"
                    >
                      Khung Bản Lề
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock('callout', { calloutType: 'tip' })}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition cursor-pointer"
                    >
                      Khung Mẹo Hay
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock('callout', { calloutType: 'warning' })}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white transition cursor-pointer"
                    >
                      Khung Cảnh Báo
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock('code')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer"
                    >
                      Khối Code
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock('image')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                    >
                      Hình ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock('video')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/80 transition cursor-pointer"
                    >
                      Video
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOẠN THẢO RAW TEXT (NẾU CẦN COPY PASTE NHANH) */}
          {activeTab === 'RAW' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Mã nguồn văn bản bài học (Markdown)
                </label>
                <span className="text-[11px] text-slate-400">
                  Chế độ nâng cao cho người quen dùng Markdown
                </span>
              </div>
              <textarea
                rows={16}
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Nhập nội dung thô..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
            </div>
          )}

          {/* TAB 3: XEM TRƯỚC (LIVE PREVIEW CHUẨN GIAO DIỆN SÁNG) */}
          {activeTab === 'PREVIEW' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-sm max-w-3xl mx-auto space-y-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium flex-wrap">
                <span>Trang chủ</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span>{courseName}</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-slate-700 font-semibold">{chapterTitle}</span>
              </div>

              {/* Title & Meta */}
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {title || 'Tiêu đề bài học chưa đặt'}
                </h1>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                    <Clock className="w-3 h-3 text-orange-500" />
                    <span>{durationMinutes || 15} phút học</span>
                  </span>
                  {videoUrl && (
                    <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                      <Video className="w-3 h-3" />
                      <span>Có video bài giảng</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Embedded Video */}
              {embedVideoSrc && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black aspect-video my-4">
                  <iframe
                    src={embedVideoSrc}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* Rendered Hypertext Content */}
              {currentPreviewContent ? (
                <HypertextRenderer content={currentPreviewContent} />
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  Chưa có nội dung nào trong bài học.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu Bài Giảng Này</span>
          </button>
        </div>

      </div>
    </div>
  );
};
