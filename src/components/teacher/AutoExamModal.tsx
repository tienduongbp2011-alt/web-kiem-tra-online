import React, { useState, useMemo } from 'react';
import { Sparkles, X, Check, Sliders, Layers, Clock, Calendar, CheckSquare } from 'lucide-react';
import { Exam, Question } from '../../types';
import { storageService } from '../../services/storage';

interface AutoExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamCreated: (exam: Exam) => void;
}

export const AutoExamModal: React.FC<AutoExamModalProps> = ({
  isOpen,
  onClose,
  onExamCreated,
}) => {
  const classes = storageService.getClasses();
  const allQuestions = storageService.getQuestions();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Toán');
  const [topic, setTopic] = useState('ALL');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['10A1', '10A3']);
  const [isAllClasses, setIsAllClasses] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [examCode, setExamCode] = useState('101');

  // Matrix distribution percentages: Nhận biết 40%, Thông hiểu 30%, Vận dụng 20%, Vận dụng cao 10%
  const [nhanBietPct, setNhanBietPct] = useState(40);
  const [thongHieuPct, setThongHieuPct] = useState(30);
  const [vanDungPct, setVanDungPct] = useState(20);
  const [vanDungCaoPct, setVanDungCaoPct] = useState(10);

  // Available topics for chosen subject
  const availableTopics = useMemo(() => {
    const list = allQuestions.filter((q) => q.subject === subject);
    return Array.from(new Set(list.map((q) => q.chapter)));
  }, [allQuestions, subject]);

  // Questions pools by difficulty matching subject & topic
  const matchingPool = useMemo(() => {
    return allQuestions.filter((q) => {
      const matchSub = q.subject === subject;
      const matchTop = topic === 'ALL' || q.chapter === topic;
      return matchSub && matchTop;
    });
  }, [allQuestions, subject, topic]);

  const poolCounts = useMemo(() => {
    return {
      nhanBiet: matchingPool.filter((q) => q.difficulty === 'nhan_biet').length,
      thongHieu: matchingPool.filter((q) => q.difficulty === 'thong_hieu').length,
      vanDung: matchingPool.filter((q) => q.difficulty === 'van_dung').length,
      vanDungCao: matchingPool.filter((q) => q.difficulty === 'van_dung_cao').length,
      total: matchingPool.length,
    };
  }, [matchingPool]);

  // Target count per level
  const targetCounts = useMemo(() => {
    const nb = Math.round((totalQuestions * nhanBietPct) / 100);
    const th = Math.round((totalQuestions * thongHieuPct) / 100);
    const vd = Math.round((totalQuestions * vanDungPct) / 100);
    const vdc = Math.max(0, totalQuestions - (nb + th + vd));
    return { nb, th, vd, vdc };
  }, [totalQuestions, nhanBietPct, thongHieuPct, vanDungPct]);

  if (!isOpen) return null;

  const handleToggleClass = (className: string) => {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Vui lòng nhập tên bài kiểm tra!');
      return;
    }

    if (!isAllClasses && selectedClasses.length === 0) {
      alert('Vui lòng chọn ít nhất một lớp được phép làm bài!');
      return;
    }

    // Pick questions according to matrix
    const nbQuestions = matchingPool.filter((q) => q.difficulty === 'nhan_biet');
    const thQuestions = matchingPool.filter((q) => q.difficulty === 'thong_hieu');
    const vdQuestions = matchingPool.filter((q) => q.difficulty === 'van_dung');
    const vdcQuestions = matchingPool.filter((q) => q.difficulty === 'van_dung_cao');

    // Shuffle helper
    const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => 0.5 - Math.random());

    const selectedNb = shuffleArray(nbQuestions).slice(0, targetCounts.nb);
    const selectedTh = shuffleArray(thQuestions).slice(0, targetCounts.th);
    const selectedVd = shuffleArray(vdQuestions).slice(0, targetCounts.vd);
    const selectedVdc = shuffleArray(vdcQuestions).slice(0, targetCounts.vdc);

    let picked = [...selectedNb, ...selectedTh, ...selectedVd, ...selectedVdc];

    // If bank does not have enough distinct questions, fill up with remaining matching questions
    if (picked.length < totalQuestions) {
      const pickedIds = new Set(picked.map((q) => q.id));
      const remaining = shuffleArray(matchingPool.filter((q) => !pickedIds.has(q.id)));
      picked = [...picked, ...remaining.slice(0, totalQuestions - picked.length)];
    }

    if (picked.length === 0) {
      alert(
        `Không có đủ câu hỏi môn ${subject} trong ngân hàng đề để tạo bài kiểm tra. Vui lòng thêm câu hỏi hoặc giảm số lượng câu.`
      );
      return;
    }

    if (shuffleQuestions) {
      picked = shuffleArray(picked);
    }

    const newExam: Exam = {
      id: `exam-auto-${Date.now()}`,
      title: `${title} (Mã đề ${examCode})`,
      subject,
      grade: 10,
      targetClasses: isAllClasses ? ['ALL'] : selectedClasses,
      durationMinutes,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxAttempts,
      showAnswersAfterSubmit: showAnswers,
      shuffleQuestions,
      shuffleOptions,
      status: 'open',
      questionIds: picked.map((q) => q.id),
      totalPoints: 10,
      createdById: 'u-teacher-1',
      createdAt: new Date().toISOString(),
    };

    storageService.saveExam(newExam);
    onExamCreated(newExam);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-900 to-[#0D47A1] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#FF8A00]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                TẠO ĐỀ THI TỰ ĐỘNG THEO MA TRẬN
              </h2>
              <p className="text-xs text-blue-200">
                Tự động lấy câu hỏi từ ngân hàng theo tỷ lệ chuẩn Bộ GD&ĐT cho Khối 10
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Exam Title & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tên bài kiểm tra *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Kiểm tra 15 phút Toán 10 - Chương 1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Môn học *
              </label>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setTopic('ALL');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              >
                <option value="Toán">Toán</option>
                <option value="Vật lí">Vật lí</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
                <option value="Tin học">Tin học</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Lịch sử">Lịch sử</option>
                <option value="Địa lí">Địa lí</option>
              </select>
            </div>
          </div>

          {/* Topic & Question Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Khối
              </label>
              <input
                type="text"
                disabled
                value="Khối 10 (THPT Thanh Hòa)"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-sm font-semibold text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Chủ đề / Chương
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              >
                <option value="ALL">Tất cả các chủ đề trong môn</option>
                {availableTopics.map((top) => (
                  <option key={top} value={top}>
                    {top}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Số lượng câu hỏi
              </label>
              <select
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              >
                <option value={5}>5 câu</option>
                <option value={10}>10 câu (15 phút)</option>
                <option value={20}>20 câu (45 phút)</option>
                <option value={30}>30 câu</option>
                <option value={40}>40 câu (chuẩn tốt nghiệp/HK)</option>
                <option value={50}>50 câu</option>
              </select>
            </div>
          </div>

          {/* Matrix Ratio: 40% - 30% - 20% - 10% */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#0D47A1]" />
                Cơ cấu ma trận câu hỏi (Mặc định: 40% - 30% - 20% - 10%)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Tổng: {nhanBietPct + thongHieuPct + vanDungPct + vanDungCaoPct}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="font-bold text-slate-700 block">1. Nhận biết</span>
                <div className="text-base font-black text-[#0D47A1] my-1">
                  {nhanBietPct}% ({targetCounts.nb} câu)
                </div>
                <div className="text-[11px] text-slate-500">
                  Kho hiện có: {poolCounts.nhanBiet} câu
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="font-bold text-slate-700 block">2. Thông hiểu</span>
                <div className="text-base font-black text-blue-600 my-1">
                  {thongHieuPct}% ({targetCounts.th} câu)
                </div>
                <div className="text-[11px] text-slate-500">
                  Kho hiện có: {poolCounts.thongHieu} câu
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="font-bold text-slate-700 block">3. Vận dụng</span>
                <div className="text-base font-black text-amber-600 my-1">
                  {vanDungPct}% ({targetCounts.vd} câu)
                </div>
                <div className="text-[11px] text-slate-500">
                  Kho hiện có: {poolCounts.vanDung} câu
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="font-bold text-slate-700 block">4. Vận dụng cao</span>
                <div className="text-base font-black text-red-600 my-1">
                  {vanDungCaoPct}% ({targetCounts.vdc} câu)
                </div>
                <div className="text-[11px] text-slate-500">
                  Kho hiện có: {poolCounts.vanDungCao} câu
                </div>
              </div>
            </div>
          </div>

          {/* Time, Attempts, Exam Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Thời gian làm bài (Phút)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Số lần được làm bài
              </label>
              <select
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value={1}>1 lần duy nhất</option>
                <option value={2}>2 lần</option>
                <option value={3}>3 lần</option>
                <option value={99}>Không giới hạn</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mã đề thi
              </label>
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                placeholder="101, 102..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          {/* Classes Assignment */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Chọn lớp được phép làm bài *
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-300 rounded-lg cursor-pointer text-xs font-bold text-[#0D47A1]">
                <input
                  type="checkbox"
                  checked={isAllClasses}
                  onChange={(e) => setIsAllClasses(e.target.checked)}
                  className="rounded text-[#0D47A1]"
                />
                <span>TOÀN BỘ KHỐI 10</span>
              </label>

              {!isAllClasses &&
                classes.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                      selectedClasses.includes(c.name)
                        ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(c.name)}
                      onChange={() => handleToggleClass(c.name)}
                      className="hidden"
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Exam Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-xs">
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="rounded text-[#0D47A1]"
              />
              <span className="font-semibold">Trộn thứ tự câu hỏi</span>
            </label>

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="rounded text-[#0D47A1]"
              />
              <span className="font-semibold">Trộn phương án trả lời</span>
            </label>

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showAnswers}
                onChange={(e) => setShowAnswers(e.target.checked)}
                className="rounded text-[#0D47A1]"
              />
              <span className="font-semibold">Cho phép xem đáp án sau nộp</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
            >
              HỦY
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#FF8A00] hover:bg-amber-600 text-white font-extrabold rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>TẠO ĐỀ TỰ ĐỘNG</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
