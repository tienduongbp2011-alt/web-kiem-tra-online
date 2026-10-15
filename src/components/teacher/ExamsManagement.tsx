import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Search,
  Filter,
  Clock,
  Calendar,
  Users,
  Copy,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Play,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { Exam, Question } from '../../types';
import { storageService } from '../../services/storage';
import { AutoExamModal } from './AutoExamModal';

interface ExamsManagementProps {
  onViewResults: (examId: string) => void;
}

export const ExamsManagement: React.FC<ExamsManagementProps> = ({ onViewResults }) => {
  const [exams, setExams] = useState<Exam[]>(() => storageService.getExams());
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null);

  const classes = storageService.getClasses();
  const allQuestions = storageService.getQuestions();

  const refreshExams = () => {
    setExams(storageService.getExams());
  };

  const handleToggleStatus = (id: string) => {
    storageService.toggleExamStatus(id);
    refreshExams();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này? Toàn bộ kết quả liên quan có thể bị ảnh hưởng.')) {
      storageService.deleteExam(id);
      refreshExams();
    }
  };

  const handleDuplicate = (exam: Exam) => {
    const copy: Exam = {
      ...exam,
      id: `exam-dup-${Date.now()}`,
      title: `${exam.title} (Bản sao)`,
      createdAt: new Date().toISOString(),
    };
    storageService.saveExam(copy);
    refreshExams();
  };

  const filteredExams = exams.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = subjectFilter === 'ALL' || e.subject === subjectFilter;
    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchSearch && matchSubject && matchStatus;
  });

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !editingExam.title || !editingExam.questionIds?.length) {
      alert('Vui lòng nhập tên đề và chọn ít nhất 1 câu hỏi!');
      return;
    }

    const examToSave: Exam = {
      id: editingExam.id || `exam-${Date.now()}`,
      title: editingExam.title,
      subject: editingExam.subject || 'Toán',
      grade: 10,
      targetClasses: editingExam.targetClasses || ['10A1'],
      durationMinutes: editingExam.durationMinutes || 15,
      startTime: editingExam.startTime || new Date().toISOString(),
      endTime: editingExam.endTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxAttempts: editingExam.maxAttempts || 1,
      showAnswersAfterSubmit: editingExam.showAnswersAfterSubmit ?? true,
      shuffleQuestions: editingExam.shuffleQuestions ?? true,
      shuffleOptions: editingExam.shuffleOptions ?? true,
      status: editingExam.status || 'open',
      questionIds: editingExam.questionIds,
      totalPoints: 10,
      createdById: 'u-teacher-1',
      createdAt: editingExam.createdAt || new Date().toISOString(),
    };

    storageService.saveExam(examToSave);
    setEditingExam(null);
    refreshExams();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-[#0D47A1]" />
            Quản lý bài kiểm tra ({exams.length} đề thi)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tạo, phân công lớp, cấu hình thời gian và mở/đóng bài kiểm tra trực tuyến
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAutoModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF8A00] hover:bg-amber-600 text-white rounded-lg text-xs sm:text-sm font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>TẠO ĐỀ TỰ ĐỘNG</span>
          </button>

          <button
            onClick={() => {
              // Open manual creator with default questions
              const defaultQIds = allQuestions.slice(0, 5).map((q) => q.id);
              setEditingExam({
                title: '',
                subject: 'Toán',
                grade: 10,
                targetClasses: ['10A1', '10A3'],
                durationMinutes: 15,
                maxAttempts: 1,
                showAnswersAfterSubmit: true,
                shuffleQuestions: true,
                shuffleOptions: true,
                status: 'open',
                questionIds: defaultQIds,
              });
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0D47A1] hover:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>TẠO BÀI KIỂM TRA</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bài kiểm tra..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="py-1.5 px-3 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả môn học</option>
            <option value="Toán">Môn Toán</option>
            <option value="Vật lí">Môn Vật lí</option>
            <option value="Hóa học">Môn Hóa học</option>
            <option value="Sinh học">Môn Sinh học</option>
            <option value="Tin học">Môn Tin học</option>
            <option value="Tiếng Anh">Môn Tiếng Anh</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="open">Đang mở</option>
            <option value="closed">Đã đóng</option>
          </select>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExams.map((exam) => {
          const subs = storageService.getSubmissionsByExam(exam.id);

          return (
            <div
              key={exam.id}
              className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Card Top */}
              <div className="p-5 border-b border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-blue-50 text-[#0D47A1] border border-blue-200">
                    {exam.subject}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(exam.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      exam.status === 'open'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        exam.status === 'open' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    ></span>
                    <span>{exam.status === 'open' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}</span>
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                  {exam.title}
                </h3>

                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#0D47A1]" />
                  <span>Lớp:</span>
                  <span className="font-bold text-slate-800">
                    {exam.targetClasses.includes('ALL') ? 'Toàn khối 10' : exam.targetClasses.join(', ')}
                  </span>
                </div>
              </div>

              {/* Card Specs */}
              <div className="p-4 bg-slate-50/70 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-[#0D47A1]" /> Thời gian làm bài:
                  </span>
                  <strong className="text-slate-900">{exam.durationMinutes} phút</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Số lượng câu:</span>
                  <strong className="text-slate-900">{exam.questionIds.length} câu (10 điểm)</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Số lượt đã nộp:</span>
                  <span className="font-bold text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {subs.length} lượt thi
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  <span>Trộn đề: {exam.shuffleQuestions ? 'Có' : 'Không'}</span>
                  <span>Xem đáp án: {exam.showAnswersAfterSubmit ? 'Có' : 'Không'}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewResults(exam.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0D47A1] font-bold text-xs border border-blue-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>XEM KẾT QUẢ</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(exam)}
                    title="Sao chép đề"
                    className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setEditingExam(exam)}
                    title="Chỉnh sửa đề"
                    className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(exam.id)}
                    title="Xóa đề"
                    className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto Matrix Exam Modal */}
      <AutoExamModal
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
        onExamCreated={(newExam) => {
          refreshExams();
          alert(`Đã tạo thành công bài kiểm tra "${newExam.title}" với ${newExam.questionIds.length} câu hỏi!`);
        }}
      />

      {/* Manual Edit / Create Exam Modal */}
      {editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingExam.id ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
              </h2>
              <button onClick={() => setEditingExam(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên bài kiểm tra *
                </label>
                <input
                  type="text"
                  required
                  value={editingExam.title || ''}
                  onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                  placeholder="Ví dụ: Kiểm tra 15 phút Toán 10..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Môn học</label>
                  <select
                    value={editingExam.subject || 'Toán'}
                    onChange={(e) => setEditingExam({ ...editingExam, subject: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Vật lí">Vật lí</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Tin học">Tin học</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Thời gian (Phút)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={editingExam.durationMinutes || 15}
                    onChange={(e) => setEditingExam({ ...editingExam, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Target Classes Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lớp được giao làm bài:
                </label>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-300 rounded-lg cursor-pointer text-xs font-bold text-[#0D47A1]">
                    <input
                      type="checkbox"
                      checked={editingExam.targetClasses?.includes('ALL')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingExam({ ...editingExam, targetClasses: ['ALL'] });
                        } else {
                          setEditingExam({ ...editingExam, targetClasses: ['10A1'] });
                        }
                      }}
                    />
                    <span>Toàn bộ khối 10</span>
                  </label>

                  {!editingExam.targetClasses?.includes('ALL') &&
                    classes.map((c) => {
                      const isChecked = editingExam.targetClasses?.includes(c.name);
                      return (
                        <label
                          key={c.id}
                          className={`px-3 py-1 border rounded-lg text-xs font-semibold cursor-pointer ${
                            isChecked
                              ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const curr = editingExam.targetClasses || [];
                              const updated = isChecked
                                ? curr.filter((name) => name !== c.name)
                                : [...curr, c.name];
                              setEditingExam({ ...editingExam, targetClasses: updated });
                            }}
                            className="hidden"
                          />
                          <span>{c.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Questions Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Chọn câu hỏi vào đề ({editingExam.questionIds?.length || 0} câu đã chọn):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const matchingIds = allQuestions
                        .filter((q) => q.subject === (editingExam.subject || 'Toán'))
                        .map((q) => q.id);
                      setEditingExam({ ...editingExam, questionIds: matchingIds });
                    }}
                    className="text-xs text-[#0D47A1] font-bold hover:underline"
                  >
                    Chọn tất cả câu môn này
                  </button>
                </div>

                <div className="border border-slate-300 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {allQuestions
                    .filter((q) => q.subject === (editingExam.subject || 'Toán'))
                    .map((q) => {
                      const isSelected = editingExam.questionIds?.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className={`p-2 flex items-start gap-2 cursor-pointer hover:bg-slate-50 ${
                            isSelected ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const curr = editingExam.questionIds || [];
                              const updated = isSelected
                                ? curr.filter((id) => id !== q.id)
                                : [...curr, q.id];
                              setEditingExam({ ...editingExam, questionIds: updated });
                            }}
                            className="mt-0.5 rounded text-[#0D47A1]"
                          />
                          <div className="flex-1">
                            <span className="font-bold text-[#0D47A1] mr-1">[{q.difficulty}]</span>
                            <span>{q.content.substring(0, 90)}...</span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Options check */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingExam.shuffleQuestions ?? true}
                    onChange={(e) => setEditingExam({ ...editingExam, shuffleQuestions: e.target.checked })}
                  />
                  <span>Trộn câu hỏi</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingExam.showAnswersAfterSubmit ?? true}
                    onChange={(e) => setEditingExam({ ...editingExam, showAnswersAfterSubmit: e.target.checked })}
                  />
                  <span>Cho phép xem đáp án sau khi nộp</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D47A1] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  LƯU BÀI KIỂM TRA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
