import React, { useMemo } from "react";
import { Chart } from "primereact/chart";

type SeriesItem = {
  name: string;
  data: number[];
};

type SummaryItem = {
  id: number;
  name: string;
  series: SeriesItem[];
};

type Props = {
  categories: string[];
  summaryItem: SummaryItem;
};

const SatisfactionTrendChart: React.FC<Props> = ({
  categories,
  summaryItem,
}) => {
  const chartData = useMemo(() => {
    const palette = [
      "#25A7C8",
      "#F59E0B",
      "#10B981",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#F97316",
      "#6366F1",
      "#14B8A6",
      "#84CC16",
    ];

    return {
      labels: categories,
      datasets: (summaryItem?.series || []).map((item, index) => {
        const color = palette[index % palette.length];

        return {
          label: item.name,
          data: item.data,
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          pointBorderColor: color,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: color,
          pointRadius: 2.5,
          pointHoverRadius: 3.5,
          pointBorderWidth: 0,
          borderWidth: 2,
          tension: 0.25,
          fill: false,
        };
      }),
    };
  }, [categories, summaryItem]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 8,
          right: 8,
          bottom: 0,
          left: 8,
        },
      },
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      plugins: {
        title: {
          display: false,
        },
        legend: {
          position: "bottom" as const,
          align: "start" as const,
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 8,
            boxHeight: 8,
            padding: 18,
            color: "#6B7280",
            font: {
              size: 12,
              family: "Inter, sans-serif",
            },
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: "#FFFFFF",
          titleColor: "#6B7280",
          bodyColor: "#111827",
          borderColor: "#25A7C8",
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            title(items: any[]) {
              return items?.[0]?.label || "";
            },
            label(context: any) {
              return `${context.dataset.label}: ${Number(
                context.parsed.y
              ).toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        x: {
          offset: false,
          grid: {
            color: "#E5E7EB",
            drawBorder: false,
            drawTicks: false,
          },
          ticks: {
            color: "#9CA3AF",
            autoSkip: true,
            maxTicksLimit: 12,
            maxRotation: 45,
            minRotation: 45,
            padding: 8,
            font: {
              size: 11,
              family: "Inter, sans-serif",
            },
          },
        },
        y: {
          min: 0,
          max: 5,
          ticks: {
            stepSize: 0.5,
            color: "#4B5563",
            padding: 8,
            callback(value: number) {
              return Number(value).toFixed(1);
            },
            font: {
              size: 11,
              family: "Inter, sans-serif",
            },
          },
          grid: {
            color: "#D1D5DB",
            drawBorder: false,
          },
        },
      },
    };
  }, []);

  return (
  <div className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-5 shadow-sm">
    <div className="mb-4">
      <h3 className="text-[16px] font-semibold text-slate-700">
        {summaryItem?.name || "Biểu đồ"}
      </h3>
    </div>

    <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="h-[360px] w-full [&_.p-chart]:h-full [&_.p-chart]:w-full [&_canvas]:h-full [&_canvas]:w-full">
        <Chart
          type="line"
          data={chartData}
          options={options}
          className="h-full w-full"
        />
      </div>
    </div>
  </div>
);
};

export default SatisfactionTrendChart;