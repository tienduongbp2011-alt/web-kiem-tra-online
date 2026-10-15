/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { storageService } from './services/storage';
import { Exam, Submission, User } from './types';
import { Header } from './components/common/Header';
import { LoginView } from './components/auth/LoginView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ExamRoom } from './components/student/ExamRoom';
import { ExamResultView } from './components/student/ExamResultView';
import { TeacherPortal } from './components/teacher/TeacherPortal';

type AppView =
  | 'login'
  | 'student_dashboard'
  | 'exam_room'
  | 'exam_result'
  | 'teacher_portal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize database & check saved session on mount
  useEffect(() => {
    storageService.initialize();
    const storedUser = storageService.getCurrentUser();

    if (storedUser) {
      setCurrentUser(storedUser);
      if (storedUser.role === 'teacher') {
        setCurrentView('teacher_portal');
      } else {
        setCurrentView('student_dashboard');
      }
    } else {
      setCurrentView('login');
    }
    setIsReady(true);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'teacher') {
      setCurrentView('teacher_portal');
    } else {
      setCurrentView('student_dashboard');
    }
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setActiveExam(null);
    setActiveSubmission(null);
    setCurrentView('login');
  };

  const handleStartExam = (exam: Exam) => {
    setActiveExam(exam);
    setCurrentView('exam_room');
  };

  const handleFinishExam = (submission: Submission) => {
    setActiveSubmission(submission);
    setCurrentView('exam_result');
  };

  const handleViewResult = (submission: Submission) => {
    setActiveSubmission(submission);
    setCurrentView('exam_result');
  };

  const handleBackToDashboard = () => {
    setActiveExam(null);
    setActiveSubmission(null);
    setCurrentView('student_dashboard');
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0D47A1] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-sm font-bold text-slate-700">Đang khởi tạo hệ thống thi trực tuyến...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Hide standard header during exam room for distraction-free mode */}
      {currentView !== 'exam_room' && (
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigateHome={() => {
            if (currentUser?.role === 'teacher') {
              setCurrentView('teacher_portal');
            } else if (currentUser?.role === 'student') {
              setCurrentView('student_dashboard');
            } else {
              setCurrentView('login');
            }
          }}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'login' && (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        )}

        {currentView === 'student_dashboard' && currentUser && (
          <StudentDashboard
            currentUser={currentUser}
            onStartExam={handleStartExam}
            onViewResult={handleViewResult}
          />
        )}

        {currentView === 'exam_room' && activeExam && currentUser && (
          <ExamRoom
            exam={activeExam}
            currentUser={currentUser}
            onFinishExam={handleFinishExam}
            onExitExam={handleBackToDashboard}
          />
        )}

        {currentView === 'exam_result' && activeSubmission && currentUser && (
          <ExamResultView
            submission={activeSubmission}
            currentUser={currentUser}
            onBackToDashboard={handleBackToDashboard}
          />
        )}

        {currentView === 'teacher_portal' && currentUser && currentUser.role === 'teacher' && (
          <TeacherPortal
            currentUser={currentUser}
            onRefreshUser={() => {
              const u = storageService.getCurrentUser();
              setCurrentUser(u);
            }}
          />
        )}
      </main>
    </div>
  );
}
