import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  X,
  HelpCircle,
  Award,
} from 'lucide-react';
import { Exam, Submission, User } from '../../types';
import { storageService } from '../../services/storage';
import { excelService } from '../../services/excel';

interface ResultsManagementProps {
  initialExamId?: string;
}

export const ResultsManagement: React.FC<ResultsManagementProps> = ({ initialExamId }) => {
  const exams = storageService.getExams();
  const classes = storageService.getClasses();
  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || exams[0]?.id || ''
  );
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'class' | 'name'>('score_desc');
  const [inspectSubmission, setInspectSubmission] = useState<Submission | null>(null);

  // Submissions for current exam
  const currentExam = exams.find((e) => e.id === selectedExamId);
  const submissions = storageService.getSubmissionsByExam(selectedExamId);

  // Filtered & Sorted Submissions
  const processedSubmissions = useMemo(() => {
    let result = submissions.filter((sub) => {
      const matchSearch =
        sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = selectedClass === 'ALL' || sub.className === selectedClass;
      return matchSearch && matchClass;
    });

    // Sorting logic
    result.sort((a, b) => {
      if (sortBy === 'score_desc') return b.score - a.score;
      if (sortBy === 'score_asc') return a.score - b.score;
      if (sortBy === 'class') return a.className.localeCompare(b.className);
      if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
      return 0;
    });

    return result;
  }, [submissions, searchTerm, selectedClass, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    if (processedSubmissions.length === 0) {
      return { avgScore: 0, highest: 0, lowest: 0, passCount: 0 };
    }
    const scores = processedSubmissions.map((s) => s.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passCount = scores.filter((s) => s >= 5.0).length;
    return {
      avgScore: Number(avgScore.toFixed(2)),
      highest: Number(highest.toFixed(2)),
      lowest: Number(lowest.toFixed(2)),
      passCount,
    };
  }, [processedSubmissions]);

  const handleExportExcel = () => {
    if (processedSubmissions.length === 0) {
      alert('Không có dữ liệu bài nộp để xuất Excel.');
      return;
    }
    excelService.exportExamResults(
      currentExam?.title || 'Bang_diem_kiem_tra',
      processedSubmissions
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#0D47A1]" />
            Kết quả & Thống kê bài kiểm tra
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Xem chi tiết bài làm của từng học sinh, sắp xếp bảng điểm và xuất file Excel
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={processedSubmissions.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>XUẤT EXCEL</span>
        </button>
      </div>

      {/* Selector & Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Exam Selector */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Chọn bài kiểm tra cần xem kết quả:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full py-2.5 px-3 border border-slate-300 rounded-lg text-sm bg-white font-bold text-[#0D47A1] focus:ring-2 focus:ring-[#0D47A1]"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.subject}] {ex.title}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Lọc theo Lớp:
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Tất cả các lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  Lớp {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Sắp xếp theo:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-700"
            >
              <option value="score_desc">Điểm: Cao → Thấp</option>
              <option value="score_asc">Điểm: Thấp → Cao</option>
              <option value="class">Theo lớp (10A1, 10A2...)</option>
              <option value="name">Theo tên học sinh (A → Z)</option>
            </select>
          </div>
        </div>

        {/* Search in results */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã học sinh hoặc Họ tên..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Lượt làm bài</span>
          <div className="text-2xl font-black text-[#0D47A1] mt-1">
            {processedSubmissions.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Điểm trung bình</span>
          <div className="text-2xl font-black text-[#FF8A00] mt-1">
            {stats.avgScore.toFixed(1)} / 10
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Điểm cao nhất</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {stats.highest.toFixed(1)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Tỉ lệ trên TB (≥ 5.0)</span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {processedSubmissions.length > 0
              ? `${Math.round((stats.passCount / processedSubmissions.length) * 100)}%`
              : '0%'}
          </div>
        </div>
      </div>

      {/* Submissions Table with exact prompt columns */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3 w-28">Mã học sinh</th>
                <th className="p-3 min-w-[180px]">Họ và tên</th>
                <th className="p-3 w-20">Lớp</th>
                <th className="p-3 w-24 text-center">Điểm</th>
                <th className="p-3 w-24 text-center">Số câu đúng</th>
                <th className="p-3 w-24 text-center">Số câu sai</th>
                <th className="p-3 min-w-[140px]">Thời gian làm bài</th>
                <th className="p-3 min-w-[150px]">Thời điểm nộp</th>
                <th className="p-3 w-24 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {processedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Chưa có học sinh nào nộp bài kiểm tra này.
                  </td>
                </tr>
              ) : (
                processedSubmissions.map((sub, idx) => {
                  const minutes = Math.floor(sub.durationSeconds / 60);
                  const seconds = sub.durationSeconds % 60;
                  const durationFormatted = `${minutes}p ${seconds < 10 ? '0' : ''}${seconds}s`;
                  const submittedAtFormatted = new Date(sub.submittedAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  });

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-[#0D47A1]">{sub.studentCode}</td>
                      <td className="p-3 font-semibold text-slate-900">{sub.studentName}</td>
                      <td className="p-3 font-bold text-slate-700 bg-slate-50/80">{sub.className}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block font-black text-sm px-2.5 py-0.5 rounded-full border ${
                            sub.score >= 8.0
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : sub.score >= 5.0
                              ? 'bg-blue-100 text-[#0D47A1] border-blue-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {sub.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold text-emerald-600">
                        {sub.correctCount}
                      </td>
                      <td className="p-3 text-center font-semibold text-red-500">
                        {sub.wrongCount}
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-xs">{durationFormatted}</td>
                      <td className="p-3 text-slate-500 text-xs">{submittedAtFormatted}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setInspectSubmission(sub)}
                          title="Xem chi tiết bài làm"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0D47A1] rounded-lg border border-blue-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Student Paper Detail Modal */}
      {inspectSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Chi tiết bài làm: {inspectSubmission.studentName}
                </h2>
                <p className="text-xs text-slate-500">
                  Lớp: {inspectSubmission.className} • Mã HS: {inspectSubmission.studentCode} • Điểm: {inspectSubmission.score.toFixed(1)}/10
                </p>
              </div>

              <button
                onClick={() => setInspectSubmission(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions breakdown */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {inspectSubmission.breakdown.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  Dữ liệu bài làm mẫu không lưu chi tiết từng câu hỏi. Hãy làm thử một bài kiểm tra mới bằng tài khoản học sinh để xem chi tiết đầy đủ!
                </div>
              ) : (
                inspectSubmission.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs sm:text-sm space-y-2 ${
                      item.isCorrect
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-red-200 bg-red-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900">Câu {idx + 1}:</span>
                      {item.isCorrect ? (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          ✓ Đúng (+{item.pointsEarned.toFixed(2)}đ)
                        </span>
                      ) : (
                        <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded">
                          ✗ Sai (0đ)
                        </span>
                      )}
                    </div>

                    <div className="font-medium text-slate-800">{item.questionContent}</div>

                    {/* 4-Item True/False breakdown */}
                    {item.type === 'true_false' && item.subItems && item.subItems.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-bold text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-200 flex items-center justify-between">
                          <span>Đúng {item.correctSubCount ?? 0}/4 ý (Thang điểm: 1 ý = 0,1đ • 2 ý = 0,25đ • 3 ý = 0,5đ • 4 ý = 1,0đ)</span>
                          <span className="font-extrabold text-purple-950">+{item.pointsEarned.toFixed(2)}đ</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.subItems.map((sub) => (
                            <div
                              key={sub.id}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                                sub.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="font-bold text-[#0D47A1] shrink-0">{sub.label}</span>
                                <span className="truncate text-slate-800">{sub.content}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                                <span className="text-slate-500">HS: <strong>{sub.studentAnswer}</strong></span>
                                <span className="text-slate-300">|</span>
                                <span className="text-emerald-700">Đ/A: <strong>{sub.correctAnswer}</strong></span>
                                <span className={sub.isCorrect ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                                  {sub.isCorrect ? '✓' : '✗'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-slate-500">Học sinh chọn: </span>
                          <strong className={item.isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                            {item.studentAnswer || '(Chưa làm)'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Đáp án đúng: </span>
                          <strong className="text-emerald-800">{item.correctAnswer}</strong>
                        </div>
                      </div>
                    )}

                    {item.explanation && (
                      <div className="text-xs text-blue-900 bg-blue-50/80 p-2 rounded border border-blue-200">
                        <strong>Giải thích: </strong> {item.explanation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
              <button
                onClick={() => setInspectSubmission(null)}
                className="px-4 py-2 bg-[#0D47A1] text-white rounded-lg text-xs font-bold"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
