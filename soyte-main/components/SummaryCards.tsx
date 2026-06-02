import React from "react";
import {
  ListChecks,
  CircleCheckBig,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

type DashboardData = {
  overview?: {
    total?: number;
    statusCount?: number;
    averageRating?: number;
  };
  reflect?: {
    danhgia?: {
      dat?: number;
      khongDat?: number;
    };
    summary?: {
      totalContent?: number;
      completedProgress?: number;
      completedRate?: number;
      reachedRate?: number;
      needsFix?: number;
    };
  };
};

type SummaryCardsProps = {
  data: DashboardData;
};

type StatCardProps = {
  title: string;
  value: string;
  subText: string;
  icon: React.ReactNode;
  iconWrapClass: string;
};

const StatCard = ({
  title,
  value,
  subText,
  icon,
  iconWrapClass,
}: StatCardProps) => {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[18px] font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-[28px] leading-none font-bold text-slate-900">
            {value}
          </h3>

          <p className="mt-3 text-[16px] leading-5 text-slate-400">{subText}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconWrapClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const formatPercent = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "0%";
  return `${value.toFixed(1)}%`;
};

const formatNumber = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return value.toLocaleString("vi-VN");
};

const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
  const totalVotes = data?.overview?.total ?? 0;
  const totalContent = data?.reflect?.summary?.totalContent ?? 0;
  const completedRate = data?.reflect?.summary?.completedRate ?? 0;
  const completedProgress = data?.reflect?.summary?.completedProgress ?? 0;
  const reachedRate = data?.reflect?.summary?.reachedRate ?? 0;
  const totalPassed = data?.reflect?.danhgia?.dat ?? 0;
  const needsFix = data?.reflect?.summary?.needsFix ?? 0;

  const cards = [
    {
      title: "Tổng số phiếu",
      value: formatNumber(totalVotes),
      subText: `${formatNumber(totalContent)} nội dung cần kiểm tra`,
      icon: <ListChecks className="h-5 w-5 text-slate-600" />,
      iconWrapClass: "bg-slate-100",
    },
    {
      title: "Tiến độ hoàn thành",
      value: formatPercent(completedRate),
      subText: `${formatNumber(completedProgress)}/${formatNumber(totalContent)} nội dung`,
      icon: <CircleCheckBig className="h-5 w-5 text-emerald-600" />,
      iconWrapClass: "bg-emerald-100",
    },
    {
      title: "Tỷ lệ Đạt",
      value: formatPercent(reachedRate),
      subText: `${formatNumber(totalPassed)} nội dung đạt chuẩn`,
      icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
      iconWrapClass: "bg-blue-100",
    },
    {
      title: "Cần khắc phục",
      value: formatNumber(needsFix),
      subText: "Nội dung đánh giá không đạt",
      icon: <ShieldAlert className="h-5 w-5 text-red-600" />,
      iconWrapClass: "bg-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          subText={card.subText}
          icon={card.icon}
          iconWrapClass={card.iconWrapClass}
        />
      ))}
    </div>
  );
};

export default SummaryCards;
