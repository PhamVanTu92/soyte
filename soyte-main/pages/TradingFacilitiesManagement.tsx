import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Building2,
  Award,
  Sparkles,
  Stethoscope,
  Database,
  Edit3,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import AdminLayout from "../components/AdminLayout";
import { ScrollableTable } from "../components/common/ScrollableTable";
import { PageSizeSelector } from "../components/common/PageSizeSelector";
import { TablePagination } from "../components/common/TablePagination";
import DatasetRecordForm from "../components/DatasetRecordForm";
import { Button, Dropdown } from "@/components/prime";
import {
  datasetsService,
  type Dataset,
  type DatasetRecord,
} from "../services/datasetsService";

const SORT_BY_OPTIONS = [
  { label: "Mã ID", value: "id" },
  { label: "Ngày tạo", value: "created_at" },
  { label: "Ngày cập nhật", value: "updated_at" },
];

const SORT_ORDER_OPTIONS = [
  { label: "Tăng dần", value: "ASC" },
  { label: "Giảm dần", value: "DESC" },
];

const getDatasetIcon = (code: string) => {
  switch (code.toLowerCase()) {
    case "cskcb":
      return Stethoscope;
    case "co_so_lam_dep":
      return Sparkles;
    case "cchn":
      return Award;
    case "ban_le":
    case "ban_buon":
    case "cskdd":
      return Building2;
    default:
      return Database;
  }
};

const getDatasetTone = (code: string) => {
  switch (code.toLowerCase()) {
    case "cskcb":
      return "emerald";
    case "co_so_lam_dep":
      return "sky";
    case "cchn":
      return "violet";
    case "ban_le":
    case "ban_buon":
    case "cskdd":
      return "amber";
    default:
      return "indigo";
  }
};

