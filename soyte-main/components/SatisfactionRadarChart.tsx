import React, { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

type SeriesItem = {
  name: string;
  data: number[];
};

type SatisfactionComponentChartProps = {
  series: SeriesItem[];
  title?: string;
  maxValue?: number;
  hideOverall?: boolean;
};

type ChartItem = {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
};

const SHORT_LABEL_MAP: Record<string, string> = {
  "Khả năng tiếp cận": "Khả năng tiếp cận",
  "Sự minh bạch thông tin và thủ tục khám bệnh, điều trị":
    "Minh bạch TT & Thủ tục",
  "Cơ sở vật chất và phương tiện phục vụ người bệnh": "Cơ sở vật chất",
  "Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế":
    "Thái độ & NL NV y tế",
  "Kết quả cung cấp dịch vụ": "KQ cung cấp DV",
};

function getItemKey(index: number) {
  return String.fromCharCode(65 + index);
}

function getAverageIncludingZero(arr: number[] = []) {
  if (!arr.length) return 0;

  const sum = arr.reduce((total, value) => total + Number(value || 0), 0);
  return sum / arr.length;
}

const SatisfactionComponentChart: React.FC<SatisfactionComponentChartProps> = ({
  series,
  title = "Chỉ số hài lòng theo thành phần",
  maxValue = 5,
  hideOverall = true,
}) => {
  const chartItems = useMemo(() => {
    const filteredSeries = (series || []).filter((item) => {
      if (!hideOverall) return true;
      return item.name !== "Điểm hài lòng chung";
    });

    return filteredSeries.map((item, index) => ({
      key: getItemKey(index),
      label: item.name,
      shortLabel: SHORT_LABEL_MAP[item.name] || item.name,
      value: getAverageIncludingZero(item.data || []),
    }));
  }, [series, hideOverall]);

  const radarData = useMemo(() => {
    return chartItems.map((item) => ({
      subject: item.shortLabel,
      value: Number(item.value.toFixed(2)),
      fullMark: maxValue,
    }));
  }, [chartItems, maxValue]);

  if (!chartItems.length) {
    return (
      <div className="w-full rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <div className="mt-4 text-sm text-slate-500">
          Không có dữ liệu để hiển thị.
        </div>
      </div>
    );
  }

  return (
  <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 shadow-sm p-5">
    {/* TITLE OUTSIDE */}
    <div className="mb-4">
      <h3 className="text-[16px] font-semibold text-slate-700">{title}</h3>
      {/* nếu có subtitle thì thêm ở đây */}
      {/* <p className="text-sm text-slate-500">Mô tả thêm</p> */}
    </div>

    {/* CARD */}
    <div className="w-full rounded-2xl bg-white p-6 shadow-sm">
      {/* legend */}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
        {chartItems.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>{item.key}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
        {/* RADAR */}
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid gridType="polygon" stroke="#d7dee8" />

              <PolarAngleAxis
                dataKey="subject"
                tick={{
                  fill: "#667085",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              />

              <PolarRadiusAxis
                angle={30}
                domain={[0, maxValue]}
                tickCount={6}
                axisLine={false}
                tick={{
                  fill: "#98A2B3",
                  fontSize: 12,
                }}
              />

              <Radar
                dataKey="value"
                stroke="#2EA8E6"
                fill="#56BDF0"
                fillOpacity={0.65}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* LIST */}
        <div className="flex flex-col justify-center gap-5">
          {chartItems.map((item) => {
            const percent = Math.max(
              0,
              Math.min((item.value / maxValue) * 100, 100),
            );

            return (
              <div key={item.key}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="pr-3 text-[16px] font-semibold leading-6 text-slate-800">
                    <span className="text-emerald-600">{item.key}. </span>
                    {item.label}
                  </div>

                  <div className="shrink-0 whitespace-nowrap text-[18px] font-bold text-slate-900">
                    {item.value.toFixed(2)}/{maxValue.toFixed(1)}
                  </div>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
};

export default SatisfactionComponentChart;