import AdminLayout from "../components/AdminLayout";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { formService } from "../services/formService";
import { surveyService } from "../services/surveyService";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Toast } from "@/components/prime";
import { Plus, QrCode, Pencil, Copy, FileText, Layers, HelpCircle } from "lucide-react";

const ALLOWED_TYPES = ["evaluate", "reflect"] as const;

const statusOptions = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Hoạt động",         value: "active" },
  { label: "Đang tắt",          value: "inactive" },
];

const TemplatesManagement: React.FC = () => {
  const toast    = useRef<any>(null);
  const navigate = useNavigate();
  const { type } = useParams<{ type?: string }>();

  if (type && !ALLOWED_TYPES.includes(type as any))
    return <Navigate to="/admin" replace />;

  const [templates,    setTemplates]    = useState<any[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 24;

  const [search,       setSearch]       = useState("");
  const [debSearch,    setDebSearch]    = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // QR dialog
  const [qrVisible,  setQrVisible]  = useState(false);
  const [qrForm,     setQrForm]     = useState<any>(null);
  const [qrSurveys,  setQrSurveys]  = useState<any[]>([]);
  const [qrSurvKey,  setQrSurvKey]  = useState<string | null>(null);
  const [qrLoading,  setQrLoading]  = useState(false);

  /* ── Fetch ─────────────────────────────────────────── */
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await formService.fetchForms(page, PAGE_SIZE, type, debSearch || undefined);
      const raw = data?.data ?? data;
      const list  = raw?.items ?? (Array.isArray(raw) ? raw : []);
      const total = raw?.total ?? list.length;
      setTemplates(list);
      setTotalRecords(total);
    } catch {
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Không thể tải danh sách biểu mẫu" });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, [page, type, debSearch]);
  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Stats ─────────────────────────────────────────── */
  const stats = useMemo(() => {
    const active   = templates.filter(t => t.status === "active" || t.status === true).length;
    return { total: totalRecords, active, inactive: totalRecords - active };
  }, [templates, totalRecords]);

  /* ── Filtered (client-side status only) ────────────── */
  const filtered = useMemo(() => {
    if (statusFilter === "all") return templates;
    return templates.filter(t => {
      const isActive = t.status === "active" || t.status === true;
      return statusFilter === "active" ? isActive : !isActive;
    });
  }, [templates, statusFilter]);

  /* ── QR dialog ──────────────────────────────────────── */
  const openQr = async (form: any) => {
    setQrForm(form); setQrSurvKey(null); setQrVisible(true); setQrLoading(true);
    try {
      const data = await surveyService.fetchSurveys(1, 1000, type, true);
      const list = data?.items ?? data ?? [];
      const related = list.filter((s: any) =>
        (s.form_ids || []).some((f: any) => (f.form_id ?? f.id ?? f) === form.id)
      ).map((s: any) => ({ label: s.name, value: s.key ?? s.id }));
      setQrSurveys(related);
      if (related.length > 0) setQrSurvKey(related[0].value);
    } catch { /* ignore */ }
    finally { setQrLoading(false); }
  };

  const confirmQr = () => {
    if (!qrForm) return;
    navigate(`/templates/qr/${qrForm.id}${qrSurvKey ? `?survey_key=${qrSurvKey}` : ""}`);
    setQrVisible(false);
  };

  /* ── Card ───────────────────────────────────────────── */
  const TemplateCard: React.FC<{ t: any }> = ({ t }) => {
    const isActive = t.status === "active" || t.status === true;
    const sectionCount  = t.section_count  ?? t.sections?.length  ?? "—";
    const questionCount = t.question_count ?? "—";
    const likertCount   = t.likert_count   ?? "—";

    return (
      <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden
        ${isActive ? "border-slate-100" : "border-slate-100 opacity-75"}`}>

        {/* Card top accent */}
        <div className={`h-1 ${isActive ? "bg-gradient-to-r from-primary-400 to-primary-600" : "bg-slate-200"}`}/>

        <div className="p-5 flex-1 flex flex-col gap-3">
          {/* Badge + status */}
          <div className="flex items-center justify-between gap-2">
            {t.badge ? (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                {t.badge}
              </span>
            ) : <span/>}
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full
              ${isActive ? "bg-green-50 text-green-600 border border-green-100" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
              {isActive ? "Hoạt động" : "Đang tắt"}
            </span>
          </div>

          {/* Title */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{t.name}</h4>
            {t.org && <p className="text-[11px] text-primary-600 font-semibold mt-0.5">{t.org}</p>}
          </div>

          {/* Description */}
          {t.description && (
            <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2">{t.description}</p>
          )}

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 mt-auto">
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Layers size={11} className="text-primary-400"/> {sectionCount} phần
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <HelpCircle size={11} className="text-primary-400"/> {questionCount} câu hỏi
            </span>
            {typeof likertCount === "number" && likertCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-primary-600 font-semibold">
                ★ {likertCount} Likert
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
          <Button
            icon={<Pencil size={12}/>} label="Sửa"
            onClick={() => navigate(`/admin/templates/edit/${t.id}`)}
            className="!text-xs !py-1.5 !px-3 p-button-outlined border-primary-200 text-primary-700 hover:bg-primary-50 rounded-lg font-semibold flex-1"
          />
          <Button
            icon={<QrCode size={12}/>} label="QR"
            onClick={() => openQr(t)}
            className="!text-xs !py-1.5 !px-3 p-button-outlined border-secondary-200 text-secondary-700 hover:bg-secondary-50 rounded-lg font-semibold flex-1"
          />
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

  return (
    <AdminLayout title="Quản lý biểu mẫu">
      <Toast ref={toast}/>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tổng biểu mẫu", value: stats.total,    icon: "pi-file",        color: "blue" },
          { label: "Hoạt động",     value: stats.active,   icon: "pi-check-circle",color: "green" },
          { label: "Đang tắt",      value: stats.inactive, icon: "pi-eye-slash",   color: "orange" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-${c.color}-50 flex items-center justify-center text-${c.color}-600 flex-shrink-0`}>
              <i className={`pi ${c.icon}`}/>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.label}</p>
              <h3 className="text-2xl font-black text-slate-800 leading-none">{loading ? "…" : c.value}</h3>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-center">
          <Button
            onClick={() => navigate(`/admin/templates/create/${type}`)}
            className="w-full !bg-secondary-600 hover:!bg-secondary-700 border-none text-white font-black py-4 rounded-2xl shadow-xl shadow-secondary-100 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
            <Plus size={20}/> Thêm biểu mẫu
          </Button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3 mb-5 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tìm kiếm</label>
          <div className="relative">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"/>
            <InputText value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 rounded-xl border-slate-200 text-sm"
              placeholder="Tên biểu mẫu…"/>
          </div>
        </div>
        <div className="w-52">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Trạng thái</label>
          <Dropdown value={statusFilter} options={statusOptions}
            onChange={e => setStatusFilter(e.value)}
            className="w-full h-10 rounded-xl border-slate-200 text-sm"/>
        </div>
        <Button label="Đặt lại" icon="pi pi-refresh"
          onClick={() => { setSearch(""); setStatusFilter("all"); }}
          className="h-10 px-4 p-button-outlined border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold"/>
      </div>

      {/* ── Card grid ───────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-52 animate-pulse">
              <div className="h-1 bg-slate-200 rounded-t-2xl"/>
              <div className="p-5 space-y-3">
                <div className="h-3 w-16 bg-slate-200 rounded"/>
                <div className="h-4 w-3/4 bg-slate-200 rounded"/>
                <div className="h-3 w-full bg-slate-100 rounded"/>
                <div className="h-3 w-2/3 bg-slate-100 rounded"/>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30"/>
          <p className="font-semibold">Không tìm thấy biểu mẫu nào</p>
          <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo biểu mẫu mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(t => <TemplateCard key={t.id} t={t}/>)}
          {/* Add-new card */}
          <button
            onClick={() => navigate(`/admin/templates/create/${type}`)}
            className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 py-10 text-slate-400 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all min-h-[180px]">
            <Plus size={32}/>
            <span className="font-semibold text-sm">Tạo biểu mẫu mới</span>
          </button>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button icon="pi pi-chevron-left" onClick={() => setPage(p => Math.max(1, p-1))}
            disabled={page === 1} className="w-9 h-9 p-button-outlined rounded-xl border-slate-200"/>
          <span className="text-sm text-slate-600 font-semibold px-3">
            Trang {page} / {totalPages}
          </span>
          <Button icon="pi pi-chevron-right" onClick={() => setPage(p => Math.min(totalPages, p+1))}
            disabled={page === totalPages} className="w-9 h-9 p-button-outlined rounded-xl border-slate-200"/>
        </div>
      )}

      {/* ── QR Dialog ───────────────────────────────────── */}
      <Dialog header="Sinh mã QR biểu mẫu" visible={qrVisible} onHide={() => setQrVisible(false)}
        style={{ width: "420px" }}
        footer={
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button label="Hủy" className="p-button-text text-slate-500 font-bold" onClick={() => setQrVisible(false)}/>
            <Button label="Tạo mã QR" icon="pi pi-qrcode"
              className="!bg-primary-600 border-none text-white font-bold rounded-xl px-5"
              onClick={confirmQr} disabled={qrSurveys.length > 0 && !qrSurvKey}/>
          </div>
        }>
        <div className="py-3 space-y-4 text-sm">
          <p className="text-slate-500">Mã QR sẽ liên kết với cuộc khảo sát bạn chọn.</p>
          {qrLoading ? (
            <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
              <i className="pi pi-spin pi-spinner"/> Đang tải cuộc khảo sát…
            </div>
          ) : qrSurveys.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 rounded-xl p-3 text-sm flex gap-2">
              <i className="pi pi-exclamation-triangle mt-0.5"/>
              <span>Biểu mẫu chưa nằm trong cuộc khảo sát nào. Vẫn có thể tạo QR dùng chung.</span>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Cuộc khảo sát <span className="text-red-500">*</span>
              </label>
              <Dropdown value={qrSurvKey} options={qrSurveys} onChange={e => setQrSurvKey(e.value)}
                className="w-full rounded-xl border-slate-200"/>
            </div>
          )}
        </div>
      </Dialog>
    </AdminLayout>
  );
};

export default TemplatesManagement;
