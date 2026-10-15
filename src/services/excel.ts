import * as XLSX from 'xlsx';
import { DifficultyLevel, Question, QuestionType, Submission, TrueFalseSubItem, User } from '../types';

export interface QuestionImportRow {
  rowNumber: number;
  subject: string;
  chapter: string;
  lesson: string;
  difficulty: string;
  type: string;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  points: number;
  explanation: string;
  isValid: boolean;
  errors: string[];
}

export interface StudentImportRow {
  rowNumber: number;
  studentCode: string;
  fullName: string;
  className: string;
  password?: string;
  isValid: boolean;
  errors: string[];
}

export const excelService = {
  // --- 1. EXPORT RESULTS TO EXCEL ---
  exportExamResults(examTitle: string, submissions: Submission[]): void {
    const data = submissions.map((sub, index) => {
      const minutes = Math.floor(sub.durationSeconds / 60);
      const seconds = sub.durationSeconds % 60;
      const durationFormatted = `${minutes} phút ${seconds < 10 ? '0' : ''}${seconds} giây`;
      const submittedAtFormatted = new Date(sub.submittedAt).toLocaleString('vi-VN');

      return {
        'STT': index + 1,
        'Mã học sinh': sub.studentCode,
        'Họ và tên': sub.studentName,
        'Lớp': sub.className,
        'Điểm': Number(sub.score.toFixed(2)),
        'Số câu đúng': sub.correctCount,
        'Số câu sai': sub.wrongCount,
        'Thời gian làm bài': durationFormatted,
        'Thời điểm nộp bài': submittedAtFormatted,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    // Auto-fit column widths
    const columnWidths = [
      { wch: 6 },  // STT
      { wch: 14 }, // Mã học sinh
      { wch: 25 }, // Họ và tên
      { wch: 10 }, // Lớp
      { wch: 10 }, // Điểm
      { wch: 14 }, // Số câu đúng
      { wch: 14 }, // Số câu sai
      { wch: 20 }, // Thời gian làm bài
      { wch: 22 }, // Thời điểm nộp bài
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả thi');
    
    // Clean filename
    const cleanName = examTitle.replace(/[/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(workbook, `Ket_qua_${cleanName}.xlsx`);
  },

  // --- 2. EXPORT STUDENTS LIST TO EXCEL ---
  exportStudentsList(students: User[], className?: string): void {
    const data = students.map((s, index) => ({
      'STT': index + 1,
      'Mã HS': s.username,
      'Họ và tên': s.fullName,
      'Lớp': s.className || '',
      'Tài khoản': s.username,
      'Trạng thái': s.status === 'active' ? 'Hoạt động' : 'Đã khóa',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 25 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh');
    const suffix = className ? `_${className}` : '_Khoi_10';
    XLSX.writeFile(wb, `Danh_sach_hoc_sinh${suffix}.xlsx`);
  },

  // --- 3. DOWNLOAD SAMPLE TEMPLATES ---
  downloadQuestionTemplate(): void {
    const sampleData = [
      {
        'STT': 1,
        'Môn': 'Toán',
        'Chương': 'Chương 1: Mệnh đề và tập hợp',
        'Bài': 'Bài 1: Mệnh đề toán học',
        'Mức độ': 'Nhận biết',
        'Dạng câu': 'Trắc nghiệm 1 đáp án',
        'Nội dung câu hỏi': 'Câu nào sau đây là mệnh đề toán học?',
        'Đáp án A': 'Trời hôm nay nhiều mây quá!',
        'Đáp án B': 'Số 15 chia hết cho 3.',
        'Đáp án C': 'Bạn có khỏe không?',
        'Đáp án D': 'Hãy chú ý nghe giảng!',
        'Đáp án đúng': 'B',
        'Điểm': 1,
        'Giải thích': 'Mệnh đề toán học là khẳng định đúng hoặc sai.',
      },
      {
        'STT': 2,
        'Môn': 'Toán',
        'Chương': 'Chương 1: Mệnh đề và tập hợp',
        'Bài': 'Bài 2: Tập hợp',
        'Mức độ': 'Thông hiểu',
        'Dạng câu': 'Đúng / Sai',
        'Nội dung câu hỏi': 'Số 2 là số nguyên tố chẵn duy nhất.',
        'Đáp án A': 'Đúng',
        'Đáp án B': 'Sai',
        'Đáp án C': '',
        'Đáp án D': '',
        'Đáp án đúng': 'Đúng',
        'Điểm': 1,
        'Giải thích': 'Chỉ có duy nhất số 2 là số nguyên tố chẵn.',
      },
      {
        'STT': 3,
        'Môn': 'Vật lí',
        'Chương': 'Chương 1: Động học',
        'Bài': 'Chuyển động thẳng đều',
        'Mức độ': 'Vận dụng',
        'Dạng câu': 'Trả lời ngắn',
        'Nội dung câu hỏi': 'Một xe chuyển động với vận tốc 20 m/s trong 10 giây. Quãng đường xe đi được là bao nhiêu mét? (Chỉ nhập số)',
        'Đáp án A': '',
        'Đáp án B': '',
        'Đáp án C': '',
        'Đáp án D': '',
        'Đáp án đúng': '200',
        'Điểm': 1,
        'Giải thích': 's = v * t = 20 * 10 = 200m.',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 25 },
      { wch: 22 },
      { wch: 14 },
      { wch: 22 },
      { wch: 45 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 12 },
      { wch: 8 },
      { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Cau_Hoi');
    XLSX.writeFile(wb, 'Mau_Nhap_Ngan_Hang_Cau_Hoi_THPT_ThanhHoa.xlsx');
  },

  downloadStudentTemplate(): void {
    const sampleData = [
      { 'STT': 1, 'Mã HS': 'HS1020', 'Họ và tên': 'Nguyễn Hoàng Long', 'Lớp': '10A3', 'Mật khẩu': '123456' },
      { 'STT': 2, 'Mã HS': 'HS1021', 'Họ và tên': 'Trần Ngọc Mai', 'Lớp': '10A3', 'Mật khẩu': '123456' },
      { 'STT': 3, 'Mã HS': 'HS1022', 'Họ và tên': 'Lê Quốc Tuấn', 'Lớp': '10A5', 'Mật khẩu': '123456' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 25 }, { wch: 12 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Hoc_Sinh');
    XLSX.writeFile(wb, 'Mau_Nhap_Danh_Sach_Hoc_Sinh_THPT_ThanhHoa.xlsx');
  },

  // --- 4. PARSE QUESTIONS FROM FILE ---
  async parseQuestionsFile(file: File): Promise<QuestionImportRow[]> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

    const results: QuestionImportRow[] = rows.map((r, idx) => {
      const rowNumber = idx + 2; // considering 1-based header
      const errors: string[] = [];

      const subject = String(r['Môn'] || r['Mon'] || 'Toán').trim();
      const chapter = String(r['Chương'] || r['Chuong'] || 'Chương 1').trim();
      const lesson = String(r['Bài'] || r['Chủ đề'] || r['Bai'] || 'Bài 1').trim();
      const diffRaw = String(r['Mức độ'] || r['Muc do'] || 'Nhận biết').trim();
      const typeRaw = String(r['Dạng câu'] || r['Dang cau'] || 'Trắc nghiệm 1 đáp án').trim();
      const content = String(r['Nội dung câu hỏi'] || r['Nội dung'] || r['Cau hoi'] || '').trim();
      const optA = String(r['Đáp án A'] || r['Dap an A'] || r['A'] || '').trim();
      const optB = String(r['Đáp án B'] || r['Dap an B'] || r['B'] || '').trim();
      const optC = String(r['Đáp án C'] || r['Dap an C'] || r['C'] || '').trim();
      const optD = String(r['Đáp án D'] || r['Dap an D'] || r['D'] || '').trim();
      const correctAnswer = String(r['Đáp án đúng'] || r['Dap an dung'] || '').trim();
      const points = Number(r['Điểm'] || r['Diem'] || 1);
      const explanation = String(r['Giải thích'] || r['Giai thich'] || '').trim();

      if (!content) {
        errors.push('Thiếu nội dung câu hỏi');
      }
      if (!correctAnswer) {
        errors.push('Thiếu đáp án đúng');
      }

      // Check single choice options
      const isSingleChoice = typeRaw.toLowerCase().includes('1 đáp án') || typeRaw.toLowerCase().includes('trắc nghiệm');
      if (isSingleChoice && (!optA || !optB)) {
        errors.push('Câu hỏi trắc nghiệm cần tối thiểu phương án A và B');
      }

      return {
        rowNumber,
        subject,
        chapter,
        lesson,
        difficulty: diffRaw,
        type: typeRaw,
        content,
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctAnswer,
        points: isNaN(points) || points <= 0 ? 1 : points,
        explanation,
        isValid: errors.length === 0,
        errors,
      };
    });

    return results;
  },

  // Convert imported rows into Questions
  convertImportedRowsToQuestions(rows: QuestionImportRow[]): Question[] {
    return rows.map((r) => {
      let difficulty: DifficultyLevel = 'nhan_biet';
      const dLower = r.difficulty.toLowerCase();
      if (dLower.includes('cao')) difficulty = 'van_dung_cao';
      else if (dLower.includes('vận dụng')) difficulty = 'van_dung';
      else if (dLower.includes('thông hiểu')) difficulty = 'thong_hieu';

      let type: QuestionType = 'single_choice';
      const tLower = r.type.toLowerCase();
      if (tLower.includes('đúng') || tLower.includes('sai')) {
        type = 'true_false';
      } else if (tLower.includes('ngắn') || tLower.includes('điền')) {
        type = 'short_answer';
      }

      const options: string[] = [];
      let subItems: TrueFalseSubItem[] | undefined = undefined;

      if (type === 'single_choice') {
        if (r.optionA) options.push(`A. ${r.optionA.replace(/^[A-Da-d][.)]\s*/, '')}`);
        if (r.optionB) options.push(`B. ${r.optionB.replace(/^[A-Da-d][.)]\s*/, '')}`);
        if (r.optionC) options.push(`C. ${r.optionC.replace(/^[A-Da-d][.)]\s*/, '')}`);
        if (r.optionD) options.push(`D. ${r.optionD.replace(/^[A-Da-d][.)]\s*/, '')}`);
      } else if (type === 'true_false') {
        // If optionA/optionB are provided, treats them as 4 statements a, b, c, d
        if (r.optionA || r.optionB) {
          const rawOpts = [r.optionA, r.optionB, r.optionC, r.optionD];
          const letters = ['a', 'b', 'c', 'd'];
          subItems = letters.map((letCode, idx) => {
            const val = rawOpts[idx] || `Ý mệnh đề ${letCode}`;
            let itemAns: 'Đúng' | 'Sai' = 'Đúng';

            const match = r.correctAnswer.match(new RegExp(`${letCode}\\s*[:=-]?\\s*([ĐđSs]|Đúng|Sai)`, 'i'));
            if (match) {
              itemAns = match[1].toLowerCase().startsWith('đ') ? 'Đúng' : 'Sai';
            } else if (r.correctAnswer.includes(',') || r.correctAnswer.includes('|')) {
              const parts = r.correctAnswer.split(/[,|;]/).map((p: string) => p.trim().toLowerCase());
              if (parts[idx]) {
                itemAns = parts[idx].startsWith('đ') || parts[idx] === 'true' ? 'Đúng' : 'Sai';
              }
            }

            return {
              id: letCode,
              label: `${letCode})`,
              content: val.replace(/^[a-dA-D][.)]\s*/, '').trim(),
              correctAnswer: itemAns,
            };
          });
        } else {
          options.push('Đúng', 'Sai');
        }
      }

      // Normalize correctAnswer
      let cleanAnswer = r.correctAnswer.trim();
      if (type === 'single_choice') {
        const firstChar = cleanAnswer.charAt(0).toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(firstChar)) {
          cleanAnswer = firstChar;
        }
      } else if (type === 'true_false' && subItems) {
        cleanAnswer = subItems.map((s) => `${s.id}: ${s.correctAnswer}`).join(' | ');
      }

      return {
        id: `q-imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        subject: r.subject || 'Toán',
        grade: 10,
        chapter: r.chapter || 'Chương chung',
        lesson: r.lesson || 'Bài học chung',
        difficulty,
        type,
        content: r.content,
        options: options.length > 0 ? options : undefined,
        subItems,
        correctAnswer: cleanAnswer,
        points: r.points || 1,
        explanation: r.explanation,
        createdAt: new Date().toISOString(),
      };
    });
  },

  // --- 5. PARSE STUDENTS FROM FILE ---
  async parseStudentsFile(file: File): Promise<StudentImportRow[]> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

    return rows.map((r, idx) => {
      const rowNumber = idx + 2;
      const errors: string[] = [];

      const studentCode = String(r['Mã HS'] || r['Ma HS'] || r['Mã học sinh'] || r['Tài khoản'] || '').trim().toUpperCase();
      const fullName = String(r['Họ và tên'] || r['Ho va ten'] || r['Tên'] || '').trim();
      const className = String(r['Lớp'] || r['Lop'] || '').trim().toUpperCase();
      const password = String(r['Mật khẩu'] || r['Mat khau'] || '123456').trim();

      if (!studentCode) errors.push('Thiếu Mã HS');
      if (!fullName) errors.push('Thiếu Họ và tên');
      if (!className) errors.push('Thiếu Lớp');

      return {
        rowNumber,
        studentCode,
        fullName,
        className,
        password,
        isValid: errors.length === 0,
        errors,
      };
    });
  },

  convertImportedStudents(rows: StudentImportRow[]): User[] {
    return rows.map((r) => ({
      id: `u-${r.studentCode.toLowerCase()}-${Date.now().toString(36)}`,
      username: r.studentCode,
      fullName: r.fullName,
      role: 'student',
      className: r.className,
      password: r.password || '123456',
      status: 'active',
      createdAt: new Date().toISOString(),
    }));
  },
};
