import mammoth from 'mammoth';
import { DifficultyLevel, Question, TrueFalseSubItem } from '../types';

export interface ParsedWordQuestion {
  tempId: string;
  index: number;
  subject: string;
  chapter: string;
  lesson: string;
  difficulty: DifficultyLevel;
  type: 'true_false' | 'single_choice' | 'short_answer';
  content: string;
  // For true_false 4 items:
  subItems?: TrueFalseSubItem[];
  // For single_choice:
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
  isValid: boolean;
  errors: string[];
}

export const wordParserService = {
  /**
   * Parse text from a .docx File object
   */
  async extractTextFromDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  },

  /**
   * Main parsing logic from raw string (from docx or pasted text)
   */
  parseTextToQuestions(
    rawText: string,
    defaultSubject: string = 'Toán',
    defaultChapter: string = 'Chương 1',
    defaultLesson: string = 'Bài 1'
  ): ParsedWordQuestion[] {
    if (!rawText || !rawText.trim()) return [];

    // Clean text lines
    const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split text into question blocks based on "Câu X" or "Bài X"
    const questionBlockRegex = /(?:^|\n)(?=(?:Câu|Bài|CÂU|BÀI)\s*\d+[\s.:–-])/gi;
    let rawBlocks = text.split(questionBlockRegex).map((b) => b.trim()).filter(Boolean);

    // If no "Câu X" detected, check if whole text is a single question or separated by double linebreaks
    if (rawBlocks.length === 0) {
      rawBlocks = [text.trim()];
    } else if (rawBlocks.length === 1 && !/(?:Câu|Bài)\s*\d+/i.test(rawBlocks[0])) {
      // Maybe separated by double newlines with a), b), c), d)
      const doubleBreakSplit = text.split(/\n\s*\n\s*\n/).map((b) => b.trim()).filter(Boolean);
      if (doubleBreakSplit.length > 1) {
        rawBlocks = doubleBreakSplit;
      }
    }

    const parsedQuestions: ParsedWordQuestion[] = [];

    rawBlocks.forEach((block, idx) => {
      if (!block.trim()) return;

      const q = this.parseSingleQuestionBlock(
        block,
        idx + 1,
        defaultSubject,
        defaultChapter,
        defaultLesson
      );
      if (q) {
        parsedQuestions.push(q);
      }
    });

    return parsedQuestions;
  },

  /**
   * Parse a single block representing one question
   */
  parseSingleQuestionBlock(
    blockText: string,
    index: number,
    defaultSubject: string,
    defaultChapter: string,
    defaultLesson: string
  ): ParsedWordQuestion | null {
    const lines = blockText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    // Detect subject, chapter, difficulty tags in block if any, e.g. [Môn: Toán] [Mức độ: Vận dụng]
    let subject = defaultSubject;
    let chapter = defaultChapter;
    let lesson = defaultLesson;
    let difficulty: DifficultyLevel = 'thong_hieu';

    const subjectMatch = blockText.match(/\[(?:Môn|Mon):\s*([^\]]+)\]/i);
    if (subjectMatch) subject = subjectMatch[1].trim();

    const chapterMatch = blockText.match(/\[(?:Chương|Chuong):\s*([^\]]+)\]/i);
    if (chapterMatch) chapter = chapterMatch[1].trim();

    if (/\[?(?:Nhận biết|nhan biet|NB)\]?/i.test(blockText)) difficulty = 'nhan_biet';
    else if (/\[?(?:Thông hiểu|thong hieu|TH)\]?/i.test(blockText)) difficulty = 'thong_hieu';
    else if (/\[?(?:Vận dụng cao|van dung cao|VDC)\]?/i.test(blockText)) difficulty = 'van_dung_cao';
    else if (/\[?(?:Vận dụng|van dung|VD)\]?/i.test(blockText)) difficulty = 'van_dung';

    // Extract explanation if present
    let explanation = '';
    const expMatch = blockText.match(/(?:Lời giải|Hướng dẫn giải|Giải thích|HDG)[:：]\s*([\s\S]+)$/i);
    let mainContentBlock = blockText;
    if (expMatch) {
      explanation = expMatch[1].trim();
      mainContentBlock = blockText.substring(0, expMatch.index).trim();
    }

    // Check for explicit "Đáp án:" at the end of the question block
    let overallAnswerMatch = mainContentBlock.match(/(?:Đáp án|ĐÁP ÁN|Dap an)[:：]\s*([^\n]+)/i);
    let explicitOverallAnswer = overallAnswerMatch ? overallAnswerMatch[1].trim() : '';
    if (overallAnswerMatch && overallAnswerMatch.index !== undefined) {
      mainContentBlock = mainContentBlock.substring(0, overallAnswerMatch.index).trim();
    }

    // Determine type: True/False 4 items vs Single Choice vs Short Answer
    const hasSubItems = /(?:^|\n)\s*[a-d][.)]\s+/i.test(mainContentBlock);
    const hasOptionsABCD = /(?:^|\n)\s*[A-D][.)]\s+/i.test(mainContentBlock);

    const errors: string[] = [];

    // CASE 1: Dạng câu hỏi Đúng/Sai 4 ý (a, b, c, d)
    if (hasSubItems && !hasOptionsABCD) {
      // Split into stem content and 4 sub-items
      // Find the first occurrence of line starting with a) or a.
      const firstSubItemIndex = mainContentBlock.search(/(?:^|\n)\s*a[.)]\s+/i);
      let stem = '';
      let subItemsText = '';

      if (firstSubItemIndex >= 0) {
        stem = mainContentBlock.substring(0, firstSubItemIndex).trim();
        subItemsText = mainContentBlock.substring(firstSubItemIndex).trim();
      } else {
        stem = mainContentBlock;
      }

      // Clean prefix "Câu X:" from stem
      stem = stem.replace(/^(?:Câu|Bài|CÂU|BÀI)\s*\d+[\s.:–-]\s*/i, '').trim();
      // Remove any leftover bracket tags from stem
      stem = stem.replace(/\[(?:Môn|Chương|Mức độ|NB|TH|VD|VDC)[^\]]*\]/gi, '').trim();

      if (!stem) {
        stem = `Câu hỏi Đúng/Sai số ${index}`;
      }

      // Extract sub-items a, b, c, d
      const subItemRegex = /(?:^|\n)\s*([a-d])[.)]\s+([\s\S]*?)(?=(?:\n\s*[a-d][.)]\s+)|$)/gi;
      const subItems: TrueFalseSubItem[] = [];
      let match: RegExpExecArray | null;

      // Also parse explicit overall answers like "a - Đ, b - S, c - Đ, d - S" or "1-aĐ, bS..."
      const answerMap: Record<string, 'Đúng' | 'Sai'> = {};
      if (explicitOverallAnswer) {
        const itemAnsRegex = /([a-d])\s*[-:–]?\s*([ĐđSs]|Đúng|Sai|True|False)/gi;
        let ansMatch;
        while ((ansMatch = itemAnsRegex.exec(explicitOverallAnswer)) !== null) {
          const key = ansMatch[1].toLowerCase();
          const val = ansMatch[2].toLowerCase();
          answerMap[key] = val.startsWith('đ') || val.startsWith('t') ? 'Đúng' : 'Sai';
        }
      }

      while ((match = subItemRegex.exec(subItemsText)) !== null) {
        const letter = match[1].toLowerCase();
        let itemBody = match[2].trim();

        // Check if inline answer exists, e.g. "Mệnh đề ... [Đúng]" or "(Sai)" or ": Đúng" or "- Đ"
        let isCorrectAnswer: 'Đúng' | 'Sai' = answerMap[letter] || 'Đúng';

        const inlineAnswerMatch = itemBody.match(
          /(?:\[|\(|\s-|\s:|\s*->)?\s*(Đúng|Sai|Đ|S|True|False)\s*(?:\]|\))?$/i
        );

        if (inlineAnswerMatch) {
          const rawAns = inlineAnswerMatch[1].toLowerCase();
          isCorrectAnswer = rawAns.startsWith('đ') || rawAns.startsWith('t') ? 'Đúng' : 'Sai';
          // Remove the answer annotation from the statement content
          itemBody = itemBody.substring(0, inlineAnswerMatch.index).trim();
        }

        subItems.push({
          id: letter,
          label: `${letter})`,
          content: itemBody,
          correctAnswer: isCorrectAnswer,
        });
      }

      // Ensure we have 4 sub-items: a, b, c, d
      const requiredLetters = ['a', 'b', 'c', 'd'];
      requiredLetters.forEach((letCode) => {
        if (!subItems.find((s) => s.id === letCode)) {
          subItems.push({
            id: letCode,
            label: `${letCode})`,
            content: `Ý mệnh đề ${letCode}`,
            correctAnswer: 'Đúng',
          });
        }
      });

      // Sort alphabetically a, b, c, d
      subItems.sort((x, y) => x.id.localeCompare(y.id));

      if (subItems.some((s) => !s.content.trim())) {
        errors.push('Có ý chưa có nội dung');
      }

      const formattedAnswer = subItems.map((s) => `${s.id}: ${s.correctAnswer}`).join(', ');

      return {
        tempId: `tmp-word-${index}-${Date.now()}`,
        index,
        subject,
        chapter,
        lesson,
        difficulty,
        type: 'true_false',
        content: stem,
        subItems,
        correctAnswer: formattedAnswer,
        points: 1, // Điểm tối đa theo chuẩn Bộ GD&ĐT là 1 điểm
        explanation,
        isValid: errors.length === 0,
        errors,
      };
    }

    // CASE 2: Single Choice (A, B, C, D)
    if (hasOptionsABCD) {
      const firstOptIndex = mainContentBlock.search(/(?:^|\n)\s*[A-D][.)]\s+/i);
      let stem = '';
      let optsText = '';

      if (firstOptIndex >= 0) {
        stem = mainContentBlock.substring(0, firstOptIndex).trim();
        optsText = mainContentBlock.substring(firstOptIndex).trim();
      } else {
        stem = mainContentBlock;
      }

      stem = stem.replace(/^(?:Câu|Bài|CÂU|BÀI)\s*\d+[\s.:–-]\s*/i, '').trim();

      const optRegex = /(?:^|\n)\s*([A-D])[.)]\s+([\s\S]*?)(?=(?:\n\s*[A-D][.)]\s+)|$)/gi;
      const options: string[] = [];
      let detectedCorrect = explicitOverallAnswer.toUpperCase().charAt(0) || 'A';

      let match;
      while ((match = optRegex.exec(optsText)) !== null) {
        const letter = match[1].toUpperCase();
        let optContent = match[2].trim();

        // Check if inline marked with * or [Đúng]
        if (optContent.endsWith('*') || /\[Đúng\]/i.test(optContent) || /\(Đúng\)/i.test(optContent)) {
          detectedCorrect = letter;
          optContent = optContent.replace(/\*|\[Đúng\]|\(Đúng\)/gi, '').trim();
        }

        options.push(`${letter}. ${optContent}`);
      }

      if (!['A', 'B', 'C', 'D'].includes(detectedCorrect)) {
        detectedCorrect = 'A';
      }

      if (options.length < 2) {
        errors.push('Câu trắc nghiệm cần tối thiểu 2 phương án (A, B)');
      }

      return {
        tempId: `tmp-word-${index}-${Date.now()}`,
        index,
        subject,
        chapter,
        lesson,
        difficulty,
        type: 'single_choice',
        content: stem || `Câu trắc nghiệm ${index}`,
        options: options.length > 0 ? options : ['A. Phương án 1', 'B. Phương án 2', 'C. Phương án 3', 'D. Phương án 4'],
        correctAnswer: detectedCorrect,
        points: 1,
        explanation,
        isValid: errors.length === 0,
        errors,
      };
    }

    // CASE 3: Short Answer (Trả lời ngắn)
    let stem = mainContentBlock.replace(/^(?:Câu|Bài|CÂU|BÀI)\s*\d+[\s.:–-]\s*/i, '').trim();
    let ans = explicitOverallAnswer || '0';

    if (!ans) {
      errors.push('Thiếu đáp án cho câu trả lời ngắn');
    }

    return {
      tempId: `tmp-word-${index}-${Date.now()}`,
      index,
      subject,
      chapter,
      lesson,
      difficulty,
      type: 'short_answer',
      content: stem || `Câu trả lời ngắn ${index}`,
      correctAnswer: ans,
      points: 1,
      explanation,
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Convert parsed word questions into Question domain models
   */
  convertToDomainQuestions(parsedQuestions: ParsedWordQuestion[]): Question[] {
    return parsedQuestions.map((q) => {
      return {
        id: `q-word-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        subject: q.subject || 'Toán',
        grade: 10,
        chapter: q.chapter || 'Chương 1',
        lesson: q.lesson || 'Bài 1',
        difficulty: q.difficulty || 'thong_hieu',
        type: q.type,
        content: q.content,
        subItems: q.subItems,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        explanation: q.explanation || '',
        createdAt: new Date().toISOString(),
      };
    });
  },

  /**
   * Download Word sample template (.doc) that opens directly in Microsoft Word
   */
  downloadSampleWordDoc(): void {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Mau_Cau_Hoi_Dung_Sai_4_Y_THPT_Thanh_Hoa</title>
<style>
body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #1e293b; }
.title { font-size: 16pt; font-weight: bold; text-align: center; color: #0D47A1; margin-bottom: 15px; }
.subtitle { text-align: center; font-size: 11pt; color: #475569; margin-bottom: 25px; }
.guide { background: #f1f5f9; padding: 12px; border-left: 4px solid #0D47A1; margin-bottom: 25px; font-size: 11pt; }
.question { margin-bottom: 20px; }
.stem { font-weight: bold; margin-bottom: 6px; }
.item { margin-left: 20px; margin-bottom: 4px; }
.ans { color: #15803d; font-weight: bold; }
.exp { font-style: italic; color: #334155; margin-top: 4px; margin-left: 20px; }
</style>
</head>
<body>
<div class="title">BỘ GIÁO DỤC VÀ ĐÀO TẠO - TRƯỜNG THPT THANH HÒA<br/>MẪU ĐỀ THI TRẮC NGHIỆM ĐÚNG / SAI 4 Ý (GDPT 2018)</div>
<div class="subtitle">Hệ thống kiểm tra trực tuyến Mr Dương - Khối 10</div>

<div class="guide">
<b>QUY TẮC ĐỊNH DẠNG DỄ NHẬP NHẤT:</b><br/>
1. Mỗi câu hỏi gồm câu dẫn (ví dụ <b>Câu 1:</b> ...) và 4 ý khẳng định <b>a)</b>, <b>b)</b>, <b>c)</b>, <b>d)</b>.<br/>
2. Đáp án của từng ý ghi trong ngoặc vuông ở cuối ý: <b>[Đúng]</b> hoặc <b>[Sai]</b> (hoặc ghi dòng <i>Đáp án: a - Đ, b - S, c - Đ, d - S</i>).<br/>
3. <b>Quy định thang điểm Bộ GD&ĐT:</b><br/>
&nbsp;&nbsp;&nbsp;&nbsp;• Đúng 1 ý: được <b>0,1 điểm</b><br/>
&nbsp;&nbsp;&nbsp;&nbsp;• Đúng 2 ý: được <b>0,25 điểm</b><br/>
&nbsp;&nbsp;&nbsp;&nbsp;• Đúng 3 ý: được <b>0,5 điểm</b><br/>
&nbsp;&nbsp;&nbsp;&nbsp;• Đúng 4 ý: được <b>1,0 điểm</b>
</div>

<div class="question">
<div class="stem">Câu 1: [Môn: Toán] [Mức độ: Thông hiểu] Cho hàm số bậc hai y = f(x) = x^2 - 4x + 3 có đồ thị là parabol (P). Xét tính đúng/sai của các khẳng định sau:</div>
<div class="item">a) Tọa độ đỉnh của parabol (P) là I(2; -1). <span class="ans">[Đúng]</span></div>
<div class="item">b) Parabol (P) có trục đối xứng là đường thẳng x = 2. <span class="ans">[Đúng]</span></div>
<div class="item">c) Hàm số f(x) đồng biến trên khoảng (-∞; 2). <span class="ans">[Sai]</span></div>
<div class="item">d) Giá trị nhỏ nhất của hàm số f(x) trên ℝ bằng -1. <span class="ans">[Đúng]</span></div>
<div class="exp">Lời giải: Tọa độ đỉnh I(2; -1), trục đối xứng x = 2, hàm số nghịch biến trên (-∞; 2) do a = 1 > 0, GTNN bằng -1 tại x = 2.</div>
</div>

<div class="question">
<div class="stem">Câu 2: [Môn: Toán] [Mức độ: Vận dụng] Trong mặt phẳng tọa độ Oxy, cho tam giác ABC có A(1; 2), B(3; 4), C(5; 0). Xét tính đúng/sai của các khẳng định sau:</div>
<div class="item">a) Vectơ AB có tọa độ là (2; 2). <span class="ans">[Đúng]</span></div>
<div class="item">b) Độ dài đoạn thẳng AB bằng 4. <span class="ans">[Sai]</span></div>
<div class="item">c) Tọa độ trọng tâm G của tam giác ABC là (3; 2). <span class="ans">[Đúng]</span></div>
<div class="item">d) Vectơ AC có tọa độ là (4; -2). <span class="ans">[Đúng]</span></div>
<div class="exp">Lời giải: AB = (2; 2) => |AB| = √(4+4) = 2√2 ≠ 4. Trọng tâm G = ((1+3+5)/3; (2+4+0)/3) = (3; 2). AC = (4; -2).</div>
</div>

<div class="question">
<div class="stem">Câu 3: [Môn: Vật lí] [Mức độ: Thông hiểu] Một ô tô xuất phát từ trạng thái nghỉ, chuyển động thẳng nhanh dần đều với gia tốc a = 2 m/s^2. Xét tính đúng/sai của các phát biểu sau:</div>
<div class="item">a) Vận tốc của ô tô sau 5 giây là 10 m/s. <span class="ans">[Đúng]</span></div>
<div class="item">b) Quãng đường ô tô đi được trong 5 giây đầu tiên là 50 m. <span class="ans">[Sai]</span></div>
<div class="item">c) Vectơ gia tốc luôn cùng hướng với vectơ vận tốc của ô tô. <span class="ans">[Đúng]</span></div>
<div class="item">d) Thời gian để ô tô đạt tốc độ 20 m/s là 10 giây. <span class="ans">[Đúng]</span></div>
<div class="exp">Lời giải: v = at = 10 m/s; s = 0.5*a*t^2 = 25m; t = v/a = 10s.</div>
</div>

<div class="question">
<div class="stem">Câu 4: [Môn: Tin học] [Mức độ: Nhận biết] Đơn vị đo dung lượng thông tin cơ bản nhỏ nhất trong máy tính là gì?</div>
<div class="item">A. Byte</div>
<div class="item">B. Bit</div>
<div class="item">C. Kilobyte</div>
<div class="item">D. Megabyte</div>
<div class="item"><b>Đáp án:</b> B</div>
</div>
</body>
</html>`;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_De_Dung_Sai_4_Y_THPT_Thanh_Hoa.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Sample text format guide for teachers
   */
  getSampleDocxText(): string {
    return `Câu 1: [Môn: Toán] [Mức độ: Thông hiểu]
Cho hàm số y = f(x) = x^2 - 4x + 3 có đồ thị là parabol (P). Xét tính đúng/sai của các mệnh đề sau:
a) Tọa độ đỉnh của parabol (P) là I(2; -1). [Đúng]
b) Parabol (P) cắt trục hoành tại hai điểm phân biệt có hoành độ x = 1 và x = 3. [Đúng]
c) Hàm số f(x) đồng biến trên khoảng (-∞; 2). [Sai]
d) Giá trị nhỏ nhất của hàm số trên tập số thực ℝ bằng -1. [Đúng]
Lời giải:
a) Hoành độ đỉnh x = -b/(2a) = 2, tung độ y = -1. Mệnh đề Đúng.
b) x^2 - 4x + 3 = 0 có hai nghiệm x = 1, x = 3. Mệnh đề Đúng.
c) Hệ số a = 1 > 0 nên hàm số nghịch biến trên (-∞; 2) và đồng biến trên (2; +∞). Mệnh đề Sai.
d) y >= -1 với mọi x thuộc ℝ nên min = -1. Mệnh đề Đúng.

Câu 2: [Môn: Toán] [Mức độ: Vận dụng]
Trong mặt phẳng tọa độ Oxy, cho tam giác ABC có A(1; 2), B(3; 4), C(5; 0). Xét tính đúng/sai của các khẳng định sau:
a) Vectơ AB có tọa độ là (2; 2). [Đúng]
b) Độ dài cạnh AB bằng 4. [Sai]
c) Tọa độ trọng tâm G của tam giác ABC là (3; 2). [Đúng]
d) Tích vô hướng của hai vectơ AB và AC bằng 0. [Sai]
Đáp án: a - Đ, b - S, c - Đ, d - S
Lời giải: AB = (2; 2) => |AB| = √(4+4) = 2√2 ≈ 2.83, trọng tâm G = ((1+3+5)/3; (2+4+0)/3) = (3; 2).

Câu 3: [Môn: Vật lí] [Mức độ: Nhận biết]
Đơn vị đo vận tốc chuẩn trong hệ đo lường quốc tế SI là gì?
A. km/h
B. m/s
C. cm/s
D. m/phút
Đáp án: B
Lời giải: Đơn vị SI của quãng đường là mét (m), thời gian là giây (s) nên vận tốc là m/s.

Câu 4: [Môn: Tin học] [Mức độ: Thông hiểu]
Trong ngôn ngữ lập trình Python, hàm len("THANH HOA") trả về giá trị là bao nhiêu? (Tính cả dấu khoảng trắng)
Đáp án: 9
Lời giải: Xâu gồm 5 ký tự THANH, 1 khoảng cách, và 3 ký tự HOA. Tổng cộng 9 ký tự.`;
  },
};
