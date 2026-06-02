import { api } from "@/api";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import SurveyInfo from "./SurveyInfo";

type OptionValue = number | string;

const PROGRESS_OPTIONS = [
  { label: "Đã thực hiện", value: 1 },
  { label: "Đang thực hiện", value: 2 },
  { label: "Chưa thực hiện", value: 3 },
];

const RATING_OPTIONS = [
  { label: "Đạt", value: 1 },
  { label: "Không đạt", value: 2 },
];

const toRoman = (num: number) => {
  const roman = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
    "XIII",
    "XIV",
    "XV",
    "XVI",
    "XVII",
    "XVIII",
    "XIX",
  ];
  return roman[num] || String(num + 1);
};

const getInfoKey = (item: any, index: number) =>
  item.key || item.value || item.name || `info-${index}`;

const isEmptyValue = (value: any) => {
  if (value === undefined || value === null) return true;

  if (typeof value === "object") {
    if ("value" in value) {
      return (
        value.value === undefined ||
        value.value === null ||
        String(value.value).trim() === ""
      );
    }
  }

  return String(value).trim() === "";
};

const SelectOptionButton = memo(function SelectOptionButton({
  active,
  label,
  onClick,
  error = false,
  activeClassName,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  error?: boolean;
  activeClassName: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[46px] rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-150 ${
        active
          ? activeClassName
          : error
            ? "border-red-300 bg-white text-slate-700 hover:border-red-400"
            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  );
});

const SurveyInfoCard = memo(function SurveyInfoCard({
  item,
  fieldKey,
  value,
  error,
  onChange,
  survey_key,
  form_id,
}: {
  item: any;
  fieldKey: string;
  value: any;
  error: boolean;
  onChange: (fieldKey: string, fieldData: any) => void;
  survey_key?: string;
  form_id?: number | string;
}) {
  return (
    <div
      className={`rounded-[24px] p-4 shadow-sm backdrop-blur-xl ${
        error
          ? "border border-red-400 bg-red-50/80 ring-2 ring-red-200"
          : "border border-white/60 bg-white/70"
      }`}
    >
      <SurveyInfo
        info={item}
        fieldKey={fieldKey}
        value={value}
        onChange={onChange}
        error={error}
        survey_key={survey_key}
        form_id={form_id}
      />
    </div>
  );
});

const TableOptionRow = memo(function TableOptionRow({
  item,
  sIndex,
  oIndex,
  progressError,
  ratingError,
  isValidate,
  onUpdateNote,
  onUpdateProgress,
  onUpdateRating,
}: {
  item: any;
  sIndex: number;
  oIndex: number;
  progressError: boolean;
  ratingError: boolean;
  isValidate: boolean;
  onUpdateNote: (
    sectionIndex: number,
    optionIndex: number,
    value: string,
  ) => void;
  onUpdateProgress: (
    sectionIndex: number,
    optionIndex: number,
    value: OptionValue,
  ) => void;
  onUpdateRating: (
    sectionIndex: number,
    optionIndex: number,
    value: OptionValue,
  ) => void;
}) {
  const itemHasError = progressError || ratingError;

  return (
    <div
      className={`overflow-hidden rounded-[24px] border bg-white/90 shadow-sm ${
        itemHasError ? "border-red-400 shadow-red-100" : "border-slate-200/80"
      }`}
    >
      <div
        className={`px-4 py-4 ${
          itemHasError
            ? "border-b border-red-200 bg-red-50/60"
            : "border-b border-slate-200/70"
        }`}
      >
        <div className="mb-3 flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
              itemHasError
                ? "border-red-300 bg-red-100 text-red-600"
                : "border-slate-300 bg-slate-50 text-slate-600"
            }`}
          >
            {oIndex + 1}
          </div>
          <div
            className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
              itemHasError ? "text-red-400" : "text-slate-400"
            }`}
          >
            Nội dung thực hiện
          </div>
        </div>

        <div className="text-[15px] leading-7 text-slate-700">
          {item.content}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Phương thức thực hiện
          </div>
          <div className="text-sm leading-6 text-slate-700">{item.method}</div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Sản phẩm đầu ra
          </div>
          <div className="text-sm leading-6 text-slate-700">
            {item.productOut}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Ghi chú / Kiến nghị
          </div>

          <InputTextarea
            value={item.note || ""}
            onChange={(e) => onUpdateNote(sIndex, oIndex, e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-[15px] shadow-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            placeholder="Nhập ghi chú hoặc kiến nghị"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-slate-200/70 px-4 py-4 xl:grid-cols-2">
        <div>
          <div
            className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              progressError ? "text-red-500" : "text-slate-400"
            }`}
          >
            Tiến độ thực hiện{" "}
            {isValidate && <span className="text-red-500">*</span>}
          </div>

          <div
            className={`rounded-2xl p-2 ${
              progressError
                ? "border border-red-500 bg-red-50/60"
                : "border border-transparent"
            }`}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {PROGRESS_OPTIONS.map((progress) => {
                const active = item?.progress?.value === progress.value;

                return (
                  <SelectOptionButton
                    key={progress.value}
                    active={active}
                    label={progress.label}
                    error={progressError}
                    activeClassName="border-blue-500 bg-blue-500 text-white"
                    onClick={() =>
                      onUpdateProgress(sIndex, oIndex, progress.value)
                    }
                  />
                );
              })}
            </div>
          </div>

          {progressError && (
            <small className="mt-2 block text-red-500">
              Vui lòng chọn tiến độ thực hiện
            </small>
          )}
        </div>

        <div>
          <div
            className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              ratingError ? "text-red-500" : "text-slate-400"
            }`}
          >
            Đánh giá {isValidate && <span className="text-red-500">*</span>}
          </div>

          <div
            className={`rounded-2xl p-2 ${
              ratingError
                ? "border border-red-500 bg-red-50/60"
                : "border border-transparent"
            }`}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {RATING_OPTIONS.map((rating) => {
                const active = item?.rating?.value === rating.value;

                return (
                  <SelectOptionButton
                    key={rating.value}
                    active={active}
                    label={rating.label}
                    error={ratingError}
                    activeClassName="border-emerald-500 bg-emerald-500 text-white"
                    onClick={() => onUpdateRating(sIndex, oIndex, rating.value)}
                  />
                );
              })}
            </div>
          </div>

          {ratingError && (
            <small className="mt-2 block text-red-500">
              Vui lòng chọn đánh giá
            </small>
          )}
        </div>
      </div>
    </div>
  );
});

