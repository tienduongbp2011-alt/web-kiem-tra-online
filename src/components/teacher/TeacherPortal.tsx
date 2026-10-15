import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileCheck,
  BookOpen,
  Users,
  Award,
  Settings,
  Menu,
  X,
  School,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { User } from '../../types';
import { TeacherDashboard } from './TeacherDashboard';
import { ExamsManagement } from './ExamsManagement';
import { QuestionBank } from './QuestionBank';
import { StudentsManagement } from './StudentsManagement';
import { ResultsManagement } from './ResultsManagement';
import { SettingsView } from './SettingsView';
import { AutoExamModal } from './AutoExamModal';

interface TeacherPortalProps {
  currentUser: User;
  onRefreshUser: () => void;
}

export type TeacherTab =
  | 'dashboard'
  | 'exams'
  | 'questions'
  | 'students'
  | 'results'
  | 'settings';

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ currentUser, onRefreshUser }) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAutoExamModalOpen, setIsAutoExamModalOpen] = useState(false);
  const [targetExamIdForResults, setTargetExamIdForResults] = useState<string | undefined>(undefined);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Quản lý bài kiểm tra', icon: FileCheck },
    { id: 'questions', label: 'Ngân hàng câu hỏi', icon: BookOpen },
    { id: 'students', label: 'Học sinh & Lớp học', icon: Users },
    { id: 'results', label: 'Kết quả & Thống kê', icon: Award },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
  ];

  const handleNavigateResults = (examId: string) => {
    setTargetExamIdForResults(examId);
    setActiveTab('results');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar with Hamburger */}
      <div className="md:hidden bg-white border-b border-slate-200 p-3.5 flex items-center justify-between sticky top-16 z-30 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-[#0D47A1]">TRANG QUẢN TRỊ</span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-semibold text-slate-700 capitalize">
            {navItems.find((n) => n.id === activeTab)?.label}
          </span>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg bg-slate-100 cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar (Desktop + Mobile slide-over) */}
      <aside
        className={`fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-transform md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Navigation items */}
        <div className="p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Menu Quản Trị
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TeacherTab);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#0D47A1] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FF8A00]' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Quick Auto Exam Generator Button in Sidebar */}
          <div className="pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setIsAutoExamModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-[#FF8A00] to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>TẠO ĐỀ TỰ ĐỘNG</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 text-xs text-slate-500 space-y-1">
          <div className="font-bold text-slate-800">THPT Thanh Hòa – Khối 10</div>
          <div>Phiên bản 2.5 (2026–2027)</div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <TeacherDashboard
            onNavigateTab={(tab) => setActiveTab(tab as TeacherTab)}
            onOpenAutoExam={() => setIsAutoExamModalOpen(true)}
            onViewResults={handleNavigateResults}
          />
        )}

        {activeTab === 'exams' && (
          <ExamsManagement onViewResults={handleNavigateResults} />
        )}

        {activeTab === 'questions' && <QuestionBank />}

        {activeTab === 'students' && <StudentsManagement />}

        {activeTab === 'results' && (
          <ResultsManagement initialExamId={targetExamIdForResults} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            onDataReset={() => {
              onRefreshUser();
              setActiveTab('dashboard');
            }}
          />
        )}
      </main>

      {/* Auto Exam Generator Modal */}
      <AutoExamModal
        isOpen={isAutoExamModalOpen}
        onClose={() => setIsAutoExamModalOpen(false)}
        onExamCreated={(exam) => {
          alert(`Đã tạo thành công đề thi "${exam.title}"!`);
          setActiveTab('exams');
        }}
      />
    </div>
  );
};
