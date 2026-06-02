import AdminLayout from "../components/AdminLayout";
import React, { useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Toast } from "@/components/prime";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import {
  useFormBuilder, LIKERT_OPTIONS, QuestionType,
  FSection, FQuestion,
} from "../hooks/useFormBuilder";
import {
  ChevronDown, ChevronRight, Trash2, Plus, ArrowUp,
  ArrowDown, GripVertical, Copy, Eye, EyeOff,
} from "lucide-react";

const ALLOWED_TYPES = ["evaluate", "reflect"] as const;

const Q_TYPES: { value: QuestionType; label: string }[] = [
  { value: "likert",   label: "Likert (thang 0–5)" },
  { value: "single",   label: "Single (1 lựa chọn)" },
  { value: "multi",    label: "Multi (nhiều lựa chọn)" },
  { value: "text",     label: "Text (văn bản ngắn)" },
  { value: "textarea", label: "Textarea (văn bản dài)" },
  { value: "number",   label: "Number (số)" },
  { value: "date",     label: "Date (ngày tháng)" },
];

const Q_TYPE_COLOR: Record<QuestionType, string> = {
  likert:   "bg-primary-50 text-primary-700 border-primary-200",
  single:   "bg-sky-50 text-sky-700 border-sky-200",
  multi:    "bg-violet-50 text-violet-700 border-violet-200",
  text:     "bg-slate-50 text-slate-600 border-slate-200",
  textarea: "bg-slate-50 text-slate-600 border-slate-200",
  number:   "bg-amber-50 text-amber-700 border-amber-200",
  date:     "bg-green-50 text-green-700 border-green-200",
};

/* ── Question preview ────────────────────────────────────────────── */
const QuestionPreview: React.FC<{ q: FQuestion }> = ({ q }) => {
  if (q.type === "likert") return (
    <div className="flex flex-wrap gap-1 mt-2">
      {q.options.map(o => (
        <div key={o.id} className={`flex-1 min-w-[48px] text-center p-1.5 border rounded text-[10px] leading-tight
          ${o.option_key === "0" ? "border-slate-200 bg-slate-50 text-slate-400" : "border-primary-100 bg-primary-50 text-primary-600"}`}>
          <div className="font-bold text-sm">{o.option_key}</div>
          <div className="truncate">{o.label}</div>
        </div>
      ))}
    </div>
  );
  if (q.type === "single" || q.type === "multi") return (
    <div className="flex flex-col gap-1 mt-2">
      {q.options.map(o => (
        <div key={o.id} className="flex items-center gap-2 text-xs text-slate-500">
          <span className={`w-3.5 h-3.5 border border-slate-300 rounded-${q.type === "single" ? "full" : "sm"} flex-shrink-0`}/>
          {o.label || <em className="opacity-40">Tùy chọn</em>}
        </div>
      ))}
    </div>
  );
  const placeholders: Partial<Record<QuestionType, string>> = {
    text: "Nhập văn bản...", textarea: "Nhập nội dung...",
    number: "0", date: "dd/mm/yyyy",
  };
  return (
    <div className="mt-2 h-8 rounded border border-slate-200 bg-slate-50 px-3 flex items-center text-xs text-slate-400">
      {placeholders[q.type] ?? ""}
    </div>
  );
};

