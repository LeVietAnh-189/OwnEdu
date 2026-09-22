import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
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

          {/* Exam Focus Mode: No regular Navbar */}
          <Route path="/exams/:id/take" element={<ExamRoomPage />} />

          {/* Dedicated Admin Console Layout */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Dedicated User Portal Layout */}
          <Route path="/user" element={<UserPage />} />
          <Route path="/portal" element={<UserPage />} />

          {/* Standard User Layout with Navbar */}
          <Route
            path="*"
            element={
              <>
                <Navbar />
                <main className="flex-1 w-full">
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/documents/upload" element={<DocumentUploadPage />} />
                    <Route path="/documents/:id/generate" element={<ExamGeneratePage />} />
                    <Route path="/exams/generating/:jobId" element={<ExamWaitingPage />} />
                    <Route path="/exams/:id/review" element={<ExamReviewPage />} />
                    <Route path="/exams/:id/results/:attemptId" element={<ExamResultPage />} />
                  </Routes>
                </main>
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
