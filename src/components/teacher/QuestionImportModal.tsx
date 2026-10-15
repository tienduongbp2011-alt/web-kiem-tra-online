import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Save,
  Edit2,
} from 'lucide-react';
import { excelService, QuestionImportRow } from '../../services/excel';
import { storageService } from '../../services/storage';

interface QuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

export const QuestionImportModal: React.FC<QuestionImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [rows, setRows] = useState<QuestionImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);

    try {
      const parsedRows = await excelService.parseQuestionsFile(file);
      setRows(parsedRows);
    } catch (err) {
      alert('Không thể đọc file Excel. Vui lòng kiểm tra đúng định dạng .xlsx hoặc .csv');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellChange = (
    index: number,
    field: keyof QuestionImportRow,
    value: string | number
  ) => {
    const updated = [...rows];
    const item = { ...updated[index], [field]: value };

    // Revalidate row
    const errors: string[] = [];
    if (!item.content.trim()) errors.push('Thiếu nội dung câu hỏi');
    if (!item.correctAnswer.toString().trim()) errors.push('Thiếu đáp án đúng');

    const isSingleChoice =
      item.type.toLowerCase().includes('1 đáp án') ||
      item.type.toLowerCase().includes('trắc nghiệm');
    if (isSingleChoice && (!item.optionA || !item.optionB)) {
      errors.push('Câu hỏi trắc nghiệm cần tối thiểu phương án A và B');
    }

    item.errors = errors;
    item.isValid = errors.length === 0;

    updated[index] = item;
    setRows(updated);
  };

  const handleSaveToBank = () => {
    const invalidRows = rows.filter((r) => !r.isValid);
    if (invalidRows.length > 0) {
      alert(
        `Còn ${invalidRows.length} dòng chứa dữ liệu không hợp lệ. Vui lòng chỉnh sửa trực tiếp trong bảng hoặc xóa dòng lỗi trước khi lưu!`
      );
      return;
    }

    if (rows.length === 0) {
      alert('Chưa có câu hỏi nào để lưu.');
      return;
    }

    const questions = excelService.convertImportedRowsToQuestions(rows);
    storageService.saveQuestionsBatch(questions);
    onImportComplete(questions.length);
    onClose();
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0D47A1] flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Nhập câu hỏi từ file Excel / CSV
              </h2>
              <p className="text-xs text-slate-500">
                Tự động kiểm tra lỗi theo từng dòng, cho phép sửa trực tiếp trước khi thêm vào Ngân hàng đề
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top action bar: Download sample & Upload */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-blue-50/60 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => excelService.downloadQuestionTemplate()}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg text-xs sm:text-sm font-bold text-[#0D47A1] shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#FF8A00]" />
                <span>Tải file Excel mẫu chuẩn</span>
              </button>
              <span className="text-xs text-slate-500 hidden md:inline">
                (Định dạng: Môn, Chương, Bài, Mức độ, Dạng câu, A, B, C, D, Đáp án đúng...)
              </span>
            </div>

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
                className="flex items-center gap-2 px-4 py-2 bg-[#0D47A1] hover:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#FF8A00]" />
                <span>Chọn file Excel từ máy</span>
              </button>
            </div>
          </div>

          {/* Upload Status / Validation Stats */}
          {rows.length > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs sm:text-sm">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-700">
                  File: <strong className="text-slate-900">{fileName}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Hợp lệ: {validCount}
                </span>
                {errorCount > 0 && (
                  <span className="flex items-center gap-1.5 text-red-600 font-bold">
                    <AlertTriangle className="w-4 h-4" /> Có lỗi: {errorCount} dòng
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 italic hidden sm:inline">
                * Nhấp đúp vào ô để sửa dữ liệu lỗi trực tiếp
              </span>
            </div>
          )}

          {/* Interactive Editable Preview Table */}
          {rows.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-100 text-slate-800 font-bold sticky top-0 uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5 w-14">Dòng</th>
                    <th className="p-2.5 w-24">Trạng thái</th>
                    <th className="p-2.5 w-20">Môn</th>
                    <th className="p-2.5 w-24">Mức độ</th>
                    <th className="p-2.5 min-w-[220px]">Nội dung câu hỏi</th>
                    <th className="p-2.5 w-24">Đáp án A</th>
                    <th className="p-2.5 w-24">Đáp án B</th>
                    <th className="p-2.5 w-24">Đáp án C</th>
                    <th className="p-2.5 w-24">Đáp án D</th>
                    <th className="p-2.5 w-24 text-center">Đ/Án đúng</th>
                    <th className="p-2.5 min-w-[150px]">Lỗi kiểm tra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.isValid ? 'hover:bg-slate-50' : 'bg-red-50/50 hover:bg-red-50'}
                    >
                      <td className="p-2.5 font-bold text-slate-500 text-center">{row.rowNumber}</td>
                      <td className="p-2.5">
                        {row.isValid ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            Hợp lệ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[11px]">
                            Lỗi
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.subject}
                          onChange={(e) => handleCellChange(idx, 'subject', e.target.value)}
                          className="w-full border border-transparent hover:border-slate-300 focus:border-[#0D47A1] rounded px-1.5 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.difficulty}
                          onChange={(e) => handleCellChange(idx, 'difficulty', e.target.value)}
                          className="w-full border border-transparent hover:border-slate-300 focus:border-[#0D47A1] rounded px-1.5 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.content}
                          onChange={(e) => handleCellChange(idx, 'content', e.target.value)}
                          className="w-full border border-transparent hover:border-slate-300 focus:border-[#0D47A1] rounded px-1.5 py-1 text-xs font-medium"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.optionA}
                          onChange={(e) => handleCellChange(idx, 'optionA', e.target.value)}
                          className="w-full border border-transparent hover:border-slate-300 focus:border-[#0D47A1] rounded px-1.5 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.optionB}
                          onChange={(e) => handleCellChange(idx, 'optionB', e.target.value)}
                          className="w-full border border-transparent hover:border-slate-300 focus:border-[#0D47A1] rounded px-1.5 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.optionC}
                          onChange={(e) => handleCellChange(idx, 'optionC', e.target.value)}
                          className="w-full border border-transparent hover:border-slate-300 focus:border-[#0D47A1] rounded px-1.5 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.optionD}
                          onChange={(e) => handleCellChange(idx, 'optionD', e.target.value)}
                          className="w-full border border-transparent hover:border-slate-300 focus:border-[#0D47A1] rounded px-1.5 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.correctAnswer}
                          onChange={(e) => handleCellChange(idx, 'correctAnswer', e.target.value)}
                          className="w-full text-center font-bold text-[#0D47A1] border border-transparent hover:border-slate-300 focus:border-[#0D47A1] rounded px-1.5 py-1 text-xs uppercase"
                        />
                      </td>
                      <td className="p-2.5 text-red-600 font-medium">
                        {row.errors.join('; ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center space-y-3">
              <Upload className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">
                Chưa có file nào được tải lên
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bấm vào nút <strong>"Tải file Excel mẫu chuẩn"</strong> ở trên để xem định dạng các cột, sau đó bấm <strong>"Chọn file Excel từ máy"</strong> để nhập câu hỏi.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold text-sm hover:bg-slate-100"
          >
            HỦY BỎ
          </button>

          <button
            type="button"
            disabled={rows.length === 0 || errorCount > 0}
            onClick={handleSaveToBank}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0D47A1] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#FF8A00]" />
            <span>LƯU {validCount} CÂU VÀO NGÂN HÀNG ĐỀ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
