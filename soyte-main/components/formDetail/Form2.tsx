import React, { memo, useCallback, useRef, useState } from "react";
import SurveyInfo from "./SurveyInfo";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { api } from "@/api";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";

const RATING_OPTIONS = [0, 1, 2, 3, 4, 5];

const RATING_GUIDE = [
  { score: 1, text1: "Rất không hài lòng", text2: "hoặc: Rất kém" },
  { score: 2, text1: "Không hài lòng", text2: "hoặc: Kém" },
  { score: 3, text1: "Bình thường", text2: "hoặc: Trung bình" },
  { score: 4, text1: "Hài lòng", text2: "hoặc: Tốt" },
  { score: 5, text1: "Rất hài lòng", text2: "hoặc: Rất tốt" },
  { score: 0, text1: "Không sử dụng", text2: "" },
];

const getQuestionKey = (item: any, sIndex: number, oIndex: number) =>
  item?.id || item?.key || item?.name || `question-${sIndex}-${oIndex}`;

const getSectionKey = (section: any, sIndex: number) =>
  section?.id || section?.key || section?.name || `section-${sIndex}`;

const getInfoFieldKey = (item: any, index: number) =>
  item?.key || item?.value || item?.name || `info-${index}`;

type QuestionCardProps = {
  item: any;
  sIndex: number;
  oIndex: number;
  hasError: boolean;
  onUpdateAnswerValue: (sIndex: number, oIndex: number, value: any) => void;
  onUpdateRatingVote: (sIndex: number, oIndex: number, score: number) => void;
};

const QuestionCard = memo(function QuestionCard({
  item,
  sIndex,
  oIndex,
  hasError,
  onUpdateAnswerValue,
  onUpdateRatingVote,
}: QuestionCardProps) {
  const iosInputClass = `
    w-full min-h-[46px] rounded-2xl border bg-white/80 backdrop-blur-md
    px-4 py-2 text-[15px] text-slate-700 shadow-sm outline-none transition-all duration-200
    placeholder:text-slate-400 hover:shadow-md
    ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
        : "border-slate-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
    }
  `;

  const renderAnswerField = () => {
    switch (item.answerType) {
      case "score1_5":
        return (
          <div className="w-full">
            <div
              className={`rounded-2xl p-2 ${
                hasError
                  ? "border border-red-500 bg-red-50/60"
                  : "border border-transparent"
              }`}
            >
              <div className="flex flex-nowrap items-center justify-center gap-1 overflow-x-auto md:justify-end">
                {RATING_OPTIONS.map((score) => {
                  const active = item.ratingVote?.value === score;

                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => onUpdateRatingVote(sIndex, oIndex, score)}
                      className={`
                        inline-flex h-9 cursor-pointer select-none items-center justify-center
                        rounded-full border px-3 text-xs font-medium transition-all duration-200
                        sm:h-10 sm:px-4 sm:text-sm
                        ${
                          active
                            ? "border-primary-700 bg-primary-700 text-white shadow-md shadow-blue-200"
                            : hasError
                              ? "border-red-300 bg-white text-slate-700 hover:border-red-400"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        }
                      `}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
            </div>

            {hasError && (
              <small className="mt-2 block text-red-500">
                Vui lòng chọn câu trả lời
              </small>
            )}
          </div>
        );

      case "single_choice":
        return (
          <div className="w-full">
            <Dropdown
              value={item.answerValue || null}
              onChange={(e) => onUpdateAnswerValue(sIndex, oIndex, e.value)}
              options={item.answerOptions || []}
              optionLabel="value"
              optionValue="value"
              placeholder="-- Chọn đáp án --"
              className="w-full"
              pt={{
                root: {
                  className: `
                    w-full min-h-[46px] rounded-2xl border bg-white/80 backdrop-blur-md shadow-sm
                    transition-all duration-200 hover:shadow-md
                    ${
                      hasError
                        ? "border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-100"
                        : "border-slate-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100"
                    }
                  `,
                },
                input: {
                  className:
                    "px-4 py-2 text-[15px] font-medium text-slate-700 placeholder:text-slate-400",
                },
                trigger: {
                  className: "w-12 text-slate-400",
                },
                panel: {
                  className:
                    "mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl",
                },
                wrapper: {
                  className: "p-2",
                },
                item: ({ context }: any) => ({
                  className: `
                    mx-1 my-1 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-150
                    ${
                      context.selected
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
                    }
                  `,
                }),
              }}
            />

            {hasError && (
              <small className="mt-2 block text-red-500">
                Vui lòng chọn câu trả lời
              </small>
            )}
          </div>
        );

      case "percentage":
        return (
          <div className="w-full">
            <div className="relative w-full">
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Nhập %"
                className={`${iosInputClass} pr-10`}
                value={item.answerValue || ""}
                onChange={(e) =>
                  onUpdateAnswerValue(sIndex, oIndex, e.target.value)
                }
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                %
              </span>
            </div>

            {hasError && (
              <small className="mt-2 block text-red-500">
                Vui lòng nhập phần trăm
              </small>
            )}
          </div>
        );

      case "text":
        return (
          <div className="w-full">
            <input
              type="text"
              placeholder="Nhập nội dung"
              className={iosInputClass}
              value={item.answerValue || ""}
              onChange={(e) =>
                onUpdateAnswerValue(sIndex, oIndex, e.target.value)
              }
            />

            {hasError && (
              <small className="mt-2 block text-red-500">
                Vui lòng nhập nội dung
              </small>
            )}
          </div>
        );

      default:
        return (
          <span className="text-sm text-slate-400">Không có kiểu trả lời</span>
        );
    }
  };

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border bg-white shadow-sm ${
        hasError ? "border-red-500 ring-2 ring-red-200" : "border-slate-200"
      }`}
    >
      <div
        className={`px-4 py-4 ${
          hasError
            ? "border-b border-red-200 bg-red-50/60"
            : "border-b border-slate-200/70"
        }`}
      >
        <div className="mb-3 flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
              hasError
                ? "border-red-300 bg-red-100 text-red-600"
                : "border-slate-300 bg-slate-50 text-slate-600"
            }`}
          >
            {oIndex + 1}
          </div>

          <div
            className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
              hasError ? "text-red-400" : "text-slate-400"
            }`}
          >
            Câu hỏi
          </div>
        </div>

        <div className="text-[15px] leading-7 text-slate-700">
          {item.content}
        </div>
      </div>

      <div className="px-4 py-4">
        <div
          className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            hasError ? "text-red-500" : "text-slate-400"
          }`}
        >
          Trả lời <span className="text-red-500">*</span>
        </div>

        <div className="w-full">{renderAnswerField()}</div>
      </div>
    </div>
  );
});

