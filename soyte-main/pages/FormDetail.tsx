import React, { useEffect, useState } from "react";
import { api } from "@/api";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

import BieuMau1Table from "../components/formDetail/Form1";
import SurveyForm from "../components/formDetail/Form2";

export default function EvaluationTable() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const survey_key = searchParams.get("survey_key");
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (!survey_key) {
  //     navigate("/");
  //   }
  // }, [survey_key, navigate]);

  const [formType, setFormType] = useState("");
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await api.get(`/forms/${id}`);

        setFormType(res.data.type);
        setFormData(res.data);
      } catch (error) {
        console.error("Fetch form error:", error);
      }
    };

    if (id) fetchForm();
  }, [id]);

  if (!formData) return null;

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

  return <div>Không xác định loại biểu mẫu</div>;
}
