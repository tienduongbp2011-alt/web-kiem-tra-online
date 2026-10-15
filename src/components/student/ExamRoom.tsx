import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Wifi,
  WifiOff,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import {
  Exam,
  ExamAttemptSession,
  Question,
  QuestionResultBreakdown,
  StudentAnswer,
  Submission,
  User,
} from '../../types';
import { storageService } from '../../services/storage';
import { gradeQuestion } from '../../utils/grading';

interface ExamRoomProps {
  exam: Exam;
  currentUser: User;
  onFinishExam: (submission: Submission) => void;
  onExitExam: () => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  exam,
  currentUser,
  onFinishExam,
  onExitExam,
}) => {
  // 1. Fetch questions for this exam
  const allQuestions = storageService.getQuestions();
  const examQuestions: Question[] = useMemo(() => {
    const list = exam.questionIds
      .map((id) => allQuestions.find((q) => q.id === id))
      .filter((q): q is Question => q !== undefined);

    // If teacher set shuffleQuestions, maintain stable order in session or randomize initially
    return list;
  }, [exam.questionIds, allQuestions]);

  // 2. Session Initialization & Recovery
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [timeLeft, setTimeLeft] = useState<number>(exam.durationMinutes * 60);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [networkSyncMessage, setNetworkSyncMessage] = useState<string | null>(null);

  // Reference for stable timer & submit lock
  const isTerminatedRef = useRef(false);
  const startedAtRef = useRef<string>(new Date().toISOString());

  // Restore or Create Session
  useEffect(() => {
    const existing = storageService.getExamSession(exam.id, currentUser.id);
    const now = Date.now();

    if (existing && !existing.isSubmitted) {
      // Restoring session!
      startedAtRef.current = existing.startedAt;
      setAnswers(existing.answers || {});

      const expireMs = new Date(existing.expiresAt).getTime();
      const remainingSeconds = Math.max(0, Math.floor((expireMs - now) / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        // Time already expired while away!
        handleTimeExpired(existing.answers || {});
      }
    } else {
      // Starting brand new session
      const startedAt = new Date().toISOString();
      startedAtRef.current = startedAt;
      const expiresAt = new Date(now + exam.durationMinutes * 60 * 1000).toISOString();

      const newSession: ExamAttemptSession = {
        examId: exam.id,
        studentId: currentUser.id,
        startedAt,
        expiresAt,
        answers: {},
        questionOrder: examQuestions.map((q) => q.id),
        isSubmitted: false,
        lastSavedAt: new Date().toISOString(),
      };

      storageService.saveExamSession(newSession);
      setTimeLeft(exam.durationMinutes * 60);
    }
  }, [exam.id, currentUser.id, exam.durationMinutes]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setNetworkSyncMessage('Tất cả dữ liệu đã được đồng bộ.');
      setTimeout(() => setNetworkSyncMessage(null), 4000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setNetworkSyncMessage('Mất kết nối. Hệ thống đang cố gắng kết nối lại...');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timer Tick
  useEffect(() => {
    if (isTerminatedRef.current) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [answers]);

  // Auto-Save whenever answers change
  const autoSaveSession = (updatedAnswers: Record<string, StudentAnswer>) => {
    if (isTerminatedRef.current) return;

    const existing = storageService.getExamSession(exam.id, currentUser.id);
    const expiresAt = existing
      ? existing.expiresAt
      : new Date(Date.now() + timeLeft * 1000).toISOString();

    const session: ExamAttemptSession = {
      examId: exam.id,
      studentId: currentUser.id,
      startedAt: startedAtRef.current,
      expiresAt,
      answers: updatedAnswers,
      questionOrder: examQuestions.map((q) => q.id),
      isSubmitted: false,
      lastSavedAt: new Date().toISOString(),
    };

    storageService.saveExamSession(session);
  };

  // Handle Answer Selection
  const handleSelectOption = (questionId: string, answerText: string) => {
    if (isTerminatedRef.current) return;

    const currentRecord = answers[questionId] || { questionId, answer: '' };
    const updated = {
      ...answers,
      [questionId]: {
        ...currentRecord,
        answer: answerText,
      },
    };

    setAnswers(updated);
    autoSaveSession(updated);
  };

  // Handle 4-item True / False Selection for sub-items (a, b, c, d)
  const handleSelectSubOption = (questionId: string, subId: string, value: 'Đúng' | 'Sai') => {
    if (isTerminatedRef.current) return;

    const currentRecord = answers[questionId] || { questionId, answer: '', subAnswers: {} };
    const currentSubs = { ...(currentRecord.subAnswers || {}) };

    // Toggle or set
    currentSubs[subId] = value;

    // Serialize human-readable answer string e.g. "a: Đúng | b: Sai | c: Đúng | d: Sai"
    const formatted = Object.entries(currentSubs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');

    const updated = {
      ...answers,
      [questionId]: {
        ...currentRecord,
        answer: formatted,
        subAnswers: currentSubs,
      },
    };

    setAnswers(updated);
    autoSaveSession(updated);
  };

  // Toggle Flag (Đánh dấu xem lại)
  const handleToggleFlag = (questionId: string) => {
    if (isTerminatedRef.current) return;

    const currentRecord = answers[questionId] || { questionId, answer: '' };
    const updated = {
      ...answers,
      [questionId]: {
        ...currentRecord,
        isFlagged: !currentRecord.isFlagged,
      },
    };

    setAnswers(updated);
    autoSaveSession(updated);
  };

  // Grading Function using official MOET standards
  const calculateResult = (finalAnswers: Record<string, StudentAnswer>): Submission => {
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const breakdown: QuestionResultBreakdown[] = [];
    const questionWeight = 10 / Math.max(1, examQuestions.length);

    examQuestions.forEach((q) => {
      const studentAnsObj = finalAnswers[q.id];
      const res = gradeQuestion(q, studentAnsObj, questionWeight);

      if (!studentAnsObj?.answer || studentAnsObj.answer.trim() === '') {
        unansweredCount++;
      } else if (res.isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      totalScore += res.pointsEarned;
      breakdown.push(res);
    });

    const nowIso = new Date().toISOString();
    const durationSeconds = Math.max(
      1,
      Math.floor((new Date(nowIso).getTime() - new Date(startedAtRef.current).getTime()) / 1000)
    );

    const submission: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examId: exam.id,
      examTitle: exam.title,
      subject: exam.subject,
      studentId: currentUser.id,
      studentCode: currentUser.username,
      studentName: currentUser.fullName,
      className: currentUser.className || 'Khối 10',
      startedAt: startedAtRef.current,
      submittedAt: nowIso,
      durationSeconds,
      score: Number(Math.min(10, Math.max(0, totalScore)).toFixed(2)),
      totalQuestions: examQuestions.length,
      correctCount,
      wrongCount,
      unansweredCount,
      answers: finalAnswers,
      breakdown,
    };

    return submission;
  };

  // Submit Submission (Manually or Automatically)
  const submitExam = (finalAnswers = answers) => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;
    setIsSubmitting(true);

    const submission = calculateResult(finalAnswers);

    // Save to storage
    storageService.saveSubmission(submission);

    // Clear active session
    storageService.clearExamSession(exam.id, currentUser.id);

    // Transition to Result Screen
    setTimeout(() => {
      onFinishExam(submission);
    }, 400);
  };

  const handleTimeExpired = (answersOverride?: Record<string, StudentAnswer>) => {
    if (isTerminatedRef.current) return;
    alert('Hết giờ làm bài! Hệ thống đang tự động nộp bài làm của bạn.');
    submitExam(answersOverride || answers);
  };

  // Stats for current test state
  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => {
      if (a.subAnswers && Object.keys(a.subAnswers).length > 0) {
        return Object.values(a.subAnswers).some((v) => Boolean(v));
      }
      return Boolean(a.answer && a.answer.trim().length > 0);
    }).length;
  }, [answers]);
  const unansweredCount = examQuestions.length - answeredCount;

  // Current Question
  const currentQuestion = examQuestions[currentIndex];
  const currentAnswerRecord = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCurrentFlagged = currentAnswerRecord?.isFlagged || false;

  // Format Timer mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const isLowTime = timeLeft <= 300; // less than 5 mins
  const isCriticalTime = timeLeft <= 60; // less than 1 min

  if (!currentQuestion) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-xl shadow text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Không có câu hỏi nào trong đề thi này</h2>
        <p className="text-slate-500 mt-2">Vui lòng thông báo cho giáo viên bộ môn.</p>
        <button
          onClick={onExitExam}
          className="mt-6 px-4 py-2 bg-[#0D47A1] text-white font-semibold rounded-lg"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-16 select-none">
      {/* Network / Offline warning toast */}
      {networkSyncMessage && (
        <div
          className={`sticky top-0 z-50 py-2.5 px-4 text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            isOffline ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-600 text-white'
          }`}
        >
          {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
          <span>{networkSyncMessage}</span>
        </div>
      )}

      {/* Top Test Navigation Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Exam & Student Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0D47A1] shrink-0 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0D47A1] uppercase tracking-wide flex items-center gap-2">
                <span>{exam.subject}</span>
                <span className="text-slate-300">•</span>
                <span>Khối 10</span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {exam.title}
              </h1>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Thí sinh: <strong className="text-slate-800">{currentUser.fullName}</strong></span>
                <span>•</span>
                <span>Lớp: <strong className="text-slate-800">{currentUser.className || 'Khối 10'}</strong></span>
              </div>
            </div>
          </div>

          {/* Real-time Countdown Timer & Quick Submit */}
          <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 border-t md:border-t-0 pt-2 md:pt-0">
            {/* Realtime Countdown Timer Badge */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm sm:text-base font-black tracking-wider shadow-sm transition-all ${
                isCriticalTime
                  ? 'bg-red-600 text-white border-red-700 animate-bounce'
                  : isLowTime
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-[#0D47A1]/10 text-[#0D47A1] border-blue-200'
              }`}
            >
              <Clock className={`w-5 h-5 ${isCriticalTime ? 'text-white' : 'text-[#FF8A00]'}`} />
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 leading-none">
                <span className="text-[10px] sm:text-xs font-bold uppercase opacity-80">THỜI GIAN CÒN LẠI:</span>
                <span className="text-base sm:text-lg font-mono font-black">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 active:scale-95 text-white font-extrabold text-sm sm:text-base shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#FF8A00]" />
              <span>NỘP BÀI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left / Center 3 Columns: Active Question Card */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Question Header & Level */}
              <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-lg bg-[#0D47A1] text-white font-black text-sm">
                    Câu {currentIndex + 1} / {examQuestions.length}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md font-semibold bg-slate-200 text-slate-700">
                    {currentQuestion.difficulty === 'nhan_biet'
                      ? 'Nhận biết'
                      : currentQuestion.difficulty === 'thong_hieu'
                      ? 'Thông hiểu'
                      : currentQuestion.difficulty === 'van_dung'
                      ? 'Vận dụng'
                      : 'Vận dụng cao'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    ({currentQuestion.type === 'single_choice'
                      ? 'Trắc nghiệm 1 đáp án'
                      : currentQuestion.type === 'true_false'
                      ? 'Đúng / Sai'
                      : 'Trả lời ngắn'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFlag(currentQuestion.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      isCurrentFlagged
                        ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-amber-950' : ''}`} />
                    <span>{isCurrentFlagged ? 'ĐÃ ĐÁNH DẤU' : 'ĐÁNH DẤU XEM LẠI'}</span>
                  </button>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-5 sm:p-7 space-y-6">
                <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                  {currentQuestion.content}
                </div>

                {/* 1. Trắc nghiệm 1 đáp án đúng (A, B, C, D) */}
                {currentQuestion.type === 'single_choice' && currentQuestion.options && (
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((option, optIdx) => {
                      const optLetter = ['A', 'B', 'C', 'D'][optIdx] || option.charAt(0);
                      const isSelected =
                        currentAnswerRecord?.answer?.toUpperCase() === optLetter.toUpperCase();

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(currentQuestion.id, optLetter)}
                          className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                            isSelected
                              ? 'border-[#0D47A1] bg-blue-50/70 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                              isSelected
                                ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {optLetter}
                          </div>
                          <span
                            className={`text-sm sm:text-base font-medium ${
                              isSelected ? 'text-[#0D47A1] font-semibold' : 'text-slate-800'
                            }`}
                          >
                            {option.replace(/^[A-Da-d][.)]\s*/, '')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Đúng / Sai */}
                {currentQuestion.type === 'true_false' && (
                  currentQuestion.subItems && currentQuestion.subItems.length > 0 ? (
                    <div className="space-y-4 pt-1">
                      {/* Thang điểm Bộ GD&ĐT Banner */}
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-700 text-white rounded text-[11px] font-black uppercase">
                            Dạng Đúng / Sai (4 ý)
                          </span>
                          <span className="text-xs text-purple-900 font-semibold">
                            Lựa chọn Đúng hoặc Sai cho từng mệnh đề a), b), c), d)
                          </span>
                        </div>
                        <div className="bg-white/90 border border-purple-300 rounded-lg px-3 py-1.5 text-[11px] text-purple-950 font-bold shadow-2xs flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-purple-700 font-black">THANG ĐIỂM:</span>
                          <span className="text-emerald-700">1 ý: 0,1đ</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-700">2 ý: 0,25đ</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-700">3 ý: 0,5đ</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-800 font-black">4 ý: 1,0đ</span>
                        </div>
                      </div>

                      {/* 4 Statements List */}
                      <div className="space-y-3">
                        {currentQuestion.subItems.map((subItem) => {
                          const currentSubChoice = currentAnswerRecord?.subAnswers?.[subItem.id];

                          return (
                            <div
                              key={subItem.id}
                              className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                currentSubChoice
                                  ? 'border-purple-300 bg-purple-50/30 shadow-2xs'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <span className="w-7 h-7 rounded-lg bg-[#0D47A1] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5">
                                  {subItem.id.toUpperCase()}
                                </span>
                                <div className="space-y-1">
                                  <span className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed block">
                                    {subItem.content}
                                  </span>
                                </div>
                              </div>

                              {/* Toggle Buttons: ĐÚNG / SAI */}
                              <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-1 md:pt-0">
                                <button
                                  type="button"
                                  onClick={() => handleSelectSubOption(currentQuestion.id, subItem.id, 'Đúng')}
                                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                    currentSubChoice === 'Đúng'
                                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                                  }`}
                                >
                                  <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 font-bold bg-white/20">
                                    {currentSubChoice === 'Đúng' ? '✓' : ''}
                                  </span>
                                  <span>ĐÚNG</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSelectSubOption(currentQuestion.id, subItem.id, 'Sai')}
                                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                    currentSubChoice === 'Sai'
                                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-300'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                                  }`}
                                >
                                  <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 font-bold bg-white/20">
                                    {currentSubChoice === 'Sai' ? '✓' : ''}
                                  </span>
                                  <span>SAI</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {['Đúng', 'Sai'].map((val) => {
                        const isSelected =
                          currentAnswerRecord?.answer?.toLowerCase() === val.toLowerCase();

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSelectOption(currentQuestion.id, val)}
                            className={`p-4 rounded-xl border-2 font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'border-[#0D47A1] bg-blue-50 text-[#0D47A1] shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                                isSelected
                                  ? 'border-[#0D47A1] bg-[#0D47A1] text-white'
                                  : 'border-slate-300 bg-slate-100'
                              }`}
                            >
                              {isSelected ? '✓' : ''}
                            </div>
                            <span>{val}</span>
                          </button>
                        );
                      })}
                    </div>
                  )
                )}

                {/* 3. Câu hỏi trả lời ngắn */}
                {currentQuestion.type === 'short_answer' && (
                  <div className="pt-2 space-y-2">
                    <label className="block text-xs font-semibold text-slate-600">
                      Nhập câu trả lời ngắn của bạn:
                    </label>
                    <input
                      type="text"
                      value={currentAnswerRecord?.answer || ''}
                      onChange={(e) => handleSelectOption(currentQuestion.id, e.target.value)}
                      placeholder="Gõ đáp án vào đây (ví dụ: số, từ khóa)..."
                      className="w-full p-3.5 border-2 border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-[#0D47A1] text-base"
                    />
                    <p className="text-xs text-slate-500">
                      * Nhập đúng số hoặc từ khóa theo yêu cầu đề bài.
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation Controls Bar */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 bg-white font-bold text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>CÂU TRƯỚC</span>
                </button>

                <div className="text-xs text-slate-500 font-semibold hidden sm:block">
                  Tự động lưu: <span className="text-green-600 font-bold">✓ Đã bật</span>
                </div>

                {currentIndex < examQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#0D47A1] font-bold text-sm text-white hover:bg-blue-800 cursor-pointer transition-colors shadow-sm"
                  >
                    <span>CÂU TIẾP THEO</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#FF8A00] font-bold text-sm text-white hover:bg-amber-600 cursor-pointer transition-colors shadow-md"
                  >
                    <span>HOÀN TẤT & NỘP BÀI</span>
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Question Palette Matrix (Bảng số câu) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sticky top-24">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>BẢNG SỐ CÂU</span>
                <span className="text-xs font-mono text-[#0D47A1] font-bold">
                  {answeredCount}/{examQuestions.length}
                </span>
              </h3>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-slate-200 border border-slate-300"></span>
                  <span>Chưa trả lời</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#0D47A1] text-white"></span>
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#FF8A00] text-white"></span>
                  <span>Câu đang xem</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-amber-400 text-amber-950"></span>
                  <span>Đánh dấu</span>
                </div>
              </div>

              {/* Questions Grid 1, 2, 3, 4, 5... */}
              <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto p-1">
                {examQuestions.map((q, idx) => {
                  const qAns = answers[q.id];
                  const isAnswered = Boolean(qAns?.answer && qAns.answer.trim().length > 0);
                  const isFlagged = Boolean(qAns?.isFlagged);
                  const isCurrent = idx === currentIndex;

                  let colorClass = 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300'; // Chưa trả lời: màu xám
                  if (isCurrent) {
                    colorClass = 'bg-[#FF8A00] text-white font-black shadow-md border-amber-600 ring-2 ring-orange-300'; // Câu đang xem: màu cam
                  } else if (isFlagged) {
                    colorClass = 'bg-amber-400 text-amber-950 font-bold border-amber-500'; // Đánh dấu xem lại: màu vàng
                  } else if (isAnswered) {
                    colorClass = 'bg-[#0D47A1] text-white font-bold border-blue-900'; // Đã trả lời: màu xanh
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-lg text-xs font-bold border transition-all flex items-center justify-center relative cursor-pointer ${colorClass}`}
                    >
                      {idx + 1}
                      {isFlagged && !isCurrent && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submit Button in Palette */}
              <div className="mt-5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white font-black text-sm tracking-wide shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#FF8A00]" />
                  <span>NỘP BÀI THI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMISSION CONFIRMATION MODAL (Exact Prompt Specs) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleUp border border-slate-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-100 text-[#FF8A00] rounded-full flex items-center justify-center mx-auto">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Bạn có chắc chắn muốn nộp bài không?
              </h3>
              <p className="text-xs text-slate-500">
                Sau khi nộp bài, bạn sẽ không thể chỉnh sửa đáp án đã chọn.
              </p>
            </div>

            {/* Answer count stats box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-600">Đã trả lời:</span>
                <span className="font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded border border-green-200">
                  {answeredCount} / {examQuestions.length} câu
                </span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-600">Chưa trả lời:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded border ${
                  unansweredCount > 0
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}>
                  {unansweredCount} câu
                </span>
              </div>
            </div>

            {/* Warning if unanswered */}
            {unansweredCount > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Bạn vẫn còn <strong>{unansweredCount} câu chưa làm</strong>. Bạn có muốn quay lại kiểm tra trước khi nộp?
                </span>
              </div>
            )}

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                QUAY LẠI
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => submitExam()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white font-extrabold shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? 'ĐANG NỘP...' : 'NỘP BÀI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
