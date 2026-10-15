import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit,
  Copy,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Layers,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { DifficultyLevel, Question, QuestionType, TrueFalseSubItem } from '../../types';
import { storageService } from '../../services/storage';
import { excelService } from '../../services/excel';
import { wordParserService } from '../../services/wordParser';
import { QuestionImportModal } from './QuestionImportModal';
import { WordQuestionImportModal } from './WordQuestionImportModal';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>(() => storageService.getQuestions());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isWordImportModalOpen, setIsWordImportModalOpen] = useState(false);

  // Edit / Add Question Modal State
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

  const refreshQuestions = () => {
    setQuestions(storageService.getQuestions());
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch =
        q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.chapter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.lesson.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSubject = selectedSubject === 'ALL' || q.subject === selectedSubject;
      const matchDiff = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
      const matchType = selectedType === 'ALL' || q.type === selectedType;

      return matchSearch && matchSubject && matchDiff && matchType;
    });
  }, [questions, searchTerm, selectedSubject, selectedDifficulty, selectedType]);

  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.subject)));
  }, [questions]);

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng đề?')) {
      storageService.deleteQuestion(id);
      refreshQuestions();
    }
  };

  const handleDuplicate = (q: Question) => {
    const copy: Question = {
      ...q,
      id: `q-dup-${Date.now()}`,
      content: `[Bản sao] ${q.content}`,
      createdAt: new Date().toISOString(),
    };
    storageService.saveQuestion(copy);
    refreshQuestions();
  };

  const handleQuickToggleBankSubItem = (q: Question, subId: string, val: 'Đúng' | 'Sai') => {
    if (!q.subItems) return;
    const newSubs = q.subItems.map((s) => (s.id === subId ? { ...s, correctAnswer: val } : s));
    const newAns = newSubs.map((s) => `${s.id}: ${s.correctAnswer}`).join(' | ');
    const updated: Question = {
      ...q,
      subItems: newSubs,
      correctAnswer: newAns,
    };
    storageService.saveQuestion(updated);
    refreshQuestions();
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.content) {
      alert('Vui lòng nhập đầy đủ nội dung câu hỏi!');
      return;
    }

    let finalCorrectAnswer = editingQuestion.correctAnswer || '';
    let subItems = editingQuestion.subItems;

    if (editingQuestion.type === 'true_false') {
      if (subItems && subItems.length > 0) {
        if (subItems.some((s) => !s.content.trim())) {
          alert('Vui lòng nhập nội dung cho tất cả 4 ý khẳng định (a, b, c, d)!');
          return;
        }
        finalCorrectAnswer = subItems.map((s) => `${s.id}: ${s.correctAnswer}`).join(' | ');
      } else {
        finalCorrectAnswer = editingQuestion.correctAnswer || 'Đúng';
      }
    }

    if (!finalCorrectAnswer) {
      alert('Vui lòng chọn đáp án đúng cho câu hỏi!');
      return;
    }

    const qToSave: Question = {
      id: editingQuestion.id || `q-${Date.now()}`,
      subject: editingQuestion.subject || 'Toán',
      grade: 10,
      chapter: editingQuestion.chapter || 'Chương 1',
      lesson: editingQuestion.lesson || 'Bài 1',
      difficulty: (editingQuestion.difficulty as DifficultyLevel) || 'nhan_biet',
      type: (editingQuestion.type as QuestionType) || 'single_choice',
      content: editingQuestion.content,
      subItems: editingQuestion.type === 'true_false' ? subItems : undefined,
      options:
        editingQuestion.type === 'single_choice'
          ? editingQuestion.options || ['A. Phương án 1', 'B. Phương án 2', 'C. Phương án 3', 'D. Phương án 4']
          : undefined,
      correctAnswer: finalCorrectAnswer,
      points: editingQuestion.points || 1,
      explanation: editingQuestion.explanation || '',
      createdAt: editingQuestion.createdAt || new Date().toISOString(),
    };

    storageService.saveQuestion(qToSave);
    setEditingQuestion(null);
    refreshQuestions();
  };

  // Count by type
  const counts = useMemo(() => {
    return {
      total: questions.length,
      singleChoice: questions.filter((q) => q.type === 'single_choice').length,
      trueFalse: questions.filter((q) => q.type === 'true_false').length,
      shortAnswer: questions.filter((q) => q.type === 'short_answer').length,
    };
  }, [questions]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#0D47A1]" />
            Ngân hàng câu hỏi Khối 10 ({questions.length} câu)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tích hợp đầy đủ các dạng: Trắc nghiệm nhiều lựa chọn, Đúng/Sai và Trả lời ngắn theo GDPT 2018
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => wordParserService.downloadSampleWordDoc()}
            className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 rounded-lg bg-blue-50/70 hover:bg-blue-100 text-xs sm:text-sm font-bold text-[#0D47A1] shadow-2xs cursor-pointer"
            title="Tải đề thi mẫu Word (.doc) chuẩn cấu trúc Bộ GD&ĐT"
          >
            <Download className="w-4 h-4 text-[#FF8A00]" />
            <span className="hidden sm:inline">Mẫu Word (.doc)</span>
          </button>

          <button
            onClick={() => setIsWordImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
            title="Nhập câu hỏi từ file Word (.docx) hoặc dán văn bản"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>IMPORT FILE WORD (.DOCX)</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>IMPORT EXCEL</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setEditingQuestion({
                  subject: 'Toán',
                  grade: 10,
                  chapter: 'Chương 1: Mệnh đề và tập hợp',
                  lesson: 'Bài 1: Mệnh đề toán học',
                  difficulty: 'thong_hieu',
                  type: 'true_false',
                  content: '',
                  subItems: [
                    { id: 'a', label: 'a)', content: '', correctAnswer: 'Đúng' },
                    { id: 'b', label: 'b)', content: '', correctAnswer: 'Đúng' },
                    { id: 'c', label: 'c)', content: '', correctAnswer: 'Sai' },
                    { id: 'd', label: 'd)', content: '', correctAnswer: 'Đúng' },
                  ],
                  correctAnswer: 'a: Đúng | b: Đúng | c: Sai | d: Đúng',
                  points: 1,
                  explanation: '',
                })
              }
              className="flex items-center gap-1 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              title="Thêm nhanh câu hỏi Đúng / Sai 4 ý"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ CÂU ĐÚNG/SAI 4 Ý</span>
            </button>

            <button
              onClick={() =>
                setEditingQuestion({
                  subject: 'Toán',
                  grade: 10,
                  chapter: 'Chương 1',
                  lesson: 'Bài 1',
                  difficulty: 'van_dung',
                  type: 'short_answer',
                  content: '',
                  correctAnswer: '',
                  points: 1,
                  explanation: '',
                })
              }
              className="flex items-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              title="Thêm nhanh câu hỏi Trả lời ngắn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ TRẢ LỜI NGẮN</span>
            </button>

            <button
              onClick={() =>
                setEditingQuestion({
                  subject: 'Toán',
                  grade: 10,
                  chapter: 'Chương 1',
                  lesson: 'Bài 1',
                  difficulty: 'nhan_biet',
                  type: 'single_choice',
                  content: '',
                  options: ['A. ', 'B. ', 'C. ', 'D. '],
                  correctAnswer: 'A',
                  points: 1,
                  explanation: '',
                })
              }
              className="flex items-center gap-1 px-3 py-2 bg-[#0D47A1] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span>+ THÊM CÂU HỎI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Question Type Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => setSelectedType('ALL')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            selectedType === 'ALL'
              ? 'bg-[#0D47A1] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Tất cả các dạng</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedType === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.total}
          </span>
        </button>

        <button
          onClick={() => setSelectedType('single_choice')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            selectedType === 'single_choice'
              ? 'bg-[#0D47A1] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Trắc nghiệm 1 đáp án</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedType === 'single_choice' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.singleChoice}
          </span>
        </button>

        <button
          onClick={() => setSelectedType('true_false')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            selectedType === 'true_false'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <span>Đúng / Sai</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${selectedType === 'true_false' ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-900'}`}>
            {counts.trueFalse}
          </span>
        </button>

        <button
          onClick={() => setSelectedType('short_answer')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            selectedType === 'short_answer'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <span>Trả lời ngắn</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${selectedType === 'short_answer' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'}`}>
            {counts.shortAnswer}
          </span>
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nội dung, chương, bài..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
            >
              <option value="ALL">Tất cả môn học ({uniqueSubjects.length} môn)</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  Môn {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="nhan_biet">Nhận biết</option>
              <option value="thong_hieu">Thông hiểu</option>
              <option value="van_dung">Vận dụng</option>
              <option value="van_dung_cao">Vận dụng cao</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-700">Chưa có câu hỏi nào khớp với tìm kiếm</h3>
            <p className="text-xs text-slate-500 mt-1">
              Thử thay đổi bộ lọc hoặc thêm câu hỏi mới từ Excel.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              {/* Question metadata row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">#{idx + 1}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0D47A1] font-bold text-xs border border-blue-200">
                    {q.subject}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                    {q.chapter}
                  </span>
                  {q.type === 'true_false' ? (
                    <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-purple-100 text-purple-800 border border-purple-300">
                      Đúng / Sai
                    </span>
                  ) : q.type === 'short_answer' ? (
                    <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                      Trả lời ngắn
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      Trắc nghiệm ABCD
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {q.difficulty === 'nhan_biet'
                      ? 'Nhận biết'
                      : q.difficulty === 'thong_hieu'
                      ? 'Thông hiểu'
                      : q.difficulty === 'van_dung'
                      ? 'Vận dụng'
                      : 'Vận dụng cao'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(q)}
                    title="Sao chép câu hỏi"
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingQuestion(q)}
                    title="Chỉnh sửa câu hỏi"
                    className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    title="Xóa câu hỏi"
                    className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Content */}
              <div className="text-sm sm:text-base font-medium text-slate-900 whitespace-pre-line">
                {q.content}
              </div>

              {/* Options */}
              {q.type === 'single_choice' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {q.options.map((opt, oIdx) => {
                    const optLetter = ['A', 'B', 'C', 'D'][oIdx] || opt.charAt(0);
                    const isCorrect = q.correctAnswer.toUpperCase() === optLetter.toUpperCase();

                    return (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border flex items-center gap-2 ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white border flex items-center justify-center font-bold text-[11px] shrink-0">
                          {optLetter}
                        </span>
                        <span>{opt.replace(/^[A-Da-d][.)]\s*/, '')}</span>
                        {isCorrect && (
                          <span className="ml-auto text-emerald-700 text-[11px] font-bold">
                            ✓ Đáp án đúng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'true_false' && (
                q.subItems && q.subItems.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-purple-900 bg-purple-50/70 px-3 py-1.5 rounded-lg border border-purple-200">
                      <span className="font-extrabold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                        Dạng Đúng / Sai 4 ý khẳng định (GDPT 2018)
                      </span>
                      <span className="text-[11px] font-bold text-purple-700 bg-white/80 px-2 py-0.5 rounded border border-purple-200">
                        Thang điểm: 1 ý = 0,1đ • 2 ý = 0,25đ • 3 ý = 0,5đ • 4 ý = 1,0đ
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {q.subItems.map((sub) => {
                        const isTrue = sub.correctAnswer === 'Đúng';

                        return (
                          <div
                            key={sub.id}
                            className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${
                              isTrue ? 'bg-emerald-50/20 border-emerald-200' : 'bg-rose-50/20 border-rose-200'
                            }`}
                          >
                            <div className="flex items-start gap-2 flex-1">
                              <span className="font-mono font-black text-[#0D47A1] bg-white px-2 py-0.5 rounded-md border border-slate-300 shrink-0 text-xs shadow-2xs">
                                {sub.label || `${sub.id})`}
                              </span>
                              <span className="text-slate-800 font-medium leading-relaxed">
                                {sub.content}
                              </span>
                            </div>

                            {/* Direct Tích / Chọn ĐÚNG - SAI in Bank */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleQuickToggleBankSubItem(q, sub.id, 'Đúng')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all cursor-pointer ${
                                  isTrue
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-emerald-50'
                                }`}
                                title="Bấm để đổi đáp án thành Đúng"
                              >
                                {isTrue ? '✓ ĐÚNG' : 'ĐÚNG'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickToggleBankSubItem(q, sub.id, 'Sai')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all cursor-pointer ${
                                  !isTrue
                                    ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-rose-50'
                                }`}
                                title="Bấm để đổi đáp án thành Sai"
                              >
                                {!isTrue ? '✓ SAI' : 'SAI'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span className="font-semibold text-slate-600">Dạng Đúng/Sai:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Đáp án: {q.correctAnswer}
                    </span>
                  </div>
                )
              )}

              {q.type === 'short_answer' && (
                <div className="flex items-center gap-3 text-xs pt-1">
                  <span className="font-semibold text-slate-600">Trả lời ngắn:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Đáp án đúng: "{q.correctAnswer}"
                  </span>
                </div>
              )}

              {q.explanation && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-[#0D47A1]">Giải thích: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Question Excel Import Modal */}
      <QuestionImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(count) => {
          alert(`Đã nhập thành công ${count} câu hỏi vào ngân hàng đề!`);
          refreshQuestions();
        }}
      />

      {/* Add / Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingQuestion.id ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
              </h2>
              <button
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Môn</label>
                  <select
                    value={editingQuestion.subject || 'Toán'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, subject: e.target.value })}
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mức độ</label>
                  <select
                    value={editingQuestion.difficulty || 'nhan_biet'}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as DifficultyLevel })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="nhan_biet">Nhận biết</option>
                    <option value="thong_hieu">Thông hiểu</option>
                    <option value="van_dung">Vận dụng</option>
                    <option value="van_dung_cao">Vận dụng cao</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chương</label>
                  <input
                    type="text"
                    value={editingQuestion.chapter || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, chapter: e.target.value })}
                    placeholder="Chương 1..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dạng câu hỏi</label>
                  <select
                    value={editingQuestion.type || 'single_choice'}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="single_choice">Trắc nghiệm 1 đáp án</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="short_answer">Trả lời ngắn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nội dung câu hỏi *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingQuestion.content || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                  placeholder="Nhập nội dung đề bài..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D47A1]"
                />
              </div>

              {/* Options for single_choice */}
              {editingQuestion.type === 'single_choice' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Phương án trả lời & Đáp án đúng
                  </label>
                  {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                    <div key={letter} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={editingQuestion.correctAnswer?.toUpperCase() === letter}
                        onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: letter })}
                        className="text-[#0D47A1] w-4 h-4 cursor-pointer"
                      />
                      <span className="font-bold text-xs w-6">{letter}.</span>
                      <input
                        type="text"
                        value={(editingQuestion.options?.[optIdx] || '').replace(/^[A-Da-d][.)]\s*/, '')}
                        onChange={(e) => {
                          const currentOpts = [...(editingQuestion.options || ['', '', '', ''])];
                          currentOpts[optIdx] = `${letter}. ${e.target.value}`;
                          setEditingQuestion({ ...editingQuestion, options: currentOpts });
                        }}
                        placeholder={`Nội dung đáp án ${letter}...`}
                        className="flex-1 p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 4-Item True/False Editor with Tích Đúng/Sai */}
              {editingQuestion.type === 'true_false' && (() => {
                const subList: TrueFalseSubItem[] = editingQuestion.subItems && editingQuestion.subItems.length > 0
                  ? editingQuestion.subItems
                  : [
                      { id: 'a', label: 'a)', content: '', correctAnswer: 'Đúng' },
                      { id: 'b', label: 'b)', content: '', correctAnswer: 'Đúng' },
                      { id: 'c', label: 'c)', content: '', correctAnswer: 'Sai' },
                      { id: 'd', label: 'd)', content: '', correctAnswer: 'Đúng' },
                    ];

                const setSubItem = (id: string, field: 'content' | 'correctAnswer', val: string) => {
                  const updated = subList.map((item) => (item.id === id ? { ...item, [field]: val } : item));
                  setEditingQuestion({
                    ...editingQuestion,
                    subItems: updated,
                    correctAnswer: updated.map((s) => `${s.id}: ${s.correctAnswer}`).join(' | '),
                  });
                };

                const setPreset = (preset: 'ALL_TRUE' | 'ALL_FALSE' | 'ALTERNATE') => {
                  const updated = subList.map((item, idx) => {
                    let ans: 'Đúng' | 'Sai' = 'Đúng';
                    if (preset === 'ALL_FALSE') ans = 'Sai';
                    else if (preset === 'ALTERNATE') ans = idx % 2 === 0 ? 'Đúng' : 'Sai';
                    return { ...item, correctAnswer: ans };
                  });
                  setEditingQuestion({
                    ...editingQuestion,
                    subItems: updated,
                    correctAnswer: updated.map((s) => `${s.id}: ${s.correctAnswer}`).join(' | '),
                  });
                };

                return (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <div>
                        <span className="block font-bold text-xs text-purple-950 uppercase">
                          Cấu trúc 4 ý khẳng định (a, b, c, d)
                        </span>
                        <p className="text-[11px] text-purple-700">
                          Thang điểm Bộ GD&ĐT: 1 ý = 0,1đ • 2 ý = 0,25đ • 3 ý = 0,5đ • 4 ý = 1,0đ
                        </p>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[11px] text-slate-500 font-medium">Tích nhanh:</span>
                        <button
                          type="button"
                          onClick={() => setPreset('ALL_TRUE')}
                          className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 hover:bg-emerald-200 cursor-pointer"
                        >
                          Tất cả Đúng
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreset('ALL_FALSE')}
                          className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300 hover:bg-rose-200 cursor-pointer"
                        >
                          Tất cả Sai
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreset('ALTERNATE')}
                          className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-300 hover:bg-purple-200 cursor-pointer"
                        >
                          Đ-S-Đ-S
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {subList.map((sub) => {
                        const isTrue = sub.correctAnswer === 'Đúng';

                        return (
                          <div
                            key={sub.id}
                            className={`p-2.5 sm:p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${
                              isTrue ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/30 border-rose-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-black text-[#0D47A1] w-6 shrink-0 text-center font-mono text-sm">
                                {sub.label || `${sub.id})`}
                              </span>
                              <input
                                type="text"
                                required
                                value={sub.content}
                                onChange={(e) => setSubItem(sub.id, 'content', e.target.value)}
                                placeholder={`Nhập nội dung mệnh đề ý ${sub.id}...`}
                                className="flex-1 p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                              />
                            </div>

                            {/* TÍCH ĐÚNG / SAI BUTTONS */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => setSubItem(sub.id, 'correctAnswer', 'Đúng')}
                                className={`px-3 py-1.5 rounded-lg font-black text-xs border transition-all cursor-pointer flex items-center gap-1 ${
                                  isTrue
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs ring-2 ring-emerald-300'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                                }`}
                              >
                                <span>{isTrue ? '✓ ĐÚNG' : 'ĐÚNG'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSubItem(sub.id, 'correctAnswer', 'Sai')}
                                className={`px-3 py-1.5 rounded-lg font-black text-xs border transition-all cursor-pointer flex items-center gap-1 ${
                                  !isTrue
                                    ? 'bg-rose-600 text-white border-rose-700 shadow-2xs ring-2 ring-rose-300'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50'
                                }`}
                              >
                                <span>{!isTrue ? '✓ SAI' : 'SAI'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {editingQuestion.type === 'short_answer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Đáp án đúng (chuỗi hoặc số):
                  </label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.correctAnswer || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                    placeholder="Ví dụ: 8 hoặc x=2..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lời giải chi tiết / Giải thích
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  placeholder="Giải thích vì sao đáp án này đúng..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D47A1] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  LƯU CÂU HỎI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Word Question Import Modal */}
      <WordQuestionImportModal
        isOpen={isWordImportModalOpen}
        onClose={() => setIsWordImportModalOpen(false)}
        onImportComplete={(count) => {
          alert(`Đã nhập thành công ${count} câu hỏi vào ngân hàng đề!`);
          refreshQuestions();
        }}
      />
    </div>
  );
};
