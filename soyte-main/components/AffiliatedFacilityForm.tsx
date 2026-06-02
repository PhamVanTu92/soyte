import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  Send,
  X,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { api } from "../api";
import { Button, InputText } from "@/components/prime";
import { affiliatedFacilitiesService } from "../services/affiliatedFacilitiesService";

const FALLBACK_LOGO = "https://storage-vnportal.vnpt.vn/gov-hni/6749/soyte.png";

interface AffiliatedFacilityFormProps {
  initialData?: any;
  onClose: () => void;
  onSave: () => void;
}

const AffiliatedFacilityForm: React.FC<AffiliatedFacilityFormProps> = ({
  initialData,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useRef<Toast>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        logo: initialData.logo || initialData.logo_url || initialData.image_url || "",
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Tên đơn vị không được để trống";
    if (!formData.logo.trim()) newErrors.logo = "Logo không được để trống";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Dung lượng ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.",
      });
      return;
    }

    setUploading(true);
    try {
      const data = await api.upload(file);
      setFormData((prev) => ({ ...prev, logo: data.url }));
      if (!data?.message) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Tải logo lên thành công",
        });
      }
    } catch (error: any) {
      console.error("Upload logo error:", error);
      if (error.message && error.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể tải logo lên",
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    if (uploading) {
      toast.current?.show({
        severity: "info",
        summary: "Thông báo",
        detail: "Đang tải logo lên, vui lòng đợi",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        logo: formData.logo.trim(),
      };

      if (initialData?.id) {
        await affiliatedFacilitiesService.update(initialData.id, payload);
      } else {
        await affiliatedFacilitiesService.create(payload);
      }

      onSave();
    } catch (error: any) {
      console.error("Save affiliated facility error:", error);
      if (error.message && error.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể lưu đơn vị trực thuộc",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Toast ref={toast} />
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-primary-700 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2">
            <Building2 size={20} />
            {initialData
              ? "CHỈNH SỬA ĐƠN VỊ TRỰC THUỘC"
              : "THÊM ĐƠN VỊ TRỰC THUỘC"}
          </h3>
          <Button
            icon={<X size={20} />}
            text
            rounded
            onClick={onClose}
            className="!text-white hover:!bg-white/20"
          />
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Tên đơn vị <span className="text-red-500">*</span>
              </label>
              <InputText
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ví dụ: BV Đa khoa Đức Giang"
                className={`w-full p-3 bg-gray-50 border ${
                  errors.name ? "border-red-500" : "border-gray-200"
                } rounded-lg font-bold text-gray-800`}
              />
              {errors.name && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Logo <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_150px] gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <LinkIcon size={16} />
                  </span>
                  <InputText
                    value={formData.logo}
                    onChange={(e) =>
                      setFormData({ ...formData, logo: e.target.value })
                    }
                    placeholder="Link logo..."
                    className={`w-full pl-10 p-3 bg-gray-50 border ${
                      errors.logo ? "border-red-500" : "border-gray-200"
                    } rounded-lg text-sm`}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                  label="TẢI LÊN"
                  icon="pi pi-upload"
                  outlined
                  className="border-primary-600 text-primary-600 font-bold text-xs rounded-lg border"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              {errors.logo && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.logo}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                outlined
                label="HỦY BỎ"
                className="flex-1 border-gray-300 text-gray-600 font-bold py-3 rounded-xl"
              />
              <Button
                type="submit"
                disabled={loading || uploading}
                loading={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-xl shadow-primary-100 flex items-center justify-center gap-2"
              >
                {!loading && (
                  <>
                    {initialData ? <Save size={20} /> : <Send size={20} />}
                    {initialData ? "CẬP NHẬT" : "LƯU THÔNG TIN"}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Xem trước
            </h4>
            <div className="bg-white border border-gray-200 rounded-xl p-5 h-48 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 mb-3 flex items-center justify-center text-gray-300">
                {formData.logo ? (
                  <img
                    crossOrigin="anonymous"
                    src={formData.logo}
                    alt={formData.name || "Logo"}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      if (e.currentTarget.src !== FALLBACK_LOGO) {
                        e.currentTarget.src = FALLBACK_LOGO;
                      }
                    }}
                  />
                ) : (
                  <ImageIcon size={44} strokeWidth={1} />
                )}
              </div>
              <p className="text-xs font-black text-gray-700 uppercase leading-tight line-clamp-2">
                {formData.name || "Tên đơn vị"}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AffiliatedFacilityForm;
