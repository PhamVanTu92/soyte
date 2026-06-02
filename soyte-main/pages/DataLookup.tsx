import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ChevronRight as BreadcrumbChevron,
  Database,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  datasetsService,
  type Dataset,
  type DatasetRecord,
} from "../services/datasetsService";
import PageJumper from "../components/PageJumper";
import {
  getInitialPageFromUrl,
  usePageUrlSync,
} from "../hooks/usePageUrlSync";

const ALL_VALUE = "all";
const PAGE_SIZE = 9;

type SelectedKey = string;

type LookupFilters = {
  selected: SelectedKey;
  license: string;
  keyword: string;
};

const initialFilters: LookupFilters = {
  selected: "",
  license: "",
  keyword: "",
};

const datasetIconByCode: Record<string, LucideIcon> = {
  cskcb: Building2,
  co_so_lam_dep: Sparkles,
  cchn: UserRound,
  ban_le: Store,
};

const getDatasetIcon = (code: string): LucideIcon =>
  datasetIconByCode[code] || Database;

const TITLE_FIELDS = ["Tên cơ sở", "Họ và tên", "Tên"];
const ADDRESS_FIELDS = ["Địa chỉ", "Địa chỉ hành nghề"];
const STATUS_FIELDS = ["Tình trạng"];
const CERTIFICATE_FIELDS = [
  "Số giấy phép",
  "Số GPs",
  "Giấy chứng nhận",
  "Số chứng chỉ",
  "Chứng chỉ hành nghề",
  "Mã số DN/Số GCN ĐKKD",
];
const ISSUE_DATE_FIELDS = ["Ngày cấp", "Ngày cấp GPs"];
const PERSON_FIELDS = ["Người phụ trách", "Họ và tên"];

