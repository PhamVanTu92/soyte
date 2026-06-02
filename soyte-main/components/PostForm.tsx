import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Save,
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
} from "lucide-react";
import { SERVICE_CATEGORIES_FILTER } from "../constants";
import { api } from "../api";
import {
  Dropdown,
  InputText,
  InputTextarea,
  Editor,
  Button,
} from "@/components/prime";
import { Toast } from "primereact/toast";

interface PostFormProps {
  initialData?: any;
  onClose: () => void;
  onSave: () => void;
}
type Status = "draft" | "published";

const statusOptions: { label: string; value: Status }[] = [
  { label: "Bản nháp (Draft)", value: "draft" },
  { label: "Công khai (Published)", value: "published" },
];
const PostForm: React.FC<PostFormProps> = ({
  initialData,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category: "",
    status: "published",
    imageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useRef<Toast>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        summary: initialData.summary || "",
        content: initialData.content || "",
        category: initialData.category || initialData.category_id || "",
        status: initialData.status || "draft",
        imageUrl: initialData.imageUrl || initialData.image_url || "",
      });
    }
  }, [initialData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.current?.show({ severity: 'warn', summary: 'Cảnh báo', detail: 'Dung lượng ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.' });
      return;
    }
    setUploading(true);
    try {
      const data = await api.upload(file);
      if (!data?.message) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Tải ảnh lên thành công",
        });
      }
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      setUploading(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      if (err.message && err.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Lỗi tải ảnh công vụ",
        });
      }
      setUploading(false);
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.title.trim()) newErrors.title = "Tiêu đề không được để trống";
    if (!formData.category) newErrors.category = "Vui lòng chọn danh mục";
    if (!formData.imageUrl.trim()) newErrors.imageUrl = "Vui lòng chọn ảnh đại diện";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()){
      toast.current?.show({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng điền đầy đủ các trường bắt buộc' });
      return;
    }
    if (uploading) {
      toast.current?.show({ severity: 'info', summary: 'Thông báo', detail: 'Đang tải ảnh lên, vui lòng đợi' });
      return
    };

    setLoading(true);
    try {
      const postData: any = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        category_id: formData.category,
        status: formData.status,
        image_url: formData.imageUrl,
      };

      let res;
      if (initialData?.id) {
        res = await api.put(`/posts/${initialData.id}`, postData);
      } else {
        res = await api.post("/posts", postData);
      }
      if (!res?.message) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Lưu bài viết thành công",
        });
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving post:", error);
      if (error.message && error.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Lỗi lưu bài viết",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = SERVICE_CATEGORIES_FILTER.map((cat) => ({
    label: cat.title,
    value: cat.id,
  }));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Toast ref={toast} />
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        <div className="bg-primary-700 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold flex items-center gap-2">
            {initialData ? <Save size={20} /> : <Send size={20} />}
            {initialData ? "CHỈNH SỬA BÀI VIẾT" : "SOẠN THẢO BÀI VIẾT MỚI"}
          </h3>
          <Button
            icon={<X size={20} />}
            text
            rounded
            onClick={onClose}
            className="!text-white hover:!bg-white/20"
          />
        </div>

        <div className="flex flex-col lg:flex-row overflow-hidden flex-grow">
          <form
            onSubmit={handleSubmit}
            id="post-form"
            className="flex-grow p-6 space-y-4 overflow-y-auto no-scrollbar"
          >
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4">
              <p className="text-[11px] text-blue-700 font-bold flex items-center gap-2">
                <Clock size={14} /> LƯU Ý: Bài viết cần tuân thủ quy định về
                phát ngôn và bảo mật thông tin ngành y tế.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Tiêu đề bài viết <span className="text-red-500">*</span>
              </label>
              <InputText
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nhập tiêu đề bài viết..."
                className={`w-full p-3 bg-gray-50 border ${
                  errors.title ? "border-red-500" : "border-gray-200"
                } rounded-lg font-bold text-gray-800`}
                pt={{
                  root: {
                    className:
                      "focus:ring-2 focus:ring-primary-100 outline-none",
                  },
                }}
              />
              {errors.title && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  value={formData.category}
                  options={categoryOptions}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.value })
                  }
                  placeholder="-Chọn danh mục-"
                  className={`w-full ${errors.category ? "p-invalid" : ""}`}
                  panelClassName="text-sm"
                  showClear
                />
                {errors.category && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">
                    {errors.category}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Trạng thái xuất bản
                </label>
                <Dropdown
                  value={formData.status}
                  options={statusOptions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.value as Status,
                    })
                  }
                  className="w-full"
                  placeholder="Chọn trạng thái"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Ảnh đại diện bài viết <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <LinkIcon size={16} />
                  </div>
                  <span className="p-input-icon-left w-full">
                    <i className="pi pi-image text-gray-400 pl-3" />
                    <InputText
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, imageUrl: e.target.value })
                      }
                      placeholder="Link ảnh..."
                      className={`w-full pl-10 py-3 bg-gray-50 border ${
                        errors.imageUrl ? "border-red-500" : "border-gray-200"
                      } rounded-lg text-xs`}
                    />
                  </span>
                  {errors.imageUrl && (
                    <p className="text-red-500 text-[10px] mt-1 font-bold">
                      {errors.imageUrl}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    loading={uploading}
                    label="TẢI ẢNH LÊN"
                    icon="pi pi-upload"
                    outlined
                    className="flex-1 border-primary-600 text-primary-600 font-bold text-xs rounded-lg border pl-2"
                  />

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Nội dung tóm tắt
              </label>
              <InputTextarea
                autoResize
                rows={2}
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="Nhập tóm tắt ngắn gọn..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Nội dung chi tiết
              </label>
              <Editor
                value={formData.content}
                onTextChange={(e) =>
                  setFormData({ ...formData, content: e.htmlValue })
                }
                placeholder="Nội dung bài viết đầy đủ..."
                style={{ height: "300px" }}
                pt={{
                  root: {
                    className:
                      "w-full bg-gray-50 border border-gray-200 rounded-xl",
                  },
                  content: {
                    className:
                      "text-sm font-medium leading-relaxed min-h-[300px]",
                  },
                }}
              />
            </div>
          </form>

          <div className="w-full lg:w-80 bg-gray-50 border-l border-gray-100 p-6 shrink-0 flex flex-col items-center">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 w-full">
              Xem trước
            </h4>
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                {formData.imageUrl ? (
                  <img
                    crossOrigin="anonymous"
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <ImageIcon size={48} strokeWidth={1} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h5 className="font-bold text-gray-800 text-sm leading-tight mb-2 line-clamp-2">
                  {formData.title || "Tiêu đề..."}
                </h5>
                <p className="text-[11px] text-gray-500 line-clamp-2">
                  {formData.summary || "Tóm tắt..."}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-100 flex gap-3 bg-gray-50 shrink-0 w-full mt-2">
              <Button
                type="submit"
                form="post-form"
                disabled={loading || uploading}
                loading={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary-100"
              >
                {!loading && (
                  <>
                    {initialData ? <Save size={20} /> : <Send size={20} />}
                    {initialData ? "CẬP NHẬT" : "XUẤT BẢN"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostForm;
