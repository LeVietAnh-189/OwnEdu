import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserLayout } from './components/layout/UserLayout';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentUploadPage } from './pages/DocumentUploadPage';
import { ExamGeneratePage } from './pages/ExamGeneratePage';
import { ExamWaitingPage } from './pages/ExamWaitingPage';
import { ExamReviewPage } from './pages/ExamReviewPage';
import { ExamRoomPage } from './pages/ExamRoomPage';
import { ExamResultPage } from './pages/ExamResultPage';
import { AdminPage } from './pages/AdminPage';
import { UserPage } from './pages/UserPage';
import { LandingPage } from './pages/LandingPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col w-full">
        <Routes>
          {/* Public Homepage / Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Exam Focus Mode: Standalone Test Arena */}
          <Route path="/exams/:id/take" element={<ExamRoomPage />} />

          {/* Dedicated Admin Console Layout */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Unified Workspace with Permanent Left Sidebar Menu */}
          <Route element={<UserLayout />}>
            <Route path="/user" element={<UserPage />} />
            <Route path="/portal" element={<Navigate to="/user" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents/upload" element={<DocumentUploadPage />} />
            <Route path="/documents/:id/generate" element={<ExamGeneratePage />} />
            <Route path="/exams/generating/:jobId" element={<ExamWaitingPage />} />
            <Route path="/exams/:id/review" element={<ExamReviewPage />} />
            <Route path="/exams/:id/results/:attemptId" element={<ExamResultPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/user" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
