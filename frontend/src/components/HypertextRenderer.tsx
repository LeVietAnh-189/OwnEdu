import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';

const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.trim().match(regExp);
  return match ? match[1] : null;
};

interface HypertextRendererProps {
  content: string;
  className?: string;
}

export const HypertextRenderer: React.FC<HypertextRendererProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse inline styles: **bold**, *italic*, `code`, [link](url)
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex for inline code: `code`
    // Regex for bold: **bold**
    // Regex for italic: *italic*
    // Regex for link: [label](url)
    const elements: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Tokenize by regular expression
    const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/;

    while (remaining.length > 0) {
      const match = remaining.match(tokenRegex);
      if (!match) {
        elements.push(remaining);
        break;
      }

      const matchIdx = match.index || 0;
      if (matchIdx > 0) {
        elements.push(remaining.substring(0, matchIdx));
      }

      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        const inner = token.slice(2, -2);
        elements.push(
          <strong key={`b-${keyIdx++}`} className="font-bold text-slate-900">
            {inner}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        const inner = token.slice(1, -1);
        elements.push(
          <em key={`i-${keyIdx++}`} className="italic text-slate-800">
            {inner}
          </em>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        const inner = token.slice(1, -1);
        elements.push(
          <code
            key={`c-${keyIdx++}`}
            className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-xs md:text-[13px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/90 shadow-2xs inline-block"
          >
            {inner}
          </code>
        );
      } else if (token.startsWith('[') && token.includes('](')) {
        const labelMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (labelMatch) {
          const [, label, url] = labelMatch;
          elements.push(
            <a
              key={`a-${keyIdx++}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-orange-600 hover:text-orange-700 underline font-semibold inline-flex items-center gap-0.5 transition-colors"
            >
              <span>{label}</span>
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          );
        } else {
          elements.push(token);
        }
      } else {
        elements.push(token);
      }

      remaining = remaining.substring(matchIdx + token.length);
    }

    return elements;
  };

  // Block-level parsing
  const parseBlocks = (raw: string) => {
    const lines = raw.split(/\r?\n/);
    const blocks: React.ReactNode[] = [];
    let i = 0;
    let blockId = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Check for Video Block (:::video [caption]\nurl\n:::)
      if (line.trim().startsWith(':::video')) {
        const caption = line.trim().slice(8).trim();
        const vidLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith(':::')) {
          vidLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith(':::')) {
          i++;
        }
        const url = vidLines.join('\n').trim();
        if (url) {
          const ytId = extractYoutubeId(url);
          blocks.push(
            <figure key={`vid-${blockId++}`} className="my-6">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-950 aspect-video max-w-3xl mx-auto">
                {ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title={caption || 'Video bài giảng'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={url}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              {caption && (
                <figcaption className="text-xs text-slate-500 mt-2.5 text-center font-medium italic">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }
        continue;
      }

      // 2. Check for Callout Block (e.g., :::keypoint, :::tip, :::warning, :::info)
      if (line.trim().startsWith(':::')) {
        const calloutHeader = line.trim().slice(3).trim();
        const spaceIdx = calloutHeader.indexOf(' ');
        const type = (spaceIdx !== -1 ? calloutHeader.slice(0, spaceIdx) : calloutHeader).toLowerCase() || 'keypoint';
        const customTitle = spaceIdx !== -1 ? calloutHeader.slice(spaceIdx + 1).trim() : '';

        const calloutLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith(':::')) {
          calloutLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith(':::')) {
          i++; // skip closing :::
        }

        const calloutContent = calloutLines.join('\n');

        // Style configurations for Callouts matching modern UI (like Sydexa / Notion)
        let borderClass = 'border-indigo-400 bg-indigo-50/50 text-indigo-950';
        let barClass = 'bg-indigo-600';
        let iconElem = <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />;
        let defaultTitle = 'Điểm Then Chốt Của Bài Học:';

        if (type === 'tip') {
          borderClass = 'border-emerald-300 bg-emerald-50/50 text-emerald-950';
          barClass = 'bg-emerald-500';
          iconElem = <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
          defaultTitle = 'Mẹo Hay / Lưu Ý Nhỏ:';
        } else if (type === 'warning') {
          borderClass = 'border-amber-300 bg-amber-50/50 text-amber-950';
          barClass = 'bg-amber-500';
          iconElem = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
          defaultTitle = 'Cảnh Báo Quan Trọng:';
        } else if (type === 'info') {
          borderClass = 'border-sky-300 bg-sky-50/50 text-sky-950';
          barClass = 'bg-sky-500';
          iconElem = <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />;
          defaultTitle = 'Thông Tin Bổ Sung:';
        }

        const displayTitle = customTitle || defaultTitle;

        blocks.push(
          <div
            key={`callout-${blockId++}`}
            className={`my-5 rounded-2xl border ${borderClass} p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barClass}`} />
            <div className="flex items-start gap-3">
              {iconElem}
              <div className="space-y-1.5 flex-1 min-w-0">
                {displayTitle && (
                  <h4 className="font-bold text-sm md:text-base text-slate-900 tracking-tight">
                    {displayTitle}
                  </h4>
                )}
                <div className="text-xs md:text-sm text-slate-700 leading-relaxed space-y-1.5">
                  {calloutLines.map((cL, cIdx) => (
                    <p key={`c-p-${cIdx}`}>
                      {renderInline(cL)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
        continue;
      }

      // 2. Check for Code Block (```lang)
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim() || 'code';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith('```')) {
          i++;
        }
        const fullCode = codeLines.join('\n');
        const currentCodeIdx = blockId++;

        blocks.push(
          <div
            key={`code-${currentCodeIdx}`}
            className="my-5 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md"
          >
            {/* Code Block Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/90 text-xs text-slate-400">
              <span className="font-mono uppercase font-bold tracking-wider text-orange-400">
                {lang}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(fullCode, currentCodeIdx)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Sao chép đoạn mã"
              >
                {copiedIndex === currentCodeIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
            {/* Code Content */}
            <pre className="p-4 text-xs md:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        continue;
      }

      // 3. Headings
      if (line.startsWith('# ')) {
        blocks.push(
          <h1
            key={`h1-${blockId++}`}
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-6 mb-3 tracking-tight border-b border-slate-100 pb-2"
          >
            {renderInline(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push(
          <h2
            key={`h2-${blockId++}`}
            className="text-xl sm:text-2xl font-bold text-slate-900 mt-5 mb-2.5 tracking-tight flex items-center gap-2"
          >
            {renderInline(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        blocks.push(
          <h3
            key={`h3-${blockId++}`}
            className="text-lg font-bold text-slate-800 mt-4 mb-2 tracking-tight"
          >
            {renderInline(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }

      // 4. Image: ![alt](url)
      const imageMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imageMatch) {
        const [, alt, url] = imageMatch;
        blocks.push(
          <figure key={`img-${blockId++}`} className="my-5 text-center">
            <img
              src={url}
              alt={alt || 'Minh họa bài học'}
              className="rounded-2xl max-w-full border border-slate-200 shadow-sm mx-auto object-cover max-h-[450px]"
            />
            {alt && (
              <figcaption className="text-xs text-slate-500 mt-2 font-medium italic">
                {alt}
              </figcaption>
            )}
          </figure>
        );
        i++;
        continue;
      }

      // 5. Unordered List Items (- or *)
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
          listItems.push(lines[i].trim().slice(2));
          i++;
        }
        blocks.push(
          <ul key={`ul-${blockId++}`} className="space-y-1.5 my-3 pl-5 list-disc text-slate-700 text-sm leading-relaxed marker:text-orange-500">
            {listItems.map((item, liIdx) => (
              <li key={`li-${liIdx}`}>
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 6. Ordered List Items (1. )
      if (/^\d+\.\s/.test(line.trim())) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
          i++;
        }
        blocks.push(
          <ol key={`ol-${blockId++}`} className="space-y-1.5 my-3 pl-5 list-decimal text-slate-700 text-sm leading-relaxed marker:text-orange-600 font-medium">
            {listItems.map((item, liIdx) => (
              <li key={`oli-${liIdx}`}>
                <span className="font-normal text-slate-700">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // 7. Divider (---)
      if (line.trim() === '---' || line.trim() === '***') {
        blocks.push(<hr key={`hr-${blockId++}`} className="my-6 border-slate-200" />);
        i++;
        continue;
      }

      // 8. Markdown Table (| Col 1 | Col 2 |)
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

            i += 2; // skip header line and separator line
            const tableRows: string[][] = [];
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
              const rowCells = lines[i].trim().slice(1, -1).split('|').map(s => s.trim());
              while (rowCells.length < rawHeaders.length) rowCells.push('');
              tableRows.push(rowCells.slice(0, rawHeaders.length));
              i++;
            }

            blocks.push(
              <div key={`table-${blockId++}`} className="my-5 overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200">
                      {rawHeaders.map((headerText, colIdx) => (
                        <th
                          key={`th-${colIdx}`}
                          className="px-4 py-3 font-bold text-slate-800 tracking-wide text-xs uppercase text-center border-l border-slate-200 first:border-l-0"
                        >
                          {renderInline(headerText)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableRows.map((r, rIdx) => (
                      <tr key={`tr-${rIdx}`} className="hover:bg-slate-50/70 transition-colors">
                        {r.map((cellText, colIdx) => (
                          <td
                            key={`td-${rIdx}-${colIdx}`}
                            className="px-4 py-2.5 text-slate-700 text-sm text-left border-l border-slate-100 first:border-l-0"
                          >
                            {renderInline(cellText)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            continue;
          }
        }
      }

      // 9. Normal Paragraph or Empty Line
      if (line.trim().length === 0) {
        // Empty line
        i++;
        continue;
      }

      // Accumulate consecutive paragraph lines
      const pLines: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim().length > 0 &&
        !lines[i].trim().startsWith(':::') &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].startsWith('#') &&
        !lines[i].trim().startsWith('- ') &&
        !lines[i].trim().startsWith('* ') &&
        !/^\d+\.\s/.test(lines[i].trim()) &&
        lines[i].trim() !== '---' &&
        !lines[i].trim().startsWith('|')
      ) {
        pLines.push(lines[i]);
        i++;
      }

      blocks.push(
        <p key={`p-${blockId++}`} className="text-sm md:text-base text-slate-700 leading-relaxed my-3 font-normal">
          {renderInline(pLines.join(' '))}
        </p>
      );
    }

    return blocks;
  };

  return (
    <div className={`prose-ownedu text-slate-800 max-w-none ${className}`}>
      {parseBlocks(content)}
    </div>
  );
};
