import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Check,
  X,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Sparkles,
  School,
  BookOpen,
  Award,
  Users,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { TeacherPermissions, TeacherRoleLevel, User } from '../../types';
import { storageService } from '../../services/storage';

export const TeacherPermissionManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<User[]>(() => storageService.getTeachers());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State for Add / Edit Teacher
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [subject, setSubject] = useState('Toán');
  const [teacherRole, setTeacherRole] = useState<TeacherRoleLevel>('subject_teacher');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Permissions state in form
  const [perms, setPerms] = useState<TeacherPermissions>({
    canManageQuestions: true,
    canCreateExams: true,
    canViewResults: true,
    canManageStudents: false,
    canManageTeachers: false,
  });

  const reloadTeachers = () => {
    setTeachers(storageService.getTeachers());
  };

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Preset role permissions
  const handleRoleChange = (role: TeacherRoleLevel) => {
    setTeacherRole(role);
    if (role === 'super_admin') {
      setPerms({
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: true,
        canManageTeachers: true,
      });
    } else if (role === 'admin') {
      setPerms({
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: true,
        canManageTeachers: false,
      });
    } else {
      setPerms({
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: false,
        canManageTeachers: false,
      });
    }
  };

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setFullName('');
    setUsername('');
    setPassword('password123');
    setSubject('Toán');
    setTeacherRole('subject_teacher');
    setEmail('');
    setPhone('');
    setPerms({
      canManageQuestions: true,
      canCreateExams: true,
      canViewResults: true,
      canManageStudents: false,
      canManageTeachers: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (teacher: User) => {
    setEditingTeacher(teacher);
    setFullName(teacher.fullName);
    setUsername(teacher.username);
    setPassword(teacher.password || 'password123');
    setSubject(teacher.subject || 'Toán');
    setTeacherRole(teacher.teacherRole || 'subject_teacher');
    setEmail(teacher.email || '');
    setPhone(teacher.phone || '');
    setPerms(
      teacher.permissions || {
        canManageQuestions: true,
        canCreateExams: true,
        canViewResults: true,
        canManageStudents: false,
        canManageTeachers: false,
      }
    );
    setIsModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !username.trim()) {
      alert('Vui lòng nhập họ tên và tên đăng nhập!');
      return;
    }

    const cleanUsername = username.trim();

    // Check duplicate username if adding new
    if (!editingTeacher) {
      const exists = storageService.getUsers().some(
        (u) => u.username.toUpperCase() === cleanUsername.toUpperCase()
      );
      if (exists) {
        alert(`Tên đăng nhập "${cleanUsername}" đã tồn tại trong hệ thống! Vui lòng chọn tên khác.`);
        return;
      }
    }

    const teacherToSave: User = {
      id: editingTeacher ? editingTeacher.id : `u-teacher-${Date.now()}`,
      username: cleanUsername,
      fullName: fullName.trim(),
      role: 'teacher',
      teacherRole,
      subject,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      password: password || 'password123',
      status: editingTeacher ? editingTeacher.status : 'active',
      permissions: perms,
      createdAt: editingTeacher ? editingTeacher.createdAt : new Date().toISOString(),
    };

    storageService.saveTeacher(teacherToSave);
    reloadTeachers();
    setIsModalOpen(false);
    showNotification(
      editingTeacher
        ? `Đã cập nhật thông tin và phân quyền cho "${teacherToSave.fullName}"!`
        : `Đã thêm giáo viên mới "${teacherToSave.fullName}" thành công!`
    );
  };

  // Toggle quick permission on the table row
  const handleToggleRowPermission = (teacher: User, key: keyof TeacherPermissions) => {
    if (teacher.username.toUpperCase() === 'ADMIN' && key === 'canManageTeachers') {
      alert('Tài khoản Quản trị viên cấp cao của Thầy Nguyễn Tiến Dương phải luôn có quyền quản trị tối cao!');
      return;
    }

    storageService.toggleTeacherPermission(teacher.id, key);
    reloadTeachers();
    showNotification(`Đã cập nhật quyền hạn cho ${teacher.fullName}`);
  };

  // Toggle lock / unlock status
  const handleToggleStatus = (teacher: User) => {
    if (teacher.id === 'u-teacher-1' || teacher.username.toUpperCase() === 'ADMIN') {
      alert('Không thể khóa tài khoản Quản trị viên cấp cao (Thầy Nguyễn Tiến Dương)!');
      return;
    }

    const newStatus: 'active' | 'locked' = teacher.status === 'active' ? 'locked' : 'active';
    const updated: User = { ...teacher, status: newStatus };
    storageService.saveUser(updated);
    reloadTeachers();
    showNotification(
      newStatus === 'active'
        ? `Đã mở khóa tài khoản của ${teacher.fullName}`
        : `Đã tạm khóa tài khoản của ${teacher.fullName}`
    );
  };

  // Delete teacher
  const handleDeleteTeacher = (teacher: User) => {
    if (teacher.id === 'u-teacher-1' || teacher.username.toUpperCase() === 'ADMIN') {
      alert('Không thể xóa tài khoản Quản trị viên cấp cao (Thầy Nguyễn Tiến Dương)!');
      return;
    }

    if (
      confirm(
        `Bạn có chắc chắn muốn xóa giáo viên "${teacher.fullName}" (${teacher.username}) khỏi hệ thống?`
      )
    ) {
      storageService.deleteTeacher(teacher.id);
      reloadTeachers();
      showNotification(`Đã xóa giáo viên "${teacher.fullName}" thành công!`);
    }
  };

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchSubject = filterSubject === 'ALL' || t.subject === filterSubject;
      const matchRole = filterRole === 'ALL' || t.teacherRole === filterRole;

      return matchSearch && matchSubject && matchRole;
    });
  }, [teachers, searchTerm, filterSubject, filterRole]);

  // Summary stats
  const stats = useMemo(() => {
    return {
      total: teachers.length,
      superAdmin: teachers.filter((t) => t.teacherRole === 'super_admin').length,
      admin: teachers.filter((t) => t.teacherRole === 'admin').length,
      subjectTeacher: teachers.filter((t) => t.teacherRole === 'subject_teacher').length,
    };
  }, [teachers]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-[#0D47A1] to-indigo-900 rounded-2xl p-6 text-white shadow-md border-b-4 border-[#FF8A00] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-amber-300 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Phân quyền Quản trị – THPT Thanh Hòa (Đồng Nai)
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            QUẢN LÝ GIÁO VIÊN & PHÂN QUYỀN HỆ THỐNG
          </h1>
          <p className="text-blue-200 text-xs sm:text-sm max-w-2xl">
            Quản lý tài khoản giáo viên, phân cấp vai trò và cấp quyền tạo đề thi, quản lý ngân hàng câu hỏi, xem kết quả cho các giáo viên bộ môn Khối 10.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-3 bg-[#FF8A00] hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ THÊM GIÁO VIÊN & CẤP QUYỀN</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Tổng số giáo viên
          </span>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-0.5">Cán bộ & Giáo viên</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs bg-blue-50/30">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
            Super Admin
          </span>
          <div className="text-2xl font-black text-[#0D47A1]">{stats.superAdmin}</div>
          <div className="text-xs text-blue-600 mt-0.5 font-medium">Thầy Nguyễn Tiến Dương</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
            Quản trị viên (Admin)
          </span>
          <div className="text-2xl font-black text-indigo-600">{stats.admin}</div>
          <div className="text-xs text-slate-500 mt-0.5">Toàn quyền vận hành đề</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
            Giáo viên bộ môn
          </span>
          <div className="text-2xl font-black text-emerald-600">{stats.subjectTeacher}</div>
          <div className="text-xs text-slate-500 mt-0.5">Phụ trách từng môn</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo họ tên, username, email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          >
            <option value="ALL">Tất cả môn học</option>
            <option value="Toán">Toán</option>
            <option value="Vật lí">Vật lí</option>
            <option value="Hóa học">Hóa học</option>
            <option value="Sinh học">Sinh học</option>
            <option value="Tin học">Tin học</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="super_admin">Quản trị cấp cao (Super Admin)</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="subject_teacher">Giáo viên bộ môn</option>
          </select>
        </div>
      </div>

      {/* Teachers Table & Permissions Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0D47A1]" />
            <h2 className="font-extrabold text-slate-800 text-sm uppercase">
              Danh sách giáo viên & Ma trận phân quyền
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị {filteredTeachers.length} / {teachers.length} giáo viên
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Giáo viên</th>
                <th className="py-3 px-3">Môn phụ trách</th>
                <th className="py-3 px-3">Vai trò</th>
                <th className="py-3 px-2 text-center" title="Quyền Soạn thảo & Quản lý ngân hàng câu hỏi">
                  Ngân hàng câu hỏi
                </th>
                <th className="py-3 px-2 text-center" title="Quyền Tạo đề thi & Mở phòng thi">
                  Tạo đề thi
                </th>
                <th className="py-3 px-2 text-center" title="Quyền Xem kết quả & Xuất file Excel">
                  Xem kết quả
                </th>
                <th className="py-3 px-2 text-center" title="Quyền Quản lý danh sách học sinh">
                  Quản lý học sinh
                </th>
                <th className="py-3 px-2 text-center" title="Quyền Phân quyền cho giáo viên khác">
                  Phân quyền
                </th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((teacher) => {
                const isSuperAdmin = teacher.teacherRole === 'super_admin' || teacher.username.toUpperCase() === 'ADMIN';
                const p = teacher.permissions || {
                  canManageQuestions: true,
                  canCreateExams: true,
                  canViewResults: true,
                  canManageStudents: false,
                  canManageTeachers: false,
                };

                return (
                  <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Teacher Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSuperAdmin
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-[#0D47A1]'
                        }`}>
                          {teacher.fullName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{teacher.fullName}</span>
                            {isSuperAdmin && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                                CHỦ TÀI KHOẢN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            @{teacher.username} {teacher.phone && `• ${teacher.phone}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-[#0D47A1] border border-blue-200">
                        {teacher.subject || 'Toán'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      {isSuperAdmin ? (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs">
                          Super Admin
                        </span>
                      ) : teacher.teacherRole === 'admin' ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                          Quản trị viên
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          GV Bộ môn
                        </span>
                      )}
                    </td>

                    {/* Permission: Questions */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRowPermission(teacher, 'canManageQuestions')}
                        disabled={isSuperAdmin}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                          p.canManageQuestions
                            ? 'bg-blue-600 text-white shadow-2xs hover:bg-blue-700'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                        } ${isSuperAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                        title="Bật/Tắt quyền Quản lý ngân hàng câu hỏi"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>

                    {/* Permission: Create Exams */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRowPermission(teacher, 'canCreateExams')}
                        disabled={isSuperAdmin}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                          p.canCreateExams
                            ? 'bg-blue-600 text-white shadow-2xs hover:bg-blue-700'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                        } ${isSuperAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                        title="Bật/Tắt quyền Tạo đề thi"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>

                    {/* Permission: View Results */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRowPermission(teacher, 'canViewResults')}
                        disabled={isSuperAdmin}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                          p.canViewResults
                            ? 'bg-blue-600 text-white shadow-2xs hover:bg-blue-700'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                        } ${isSuperAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                        title="Bật/Tắt quyền Xem kết quả & Báo cáo"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>

                    {/* Permission: Manage Students */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRowPermission(teacher, 'canManageStudents')}
                        disabled={isSuperAdmin}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                          p.canManageStudents
                            ? 'bg-blue-600 text-white shadow-2xs hover:bg-blue-700'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                        } ${isSuperAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                        title="Bật/Tắt quyền Quản lý học sinh"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>

                    {/* Permission: Manage Teachers */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRowPermission(teacher, 'canManageTeachers')}
                        disabled={isSuperAdmin}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                          p.canManageTeachers
                            ? 'bg-amber-500 text-white shadow-2xs hover:bg-amber-600'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                        } ${isSuperAdmin ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                        title="Bật/Tắt quyền Phân quyền giáo viên khác"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(teacher)}
                        disabled={isSuperAdmin}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${
                          teacher.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        } ${isSuperAdmin ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                      >
                        {teacher.status === 'active' ? (
                          <>
                            <Unlock className="w-3 h-3 text-emerald-600" />
                            <span>Hoạt động</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-red-600" />
                            <span>Đã khóa</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(teacher)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Sửa thông tin & Phân quyền"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {!isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(teacher)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa giáo viên này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-900 to-[#0D47A1] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#FF8A00]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {editingTeacher ? 'CHỈNH SỬA & PHÂN QUYỀN GIÁO VIÊN' : 'THÊM GIÁO VIÊN MỚI & CẤP QUYỀN'}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Trường THPT Thanh Hòa – Tỉnh Đồng Nai
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTeacher} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Họ và tên giáo viên *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Thầy Lê Văn Hùng, Cô Trần Thị Mai"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên đăng nhập (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: gv_levanhung"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mật khẩu đăng nhập *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mặc định: password123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Môn phụ trách *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email liên hệ
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="giaovien@thptthanhhoa.edu.vn"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912.xxx.xxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                  />
                </div>
              </div>

              {/* Role Level Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Cấp bậc vai trò quản trị:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('subject_teacher')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      teacherRole === 'subject_teacher'
                        ? 'bg-blue-50 border-[#0D47A1] text-[#0D47A1] font-bold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">GV Bộ môn</div>
                    <div className="text-[11px] text-slate-500">Soạn & mở đề lớp mình</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      teacherRole === 'admin'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">Quản trị viên</div>
                    <div className="text-[11px] text-slate-500">Quản lý toàn bộ đề & HS</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('super_admin')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      teacherRole === 'super_admin'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">Super Admin</div>
                    <div className="text-[11px] text-slate-500">Toàn quyền hệ thống</div>
                  </button>
                </div>
              </div>

              {/* Detail Permissions Checkboxes */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Cấu hình quyền hạn chi tiết (Bật / Tắt):
                </span>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={perms.canManageQuestions}
                      onChange={(e) => setPerms({ ...perms, canManageQuestions: e.target.checked })}
                      className="rounded text-[#0D47A1]"
                    />
                    <span className="font-semibold">Soạn thảo & Quản lý ngân hàng câu hỏi (Word/Excel)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={perms.canCreateExams}
                      onChange={(e) => setPerms({ ...perms, canCreateExams: e.target.checked })}
                      className="rounded text-[#0D47A1]"
                    />
                    <span className="font-semibold">Tạo đề thi tự động & Mở / Đóng phòng kiểm tra</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={perms.canViewResults}
                      onChange={(e) => setPerms({ ...perms, canViewResults: e.target.checked })}
                      className="rounded text-[#0D47A1]"
                    />
                    <span className="font-semibold">Xem kết quả thi, phân tích phổ điểm & Xuất file Excel</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={perms.canManageStudents}
                      onChange={(e) => setPerms({ ...perms, canManageStudents: e.target.checked })}
                      className="rounded text-[#0D47A1]"
                    />
                    <span className="font-semibold">Quản lý danh sách học sinh & Lớp học Khối 10</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={perms.canManageTeachers}
                      onChange={(e) => setPerms({ ...perms, canManageTeachers: e.target.checked })}
                      className="rounded text-[#0D47A1]"
                    />
                    <span className="font-semibold text-amber-900">Phân quyền quản trị cho các giáo viên khác</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer hover:bg-slate-100"
                >
                  HỦY BỎ
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF8A00] hover:bg-amber-600 text-white font-extrabold rounded-lg shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTeacher ? 'CẬP NHẬT PHÂN QUYỀN' : 'LƯU GIÁO VIÊN'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
