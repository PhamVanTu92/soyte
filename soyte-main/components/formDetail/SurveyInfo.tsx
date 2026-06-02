import { socialFacilitiesService } from "@/services/socialFacilitiesService";
import { api } from "@/api";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/AuthContext";
import {
  SocialFacilityDropdown,
  SocialFacilityOption,
} from "@/components/feedbacks/SocialFacilityDropdown";

export default function SurveyInfo({
  info,
  fieldKey,
  value,
  onChange,
  error,
  survey_key,
  form_id,
}) {
  const { user } = useAuth();

  // State kiểm tra đơn vị đã khai báo chưa
  const [checkUnitStatus, setCheckUnitStatus] = useState<
    null | "checking" | "declared" | "not_declared"
  >(null);
  const [checkUnitMessage, setCheckUnitMessage] = useState<string>("");
  const checkUnitAbortRef = useRef<AbortController | null>(null);
  const [initializingFacility, setInitializingFacility] = useState(false);

  const INPUT_HEIGHT = "h-[45px]";
  const commonInputClass = `
  w-full ${INPUT_HEIGHT} rounded-xl border bg-white px-4 text-[15px] text-slate-700
  shadow-sm outline-none transition-all duration-200
  ${error
      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
      : "border-slate-300 hover:border-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
    }
`;

  const dropdownPt = {
    root: {
      className: `
      w-full ${INPUT_HEIGHT} rounded-xl border bg-white text-[15px] text-slate-700 shadow-sm transition-all duration-200
      ${error
          ? "border-red-500 ring-2 ring-red-100"
          : "border-slate-300 hover:border-slate-400 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100"
        }
    `,
    },
    input: {
      className: "flex items-center h-full px-4 text-[15px] text-slate-700",
    },
    trigger: {
      className: "w-10 h-full flex items-center justify-center text-slate-400",
    },
    panel: {
      className:
        "mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl",
    },
    wrapper: { className: "max-h-60" },
    item: ({ context }) => ({
      className: `
      px-4 py-2 text-[14px] cursor-pointer transition-colors
      ${context.selected
          ? "bg-blue-500 text-white"
          : "text-slate-700 hover:bg-blue-50"
        }
    `,
    }),
    filterInput: {
      className:
        "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
    },
  };

  const typeFilter = useMemo(() => {
    if (!info.facilityTypeFilter?.length) return "";
    return Array.isArray(info.facilityTypeFilter)
      ? info.facilityTypeFilter.join(",")
      : info.facilityTypeFilter;
  }, [info.facilityTypeFilter]);

  const staticOptions = useMemo(
    () => (Array.isArray(info.option) ? info.option : []),
    [info.option],
  );

  const isSelectField =
    info.type === "select" || info.type === "facility_multiselect";
  const isFacilityField =
    isSelectField && (!!typeFilter || staticOptions.length === 0);

  const selectOptions = useMemo(() => {
    const options = [...staticOptions];
    const unitId = user?.unit;

    if (unitId && isSelectField) {
      const matchedOption = options.find(
        (opt) => String(opt.key) === String(unitId),
      );
      if (matchedOption) {
        return [matchedOption];
      }
    }
    return options;
  }, [isSelectField, staticOptions, user?.unit]);

  const initializedKey = useRef<string | null>(null);

  useEffect(() => {
    if (value?.value || initializedKey.current === fieldKey) return;

    if (info.type === "date") {
      onChange(fieldKey, {
        key: info.key,
        value: new Date().toISOString(),
      });
      initializedKey.current = fieldKey;
      return;
    }

    if (!isSelectField) return;

    const unitId = user?.unit;
    if (!unitId) {
      initializedKey.current = fieldKey;
      return;
    }

    const matchedOption = staticOptions.find(
      (opt) => String(opt.key) === String(unitId),
    );

    if (matchedOption) {
      onChange(fieldKey, {
        key: info.key,
        value: matchedOption,
      });
      initializedKey.current = fieldKey;
      return;
    }

    if (!isFacilityField || initializingFacility) return;

    let cancelled = false;
    setInitializingFacility(true);

    socialFacilitiesService
      .getById(String(unitId))
      .then((facility) => {
        if (cancelled || !facility?.id) return;
        onChange(fieldKey, {
          key: info.key,
          value: {
            key: facility.id,
            value: facility.name,
          },
        });
        initializedKey.current = fieldKey;
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to initialize selected facility:", error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setInitializingFacility(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    fieldKey,
    info.key,
    info.type,
    initializingFacility,
    isFacilityField,
    isSelectField,
    onChange,
    staticOptions,
    user?.unit,
    value?.value,
  ]);

  const handleFacilityChange = useCallback(
    (selectedOption: SocialFacilityOption | null) => {
      onChange(fieldKey, {
        key: info.key,
        value: selectedOption,
      });

      if (selectedOption && survey_key && form_id) {
        if (checkUnitAbortRef.current) {
          checkUnitAbortRef.current.abort();
        }
        const controller = new AbortController();
        checkUnitAbortRef.current = controller;
        setCheckUnitStatus("checking");

        api
          .get("/feedbacks-new/check-unit", {
            survey_key: survey_key,
            unit_id: selectedOption.key,
            form_id: Number(form_id),
          })
          .then((res) => {
            if (controller.signal.aborted) return;
            const msg = (res?.message || "").toLowerCase();
            let isDeclared = false;

            if (res?.data !== undefined) {
              isDeclared = res.data === true;
            } else if (res?.declared !== undefined) {
              isDeclared = res.declared === true;
            } else if (res?.exists !== undefined) {
              isDeclared = res.exists === true;
            } else if (typeof res === "boolean") {
              isDeclared = res;
            } else if (msg) {
              isDeclared = !msg.includes("chưa");
            } else {
              isDeclared = res?.success === true;
            }

            setCheckUnitStatus(isDeclared ? "declared" : "not_declared");
            setCheckUnitMessage(res?.message || "");
          })
          .catch((err) => {
            if (controller.signal.aborted) return;
            console.error("check-unit error:", err);
            setCheckUnitStatus(null);
          });
      } else {
        setCheckUnitStatus(null);
      }
    },
    [fieldKey, form_id, info.key, onChange, survey_key],
  );

  const isReadOnly =
    info.title?.toLowerCase().includes("ngày điền") ||
    info.value === "ngay_ien" ||
    info.key === "ngay_ien";

  const isLockedToUnit =
    !!user &&
    user.role !== "admin" &&
    isSelectField;

  const renderField = () => {
    switch (info.type) {
      case "text":
        return (
          <input
            type="text"
            disabled={isReadOnly}
            value={value?.value || ""}
            className={`${commonInputClass} ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`}
            onChange={(e) =>
              onChange(fieldKey, {
                key: info.key,
                value: e.target.value,
              })
            }
            placeholder={info.placeholder || "Nhập nội dung"}
          />
        );

      case "number":
        return (
          <input
            type="number"
            disabled={isReadOnly}
            value={value?.value || ""}
            className={`${commonInputClass} ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`}
            onChange={(e) =>
              onChange(fieldKey, {
                key: info.key,
                value: e.target.value,
              })
            }
            placeholder={info.placeholder || "Nhập số"}
          />
        );

      case "date":
        return (
          <Calendar
            value={value?.value ? new Date(value.value) : null}
            disabled={isReadOnly}
            onChange={(e) =>
              onChange(fieldKey, {
                key: info.key,
                value: e.value ? new Date(e.value).toISOString() : "",
              })
            }
            dateFormat="dd/mm/yy"
            className="w-full"
            inputClassName={`${commonInputClass} ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`}
            pt={{
              root: { className: "w-full" },
              input: {
                className: `${commonInputClass} ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`,
              },
            }}
          />
        );

      case "select":
      case "facility_multiselect":
        if (isFacilityField) {
          return (
            <SocialFacilityDropdown
              value={value?.value ?? null}
              onChange={handleFacilityChange}
              type={typeFilter || undefined}
              initialOptions={staticOptions}
              placeholder="Chọn"
              filterPlaceholder="Tìm kiếm..."
              disabled={isReadOnly || isLockedToUnit}
              className={`w-full ${isLockedToUnit ? "opacity-90 bg-slate-50 cursor-not-allowed" : ""}`}
              pt={dropdownPt}
              restrictToValueId={isLockedToUnit ? user?.unit : undefined}
            />
          );
        }

        return (
          <Dropdown
            value={value?.value?.key ?? null}
            options={selectOptions}
            optionLabel="value"
            optionValue="key"
            placeholder="Chọn"
            filter
            disabled={isReadOnly || isLockedToUnit}
            filterPlaceholder="Tìm kiếm..."
            className={`w-full ${isLockedToUnit ? "opacity-90 bg-slate-50 cursor-not-allowed" : ""}`}
            pt={dropdownPt}
            onChange={(e) => {
              const selectedOption =
                selectOptions.find(
                  (opt) => String(opt.key) === String(e.value),
                ) || null;
              handleFacilityChange(selectedOption);
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-2 min-h-[48px]">
        <label className="mb-1 block font-medium text-slate-700">
          {info.title}{" "}
          {info.isValidate !== false && !isReadOnly && (
            <span className="text-red-500">*</span>
          )}
        </label>
      </div>
      {renderField()}
      {/* Badge trạng thái kiểm tra đơn vị */}
      {(info.type === "select" || info.type === "facility_multiselect") &&
        checkUnitStatus && (
          <div className="mt-2">
            {checkUnitStatus === "checking" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                Đang kiểm tra...
              </span>
            )}
            {checkUnitStatus === "declared" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <svg
                  className="h-3.5 w-3.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {checkUnitMessage || "Đơn vị này đã khai báo rồi"}
              </span>
            )}
            {checkUnitStatus === "not_declared" && checkUnitMessage && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <svg
                  className="h-3.5 w-3.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {checkUnitMessage}
              </span>
            )}
          </div>
        )}
      {error && (
        <div className="mt-2 text-sm text-red-500">
          Vui lòng nhập thông tin này
        </div>
      )}
    </div>
  );
}
