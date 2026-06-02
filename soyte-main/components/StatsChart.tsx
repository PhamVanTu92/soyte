import React from "react";
import {
  Users,
  TrendingUp,
  ClipboardCheck,
} from "lucide-react";

type OverviewStatsProps = {
  totalVotes: number;
  satisfactionRate: number;
  averageScore: number;
  totalGrowthText?: string;
  satisfactionText?: string;
  averageText?: string;
};

const StatCard = ({
  title,
  value,
  subText,
  icon,
  iconWrapClass,
}: {
  title: string;
  value: string;
  subText: string;
  icon: React.ReactNode;
  iconWrapClass: string;
}) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[18px] font-medium text-slate-600">{title}</p>
          <h3 className="mt-2 text-[48px] leading-none font-bold text-slate-900">
            {value}
          </h3>
          <p className="mt-3 text-[18px] text-slate-400">{subText}</p>
        </div>

        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconWrapClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function OverviewStats({
  totalVotes,
  satisfactionRate,
  averageScore,
  totalGrowthText = "Tăng 12% so với tháng trước",
  satisfactionText = "Vượt chỉ tiêu 3.5%",
  averageText = "Thang điểm 5.0",
}: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 ">
      <StatCard
        title="Tổng số phiếu"
        value={totalVotes.toLocaleString("vi-VN")}
        subText={totalGrowthText}
        iconWrapClass="bg-blue-50"
        icon={<Users className="h-7 w-7 text-blue-600" />}
      />

      <StatCard
        title="Tỷ lệ hài lòng"
        value={`${satisfactionRate.toFixed(1)}%`}
        subText={satisfactionText}
        iconWrapClass="bg-emerald-50"
        icon={<TrendingUp className="h-7 w-7 text-emerald-600" />}
      />

      <StatCard
        title="Điểm trung bình"
        value={averageScore.toFixed(2)}
        subText={averageText}
        iconWrapClass="bg-amber-50"
        icon={<ClipboardCheck className="h-7 w-7 text-amber-600" />}
      />
    </div>
  );
}