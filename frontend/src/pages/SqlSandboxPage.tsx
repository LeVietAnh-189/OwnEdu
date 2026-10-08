import React from 'react';
import { SqlSandbox } from '../components/sql/SqlSandbox';
import { Terminal, Database, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SqlSandboxPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner - Light theme */}
      <div className="bg-gradient-to-r from-orange-50/80 via-white to-indigo-50/60 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Phòng Thực Hành SQL Trực Tiếp (WASM Engine)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              SQL Playground & Studio
            </h1>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              Thực thi các câu lệnh PostgreSQL trực tiếp ngay trong trình duyệt của bạn với tốc độ mili-giây. Dữ liệu mẫu quản lý sinh viên đại học được tích hợp sẵn, an toàn tuyệt đối và không cần cài bất kỳ công cụ nào trên máy!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/user?tab=courses&courseId=course-sql"
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-orange-50/60 text-slate-700 hover:text-orange-700 text-xs font-bold transition flex items-center gap-2 border border-slate-200 shadow-2xs"
            >
              <BookOpen className="w-4 h-4 text-orange-600" />
              <span>Vào Khóa Học SQL</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sandbox Component */}
      <SqlSandbox />
    </div>
  );
};

export default SqlSandboxPage;
