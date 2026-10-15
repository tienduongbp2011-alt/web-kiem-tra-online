import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ArrowLeft,
  Calendar,
  AlertCircle,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Exam, Submission, User } from '../../types';
import { storageService } from '../../services/storage';

interface ExamResultViewProps {
  submission: Submission;
  currentUser: User;
  onBackToDashboard: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  submission,
  currentUser,
  onBackToDashboard,
}) => {
  const exam = storageService.getExamById(submission.examId);
  const showAnswers = exam?.showAnswersAfterSubmit ?? true;

  // Trigger confetti if high score >= 7.0
  useEffect(() => {
    if (submission.score >= 7.0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0D47A1', '#FF8A00', '#10B981', '#F59E0B'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [submission.score]);

  const minutes = Math.floor(submission.durationSeconds / 60);
  const seconds = submission.durationSeconds % 60;
  const durationText = `${minutes} phút ${seconds < 10 ? '0' : ''}${seconds} giây`;
  const submittedDateText = new Date(submission.submittedAt).toLocaleString('vi-VN');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D47A1] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài kiểm tra
        </button>
      </div>

      {/* Main Result Card */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#0D47A1] to-blue-800 p-6 sm:p-8 text-white text-center border-b-4 border-[#FF8A00]">
          <div className="inline-flex p-3 bg-white/10 rounded-full mb-3 text-emerald-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            ĐÃ NỘP BÀI THÀNH CÔNG
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Hệ thống đã ghi nhận và chấm điểm bài làm của bạn
          </p>
        </div>

        {/* Score & Specs Summary */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
            {/* Student Info */}
            <div className="space-y-2 text-sm text-slate-700 w-full md:w-auto">
              <div>
                <span className="text-slate-500">Họ và tên:</span>{' '}
                <strong className="text-slate-900 text-base">{submission.studentName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Lớp:</span>{' '}
                <strong className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded">
                  {submission.className}
                </strong>
                <span className="mx-2">•</span>
                <span className="text-slate-500">Mã HS:</span>{' '}
                <strong className="text-slate-900 font-mono">{submission.studentCode}</strong>
              </div>
              <div>
                <span className="text-slate-500">Tên bài:</span>{' '}
                <strong className="text-slate-900">{submission.examTitle}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                <Clock className="w-3.5 h-3.5 text-[#0D47A1]" />
                <span>Thời gian làm bài: <strong>{durationText}</strong></span>
                <span className="mx-1">•</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Nộp lúc: {submittedDateText}</span>
              </div>
            </div>

            {/* Big Score Box */}
            <div className="bg-slate-50 border-2 border-blue-100 rounded-2xl p-5 text-center min-w-[200px] shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Điểm số đạt được
              </span>
              <div className="text-4xl sm:text-5xl font-black text-[#0D47A1] my-1">
                {submission.score.toFixed(1)}
                <span className="text-xl sm:text-2xl text-slate-400 font-bold"> / 10</span>
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-2">
                Đúng {submission.correctCount}/{submission.totalQuestions} câu
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-6 text-center text-xs sm:text-sm">
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="text-lg sm:text-xl font-black text-green-700">
                {submission.correctCount}
              </div>
              <div className="text-green-800 font-semibold text-xs mt-0.5">Số câu đúng</div>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <div className="text-lg sm:text-xl font-black text-red-600">
                {submission.wrongCount}
              </div>
              <div className="text-red-700 font-semibold text-xs mt-0.5">Số câu sai</div>
            </div>
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl">
              <div className="text-lg sm:text-xl font-black text-slate-700">
                {submission.unansweredCount}
              </div>
              <div className="text-slate-600 font-semibold text-xs mt-0.5">Chưa trả lời</div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers & Detailed Review (If permitted by teacher) */}
      {showAnswers ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0D47A1]" />
              Chi tiết bài làm và đáp án đúng
            </h2>
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
              Giáo viên cho phép xem đáp án
            </span>
          </div>

          <div className="space-y-4">
            {submission.breakdown.map((item, idx) => (
              <div
                key={item.questionId || idx}
                className={`bg-white rounded-xl border p-5 shadow-xs space-y-3 ${
                  item.isCorrect
                    ? 'border-green-300 bg-green-50/20'
                    : 'border-red-200 bg-red-50/20'
                }`}
              >
                {/* Header status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      Câu {idx + 1}:
                    </span>
                    {item.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đúng (+{item.pointsEarned.toFixed(2)} đ)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                        <XCircle className="w-3.5 h-3.5" /> Sai (0 đ)
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Thang điểm: {item.maxPoints.toFixed(2)} đ
                  </span>
                </div>

                {/* Content */}
                <div className="text-sm sm:text-base font-medium text-slate-800 whitespace-pre-line">
                  {item.questionContent}
                </div>

                {/* Single choice options review if exists */}
                {item.type === 'single_choice' && item.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {item.options.map((opt, oIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][oIdx] || opt.charAt(0);
                      const isStudentChoice = item.studentAnswer.toUpperCase() === letter.toUpperCase();
                      const isCorrectChoice = item.correctAnswer.toUpperCase() === letter.toUpperCase();

                      let optClass = 'bg-slate-50 border-slate-200 text-slate-700';
                      if (isCorrectChoice) {
                        optClass = 'bg-green-100 border-green-400 text-green-900 font-bold';
                      } else if (isStudentChoice && !item.isCorrect) {
                        optClass = 'bg-red-100 border-red-300 text-red-900 line-through';
                      }

                      return (
                        <div key={oIdx} className={`p-2.5 rounded-lg border flex items-center gap-2 ${optClass}`}>
                          <span className="w-5 h-5 rounded-full bg-white/80 border text-[11px] font-bold flex items-center justify-center shrink-0">
                            {letter}
                          </span>
                          <span>{opt.replace(/^[A-Da-d][.)]\s*/, '')}</span>
                          {isCorrectChoice && <span className="ml-auto text-green-700 font-bold">✓ Đúng</span>}
                          {isStudentChoice && !isCorrectChoice && <span className="ml-auto text-red-600 font-bold">✗ Bạn chọn</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4-Item True / False Detailed Review */}
                {item.type === 'true_false' && item.subItems && item.subItems.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="bg-purple-50/60 border border-purple-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-950">
                        Kết quả: Đúng {item.correctSubCount ?? 0}/4 ý (Đạt {item.pointsEarned.toFixed(2)} điểm)
                      </span>
                      <span className="text-[11px] text-purple-700 font-semibold hidden sm:inline">
                        Thang điểm: 1 ý: 0,1đ • 2 ý: 0,25đ • 3 ý: 0,5đ • 4 ý: 1,0đ
                      </span>
                    </div>

                    <div className="space-y-2">
                      {item.subItems.map((sub) => {
                        const isSubCorrect = sub.isCorrect;
                        const isStudentAnswered = sub.studentAnswer && sub.studentAnswer !== '(Chưa chọn)';

                        return (
                          <div
                            key={sub.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                              isSubCorrect
                                ? 'bg-emerald-50/40 border-emerald-300'
                                : 'bg-red-50/30 border-red-200'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 flex-1">
                              <span className="font-black text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs shrink-0">
                                {sub.label || `${sub.id})`}
                              </span>
                              <span className="font-medium text-slate-800 leading-relaxed">
                                {sub.content}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs">
                                <span className="text-slate-500">Bạn chọn:</span>
                                <strong
                                  className={
                                    isSubCorrect
                                      ? 'text-emerald-700 font-black'
                                      : isStudentAnswered
                                      ? 'text-rose-600 font-black'
                                      : 'text-slate-400 italic'
                                  }
                                >
                                  {sub.studentAnswer}
                                </strong>
                              </div>

                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs">
                                <span className="text-emerald-700 font-medium">Đáp án:</span>
                                <strong className="font-black">{sub.correctAnswer}</strong>
                              </div>

                              <span
                                className={`px-2 py-1 rounded-lg font-bold text-[11px] ${
                                  isSubCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isSubCorrect ? '✓ Đúng' : '✗ Sai'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Legacy Comparison Answer Bar (Only for single choice, short answer or legacy 1-statement true_false) */}
                {(!item.subItems || item.subItems.length === 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                      <span className="text-slate-500 block mb-0.5">Đáp án của bạn:</span>
                      <strong className={item.isCorrect ? 'text-green-700' : 'text-red-600 font-bold'}>
                        {item.studentAnswer || '(Chưa làm)'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-green-50 border border-green-200">
                      <span className="text-green-700 block mb-0.5 font-medium">Đáp án đúng:</span>
                      <strong className="text-green-800">{item.correctAnswer}</strong>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {item.explanation && (
                  <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-[#0D47A1] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Giải thích: </span>
                      <span>{item.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-600">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">Giáo viên đã tắt chế độ xem đáp án chi tiết cho bài thi này.</p>
          <p className="text-xs text-slate-500 mt-1">Kết quả và điểm số đã được lưu vào sổ điểm hệ thống.</p>
        </div>
      )}

      {/* Bottom return button */}
      <div className="text-center pt-4">
        <button
          onClick={onBackToDashboard}
          className="px-6 py-3 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
        >
          Hoàn tất & Về trang chủ học sinh
        </button>
      </div>
    </div>
  );
};
