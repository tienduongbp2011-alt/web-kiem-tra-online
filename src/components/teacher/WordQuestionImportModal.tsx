import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Trash2,
  HelpCircle,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { ParsedWordQuestion, wordParserService } from '../../services/wordParser';
import { storageService } from '../../services/storage';
import { DifficultyLevel } from '../../types';

interface WordQuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

export const WordQuestionImportModal: React.FC<WordQuestionImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSampleGuide, setShowSampleGuide] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Default meta for imported questions
  const [defaultSubject, setDefaultSubject] = useState('Toán');
  const [defaultChapter, setDefaultChapter] = useState('Chương 1: Mệnh đề và tập hợp');
  const [defaultLesson, setDefaultLesson] = useState('Bài 1: Mệnh đề toán học');

  // Parsed Questions state
  const [parsedList, setParsedList] = useState<ParsedWordQuestion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // File Upload handler (.docx)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);

    try {
      const rawText = await wordParserService.extractTextFromDocx(file);
      const results = wordParserService.parseTextToQuestions(
        rawText,
        defaultSubject,
        defaultChapter,
        defaultLesson
      );
      setParsedList(results);
    } catch (err) {
      console.error(err);
      alert('Không thể đọc file Word này. Hãy đảm bảo file có đuôi .docx hoặc chuyển sang tab "Dán văn bản từ Word" để dán trực tiếp.');
    } finally {
      setIsLoading(false);
    }
  };

  // Text Paste Parse handler
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      alert('Vui lòng dán nội dung câu hỏi từ Word vào ô văn bản!');
      return;
    }

    setIsLoading(true);
    try {
      const results = wordParserService.parseTextToQuestions(
        pastedText,
        defaultSubject,
        defaultChapter,
        defaultLesson
      );
      setParsedList(results);
      setFileName('Văn bản dán từ Word');
    } catch (err) {
      console.error(err);
      alert('Lỗi phân tích văn bản. Vui lòng kiểm tra định dạng.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy sample text to clipboard
  const handleCopySample = () => {
    const sample = wordParserService.getSampleDocxText();
    navigator.clipboard.writeText(sample);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Toggle Đúng/Sai for a sub-item in a 4-item True/False question
  const handleToggleSubItem = (qIndex: number, subId: string, val: 'Đúng' | 'Sai') => {
    const updated = [...parsedList];
    const targetQ = { ...updated[qIndex] };
    if (!targetQ.subItems) return;

    const newSubs = targetQ.subItems.map((sub) => {
      if (sub.id === subId) {
        return { ...sub, correctAnswer: val };
      }
      return sub;
    });

    targetQ.subItems = newSubs;
    targetQ.correctAnswer = newSubs.map((s) => `${s.id}: ${s.correctAnswer}`).join(', ');
    updated[qIndex] = targetQ;
    setParsedList(updated);
  };

  // Quick set all 4 items to preset
  const handleQuickPreset = (qIndex: number, preset: 'ALL_TRUE' | 'ALL_FALSE' | 'ALTERNATE') => {
    const updated = [...parsedList];
    const targetQ = { ...updated[qIndex] };
    if (!targetQ.subItems) return;

    const newSubs = targetQ.subItems.map((sub, idx) => {
      let ans: 'Đúng' | 'Sai' = 'Đúng';
      if (preset === 'ALL_FALSE') ans = 'Sai';
      else if (preset === 'ALTERNATE') ans = idx % 2 === 0 ? 'Đúng' : 'Sai';
      return { ...sub, correctAnswer: ans };
    });

    targetQ.subItems = newSubs;
    targetQ.correctAnswer = newSubs.map((s) => `${s.id}: ${s.correctAnswer}`).join(', ');
    updated[qIndex] = targetQ;
    setParsedList(updated);
  };

  // Edit sub-item statement content
  const handleSubItemContentChange = (qIndex: number, subId: string, text: string) => {
    const updated = [...parsedList];
    const targetQ = { ...updated[qIndex] };
    if (!targetQ.subItems) return;

    const newSubs = targetQ.subItems.map((sub) => {
      if (sub.id === subId) {
        return { ...sub, content: text };
      }
      return sub;
    });

    targetQ.subItems = newSubs;
    targetQ.isValid = !newSubs.some((s) => !s.content.trim()) && Boolean(targetQ.content.trim());
    updated[qIndex] = targetQ;
    setParsedList(updated);
  };

  // Edit question stem
  const handleStemChange = (qIndex: number, text: string) => {
    const updated = [...parsedList];
    updated[qIndex] = {
      ...updated[qIndex],
      content: text,
      isValid: Boolean(text.trim()),
    };
    setParsedList(updated);
  };

  // Delete single parsed question
  const handleDeleteParsedQuestion = (qIndex: number) => {
    const updated = parsedList.filter((_, idx) => idx !== qIndex);
    setParsedList(updated);
  };

  // Save all valid questions to storage
  const handleSaveToBank = () => {
    const invalidItems = parsedList.filter((q) => !q.isValid);
    if (invalidItems.length > 0) {
      alert(`Có ${invalidItems.length} câu hỏi chưa hoàn chỉnh hoặc có nội dung rỗng. Vui lòng kiểm tra lại trước khi lưu!`);
      return;
    }

    if (parsedList.length === 0) {
      alert('Chưa có câu hỏi nào để lưu.');
      return;
    }

    const domainQuestions = wordParserService.convertToDomainQuestions(parsedList);
    storageService.saveQuestionsBatch(domainQuestions);
    onImportComplete(domainQuestions.length);
    onClose();
  };

  const trueFalseCount = parsedList.filter((q) => q.type === 'true_false').length;
  const singleChoiceCount = parsedList.filter((q) => q.type === 'single_choice').length;
  const shortAnswerCount = parsedList.filter((q) => q.type === 'short_answer').length;
  const validCount = parsedList.filter((q) => q.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 font-bold border border-white/20">
              <FileText className="w-6 h-6 text-[#FF8A00]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Nhập câu hỏi từ file Word (.docx) & Dán văn bản</span>
                <span className="text-[10px] bg-purple-500/80 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Chuẩn GDPT 2018
                </span>
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Tự động nhận diện dạng <strong>Đúng/Sai 4 ý</strong> (thang điểm 0,1 - 0,25 - 0,5 - 1,0đ), trắc nghiệm 1 đáp án và trả lời ngắn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action ribbon: Template download & quick instructions */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => wordParserService.downloadSampleWordDoc()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-[#0D47A1] font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span>Tải file Word mẫu chuẩn (.doc)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSampleGuide(!showSampleGuide)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>{showSampleGuide ? 'Ẩn mẫu văn bản' : 'Xem mẫu văn bản'}</span>
            </button>
          </div>

          <div className="text-[11px] text-purple-900 bg-purple-100/70 border border-purple-200 px-2.5 py-1 rounded-md font-semibold hidden md:block">
            Thang điểm 4 ý Bộ GD&ĐT: 1 ý = 0,1đ • 2 ý = 0,25đ • 3 ý = 0,5đ • 4 ý = 1,0đ
          </div>
        </div>

        {/* Collapsible Sample Text format Guide */}
        {showSampleGuide && (
          <div className="p-4 bg-slate-100 border-b border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span>Định dạng mẫu chuẩn câu hỏi Đúng / Sai 4 ý trong file Word:</span>
              <button
                type="button"
                onClick={handleCopySample}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-700 font-bold cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Đã sao chép!' : 'Sao chép mẫu'}</span>
              </button>
            </div>
            <pre className="p-3 bg-white rounded-lg border border-slate-300 font-mono text-[11px] text-slate-800 overflow-x-auto leading-relaxed max-h-40">
              {wordParserService.getSampleDocxText()}
            </pre>
          </div>
        )}

        {/* Tabs & Source input section */}
        <div className="p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-[#0D47A1] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>1. Chọn file Word (.docx) từ máy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-[#0D47A1] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>2. Dán trực tiếp văn bản từ Word</span>
            </button>
          </div>

          {/* Quick Default metadata settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Môn học mặc định</label>
              <select
                value={defaultSubject}
                onChange={(e) => setDefaultSubject(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-medium"
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
              <label className="block font-bold text-slate-700 uppercase mb-1">Chương</label>
              <input
                type="text"
                value={defaultChapter}
                onChange={(e) => setDefaultChapter(e.target.value)}
                placeholder="Chương 1..."
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Bài / Chủ đề</label>
              <input
                type="text"
                value={defaultLesson}
                onChange={(e) => setDefaultLesson(e.target.value)}
                placeholder="Bài 1..."
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Tab 1: Upload .docx file */}
          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-blue-200 hover:border-[#0D47A1] rounded-2xl p-6 text-center bg-blue-50/30 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".docx,.doc"
                className="hidden"
              />
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0D47A1] flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-[#FF8A00]" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {fileName ? `Đã chọn file: ${fileName}` : 'Chọn file Word (.docx) chứa đề kiểm tra'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hệ thống tự động đọc đề bài, bóc tách câu hỏi, 4 mệnh đề a, b, c, d và đáp án Đúng/Sai
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="mt-2 px-5 py-2.5 bg-[#0D47A1] hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-black shadow-sm transition-all cursor-pointer"
                >
                  {isLoading ? 'ĐANG ĐỌC FILE WORD...' : 'TẢI FILE WORD (.DOCX) LÊN'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Paste text directly from Word */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Dán nội dung câu hỏi sao chép từ file Word vào đây... (Ví dụ: Câu 1: Cho hàm số... a) ... [Đúng] b) ... [Sai])"
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPastedText(wordParserService.getSampleDocxText())}
                  className="text-xs font-bold text-[#0D47A1] hover:underline cursor-pointer"
                >
                  + Dán văn bản mẫu thử nghiệm
                </button>

                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={isLoading || !pastedText.trim()}
                  className="px-5 py-2 bg-[#0D47A1] hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-sm cursor-pointer"
                >
                  {isLoading ? 'ĐANG PHÂN TÍCH...' : 'PHÂN TÍCH VĂN BẢN VÀ HIỂN THỊ CÂU HỎI'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview & Interactive Tích/Chọn Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {parsedList.length > 0 ? (
            <div className="space-y-4">
              {/* Summary Stats bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-800">
                    Tổng số câu nhận diện: <strong className="text-[#0D47A1] text-sm">{parsedList.length}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold border border-purple-200">
                    Đúng/Sai 4 ý: {trueFalseCount}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold border border-blue-200">
                    Trắc nghiệm ABCD: {singleChoiceCount}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200">
                    Trả lời ngắn: {shortAnswerCount}
                  </span>
                </div>

                <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hợp lệ: {validCount}/{parsedList.length} câu</span>
                </div>
              </div>

              {/* Parsed Questions List */}
              <div className="space-y-4">
                {parsedList.map((q, qIdx) => (
                  <div
                    key={q.tempId || qIdx}
                    className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
                  >
                    {/* Item Top Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#0D47A1] text-white flex items-center justify-center font-bold text-xs">
                          {qIdx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-[#0D47A1] border border-blue-200">
                          {q.subject}
                        </span>
                        {q.type === 'true_false' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Đúng / Sai 4 ý (0,1 - 0,25 - 0,5 - 1,0đ)
                          </span>
                        ) : q.type === 'single_choice' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Trắc nghiệm 1 đáp án
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Trả lời ngắn
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-medium">
                          ({q.difficulty === 'nhan_biet' ? 'Nhận biết' : q.difficulty === 'thong_hieu' ? 'Thông hiểu' : q.difficulty === 'van_dung' ? 'Vận dụng' : 'Vận dụng cao'})
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteParsedQuestion(qIdx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Stem Content */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">
                        Nội dung câu hỏi / Câu dẫn:
                      </label>
                      <textarea
                        rows={2}
                        value={q.content}
                        onChange={(e) => handleStemChange(qIdx, e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#0D47A1]"
                      />
                    </div>

                    {/* True / False 4 Sub-items (INTERACTIVE TÍCH / CHỌN) */}
                    {q.type === 'true_false' && q.subItems && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-purple-950 flex items-center gap-1">
                            <span>4 ý khẳng định (Nhấp vào nút để TÍCH ĐÚNG hoặc SAI):</span>
                          </span>

                          {/* Quick Presets */}
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500">Tích nhanh:</span>
                            <button
                              type="button"
                              onClick={() => handleQuickPreset(qIdx, 'ALL_TRUE')}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded font-bold cursor-pointer"
                            >
                              Tất cả Đúng
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickPreset(qIdx, 'ALL_FALSE')}
                              className="px-2 py-0.5 bg-red-50 text-red-800 hover:bg-red-100 border border-red-300 rounded font-bold cursor-pointer"
                            >
                              Tất cả Sai
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickPreset(qIdx, 'ALTERNATE')}
                              className="px-2 py-0.5 bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-300 rounded font-bold cursor-pointer"
                            >
                              Đ-S-Đ-S
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {q.subItems.map((sub) => {
                            const isTrue = sub.correctAnswer === 'Đúng';

                            return (
                              <div
                                key={sub.id}
                                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                                  isTrue ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/30 border-rose-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="font-black text-[#0D47A1] w-6 shrink-0 text-center font-mono">
                                    {sub.id})
                                  </span>
                                  <input
                                    type="text"
                                    value={sub.content}
                                    onChange={(e) => handleSubItemContentChange(qIdx, sub.id, e.target.value)}
                                    placeholder={`Nội dung mệnh đề ${sub.id}...`}
                                    className="flex-1 p-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                                  />
                                </div>

                                {/* TÍCH ĐÚNG / SAI BUTTONS */}
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSubItem(qIdx, sub.id, 'Đúng')}
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
                                    onClick={() => handleToggleSubItem(qIdx, sub.id, 'Sai')}
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
                    )}

                    {/* Single Choice options preview */}
                    {q.type === 'single_choice' && q.options && (
                      <div className="space-y-2 pt-1 text-xs">
                        <label className="block font-bold text-slate-700">Các phương án lựa chọn:</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => {
                            const letter = ['A', 'B', 'C', 'D'][oIdx] || opt.charAt(0);
                            const isCorrect = q.correctAnswer.toUpperCase() === letter.toUpperCase();

                            return (
                              <div
                                key={oIdx}
                                onClick={() => {
                                  const updated = [...parsedList];
                                  updated[qIdx] = { ...updated[qIdx], correctAnswer: letter };
                                  setParsedList(updated);
                                }}
                                className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-full bg-white border flex items-center justify-center font-bold text-[11px] shrink-0">
                                  {letter}
                                </span>
                                <span className="flex-1">{opt.replace(/^[A-Da-d][.)]\s*/, '')}</span>
                                {isCorrect && (
                                  <span className="text-emerald-700 text-[11px] font-bold">
                                    ✓ Đáp án đúng
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Short Answer */}
                    {q.type === 'short_answer' && (
                      <div className="space-y-1 text-xs">
                        <label className="block font-bold text-slate-700">Đáp án ngắn:</label>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={(e) => {
                            const updated = [...parsedList];
                            updated[qIdx] = { ...updated[qIdx], correctAnswer: e.target.value };
                            setParsedList(updated);
                          }}
                          className="w-full sm:w-64 p-2 border border-slate-300 rounded-lg text-xs font-bold text-[#0D47A1]"
                        />
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <strong className="text-[#0D47A1]">Lời giải: </strong>
                        <span>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3 bg-white">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700">
                Chưa có câu hỏi nào được phân tích
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bấm vào <strong>"Tải file Word (.docx) lên"</strong> hoặc chuyển sang tab <strong>"Dán văn bản từ Word"</strong> để nhập đề thi.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-100 cursor-pointer"
          >
            HỦY BỎ
          </button>

          <button
            type="button"
            disabled={parsedList.length === 0 || validCount === 0}
            onClick={handleSaveToBank}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0D47A1] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#FF8A00]" />
            <span>LƯU {validCount} CÂU VÀO NGÂN HÀNG ĐỀ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
