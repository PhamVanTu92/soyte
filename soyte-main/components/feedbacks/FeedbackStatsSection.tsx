import React from 'react';
import { Chart } from "primereact/chart";
import SatisfactionTrendChart from "@/components/Chart";
import { DashboardStats } from '../../types/DashboardStats';
import SatisfactionComponentChart from '../SatisfactionRadarChart';
import OverviewStats from '../StatsChart';
import SectionStackedChart from '../SectionStackedChart';
import SummaryCards from '../SummaryCards';
import CombinedProgressQualityChart from '../CombinedProgressQualityChart';

interface FeedbackStatsSectionProps {
  type?: string;
  stats: DashboardStats | null;
  loading?: boolean;
  tiendoChartData: any;
  danhgiaChartData: any;
  barChartData: any;
  getPercentValue: (value: number, total: number) => string;
}

const chartOptions = {
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  },
  cutout: '60%',
  maintainAspectRatio: false
};

const barChartOptions = {
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  maintainAspectRatio: false,
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0 } }
  }
};

export const FeedbackStatsSection: React.FC<FeedbackStatsSectionProps> = ({
  type,
  stats,
  loading,
  tiendoChartData,
  danhgiaChartData,
  barChartData,
  getPercentValue
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-5 shadow-sm animate-pulse">
            <div className="mb-4">
              <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-white p-4 h-[280px] flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border-8 border-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      {/* ── CHARTS: REFLECT ──────────────────────────────────── */}
      {type === "reflect" && (
        <>
          <div className="mb-6 bg-none">
            <SummaryCards data={stats} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Chart 1: Doughnut - Tiến độ */}
            <div className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-5 shadow-sm flex flex-col transition-transform md:col-span-1">
              {/* Tiêu đề & Mô tả */}
              <div className="mb-4 flex flex-col justify-center">
                <h3 className="text-[16px] font-semibold text-slate-700">
                  Tiến độ thực hiện
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tỉ lệ đã / đang / chưa hoàn thành
                </p>
              </div>

              {/* Lớp chứa biểu đồ (Lớp trong) */}
              <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm flex flex-col flex-grow">
                <div className="flex-grow w-full relative flex items-center justify-center min-h-[230px]">
                  <Chart
                    type="doughnut"
                    data={tiendoChartData}
                    options={{ ...chartOptions, maintainAspectRatio: false }}
                    className="w-full h-full absolute inset-0 pb-4"
                  />
                </div>

                {/* Thông số phụ */}
                {stats.reflect && (
                  <div className="mt-2 flex justify-around text-center border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-[18px] font-bold text-emerald-600">
                        {stats.reflect.tiendo.daLam}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-1">
                        Đã thực hiện
                      </p>
                    </div>
                    <div className="w-[1px] bg-slate-200 h-10 self-center"></div>
                    <div>
                      <p className="text-[18px] font-bold text-amber-500">
                        {stats.reflect.tiendo.dangLam}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-1">
                        Đang thực hiện
                      </p>
                    </div>
                    <div className="w-[1px] bg-slate-200 h-10 self-center"></div>
                    <div>
                      <p className="text-[18px] font-bold text-red-500">
                        {stats.reflect.tiendo.chuaLam}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-1">
                        Chưa thực hiện
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Chart 2: Doughnut - Đánh giá chất lượng */}
            <div className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-5 shadow-sm flex flex-col transition-transform md:col-span-1">
              {/* Tiêu đề & Mô tả */}
              <div className="mb-4 flex flex-col justify-center">
                <h3 className="text-[16px] font-semibold text-slate-700">
                  Đánh giá chất lượng
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tỉ lệ đạt / không đạt yêu cầu
                </p>
              </div>

              {/* Lớp chứa biểu đồ (Lớp trong) */}
              <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm flex flex-col flex-grow">
                <div className="flex-grow w-full relative flex items-center justify-center min-h-[230px]">
                  <Chart
                    type="doughnut"
                    data={danhgiaChartData}
                    options={{ ...chartOptions, maintainAspectRatio: false }}
                    className="w-full h-full absolute inset-0 pb-4"
                  />
                </div>

                {/* Thông số phụ */}
                {stats.reflect && (
                  <div className="mt-2 flex justify-around text-center border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-[18px] font-bold text-emerald-600">
                        {stats.reflect.danhgia.dat}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-1">
                        Đạt
                      </p>
                    </div>
                    <div className="w-[1px] bg-slate-200 h-10 self-center"></div>
                    <div>
                      <p className="text-[18px] font-bold text-red-500">
                        {stats.reflect.danhgia.khongDat}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-1">
                        Không đạt
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Chart 3: Area Line - Xu hướng phiếu phản ánh (Đã được định dạng đồng bộ để sẵn sàng sử dụng) */}
            {/* <div className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-5 shadow-sm flex flex-col transition-transform md:col-span-2 lg:col-span-2">
            <div className="mb-4 flex flex-col justify-center">
              <h3 className="text-[16px] font-semibold text-slate-700">Xu hướng phiếu phản ánh</h3>
              <p className="text-xs text-slate-500 mt-1">Số phiếu tiếp nhận theo thời gian</p>
            </div>

            <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm flex-grow">
              <div className="h-[320px] w-full relative">
                <Chart
                  type="line"
                  data={{
                    labels: stats.trend.map(t => t.date),
                    datasets: [{
                      label: 'Số phiếu',
                      data: stats.trend.map(t => t.count),
                      fill: true,
                      borderColor: '#6366f1',
                      backgroundColor: 'rgba(99,102,241,0.12)',
                      tension: 0.4,
                      pointRadius: 3,
                      pointBackgroundColor: '#6366f1',
                      pointBorderWidth: 0,
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false } },
                      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f1f5f9' } }
                    }
                  }}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div> */}
            <SectionStackedChart
              title="Phân tích chuyên sâu: Tiến độ thực hiện"
              data={stats?.reflect?.bySection}
              type="tiendo"
            />
            <CombinedProgressQualityChart data={stats?.reflect} rateMode="total" />
          </div>
        </>
      )}

      {/* ── CHARTS: EVALUATE ─────────────────────────────────── */}
      {type === "evaluate" && (
        <>
          <div className="mb-6 bg-none">
            <OverviewStats
              totalVotes={stats.overview?.total || 0}
              satisfactionRate={(stats.overview as any)?.satisfactionRate ?? (((stats.overview?.averageRating ?? 0) / 5) * 100)}
              averageScore={stats.overview?.averageRating || 0}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Chart 1: Horizontal Bar - Phân bố sao đánh giá */}
            <div className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-5 shadow-sm flex flex-col transition-transform md:col-span-1">
              {/* Tiêu đề & Mô tả */}
              <div className="mb-4 flex flex-col justify-center">
                <h3 className="text-[16px] font-semibold text-slate-700">
                  Phân bố mức hài lòng
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Số phiếu theo mức đánh giá sao
                </p>
              </div>

              {/* Lớp chứa biểu đồ (Lớp trong) */}
              <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm flex-grow">
                <div className="h-[320px] w-full">
                  <Chart
                    type="bar"
                    data={barChartData}
                    options={{ ...barChartOptions, maintainAspectRatio: false }}
                    className="h-full w-full"
                  />
                </div>
              </div>
            </div>

            {/* Chart 2: Doughnut - Tổng quan tiếp nhận */}

            {/* Chart 4: Satisfaction Trend */}
            {stats?.summary?.map((item: any, index: number) => (
              <SatisfactionTrendChart
                key={item.id || index}
                categories={stats.categories}
                summaryItem={item}
              />
            ))}
            {stats?.summary?.map((item: any, index: number) => (
              <SatisfactionComponentChart
                key={item.id || index}
                series={item.series}
                title={item.name}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
};
