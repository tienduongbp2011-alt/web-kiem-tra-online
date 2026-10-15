import { Question, QuestionResultBreakdown, StudentAnswer, SubItemBreakdown } from '../types';

/**
 * Quy định chuẩn thang điểm Bộ GD&ĐT cho dạng câu hỏi Đúng/Sai 4 ý:
 * - Thí sinh chọn chính xác 1 ý được 0,1 điểm
 * - Thí sinh chọn chính xác 2 ý được 0,25 điểm
 * - Thí sinh chọn chính xác 3 ý được 0,5 điểm
 * - Thí sinh chọn chính xác 4 ý được 1,0 điểm
 * - Đúng 0 ý hoặc không làm: 0 điểm
 */
export function getTrueFalseScoreByCorrectCount(correctCount: number): number {
  switch (correctCount) {
    case 4:
      return 1.0;
    case 3:
      return 0.5;
    case 2:
      return 0.25;
    case 1:
      return 0.1;
    default:
      return 0.0;
  }
}

/**
 * Grade a single question given the student's answer
 */
export function gradeQuestion(
  q: Question,
  studentAnsObj?: StudentAnswer,
  unitWeight: number = 1.0
): QuestionResultBreakdown {
  const studentAns = studentAnsObj?.answer?.trim() || '';
  const subAnswers = studentAnsObj?.subAnswers || {};

  // CASE 1: True / False 4 sub-items question (Dạng Đúng/Sai 4 ý)
  if (q.type === 'true_false' && q.subItems && q.subItems.length > 0) {
    const subBreakdowns: SubItemBreakdown[] = [];
    let correctCount = 0;
    let answeredSubCount = 0;

    q.subItems.forEach((item) => {
      // Check sub answer from subAnswers map or parse from answer string
      let rawStudentChoice = subAnswers[item.id] || '';

      // Fallback check if stored in answer string "a: Đúng, b: Sai"
      if (!rawStudentChoice && studentAns) {
        const regex = new RegExp(`${item.id}\\s*[:=-]\\s*([ĐđSs]|Đúng|Sai|True|False)`, 'i');
        const m = studentAns.match(regex);
        if (m) {
          const val = m[1].toLowerCase();
          rawStudentChoice = val.startsWith('đ') || val.startsWith('t') ? 'Đúng' : 'Sai';
        }
      }

      const isAnswered = rawStudentChoice === 'Đúng' || rawStudentChoice === 'Sai';
      if (isAnswered) answeredSubCount++;

      const isSubCorrect = isAnswered && rawStudentChoice.toLowerCase() === item.correctAnswer.toLowerCase();
      if (isSubCorrect) correctCount++;

      subBreakdowns.push({
        id: item.id,
        label: item.label,
        content: item.content,
        studentAnswer: rawStudentChoice || '(Chưa chọn)',
        correctAnswer: item.correctAnswer,
        isCorrect: isSubCorrect,
      });
    });

    const isQuestionFullyCorrect = correctCount === q.subItems.length;
    // Điểm số quy định theo số ý đúng: 1 ý: 0.1đ | 2 ý: 0.25đ | 3 ý: 0.5đ | 4 ý: 1.0đ
    const standardPoint = getTrueFalseScoreByCorrectCount(correctCount);
    // Multiply by unitWeight if exam scales question weights, but maxPoints for 4-item is 1.0 * unitWeight
    const maxPoints = (q.points || 1.0) * unitWeight;
    const pointsEarned = standardPoint * (q.points || 1.0) * unitWeight;

    const formattedStudentAnswer = subBreakdowns
      .map((s) => `${s.id}: ${s.studentAnswer}`)
      .join(' | ');

    return {
      questionId: q.id,
      questionContent: q.content,
      type: q.type,
      options: q.options,
      subItems: subBreakdowns,
      correctSubCount: correctCount,
      studentAnswer: answeredSubCount > 0 ? formattedStudentAnswer : '(Chưa làm)',
      correctAnswer: q.correctAnswer || q.subItems.map((s) => `${s.id}: ${s.correctAnswer}`).join(' | '),
      isCorrect: isQuestionFullyCorrect,
      pointsEarned: Number(pointsEarned.toFixed(2)),
      maxPoints: Number(maxPoints.toFixed(2)),
      explanation: q.explanation,
    };
  }

  // CASE 2: Single Choice (A, B, C, D)
  if (q.type === 'single_choice') {
    const isAnswered = Boolean(studentAns);
    const stdClean = studentAns.charAt(0).toUpperCase();
    const crtClean = q.correctAnswer.charAt(0).toUpperCase();
    const isCorrect = isAnswered && stdClean === crtClean;
    const maxPoints = (q.points || 1.0) * unitWeight;
    const pointsEarned = isCorrect ? maxPoints : 0;

    return {
      questionId: q.id,
      questionContent: q.content,
      type: q.type,
      options: q.options,
      studentAnswer: isAnswered ? studentAns : '(Chưa làm)',
      correctAnswer: q.correctAnswer,
      isCorrect,
      pointsEarned: Number(pointsEarned.toFixed(2)),
      maxPoints: Number(maxPoints.toFixed(2)),
      explanation: q.explanation,
    };
  }

  // CASE 3: Single True/False without 4 sub-items (Legacy single question)
  if (q.type === 'true_false') {
    const isAnswered = Boolean(studentAns);
    const stdClean = studentAns.toLowerCase();
    const crtClean = q.correctAnswer.toLowerCase();
    const isCorrect = isAnswered && stdClean === crtClean;
    const maxPoints = (q.points || 1.0) * unitWeight;
    const pointsEarned = isCorrect ? maxPoints : 0;

    return {
      questionId: q.id,
      questionContent: q.content,
      type: q.type,
      options: q.options,
      studentAnswer: isAnswered ? studentAns : '(Chưa làm)',
      correctAnswer: q.correctAnswer,
      isCorrect,
      pointsEarned: Number(pointsEarned.toFixed(2)),
      maxPoints: Number(maxPoints.toFixed(2)),
      explanation: q.explanation,
    };
  }

  // CASE 4: Short Answer (Trả lời ngắn)
  const isAnswered = Boolean(studentAns);
  const stdClean = studentAns.toLowerCase().replace(/,/g, '.').trim();
  const crtClean = q.correctAnswer.toLowerCase().replace(/,/g, '.').trim();
  const isCorrect = isAnswered && stdClean === crtClean;
  const maxPoints = (q.points || 1.0) * unitWeight;
  const pointsEarned = isCorrect ? maxPoints : 0;

  return {
    questionId: q.id,
    questionContent: q.content,
    type: q.type,
    options: q.options,
    studentAnswer: isAnswered ? studentAns : '(Chưa làm)',
    correctAnswer: q.correctAnswer,
    isCorrect,
    pointsEarned: Number(pointsEarned.toFixed(2)),
    maxPoints: Number(maxPoints.toFixed(2)),
    explanation: q.explanation,
  };
}
