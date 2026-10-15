import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  Check,
  Sliders,
  Layers,
  Clock,
  Calendar,
  CheckSquare,
  HelpCircle,
  FileText,
  AlertTriangle,
  BookmarkCheck,
  CheckCircle2,
} from 'lucide-react';
import { Exam, Question } from '../../types';
import { storageService } from '../../services/storage';

interface AutoExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamCreated: (exam: Exam) => void;
}

export type StructurePreset =
  | 'gdpt_15min'
  | 'gdpt_45min'
  | 'gdpt_thpt'
  | 'only_choice'
  | 'custom';

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
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['10A1', '10A3']);
  const [isAllClasses, setIsAllClasses] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [examCode, setExamCode] = useState('101');

  // Question Format Structure (Theo Chương trình GDPT 2018)
  const [structurePreset, setStructurePreset] = useState<StructurePreset>('gdpt_15min');
  const [singleChoiceCount, setSingleChoiceCount] = useState(6);
  const [trueFalseCount, setTrueFalseCount] = useState(2);
  const [shortAnswerCount, setShortAnswerCount] = useState(2);

  // Cognitive Matrix distribution percentages (Nhận biết 40%, Thông hiểu 30%, Vận dụng 20%, Vận dụng cao 10%)
  const [nhanBietPct, setNhanBietPct] = useState(40);
  const [thongHieuPct, setThongHieuPct] = useState(30);
  const [vanDungPct, setVanDungPct] = useState(20);
  const [vanDungCaoPct, setVanDungCaoPct] = useState(10);

  // Available topics for chosen subject
  const availableTopics = useMemo(() => {
    const list = allQuestions.filter((q) => q.subject === subject);
    return Array.from(new Set(list.map((q) => q.chapter)));
  }, [allQuestions, subject]);

  // Questions matching subject & topic
  const matchingPool = useMemo(() => {
    return allQuestions.filter((q) => {
      const matchSub = q.subject === subject;
      const matchTop = topic === 'ALL' || q.chapter === topic;
      return matchSub && matchTop;
    });
  }, [allQuestions, subject, topic]);

  // Pool counts broken down by question type
  const poolTypeCounts = useMemo(() => {
    const single = matchingPool.filter(
      (q) => q.type === 'single_choice' || (!q.type && q.options && q.options.length > 0)
    );
    const tf = matchingPool.filter((q) => q.type === 'true_false');
    const sa = matchingPool.filter((q) => q.type === 'short_answer');

    return {
      singleChoice: single.length,
      trueFalse: tf.length,
      shortAnswer: sa.length,
      total: matchingPool.length,
    };
  }, [matchingPool]);

  // Pool counts broken down by difficulty
  const poolDiffCounts = useMemo(() => {
    return {
      nhanBiet: matchingPool.filter((q) => q.difficulty === 'nhan_biet').length,
      thongHieu: matchingPool.filter((q) => q.difficulty === 'thong_hieu').length,
      vanDung: matchingPool.filter((q) => q.difficulty === 'van_dung').length,
      vanDungCao: matchingPool.filter((q) => q.difficulty === 'van_dung_cao').length,
    };
  }, [matchingPool]);

  // Apply structure preset
  const handleSelectPreset = (preset: StructurePreset) => {
    setStructurePreset(preset);
    if (preset === 'gdpt_15min') {
      setSingleChoiceCount(6);
      setTrueFalseCount(2);
      setShortAnswerCount(2);
      setDurationMinutes(15);
      if (!title || title.includes('Kiểm tra')) {
        setTitle(`Kiểm tra 15 phút ${subject} 10 (Chuẩn GDPT 2018)`);
      }
    } else if (preset === 'gdpt_45min') {
      setSingleChoiceCount(12);
      setTrueFalseCount(4);
      setShortAnswerCount(4);
      setDurationMinutes(45);
      if (!title || title.includes('Kiểm tra')) {
        setTitle(`Kiểm tra định kỳ 45 phút ${subject} 10 (Ma trận GDPT 2018)`);
      }
    } else if (preset === 'gdpt_thpt') {
      setSingleChoiceCount(22);
      setTrueFalseCount(4);
      setShortAnswerCount(8);
      setDurationMinutes(90);
      if (!title || title.includes('Kiểm tra')) {
        setTitle(`Đề thi thử THPT Quốc gia ${subject} 10`);
      }
    } else if (preset === 'only_choice') {
      setSingleChoiceCount(10);
      setTrueFalseCount(0);
      setShortAnswerCount(0);
      setDurationMinutes(15);
    }
  };

  const totalCalculatedQuestions = singleChoiceCount + trueFalseCount + shortAnswerCount;

  // Target count per difficulty level
  const targetCounts = useMemo(() => {
    const nb = Math.round((totalCalculatedQuestions * nhanBietPct) / 100);
    const th = Math.round((totalCalculatedQuestions * thongHieuPct) / 100);
    const vd = Math.round((totalCalculatedQuestions * vanDungPct) / 100);
    const vdc = Math.max(0, totalCalculatedQuestions - (nb + th + vd));
    return { nb, th, vd, vdc };
  }, [totalCalculatedQuestions, nhanBietPct, thongHieuPct, vanDungPct]);

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

    if (totalCalculatedQuestions === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi cho cấu trúc đề thi!');
      return;
    }

    // Helper shuffle
    const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => 0.5 - Math.random());

    // Separate matching pool by question type
    const singleChoicePool = matchingPool.filter(
      (q) => q.type === 'single_choice' || (!q.type && q.options && q.options.length > 0)
    );
    const trueFalsePool = matchingPool.filter((q) => q.type === 'true_false');
    const shortAnswerPool = matchingPool.filter((q) => q.type === 'short_answer');

    // Smart picker prioritizing cognitive level distribution
    const pickQuestionsFromPool = (pool: Question[], targetCount: number): Question[] => {
      if (pool.length <= targetCount) {
        return [...pool];
      }
      // Group by difficulty inside this type
      const nb = shuffleArray(pool.filter((q) => q.difficulty === 'nhan_biet'));
      const th = shuffleArray(pool.filter((q) => q.difficulty === 'thong_hieu'));
      const vd = shuffleArray(pool.filter((q) => q.difficulty === 'van_dung'));
      const vdc = shuffleArray(pool.filter((q) => q.difficulty === 'van_dung_cao'));

      const targetNb = Math.round((targetCount * nhanBietPct) / 100);
      const targetTh = Math.round((targetCount * thongHieuPct) / 100);
      const targetVd = Math.round((targetCount * vanDungPct) / 100);
      const targetVdc = Math.max(0, targetCount - (targetNb + targetTh + targetVd));

      let chosen: Question[] = [
        ...nb.slice(0, targetNb),
        ...th.slice(0, targetTh),
        ...vd.slice(0, targetVd),
        ...vdc.slice(0, targetVdc),
      ];

      // If still missing, fill with remaining pool
      if (chosen.length < targetCount) {
        const chosenIds = new Set(chosen.map((q) => q.id));
        const remaining = shuffleArray(pool.filter((q) => !chosenIds.has(q.id)));
        chosen = [...chosen, ...remaining.slice(0, targetCount - chosen.length)];
      }

      return chosen.slice(0, targetCount);
    };

    const pickedSingle = pickQuestionsFromPool(singleChoicePool, singleChoiceCount);
    const pickedTf = pickQuestionsFromPool(trueFalsePool, trueFalseCount);
    const pickedSa = pickQuestionsFromPool(shortAnswerPool, shortAnswerCount);

    // If any section is short of questions, backfill from general pool if available
    let allPicked = [...pickedSingle, ...pickedTf, ...pickedSa];
    if (allPicked.length < totalCalculatedQuestions) {
      const pickedIds = new Set(allPicked.map((q) => q.id));
      const remainingOverall = shuffleArray(matchingPool.filter((q) => !pickedIds.has(q.id)));
      const backfill = remainingOverall.slice(0, totalCalculatedQuestions - allPicked.length);
      allPicked = [...allPicked, ...backfill];
    }

    if (allPicked.length === 0) {
      alert(
        `Không có đủ câu hỏi môn ${subject} trong ngân hàng đề để tạo bài kiểm tra. Vui lòng thêm câu hỏi vào ngân hàng đề trước khi tạo.`
      );
      return;
    }

    // Pedagogical organization: Part I (Multiple Choice) -> Part II (True/False) -> Part III (Short Answer)
    let orderedQuestions: Question[] = [];
    if (shuffleQuestions) {
      // If shuffle is requested, shuffle within each section to maintain clear section headers in exam
      const singles = shuffleArray(allPicked.filter((q) => q.type === 'single_choice' || !q.type));
      const tfs = shuffleArray(allPicked.filter((q) => q.type === 'true_false'));
      const sas = shuffleArray(allPicked.filter((q) => q.type === 'short_answer'));
      orderedQuestions = [...singles, ...tfs, ...sas];
    } else {
      orderedQuestions = allPicked;
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
      questionIds: orderedQuestions.map((q) => q.id),
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-900 via-[#0D47A1] to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FF8A00] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                TẠO ĐỀ THI TỰ ĐỘNG THEO MA TRẬN ĐỀ
              </h2>
              <p className="text-xs text-blue-200">
                Cấu trúc ma trận theo chuẩn Bộ GD&ĐT (GDPT 2018): Trắc nghiệm nhiều lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* 1. Exam Title & Subject */}
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
                placeholder="Ví dụ: Kiểm tra 15 phút Toán 10 - Chương 1 (Ma trận GDPT)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D47A1] font-medium"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
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

          {/* 2. Topic & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Khối áp dụng
              </label>
              <input
                type="text"
                disabled
                value="Khối 10 – THPT Thanh Hòa (Đồng Nai)"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-sm font-semibold text-slate-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phạm vi kiến thức / Chủ đề
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
              >
                <option value="ALL">Toàn bộ các chương & chủ đề trong môn {subject}</option>
                {availableTopics.map((top) => (
                  <option key={top} value={top}>
                    {top}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. NEW FEATURE: CẤU TRÚC MA TRẬN DẠNG CÂU HỎI (GDPT 2018) */}
          <div className="p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border-2 border-blue-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/60">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-[#0D47A1]" />
                <span className="font-extrabold text-sm text-[#0D47A1] uppercase tracking-wide">
                  Cấu trúc dạng câu hỏi trong đề thi (Bộ GD&ĐT)
                </span>
              </div>
              <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-full">
                Tổng cộng: {totalCalculatedQuestions} câu hỏi
              </span>
            </div>

            {/* Structure Presets Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                Chọn mẫu cấu trúc ma trận chuẩn:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('gdpt_15min')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    structurePreset === 'gdpt_15min'
                      ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-sm font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-bold text-xs">Mẫu 15 phút (10 câu)</div>
                  <div className={`text-[11px] ${structurePreset === 'gdpt_15min' ? 'text-blue-100' : 'text-slate-500'}`}>
                    6 TN • 2 Đ/S • 2 TLN
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('gdpt_45min')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    structurePreset === 'gdpt_45min'
                      ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-sm font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-bold text-xs">Mẫu 45-50 phút (20 câu)</div>
                  <div className={`text-[11px] ${structurePreset === 'gdpt_45min' ? 'text-blue-100' : 'text-slate-500'}`}>
                    12 TN • 4 Đ/S • 4 TLN
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('gdpt_thpt')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    structurePreset === 'gdpt_thpt'
                      ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-sm font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-bold text-xs">Mẫu THPT QG (34 câu)</div>
                  <div className={`text-[11px] ${structurePreset === 'gdpt_thpt' ? 'text-blue-100' : 'text-slate-500'}`}>
                    22 TN • 4 Đ/S • 8 TLN
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStructurePreset('custom')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    structurePreset === 'custom'
                      ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-sm font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-bold text-xs">Tự cấu hình số câu</div>
                  <div className={`text-[11px] ${structurePreset === 'custom' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Tùy chỉnh số lượng
                  </div>
                </button>
              </div>
            </div>

            {/* 3 Detail Question Types Input Controls & Bank Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Type 1: Single Choice */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-[#0D47A1] flex items-center justify-center font-black text-[10px]">
                      I
                    </span>
                    Trắc nghiệm 4 lựa chọn
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={singleChoiceCount}
                    onChange={(e) => {
                      setStructurePreset('custom');
                      setSingleChoiceCount(Math.max(0, Number(e.target.value)));
                    }}
                    className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg font-black text-center text-sm text-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  />
                  <span className="text-xs text-slate-600 font-semibold">câu</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Kho hiện có:</span>
                  <span className="font-bold text-slate-800">{poolTypeCounts.singleChoice} câu</span>
                </div>
              </div>

              {/* Type 2: True / False 4 Sub-items */}
              <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-black text-[10px]">
                      II
                    </span>
                    Câu hỏi Đúng / Sai (4 ý)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={trueFalseCount}
                    onChange={(e) => {
                      setStructurePreset('custom');
                      setTrueFalseCount(Math.max(0, Number(e.target.value)));
                    }}
                    className="w-20 px-2.5 py-1.5 border border-purple-300 rounded-lg font-black text-center text-sm text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <span className="text-xs text-slate-600 font-semibold">câu ({trueFalseCount * 4} ý)</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Kho hiện có:</span>
                  <span className="font-bold text-purple-700">{poolTypeCounts.trueFalse} câu</span>
                </div>
              </div>

              {/* Type 3: Short Answer */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[10px]">
                      III
                    </span>
                    Câu hỏi Trả lời ngắn
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={shortAnswerCount}
                    onChange={(e) => {
                      setStructurePreset('custom');
                      setShortAnswerCount(Math.max(0, Number(e.target.value)));
                    }}
                    className="w-20 px-2.5 py-1.5 border border-emerald-300 rounded-lg font-black text-center text-sm text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-xs text-slate-600 font-semibold">câu</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Kho hiện có:</span>
                  <span className="font-bold text-emerald-700">{poolTypeCounts.shortAnswer} câu</span>
                </div>
              </div>
            </div>

            {/* Warning if requested questions exceed pool */}
            {(singleChoiceCount > poolTypeCounts.singleChoice ||
              trueFalseCount > poolTypeCounts.trueFalse ||
              shortAnswerCount > poolTypeCounts.shortAnswer) && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Lưu ý về số lượng trong kho câu hỏi: </span>
                  Số lượng câu hỏi yêu cầu ở một số dạng đang lớn hơn số câu hiện có trong kho đề môn {subject}. Hệ thống sẽ bốc tối đa số câu có sẵn và bổ sung câu hỏi phù hợp nhất để đảm bảo đủ bài thi.
                </div>
              </div>
            )}
          </div>

          {/* 4. Cognitive Level Matrix Distribution (Nhận thức) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#0D47A1]" />
                Ma trận mức độ nhận thức (Chuẩn: 40% - 30% - 20% - 10%)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Tổng: {nhanBietPct + thongHieuPct + vanDungPct + vanDungCaoPct}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-700 block">1. Nhận biết</span>
                <div className="text-base font-black text-[#0D47A1] my-1">
                  {nhanBietPct}% (~{targetCounts.nb} câu)
                </div>
                <div className="text-[11px] text-slate-500">
                  Kho hiện có: {poolDiffCounts.nhanBiet} câu
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-700 block">2. Thông hiểu</span>
                <div className="text-base font-black text-blue-600 my-1">
                  {thongHieuPct}% (~{targetCounts.th} câu)
                </div>
                <div className="text-[11px] text-slate-500">
                  Kho hiện có: {poolDiffCounts.thongHieu} câu
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-700 block">3. Vận dụng</span>
                <div className="text-base font-black text-amber-600 my-1">
                  {vanDungPct}% (~{targetCounts.vd} câu)
                </div>
                <div className="text-[11px] text-slate-500">
                  Kho hiện có: {poolDiffCounts.vanDung} câu
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-700 block">4. Vận dụng cao</span>
                <div className="text-base font-black text-red-600 my-1">
                  {vanDungCaoPct}% (~{targetCounts.vdc} câu)
                </div>
                <div className="text-[11px] text-slate-500">
                  Kho hiện có: {poolDiffCounts.vanDungCao} câu
                </div>
              </div>
            </div>
          </div>

          {/* 5. Time, Attempts, Exam Code */}
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-[#0D47A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Số lần được làm bài
              </label>
              <select
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-[#FF8A00]"
              />
            </div>
          </div>

          {/* 6. Classes Assignment */}
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
                <span>TOÀN BỘ KHỐI 10 (THPT THANH HÒA – ĐỒNG NAI)</span>
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

          {/* 7. Exam Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-xs">
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="rounded text-[#0D47A1]"
              />
              <span className="font-semibold">Trộn thứ tự trong từng phần</span>
            </label>

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="rounded text-[#0D47A1]"
              />
              <span className="font-semibold">Trộn phương án trắc nghiệm</span>
            </label>

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAnswers}
                onChange={(e) => setShowAnswers(e.target.checked)}
                className="rounded text-[#0D47A1]"
              />
              <span className="font-semibold">Cho xem đáp án sau nộp</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer hover:bg-slate-100"
            >
              HỦY BỎ
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#FF8A00] hover:bg-amber-600 text-white font-extrabold rounded-lg shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>TẠO ĐỀ THI THEO MA TRẬN ({totalCalculatedQuestions} CÂU)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
