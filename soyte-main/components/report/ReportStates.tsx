import React from 'react';

/** Hiển thị spinner khi đang tải dữ liệu */
export const ReportLoadingState: React.FC = () => (
    <div className="flex justify-center items-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
        <i className="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
        <span className="ml-3 text-lg font-medium text-slate-600">Đang tải dữ liệu tổng hợp...</span>
    </div>
);

/** Hiển thị khi không có dữ liệu */
export const ReportEmptyState: React.FC<{ message?: string }> = ({
    message = 'Không tìm thấy dữ liệu trong khoảng thời gian đã chọn.',
}) => (
    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="inline-flex w-20 h-20 bg-slate-50 items-center justify-center rounded-full mb-4">
            <i className="pi pi-inbox text-4xl text-slate-300"></i>
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">Không có dữ liệu báo cáo</h3>
        <p className="text-slate-500">{message}</p>
    </div>
);

/** CSS cho styled-tabview dùng chung */
export const StyledTabViewCSS: React.FC = () => (
    <style>{`
        .styled-tabview .p-tabview-nav {
            background: transparent;
            border-bottom: 1px solid #e2e8f0;
            padding: 0 1.5rem;
        }
        .styled-tabview .p-tabview-nav li .p-tabview-nav-link {
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            color: #64748b;
            font-weight: 600;
            padding: 1rem 1.25rem;
            transition: all 0.2s;
            box-shadow: none !important;
            display: block;
            max-width: 400px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .styled-tabview .p-tabview-nav li:not(.p-highlight):hover .p-tabview-nav-link {
            color: #475569;
            border-color: #cbd5e1;
            background: #f8fafc;
        }
        .styled-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
            color: #1e3a8a;
            border-color: #1e40af;
            background: #eff6ff;
        }
        .styled-tabview .p-tabview-panels {
            padding: 0;
            background: transparent;
            border: none;
        }
    `}</style>
);