const TableSection = memo(function TableSection({
  section,
  sIndex,
  isOpen,
  onToggle,
  errors,
  onUpdateNote,
  onUpdateProgress,
  onUpdateRating,
}: {
  section: any;
  sIndex: number;
  isOpen: boolean;
  onToggle: (index: number) => void;
  errors: Record<string, boolean>;
  onUpdateNote: (
    sectionIndex: number,
    optionIndex: number,
    value: string,
  ) => void;
  onUpdateProgress: (
    sectionIndex: number,
    optionIndex: number,
    value: OptionValue,
  ) => void;
  onUpdateRating: (
    sectionIndex: number,
    optionIndex: number,
    value: OptionValue,
  ) => void;
}) {
  const sectionHasError = section.option.some((_: any, oIndex: number) => {
    return (
      errors[`progress-${sIndex}-${oIndex}`] ||
      errors[`rating-${sIndex}-${oIndex}`]
    );
  });

  return (
    <div className="border-b border-slate-200/70 last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(sIndex)}
        className={`flex w-full items-center gap-3 px-4 py-4 text-left text-white transition-all duration-200 hover:brightness-110 ${
          sectionHasError ? "bg-red-500" : "bg-primary-800"
        }`}
      >
        <i
          className={`pi ${
            isOpen ? "pi-chevron-down" : "pi-chevron-right"
          } text-xs`}
        />
        <span className="min-w-[30px] font-semibold">{toRoman(sIndex)}</span>
        <span className="text-sm font-semibold sm:text-base">
          {section.name}
        </span>

        {sectionHasError && (
          <span className="ml-auto rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            Thiếu thông tin
          </span>
        )}
      </button>

      {isOpen && (
        <div className="space-y-4 p-3 sm:p-4">
          {section.option.map((item: any, oIndex: number) => (
            <TableOptionRow
              key={`${sIndex}-${oIndex}`}
              item={item}
              sIndex={sIndex}
              oIndex={oIndex}
              progressError={!!errors[`progress-${sIndex}-${oIndex}`]}
              ratingError={!!errors[`rating-${sIndex}-${oIndex}`]}
              isValidate={
                section.isValidate !== false && item.isValidate !== false
              }
              onUpdateNote={onUpdateNote}
              onUpdateProgress={onUpdateProgress}
              onUpdateRating={onUpdateRating}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default function BieuMau1Table({ id, type, formJson, survey_key }: any) {
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();

  const { info = [], data = [], name, description } = formJson;

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [infoErrors, setInfoErrors] = useState<Record<string, boolean>>({});
  const [tableData, setTableData] = useState<any[]>(() => data || []);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [customerName, setCustomerName] = useState("");
  const [fullNameError, setFullNameError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOpenSection = useRef(openSection);
  const visibleInfo = useMemo(() => {
    return (info ?? [])
      .filter((item) => item?.status)
      .map((item, index) => ({
        item,
        fieldKey: getInfoKey(item, index),
      }));
  }, [info]);

  const handleChange = useCallback((fieldKey: string, fieldData: any) => {
    setFormData((prev) => {
      if (prev[fieldKey] === fieldData) return prev;

      return {
        ...prev,
        [fieldKey]: fieldData,
      };
    });

    setInfoErrors((prev) => {
      if (!prev[fieldKey]) return prev;

      return {
        ...prev,
        [fieldKey]: false,
      };
    });
  }, []);

  const toggleSection = useCallback((index: number) => {
    setOpenSection((prev) => (prev === index ? null : index));
  }, []);

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    scrollToTop();
    requestAnimationFrame(scrollToTop);
  }, []);

  useEffect(() => {
    if (prevOpenSection.current !== openSection) {
      prevOpenSection.current = openSection;

      if (openSection !== null) {
        const el = sectionRefs.current[openSection];
        if (el) {
          const yOffset = -220;
          const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }
    }
  }, [openSection]);
  const clearFieldError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;

      return {
        ...prev,
        [key]: false,
      };
    });
  }, []);

  const updateProgress = useCallback(
    (sectionIndex: number, optionIndex: number, value: OptionValue) => {
      setTableData((prev) => {
        const section = prev[sectionIndex];
        if (!section) return prev;

        const option = section.option?.[optionIndex];
        if (!option) return prev;

        if (option?.progress?.value === value) return prev;

        const next = [...prev];
        const nextSection = { ...section };
        const nextOptions = [...section.option];

        nextOptions[optionIndex] = {
          ...option,
          progress: {
            ...(option.progress || {}),
            value,
          },
        };

        nextSection.option = nextOptions;
        next[sectionIndex] = nextSection;

        return next;
      });

      clearFieldError(`progress-${sectionIndex}-${optionIndex}`);
    },
    [clearFieldError],
  );

  const updateRating = useCallback(
    (sectionIndex: number, optionIndex: number, value: OptionValue) => {
      setTableData((prev) => {
        const section = prev[sectionIndex];
        if (!section) return prev;

        const option = section.option?.[optionIndex];
        if (!option) return prev;

        if (option?.rating?.value === value) return prev;

        const next = [...prev];
        const nextSection = { ...section };
        const nextOptions = [...section.option];

        nextOptions[optionIndex] = {
          ...option,
          rating: {
            ...(option.rating || {}),
            value,
          },
        };

        nextSection.option = nextOptions;
        next[sectionIndex] = nextSection;

        return next;
      });

      clearFieldError(`rating-${sectionIndex}-${optionIndex}`);
    },
    [clearFieldError],
  );

  const updateNote = useCallback(
    (sectionIndex: number, optionIndex: number, value: string) => {
      setTableData((prev) => {
        const section = prev[sectionIndex];
        if (!section) return prev;

        const option = section.option?.[optionIndex];
        if (!option) return prev;

        if ((option.note || "") === value) return prev;

        const next = [...prev];
        const nextSection = { ...section };
        const nextOptions = [...section.option];

        nextOptions[optionIndex] = {
          ...option,
          note: value,
        };

        nextSection.option = nextOptions;
        next[sectionIndex] = nextSection;

        return next;
      });
    },
    [clearFieldError],
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, boolean> = {};
    const newInfoErrors: Record<string, boolean> = {};
    const sectionsToOpen: Record<number, boolean> = {};
    let isValid = true;
    const formIsValidate = formJson.isValidate !== false;

    if (formIsValidate && !customerName.trim()) {
      newInfoErrors["customerName"] = true; // This is a bit of a hack, but works for the error state if I map it
      isValid = false;
    }

    visibleInfo.forEach(({ item, fieldKey }: any, index: number) => {
      const key = fieldKey || item.key || item.name || `info-${index}`;
      const value = formData[key];

      if (item.isValidate !== false && isEmptyValue(value)) {
        newInfoErrors[key] = true;
        isValid = false;
      }
    });

    tableData.forEach((section: any, sectionIndex: number) => {
      if (section.isValidate === false) return;

      section.option.forEach((item: any, optionIndex: number) => {
        if (item.isValidate === false) return;
        const progressValue = item?.progress?.value;
        const ratingValue = item?.rating?.value;
        const noteValue = item?.note;

        if (
          progressValue === null ||
          progressValue === undefined ||
          progressValue === "" ||
          progressValue === -1
        ) {
          newErrors[`progress-${sectionIndex}-${optionIndex}`] = true;
          sectionsToOpen[sectionIndex] = true;
          isValid = false;
        }

        if (
          ratingValue === null ||
          ratingValue === undefined ||
          ratingValue === "" ||
          ratingValue === -1
        ) {
          newErrors[`rating-${sectionIndex}-${optionIndex}`] = true;
          sectionsToOpen[sectionIndex] = true;
          isValid = false;
        }
      });
    });

    setErrors(newErrors);
    setInfoErrors(newInfoErrors);

    if (!isValid) {
      const firstInvalidSection = Object.keys(sectionsToOpen)
        .map(Number)
        .sort((a, b) => a - b)[0];

      if (firstInvalidSection !== undefined) {
        setOpenSection(firstInvalidSection);
      }
    }

    return isValid;
  }, [formData, tableData, visibleInfo]);

  const submitForm = useCallback(async () => {
    console.log("submitForm called, submittingRef:", submittingRef.current);
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    let nameIsValid = true;
    const formIsValidate = formJson.isValidate !== false;
    if (formIsValidate && !customerName.trim()) {
      setFullNameError(true);
      nameIsValid = false;
    } else {
      setFullNameError(false);
    }
    const formValidationIsValid = validateForm();
    if (!formValidationIsValid || !nameIsValid) {
      toast.current?.show({
        severity: "error",
        summary: "Thiếu thông tin",
        detail: "Vui lòng nhập đầy đủ tất cả trường bắt buộc trước khi gửi",
      });
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      const userId = userInfo.id || null;

      const payload = {
        user_id: userId,
        form_id: Number(id),
        survey_key: survey_key,
        creator_name: customerName,
        info: {
          title: name,
          description,
          ...formData,
        },
        type,
        submission_data: tableData,
        status: "pending",
      };

      const result = await api.post("/feedbacks", payload);

      // Chỉ show toast khi server không có message (api.ts chưa bắn)
      if (!result?.message) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Lưu thành công",
        });
      }

      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
      }

      navigateTimeoutRef.current = setTimeout(() => {
        navigate(-1);
      }, 500);
    } catch (error: any) {
      console.error("Submit error:", error);
      // api.ts đã tự bắn toast từ server message qua window.$toast
      // Chỉ show fallback toast khi không có server message
      const serverMessage = error?.message && !error.message.startsWith("API Error:");
      if (!serverMessage) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Gửi biểu mẫu thất bại",
        });
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [
    validateForm,
    name,
    description,
    customerName,
    id,
    formData,
    type,
    tableData,
    navigate,
    submitting,
  ]);

  return (
    <div className="mx-auto mt-4 w-full px-3 sm:mt-6 sm:px-4 xl:w-[88%] 2xl:w-[92%]">
      <Toast ref={toast} />

      <div className="mb-6 rounded-[28px] border border-white/60 bg-white/70 p-5 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
        <h3 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
          {name}
        </h3>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          {description}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div
          className={`rounded-[24px] p-4 shadow-sm backdrop-blur-xl ${
            fullNameError
              ? "border border-red-400 bg-red-50/80 ring-2 ring-red-200"
              : "border border-white/60 bg-white/70"
          }`}
        >
          <div className="mb-2 min-h-[48px]">
            <label className="mb-1 block font-medium text-slate-700">
              Họ và Tên{" "}
              {formJson.isValidate !== false && (
                <span className="text-red-500">*</span>
              )}
            </label>
          </div>
          <input
            type="text"
            value={customerName}
            className={`
              w-full h-[46px] rounded-xl border bg-white px-4 text-[15px] text-slate-700
              shadow-sm outline-none transition-all duration-200
              ${
                fullNameError
                  ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  : "border-slate-300 hover:border-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              }
            `}
            placeholder={info.placeholder || "Nhập nội dung"}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (customerName && e.target.value.trim()) {
                setFullNameError(false);
              }
            }}
          />
          {fullNameError && (
            <div className="mt-2 text-sm text-red-500">
              Vui lòng nhập thông tin này
            </div>
          )}
        </div>
        {visibleInfo.map(({ item, fieldKey }: any) => (
          <SurveyInfoCard
            key={fieldKey}
            item={item}
            fieldKey={fieldKey}
            value={formData[fieldKey]}
            onChange={handleChange}
            error={!!infoErrors[fieldKey]}
            survey_key={survey_key}
            form_id={id}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        {tableData.map((section, sIndex) => (
          <div
            key={section.id || section.name || sIndex}
            ref={(el) => {
              sectionRefs.current[sIndex] = el;
            }}
          >
            <TableSection
              section={section}
              sIndex={sIndex}
              isOpen={openSection === sIndex}
              onToggle={toggleSection}
              errors={errors}
              onUpdateNote={updateNote}
              onUpdateProgress={updateProgress}
              onUpdateRating={updateRating}
            />
          </div>
        ))}
      </div>

      <div className="mb-4 mt-6 flex justify-end">
        <Button
          label={submitting ? "Đang gửi..." : "Gửi biểu mẫu"}
          icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-send"}
          onClick={submitForm}
          disabled={submitting}
          className={`
            rounded-2xl border-0 bg-gradient-to-r from-emerald-400 to-green-500
            px-5 py-3 text-sm font-semibold text-white
            shadow-lg shadow-emerald-200 transition-all duration-200
            hover:-translate-y-0.5 hover:shadow-xl
            active:translate-y-0 sm:text-base
            ${submitting ? "opacity-50 pointer-events-none cursor-not-allowed" : ""}
          `}
        />
      </div>
    </div>
  );
}
