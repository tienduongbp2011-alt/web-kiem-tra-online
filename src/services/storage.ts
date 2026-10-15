import {
  INITIAL_CLASSES,
  INITIAL_EXAMS,
  INITIAL_QUESTIONS,
  INITIAL_SUBMISSIONS,
  INITIAL_USERS,
} from '../data/mockData';
import {
  ClassRoom,
  Exam,
  ExamAttemptSession,
  Question,
  Submission,
  User,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'mrduong_online_users_v1',
  CLASSES: 'mrduong_online_classes_v1',
  QUESTIONS: 'mrduong_online_questions_v1',
  EXAMS: 'mrduong_online_exams_v1',
  SUBMISSIONS: 'mrduong_online_submissions_v1',
  CURRENT_USER: 'mrduong_online_current_user_v1',
  EXAM_SESSIONS: 'mrduong_online_exam_sessions_v1',
};

// --- Helper Functions ---
function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${key} from localStorage`, e);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
}

// --- Storage API ---
export const storageService = {
  // Initialize storage if empty or merge missing initial items
  initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setStoredItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    } else {
      const storedUsers = getStoredItem<User[]>(STORAGE_KEYS.USERS, []);
      const updatedUsers = storedUsers.map((u) => {
        if (u.username.toUpperCase() === 'ADMIN') {
          return {
            ...u,
            fullName: 'Thầy Nguyễn Tiến Dương',
            teacherRole: 'super_admin' as const,
            permissions: {
              canManageQuestions: true,
              canCreateExams: true,
              canViewResults: true,
              canManageStudents: true,
              canManageTeachers: true,
            },
          };
        }
        return u;
      });

      const existingUsernames = new Set(updatedUsers.map((u) => u.username.toUpperCase()));
      const missingTeachers = INITIAL_USERS.filter(
        (u) => u.role === 'teacher' && !existingUsernames.has(u.username.toUpperCase())
      );
      setStoredItem(STORAGE_KEYS.USERS, [...updatedUsers, ...missingTeachers]);
    }

    // Sync current logged in user if admin
    const currUser = getStoredItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (currUser && currUser.username.toUpperCase() === 'ADMIN') {
      currUser.fullName = 'Thầy Nguyễn Tiến Dương';
      currUser.teacherRole = 'super_admin';
      currUser.permissions = {
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: true,
        canManageTeachers: true,
      };
      setStoredItem(STORAGE_KEYS.CURRENT_USER, currUser);
    }

    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      setStoredItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    }
    
    // Questions: merge any missing initial questions or update questions with subItems
    const storedQuestions = getStoredItem<Question[]>(STORAGE_KEYS.QUESTIONS, []);
    if (storedQuestions.length === 0) {
      setStoredItem(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    } else {
      const initialMap = new Map(INITIAL_QUESTIONS.map((q) => [q.id, q]));
      const updatedStored = storedQuestions.map((q) => {
        const initQ = initialMap.get(q.id);
        if (initQ && initQ.subItems && !q.subItems) {
          return { ...q, ...initQ };
        }
        return q;
      });

      const existingQIds = new Set(updatedStored.map((q) => q.id));
      const missingQ = INITIAL_QUESTIONS.filter((q) => !existingQIds.has(q.id));
      setStoredItem(STORAGE_KEYS.QUESTIONS, [...updatedStored, ...missingQ]);
    }

    // Exams: merge any missing initial exams
    const storedExams = getStoredItem<Exam[]>(STORAGE_KEYS.EXAMS, []);
    if (storedExams.length === 0) {
      setStoredItem(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    } else {
      const existingExamIds = new Set(storedExams.map((e) => e.id));
      const missingExams = INITIAL_EXAMS.filter((e) => !existingExamIds.has(e.id));
      if (missingExams.length > 0) {
        setStoredItem(STORAGE_KEYS.EXAMS, [...storedExams, ...missingExams]);
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
      setStoredItem(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    }
  },

  // Reset to default
  resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.EXAM_SESSIONS);
    this.initialize();
  },

  // --- Current User Session ---
  getCurrentUser(): User | null {
    return getStoredItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      setStoredItem(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // --- Users ---
  getUsers(): User[] {
    return getStoredItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  authenticate(username: string, password?: string): User | null {
    const cleanUsername = username.trim().toUpperCase();
    const users = this.getUsers();
    
    const user = users.find(
      (u) =>
        u.username.toUpperCase() === cleanUsername &&
        u.status === 'active'
    );

    if (!user) return null;

    // Check password if provided or user has password
    if (user.password && password && user.password !== password) {
      return null;
    }

    return user;
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    setStoredItem(STORAGE_KEYS.USERS, users);
  },

  deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    setStoredItem(STORAGE_KEYS.USERS, users);
  },

  saveUsersBatch(newUsers: User[]): void {
    const currentUsers = this.getUsers();
    const map = new Map<string, User>();
    currentUsers.forEach((u) => map.set(u.username.toUpperCase(), u));
    newUsers.forEach((u) => map.set(u.username.toUpperCase(), u));
    setStoredItem(STORAGE_KEYS.USERS, Array.from(map.values()));
  },

  // --- Teachers & Staff Permissions ---
  getTeachers(): User[] {
    return this.getUsers().filter((u) => u.role === 'teacher');
  },

  saveTeacher(teacher: User): void {
    teacher.role = 'teacher';
    if (!teacher.permissions) {
      teacher.permissions = {
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: false,
        canManageTeachers: false,
      };
    }
    this.saveUser(teacher);
  },

  deleteTeacher(teacherId: string): void {
    // Protect primary super admin from deletion
    if (teacherId === 'u-teacher-1') {
      return;
    }
    this.deleteUser(teacherId);
  },

  toggleTeacherPermission(
    teacherId: string,
    permissionKey: keyof NonNullable<User['permissions']>
  ): void {
    const teacher = this.getUserById(teacherId);
    if (!teacher) return;
    if (!teacher.permissions) {
      teacher.permissions = {
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: false,
        canManageTeachers: false,
      };
    }
    teacher.permissions[permissionKey] = !teacher.permissions[permissionKey];
    this.saveUser(teacher);
  },

  // --- Classes ---
  getClasses(): ClassRoom[] {
    return getStoredItem<ClassRoom[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  },

  saveClass(classroom: ClassRoom): void {
    const classes = this.getClasses();
    const idx = classes.findIndex((c) => c.id === classroom.id);
    if (idx >= 0) {
      classes[idx] = classroom;
    } else {
      classes.push(classroom);
    }
    setStoredItem(STORAGE_KEYS.CLASSES, classes);
  },

  deleteClass(id: string): void {
    const classes = this.getClasses().filter((c) => c.id !== id);
    setStoredItem(STORAGE_KEYS.CLASSES, classes);
  },

  // --- Questions ---
  getQuestions(): Question[] {
    return getStoredItem<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  },

  getQuestionById(id: string): Question | undefined {
    return this.getQuestions().find((q) => q.id === id);
  },

  saveQuestion(question: Question): void {
    const questions = this.getQuestions();
    const idx = questions.findIndex((q) => q.id === question.id);
    if (idx >= 0) {
      questions[idx] = question;
    } else {
      questions.unshift(question);
    }
    setStoredItem(STORAGE_KEYS.QUESTIONS, questions);
  },

  saveQuestionsBatch(newQuestions: Question[]): void {
    const questions = this.getQuestions();
    setStoredItem(STORAGE_KEYS.QUESTIONS, [...newQuestions, ...questions]);
  },

  deleteQuestion(id: string): void {
    const questions = this.getQuestions().filter((q) => q.id !== id);
    setStoredItem(STORAGE_KEYS.QUESTIONS, questions);
  },

  // --- Exams ---
  getExams(): Exam[] {
    return getStoredItem<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
  },

  getExamById(id: string): Exam | undefined {
    return this.getExams().find((e) => e.id === id);
  },

  saveExam(exam: Exam): void {
    const exams = this.getExams();
    const idx = exams.findIndex((e) => e.id === exam.id);
    if (idx >= 0) {
      exams[idx] = exam;
    } else {
      exams.unshift(exam);
    }
    setStoredItem(STORAGE_KEYS.EXAMS, exams);
  },

  deleteExam(id: string): void {
    const exams = this.getExams().filter((e) => e.id !== id);
    setStoredItem(STORAGE_KEYS.EXAMS, exams);
  },

  toggleExamStatus(id: string): void {
    const exams = this.getExams();
    const exam = exams.find((e) => e.id === id);
    if (exam) {
      exam.status = exam.status === 'open' ? 'closed' : 'open';
      setStoredItem(STORAGE_KEYS.EXAMS, exams);
    }
  },

  // --- Submissions ---
  getSubmissions(): Submission[] {
    return getStoredItem<Submission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  },

  getSubmissionsByExam(examId: string): Submission[] {
    return this.getSubmissions().filter((s) => s.examId === examId);
  },

  getSubmissionsByStudent(studentId: string): Submission[] {
    return this.getSubmissions().filter((s) => s.studentId === studentId);
  },

  saveSubmission(submission: Submission): void {
    const subs = this.getSubmissions();
    subs.unshift(submission);
    setStoredItem(STORAGE_KEYS.SUBMISSIONS, subs);
  },

  // --- Live Exam Attempt Session (Auto-Save & Recovery) ---
  getSessionsMap(): Record<string, ExamAttemptSession> {
    return getStoredItem<Record<string, ExamAttemptSession>>(STORAGE_KEYS.EXAM_SESSIONS, {});
  },

  getExamSession(examId: string, studentId: string): ExamAttemptSession | null {
    const map = this.getSessionsMap();
    const key = `${examId}__${studentId}`;
    return map[key] || null;
  },

  saveExamSession(session: ExamAttemptSession): void {
    const map = this.getSessionsMap();
    const key = `${session.examId}__${session.studentId}`;
    session.lastSavedAt = new Date().toISOString();
    map[key] = session;
    setStoredItem(STORAGE_KEYS.EXAM_SESSIONS, map);
  },

  clearExamSession(examId: string, studentId: string): void {
    const map = this.getSessionsMap();
    const key = `${examId}__${studentId}`;
    delete map[key];
    setStoredItem(STORAGE_KEYS.EXAM_SESSIONS, map);
  },
};
