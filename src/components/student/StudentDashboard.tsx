import React, { useMemo, useState } from 'react';
import {
  Clock,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Award,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import { Exam, Submission, User } from '../../types';
import { storageService } from '../../services/storage';

interface StudentDashboardProps {
  currentUser: User;
  onStartExam: (exam: Exam) => void;
  onViewResult: (submission: Submission) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onStartExam,
  onViewResult,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Load all exams and submissions
  const allExams = storageService.getExams();
  const allSubmissions = storageService.getSubmissions();
  const userSubmissions = allSubmissions.filter((s) => s.studentId === currentUser.id);

  // Filter exams assigned to this student:
  // exam.targetClasses includes student's className or 'ALL'
  const assignedExams = useMemo(() => {
    return allExams.filter((exam) => {
      if (!currentUser.className) return true;
      if (exam.targetClasses.includes('ALL')) return true;
      return exam.targetClasses.includes(currentUser.className);
    });
  }, [allExams, currentUser.className]);

  // Determine exam status for this student
  const getExamState = (exam: Exam) => {
    const subs = userSubmissions.filter((s) => s.examId === exam.id);
    const existingSession = storageService.getExamSession(exam.id, currentUser.id);
    const now = new Date();
    const isClosed = exam.status === 'closed' || (exam.endTime && new Date(exam.endTime) < now);

    if (subs.length >= exam.maxAttempts) {
      return {
        status: 'ĐÃ HOÀN THÀNH' as const,
        badgeColor: 'bg-green-100 text-green-800 border-green-300',
        latestSubmission: subs[0],
        attemptsLeft: 0,
      };
    }

    if (existingSession && !existingSession.isSubmitted) {
      // Check if session expired
      const sessionExpiry = new Date(existingSession.expiresAt);
      if (sessionExpiry > now) {
        return {
          status: 'ĐANG LÀM' as const,
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
          session: existingSession,
          attemptsLeft: exam.maxAttempts - subs.length,
        };
      }
    }

    if (isClosed) {
      return {
        status: 'HẾT HẠN' as const,
        badgeColor: 'bg-slate-200 text-slate-700 border-slate-300',
        attemptsLeft: Math.max(0, exam.maxAttempts - subs.length),
      };
    }

    return {
      status: 'CHƯA LÀM' as const,
      badgeColor: 'bg-blue-100 text-[#0D47A1] border-blue-300',
      attemptsLeft: exam.maxAttempts - subs.length,
    };
  };

  // Filter exams by search and status
  const filteredExams = useMemo(() => {
    return assignedExams.filter((exam) => {
      const state = getExamState(exam);

      const matchesSearch =
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubject = selectedSubject === 'ALL' || exam.subject === selectedSubject;

      const matchesStatus = statusFilter === 'ALL' || state.status === statusFilter;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [assignedExams, searchTerm, selectedSubject, statusFilter, userSubmissions]);

  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set(assignedExams.map((e) => e.subject)));
  }, [assignedExams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0D47A1] to-blue-800 rounded-2xl shadow-md p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b-4 border-[#FF8A00]">
        <div>
          <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200 uppercase mb-2">
            CỔNG HỌC SINH KHỐI 10 – THPT THANH HÒA
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, <span className="text-[#FF8A00]">{currentUser.fullName}</span>
          </h1>
          <p className="text-blue-100 text-sm mt-1 font-medium">
            Lớp: <span className="font-bold text-white bg-blue-900/60 px-2 py-0.5 rounded ml-1">{currentUser.className || '10A...'}</span>
            <span className="mx-2">•</span>
            Mã học sinh: <span className="font-mono text-white font-bold">{currentUser.username}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
          <div className="text-center px-3 border-r border-white/20">
            <div className="text-2xl font-black text-[#FF8A00]">{assignedExams.length}</div>
            <div className="text-xs text-blue-200">Được giao</div>
          </div>
          <div className="text-center px-3 border-r border-white/20">
            <div className="text-2xl font-black text-green-300">{userSubmissions.length}</div>
            <div className="text-xs text-blue-200">Đã nộp</div>
          </div>
          <div className="text-center px-3">
            <div className="text-2xl font-black text-yellow-300">
              {userSubmissions.length > 0
                ? (
                    userSubmissions.reduce((acc, curr) => acc + curr.score, 0) /
                    userSubmissions.length
                  ).toFixed(1)
                : '---'}
            </div>
            <div className="text-xs text-blue-200">Điểm TB</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài kiểm tra..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-[#0D47A1]" /> Môn:
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs sm:text-sm font-medium py-1.5 px-3 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          >
            <option value="ALL">Tất cả các môn</option>
            {uniqueSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 ml-2">
            Trạng thái:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm font-medium py-1.5 px-3 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="CHƯA LÀM">CHƯA LÀM</option>
            <option value="ĐANG LÀM">ĐANG LÀM</option>
            <option value="ĐÃ HOÀN THÀNH">ĐÃ HOÀN THÀNH</option>
            <option value="HẾT HẠN">HẾT HẠN</option>
          </select>
        </div>
      </div>

      {/* Tests Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#0D47A1]" />
          Danh sách bài kiểm tra ({filteredExams.length})
        </h2>

        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Không tìm thấy bài kiểm tra nào</h3>
            <p className="text-sm text-slate-500 mt-1">
              Hiện tại không có bài kiểm tra nào khớp với bộ lọc hoặc được giao cho lớp của bạn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => {
              const state = getExamState(exam);
              const startDate = new Date(exam.startTime).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const endDate = new Date(exam.endTime).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-blue-50 text-[#0D47A1] border border-blue-200">
                        {exam.subject}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase border ${state.badgeColor}`}
                      >
                        {state.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                      {exam.title}
                    </h3>

                    <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <span>Lớp:</span>
                      <span className="font-semibold text-slate-700">
                        {exam.targetClasses.includes('ALL') ? 'Toàn khối 10' : exam.targetClasses.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Card Body Specs */}
                  <div className="p-5 bg-slate-50/50 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-[#0D47A1]" /> Thời gian làm bài:
                      </span>
                      <span className="font-bold text-slate-900">{exam.durationMinutes} phút</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <FileText className="w-3.5 h-3.5 text-[#0D47A1]" /> Số câu hỏi:
                      </span>
                      <span className="font-bold text-slate-900">{exam.questionIds.length} câu</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Mở:
                      </span>
                      <span className="text-slate-700">{startDate}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Đóng:
                      </span>
                      <span className="text-slate-700">{endDate}</span>
                    </div>

                    {state.latestSubmission && (
                      <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-green-700 font-bold">
                          <Award className="w-4 h-4 text-green-600" /> Điểm đạt được:
                        </span>
                        <span className="text-sm font-black text-green-700 bg-green-100 px-2.5 py-0.5 rounded border border-green-300">
                          {state.latestSubmission.score.toFixed(1)} / 10
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Action */}
                  <div className="p-4 bg-white border-t border-slate-100">
                    {state.status === 'ĐÃ HOÀN THÀNH' && state.latestSubmission ? (
                      <button
                        onClick={() => onViewResult(state.latestSubmission!)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>XEM KẾT QUẢ & ĐÁP ÁN</span>
                      </button>
                    ) : state.status === 'ĐANG LÀM' ? (
                      <button
                        onClick={() => onStartExam(exam)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#FF8A00] hover:bg-amber-600 text-white font-bold text-sm transition-colors cursor-pointer shadow-sm animate-pulse"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>TIẾP TỤC LÀM BÀI</span>
                      </button>
                    ) : state.status === 'HẾT HẠN' ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 rounded-lg bg-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed text-center"
                      >
                        BÀI THI ĐÃ ĐÓNG
                      </button>
                    ) : (
                      <button
                        onClick={() => onStartExam(exam)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0D47A1] hover:bg-blue-800 text-white font-bold text-sm transition-colors cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>BẮT ĐẦU LÀM BÀI</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
