export type Role = 'student' | 'teacher';

export type QuestionType = 'single_choice' | 'true_false' | 'short_answer';

export type DifficultyLevel = 'nhan_biet' | 'thong_hieu' | 'van_dung' | 'van_dung_cao';

export interface User {
  id: string;
  username: string; // Mã học sinh hoặc tài khoản
  fullName: string;
  role: Role;
  className?: string; // Khối 10: 10A1, 10A2, 10A3, 10A5, 10A9...
  password?: string;
  status: 'active' | 'locked';
  createdAt: string;
}

export interface TrueFalseSubItem {
  id: string; // 'a' | 'b' | 'c' | 'd'
  label: string; // 'a)', 'b)', 'c)', 'd)'
  content: string; // Nội dung mệnh đề ý a, b, c, d
  correctAnswer: 'Đúng' | 'Sai';
  explanation?: string;
}

export interface Question {
  id: string;
  subject: string; // Toán, Vật lí, Hóa học, Sinh học, Tin học, Tiếng Anh...
  grade: number; // 10
  chapter: string; // Chương
  lesson: string; // Bài / Chủ đề
  difficulty: DifficultyLevel; // Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao
  type: QuestionType; // single_choice | true_false | short_answer
  content: string; // Nội dung câu hỏi
  options?: string[]; // 4 phương án cho single_choice (A, B, C, D)
  subItems?: TrueFalseSubItem[]; // 4 ý a, b, c, d cho câu hỏi Đúng/Sai (thang điểm 0.1, 0.25, 0.5, 1.0)
  correctAnswer: string; // "A" | "B" | "C" | "D", hoặc "Đúng" / "Sai", hoặc chuỗi đáp án 4 ý
  points: number; // Điểm số mặc định
  explanation?: string; // Lời giải chi tiết
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string; // Tên bài kiểm tra
  subject: string; // Môn học
  grade: number; // 10
  targetClasses: string[]; // ["10A1", "10A3"] hoặc ["ALL"] (Toàn khối 10)
  durationMinutes: number; // Thời gian làm bài (phút)
  startTime: string; // ISO string
  endTime: string; // ISO string
  maxAttempts: number; // 1, 2, ...
  showAnswersAfterSubmit: boolean; // Có hiển thị đáp án sau nộp hay không
  shuffleQuestions: boolean; // Trộn thứ tự câu hỏi
  shuffleOptions: boolean; // Trộn phương án
  status: 'open' | 'closed' | 'scheduled'; // Trạng thái mở/đóng
  questionIds: string[]; // Danh sách ID câu hỏi trong đề
  totalPoints: number; // 10
  createdById: string;
  createdAt: string;
}

export interface StudentAnswer {
  questionId: string;
  answer: string; // "A", "B", "Đúng", "Sai", hoặc text
  subAnswers?: Record<string, 'Đúng' | 'Sai' | ''>; // { a: "Đúng", b: "Sai", c: "Đúng", d: "Sai" }
  isFlagged?: boolean; // Đánh dấu xem lại
  timeSpentSeconds?: number;
}

export interface ExamAttemptSession {
  examId: string;
  studentId: string;
  startedAt: string; // ISO string
  expiresAt: string; // ISO string
  answers: Record<string, StudentAnswer>; // questionId -> StudentAnswer
  questionOrder: string[]; // Ordered list of question IDs for this attempt
  isSubmitted: boolean;
  lastSavedAt: string;
}

export interface SubItemBreakdown {
  id: string; // 'a', 'b', 'c', 'd'
  label: string; // 'a)', 'b)', 'c)', 'd)'
  content: string;
  studentAnswer: string; // 'Đúng', 'Sai', hoặc '(Chưa chọn)'
  correctAnswer: string; // 'Đúng', 'Sai'
  isCorrect: boolean;
}

export interface QuestionResultBreakdown {
  questionId: string;
  questionContent: string;
  type: QuestionType;
  options?: string[];
  subItems?: SubItemBreakdown[];
  correctSubCount?: number; // Số ý đúng: 0, 1, 2, 3, 4
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation?: string;
}

export interface Submission {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  score: number; // Thang 10 (ví dụ 8.5)
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  answers: Record<string, StudentAnswer>;
  breakdown: QuestionResultBreakdown[];
}

export interface ClassRoom {
  id: string;
  name: string; // "10A1", "10A2", "10A3", "10A5", "10A9"
  grade: number; // 10
  studentCount?: number;
  homeroomTeacher?: string;
  description?: string;
}

export interface AutoGenerateCriteria {
  subject: string;
  grade: number;
  chapter?: string;
  lesson?: string;
  totalQuestions: number;
  distribution: {
    nhanBietPercent: number; // e.g. 40%
    thongHieuPercent: number; // e.g. 30%
    vanDungPercent: number; // e.g. 20%
    vanDungCaoPercent: number; // e.g. 10%
  };
}
