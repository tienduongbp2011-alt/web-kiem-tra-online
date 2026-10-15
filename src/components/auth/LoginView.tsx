import React, { useState } from 'react';
import { Eye, EyeOff, User as UserIcon, Lock, GraduationCap, ShieldAlert, Sparkles, School } from 'lucide-react';
import { storageService } from '../../services/storage';
import { Role, User } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập mã học sinh hoặc tài khoản');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const user = storageService.authenticate(username, password);

      if (!user) {
        setErrorMessage('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại.');
        setIsLoading(false);
        return;
      }

      // Check role mismatch if student tries teacher mode or vice-versa
      if (selectedRole === 'teacher' && user.role !== 'teacher') {
        setErrorMessage('Tài khoản này không có quyền Giáo viên / Quản trị viên.');
        setIsLoading(false);
        return;
      }

      storageService.setCurrentUser(user);
      onLoginSuccess(user);
      setIsLoading(false);
    }, 250);
  };

  const handleQuickFill = (u: string, p: string, role: Role) => {
    setSelectedRole(role);
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-xl w-full space-y-5">
        {/* Official School Poster / Exam Banner */}
        <div className="bg-gradient-to-br from-[#0D47A1] via-blue-900 to-[#0A3880] rounded-2xl p-5 sm:p-6 text-white shadow-lg border-2 border-amber-400/40 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#FF8A00]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 w-36 h-36 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Department & School Header */}
          <div className="text-center relative z-10 space-y-1">
            <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-amber-300">
              SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI
            </div>
            <div className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-white flex items-center justify-center gap-2">
              <School className="w-4 h-4 text-amber-400" />
              <span>TRƯỜNG THPT THANH HÒA – ĐỒNG NAI</span>
            </div>
            <div className="w-24 h-0.5 bg-amber-400/60 mx-auto my-2 rounded-full" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              CỔNG DỰ THI TRẮC NGHIỆM TRỰC TUYẾN
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-blue-200">
              Mr Dương - KIỂM TRA ONLINE – Năm học 2026–2027
            </p>

            {/* Poster Meta Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" /> Dành cho Khối 10
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-200 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> GDPT 2018
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white font-medium">
                Phụ trách: Thầy Nguyễn Tiến Dương
              </span>
            </div>
          </div>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-200 p-1.5 rounded-xl border border-slate-300">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('student');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
              selectedRole === 'student'
                ? 'bg-[#0D47A1] text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-300/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>ĐĂNG NHẬP HỌC SINH</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('teacher');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
              selectedRole === 'teacher'
                ? 'bg-[#0D47A1] text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-300/60'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>ĐĂNG NHẬP GIÁO VIÊN</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white py-7 px-6 sm:px-8 shadow-md rounded-2xl border border-slate-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-700 text-sm animate-fadeIn">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {selectedRole === 'student' ? 'Mã học sinh / Tài khoản' : 'Tài khoản giáo viên'}
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={selectedRole === 'student' ? 'Ví dụ: HS1001, HS1003...' : 'Ví dụ: admin'}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Checkbox: Hiển thị mật khẩu */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0D47A1] border-slate-300 focus:ring-[#0D47A1]"
                />
                <span className="font-medium text-xs sm:text-sm">Hiển thị mật khẩu</span>
              </label>
              <span className="text-xs text-slate-500">THPT Thanh Hòa – Đồng Nai</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-bold text-white bg-[#0D47A1] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0D47A1] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#FF8A00]" />
                Tài khoản mẫu thử nghiệm nhanh:
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('HS1001', 'password123', 'student')}
                className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors"
              >
                <div className="font-bold text-[#0D47A1]">HS1001 (Lớp 10A1)</div>
                <div className="text-slate-500 text-[11px]">Nguyễn Văn An</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('HS1003', 'password123', 'student')}
                className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors"
              >
                <div className="font-bold text-[#0D47A1]">HS1003 (Lớp 10A3)</div>
                <div className="text-slate-500 text-[11px]">Lê Hoàng Cường</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('HS1005', 'password123', 'student')}
                className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors"
              >
                <div className="font-bold text-[#0D47A1]">HS1005 (Lớp 10A5)</div>
                <div className="text-slate-500 text-[11px]">Đỗ Quỳnh Anh</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'password123', 'teacher')}
                className="p-2 text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
              >
                <div className="font-bold text-[#FF8A00]">admin (Quản trị viên)</div>
                <div className="text-slate-600 text-[11px]">Thầy Nguyễn Tiến Dương</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Mật khẩu mặc định: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">password123</code>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          Hệ thống kiểm tra trực tuyến © 2026–2027 – Trường THPT Thanh Hòa – Tỉnh Đồng Nai
        </div>
      </div>
    </div>
  );
};
