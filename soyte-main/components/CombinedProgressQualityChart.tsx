import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type SectionItem = {
  name: string;
  tiendo: {
    daLam: number;
    dangLam: number;
    chuaLam: number;
  };
  danhgia: {
    dat: number;
    khongDat: number;
  };
  total: number;
};

type DashboardData = {
  tiendo: {
    daLam: number;
    dangLam: number;
    chuaLam: number;
  };
  danhgia: {
    dat: number;
    khongDat: number;
  };
  summary: {
    totalContent: number;
    completedProgress: number;
    completedRate: number;
    reachedRate: number;
    needsFix: number;
  };
  bySection: SectionItem[];
};

type Props = {
  data: DashboardData;
  title?: string;
  subtitle?: string;
  rateMode?: "total" | "evaluated";
  height?: number;
};

const COLORS = {
  daLam: "#10B981",
  dangLam: "#F59E0B",
  chuaLam: "#EF4444",
  datRate: "#2563EB",
};

const truncateText = (text: string, max = 22) => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const formatPercent = (value: number) => `${Number(value || 0).toFixed(1)}%`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;

  return (
    <div className="min-w-[260px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <p className="mb-3 text-sm font-semibold text-slate-800">{label}</p>

      <div className="space-y-2 text-sm text-slate-700">
        <div className="flex items-center justify-between gap-4">
          <span>Đã làm</span>
          <span className="font-semibold text-emerald-600">{row.daLam}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span>Đang làm</span>
          <span className="font-semibold text-amber-500">{row.dangLam}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span>Chưa làm</span>
          <span className="font-semibold text-red-500">{row.chuaLam}</span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
          <span>Đạt</span>
          <span className="font-semibold text-slate-900">{row.dat}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span>Không đạt</span>
          <span className="font-semibold text-slate-900">{row.khongDat}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span>Tổng</span>
          <span className="font-semibold text-slate-900">{row.total}</span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
          <span>Tỷ lệ đạt</span>
          <span className="font-semibold text-blue-600">
            {formatPercent(row.datRate)}
          </span>
        </div>
      </div>
    </div>
  );
};

const CombinedProgressQualityChart: React.FC<Props> = ({
  data,
  title = "Tiến độ và chất lượng theo từng nội dung",
  subtitle = "Cột chồng: Đã thực hiện / Đang thực hiện / Chưa thực hiện - Đường line: tỷ lệ đạt",
  rateMode = "total",
  height = 420,
}) => {
  const chartData = useMemo(() => {
    return (data?.bySection || []).map((item) => {
      const daLam = Number(item?.tiendo?.daLam || 0);
      const dangLam = Number(item?.tiendo?.dangLam || 0);
      const chuaLam = Number(item?.tiendo?.chuaLam || 0);
      const dat = Number(item?.danhgia?.dat || 0);
      const khongDat = Number(item?.danhgia?.khongDat || 0);
      const total = Number(item?.total || 0);
      const evaluated = dat + khongDat;

      const datRate =
        rateMode === "evaluated"
          ? evaluated > 0
            ? (dat / evaluated) * 100
            : 0
          : total > 0
            ? (dat / total) * 100
            : 0;

      return {
        name: item.name,
        shortName: truncateText(item.name, 18),
        daLam,
        dangLam,
        chuaLam,
        dat,
        khongDat,
        total,
        datRate: Number(datRate.toFixed(1)),
      };
    });
  }, [data, rateMode]);

  const chartWidth = Math.max(chartData.length * 150, 920);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-[16px] font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-[12px] text-slate-500">{subtitle}</p>
      </div>

      <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-4">
        <div className="overflow-x-auto overflow-y-hidden">
          <div style={{ width: chartWidth, height }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 16, right: 24, left: 8, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  width={48}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12, fill: "#2563EB" }}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: 13,
                    paddingTop: 12,
                  }}
                />

                <Bar
                  yAxisId="left"
                  dataKey="daLam"
                  name="Đã thực hiện"
                  stackId="progress"
                  fill={COLORS.daLam}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={42}
                />
                <Bar
                  yAxisId="left"
                  dataKey="dangLam"
                  name="Đang thực hiện"
                  stackId="progress"
                  fill={COLORS.dangLam}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={42}
                />
                <Bar
                  yAxisId="left"
                  dataKey="chuaLam"
                  name="Chưa thực hiện"
                  stackId="progress"
                  fill={COLORS.chuaLam}
                  radius={[8, 8, 0, 0]}
                  maxBarSize={42}
                />

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="datRate"
                  name={
                    rateMode === "evaluated"
                      ? "Tỷ lệ đạt / đánh giá"
                      : "Tỷ lệ đạt"
                  }
                  stroke={COLORS.datRate}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedProgressQualityChart;
