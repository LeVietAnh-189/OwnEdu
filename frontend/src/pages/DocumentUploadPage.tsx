import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentAPI } from '../services/api';
import { DocumentItem } from '../types';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Layers,
  FileCheck2
} from 'lucide-react';

export const DocumentUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<DocumentItem | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFileChange = (selectedFile: File) => {
    setError(null);
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!validTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.pdf') && 
        !selectedFile.name.endsWith('.docx')) {
      setError('Định dạng tệp không được hỗ trợ. Vui lòng chỉ tải lên tệp .pdf hoặc .docx.');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('Tệp vượt quá dung lượng tối đa 25MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      const doc = await DocumentAPI.upload(file);
      setUploadedDoc(doc);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Có lỗi xảy ra khi tải và bóc tách tài liệu.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Tải Lên Tài Liệu & Phân Đoạn Kiến Thức
        </h1>
        <p className="text-sm text-slate-500 font-normal">
          Hệ thống sẽ tự động đọc hiểu, bóc tách cấu trúc đề mục và phân nhỏ thành các đoạn tri thức chuẩn RAG để AI sinh đề bám sát 100% nội dung.
        </p>
      </div>

      {error && (
        <div className="w-full p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      {!uploadedDoc ? (
        <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? 'border-orange-500 bg-orange-50/50'
                : 'border-slate-300 bg-slate-50 hover:border-orange-400 hover:bg-orange-50/30'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />

            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <p className="text-base font-bold text-slate-800">
                {file ? file.name : 'Kéo thả tệp vào đây, hoặc bấm để chọn tệp'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hỗ trợ tệp văn bản định dạng <strong className="text-slate-700">.PDF</strong> và <strong className="text-slate-700">.DOCX</strong> (Dung lượng tối đa 25MB)
              </p>
            </div>

            {file && (
              <div className="px-4 py-2 rounded-full bg-emerald-50 text-xs text-emerald-700 font-bold flex items-center gap-2 border border-emerald-200 shadow-sm">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Đã chọn: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 flex items-center gap-2 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]"
            >
              {isUploading ? (
                <span>Đang phân tích & bóc tách...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt đầu bóc tách & phân đoạn</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Extracted Preview Success Panel */
        <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Bóc Tách & Phân Đoạn Thành Công!
              </h3>
              <p className="text-xs text-slate-500">
                Tài liệu đã được lưu trữ an toàn và sẵn sàng để tạo cấu hình sinh đề.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500">Tên tài liệu:</span>
              <p className="text-sm font-bold text-slate-900 truncate mt-1">{uploadedDoc.filename}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500">Tổng số từ bóc tách:</span>
              <p className="text-sm font-bold text-emerald-600 mt-1">{uploadedDoc.totalWords} từ</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500">Số đoạn tri thức RAG:</span>
              <p className="text-sm font-bold text-orange-600 mt-1">{uploadedDoc.chunksCount} chunks</p>
            </div>
          </div>

          {/* Extracted Outline */}
          {uploadedDoc.extractedOutline && uploadedDoc.extractedOutline.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-600" />
                <span>Cấu trúc đề mục trích xuất (Outline)</span>
              </h4>
              <div className="space-y-2">
                {uploadedDoc.extractedOutline.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-700"
                  >
                    <span>{item.title}</span>
                    {item.page && <span className="text-slate-500 font-mono">Trang {item.page}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={() => setUploadedDoc(null)}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Tải file khác
            </button>
            <button
              onClick={() => navigate(`/documents/${uploadedDoc.id}/generate`)}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tiến hành cấu hình sinh đề AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
