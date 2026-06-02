import React, { useMemo } from "react";

type Props = {
  data: any[];
  type?: "tiendo" | "danhgia";
  title?: string;
  subtitle?: string;
};

const percent = (value: number, total: number) =>
  total ? Number(((value / total) * 100).toFixed(1)) : 0;

const MiniSectionChart: React.FC<Props> = ({
  data,
  type = "tiendo",
  title = "Tiến độ thực hiện",
  subtitle = "Tỉ lệ đã / đang / chưa hoàn thành",
}) => {
  const rows = useMemo(() => {
    return (data || []).map((item) => {
      if (type === "tiendo") {
        const pos = item.tiendo?.daLam ?? 0;
        const mid = item.tiendo?.dangLam ?? 0;
        const neg = item.tiendo?.chuaLam ?? 0;
        const total = item.total ?? pos + mid + neg;

        return {
          name: item.name,
          pos,
          mid,
          neg,
          total,
          posPct: percent(pos, total),
          midPct: percent(mid, total),
          negPct: percent(neg, total),
        };
      }

      const pos = item.danhgia?.dat ?? 0;
      const neg = item.danhgia?.khongDat ?? 0;
      const total = item.total ?? pos + neg;

      return {
        name: item.name,
        pos,
        mid: 0,
        neg,
        total,
        posPct: percent(pos, total),
        midPct: 0,
        negPct: percent(neg, total),
      };
    });
  }, [data, type]);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-[#f8fafc] p-5 shadow-sm">
      {/* title nằm ngoài card chart */}
      <div className="mb-4">
        <h3 className="text-[16px] font-semibold text-slate-800">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-[12px] text-slate-500">{subtitle}</p>
        )}
      </div>

      {/* card chart bên trong */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div
          className={`space-y-4 ${
            rows.length > 9 ? "max-h-[320px] overflow-y-auto pr-2" : ""
          }`}
        >
          {rows.map((row, index) => (
            <div key={index}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <p className="line-clamp-1 text-sm font-medium text-slate-700">
                  {row.name || `Câu ${index + 1}`}
                </p>

                <span className="shrink-0 text-sm font-semibold text-emerald-600">
                  {row.posPct}%
                </span>
              </div>

              <div className="flex h-[8px] w-full overflow-hidden rounded-full bg-slate-100">
                {row.negPct > 0 && (
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${row.negPct}%` }}
                  />
                )}
                {row.midPct > 0 && (
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${row.midPct}%` }}
                  />
                )}
                {row.posPct > 0 && (
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${row.posPct}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Đã thực hiện
            </div>

            {type === "tiendo" && (
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                Đang thực hiện
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Chưa thực hiện
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniSectionChart;