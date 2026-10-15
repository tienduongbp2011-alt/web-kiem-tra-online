import React, { useMemo } from 'react';
import {
  Users,
  FileText,
  Play,
  CheckCircle,
  Award,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  School,
} from 'lucide-react';
import { storageService } from '../../services/storage';

interface TeacherDashboardProps {
  onNavigateTab: (tabId: string) => void;
  onOpenAutoExam: () => void;
  onViewResults: (examId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigateTab,
  onOpenAutoExam,
  onViewResults,
}) => {
  const users = storageService.getUsers();
  const exams = storageService.getExams();
  const questions = storageService.getQuestions();
  const submissions = storageService.getSubmissions();
  const classes = storageService.getClasses();

  const students = users.filter((u) => u.role === 'student');

  // Exact metrics required by prompt:
  // - Tổng số học sinh
  // - Tổng số bài kiểm tra
  // - Số bài đang mở
  // - Số bài đã kết thúc
  // - Số lượt làm bài
  // - Điểm trung bình
  const totalStudents = students.length;
  const totalExams = exams.length;
  const activeExamsCount = exams.filter((e) => e.status === 'open').length;
  const closedExamsCount = exams.filter((e) => e.status === 'closed').length;
  const totalSubmissions = submissions.length;

  const averageScore = useMemo(() => {
    if (submissions.length === 0) return 0;
    const sum = submissions.reduce((acc, curr) => acc + curr.score, 0);
    return Number((sum / submissions.length).toFixed(2));
  }, [submissions]);

  // Score distribution breakdown (0-4.9, 5.0-6.4, 6.5-7.9, 8.0-10)
  const scoreBuckets = useMemo(() => {
    const buckets = {
      under5: 0,
      medium: 0, // 5 - 6.4
      good: 0,   // 6.5 - 7.9
      excellent: 0, // 8 - 10
    };
    submissions.forEach((s) => {
      if (s.score < 5) buckets.under5++;
      else if (s.score < 6.5) buckets.medium++;
      else if (s.score < 8.0) buckets.good++;
      else buckets.excellent++;
    });
    return buckets;
  }, [submissions]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0D47A1] to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border-b-4 border-[#FF8A00] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200 uppercase">
            <School className="w-3.5 h-3.5 text-[#FF8A00]" />
            Bảng Điều Khiển Quản Trị – THPT Thanh Hòa
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Chào mừng Thầy Nguyễn Văn Dương
          </h1>
          <p className="text-blue-200 text-sm max-w-xl">
            Hệ thống tổ chức thi, kiểm tra trắc nghiệm online và thống kê kết quả học tập cho học sinh Khối 10 năm học 2026–2027.
          </p>
        </div>

        {/* Quick Action Buttons in Banner */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenAutoExam}
            className="flex items-center gap-2 px-4 py-3 bg-[#FF8A00] hover:bg-amber-600 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>TẠO ĐỀ TỰ ĐỘNG</span>
          </button>

          <button
            onClick={() => onNavigateTab('exams')}
            className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>TẠO BÀI KIỂM TRA</span>
          </button>
        </div>
      </div>

      {/* 6 Key Stats Cards (Exact prompt requirements) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Tổng số học sinh */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tổng số học sinh
            </span>
            <Users className="w-4 h-4 text-[#0D47A1]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
          <div className="text-[11px] text-slate-500">{classes.length} lớp Khối 10</div>
        </div>

        {/* 2. Tổng số bài kiểm tra */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tổng số bài KT
            </span>
            <FileText className="w-4 h-4 text-[#0D47A1]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalExams}</div>
          <div className="text-[11px] text-slate-500">{questions.length} câu trong kho</div>
        </div>

        {/* 3. Số bài đang mở */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Số bài đang mở
            </span>
            <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{activeExamsCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Học sinh đang thi</div>
        </div>

        {/* 4. Số bài đã kết thúc */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Đã kết thúc
            </span>
            <CheckCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-700">{closedExamsCount}</div>
          <div className="text-[11px] text-slate-500">Đã khóa đề thi</div>
        </div>

        {/* 5. Số lượt làm bài */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Số lượt làm bài
            </span>
            <Award className="w-4 h-4 text-[#FF8A00]" />
          </div>
          <div className="text-2xl font-black text-[#0D47A1]">{totalSubmissions}</div>
          <div className="text-[11px] text-slate-500">Đã chấm tự động</div>
        </div>

        {/* 6. Điểm trung bình */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Điểm trung bình
            </span>
            <TrendingUp className="w-4 h-4 text-[#FF8A00]" />
          </div>
          <div className="text-2xl font-black text-[#FF8A00]">{averageScore.toFixed(1)}</div>
          <div className="text-[11px] text-slate-500">Thang điểm 10</div>
        </div>
      </div>

      {/* Main Grid: Distribution Chart & Active Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Score Distribution & Recent Submissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phổ điểm & Phân phối */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0D47A1]" />
                Phổ điểm & Phân phối kết quả toàn Khối 10
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {submissions.length} bài nộp
              </span>
            </div>

            {/* Visual Bars */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <span className="text-[11px] font-bold text-red-700 block">Dưới TB (&lt; 5.0)</span>
                <div className="text-xl font-black text-red-700 my-1">{scoreBuckets.under5}</div>
                <div className="text-[10px] text-red-600">
                  {submissions.length > 0 ? Math.round((scoreBuckets.under5 / submissions.length) * 100) : 0}%
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <span className="text-[11px] font-bold text-amber-800 block">Trung bình (5 - 6.4)</span>
                <div className="text-xl font-black text-amber-800 my-1">{scoreBuckets.medium}</div>
                <div className="text-[10px] text-amber-700">
                  {submissions.length > 0 ? Math.round((scoreBuckets.medium / submissions.length) * 100) : 0}%
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <span className="text-[11px] font-bold text-blue-800 block">Khá (6.5 - 7.9)</span>
                <div className="text-xl font-black text-[#0D47A1] my-1">{scoreBuckets.good}</div>
                <div className="text-[10px] text-blue-700">
                  {submissions.length > 0 ? Math.round((scoreBuckets.good / submissions.length) * 100) : 0}%
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-[11px] font-bold text-emerald-800 block">Giỏi (8.0 - 10)</span>
                <div className="text-xl font-black text-emerald-800 my-1">{scoreBuckets.excellent}</div>
                <div className="text-[10px] text-emerald-700">
                  {submissions.length > 0 ? Math.round((scoreBuckets.excellent / submissions.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Recent Submissions List */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0D47A1]" />
                Hoạt động làm bài gần đây
              </h3>
              <button
                onClick={() => onNavigateTab('results')}
                className="text-xs font-bold text-[#0D47A1] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả bảng điểm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              {submissions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0D47A1] font-bold flex items-center justify-center text-xs">
                      {sub.className}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{sub.studentName}</div>
                      <div className="text-[11px] text-slate-500">
                        {sub.examTitle} • Mã HS: {sub.studentCode}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-black text-sm px-2.5 py-0.5 rounded-full border ${
                        sub.score >= 8
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-blue-100 text-[#0D47A1] border-blue-300'
                      }`}
                    >
                      {sub.score.toFixed(1)} đ
                    </span>
                    <button
                      onClick={() => onViewResults(sub.examId)}
                      className="text-slate-400 hover:text-[#0D47A1] p-1 cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Access to Question Bank & Active Exams */}
        <div className="space-y-6">
          {/* Question Bank Quick Stats */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0D47A1]" />
              Ngân hàng câu hỏi
            </h3>
            <p className="text-xs text-slate-500">
              Tổng cộng <strong>{questions.length} câu hỏi</strong> đã được phân loại theo chương trình GDPT mới cho Khối 10.
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Toán 10:</span>
                <strong className="text-slate-800">
                  {questions.filter((q) => q.subject === 'Toán').length} câu
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Vật lí 10:</span>
                <strong className="text-slate-800">
                  {questions.filter((q) => q.subject === 'Vật lí').length} câu
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tin học 10:</span>
                <strong className="text-slate-800">
                  {questions.filter((q) => q.subject === 'Tin học').length} câu
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tiếng Anh 10:</span>
                <strong className="text-slate-800">
                  {questions.filter((q) => q.subject === 'Tiếng Anh').length} câu
                </strong>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('questions')}
              className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Vào ngân hàng câu hỏi
            </button>
          </div>

          {/* Quick Class Roster */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <School className="w-4 h-4 text-[#0D47A1]" />
              Lớp phụ trách Khối 10
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {classes.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <div className="font-bold text-[#0D47A1]">Lớp {c.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {students.filter((s) => s.className === c.name).length} học sinh
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigateTab('students')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Quản lý danh sách học sinh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
