import React, { useEffect, useState } from "react";
import { api } from "@/api";
import { useParams, useSearchParams } from "react-router-dom";

import BieuMau1Table from "../components/formDetail/Form1";   // reflect (cũ)
import FormFill      from "../components/formDetail/FormFill"; // evaluate (mới)

export default function FormDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const survey_key = searchParams.get("survey_key");

  const [formData, setFormData] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/forms-new/${id}`)
      .then((res) => setFormData(res?.data ?? res))
      .catch((err) => console.error("Fetch form error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-slate-400">
      <i className="pi pi-spin pi-spinner text-3xl mr-3" /> Đang tải biểu mẫu…
    </div>
  );

  if (!formData) return (
    <div className="flex items-center justify-center min-h-screen text-slate-400">
      Không tìm thấy biểu mẫu.
    </div>
  );

  const formType = formData.type ?? "";

  // Loại "reflect" → vẫn dùng Form1 cũ (cần transform legacy)
  if (formType === "reflect") {
    const legacyData = transformToLegacy(formData);
    return (
      <BieuMau1Table
        id={id}
        type={formType}
        formJson={legacyData}
        survey_key={survey_key}
      />
    );
  }

  // Loại "evaluate" (và mặc định) → FormFill mới
  return (
    <FormFill
      id={id}
      type={formType || "evaluate"}
      formJson={formData}
      survey_key={survey_key}
    />
  );
}

/* ── Legacy transformer cho Form1 (reflect) ─────────────────── */
function transformToLegacy(form: any) {
  if (Array.isArray(form?.data) && form.data.length > 0) return form;
  const sections: any[] = form?.sections ?? [];
  let counter = 1;
  const data = sections.map((sec: any) => ({
    name: sec.title ?? "",
    status: true,
    Roman: "roman",
    option: (sec.questions ?? []).map((q: any) => {
      const answerType =
        q.type === "likert"               ? "score1_5"     :
        q.type === "single" || q.type === "multi" ? "single_choice" :
        q.type === "number"               ? "percentage"   : "text";
      return {
        key: counter++,
        content: q.label ?? "",
        method: "", productOut: "",
        progress:   { type: "tiendo",  value: -1 },
        rating:     { type: "danhgia", value: -1 },
        ratingVote: { type: "hailong", value: -1 },
        note: "",
        answerType,
        answerOptions: (q.type === "single" || q.type === "multi")
          ? (q.options ?? []).map((o: any, i: number) => ({ key: o.option_key ?? i + 1, value: o.label ?? "" }))
          : [],
        status: true,
        required: Boolean(q.required),
        question_key: q.question_key,
      };
    }),
  }));
  return { ...form, data, info: form.info ?? [] };
}
