import React, { useEffect, useRef, useState } from "react";
import {
  Database,
  Save,
  Send,
  X,
  FileText,
  Check,
} from "lucide-react";
import { Toast } from "primereact/toast";
import {
  Button,
  Dropdown,
  InputText,
  InputTextarea,
} from "@/components/prime";
import {
  datasetsService,
  type Dataset,
} from "../services/datasetsService";

interface DatasetRecordFormProps {
  dataset: Dataset;
  initialData?: any | null; // DatasetRecord
  onClose: () => void;
  onSave: () => void;
}

const isRequiredField = (fieldName: string) => {
  const name = fieldName.toLowerCase();
  return (
    name === "tên" ||
    name === "tên cơ sở" ||
    name === "họ và tên" ||
    name === "địa chỉ" ||
    name.includes("số giấy") ||
    name.includes("số chứng chỉ") ||
    name.includes("giấy phép")
  );
};

const DatasetRecordForm: React.FC<DatasetRecordFormProps> = ({
  dataset,
  initialData,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (initialData && initialData.data) {
      setFormData({ ...initialData.data });
      return;
    }

    const defaultState: Record<string, any> = {};
    dataset.fields.forEach((field) => {
      if (field.datatype === "enum" && field.values && field.values.length > 0) {
        defaultState[field.name] = field.values[0];
      } else {
        defaultState[field.name] = "";
      }
    });
    setFormData(defaultState);
  }, [initialData, dataset]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    dataset.fields.forEach((field) => {
      const val = formData[field.name];
      if (isRequiredField(field.name)) {
        if (val === undefined || val === null || String(val).trim() === "") {
          nextErrors[field.name] = `${field.name} không được để trống`;
        }
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((current) => ({ ...current, [fieldName]: value }));
    setErrors((current) => {
      if (!current[fieldName]) {
        return current;
      }
      const nextErrors = { ...current };
      delete nextErrors[fieldName];
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
      // Clean data before submitting
      const cleanedData: Record<string, any> = {};
      dataset.fields.forEach((field) => {
        const val = formData[field.name];
        if (field.datatype === "number") {
          cleanedData[field.name] = val !== "" && val !== undefined ? Number(val) : null;
        } else {
          cleanedData[field.name] = val !== undefined ? String(val).trim() : "";
        }
      });

      if (initialData?.id) {
        await datasetsService.updateRecord(dataset.code, initialData.id, cleanedData);
      } else {
        await datasetsService.createRecord(dataset.code, cleanedData);
      }

      onSave();
    } catch (error: any) {
      console.error("Save dataset record error:", error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: error?.message || "Không thể lưu thông tin bản ghi",
      });
    } finally {
      setLoading(false);
    }
  };

  // Find dynamic title and description fields for real-time summary preview
  const previewTitle = React.useMemo(() => {
    const candidates = ["Tên cơ sở", "Họ và tên", "Tên", "tên", "name"];
    for (const key of candidates) {
      const match = dataset.fields.find((f) => f.name.toLowerCase() === key.toLowerCase());
      if (match && formData[match.name]) {
        return String(formData[match.name]);
      }
    }
    // Fallback to first text field
    const firstTextField = dataset.fields.find((f) => f.datatype === "text");
    if (firstTextField && formData[firstTextField.name]) {
      return String(formData[firstTextField.name]);
    }
    return "Tên bản ghi";
  }, [dataset.fields, formData]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Toast ref={toast} />
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-primary-700 p-4 text-white">
          <h3 className="flex items-center gap-2 font-bold text-sm md:text-base uppercase tracking-wider">
            <Database size={20} className="text-cyan-200" />
            {initialData ? `Chỉnh sửa bản ghi - ${dataset.name}` : `Thêm bản ghi mới - ${dataset.name}`}
          </h3>
          <Button
            icon={<X size={20} />}
            text
            rounded
            onClick={onClose}
            className="!text-white hover:!bg-white/20"
          />
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          {/* Dynamic Fields Section */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {dataset.fields.map((field) => {
                const isRequired = isRequiredField(field.name);
                const hasError = !!errors[field.name];

                return (
                  <div
                    key={field.name}
                    className={
                      field.name.toLowerCase().includes("địa chỉ") ||
                      field.name.toLowerCase().includes("mô tả")
                        ? "md:col-span-2"
                        : ""
                    }
                  >
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1">
                      {field.name}
                      {isRequired && <span className="text-red-500">*</span>}
                      <span className="text-[10px] text-gray-400 normal-case font-medium font-mono">
                        ({field.datatype})
                      </span>
                    </label>

                    {field.datatype === "enum" ? (
                      <Dropdown
                        value={formData[field.name] || ""}
                        options={(field.values || []).map((v) => ({ label: v, value: v }))}
                        onChange={(e) => handleFieldChange(field.name, e.value)}
                        className="w-full text-sm"
                        placeholder={`Chọn ${field.name.toLowerCase()}`}
                      />
                    ) : field.name.toLowerCase().includes("địa chỉ") ||
                      field.name.toLowerCase().includes("mô tả") ? (
                      <InputTextarea
                        rows={3}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={`Nhập ${field.name.toLowerCase()}`}
                        autoResize
                        className={`w-full p-3 ${
                          hasError ? "border-red-500" : "border-gray-200"
                        } rounded-lg border bg-gray-50 text-sm focus:ring-2 focus:ring-primary-100 outline-none`}
                      />
                    ) : (
                      <InputText
                        type={field.datatype === "number" ? "number" : "text"}
                        value={formData[field.name] !== undefined ? formData[field.name] : ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={`Nhập ${field.name.toLowerCase()}`}
                        className={`w-full p-3 ${
                          hasError ? "border-red-500" : "border-gray-200"
                        } rounded-lg border bg-gray-50 text-sm focus:ring-2 focus:ring-primary-100 outline-none`}
                      />
                    )}

                    {hasError && (
                      <p className="mt-1 text-[10px] font-bold text-red-500">
                        {errors[field.name]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 border-t border-gray-100 pt-5">
              <Button
                type="button"
                onClick={onClose}
                outlined
                label="HỦY BỎ"
                className="flex-1 rounded-xl border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-50 text-xs tracking-wider"
              />
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 py-3 font-bold text-white shadow-xl shadow-primary-100 text-xs tracking-wider transition-all"
              >
                {initialData ? <Save size={16} /> : <Send size={16} />}
                {initialData ? "CẬP NHẬT" : "LƯU THÔNG TIN"}
              </Button>
            </div>
          </div>

          {/* Premium Preview Panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/80 to-cyan-50/50 p-5 shadow-inner">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-600">
                Xem trước bản ghi
              </p>
              <h4 className="mt-3 text-base font-black text-gray-900 line-clamp-2">
                {previewTitle}
              </h4>
              <div className="mt-4 space-y-3.5 text-xs text-gray-600 border-t border-gray-100/80 pt-4">
                {dataset.fields.slice(0, 6).map((field) => {
                  const val = formData[field.name];
                  if (val === undefined || val === null || val === "") return null;
                  return (
                    <div key={field.name} className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {field.name}
                      </span>
                      <span className="mt-0.5 font-semibold text-gray-800 break-words leading-relaxed">
                        {field.datatype === "number" && typeof val === "number"
                          ? val.toLocaleString("vi-VN")
                          : String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DatasetRecordForm;
