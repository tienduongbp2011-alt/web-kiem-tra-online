import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  Key,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Save,
  Users,
  BookOpen,
  FileCheck,
  Award,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { TeacherPermissions, TeacherRoleLevel, User } from '../../types';
import { storageService } from '../../services/storage';

interface TeachersManagementProps {
  currentUser: User;
}

export const TeachersManagement: React.FC<TeachersManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Partial<User> | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const refreshUsers = () => {
    setUsers(storageService.getUsers());
  };

  const teachers = useMemo(() => {
    return users.filter((u) => u.role === 'teacher');
  }, [users]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSubject = subjectFilter === 'ALL' || t.subject === subjectFilter;
      const matchRole = roleFilter === 'ALL' || t.teacherRole === roleFilter;

      return matchSearch && matchSubject && matchRole;
    });
  }, [teachers, searchTerm, subjectFilter, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: teachers.length,
      superAdmin: teachers.filter((t) => t.teacherRole === 'super_admin').length,
      admin: teachers.filter((t) => t.teacherRole === 'admin').length,
      subjectTeacher: teachers.filter((t) => !t.teacherRole || t.teacherRole === 'subject_teacher').length,
    };
  }, [teachers]);

  const handleOpenAddTeacher = () => {
    setEditingTeacher({
      role: 'teacher',
      teacherRole: 'subject_teacher',
      subject: 'Toán',
      status: 'active',
      password: 'password123',
      permissions: {
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: false,
        canManageTeachers: false,
      },
      fullName: '',
      username: '',
      email: '',
      phone: '',
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditTeacher = (teacher: User) => {
    setEditingTeacher({
      ...teacher,
      permissions: teacher.permissions || {
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: false,
        canManageTeachers: false,
      },
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (teacher: User) => {
    if (teacher.username.toLowerCase() === 'admin') {
      alert('Không thể khóa tài khoản Quản trị trưởng hệ thống!');
      return;
    }

    const updated: User = {
      ...teacher,
      status: teacher.status === 'active' ? 'locked' : 'active',
    };
    storageService.saveUser(updated);
    refreshUsers();
  };

  const handleDeleteTeacher = (teacher: User) => {
    if (teacher.username.toLowerCase() === 'admin') {
      alert('Không thể xóa tài khoản Quản trị trưởng hệ thống!');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản giáo viên "${teacher.fullName}" (${teacher.username})?`)) {
      storageService.deleteUser(teacher.id);
      refreshUsers();
    }
  };

  const handleApplyRoleTemplate = (roleLevel: TeacherRoleLevel) => {
    if (!editingTeacher) return;

    let perms: TeacherPermissions;
    if (roleLevel === 'super_admin') {
      perms = {
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: true,
        canManageTeachers: true,
      };
    } else if (roleLevel === 'admin') {
      perms = {
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: true,
        canManageTeachers: false,
      };
    } else {
      perms = {
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: false,
        canManageTeachers: false,
      };
    }

    setEditingTeacher({
      ...editingTeacher,
      teacherRole: roleLevel,
      permissions: perms,
    });
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editingTeacher.fullName?.trim() || !editingTeacher.username?.trim()) {
      alert('Vui lòng nhập đầy đủ Họ và tên và Tên đăng nhập!');
      return;
    }

    const cleanUsername = editingTeacher.username.trim();

    // Check duplicate username if new
    if (!editingTeacher.id) {
      const exists = users.some(
        (u) => u.username.toUpperCase() === cleanUsername.toUpperCase()
      );
      if (exists) {
        alert('Tên đăng nhập này đã tồn tại trong hệ thống. Vui lòng chọn tên khác!');
        return;
      }
    }

    const teacherToSave: User = {
      id: editingTeacher.id || `u-teacher-${Date.now()}`,
      username: cleanUsername,
      fullName: editingTeacher.fullName.trim(),
      role: 'teacher',
      teacherRole: editingTeacher.teacherRole || 'subject_teacher',
      subject: editingTeacher.subject || 'Toán',
      status: editingTeacher.status || 'active',
      password: editingTeacher.password || 'password123',
      email: editingTeacher.email?.trim() || '',
      phone: editingTeacher.phone?.trim() || '',
      permissions: editingTeacher.permissions || {
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: false,
        canManageTeachers: false,
      },
      createdAt: editingTeacher.createdAt || new Date().toISOString(),
    };

    storageService.saveUser(teacherToSave);
    setIsModalOpen(false);
    setEditingTeacher(null);
    refreshUsers();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#0D47A1]" />
            Quản lý Giáo viên & Phân quyền Quản trị
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Phân công môn học, cấp quyền tạo đề, soạn câu hỏi, quản trị học sinh và ủy quyền quản trị
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddTeacher}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0D47A1] hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#FF8A00]" />
          <span>+ THÊM GIÁO VIÊN & PHÂN QUYỀN</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-semibold block text-xs">Tổng số giáo viên</span>
          <div className="text-2xl font-black text-[#0D47A1] mt-1">{stats.total}</div>
          <span className="text-[11px] text-slate-400">Tài khoản cán bộ / GV</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-purple-700 font-semibold block text-xs">Quản trị viên cấp cao</span>
          <div className="text-2xl font-black text-purple-800 mt-1">{stats.superAdmin}</div>
          <span className="text-[11px] text-purple-600">Toàn quyền hệ thống</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-blue-700 font-semibold block text-xs">Quản trị viên</span>
          <div className="text-2xl font-black text-blue-800 mt-1">{stats.admin}</div>
          <span className="text-[11px] text-blue-600">Đề thi & Học sinh</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-emerald-700 font-semibold block text-xs">Giáo viên bộ môn</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{stats.subjectTeacher}</div>
          <span className="text-[11px] text-emerald-600">Soạn đề theo môn</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên giáo viên, mã GV, email..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        <div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả môn học phụ trách</option>
            <option value="Toán">Môn Toán</option>
            <option value="Vật lí">Môn Vật lí</option>
            <option value="Hóa học">Môn Hóa học</option>
            <option value="Sinh học">Môn Sinh học</option>
            <option value="Tin học">Môn Tin học</option>
            <option value="Tiếng Anh">Môn Tiếng Anh</option>
            <option value="Tất cả">Phụ trách tất cả các môn</option>
          </select>
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả vai trò quản trị</option>
            <option value="super_admin">Quản trị viên cấp cao (Super Admin)</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="subject_teacher">Giáo viên bộ môn (Teacher)</option>
          </select>
        </div>
      </div>

      {/* Teachers List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 w-12 text-center">STT</th>
                <th className="p-3.5 min-w-[200px]">Giáo viên & Tài khoản</th>
                <th className="p-3.5 w-32">Môn phụ trách</th>
                <th className="p-3.5 min-w-[160px]">Vai trò</th>
                <th className="p-3.5 min-w-[240px]">Quyền hạn được cấp</th>
                <th className="p-3.5 w-28 text-center">Trạng thái</th>
                <th className="p-3.5 w-28 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredTeachers.map((teacher, idx) => {
                const perms = teacher.permissions || {
                  canManageQuestions: true,
                  canCreateExams: true,
                  canViewResults: true,
                  canManageStudents: false,
                  canManageTeachers: false,
                };
                const isSuperAdmin = teacher.teacherRole === 'super_admin' || teacher.username === 'admin';
                const isAdmin = teacher.teacherRole === 'admin';

                return (
                  <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{teacher.fullName}</span>
                        {isSuperAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-black border border-amber-300">
                            TRƯỞNG BỘ MÔN
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>Mã GV: <strong className="text-slate-800">{teacher.username}</strong></span>
                        {teacher.phone && (
                          <>
                            <span>•</span>
                            <span>{teacher.phone}</span>
                          </>
                        )}
                      </div>
                      {teacher.email && (
                        <div className="text-[11px] text-slate-400">{teacher.email}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0D47A1] font-bold text-xs border border-blue-200">
                        {teacher.subject || 'Toán'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {isSuperAdmin ? (
                        <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-black text-xs border border-purple-200 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                          <span>Quản trị viên cấp cao</span>
                        </span>
                      ) : isAdmin ? (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold text-xs border border-blue-200 inline-flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-blue-700" />
                          <span>Quản trị viên</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200 inline-flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Giáo viên bộ môn</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {perms.canManageQuestions && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            ✓ Ngân hàng đề
                          </span>
                        )}
                        {perms.canCreateExams && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium border border-blue-100">
                            ✓ Tạo & mở đề thi
                          </span>
                        )}
                        {perms.canViewResults && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-100">
                            ✓ Xem điểm & Excel
                          </span>
                        )}
                        {perms.canManageStudents && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-100">
                            ✓ Quản lý học sinh
                          </span>
                        )}
                        {perms.canManageTeachers && (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold border border-purple-200">
                            ✓ Phân quyền GV
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(teacher)}
                        disabled={teacher.username.toLowerCase() === 'admin'}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          teacher.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${teacher.username.toLowerCase() === 'admin' ? 'opacity-80 cursor-not-allowed' : ''}`}
                      >
                        {teacher.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTeacher(teacher)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa phân quyền"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={teacher.username.toLowerCase() === 'admin'}
                          onClick={() => handleDeleteTeacher(teacher)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Xóa tài khoản giáo viên"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-900 to-[#0D47A1] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#FF8A00]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">
                    {editingTeacher.id ? 'Cập nhật phân quyền giáo viên' : 'Thêm giáo viên & Phân quyền quản trị'}
                  </h2>
                  <p className="text-xs text-blue-200">
                    Cấu hình quyền hạn truy cập các chức năng kiểm tra và quản trị
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveTeacher} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Họ và tên giáo viên *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.fullName || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, fullName: e.target.value })}
                    placeholder="Ví dụ: Thầy Trần Quốc Bảo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên đăng nhập / Mã GV *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingTeacher.username?.toLowerCase() === 'admin'}
                    value={editingTeacher.username || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, username: e.target.value })}
                    placeholder="Ví dụ: gv_toan01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mật khẩu đăng nhập *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={editingTeacher.password || ''}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                      placeholder="Mật khẩu..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm pr-9 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Môn phụ trách chính
                  </label>
                  <select
                    value={editingTeacher.subject || 'Toán'}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold"
                  >
                    <option value="Toán">Môn Toán</option>
                    <option value="Vật lí">Môn Vật lí</option>
                    <option value="Hóa học">Môn Hóa học</option>
                    <option value="Sinh học">Môn Sinh học</option>
                    <option value="Tin học">Môn Tin học</option>
                    <option value="Tiếng Anh">Môn Tiếng Anh</option>
                    <option value="Tất cả">Tất cả các môn (Toàn trường)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingTeacher.email || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    placeholder="email@thptthanhhoa.edu.vn"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editingTeacher.phone || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                    placeholder="0912.xxx.xxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Role Level Preset */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Mức vai trò quản trị (Chọn để áp dụng mẫu quyền):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyRoleTemplate('super_admin')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      editingTeacher.teacherRole === 'super_admin'
                        ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-xs">Super Admin</div>
                    <div className="text-[10px] text-purple-700 mt-0.5">Toàn quyền hệ thống</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyRoleTemplate('admin')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      editingTeacher.teacherRole === 'admin'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-xs">Quản trị viên (Admin)</div>
                    <div className="text-[10px] text-blue-700 mt-0.5">Đề thi & Học sinh</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyRoleTemplate('subject_teacher')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      editingTeacher.teacherRole === 'subject_teacher'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-xs">Giáo viên bộ môn</div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Soạn & mở đề thi</div>
                  </button>
                </div>
              </div>

              {/* Granular Permissions Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Chi tiết 5 quyền hạn trong hệ thống:
                </label>

                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTeacher.permissions?.canManageQuestions ?? true}
                      onChange={(e) =>
                        setEditingTeacher({
                          ...editingTeacher,
                          permissions: {
                            ...editingTeacher.permissions!,
                            canManageQuestions: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-[#0D47A1] rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">1. Soạn & Quản lý ngân hàng câu hỏi</span>
                      <span className="text-[11px] text-slate-500">
                        Thêm, sửa, xóa, nhập câu hỏi từ Word (.docx) và Excel
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTeacher.permissions?.canCreateExams ?? true}
                      onChange={(e) =>
                        setEditingTeacher({
                          ...editingTeacher,
                          permissions: {
                            ...editingTeacher.permissions!,
                            canCreateExams: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-[#0D47A1] rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">2. Tạo đề thi & Mở phòng kiểm tra</span>
                      <span className="text-[11px] text-slate-500">
                        Tạo đề tự động theo ma trận, đóng/mở phòng thi, nhân bản đề
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTeacher.permissions?.canViewResults ?? true}
                      onChange={(e) =>
                        setEditingTeacher({
                          ...editingTeacher,
                          permissions: {
                            ...editingTeacher.permissions!,
                            canViewResults: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-[#0D47A1] rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">3. Xem kết quả bài làm & Xuất file Excel</span>
                      <span className="text-[11px] text-slate-500">
                        Xem chi tiết bài làm học sinh, phân tích điểm số và xuất báo cáo điểm
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTeacher.permissions?.canManageStudents ?? false}
                      onChange={(e) =>
                        setEditingTeacher({
                          ...editingTeacher,
                          permissions: {
                            ...editingTeacher.permissions!,
                            canManageStudents: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-[#0D47A1] rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">4. Quản trị tài khoản Học sinh & Lớp học</span>
                      <span className="text-[11px] text-slate-500">
                        Thêm danh sách học sinh, import danh sách từ Excel, mở khóa tài khoản
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTeacher.permissions?.canManageTeachers ?? false}
                      onChange={(e) =>
                        setEditingTeacher({
                          ...editingTeacher,
                          permissions: {
                            ...editingTeacher.permissions!,
                            canManageTeachers: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-[#0D47A1] rounded"
                    />
                    <div>
                      <span className="font-bold text-purple-900 block">5. Phân quyền quản trị cho giáo viên khác</span>
                      <span className="text-[11px] text-purple-700">
                        Tạo tài khoản giáo viên mới và phân công quyền hạn quản trị
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Status Radio */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Trạng thái tài khoản:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="teacherStatus"
                    checked={editingTeacher.status === 'active'}
                    onChange={() => setEditingTeacher({ ...editingTeacher, status: 'active' })}
                    className="text-[#0D47A1]"
                  />
                  <span className="text-xs font-semibold text-emerald-700">Đang hoạt động</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="teacherStatus"
                    checked={editingTeacher.status === 'locked'}
                    onChange={() => setEditingTeacher({ ...editingTeacher, status: 'locked' })}
                    className="text-red-600"
                  />
                  <span className="text-xs font-semibold text-red-600">Khóa tài khoản</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer"
                >
                  HỦY
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0D47A1] hover:bg-blue-800 text-white font-black rounded-xl shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#FF8A00]" />
                  <span>LƯU THÔNG TIN & PHÂN QUYỀN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
