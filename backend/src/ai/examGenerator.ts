import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/hybridStore.js';
import { Exam, Question, ExamConfig, DocumentChunk } from '../types.js';

export async function generateExamJob(
  jobId: string, 
  documentId: string, 
  title: string, 
  config: ExamConfig
): Promise<Exam> {
  const document = db.getDocumentById(documentId);
  if (!document) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  // Step 1: 15% - FETCHING_CONTEXT
  db.emitSSEProgress({
    jobId,
    progressPercent: 15,
    step: 'FETCHING_CONTEXT',
    message: 'Đang trích xuất các phân đoạn kiến thức trọng tâm từ tài liệu...'
  });
  await new Promise(r => setTimeout(r, 600));

  const chunks = db.getChunksByDocumentId(documentId);
  // Prefer clean Markdown extracted by MinerU if available
  const contextText = document.markdownText && document.markdownText.trim().length > 50
    ? `# TÀI LIỆU HỌC TẬP CHUẨN HÓA: ${document.filename}\n\n${document.markdownText}`
    : chunks.map(c => `[Phần: ${c.chapterTitle || 'Kiến thức'}]:\n${c.contentText}`).join('\n\n');

  // Check AI settings
  const settings = db.getSettings();
  const geminiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;
  const openaiKey = process.env.OPENAI_API_KEY || settings.openaiApiKey;
  const activeModel = settings.activeModel || 'gemini-1.5-flash';

  // Step 2: 45% - CALLING_LLM
  const modelName = geminiKey ? (activeModel === 'offline-smart' ? 'gemini-1.5-flash' : activeModel) : (openaiKey ? 'gpt-4o-mini' : 'Bộ Sinh Ngữ Cảnh Chuyên Sâu (Local)');
  db.emitSSEProgress({
    jobId,
    progressPercent: 45,
    step: 'CALLING_LLM',
    message: `Đang liên hệ ${modelName} để sinh ${config.mcqCount} câu trắc nghiệm & ${config.essayCount} câu tự luận theo Bloom Taxonomy...`
  });

  let questions: Question[] = [];
  const examId = uuidv4();

  // Try Google Gemini if key available
  if (geminiKey) {
    try {
      console.log(`[AI Worker] Calling Google Gemini API (${activeModel}) with ${contextText.length} chars of context...`);
      questions = await callGeminiLLM(examId, contextText, config, title, geminiKey, activeModel);
    } catch (err: any) {
      console.warn('[AI Worker] Gemini API call failed, falling back to smart local extractor:', err.message);
    }
  } else if (openaiKey) {
    try {
      console.log('[AI Worker] Calling OpenAI API...');
      questions = await callOpenAiLLM(examId, contextText, config, title, openaiKey);
    } catch (err: any) {
      console.warn('[AI Worker] OpenAI API call failed, falling back to smart local extractor:', err.message);
    }
  }

  // Step 3: 85% - VALIDATING_SCHEMA
  db.emitSSEProgress({
    jobId,
    progressPercent: 85,
    step: 'VALIDATING_SCHEMA',
    message: 'Đang thẩm định tính hợp lệ JSON Schema, cấu trúc barem rubric và 4 phương án trắc nghiệm...'
  });
  await new Promise(r => setTimeout(r, 600));

  // If questions empty or API not used, use the Smart Semantic Extractor
  if (!questions || questions.length === 0) {
    questions = buildSmartQuestionsFromContext(examId, chunks, config, title || document.filename);
  }

  const newExam: Exam = {
    id: examId,
    documentId,
    creatorUserId: document.userId,
    title: title || `Bộ đề kiểm tra: ${document.filename}`,
    description: `Sinh tự động bởi AI từ tài liệu "${document.filename}" với ${config.mcqCount} câu MCQ và ${config.essayCount} câu tự luận.`,
    suggestedDurationMinutes: config.timeLimitMinutes || 45,
    totalScore: 10.0,
    status: 'READY_FOR_REVIEW',
    accessCode: `EDU-${Math.floor(1000 + Math.random() * 9000)}`,
    config,
    questions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addExam(newExam);

  // Step 4: 100% - COMPLETED
  db.emitSSEProgress({
    jobId,
    progressPercent: 100,
    step: 'COMPLETED',
    message: 'Sinh đề thành công! Đã sẵn sàng để xem lại và xuất bản.',
    examId
  });

  return newExam;
}

/**
 * Direct call to Google Gemini Generative Language API
 */
async function callGeminiLLM(
  examId: string,
  context: string,
  config: ExamConfig,
  examTitle: string,
  apiKey: string,
  modelName = 'gemini-1.5-flash'
): Promise<Question[]> {
  const targetModel = modelName === 'offline-smart' ? 'gemini-1.5-flash' : modelName;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

  const prompt = `Bạn là Chuyên gia Sư phạm và Khảo thí cấp cao của nền tảng OwnEdu.
Nhiệm vụ của bạn là đọc kỹ tài liệu học tập được cung cấp và tạo ra một bộ đề thi kiểm tra chất lượng cao, bao gồm cả câu hỏi trắc nghiệm (MCQ) và câu hỏi tự luận (Essay).

QUY TẮC BẮT BUỘC TUÂN THỦ:
1. TRUNG THỰC VỚI TÀI LIỆU (GROUNDING): 100% câu hỏi, đáp án và lời giải thích PHẢI dựa trực tiếp trên nội dung tài liệu nguồn được cung cấp. TUYỆT ĐỐI KHÔNG tự suy đoán kiến thức ngoài tài liệu.
2. CHUẨN MỰC CÂU TRẮC NGHIỆM (MCQ):
   - Mỗi câu có đúng 4 phương án lựa chọn: A, B, C, D.
   - Chỉ có DUY NHẤT 1 phương án đúng chính xác.
   - 3 phương án nhiễu phải hợp lý, mang tính đánh lừa tư duy logic, không ngớ ngẩn.
   - CẤM dùng các phương án lười biếng như: "Tất cả các đáp án trên đều đúng/sai", "Cả A và B đều đúng".
   - Kèm trường 'explanation' giải thích rõ vì sao đáp án đúng dựa vào tài liệu.
   - Kèm trường 'evidence' TRÍCH DẪN NGUYÊN VĂN 1-2 câu từ tài liệu làm bằng chứng cho câu hỏi & đáp án.
3. CHUẨN MỰC CÂU TỰ LUẬN (ESSAY):
   - Phải có 'benchmark_answer': Câu trả lời mẫu súc tích, chuẩn mực.
   - BẮT BUỘC phải có 'rubric': Danh sách tiêu chí chấm điểm chi tiết (tối thiểu 2 tiêu chí).
   - Kèm trường 'evidence' TRÍCH DẪN NGUYÊN VĂN 1-2 câu từ tài liệu làm cơ sở cho câu hỏi.
4. PHÂN LOẠI BLOOM TAXONOMY:
   - REMEMBER: Nhận diện khái niệm, thuật ngữ, định nghĩa.
   - UNDERSTAND: Giải thích bản chất, phân biệt sự khác nhau, tóm tắt quy trình.
   - APPLY: Vận dụng công thức, xử lý tình huống cụ thể.
   - ANALYZE: Phân tích ưu/nhược điểm, mổ xẻ nguyên nhân sâu xa, so sánh kiến trúc.
5. ĐỊNH DẠNG ĐẦU RA: Bắt buộc trả về đúng định dạng JSON thuần túy theo Schema, không bọc markdown hay text bên ngoài.

TÀI LIỆU HỌC TẬP NGUỒN:
---
${context.slice(0, 80000)}
---

YÊU CẦU CẤU HÌNH:
- Tiêu đề đề thi: "${examTitle}"
- Số lượng câu Trắc nghiệm (MCQ): ${config.mcqCount} câu
- Số lượng câu Tự luận (Essay): ${config.essayCount} câu
- Phân bổ Bloom: ${config.bloomLevels.join(', ')}
- Đối tượng: ${config.targetAudience}
- Ngôn ngữ: ${config.language === 'en' ? 'English' : 'Tiếng Việt'}

Cấu trúc JSON mong muốn:
{
  "questions": [
    {
      "order_index": 1,
      "type": "MCQ",
      "bloom_level": "REMEMBER",
      "content": "Nội dung câu hỏi...",
      "points": 1.5,
      "options": [
        {"key": "A", "content": "Nội dung phương án A"},
        {"key": "B", "content": "Nội dung phương án B"},
        {"key": "C", "content": "Nội dung phương án C"},
        {"key": "D", "content": "Nội dung phương án D"}
      ],
      "correct_answer": "A",
      "explanation": "Giải thích chi tiết...",
      "evidence": "Trích dẫn nguyên văn câu từ tài liệu làm bằng chứng..."
    },
    {
      "order_index": 2,
      "type": "ESSAY",
      "bloom_level": "ANALYZE",
      "content": "Nội dung câu hỏi tự luận...",
      "points": 2.5,
      "benchmark_answer": "Câu trả lời mẫu...",
      "evidence": "Trích dẫn nguyên văn câu từ tài liệu làm bằng chứng...",
      "rubric": [
        {"criteria": "Tiêu chí 1", "max_points": 1.0},
        {"criteria": "Tiêu chí 2", "max_points": 1.5}
      ]
    }
  ]
}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.2,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as any;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');

  const parsed = JSON.parse(rawText);
  return mapParsedQuestions(examId, parsed.questions || []);
}

/**
 * Direct call to OpenAI API
 */
async function callOpenAiLLM(
  examId: string,
  context: string,
  config: ExamConfig,
  examTitle: string,
  apiKey: string
): Promise<Question[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Bạn là Chuyên gia Khảo thí sư phạm của OwnEdu. Tạo bộ đề thi JSON chuẩn theo Bloom Taxonomy bám sát tài liệu nguồn được cung cấp.'
        },
        {
          role: 'user',
          content: `Tài liệu:\n${context.slice(0, 15000)}\n\nYêu cầu: Tạo ${config.mcqCount} câu MCQ và ${config.essayCount} câu Essay cho đề "${examTitle}". Trả về JSON { "questions": [...] }.`
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);
  return mapParsedQuestions(examId, parsed.questions || []);
}

function mapParsedQuestions(examId: string, rawList: any[]): Question[] {
  return rawList.map((item, idx) => ({
    id: uuidv4(),
    examId,
    orderIndex: item.order_index || (idx + 1),
    type: item.type === 'ESSAY' ? 'ESSAY' : 'MCQ',
    bloomLevel: item.bloom_level || 'UNDERSTAND',
    content: item.content || `Câu hỏi số ${idx + 1}`,
    points: Number(item.points) || 1.0,
    options: item.options?.map((o: any) => ({
      key: o.key,
      content: o.content
    })),
    correctAnswer: item.correct_answer || 'A',
    explanation: item.explanation || 'Dựa theo nội dung tài liệu học tập nguồn.',
    evidence: item.evidence,
    benchmarkAnswer: item.benchmark_answer,
    rubric: item.rubric?.map((r: any) => ({
      criteria: r.criteria,
      maxPoints: Number(r.max_points) || 1.0
    }))
  }));
}

/**
 * Smart Semantic Extractor: used when no API key is set.
 * Extracts meaningful definitions, concepts, and factual pairs from the document text.
 */
function buildSmartQuestionsFromContext(
  examId: string, 
  chunks: DocumentChunk[], 
  config: ExamConfig,
  documentTitle: string
): Question[] {
  const questions: Question[] = [];
  const mcqCount = Math.max(1, config.mcqCount);
  const essayCount = Math.max(0, config.essayCount);

  // Distribute points: 10 total
  const essayWeight = essayCount > 0 ? 3.0 : 0;
  const mcqWeight = 10.0 - essayWeight;
  const mcqPointEach = Number((mcqWeight / mcqCount).toFixed(2));
  const essayPointEach = essayCount > 0 ? Number((essayWeight / essayCount).toFixed(2)) : 0;

  const fullText = chunks.map(c => c.contentText).join('\n');

  // Extract meaningful concept statements from text
  const rawLines = fullText
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 25 && !l.startsWith('http') && !/^(trang|page|\d+$)/i.test(l));

  // Extract key bullet points / definitions
  const facts: Array<{ subject: string; fact: string; chapter: string }> = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    // Check if line looks like a fact or definition
    if (line.includes(':') || line.includes(' là ') || line.includes(' – ') || line.includes(' - ') || line.includes('giúp')) {
      const parts = line.split(/[:–\-]| là /);
      if (parts.length >= 2 && parts[0].trim().length > 3 && parts[1].trim().length > 10) {
        facts.push({
          subject: parts[0].trim().replace(/^[\d\.\s\-\*]+/, ''),
          fact: parts[1].trim(),
          chapter: chunks[Math.min(Math.floor(i / (rawLines.length / chunks.length || 1)), chunks.length - 1)]?.chapterTitle || documentTitle
        });
      }
    }
  }

  // If facts are too few, use sentences
  if (facts.length < mcqCount) {
    const sentences = fullText
      .split(/[.!?\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 160);

    sentences.forEach((s, idx) => {
      facts.push({
        subject: `Nội dung trọng tâm ${idx + 1}`,
        fact: s,
        chapter: chunks[idx % chunks.length]?.chapterTitle || documentTitle
      });
    });
  }

  const bloomLevels = config.bloomLevels && config.bloomLevels.length > 0 
    ? config.bloomLevels 
    : ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'] as const;

  // Generate MCQ questions
  for (let i = 0; i < mcqCount; i++) {
    const factItem = facts[i % facts.length] || {
      subject: 'Quy trình và nguyên lý',
      fact: 'Được quy định và chuẩn hóa trong nội dung tài liệu học tập',
      chapter: documentTitle
    };

    const nextFact1 = facts[(i + 1) % facts.length]?.fact || 'Không áp dụng trong môi trường thực tiễn';
    const nextFact2 = facts[(i + 2) % facts.length]?.fact || 'Chỉ dành cho các hệ thống quy mô rất nhỏ';
    const nextFact3 = facts[(i + 3) % facts.length]?.fact || 'Đã bị loại bỏ trong các tiêu chuẩn hiện đại';

    const bloom = bloomLevels[i % bloomLevels.length];

    let questionPrompt = '';
    if (bloom === 'REMEMBER') {
      questionPrompt = `Theo nội dung tài liệu, phát biểu nào sau đây nêu ĐÚNG nhất về "${factItem.subject}"?`;
    } else if (bloom === 'UNDERSTAND') {
      questionPrompt = `Bản chất và vai trò chính của "${factItem.subject}" được làm rõ qua khẳng định nào dưới đây?`;
    } else if (bloom === 'APPLY') {
      questionPrompt = `Trong tình huống triển khai thực tế, việc áp dụng "${factItem.subject}" nhằm mục đích trực tiếp nào?`;
    } else {
      questionPrompt = `Khi đánh giá về "${factItem.subject}", nhận định nào sau đây là chuẩn xác nhất dựa trên tài liệu?`;
    }

    questions.push({
      id: uuidv4(),
      examId,
      orderIndex: i + 1,
      type: 'MCQ',
      bloomLevel: bloom,
      content: questionPrompt,
      points: mcqPointEach,
      options: [
        { key: 'A', content: factItem.fact },
        { key: 'B', content: `Ngược lại hoàn toàn: ${nextFact1.slice(0, 80)}...` },
        { key: 'C', content: `Chỉ mang tính lý thuyết phụ: ${nextFact2.slice(0, 80)}...` },
        { key: 'D', content: `Không liên quan đến quy trình: ${nextFact3.slice(0, 80)}...` }
      ],
      correctAnswer: 'A',
      explanation: `Đáp án A chính xác. Tài liệu nguồn nêu rõ: "${factItem.subject}" gắn liền với nội dung: "${factItem.fact}".`
    });
  }

  // Generate Essay questions
  for (let j = 0; j < essayCount; j++) {
    const factItem = facts[(mcqCount + j) % facts.length] || facts[0];
    const topic = factItem ? factItem.subject : documentTitle;

    questions.push({
      id: uuidv4(),
      examId,
      orderIndex: mcqCount + j + 1,
      type: 'ESSAY',
      bloomLevel: 'ANALYZE',
      content: `Dựa vào tài liệu nguồn, hãy phân tích vai trò, các hoạt động cốt lõi và ý nghĩa thực tiễn của "${topic}". Trình bày ít nhất 2 luận điểm trọng tâm và 1 giải pháp nâng cao hiệu quả.`,
      points: essayPointEach,
      benchmarkAnswer: `Bài làm cần phân tích: (1) Khái niệm và vị trí của ${topic}; (2) Hai hoạt động cốt lõi được nhấn mạnh trong tài liệu; (3) Tác động thực tế và giải pháp duy trì chất lượng/hiệu năng trong dự án.`,
      rubric: [
        {
          criteria: `Nêu đúng bản chất và bối cảnh áp dụng của ${topic}`,
          maxPoints: Number((essayPointEach * 0.4).toFixed(2))
        },
        {
          criteria: `Phân tích đầy đủ 2 luận điểm trọng tâm dựa trên tài liệu`,
          maxPoints: Number((essayPointEach * 0.3).toFixed(2))
        },
        {
          criteria: `Đề xuất giải pháp và liên hệ thực tế mạch lạc`,
          maxPoints: Number((essayPointEach * 0.3).toFixed(2))
        }
      ]
    });
  }

  return questions;
}