/* ── Question block ─────────────────────────────────────────────── */
const QuestionBlock: React.FC<{
  sec: FSection; q: FQuestion; qi: number; qTotal: number;
  onUpdate: (f: keyof FQuestion, v: any) => void;
  onRemove: () => void;
  onMove: (d: -1|1) => void;
  onAddOpt: () => void;
  onUpdateOpt: (oid: string, f: "label"|"option_key", v: string) => void;
  onRemoveOpt: (oid: string) => void;
}> = ({ q, qi, qTotal, onUpdate, onRemove, onMove, onAddOpt, onUpdateOpt, onRemoveOpt }) => {
  const [open, setOpen] = useState(true);
  const hasOpts = q.type === "single" || q.type === "multi";
  const isLikert = q.type === "likert";

  return (
    <div className="border border-slate-200 rounded-xl bg-white mb-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
        <GripVertical size={14} className="text-slate-300 cursor-grab flex-shrink-0"/>
        <span className="font-mono text-[11px] text-slate-400 flex-shrink-0">{qi + 1}.</span>
        <button onClick={() => setOpen(o => !o)} className="flex-1 text-left">
          <span className="text-sm font-medium text-slate-700 line-clamp-1">
            {q.label || <em className="text-slate-400 font-normal">Câu hỏi chưa đặt tên</em>}
          </span>
        </button>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${Q_TYPE_COLOR[q.type]}`}>
          {Q_TYPES.find(t => t.value === q.type)?.label.split(" ")[0]}
        </span>
        <div className="flex gap-0.5 flex-shrink-0">
          <button onClick={() => onMove(-1)} disabled={qi === 0}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"><ArrowUp size={12}/></button>
          <button onClick={() => onMove(1)} disabled={qi === qTotal - 1}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"><ArrowDown size={12}/></button>
          <button onClick={onRemove}
            className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 size={12}/></button>
          <button onClick={() => setOpen(o => !o)} className="p-1 rounded hover:bg-slate-200">
            {open ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 py-3 space-y-3">
          {/* Key + Type row */}
          <div className="flex gap-3">
            <div className="w-28 flex-shrink-0">
              <label className="label-xs">Mã câu hỏi</label>
              <InputText value={q.question_key}
                onChange={e => onUpdate("question_key", e.target.value)}
                className="w-full h-9 text-sm rounded-lg border-slate-200 font-mono"
                placeholder="A1, B2…"/>
            </div>
            <div className="flex-1">
              <label className="label-xs">Loại câu hỏi</label>
              <Dropdown value={q.type} options={Q_TYPES}
                onChange={e => onUpdate("type", e.value)}
                className="w-full h-9 text-sm rounded-lg border-slate-200"/>
            </div>
            <div className="flex items-end pb-1 gap-2 flex-shrink-0">
              <label className="label-xs hidden sm:block">Bắt buộc</label>
              <InputSwitch checked={q.required} onChange={e => onUpdate("required", e.value)} className="scale-75"/>
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="label-xs">Nội dung câu hỏi</label>
            <InputTextarea value={q.label} rows={2} autoResize
              onChange={e => onUpdate("label", e.target.value)}
              className="w-full text-sm rounded-lg border-slate-200"
              placeholder="Nhập nội dung câu hỏi..."/>
          </div>

          {/* Options */}
          {isLikert && (
            <div className="text-[11px] text-slate-400 italic">
              Likert dùng thang điểm mặc định 0–5 (Rất không hài lòng → Rất hài lòng).
            </div>
          )}
          {hasOpts && (
            <div>
              <label className="label-xs">Các tùy chọn</label>
              <div className="space-y-1.5">
                {q.options.map((o, oi) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <span className={`w-4 h-4 border border-slate-300 rounded-${q.type==="single"?"full":"sm"} flex-shrink-0`}/>
                    <InputText value={o.label}
                      onChange={e => onUpdateOpt(o.id, "label", e.target.value)}
                      className="flex-1 h-8 text-sm rounded-lg border-slate-200"
                      placeholder={`Tùy chọn ${oi + 1}`}/>
                    <button onClick={() => onRemoveOpt(o.id)}
                      className="text-slate-300 hover:text-red-400 flex-shrink-0"><Trash2 size={12}/></button>
                  </div>
                ))}
                <button onClick={onAddOpt}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1 mt-1">
                  <Plus size={12}/> Thêm tùy chọn
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          <details className="group">
            <summary className="text-[11px] text-slate-400 cursor-pointer select-none list-none flex items-center gap-1 hover:text-slate-600">
              <Eye size={11}/> Xem trước
            </summary>
            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <QuestionPreview q={q}/>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

/* ── Section block ──────────────────────────────────────────────── */
const SectionBlock: React.FC<{
  sec: FSection; si: number; total: number;
  onUpdate: (f: "title", v: string) => void;
  onRemove: () => void;
  onMove: (d: -1|1) => void;
  onAddQ: () => void;
  onUpdateQ: (qid: string, f: keyof FQuestion, v: any) => void;
  onRemoveQ: (qid: string) => void;
  onMoveQ: (qid: string, d: -1|1) => void;
  onAddOpt: (qid: string) => void;
  onUpdateOpt: (qid: string, oid: string, f: "label"|"option_key", v: string) => void;
  onRemoveOpt: (qid: string, oid: string) => void;
}> = ({ sec, si, total, onUpdate, onRemove, onMove, onAddQ,
        onUpdateQ, onRemoveQ, onMoveQ, onAddOpt, onUpdateOpt, onRemoveOpt }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-primary-100 rounded-2xl overflow-hidden mb-4">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white">
        <GripVertical size={14} className="opacity-60 cursor-grab flex-shrink-0"/>
        <input
          value={sec.title}
          onChange={e => onUpdate("title", e.target.value)}
          className="flex-1 bg-transparent font-semibold text-sm placeholder-white/60 outline-none border-none min-w-0"
          placeholder="Tên phần (Section)…"
        />
        <span className="text-[11px] font-mono opacity-60 flex-shrink-0">{sec.questions.length} câu</span>
        <div className="flex gap-0.5 flex-shrink-0">
          <button onClick={() => onMove(-1)} disabled={si === 0}
            className="p-1 rounded hover:bg-white/20 disabled:opacity-30"><ArrowUp size={13}/></button>
          <button onClick={() => onMove(1)} disabled={si === total - 1}
            className="p-1 rounded hover:bg-white/20 disabled:opacity-30"><ArrowDown size={13}/></button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-500/80"><Trash2 size={13}/></button>
          <button onClick={() => setOpen(o => !o)} className="p-1 rounded hover:bg-white/20">
            {open ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 py-3 bg-slate-50/50">
          {sec.questions.length === 0 && (
            <p className="text-sm text-slate-400 italic text-center py-4">Chưa có câu hỏi. Nhấn nút bên dưới để thêm.</p>
          )}
          {sec.questions.map((q, qi) => (
            <QuestionBlock key={q.id} sec={sec} q={q} qi={qi} qTotal={sec.questions.length}
              onUpdate={(f, v)  => onUpdateQ(q.id, f, v)}
              onRemove={()      => onRemoveQ(q.id)}
              onMove={(d)       => onMoveQ(q.id, d)}
              onAddOpt={()      => onAddOpt(q.id)}
              onUpdateOpt={(oid,f,v) => onUpdateOpt(q.id, oid, f, v)}
              onRemoveOpt={(oid)     => onRemoveOpt(q.id, oid)}
            />
          ))}
          <button onClick={onAddQ}
            className="w-full py-2 border-2 border-dashed border-primary-200 rounded-xl text-sm text-primary-600 hover:bg-primary-50 hover:border-primary-400 transition-all flex items-center justify-center gap-1 mt-1">
            <Plus size={14}/> Thêm câu hỏi
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────────── */
const TemplateCreate: React.FC = () => {
  const { id, type } = useParams<{ id?: string; type?: string }>();
  const toast = useRef<any>(null);

  if (type && !ALLOWED_TYPES.includes(type as any))
    return <Navigate to="/admin" replace />;

  const {
    draft, setField, loading, fetching, preview, setPreview,
    loadPreset,
    addSection, updateSection, removeSection, moveSection,
    addQuestion, updateQuestion, removeQuestion, moveQuestion,
    addOption, updateOption, removeOption,
    save, sectionCount, questionCount,
  } = useFormBuilder(id, type, toast);

  if (fetching) return (
    <AdminLayout title="Biểu mẫu">
      <div className="flex items-center justify-center h-64 text-slate-400">
        <i className="pi pi-spin pi-spinner text-3xl mr-3"/>Đang tải biểu mẫu…
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={id ? "Chỉnh sửa biểu mẫu" : "Tạo biểu mẫu mới"}>
      <Toast ref={toast}/>

      {/* ── Top action bar ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-primary-900">
            {id ? "Chỉnh sửa biểu mẫu" : "Tạo biểu mẫu mới"}
          </h1>
          <div className="flex gap-2 text-[11px]">
            <span className="bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full font-semibold">
              {sectionCount} phần
            </span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              {questionCount} câu hỏi
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button label="Xem trước" icon={preview?"pi pi-eye-slash":"pi pi-eye"}
            onClick={() => setPreview(!preview)}
            className="p-button-outlined border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl h-10"/>
          <Button label="Lưu biểu mẫu" icon="pi pi-save" loading={loading}
            onClick={save}
            className="!bg-primary-600 border-none text-white font-bold rounded-xl h-10 shadow-md shadow-primary-100 hover:!bg-primary-700"/>
        </div>
      </div>

      {/* ── Two-column layout ──────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 items-start">

        {/* LEFT: Builder canvas */}
        <div className="space-y-4">

          {/* Metadata card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-widest">Thông tin biểu mẫu</h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${draft.status ? "text-green-600":"text-slate-400"}`}>
                  {draft.status ? "Hoạt động" : "Tạm dừng"}
                </span>
                <InputSwitch checked={draft.status} onChange={e => setField("status", e.value)}/>
              </div>
            </div>

            <div>
              <label className="label-xs">Tên biểu mẫu <span className="text-red-500">*</span></label>
              <InputText value={draft.name} onChange={e => setField("name", e.target.value)}
                className="w-full rounded-xl border-slate-200 h-11"
                placeholder="VD: Phiếu khảo sát sự hài lòng người bệnh nội trú 2026"/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs">Tổ chức / Đơn vị</label>
                <InputText value={draft.org} onChange={e => setField("org", e.target.value)}
                  className="w-full rounded-xl border-slate-200 h-10"
                  placeholder="VD: Bộ Y tế"/>
              </div>
              <div>
                <label className="label-xs">Nhãn (badge)</label>
                <InputText value={draft.badge} onChange={e => setField("badge", e.target.value)}
                  className="w-full rounded-xl border-slate-200 h-10"
                  placeholder="VD: MẪU SỐ 1"/>
              </div>
            </div>

            <div>
              <label className="label-xs">Mô tả / Lời dẫn nhập</label>
              <InputTextarea value={draft.description} rows={3} autoResize
                onChange={e => setField("description", e.target.value)}
                className="w-full rounded-xl border-slate-200 text-sm"
                placeholder="Mô tả mục đích, đối tượng, hướng dẫn điền phiếu…"/>
            </div>
          </div>

          {/* Sections */}
          {draft.sections.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-semibold mb-1">Biểu mẫu chưa có phần nào</p>
              <p className="text-sm">Nhấn "Thêm phần" hoặc chọn preset từ thanh bên phải.</p>
            </div>
          )}

          {draft.sections.map((sec, si) => (
            <SectionBlock key={sec.id} sec={sec} si={si} total={draft.sections.length}
              onUpdate={(f, v)        => updateSection(sec.id, f, v)}
              onRemove={()            => removeSection(sec.id)}
              onMove={(d)             => moveSection(sec.id, d)}
              onAddQ={()              => addQuestion(sec.id)}
              onUpdateQ={(qid,f,v)    => updateQuestion(sec.id, qid, f, v)}
              onRemoveQ={(qid)        => removeQuestion(sec.id, qid)}
              onMoveQ={(qid,d)        => moveQuestion(sec.id, qid, d)}
              onAddOpt={(qid)         => addOption(sec.id, qid)}
              onUpdateOpt={(qid,oid,f,v) => updateOption(sec.id, qid, oid, f, v)}
              onRemoveOpt={(qid,oid)     => removeOption(sec.id, qid, oid)}
            />
          ))}

          <button onClick={addSection}
            className="w-full py-3 border-2 border-dashed border-primary-200 rounded-2xl text-primary-600 hover:bg-primary-50 hover:border-primary-400 transition-all font-semibold flex items-center justify-center gap-2">
            <Plus size={16}/> Thêm phần (Section)
          </button>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-4 sticky top-4">

          {/* Preset loader */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest mb-3">Mẫu khởi tạo</h3>
            <div className="space-y-2">
              {[
                { key: "noitru",    label: "Hài lòng nội trú (Mẫu 1 - BYT)",       icon: "pi-building" },
                { key: "ngoaitru",  label: "Hài lòng ngoại trú (Mẫu 2 - BYT)",     icon: "pi-building" },
                { key: "tiem_chung",label: "Tiêm chủng mở rộng (Mẫu 3 - BYT)",     icon: "pi-heart" },
                { key: "blank",     label: "Biểu mẫu trống",                        icon: "pi-file" },
              ].map(p => (
                <button key={p.key}
                  onClick={() => {
                    if (window.confirm("Tải mẫu này sẽ thay thế toàn bộ nội dung hiện tại. Tiếp tục?"))
                      loadPreset(p.key as any);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center gap-2 text-slate-600">
                  <i className={`pi ${p.icon} text-primary-500 flex-shrink-0`}/>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick guide */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest mb-3">Hướng dẫn nhanh</h3>
            <ul className="text-xs text-slate-500 space-y-2 leading-relaxed">
              <li><strong className="text-slate-600">Phần:</strong> Nhóm câu hỏi theo chủ đề (A, B, C…)</li>
              <li><strong className="text-slate-600">Mã câu hỏi:</strong> A1, B3, G2… dùng để map với dữ liệu phản hồi</li>
              <li><strong className="text-slate-600">Likert:</strong> Thang đo 1–5 + 0 (không sử dụng)</li>
              <li><strong className="text-slate-600">Single/Multi:</strong> Tự thêm các tùy chọn đáp án</li>
              <li><strong className="text-slate-600">Bắt buộc:</strong> Người dùng phải trả lời câu hỏi</li>
            </ul>
          </div>

          {/* Question type legend */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest mb-3">Loại câu hỏi</h3>
            <div className="space-y-1.5">
              {Q_TYPES.map(t => (
                <div key={t.value} className={`text-[11px] px-2 py-1 rounded-lg border font-medium ${Q_TYPE_COLOR[t.value]}`}>
                  {t.label}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom save bar ────────────────────────────── */}
      <div className="mt-6 flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm sticky bottom-0">
        <button onClick={() => window.history.back()}
          className="text-slate-500 hover:text-slate-700 text-sm font-semibold flex items-center gap-1">
          ← Hủy bỏ & Quay lại
        </button>
        <Button label="Lưu biểu mẫu" icon="pi pi-save" loading={loading}
          onClick={save}
          className="!bg-primary-600 border-none text-white font-bold rounded-xl px-6 shadow-md shadow-primary-100 hover:!bg-primary-700"/>
      </div>

      <style>{`
        .label-xs {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 5px;
        }
      `}</style>
    </AdminLayout>
  );
};

export default TemplateCreate;
