import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { DocumentChunk } from '../types.js';

const baseDir = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.resolve(process.cwd(), process.cwd().endsWith('backend') ? 'src/services' : 'backend/src/services');
const mineruServiceDir = path.resolve(baseDir, '../../services/mineru_service');
const pythonScript = path.resolve(mineruServiceDir, 'parse_worker.py');
const venvPython = path.resolve(mineruServiceDir, '.venv/Scripts/python.exe');

export interface ParseResult {
  text: string;
  markdownText?: string;
  parserEngine?: 'mineru' | 'pdf-parse' | 'mammoth';
  pageCount?: number;
  outline: Array<{ title: string; page?: number; level?: number }>;
  totalWords: number;
}

/**
 * Attempts high-precision layout-aware PDF extraction using MinerU 4.0
 */
export async function parsePdfWithMinerU(buffer: Buffer, originalFilename?: string): Promise<ParseResult | null> {
  const tempDir = path.join(os.tmpdir(), `mineru_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const safeName = originalFilename ? originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_') : 'document.pdf';
  const inputPdfPath = path.join(tempDir, safeName);
  const outputDir = path.join(tempDir, 'output');

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(inputPdfPath, buffer);

    const pythonBin = fs.existsSync(venvPython) ? venvPython : 'python';
    if (!fs.existsSync(pythonScript)) {
      console.warn('[MinerU] parse_worker.py not found at', pythonScript);
      return null;
    }

    console.log(`[MinerU] Executing MinerU parse on ${safeName} using ${pythonBin}...`);

    return await new Promise<ParseResult | null>((resolve) => {
      const child = spawn(pythonBin, [
        pythonScript,
        '--input', inputPdfPath,
        '--output-dir', outputDir,
        '--tier', 'flash'
      ], {
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';
      let isSettled = false;

      // Timeout after 60 seconds to avoid blocking user upload
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try { child.kill(); } catch {}
          console.warn('[MinerU] Process timed out (60s), falling back to fast parser.');
          resolve(null);
        }
      }, 60000);

      child.stdout.on('data', (chunk: Buffer | string) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk: Buffer | string) => { stderr += chunk.toString(); });

      child.on('error', (err: Error) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          console.warn('[MinerU] Failed to start python process:', err.message);
          resolve(null);
        }
      });

      child.on('close', (code: number | null) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);

        try {
          if (code === 0 && stdout.trim()) {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.success && parsed.markdown && parsed.markdown.trim().length > 30) {
              console.log(`[MinerU] Successfully parsed: ${parsed.totalWords} words, ${parsed.outline?.length || 0} headings`);
              resolve({
                text: parsed.markdown,
                markdownText: parsed.markdown,
                parserEngine: 'mineru',
                pageCount: parsed.pageCount || 1,
                outline: parsed.outline || [{ title: 'Tài liệu chuẩn hóa MinerU', page: 1, level: 1 }],
                totalWords: parsed.totalWords || 50,
              });
              return;
            }
          }
          console.warn(`[MinerU] Exit code ${code}. Stderr: ${stderr.slice(0, 200)}`);
          resolve(null);
        } catch (e: any) {
          console.warn('[MinerU] Error parsing JSON output:', e.message);
          resolve(null);
        }
      });
    });
  } catch (err: any) {
    console.warn('[MinerU] Exception during parse attempt:', err.message);
    return null;
  } finally {
    setTimeout(() => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }, 5000);
  }
}

export async function parsePdfBuffer(buffer: Buffer, originalFilename?: string): Promise<ParseResult> {
  // Step 1: Attempt high-fidelity MinerU extraction
  try {
    const mineruResult = await parsePdfWithMinerU(buffer, originalFilename);
    if (mineruResult && mineruResult.totalWords >= 20) {
      return mineruResult;
    }
  } catch (err: any) {
    console.warn('[DocumentParser] MinerU attempt failed, proceeding to fallback:', err.message);
  }

  // Step 2: Fallback to pdf-parse
  console.log('[DocumentParser] Using fast fallback (pdf-parse)...');
  const data = await pdf(buffer);
  const text = data.text || '';
  const pageCount = data.numpages || 1;

  // Extract outlines / headings by scanning common heading patterns
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const outline: Array<{ title: string; page?: number; level?: number }> = [];

  for (let i = 0; i < lines.length && outline.length < 15; i++) {
    const line = lines[i];
    if (/^(chương|bài|phần|mục|chapter|part|section)\s+\d+[:.]/i.test(line) || /^\d+\.\d+\s+[A-ZÀ-Ỹ]/i.test(line)) {
      outline.push({
        title: line.slice(0, 80),
        page: Math.min(Math.floor((i / lines.length) * pageCount) + 1, pageCount),
        level: 1
      });
    }
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return {
    text,
    markdownText: text,
    parserEngine: 'pdf-parse',
    pageCount,
    outline: outline.length > 0 ? outline : [{ title: 'Tài liệu học tập tổng hợp', page: 1, level: 1 }],
    totalWords: words,
  };
}

export async function parseDocxBuffer(buffer: Buffer): Promise<ParseResult> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value || '';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const outline: Array<{ title: string; page?: number }> = [];

  for (let i = 0; i < lines.length && outline.length < 10; i++) {
    const line = lines[i];
    if (/^(chương|bài|phần|mục|chapter|part|section)\s+\d+[:.]/i.test(line) || /^\d+\.\d+\s+[A-ZÀ-Ỹ]/i.test(line)) {
      outline.push({ title: line.slice(0, 80) });
    }
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const estimatedPages = Math.max(1, Math.ceil(words / 400));

  return {
    text,
    markdownText: text,
    parserEngine: 'mammoth',
    pageCount: estimatedPages,
    outline: outline.length > 0 ? outline : [{ title: 'Tài liệu giáo trình Word', page: 1, level: 1 }],
    totalWords: words,
  };
}

/**
 * Clean and split text into chunks per FR-DOC-INGEST-004
 * Chunk size: 1000 - 1500 chars with 150 chars overlap
 * Supports Markdown structure preservation
 */
export function chunkText(
  documentId: string, 
  rawText: string, 
  outline: Array<{ title: string; page?: number; level?: number }>
): DocumentChunk[] {
  // Clean text: normalize line endings
  const clean = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const chunkSize = 1200; // within 1000 - 1500 chars
  const overlap = 150;

  const chunks: DocumentChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < clean.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex < clean.length) {
      // Find a sentence, paragraph or markdown heading boundary
      const headingBoundary = clean.lastIndexOf('\n#', endIndex);
      const boundary = clean.lastIndexOf('.', endIndex);
      const newlineBoundary = clean.lastIndexOf('\n', endIndex);

      let chosenBoundary = Math.max(boundary, newlineBoundary);
      if (headingBoundary > startIndex + 600) {
        chosenBoundary = headingBoundary;
      }

      if (chosenBoundary > startIndex + 800) {
        endIndex = chosenBoundary + 1;
      }
    } else {
      endIndex = clean.length;
    }

    const contentText = clean.substring(startIndex, endIndex).trim();
    if (contentText.length > 50) {
      // Find closest chapter title
      const chapterTitle = outline[Math.min(chunkIndex, outline.length - 1)]?.title || `Phần ${chunkIndex + 1}`;
      const tokenEstimate = Math.ceil(contentText.length / 4);

      chunks.push({
        id: uuidv4(),
        documentId,
        chunkIndex,
        chapterTitle,
        contentText,
        tokenEstimate,
        createdAt: new Date().toISOString()
      });
      chunkIndex++;
    }

    startIndex = endIndex - overlap;
    if (endIndex >= clean.length) break;
  }

  return chunks;
}
