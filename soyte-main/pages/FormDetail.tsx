import React, { useEffect, useState } from "react";
import { api } from "@/api";
import { useParams, useSearchParams } from "react-router-dom";

import BieuMau1Table from "../components/formDetail/Form1";
import SurveyForm from "../components/formDetail/Form2";

/* ──────────────────────────────────────────────────────────────
 * Chuyển đổi cấu trúc mới (forms-new) → cấu trúc cũ mà Form1/Form2 dùng
 *
 * Cấu trúc mới:  { sections: [{ title, questions: [{ question_key, type, label, options[] }] }] }
 * Cấu trúc cũ:   { data:     [{ name,  option:   [{ key, content, answerType, answerOptions[], ratingVote }] }] }
 * ────────────────────────────────────────────────────────────── */
function transformFormToLegacy(form: any) {
  // Nếu đã có cấu trúc cũ (data[]) thì giữ nguyên
  if (Array.isArray(form?.data) && form.data.length > 0) return form;

  const sections: any[] = form?.sections ?? [];
  let questionCounter = 1;

  const data = sections.map((sec: any) => ({
    name:   sec.title ?? "",
    status: true,
    Roman:  "roman",
    option: (sec.questions ?? []).map((q: any) => {
      // Map question type → answerType (nomenclature cũ)
      let answerType: string;
      switch (q.type) {
        case "likert":   answerType = "score1_5";     break;
        case "single":
        case "multi":    answerType = "single_choice"; break;
        case "number":   answerType = "percentage";   break;
        default:         answerType = "text";          break;
      }

      // answerOptions cho single/multi
      const answerOptions =
        q.type === "single" || q.type === "multi"
          ? (q.options ?? []).map((o: any, oi: number) => ({
              key:   o.option_key ?? String(oi + 1),
              value: o.label ?? "",
            }))
          : [];

      return {
        key:          questionCounter++,
        content:      q.label  ?? "",
        method:       "",
        productOut:   "",
        progress:     { type: "tiendo",  value: -1 },
        rating:       { type: "danhgia", value: -1 },
        ratingVote:   { type: "hailong", value: -1 },
        note:         "",
        answerType,
        answerOptions,
        status:       true,
        required:     Boolean(q.required),
        // Giữ thêm question_key để tham chiếu khi submit
        question_key: q.question_key,
      };
    }),
  }));

  return {
    ...form,
    data,
    info: form.info ?? [],
  };
}

export default function FormDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const survey_key = searchParams.get("survey_key");

  const [formType, setFormType]   = useState("");
  const [formData, setFormData]   = useState<any>(null);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/forms-new/${id}`)
      .then((res) => {
        const raw = res?.data ?? res;
        setFormType(raw.type ?? "");
        setFormData(transformFormToLegacy(raw));
      })
      .catch((err) => console.error("Fetch form error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-slate-400">
      <i className="pi pi-spin pi-spinner text-3xl mr-3" />Đang tải biểu mẫu…
    </div>
  );

  if (!formData) return (
    <div className="flex items-center justify-center min-h-screen text-slate-400">
      Không tìm thấy biểu mẫu.
    </div>
  );

  if (formType === "reflect") {
    return (
      <BieuMau1Table
        id={id}
        type={formType}
        formJson={formData}
        survey_key={survey_key}
      />
    );
  }

  if (formType === "evaluate") {
    return (
      <div className="bg-[radial-gradient(circle_at_top,_#f8fbff,_#eef4ff_45%,_#f8fafc_100%)]">
        <SurveyForm
          id={id}
          type={formType}
          formJson={formData}
          survey_key={survey_key}
        />
      </div>
    );
  }

  return <div className="p-10 text-center text-slate-400">Không xác định loại biểu mẫu.</div>;
}
