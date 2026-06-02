import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  FileBadge,
  FileCheck2,
  MapPin,
  Save,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { Toast } from "primereact/toast";
import {
  Button,
  Dropdown,
  InputText,
  InputTextarea,
} from "@/components/prime";
import {
  tradingFacilitiesService,
  type TradingFacility,
  type TradingFacilityPayload,
} from "../services/tradingFacilitiesService";

interface TradingFacilityFormProps {
  initialData?: TradingFacility | null;
  onClose: () => void;
  onSave: () => void;
}

type FormState = TradingFacilityPayload;

const TRADING_TYPE_OPTIONS = [
  { label: "Bán buôn", value: "wholesale" },
  { label: "Bán lẻ", value: "retail" },
];

const STATUS_OPTIONS = [
  { label: "Đang hoạt động", value: true },
  { label: "Ngừng hoạt động", value: false },
];

const defaultFormState: FormState = {
  certificate_number: "",
  name: "",
  person_in_charge: "",
  practice_certificate: "",
  facility_type: "",
  trading_type: "retail",
  address: "",
  issue_date: "",
  gps_number: "",
  gps_issue_date: "",
  is_active: true,
};

const TradingFacilityForm: React.FC<TradingFacilityFormProps> = ({
  initialData,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        certificate_number: initialData.certificate_number || "",
        name: initialData.name || "",
        person_in_charge: initialData.person_in_charge || "",
        practice_certificate: initialData.practice_certificate || "",
        facility_type: initialData.facility_type || "",
        trading_type: initialData.trading_type || "retail",
        address: initialData.address || "",
        issue_date: initialData.issue_date || "",
        gps_number: initialData.gps_number || "",
        gps_issue_date: initialData.gps_issue_date || "",
        is_active: Boolean(initialData.is_active),
      });
      return;
    }

    setFormData(defaultFormState);
  }, [initialData]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.certificate_number.trim()) {
      nextErrors.certificate_number =
        "Số giấy chứng nhận không được để trống";
    }
    if (!formData.name.trim()) {
      nextErrors.name = "Tên cơ sở không được để trống";
    }
    if (!formData.person_in_charge.trim()) {
      nextErrors.person_in_charge = "Người phụ trách không được để trống";
    }
    if (!formData.facility_type.trim()) {
      nextErrors.facility_type = "Loại hình cơ sở không được để trống";
    }
    if (!formData.address.trim()) {
      nextErrors.address = "Địa chỉ không được để trống";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setFormData((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[key];
      return nextErrors;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Vui lòng nhập đầy đủ các trường bắt buộc",
      });
      return;
    }

    setLoading(true);
    try {
      const payload: TradingFacilityPayload = {
        certificate_number: formData.certificate_number.trim(),
        name: formData.name.trim(),
        person_in_charge: formData.person_in_charge.trim(),
        practice_certificate: formData.practice_certificate.trim(),
        facility_type: formData.facility_type.trim(),
        trading_type: formData.trading_type,
        address: formData.address.trim(),
        issue_date: formData.issue_date.trim(),
        gps_number: formData.gps_number.trim(),
        gps_issue_date: formData.gps_issue_date.trim(),
        is_active: formData.is_active,
      };

      if (initialData?.id) {
        await tradingFacilitiesService.update(initialData.id, payload);
      } else {
        await tradingFacilitiesService.create(payload);
      }

      onSave();
    } catch (error: any) {
      console.error("Save trading facility error:", error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail:
          error?.message || "Không thể lưu thông tin cơ sở bán buôn / bán lẻ",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Toast ref={toast} />
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-emerald-700 p-4 text-white">
          <h3 className="flex items-center gap-2 font-bold">
            <Building2 size={20} />
            {initialData
              ? "CHỈNH SỬA CƠ SỞ KINH DOANH DƯỢC"
              : "THÊM CƠ SỞ KINH DOANH DƯỢC"}
          </h3>
          <Button
            icon={<X size={20} />}
            text
            rounded
            onClick={onClose}
            className="!text-white hover:!bg-white/20"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,1fr)_280px]"
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Số giấy chứng nhận <span className="text-red-500">*</span>
                </label>
                <InputText
                  value={formData.certificate_number}
                  onChange={(e) =>
                    handleFieldChange("certificate_number", e.target.value)
                  }
                  placeholder="Ví dụ: 01-1223/ĐKKDD-HNO"
                  className={`w-full p-3 ${
                    errors.certificate_number
                      ? "border-red-500"
                      : "border-gray-200"
                  } rounded-lg border bg-gray-50 text-sm`}
                />
                {errors.certificate_number && (
                  <p className="mt-1 text-[10px] font-bold text-red-500">
                    {errors.certificate_number}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Hình thức kinh doanh
                </label>
                <Dropdown
                  value={formData.trading_type}
                  options={TRADING_TYPE_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(e) =>
                    handleFieldChange("trading_type", e.value)
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Tên cơ sở <span className="text-red-500">*</span>
              </label>
              <InputText
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="Nhập tên cơ sở"
                className={`w-full p-3 ${
                  errors.name ? "border-red-500" : "border-gray-200"
                } rounded-lg border bg-gray-50 text-sm`}
              />
              {errors.name && (
                <p className="mt-1 text-[10px] font-bold text-red-500">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Người phụ trách <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <UserRound size={15} />
                  </span>
                  <InputText
                    value={formData.person_in_charge}
                    onChange={(e) =>
                      handleFieldChange("person_in_charge", e.target.value)
                    }
                    placeholder="Nhập người phụ trách"
                    className={`w-full pl-10 p-3 ${
                      errors.person_in_charge
                        ? "border-red-500"
                        : "border-gray-200"
                    } rounded-lg border bg-gray-50 text-sm`}
                  />
                </div>
                {errors.person_in_charge && (
                  <p className="mt-1 text-[10px] font-bold text-red-500">
                    {errors.person_in_charge}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Chứng chỉ hành nghề
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FileCheck2 size={15} />
                  </span>
                  <InputText
                    value={formData.practice_certificate}
                    onChange={(e) =>
                      handleFieldChange(
                        "practice_certificate",
                        e.target.value,
                      )
                    }
                    placeholder="Nhập số chứng chỉ hành nghề"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 pl-10 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Loại hình cơ sở <span className="text-red-500">*</span>
                </label>
                <InputText
                  value={formData.facility_type}
                  onChange={(e) =>
                    handleFieldChange("facility_type", e.target.value)
                  }
                  placeholder="Ví dụ: Nhà thuốc, Quầy thuốc..."
                  className={`w-full p-3 ${
                    errors.facility_type
                      ? "border-red-500"
                      : "border-gray-200"
                  } rounded-lg border bg-gray-50 text-sm`}
                />
                {errors.facility_type && (
                  <p className="mt-1 text-[10px] font-bold text-red-500">
                    {errors.facility_type}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Trạng thái
                </label>
                <Dropdown
                  value={formData.is_active}
                  options={STATUS_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(e) => handleFieldChange("is_active", e.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <MapPin size={15} />
                </span>
                <InputTextarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  placeholder="Nhập địa chỉ đầy đủ"
                  autoResize
                  className={`w-full pl-10 p-3 ${
                    errors.address ? "border-red-500" : "border-gray-200"
                  } rounded-lg border bg-gray-50 text-sm`}
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-[10px] font-bold text-red-500">
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Ngày cấp giấy chứng nhận
                </label>
                <InputText
                  value={formData.issue_date}
                  onChange={(e) =>
                    handleFieldChange("issue_date", e.target.value)
                  }
                  placeholder="Ví dụ: 17/04 2026"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Số GPS
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FileBadge size={15} />
                  </span>
                  <InputText
                    value={formData.gps_number}
                    onChange={(e) =>
                      handleFieldChange("gps_number", e.target.value)
                    }
                    placeholder="Nhập số GPS"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 pl-10 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Ngày cấp GPS
                </label>
                <InputText
                  value={formData.gps_issue_date}
                  onChange={(e) =>
                    handleFieldChange("gps_issue_date", e.target.value)
                  }
                  placeholder="Ví dụ: 17/04 2026"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <Button
                type="button"
                onClick={onClose}
                outlined
                label="HỦY BỎ"
                className="flex-1 rounded-xl border-gray-300 py-3 font-bold text-gray-600"
              />
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-xl shadow-emerald-100 hover:bg-emerald-700"
              >
                {initialData ? <Save size={20} /> : <Send size={20} />}
                {initialData ? "CẬP NHẬT" : "LƯU THÔNG TIN"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">
                Tóm tắt nhanh
              </p>
              <h4 className="mt-3 text-lg font-black text-gray-900">
                {formData.name || "Tên cơ sở"}
              </h4>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Giấy chứng nhận
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {formData.certificate_number || "Chưa nhập"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Hình thức
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {formData.trading_type === "wholesale"
                      ? "Bán buôn"
                      : "Bán lẻ"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Loại hình
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {formData.facility_type || "Chưa nhập"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Người phụ trách
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {formData.person_in_charge || "Chưa nhập"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Trạng thái
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                      formData.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {formData.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradingFacilityForm;