const findFieldValue = (
  data: Record<string, unknown> | undefined,
  candidates: string[],
): string => {
  if (!data) return "";
  for (const key of candidates) {
    const value = data[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }
  return "";
};

const getStatusStyle = (status: string) => {
  const value = status.toLowerCase();
  if (value.includes("đang hoạt") || value === "hoạt động") {
    return "ring-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value.includes("ngưng") || value.includes("không hoạt")) {
    return "ring-rose-200 bg-rose-50 text-rose-700";
  }
  return "ring-slate-200 bg-slate-100 text-slate-700";
};

const isStatusActive = (status: string) => {
  const value = status.toLowerCase();
  return value.includes("đang hoạt") || value === "hoạt động";
};

const formatValue = (value: unknown, datatype?: string) => {
  if (value === null || value === undefined || value === "") {
    return "Chưa cập nhật";
  }
  if (datatype === "number" && typeof value === "number") {
    return value.toLocaleString("vi-VN");
  }
  return String(value);
};

const FIELDS_HIDDEN_IN_DETAIL = new Set([
  ...TITLE_FIELDS,
  ...ADDRESS_FIELDS,
  ...STATUS_FIELDS,
  "STT",
  "Số TT",
]);

const DataLookup = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [datasetsError, setDatasetsError] = useState("");

  const [draftFilters, setDraftFilters] =
    useState<LookupFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<LookupFilters>(initialFilters);

  const [records, setRecords] = useState<DatasetRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  const [currentPage, setCurrentPage] = useState(getInitialPageFromUrl());
  usePageUrlSync(currentPage);
  const [meta, setMeta] = useState<{
    total: number | null;
    totalPages: number | null;
  }>({ total: null, totalPages: null });

  const activeDataset = useMemo(
    () =>
      datasets.find((dataset) => dataset.code === appliedFilters.selected) ||
      null,
    [datasets, appliedFilters.selected],
  );

  const draftDataset = useMemo(
    () =>
      datasets.find((dataset) => dataset.code === draftFilters.selected) ||
      null,
    [datasets, draftFilters.selected],
  );

  const totalRecordsAll = useMemo(
    () =>
      datasets.reduce(
        (sum, dataset) => sum + (Number(dataset.total_records) || 0),
        0,
      ),
    [datasets],
  );

  const combinedSearch = useMemo(() => {
    const license = appliedFilters.license.trim();
    const keyword = appliedFilters.keyword.trim();
    return [license, keyword].filter(Boolean).join(" ").trim();
  }, [appliedFilters.license, appliedFilters.keyword]);

  useEffect(() => {
    const run = async () => {
      setDatasetsLoading(true);
      setDatasetsError("");
      try {
        const list = await datasetsService.list();
        setDatasets(list);
        if (list.length > 0) {
          setDraftFilters((prev) => ({ ...prev, selected: list[0].code }));
          setAppliedFilters((prev) => ({ ...prev, selected: list[0].code }));
        }
      } catch (err) {
        console.error("Datasets list error:", err);
        setDatasets([]);
        setDatasetsError("Không thể tải danh sách nhóm dữ liệu.");
      } finally {
        setDatasetsLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    if (!appliedFilters.selected) {
      setRecords([]);
      setMeta({ total: null, totalPages: null });
      setRecordsError("");
      setRecordsLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setRecordsLoading(true);
      setRecordsError("");
      try {
        const response = await datasetsService.records(
          String(appliedFilters.selected),
          {
            page: currentPage,
            limit: PAGE_SIZE,
            search: combinedSearch || undefined,
            sort_by: "id",
            sort_dir: "ASC",
          },
        );
        if (cancelled) return;
        setRecords(response.items);
        setMeta({
          total: response.meta.total,
          totalPages: response.meta.totalPages,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Records fetch error:", err);
        setRecords([]);
        setMeta({ total: null, totalPages: null });
        setRecordsError("Không thể tải dữ liệu tra cứu. Vui lòng thử lại sau.");
      } finally {
        if (!cancelled) setRecordsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters.selected, combinedSearch, currentPage]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(1);
    setAppliedFilters({
      selected: draftFilters.selected,
      license: draftFilters.license.trim(),
      keyword: draftFilters.keyword.trim(),
    });
  };

  const handleReset = () => {
    if (datasets.length > 0) {
      const firstCode = datasets[0].code;
      setDraftFilters({ selected: firstCode, license: "", keyword: "" });
      setAppliedFilters({ selected: firstCode, license: "", keyword: "" });
    } else {
      setDraftFilters(initialFilters);
      setAppliedFilters(initialFilters);
    }
    setCurrentPage(1);
  };

  const handlePickDataset = (code: string) => {
    setDraftFilters({ selected: code, license: "", keyword: "" });
    setAppliedFilters({ selected: code, license: "", keyword: "" });
    setCurrentPage(1);
  };

  const totalRecordsForActive =
    meta.total != null
      ? meta.total
      : activeDataset?.total_records ?? records.length;

  const knownTotalPages = meta.totalPages;
  const derivedTotalPages =
    knownTotalPages ??
    (totalRecordsForActive
      ? Math.max(1, Math.ceil(totalRecordsForActive / PAGE_SIZE))
      : null);
  const hasNextPage =
    knownTotalPages != null
      ? currentPage < knownTotalPages
      : records.length === PAGE_SIZE;
  const hasPrevPage = currentPage > 1;

  const datasetCards = useMemo(
    () =>
      datasets.map((dataset) => ({
        value: dataset.code,
        label: dataset.name,
        description: dataset.description,
        icon: getDatasetIcon(dataset.code),
        meta: `${(dataset.total_records || 0).toLocaleString("vi-VN")} bản ghi`,
      })),
    [datasets],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/image/anh2.jpg')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,78,120,0.88),rgba(14,116,144,0.72),rgba(56,189,248,0.42))]" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-blue-950/20 blur-3xl" />

        <div className="relative z-10 container mx-auto px-4 pb-40 pt-10 text-white lg:pb-44 lg:pt-14 xl:pb-52">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/90">
                <Link to="/" className="transition hover:text-white">
                  Trang chủ
                </Link>
                <BreadcrumbChevron size={14} />
                <span className="text-white">Cổng tra cứu thông tin</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-50 backdrop-blur">
                <ShieldCheck size={14} />
                Registry dữ liệu công khai ngành y tế
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
                Cổng tra cứu dữ liệu y tế Hà Nội
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50/90 md:text-lg">
                Tra cứu nhanh các nhóm dữ liệu: cơ sở khám chữa bệnh, chứng chỉ
                hành nghề, cơ sở dịch vụ làm đẹp, cơ sở bán lẻ thuốc và các bộ
                dữ liệu công khai khác.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1 lg:self-end">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
                  Tổng bản ghi
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {datasetsLoading
                    ? "..."
                    : totalRecordsAll.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
                  Nhóm dữ liệu
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {datasetsLoading ? "..." : datasets.length}
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
                  Đang chọn
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {activeDataset
                    ? (activeDataset.total_records || 0).toLocaleString("vi-VN")
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-12 pb-12 lg:-mt-20 xl:-mt-28">
        <div className="container mx-auto px-4">
          <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_28px_80px_-28px_rgba(14,116,144,0.45)] ring-1 ring-sky-100">
            <div className="grid lg:grid-cols-[420px_minmax(0,1fr)]">
              <div className="bg-[linear-gradient(160deg,#0284c7,#0891b2,#1d4ed8)] p-8 text-white lg:p-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-50">
                  <Sparkles size={14} />
                  Tra cứu trực tuyến
                </div>
                <h2 className="mt-6 text-3xl font-black uppercase leading-tight whitespace-nowrap">
                  Thao tác nhanh,
                  <br />
                  Lọc đúng nhu cầu
                </h2>
                <p className="mt-4 text-sm leading-7 text-cyan-50/90">
                  Chọn nhóm dữ liệu, nhập số giấy phép hoặc từ khóa về tên, địa
                  chỉ, người phụ trách để tra cứu nhanh hồ sơ công khai.
                </p>

                <div className="mt-8 space-y-4 rounded-[28px] bg-slate-950/20 p-5 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 text-cyan-100" size={18} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                        Phạm vi
                      </p>
                      <p className="mt-1 text-sm text-white">
                        Tất cả nhóm dữ liệu công khai do Sở Y tế quản lý.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarClock
                      className="mt-0.5 text-cyan-100"
                      size={18}
                    />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                        Tần suất cập nhật
                      </p>
                      <p className="mt-1 text-sm text-white">
                        Đồng bộ theo dữ liệu hiện có từ API quản lý dược.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 text-cyan-100" size={18} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                        Hỗ trợ tra cứu
                      </p>
                      <p className="mt-1 text-lg font-black text-white">
                        02439985765
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <form className="p-6 lg:p-10" onSubmit={handleSearch}>
                {datasetsLoading ? (
                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-[148px] animate-pulse rounded-[24px] border border-slate-200 bg-slate-100/60"
                      />
                    ))}
                  </div>
                ) : datasetsError ? (
                  <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-6 text-sm text-rose-700">
                    {datasetsError}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                    {datasetCards.map((card) => {
                      const Icon = card.icon;
                      const isActive = draftFilters.selected === card.value;
                      return (
                        <button
                          key={card.value}
                          type="button"
                          onClick={() => handlePickDataset(card.value)}
                          className={`rounded-[24px] border px-4 py-4 text-left transition ${
                            isActive
                              ? "border-sky-500 bg-sky-50 shadow-[0_10px_30px_-18px_rgba(14,165,233,0.9)]"
                              : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                              isActive
                                ? "bg-sky-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon size={20} />
                          </div>
                          <p className="mt-4 text-sm font-black text-slate-900">
                            {card.label}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {card.description}
                          </p>
                          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">
                            {card.meta}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 grid items-end gap-4 2xl:grid-cols-[260px_minmax(0,1fr)_180px]">
                  <label className="flex flex-col justify-end">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Số giấy phép / mã hồ sơ
                    </span>
                    <input
                      type="text"
                      value={draftFilters.license}
                      onChange={(event) =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          license: event.target.value,
                        }))
                      }
                      placeholder="Ví dụ: 01-1223/ĐKKDD-HNO"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </label>

                  <label className="flex flex-col justify-end">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Tên cơ sở / từ khóa nội dung
                    </span>
                    <input
                      type="text"
                      value={draftFilters.keyword}
                      onChange={(event) =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          keyword: event.target.value,
                        }))
                      }
                      placeholder="Nhập tên cơ sở, người phụ trách hoặc địa chỉ"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </label>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!draftFilters.selected || recordsLoading}
                      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#df4d43] px-5 text-sm font-black text-white transition hover:bg-[#c93c33] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Search size={18} />
                      Tra cứu
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                  <p>
                    {!draftFilters.selected ? (
                      <>Chọn một nhóm dữ liệu để bắt đầu tra cứu chi tiết.</>
                    ) : (
                      <>
                        Đang tra cứu nhóm{" "}
                        <span className="font-bold text-slate-800">
                          {draftDataset?.name ?? "—"}
                        </span>
                        .
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="font-bold text-sky-700 transition hover:text-sky-900"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto grid gap-6 px-4">
          <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
                  Kết quả tra cứu
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {recordsLoading
                    ? "Đang tải..."
                    : `${totalRecordsForActive.toLocaleString("vi-VN")} bản ghi phù hợp`}
                </h2>
              </div>
              {appliedFilters.selected && (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  Hiển thị trang hiện tại:{" "}
                  <span className="font-black text-slate-900">
                    {recordsLoading ? "..." : records.length.toLocaleString("vi-VN")}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {recordsLoading ? (
                <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                    <Search size={28} className="animate-pulse" />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-slate-900">
                    Đang tải dữ liệu tra cứu
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                    Hệ thống đang đồng bộ bản ghi từ nhóm{" "}
                    <span className="font-bold text-slate-700">
                      {activeDataset?.name ?? ""}
                    </span>
                    .
                  </p>
                </div>
              ) : recordsError ? (
                <div className="rounded-[28px] border border-dashed border-rose-200 bg-white px-6 py-14 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                    <AlertCircle size={28} />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-slate-900">
                    Không thể tải dữ liệu
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                    {recordsError}
                  </p>
                </div>
              ) : records.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-sky-200 bg-white px-6 py-14 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                    <Search size={28} />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-slate-900">
                    Không tìm thấy dữ liệu phù hợp
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                    Hãy thử đổi nhóm dữ liệu, rút gọn từ khóa hoặc nhập đúng số
                    giấy chứng nhận để hệ thống đối sánh lại kết quả.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-700"
                  >
                    Đặt lại bộ lọc
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                records.map((item) => {
                  const title =
                    findFieldValue(item.data, TITLE_FIELDS)
                  const address = findFieldValue(item.data, ADDRESS_FIELDS);
                  const status = findFieldValue(item.data, STATUS_FIELDS);
                  const certificate = findFieldValue(
                    item.data,
                    CERTIFICATE_FIELDS,
                  );
                  const fields = activeDataset?.fields ?? [];
                  const detailFields = fields.filter(
                    (field) => !FIELDS_HIDDEN_IN_DETAIL.has(field.name),
                  );

                  return (
                    <article
                      key={String(item.id)}
                      className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-4 flex flex-wrap items-center gap-3">
                            {activeDataset && (
                              <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-black ring-1 ring-sky-200 text-sky-700">
                                {activeDataset.name}
                              </span>
                            )}
                            {status && (
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusStyle(
                                  status,
                                )}`}
                              >
                                {status}
                              </span>
                            )}
                            {certificate && (
                              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                Mã: {certificate}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-black leading-tight text-slate-950">
                            {title}
                          </h3>
                          {address && (
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                              {address}
                            </p>
                          )}

                          {detailFields.length > 0 && (
                            <div className="mt-5 grid gap-3 text-sm text-slate-500 md:grid-cols-2 xl:grid-cols-3">
                              {detailFields.slice(0, 6).map((field) => (
                                <div
                                  key={field.name}
                                  className="rounded-2xl bg-slate-50 px-4 py-3"
                                >
                                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                    {field.name}
                                  </p>
                                  <p className="mt-1 font-bold text-slate-700 break-words">
                                    {formatValue(
                                      item.data?.[field.name],
                                      field.datatype,
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-col gap-3 lg:w-[240px]">
                          {address && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                              <div className="flex items-center gap-2 font-bold text-slate-700">
                                <MapPin size={16} />
                                Địa chỉ công khai
                              </div>
                              <p className="mt-2 text-xs leading-6">
                                {address}
                              </p>
                            </div>
                          )}
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                              Thông tin
                            </p>
                            {findFieldValue(item.data, PERSON_FIELDS) && (
                              <p className="mt-2 font-bold text-slate-700">
                                {findFieldValue(item.data, PERSON_FIELDS)}
                              </p>
                            )}
                            {findFieldValue(item.data, ISSUE_DATE_FIELDS) && (
                              <p className="mt-2 text-xs leading-6 text-slate-500">
                                Ngày cấp:{" "}
                                {findFieldValue(item.data, ISSUE_DATE_FIELDS)}
                              </p>
                            )}
                            {status && isStatusActive(status) && (
                              <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                                <ShieldCheck size={14} />
                                Đang hoạt động
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {appliedFilters.selected !== ALL_VALUE &&
              !recordsLoading &&
              !recordsError &&
              records.length > 0 &&
              (hasPrevPage || hasNextPage) && (
                <div className="mt-6 flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    Trang{" "}
                    <span className="font-black text-slate-900">
                      {currentPage}
                    </span>
                    {knownTotalPages != null && (
                      <>
                        {" / "}
                        <span className="font-black text-slate-900">
                          {knownTotalPages}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {derivedTotalPages != null && derivedTotalPages > 1 && (
                      <PageJumper
                        currentPage={currentPage}
                        totalPages={derivedTotalPages}
                        onPageChange={setCurrentPage}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }
                        disabled={!hasPrevPage}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeft size={16} />
                        Trước
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => page + 1)}
                        disabled={!hasNextPage}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Sau
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>

        </div>
      </section>
    </div>
  );
};

export default DataLookup;