const TradingFacilitiesManagement = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [records, setRecords] = useState<DatasetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [params, setParams] = useState({
    page: 1,
    limit: 30,
    sort_by: "id" as "id" | "created_at" | "updated_at",
    sort_order: "ASC" as "ASC" | "DESC",
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DatasetRecord | null>(null);
  const toast = useRef<Toast>(null);

  const activeDataset = useMemo(
    () => datasets.find((d) => d.code === selectedCode) || null,
    [datasets, selectedCode]
  );

  const fetchDatasets = async () => {
    setDatasetsLoading(true);
    try {
      const list = await datasetsService.list();
      setDatasets(list);
      if (list.length > 0) {
        // Prefer "ban_le" or "ban_buon" or the first dataset
        const defaultDs =
          list.find((d) => d.code.includes("ban_le") || d.code.includes("ban_buon")) ||
          list[0];
        setSelectedCode(defaultDs.code);
      }
    } catch (error) {
      console.error("Error fetching datasets:", error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách nhóm dữ liệu",
      });
    } finally {
      setDatasetsLoading(false);
    }
  };

  const fetchRecords = useCallback(async () => {
    if (!selectedCode) return;
    setLoading(true);
    try {
      const response = await datasetsService.records(selectedCode, {
        page: params.page,
        limit: params.limit,
        search: debouncedSearchTerm || undefined,
        sort_by: params.sort_by,
        sort_dir: params.sort_order,
      });

      setRecords(response.items);
      if (response.meta.total !== null) {
        // Update local dataset count dynamically
        setDatasets((prev) =>
          prev.map((d) =>
            d.code === selectedCode ? { ...d, total_records: response.meta.total || 0 } : d
          )
        );
      }
    } catch (error) {
      console.error("Error fetching dataset records:", error);
      setRecords([]);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách bản ghi bộ dữ liệu",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCode, params.page, params.limit, params.sort_by, params.sort_order, debouncedSearchTerm]);

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Reset page when search or active dataset changes
  useEffect(() => {
    setParams((current) => ({ ...current, page: 1 }));
  }, [debouncedSearchTerm, selectedCode]);

  const handleQueryParamChange = (
    key: keyof typeof params,
    value: (typeof params)[keyof typeof params]
  ) => {
    setParams((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  const currentRange = useMemo(() => {
    const totalRecords = activeDataset?.total_records || 0;
    if (totalRecords === 0 || records.length === 0) {
      return { from: 0, to: 0 };
    }
    const from = (params.page - 1) * params.limit + 1;
    const to = from + records.length - 1;
    return { from, to };
  }, [records.length, params.limit, params.page, activeDataset]);

  const totalPages = useMemo(() => {
    const totalRecords = activeDataset?.total_records || 0;
    return Math.max(1, Math.ceil(totalRecords / params.limit));
  }, [activeDataset, params.limit]);

  const handleDelete = async (id: number | string) => {
    confirmDialog({
      message: "Bạn có chắc chắn muốn xóa bản ghi này?",
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Xóa",
      rejectLabel: "Hủy",
      acceptClassName:
        "!bg-red-600 !border-red-600 hover:!bg-red-700 hover:!border-red-700 !text-white !font-bold !px-5 !py-2.5 !rounded-lg !text-sm",
      rejectClassName:
        "!bg-white !border !border-gray-300 hover:!bg-gray-50 !text-gray-700 !font-bold !px-5 !py-2.5 !rounded-lg !text-sm",
      accept: async () => {
        try {
          await datasetsService.deleteRecord(selectedCode, id);
          toast.current?.show({
            severity: "success",
            summary: "Thành công",
            detail: "Đã xóa bản ghi thành công",
          });
          await fetchRecords();
        } catch (error) {
          console.error("Delete record error:", error);
          toast.current?.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể xóa bản ghi bộ dữ liệu",
          });
        }
      },
    });
  };

  const renderDynamicCell = (val: any, datatype: string, fieldName: string) => {
    if (val === undefined || val === null || val === "") {
      return <span className="text-gray-400 italic text-xs">Chưa cập nhật</span>;
    }

    const nameLower = fieldName.toLowerCase();
    if (nameLower.includes("trạng thái") || nameLower.includes("tình trạng")) {
      const isAct =
        String(val).toLowerCase().includes("đang hoạt") ||
        String(val).toLowerCase().includes("hoạt động") ||
        String(val).toLowerCase() === "true" ||
        val === true;
      return (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border ${
            isAct
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-rose-50 text-rose-700 border-rose-100"
          }`}
        >
          {String(val)}
        </span>
      );
    }

    if (nameLower.includes("ngày cấp") || nameLower.includes("ngày sinh") || datatype === "date") {
      return <span className="text-xs text-gray-500 font-medium">{String(val)}</span>;
    }

    if (datatype === "number") {
      return (
        <span className="text-xs font-mono font-bold text-gray-700">
          {Number(val).toLocaleString("vi-VN")}
        </span>
      );
    }

    return (
      <span className="text-xs text-gray-700 font-medium line-clamp-2 max-w-[280px]">
        {String(val)}
      </span>
    );
  };

  return (
    <AdminLayout
      title="Quản trị dữ liệu y tế"
      subtitle="Quản trị trực tiếp các nhóm registry dữ liệu ngành y tế và đồng bộ với API"
    >
      <Toast ref={toast} />

      {/* Dataset Grid Cards (Photo 2 premium style) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {datasetsLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[84px] animate-pulse rounded-2xl border border-gray-100 bg-slate-50"
            />
          ))
        ) : datasets.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-gray-400">
            Chưa có nhóm dữ liệu công khai nào được đăng ký.
          </div>
        ) : (
          datasets.map((dataset) => {
            const Icon = getDatasetIcon(dataset.code);
            const tone = getDatasetTone(dataset.code);
            const isActive = selectedCode === dataset.code;

            const toneClass =
              tone === "emerald"
                ? "bg-emerald-50 text-emerald-600"
                : tone === "sky"
                ? "bg-sky-50 text-sky-600"
                : tone === "violet"
                ? "bg-violet-50 text-violet-600"
                : tone === "amber"
                ? "bg-amber-50 text-amber-600"
                : "bg-indigo-50 text-indigo-600";

            return (
              <button
                key={dataset.code}
                onClick={() => setSelectedCode(dataset.code)}
                className={`rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-3.5 ${
                  isActive
                    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-100 ring-offset-2 shadow-md"
                    : "border-gray-100 bg-white hover:border-primary-300"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${toneClass}`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400 line-clamp-1">
                    {dataset.name}
                  </p>
                  <h3
                    className={`mt-0.5 text-base font-black ${
                      isActive ? "text-primary-700" : "text-gray-900"
                    }`}
                  >
                    {(dataset.total_records || 0).toLocaleString("vi-VN")}
                  </h3>
                </div>
              </button>
            );
          })
        )}
      </div>

      {activeDataset && (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
          {/* Filters Panel */}
          <div className="border-b border-gray-100 bg-gray-50/50 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-96">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Tìm kiếm trong ${activeDataset.name.toLowerCase()}...`}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                  <Dropdown
                    value={params.sort_by}
                    options={SORT_BY_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => handleQueryParamChange("sort_by", e.value)}
                    className="w-40"
                  />
                  <Dropdown
                    value={params.sort_order}
                    options={SORT_ORDER_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => handleQueryParamChange("sort_order", e.value)}
                    className="w-36"
                  />
                  <PageSizeSelector
                    value={params.limit}
                    onChange={(size) => handleQueryParamChange("limit", size)}
                  />
                  <Button
                    onClick={() => {
                      setEditingRecord(null);
                      setIsFormOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl !bg-secondary-600 py-2.5 px-5 font-black text-white shadow-xl shadow-secondary-100 hover:!bg-secondary-700 transition"
                  >
                    <Plus size={18} /> THÊM MỚI
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <ScrollableTable>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-black uppercase tracking-widest text-gray-400">
                  {/* Dynamic Headers from Dataset Fields Schema */}
                  {activeDataset.fields.slice(0, 5).map((field) => (
                    <th key={field.name} className="px-6 py-4">
                      {field.name}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={activeDataset.fields.slice(0, 5).length + 1} className="px-6 py-20 text-center">
                      <Loader2
                        size={40}
                        className="mx-auto mb-4 animate-spin text-primary-600"
                      />
                      <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                        Đang tải dữ liệu...
                      </p>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeDataset.fields.slice(0, 5).length + 1}
                      className="px-6 py-20 text-center text-gray-400 text-sm font-medium"
                    >
                      Không tìm thấy bản ghi nào trong nhóm {activeDataset.name}.
                    </td>
                  </tr>
                ) : (
                  records.map((item) => (
                    <tr key={String(item.id)} className="transition-colors hover:bg-gray-50">
                      {/* Dynamic Cells from Dataset Fields Schema */}
                      {activeDataset.fields.slice(0, 5).map((field) => (
                        <td key={field.name} className="px-6 py-4">
                          {renderDynamicCell(item.data?.[field.name], field.datatype, field.name)}
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            icon={<Edit3 size={18} />}
                            text
                            rounded
                            onClick={() => {
                              setEditingRecord(item);
                              setIsFormOpen(true);
                            }}
                          />
                          <Button
                            icon={<Trash2 size={18} />}
                            text
                            rounded
                            severity="danger"
                            onClick={() => handleDelete(item.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollableTable>

          {/* Pagination */}
          <TablePagination
            displayInfo={
              <>
                Hiển thị <span className="font-bold">{currentRange.from}</span>
                {" - "}
                <span className="font-bold">{currentRange.to}</span> trên{" "}
                <span className="font-bold">{activeDataset.total_records || 0}</span> bản ghi
              </>
            }
            pageSize={params.limit}
            onPageSizeChange={(size) => handleQueryParamChange("limit", size)}
            currentPage={params.page}
            totalPages={totalPages}
            onPageChange={(page) => handleQueryParamChange("page", page)}
          />
        </div>
      )}

      {/* Dynamic Form Dialog */}
      {isFormOpen && activeDataset && (
        <DatasetRecordForm
          dataset={activeDataset}
          initialData={editingRecord}
          onClose={() => setIsFormOpen(false)}
          onSave={async () => {
            setIsFormOpen(false);
            await fetchRecords();
          }}
        />
      )}
    </AdminLayout>
  );
};

export default TradingFacilitiesManagement;
