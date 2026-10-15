import React from 'react';
import { BookOpen, LogOut, User as UserIcon, GraduationCap, ShieldCheck } from 'lucide-react';
import { User } from '../../types';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigateHome }) => {
  return (
    <header className="bg-[#0D47A1] text-white shadow-md sticky top-0 z-40 border-b border-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 text-[#FF8A00] group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-blue-200 font-medium">
              TRƯỜNG THPT THANH HÒA
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Mr Dương</span>
              <span className="text-blue-300 font-normal">|</span>
              <span className="text-[#FF8A00]">KIỂM TRA ONLINE</span>
            </div>
          </div>
        </div>

        {/* User Info & Actions */}
        {currentUser ? (
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-white flex items-center gap-1.5 justify-end">
                {currentUser.role === 'teacher' ? (
                  <ShieldCheck className="w-4 h-4 text-[#FF8A00]" />
                ) : (
                  <UserIcon className="w-4 h-4 text-blue-300" />
                )}
                {currentUser.fullName}
              </span>
              <span className="text-xs text-blue-200">
                {currentUser.role === 'teacher'
                  ? 'Giáo viên / Quản trị viên'
                  : `Học sinh lớp ${currentUser.className || 'Khối 10'}`}
              </span>
            </div>

            <button
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-md border border-white/20 transition-colors"
            >
              <LogOut className="w-4 h-4 text-[#FF8A00]" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-blue-100 font-medium flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#FF8A00]" />
            <span className="hidden md:inline">Hệ thống khảo thí trực tuyến Khối 10</span>
            <span className="md:hidden">THPT Thanh Hòa</span>
          </div>
        )}
      </div>
    </header>
  );
};