export default function SurveyForm({ id, type, formJson, survey_key }: any) {
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const { info = [], data = [], name, description } = formJson || {};

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
    return roman[num] || num;
  };

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [customerName, setCustomerName] = useState("");
  const [fullNameError, setFullNameError] = useState(false);
  const [infoErrors, setInfoErrors] = useState<Record<string, boolean>>({});
  const [tableData, setTableData] = useState<any[]>(data);
  const [openSection, setOpenSection] = useState<number | null>(() => {
    const firstIndex = data.findIndex((section: any) => section?.status);
    return firstIndex !== -1 ? firstIndex : null;
  });
  const [checkRating] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    setOpenSection((prev) => {
      const next = prev === index ? null : index;

      if (next !== null) {
        requestAnimationFrame(() => {
          sectionRefs.current[next]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }

      return next;
    });
  }, []);

  const clearQuestionError = useCallback((sIndex: number, oIndex: number) => {
    const key = `${sIndex}-${oIndex}`;
    setErrors((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: false,
      };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    console.log("handleSubmit called, submittingRef:", submittingRef.current);
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const newErrors: Record<string, boolean> = {};
    const newInfoErrors: Record<string, boolean> = {};
    let firstErrorSection: number | null = null;
    let isValid = true;

    if (!customerName.trim()) {
      setFullNameError(true);
      isValid = false;
    } else {
      setFullNameError(false);
    }

    info.forEach((item: any, index: number) => {
      if (!item.status) return;

      const key = getInfoFieldKey(item, index);
      const value = formData[key];

      const realValue =
        value && typeof value === "object" && "value" in value
          ? value.value
          : value;

      const isEmpty =
        realValue === undefined ||
        realValue === null ||
        String(realValue).trim() === "";

      if (isEmpty) {
        newInfoErrors[key] = true;
        isValid = false;
      }
    });

    tableData.forEach((section: any, sIndex: number) => {
      if (!section.status) return;

      section.option?.forEach((item: any, oIndex: number) => {
        if (!item.status) return;

        const key = `${sIndex}-${oIndex}`;
        let isEmpty = false;

        switch (item.answerType) {
          case "score1_5":
            isEmpty =
              item.ratingVote?.value === undefined ||
              item.ratingVote?.value === null ||
              item.ratingVote?.value === -1 ||
              item.ratingVote?.value === "";
            break;

          case "single_choice":
          case "percentage":
          case "text":
            isEmpty =
              item.answerValue === undefined ||
              item.answerValue === null ||
              String(item.answerValue).trim() === "";
            break;

          default:
            isEmpty = false;
            break;
        }

        if (isEmpty) {
          newErrors[key] = true;

          if (firstErrorSection === null) {
            firstErrorSection = sIndex;
          }

          isValid = false;
        }
      });
    });

    setErrors(newErrors);
    setInfoErrors(newInfoErrors);

    if (!isValid) {
      if (firstErrorSection !== null) {
        setOpenSection(firstErrorSection);

        requestAnimationFrame(() => {
          sectionRefs.current[firstErrorSection!]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }

      toast.current?.show({
        severity: "error",
        summary: "Thiếu thông tin",
        detail: "Vui lòng nhập đầy đủ các trường bắt buộc trước khi gửi",
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
          life: 2000,
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
  }, [customerName, formData, id, info, name, description, navigate, survey_key, tableData, type]);

  const updateAnswerValue = useCallback(
    (sIndex: number, oIndex: number, value: any) => {
      setTableData((prev) =>
        prev.map((section, si) => {
          if (si !== sIndex) return section;

          return {
            ...section,
            option: section.option.map((item: any, oi: number) => {
              if (oi !== oIndex) return item;

              return {
                ...item,
                answerValue: value,
              };
            }),
          };
        }),
      );

      const isFilled =
        value !== undefined && value !== null && String(value).trim() !== "";

      if (isFilled) {
        clearQuestionError(sIndex, oIndex);
      }
    },
    [clearQuestionError],
  );

  const updateRatingVote = useCallback(
    (sIndex: number, oIndex: number, score: number) => {
      setTableData((prev) =>
        prev.map((section, si) => {
          if (si !== sIndex) return section;

          return {
            ...section,
            option: section.option.map((item: any, oi: number) => {
              if (oi !== oIndex) return item;

              return {
                ...item,
                ratingVote: {
                  ...item.ratingVote,
                  value: score,
                },
                answerValue: score,
              };
            }),
          };
        }),
      );

      clearQuestionError(sIndex, oIndex);
    },
    [clearQuestionError],
  );

  return (
    <div className="mx-auto mt-4 w-[100%] sm:mt-6 xl:w-[88%] 2xl:w-[92%]">
      <Toast ref={toast} />

      <div className="mb-6 rounded-[28px] border border-white/60 bg-white/70 p-5 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
          {name}
        </h2>
        <span className="mt-2 block text-sm text-slate-500 sm:text-base">
          {description}
        </span>
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
              Họ và Tên
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
        {(info ?? [])
          .filter((item: any) => item?.status)
          .map((item: any, index: number) => {
            const fieldKey = getInfoFieldKey(item, index);
            const hasError = !!infoErrors[fieldKey];

            return (
              <div
                key={fieldKey}
                className={`rounded-[24px] p-4 shadow-sm backdrop-blur-xl ${
                  hasError
                    ? "border border-red-400 bg-red-50/80 ring-2 ring-red-200"
                    : "border border-white/60 bg-white/70"
                }`}
              >
                <SurveyInfo
                  info={item}
                  fieldKey={fieldKey}
                  value={formData[fieldKey]}
                  onChange={handleChange}
                  error={hasError}
                  survey_key={survey_key}
                  form_id={id}
                />
              </div>
            );
          })}
      </div>

      {!checkRating && (
        <div className="mb-6 overflow-hidden rounded-[28px]  border border-slate-200 bg-white/75 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {RATING_GUIDE.map((item, idx, arr) => (
              <div
                key={item.score}
                className={`p-4 text-center  ${
                  idx !== arr.length - 1
                    ? "border-b border-slate-200 md:border-b-0 xl:border-r"
                    : ""
                }`}
              >
                <div className="mb-2 flex justify-center ">
                  <div className="flex h-9 w-9 items-center  justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm">
                    {item.score}
                  </div>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-700">
                  {item.text1}
                </div>
                {item.text2 && (
                  <div className="mt-1 text-xs italic text-slate-400">
                    {item.text2}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        {tableData.map((section: any, sIndex: number) => {
          if (!section.status) return null;

          const sectionHasError = section.option?.some(
            (item: any, oIndex: number) =>
              item.status && errors[`${sIndex}-${oIndex}`],
          );

          return (
            <div
              key={getSectionKey(section, sIndex)}
              ref={(el) => {
                sectionRefs.current[sIndex] = el;
              }}
            >
              <button
                type="button"
                onClick={() => toggleSection(sIndex)}
                className={`flex w-full items-center gap-3 px-4 py-4 text-left text-white transition-all hover:brightness-110 ${
                  sectionHasError ? "bg-red-500" : "bg-primary-800"
                }`}
              >
                <i
                  className={`pi ${
                    openSection === sIndex
                      ? "pi-chevron-down"
                      : "pi-chevron-right"
                  } text-xs`}
                />

                <span className="min-w-[30px] font-semibold ">
                  {toRoman(sIndex)}
                </span>

                <span className="text-sm font-semibold sm:text-base">
                  {section.name}
                </span>

                {sectionHasError && (
                  <span className="ml-auto rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    Thiếu thông tin
                  </span>
                )}
              </button>

              {openSection === sIndex && (
                <div className="space-y-4 p-3 sm:p-4">
                  {section.option?.map((item: any, oIndex: number) => {
                    if (!item.status) return null;

                    const questionKey = getQuestionKey(item, sIndex, oIndex);

                    return (
                      <QuestionCard
                        key={questionKey}
                        item={item}
                        sIndex={sIndex}
                        oIndex={oIndex}
                        hasError={!!errors[`${sIndex}-${oIndex}`]}
                        onUpdateAnswerValue={updateAnswerValue}
                        onUpdateRatingVote={updateRatingVote}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-4 mt-6 flex justify-end">
        <Button
          label={submitting ? "Đang gửi..." : "Gửi biểu mẫu"}
          icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-send"}
          onClick={handleSubmit}
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
