import React, { useEffect, useState, useMemo } from "react";
import { surveyNewService } from "@/services/surveyNewService";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

interface FacilityStatus {
  facility_id: string;
  name: string;
  category: string;
  address: string;
  submitted: boolean;
  feedback_count: number;
}

interface Props {
  surveyId: number | string;
  surveyName?: string;
}

const FacilityStatusCard: React.FC<Props> = ({ surveyId, surveyName }) => {
  const [data, setData] = useState<FacilityStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "submitted" | "pending">("all");

  useEffect(() => {
    if (!surveyId) return;
    setLoading(true);
    surveyNewService
      .getSurveyFacilityStatus(surveyId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [surveyId]);

  const stats = useMemo(() => {
    const total = data.length;
    const submitted = data.filter((d) => d.submitted).length;
    const pending = total - submitted;
    const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
    return { total, submitted, pending, pct };
  }, [data]);

  const filtered = useMemo(() => {
    if (filter === "submitted") return data.filter((d) => d.submitted);
    if (filter === "pending") return data.filter((d) => !d.submitted);
    return data;
  }, [data, filter]);

  const statusTemplate = (row: FacilityStatus) =>
    row.submitted ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-100">
        <i className="pi pi-check-circle text-xs" /> Đã nộp ({row.feedback_count})
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-100">
        <i className="pi pi-clock text-xs" /> Chưa nộp
      </span>
    );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-primary-800">
            Tình trạng nộp phiếu theo cơ sở
          </h3>
          {surveyName && (
            <p className="text-xs text-slate-400 mt-0.5">{surveyName}</p>
          )}
        </div>

        {/* Progress */}
        {!loading && stats.total > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">
                <span className="font-bold text-green-600">{stats.submitted}</span>
                /{stats.total} cơ sở đã nộp
              </p>
              <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-black text-primary-700">{stats.pct}%</span>
          </div>
        )}
      </div>

      {/* Stat chips */}
      {!loading && stats.total > 0 && (
        <div className="flex gap-2 px-6 pt-4 pb-2 flex-wrap">
          {(
            [
              { key: "all", label: `Tất cả (${stats.total})`, color: "bg-slate-100 text-slate-600" },
              { key: "submitted", label: `Đã nộp (${stats.submitted})`, color: "bg-green-50 text-green-700 border border-green-100" },
              { key: "pending", label: `Chưa nộp (${stats.pending})`, color: "bg-orange-50 text-orange-600 border border-orange-100" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${opt.color} ${
                filter === opt.key ? "ring-2 ring-offset-1 ring-primary-400" : "opacity-70 hover:opacity-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="px-6 pb-4">
        <DataTable
          value={filtered}
          loading={loading}
          emptyMessage={
            loading
              ? "Đang tải..."
              : stats.total === 0
              ? "Cuộc khảo sát chưa gán cơ sở nào."
              : "Không có kết quả."
          }
          scrollable
          scrollHeight="380px"
          tableStyle={{ minWidth: "40rem" }}
          size="small"
          className="text-sm"
          rowClassName={(row: FacilityStatus) =>
            row.submitted
              ? "bg-green-50/30"
              : "bg-orange-50/20"
          }
        >
          <Column
            header="STT"
            body={(_row, opts) => opts.rowIndex + 1}
            style={{ width: "3.5rem" }}
          />
          <Column
            field="name"
            header="Tên cơ sở"
            style={{ minWidth: "14rem" }}
            body={(row: FacilityStatus) => (
              <span className="font-medium text-slate-700">{row.name}</span>
            )}
          />
          <Column
            field="category"
            header="Phân loại"
            style={{ width: "10rem" }}
            body={(row) => (
              <span className="text-xs text-slate-500">{row.category || "—"}</span>
            )}
          />
          <Column
            field="address"
            header="Địa chỉ"
            style={{ minWidth: "14rem" }}
            body={(row) => (
              <span className="text-xs text-slate-500">{row.address || "—"}</span>
            )}
          />
          <Column
            header="Trạng thái"
            body={statusTemplate}
            style={{ width: "10rem" }}
          />
        </DataTable>
      </div>
    </div>
  );
};

export default FacilityStatusCard;
