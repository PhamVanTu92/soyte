/**
 * FormFill.tsx — Phiếu điền khảo sát (thiết kế mới)
 *
 * Nhận formJson theo cấu trúc chuẩn hóa mới:
 *   { name, org, badge, description, type, sections[{ title, questions[{ question_key, type, label, required, options[] }] }] }
 *
 * Thay thế Form2.tsx cho loại "evaluate"
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { Toast } from "primereact/toast";

/* ── Types ─────────────────────────────────────────────────── */
type QType = "likert" | "single" | "multi" | "text" | "textarea" | "number" | "date";
interface FOption   { option_key: string; label: string; order_index?: number; }
interface FQuestion { id?: number; question_key: string; type: QType; label: string; required: boolean; options: FOption[]; score_weight?: number; }
interface FSection  { id?: number; title: string; order_index?: number; questions: FQuestion[]; }
interface FormJson  { name: string; description?: string; org?: string; badge?: string; type?: string; sections: FSection[]; }

/* ── LIKERT default options (BYT) ──────────────────────────── */
const DEFAULT_LIKERT: FOption[] = [
  { option_key: "1", label: "Rất không hài lòng" },
  { option_key: "2", label: "Không hài lòng"     },
  { option_key: "3", label: "Bình thường"         },
  { option_key: "4", label: "Hài lòng"            },
  { option_key: "5", label: "Rất hài lòng"        },
  { option_key: "0", label: "Không sử dụng"       },
];

/* ── Render helpers ─────────────────────────────────────────── */

/** Likert scale buttons */
const LikertInput: React.FC<{
  qKey: string; options: FOption[]; value: string | null;
  onChange: (v: string) => void; error: boolean;
}> = ({ qKey, options, value, onChange, error }) => {
  const opts = options.length > 0 ? options : DEFAULT_LIKERT;
  return (
    <div className={`flex flex-wrap gap-1.5 mt-2 ${error ? "ring-2 ring-red-300 rounded-xl p-1" : ""}`}>
      {opts.map((o) => {
        const isZero = o.option_key === "0";
        const selected = value === o.option_key;
        return (
          <label key={o.option_key}
            className="flex-1 min-w-[56px] text-center cursor-pointer select-none"
            title={o.label}>
            <input type="radio" name={qKey} value={o.option_key} className="hidden"
              checked={selected} onChange={() => onChange(o.option_key)} />
            <div className={`px-1 py-2 rounded-lg border text-[11px] leading-tight transition-all
              ${selected
                ? isZero
                  ? "bg-slate-500 border-slate-500 text-white"
                  : "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-100"
                : isZero
                  ? "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-400"
                  : "border-slate-200 bg-white text-slate-600 hover:border-primary-400 hover:bg-primary-50"
              }`}>
              <div className={`text-lg font-black leading-none mb-0.5 ${selected ? "text-white" : isZero ? "text-slate-400" : "text-slate-700"}`}>
                {o.option_key}
              </div>
              <div className="truncate px-0.5 leading-tight">{o.label}</div>
            </div>
          </label>
        );
      })}
    </div>
  );
};

