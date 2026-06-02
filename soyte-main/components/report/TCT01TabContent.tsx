import React, { useMemo } from 'react';
import { FeedbackItem } from '@/types/feedbacks';
import { calculateTotalUnits, calculateOnTimeStats, formatRate } from '@/utils/reportDataUtils';

interface TCT01TabContentProps {
    data: {
        tongSo: number;
        tiepNhan: any[];
        deCuong: any[];
    };
    dateRange: { startDate: string, endDate: string };
}

export const TCT01TabContent: React.FC<TCT01TabContentProps> = ({ data, dateRange }) => {
    if (!data) return null;
    const { tongSo, tiepNhan, deCuong } = data;
    const reportedCount = tiepNhan?.find(i => i.stt === 1)?.soLuong || 0;

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-[50vh] space-y-6">
            {/* Bảng 1: Thống kê tổng hợp */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <h3 className="font-bold text-slate-800 text-lg">Tổng hợp tình hình báo cáo</h3>
                </div>
                <div className="overflow-x-auto p-6">
                    {tongSo > 0 && (
                        <div className="text-slate-800 font-bold text-lg mb-4">
                            Tổng số: <span className="text-primary-700">{tongSo}</span> đơn vị.
                        </div>
                    )}
                    <table className="w-full border-collapse border border-slate-300">
                        <thead className="bg-primary-900 text-white">
                            <tr>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-16">STT</th>
                                <th className="border border-slate-600 p-3 text-left font-semibold">Nội dung</th>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-32">Số lượng</th>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-32">Tỷ lệ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tiepNhan.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50 border-b border-slate-200">
                                    <td className="border border-slate-300 p-3 text-center text-slate-700 font-medium">{item.stt}</td>
                                    <td className="border border-slate-300 p-3 text-slate-800 font-medium">{item.noiDung}</td>
                                    <td className="border border-slate-300 p-3 text-center font-bold text-primary-700">{item.soLuong}</td>
                                    <td className="border border-slate-300 p-3 text-center font-bold text-slate-600">{item.tyLe}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bảng 2: Chi tiết */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <h3 className="font-bold text-slate-800 text-lg">Kết quả thực hiện theo đề cương và biểu mẫu</h3>
                    <p className="text-sm text-slate-500 mt-1 italic">(Chỉ phân tích trên {reportedCount} đơn vị báo cáo)</p>
                </div>
                <div className="overflow-x-auto p-6">
                    <table className="w-full border-collapse border border-slate-300">
                        <thead className="bg-primary-900 text-white">
                            <tr>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-16">STT</th>
                                <th className="border border-slate-600 p-3 text-left font-semibold">Nội dung</th>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-32">Số lượng</th>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-32">Tỷ lệ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deCuong.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50 border-b border-slate-200">
                                    <td className="border border-slate-300 p-3 text-center text-slate-700 font-medium">{item.stt}</td>
                                    <td className="border border-slate-300 p-3 text-slate-800 font-medium">{item.noiDung}</td>
                                    <td className="border border-slate-300 p-3 text-center font-bold text-primary-700">{item.soLuong}</td>
                                    <td className="border border-slate-300 p-3 text-center font-bold text-slate-600">{item.tyLe}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
