import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit,
  KeyRound,
  School,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
} from 'lucide-react';
import { ClassRoom, User } from '../../types';
import { storageService } from '../../services/storage';
import { excelService, StudentImportRow } from '../../services/excel';

export const StudentsManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [classes, setClasses] = useState<ClassRoom[]>(() => storageService.getClasses());
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [editingStudent, setEditingStudent] = useState<Partial<User> | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<ClassRoom> | null>(null);

  // Student Import states
  const [importRows, setImportRows] = useState<StudentImportRow[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const students = users.filter((u) => u.role === 'student');

  const refreshData = () => {
    setUsers(storageService.getUsers());
    setClasses(storageService.getClasses());
  };

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = selectedClass === 'ALL' || s.className === selectedClass;
    return matchSearch && matchClass;
  });

  // Handle Save Student
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent?.fullName || !editingStudent?.username || !editingStudent?.className) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    const studentToSave: User = {
      id: editingStudent.id || `u-${Date.now()}`,
      username: editingStudent.username.toUpperCase(),
      fullName: editingStudent.fullName,
      role: 'student',
      className: editingStudent.className,
      status: editingStudent.status || 'active',
      password: editingStudent.password || 'password123',
      createdAt: editingStudent.createdAt || new Date().toISOString(),
    };

    storageService.saveUser(studentToSave);
    setEditingStudent(null);
    refreshData();
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
      storageService.deleteUser(id);
      refreshData();
    }
  };

  const handleResetPassword = (s: User) => {
    const newPass = prompt(`Nhập mật khẩu mới cho học sinh ${s.fullName} (${s.username}):`, '123456');
    if (newPass) {
      storageService.saveUser({ ...s, password: newPass });
      alert(`Đã đặt lại mật khẩu thành công cho ${s.username}!`);
      refreshData();
    }
  };

  // Handle Class Add/Edit
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass?.name) return;

    const classToSave: ClassRoom = {
      id: editingClass.id || `c-${Date.now()}`,
      name: editingClass.name.toUpperCase(),
      grade: 10,
      studentCount: editingClass.studentCount || 0,
      homeroomTeacher: editingClass.homeroomTeacher || '',
    };

    storageService.saveClass(classToSave);
    setEditingClass(null);
    refreshData();
  };

  const handleDeleteClass = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa lớp ${name}?`)) {
      storageService.deleteClass(id);
      refreshData();
    }
  };

  // Student Excel Import Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    try {
      const parsed = await excelService.parseStudentsFile(file);
      setImportRows(parsed);
    } catch (err) {
      alert('Không thể đọc file Excel. Vui lòng kiểm tra đúng định dạng mẫu!');
    }
  };

  const handleCommitStudentImport = () => {
    const invalid = importRows.filter((r) => !r.isValid);
    if (invalid.length > 0) {
      alert(`Còn ${invalid.length} dòng chứa lỗi. Vui lòng kiểm tra lại trước khi lưu.`);
      return;
    }

    const newUsers = excelService.convertImportedStudents(importRows);
    storageService.saveUsersBatch(newUsers);
    alert(`Đã thêm thành công ${newUsers.length} học sinh vào hệ thống!`);
    setIsImportModalOpen(false);
    setImportRows([]);
    refreshData();
  };

  const handleExportStudents = () => {
    excelService.exportStudentsList(
      filteredStudents,
      selectedClass !== 'ALL' ? selectedClass : undefined
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0D47A1]" />
            Quản lý Học sinh & Lớp học Khối 10
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản trị tài khoản học sinh, phân lớp và đồng bộ danh sách qua Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportStudents}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>XUẤT EXCEL</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>IMPORT EXCEL</span>
          </button>

          <button
            onClick={() =>
              setEditingStudent({
                fullName: '',
                username: '',
                className: classes[0]?.name || '10A1',
                status: 'active',
                password: 'password123',
              })
            }
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0D47A1] hover:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF8A00]" />
            <span>THÊM HỌC SINH</span>
          </button>
        </div>
      </div>

      {/* Classes Management Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <School className="w-4 h-4 text-[#0D47A1]" />
            Danh sách các lớp Khối 10 ({classes.length} lớp):
          </span>
          <button
            onClick={() => setEditingClass({ name: '', grade: 10 })}
            className="text-xs font-bold text-[#0D47A1] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm lớp mới
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {classes.map((c) => {
            const countInClass = students.filter((s) => s.className === c.name).length;
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                <span className="font-bold text-[#0D47A1]">{c.name}</span>
                <span className="text-slate-400">({countInClass} HS)</span>
                <button
                  onClick={() => handleDeleteClass(c.id, c.name)}
                  title="Xóa lớp"
                  className="text-slate-400 hover:text-red-500 ml-1"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã HS, Họ tên..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-600">Xem theo lớp:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="py-1.5 px-3 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-semibold text-slate-700"
          >
            <option value="ALL">Tất cả học sinh ({students.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.name}>
                Lớp {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3 w-32">Mã HS</th>
                <th className="p-3 min-w-[200px]">Họ và tên</th>
                <th className="p-3 w-24">Lớp</th>
                <th className="p-3 w-32">Tài khoản</th>
                <th className="p-3 w-28 text-center">Trạng thái</th>
                <th className="p-3 w-36 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Không tìm thấy học sinh nào.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-[#0D47A1]">{s.username}</td>
                    <td className="p-3 font-semibold text-slate-900">{s.fullName}</td>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50">{s.className}</td>
                    <td className="p-3 font-mono text-slate-600">{s.username}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          s.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {s.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleResetPassword(s)}
                          title="Đổi mật khẩu"
                          className="p-1.5 text-amber-600 hover:text-amber-800 rounded hover:bg-amber-50 cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingStudent(s)}
                          title="Chỉnh sửa thông tin"
                          className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id)}
                          title="Xóa học sinh"
                          className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Import danh sách học sinh từ Excel
                </h2>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <button
                  type="button"
                  onClick={() => excelService.downloadStudentTemplate()}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải mẫu Excel (STT | Mã HS | Họ tên | Lớp | Mật khẩu)</span>
                </button>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Chọn file Excel danh sách</span>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              {importRows.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60 text-xs">
                  <table className="w-full text-left divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2">Dòng</th>
                        <th className="p-2">Mã HS</th>
                        <th className="p-2">Họ và tên</th>
                        <th className="p-2">Lớp</th>
                        <th className="p-2">Mật khẩu</th>
                        <th className="p-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {importRows.map((r, idx) => (
                        <tr key={idx} className={r.isValid ? '' : 'bg-red-50'}>
                          <td className="p-2">{r.rowNumber}</td>
                          <td className="p-2 font-mono font-bold">{r.studentCode}</td>
                          <td className="p-2 font-semibold">{r.fullName}</td>
                          <td className="p-2">{r.className}</td>
                          <td className="p-2 font-mono">{r.password}</td>
                          <td className="p-2">
                            {r.isValid ? (
                              <span className="text-emerald-600 font-bold">✓ Hợp lệ</span>
                            ) : (
                              <span className="text-red-600 font-bold">{r.errors.join(', ')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700"
              >
                HỦY
              </button>
              <button
                disabled={importRows.length === 0}
                onClick={handleCommitStudentImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                LƯU {importRows.filter((r) => r.isValid).length} HỌC SINH VÀO HỆ THỐNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">
              {editingStudent.id ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}
            </h2>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã học sinh / Tài khoản *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.username || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, username: e.target.value })}
                  placeholder="Ví dụ: HS1015"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.fullName || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  placeholder="Ví dụ: Trần Văn Nam"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lớp *</label>
                <select
                  value={editingStudent.className || '10A1'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, className: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      Lớp {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu</label>
                <input
                  type="text"
                  value={editingStudent.password || 'password123'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0D47A1] text-white font-bold rounded-lg"
                >
                  Lưu học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">
              Thêm lớp học Khối 10
            </h2>
            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên lớp (ví dụ: 10A1, 10A2, 10A5...)</label>
                <input
                  type="text"
                  required
                  value={editingClass.name || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  placeholder="10A..."
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0D47A1] text-white font-bold rounded-lg"
                >
                  Lưu lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
