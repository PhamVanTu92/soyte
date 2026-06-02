import React from "react";
import { Button } from "@/components/prime";
import { formatDateVN } from "@/utils/dateUtils";

interface ReportHeaderProps {
  title: string;
  dateFilter?: { startDate: string; endDate: string };
  loading: boolean;
  disabledExport?: boolean;
  onExportWord: () => void;
  onExportPDF: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  title,
  dateFilter,
  loading,
  disabledExport = false,
  onExportWord,
  onExportPDF,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
          <i className="pi pi-chart-bar text-primary-600 text-xl"></i>
        </div>
        <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
          {title}
          {dateFilter && (
            <>
              {" "}
              <span className="text-primary-700">
                {formatDateVN(dateFilter.startDate)}
              </span>{" "}
              đến ngày{" "}
              <span className="text-primary-700">
                {formatDateVN(dateFilter.endDate)}
              </span>
            </>
          )}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:ml-auto">
        <Button
          label="Xuất Word"
          icon="pi pi-file-word"
          className="bg-gradient-to-br from-blue-500 to-blue-700 border-none rounded-2xl font-bold shadow-lg shadow-blue-200/50 hover:shadow-blue-300/60 hover:scale-105 active:translate-y-0 active:scale-95 transition-all duration-300 text-white px-6 py-2.5 flex items-center gap-2"
          onClick={onExportWord}
          disabled={loading || disabledExport}
          loading={loading}
        />
        <Button
          label="Xuất PDF"
          icon="pi pi-file-pdf"
          className="bg-gradient-to-br from-primary-500 to-primary-700 border-none rounded-2xl font-bold shadow-lg shadow-primary-200/50 hover:shadow-primary-300/60 hover:scale-105 active:translate-y-0 active:scale-95 transition-all duration-300 text-white px-6 py-2.5 flex items-center gap-2"
          onClick={onExportPDF}
          disabled={loading || disabledExport}
          loading={loading}
        />
      </div>
    </div>
  );
};
