import React from "react";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { formatDateVN } from "../../utils/dateUtils";
import { FacilityFilterDropdown } from "../feedbacks/FacilityFilterDropdown";

interface ReportFiltersProps {
  filterType: string;
  handleFilterChange: (type: string) => void;
  dateFilter: { startDate: string; endDate: string };
  handleCustomDateChange: (
    date: Date | null,
    field: "startDate" | "endDate",
  ) => void;
  reportHeader?: React.ReactNode;
  surveys?: any[];
  selectedSurveyKeys?: string[]; // for multi
  selectedSurveyKey?: string; // for single
  onSurveyChange?: (val: any) => void;
  isMulti?: boolean;
  showDateFilter?: boolean;
  selectedUnits?: string[];
  onUnitChange?: (ids: string[]) => void;
  facilityType?: string;
}

const filterOptions = [
  { label: "Tháng này", value: "this_month" },
  { label: "Tháng trước", value: "last_month" },
  { label: "12 tháng", value: "this_year" },
  { label: "6 tháng đầu năm", value: "first_half" },
  { label: "6 tháng cuối năm", value: "second_half" },
  { label: "Tùy chọn", value: "custom" },
];

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filterType,
  handleFilterChange,
  dateFilter,
  handleCustomDateChange,
  reportHeader,
  surveys = [],
  selectedSurveyKeys,
  selectedSurveyKey,
  onSurveyChange,
  isMulti = true,
  showDateFilter = true,
  selectedUnits,
  onUnitChange,
  facilityType,
}) => {
  const surveyOptions = [
    ...(isMulti ? [] : [{ label: "Tất cả cuộc khảo sát", value: "" }]),
    ...surveys.map((s) => ({
      label: s.name,
      value: String(s.key || s.id || ""),
    })),
  ];

  return (
    <div className="flex flex-col gap-6 mb-8 bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100/80 transition-all hover:shadow-2xl hover:shadow-slate-300/40">
      {reportHeader && (
        <>
          <div className="w-full overflow-hidden">{reportHeader}</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-60" />
        </>
      )}

      <div className="flex flex-wrap items-center justify-end gap-4">
        {onUnitChange && (
          <div className="w-full md:w-[320px]">
            <FacilityFilterDropdown
              value={selectedUnits || []}
              onChange={onUnitChange}
              placeholder="Lọc theo đơn vị"
              type={facilityType}
              className="w-full h-[52px] flex items-center rounded-2xl border border-slate-200 font-medium text-slate-700 bg-slate-50/50 hover:bg-white hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
            />
          </div>
        )}

        {onSurveyChange &&
          (isMulti ? (
            <div className="w-full md:w-[350px]">
              <MultiSelect
                value={selectedSurveyKeys}
                options={surveyOptions}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => onSurveyChange(e.value)}
                className="w-full h-[52px] flex items-center rounded-2xl border border-slate-200 font-medium text-slate-700 bg-slate-50/50 hover:bg-white hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
                panelClassName="survey-ms-panel"
                placeholder="Chọn cuộc khảo sát"
                filter
                maxSelectedLabels={3}
              />
            </div>
          ) : (
            <div className="w-full md:w-[300px]">
              <Dropdown
                value={selectedSurveyKey}
                options={surveyOptions}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => onSurveyChange(e.value)}
                className="w-full h-[52px] flex items-center rounded-2xl border border-slate-200 font-medium text-slate-700 bg-slate-50/50 hover:bg-white hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
                placeholder="Chọn cuộc khảo sát"
                filter
              />
            </div>
          ))}

        {showDateFilter && (
          <>
            <div className="w-full md:w-auto">
              <Dropdown
                value={filterType}
                options={filterOptions}
                onChange={(e) => handleFilterChange(e.value)}
                className="w-full md:w-[220px] h-[52px] flex items-center rounded-2xl border border-slate-200 font-medium text-slate-700 bg-slate-50/50 hover:bg-white hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
                placeholder="Chọn khoảng thời gian"
              />
            </div>

            {filterType !== "custom" && (
              <div className="flex items-center gap-3 px-5 h-[52px] bg-primary-50/30 rounded-2xl border border-primary-100/50 text-primary-900 shadow-inner">
                <i className="pi pi-calendar-plus text-primary-600 font-bold"></i>
                <span className="text-sm font-bold tracking-tight">
                  {formatDateVN(dateFilter.startDate)} —{" "}
                  {formatDateVN(dateFilter.endDate)}
                </span>
              </div>
            )}

            {filterType === "custom" && (
              <div className="flex flex-wrap items-center gap-4 p-1 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Từ</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden hover:border-primary-400 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all w-[180px] h-[52px] flex items-center shadow-sm">
                    <Calendar
                      value={dateFilter.startDate ? new Date(dateFilter.startDate) : null}
                      onChange={(e) => handleCustomDateChange(e.value as Date, "startDate")}
                      className="w-full"
                      inputClassName="w-full h-[52px] border-none bg-transparent px-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none cursor-pointer"
                      dateFormat="dd/mm/yy"
                      placeholder="Ngày bắt đầu"
                      showIcon
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đến</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden hover:border-primary-400 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all w-[180px] h-[52px] flex items-center shadow-sm">
                    <Calendar
                      value={dateFilter.endDate ? new Date(dateFilter.endDate) : null}
                      onChange={(e) => handleCustomDateChange(e.value as Date, "endDate")}
                      className="w-full"
                      inputClassName="w-full h-[52px] border-none bg-transparent px-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none cursor-pointer"
                      dateFormat="dd/mm/yy"
                      placeholder="Ngày kết thúc"
                      showIcon
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