/** Single / Multi choice cards */
const ChoiceInput: React.FC<{
  qKey: string; options: FOption[]; multi?: boolean;
  value: string | string[] | null; onChange: (v: string | string[]) => void; error: boolean;
}> = ({ qKey, options, multi, value, onChange, error }) => {
  const toggle = (optKey: string) => {
    if (multi) {
      const arr = Array.isArray(value) ? [...value] : [];
      const idx = arr.indexOf(optKey);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(optKey);
      onChange(arr);
    } else {
      onChange(optKey);
    }
  };
  const isSelected = (optKey: string) =>
    multi ? (Array.isArray(value) && value.includes(optKey)) : value === optKey;

  return (
    <div className={`flex flex-col gap-2 mt-2 ${error ? "ring-2 ring-red-300 rounded-xl p-1" : ""}`}>
      {options.map((o) => {
        const sel = isSelected(o.option_key);
        return (
          <label key={o.option_key}
            className={`flex items-start gap-3 px-4 py-2.5 border rounded-xl cursor-pointer transition-all text-sm
              ${sel
                ? "bg-primary-50 border-primary-400 text-primary-900"
                : "bg-white border-slate-200 text-slate-700 hover:border-primary-300 hover:bg-slate-50"
              }`}>
            <input
              type={multi ? "checkbox" : "radio"}
              name={qKey} value={o.option_key}
              checked={sel} onChange={() => toggle(o.option_key)}
              className="mt-0.5 flex-shrink-0 accent-[#0284c7]"
            />
            <span className="leading-relaxed">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
};

/* ── Main component ─────────────────────────────────────────── */
interface Props {
  id?: string;
  type?: string;
  formJson: FormJson;
  survey_key?: string | null;
}

const FormFill: React.FC<Props> = ({ id, type, formJson, survey_key }) => {
  const toast     = useRef<Toast>(null);
  const navigate  = useNavigate();
  const topRef    = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const { name, description, org, badge, sections = [] } = formJson;

  /* ── Answers: { question_key → value } ── */
  const [answers,      setAnswers]      = useState<Record<string, any>>({});
  const [creatorName,  setCreatorName]  = useState("");
  const [nameError,    setNameError]    = useState(false);
  const [errors,       setErrors]       = useState<Record<string, boolean>>({});
  const [submitting,   setSubmitting]   = useState(false);
  const [openSection,  setOpenSection]  = useState<number | null>(0);

  const setAnswer = useCallback((key: string, val: any) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: false }));
  }, []);

  /* ── Progress ── */
  const progress = useMemo(() => {
    let total = 0, filled = 0;
    sections.forEach(sec =>
      sec.questions.forEach(q => {
        total++;
        const v = answers[q.question_key];
        if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)) filled++;
      })
    );
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [answers, sections]);

  /* ── Validate + Submit ── */
  const handleSubmit = async () => {
    if (submitting) return;
    const newErrors: Record<string, boolean> = {};
    let firstErrorSection: number | null = null;
    let valid = true;

    if (!creatorName.trim()) { setNameError(true); valid = false; }

    sections.forEach((sec, si) => {
      sec.questions.forEach(q => {
        if (!q.required) return;
        const v = answers[q.question_key];
        const empty = v === undefined || v === null || v === "" ||
          (Array.isArray(v) && v.length === 0);
        if (empty) {
          newErrors[q.question_key] = true;
          if (firstErrorSection === null) firstErrorSection = si;
          valid = false;
        }
      });
    });

    setErrors(newErrors);

    if (!valid) {
      if (firstErrorSection !== null) {
        setOpenSection(firstErrorSection);
        requestAnimationFrame(() => {
          sectionRefs.current[firstErrorSection!]?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      toast.current?.show({ severity: "error", summary: "Thiếu thông tin", detail: "Vui lòng điền đầy đủ các câu hỏi bắt buộc (*)" });
      return;
    }

    setSubmitting(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");

      // Build submission_data theo format FeedbackSection
      const submission_data = sections.map(sec => ({
        title: sec.title,
        data: sec.questions.map(q => {
          const val = answers[q.question_key];
          return {
            question_key: q.question_key,
            label:        q.label,
            type:         q.type,
            answerType:   q.type === "likert"  ? "score1_5"     :
                          q.type === "single" || q.type === "multi" ? "single_choice" :
                          q.type === "number" ? "percentage"    : "text",
            ratingVote:   q.type === "likert"  ? { type: "hailong", value: val ?? -1 } : undefined,
            answerValue:  q.type !== "likert"  ? val                                   : undefined,
            answerOptions: (q.type === "single" || q.type === "multi")
              ? (q.options || []).map(o => ({ key: o.option_key, value: o.label }))
              : undefined,
          };
        }),
      }));

      await api.post("/feedbacks-new", {
        user_id:         userInfo.id || null,
        form_id:         Number(id),
        survey_key:      survey_key || null,
        creator_name:    creatorName.trim() || "Ẩn danh",
        type:            type || "evaluate",
        status:          "pending",
        info:            { title: name, description, ...Object.fromEntries(
                            Object.entries(answers).filter(([k]) =>
                              sections.flatMap(s => s.questions.map(q => q.question_key)).includes(k)
                            )
                          )},
        submission_data,
      });

      toast.current?.show({ severity: "success", summary: "Cảm ơn!", detail: "Phiếu đã được gửi thành công.", life: 2500 });
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: "error", summary: "Lỗi", detail: "Không thể gửi phiếu. Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Grid cell cho câu hỏi trong section "Thông tin" ─────────── */
  const renderInfoQuestion = (q: FQuestion) => {
    const val    = answers[q.question_key];
    const hasErr = errors[q.question_key];
    const today  = new Date().toISOString().split("T")[0];

    // Date auto-fill today on first render
    if (q.type === "date" && !val) {
      setTimeout(() => setAnswer(q.question_key, today), 0);
    }

    return (
      <div key={q.question_key} className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 truncate">
          {q.label.replace(/^[A-Z0-9]+[._]\s*/, "")}
          {q.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Single choice → styled select */}
        {(q.type === "single" || q.type === "multi") && (
          <div className="relative">
            <select
              value={Array.isArray(val) ? (val[0] ?? "") : (val ?? "")}
              onChange={e => setAnswer(q.question_key, e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-primary-300 transition
                ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
              <option value="">Chọn</option>
              {q.options.map(o => (
                <option key={o.option_key} value={o.option_key}>{o.label}</option>
              ))}
            </select>
            <i className="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
        )}

        {/* Date */}
        {q.type === "date" && (
          <input type="date"
            value={val ?? today}
            onChange={e => setAnswer(q.question_key, e.target.value)}
            className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 transition
              ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}
          />
        )}

        {/* Text */}
        {q.type === "text" && (
          <input type="text"
            value={val ?? ""}
            onChange={e => setAnswer(q.question_key, e.target.value)}
            placeholder="Nhập nội dung"
            className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 transition
              ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}
          />
        )}

        {/* Number */}
        {q.type === "number" && (
          <input type="number"
            value={val ?? ""}
            onChange={e => setAnswer(q.question_key, e.target.value)}
            placeholder="Nhập số"
            className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 transition
              ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}
          />
        )}

        {hasErr && <p className="text-[11px] text-red-500">Vui lòng điền thông tin này</p>}
      </div>
    );
  };

/* ── Detect info section (Thông tin chung / Thông tin người bệnh) ── */
  const isInfoSection = (sec: FSection) => {
    const t = (sec.title ?? "").toLowerCase();
    return t.includes("thông tin") || t.includes("thong tin");
  };

/* ── Render question ── */
  const renderQuestion = (q: FQuestion, si: number) => {
    const val   = answers[q.question_key];
    const hasErr = errors[q.question_key];

    return (
      <div key={q.question_key}
        className={`py-4 border-b border-dashed border-slate-100 last:border-0 ${hasErr ? "bg-red-50/40 -mx-5 px-5 rounded-xl" : ""}`}>
        {/* Label */}
        <div className="flex gap-2 mb-1">
          <span className="font-mono text-[11px] text-primary-600 font-bold flex-shrink-0 pt-0.5">
            {q.question_key}
          </span>
          <span className="text-[13px] text-slate-700 leading-snug">
            {q.label}
            {q.required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </div>
        {hasErr && (
          <p className="text-[11px] text-red-500 mb-1 ml-8">Vui lòng trả lời câu hỏi này</p>
        )}

        {/* Input by type */}
        {q.type === "likert" && (
          <LikertInput qKey={`${si}-${q.question_key}`} options={q.options}
            value={val ?? null} onChange={v => setAnswer(q.question_key, v)} error={hasErr} />
        )}
        {(q.type === "single" || q.type === "multi") && (
          <ChoiceInput qKey={`${si}-${q.question_key}`} options={q.options}
            multi={q.type === "multi"} value={val ?? null}
            onChange={v => setAnswer(q.question_key, v)} error={hasErr} />
        )}
        {q.type === "textarea" && (
          <textarea
            rows={3}
            value={val ?? ""}
            onChange={e => setAnswer(q.question_key, e.target.value)}
            placeholder="Nhập câu trả lời của bạn…"
            className={`mt-2 w-full px-3 py-2.5 text-sm border rounded-xl resize-y min-h-[72px] focus:outline-none focus:ring-2 focus:ring-primary-300 transition
              ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}
          />
        )}
        {q.type === "text" && (
          <input type="text"
            value={val ?? ""}
            onChange={e => setAnswer(q.question_key, e.target.value)}
            placeholder="Nhập câu trả lời…"
            className={`mt-2 w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 transition
              ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}
          />
        )}
        {q.type === "number" && (
          <input type="number"
            value={val ?? ""}
            onChange={e => setAnswer(q.question_key, e.target.value)}
            placeholder="0"
            className={`mt-2 w-40 px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 transition
              ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}
          />
        )}
        {q.type === "date" && (
          <input type="date"
            value={val ?? ""}
            onChange={e => setAnswer(q.question_key, e.target.value)}
            className={`mt-2 px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 transition
              ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}
          />
        )}
      </div>
    );
  };

  /* ── JSX ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pb-32">
      <Toast ref={toast} />
      <div ref={topRef} className="max-w-3xl mx-auto px-4 py-6">

        {/* ── Progress bar ── */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Tiến độ điền phiếu</span>
            <span className="font-bold text-primary-600">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Header card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5 relative">
          {/* Top gradient bar */}
          <div className="h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-secondary-500" />
          <div className="p-6">
            {(org || badge) && (
              <div className="flex items-center gap-2 mb-3">
                {org  && <span className="text-[11px] font-black uppercase tracking-widest text-primary-600">{org}</span>}
                {org && badge && <span className="text-slate-300">·</span>}
                {badge && <span className="text-[11px] font-black uppercase tracking-widest bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full">{badge}</span>}
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-800 leading-snug mb-2">{name}</h1>
            {description && (
              <p className="text-sm text-slate-500 leading-relaxed italic">{description}</p>
            )}
          </div>
        </div>

        {/* ── Creator name ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            Họ tên người điền phiếu <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={creatorName}
            onChange={e => { setCreatorName(e.target.value); setNameError(false); }}
            placeholder="Nhập họ và tên…"
            className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 transition
              ${nameError ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}
          />
          {nameError && <p className="text-[11px] text-red-500 mt-1">Vui lòng nhập họ tên</p>}
        </div>

        {/* ── Sections ── */}
        {sections.map((sec, si) => {
          const isOpen = openSection === null || openSection === si;
          const answeredInSection = sec.questions.filter(q => {
            const v = answers[q.question_key];
            return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
          }).length;

          return (
            <div key={sec.id ?? si} ref={el => { sectionRefs.current[si] = el; }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">

              {/* Section header */}
              <button
                type="button"
                onClick={() => setOpenSection(prev => prev === si ? null : si)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-primary-600 text-white hover:bg-primary-700 transition-colors text-left">
                <span className="font-semibold text-sm">{sec.title}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded-full">
                    {answeredInSection}/{sec.questions.length}
                  </span>
                  <i className={`pi ${isOpen ? "pi-chevron-up" : "pi-chevron-down"} text-xs opacity-80`} />
                </div>
              </button>

              {/* Questions */}
              {isOpen && (
                isInfoSection(sec) ? (
                  /* Grid layout cho section thông tin */
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sec.questions.map(q => renderInfoQuestion(q))}
                  </div>
                ) : (
                  /* Layout 1 cột cho section khảo sát */
                  <div className="px-5 py-2">
                    {sec.questions.map(q => renderQuestion(q, si))}
                  </div>
                )
              )}
            </div>
          );
        })}

        {/* ── Spacer for sticky bar ── */}
        <div className="h-4" />
      </div>

      {/* ── Sticky submit bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-100 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-1.5 flex-shrink-0">
            <i className="pi pi-arrow-left text-xs" /> Trở lại
          </button>

          <div className="flex items-center gap-3">
            {/* Mini progress */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span>{progress}%</span>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-primary-100 transition-all text-sm">
              {submitting
                ? <><i className="pi pi-spin pi-spinner text-sm" /> Đang gửi…</>
                : <><i className="pi pi-send text-sm" /> Gửi phiếu</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormFill;
