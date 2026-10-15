import React, { useState } from 'react';
import {
  Settings,
  RefreshCw,
  School,
  Database,
  Lock,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { storageService } from '../../services/storage';

interface SettingsViewProps {
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataReset }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleReset = () => {
    if (
      confirm(
        'Bạn có chắc chắn muốn đặt lại dữ liệu về mặc định ban đầu? Tất cả đề thi và bài làm mới sẽ được khôi phục về dữ liệu chuẩn của THPT Thanh Hòa.'
      )
    ) {
      setIsResetting(true);
      setTimeout(() => {
        storageService.resetToDefaults();
        setIsResetting(false);
        setSuccessMessage('Đã khôi phục toàn bộ dữ liệu mẫu thành công!');
        onDataReset();
        setTimeout(() => setSuccessMessage(null), 3000);
      }, 400);
    }
  };

  const handleExportBackup = () => {
    const data = {
      users: storageService.getUsers(),
      classes: storageService.getClasses(),
      questions: storageService.getQuestions(),
      exams: storageService.getExams(),
      submissions: storageService.getSubmissions(),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sao_luu_He_thong_Kiem_tra_THPT_ThanhHoa_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#0D47A1]" />
          Cài đặt hệ thống kiểm tra
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Cấu hình thông tin trường học, sao lưu và quản lý dữ liệu kiểm tra
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* System Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <School className="w-5 h-5 text-[#0D47A1]" />
          Thông tin đơn vị & Hệ thống
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs text-slate-500 block mb-0.5">Tên trường học:</label>
            <div className="font-bold text-slate-800">Trường THPT Thanh Hòa</div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-0.5">Năm học:</label>
            <div className="font-bold text-slate-800">2026 – 2027</div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-0.5">Khối áp dụng:</label>
            <div className="font-bold text-slate-800">Khối 10 (Chương trình GDPT mới)</div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-0.5">Giáo viên phụ trách:</label>
            <div className="font-bold text-slate-800">Thầy Nguyễn Văn Dương</div>
          </div>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <Database className="w-5 h-5 text-[#0D47A1]" />
          Sao lưu & Dữ liệu
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Toàn bộ ngân hàng câu hỏi, danh sách học sinh và kết quả bài thi được lưu trữ tự động trên thiết bị. Bạn có thể tải file sao lưu JSON về máy tính để lưu trữ hoặc chuyển sang máy khác.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#0D47A1] rounded-lg text-xs sm:text-sm font-bold border border-blue-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải file sao lưu hệ thống (JSON)</span>
          </button>
        </div>
      </div>

      {/* Reset to Factory Defaults */}
      <div className="bg-white rounded-xl border border-red-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-base font-bold">Khôi phục dữ liệu mẫu ban đầu</h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600">
          Nhấn nút bên dưới để khôi phục lại toàn bộ ngân hàng câu hỏi, bài kiểm tra mẫu, và tài khoản mẫu cho các lớp 10A1, 10A3, 10A5, 10A9 của THPT Thanh Hòa.
        </p>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'ĐANG KHÔI PHỤC...' : 'KHÔI PHỤC DỮ LIỆU GỐC'}</span>
        </button>
      </div>
    </div>
  );
};
