import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import AdminLayout from "../components/AdminLayout";
import { ScrollableTable } from "../components/common/ScrollableTable";
import { Banner, BannerPosition } from "../types";
import {
  Loader2,
  Plus,
  Edit3,
  Trash2,
  Image as ImageIcon,
  X,
  Save,
  Layout,
  ArrowUp,
  ArrowDown,
  Link2,
} from "lucide-react";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import {
  Button,
  InputText,
  Dropdown,
  InputNumber,
  InputSwitch,
} from "@/components/prime";

// Resolve relative `/uploads/...` paths returned by the backend to absolute URLs.
const resolveImageUrl = (url: string): string => {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) return url;
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const backendRoot = apiUrl.replace(/\/api\/?$/, "");
  return `${backendRoot}${url.startsWith("/") ? "" : "/"}${url}`;
};

const POSITION_OPTIONS: { label: string; value: BannerPosition }[] = [
  { label: "Đầu trang (top)", value: "top" },
  { label: "Cột trái (left)", value: "left" },
  { label: "Cột phải (right)", value: "right" },
  { label: "Chân trang (footer)", value: "footer" },
];

const POSITION_LABEL: Record<BannerPosition, string> = {
  top: "Đầu trang",
  left: "Cột trái",
  right: "Cột phải",
  footer: "Chân trang",
};

const POSITION_BADGE: Record<BannerPosition, string> = {
  top: "bg-blue-50 text-blue-700 border-blue-100",
  left: "bg-amber-50 text-amber-700 border-amber-100",
  right: "bg-purple-50 text-purple-700 border-purple-100",
  footer: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const BannersManagement: React.FC = () => {
  const toast = useRef<Toast>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPosition, setFilterPosition] = useState<BannerPosition | "">("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [reordering, setReordering] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterPosition) params.position = filterPosition;
      if (filterActive === "active") params.is_active = true;
      if (filterActive === "inactive") params.is_active = false;

      const response = await api.getBanners(params);
      const data = response?.data || response;
      const list = Array.isArray(data) ? data : [];
      // Sort by position then sort_order for stable display
      list.sort((a: Banner, b: Banner) => {
        if (a.position !== b.position) return a.position.localeCompare(b.position);
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
      setBanners(list);
    } catch (err) {
      console.error("Error loading banners:", err);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [filterPosition, filterActive]);

  const handleDelete = (banner: Banner) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa banner "${banner.title || `#${banner.id}`}"?`,
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "XÓA",
      rejectLabel: "HỦY BỎ",
      acceptClassName:
        "!bg-red-600 !border-red-600 hover:!bg-red-700 !px-6 !py-2.5 !rounded-xl !font-black !text-white !shadow-lg !shadow-red-100",
      rejectClassName:
        "!text-gray-600 hover:!bg-gray-50 !px-6 !py-2.5 !rounded-xl !font-black !border-none",
      accept: async () => {
        try {
          await api.deleteBanner(banner.id);
          fetchBanners();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await api.updateBanner(banner.id, {
        is_active: !banner.is_active,
      });
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMove = async (banner: Banner, dir: "up" | "down") => {
    const samePosition = banners.filter((b) => b.position === banner.position);
    const idx = samePosition.findIndex((b) => b.id === banner.id);
    if (idx < 0) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= samePosition.length) return;

    const reordered = [...samePosition];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const payload = reordered.map((b, i) => ({ id: b.id, sort_order: i }));

    try {
      setReordering(true);
      await api.reorderBanners(payload);
      fetchBanners();
    } catch (err) {
      console.error(err);
    } finally {
      setReordering(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: banners.length,
      active: banners.filter((b) => b.is_active).length,
      byPosition: POSITION_OPTIONS.reduce(
        (acc, p) => {
          acc[p.value] = banners.filter((b) => b.position === p.value).length;
          return acc;
        },
        {} as Record<BannerPosition, number>,
      ),
    };
  }, [banners]);

  return (
    <AdminLayout title="Quản lý Banner">
      <Toast ref={toast} />

      <BannerFormModal
        visible={modalOpen}
        banner={editingBanner}
        onHide={() => {
          setModalOpen(false);
          setEditingBanner(null);
        }}
        onSaveSuccess={() => {
          setModalOpen(false);
          setEditingBanner(null);
          fetchBanners();
        }}
      />

      {/* Stat cards */}
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Layout} title="Tổng banner" value={stats.total} color="blue" />
        <StatCard
          icon={ImageIcon}
          title="Đang hiển thị"
          value={stats.active}
          color="green"
        />
        {POSITION_OPTIONS.map((p) => (
          <StatCard
            key={p.value}
            icon={Layout}
            title={POSITION_LABEL[p.value]}
            value={stats.byPosition[p.value]}
            color="amber"
          />
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Filter / actions */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-4 md:p-6 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Dropdown
              value={filterPosition}
              options={[{ label: "Tất cả vị trí", value: "" }, ...POSITION_OPTIONS]}
              onChange={(e) => setFilterPosition(e.value)}
              placeholder="Lọc theo vị trí"
              className="w-full !bg-white !border-gray-200 !rounded-xl outline-none font-bold text-gray-700"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Dropdown
              value={filterActive}
              options={[
                { label: "Tất cả trạng thái", value: "all" },
                { label: "Đang hoạt động", value: "active" },
                { label: "Đã tắt", value: "inactive" },
              ]}
              onChange={(e) => setFilterActive(e.value)}
              className="w-full !bg-white !border-gray-200 !rounded-xl outline-none font-bold text-gray-700"
            />
          </div>
          <Button
            onClick={() => {
              setEditingBanner(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-secondary-100 transition-all transform hover:-translate-y-0.5 !bg-secondary-600 hover:!bg-secondary-700"
          >
            <Plus size={18} /> Thêm Banner
          </Button>
        </div>

        {/* Table */}
        <ScrollableTable>
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4 w-24">Ảnh</th>
                <th className="px-6 py-4">Tiêu đề</th>
                <th className="px-6 py-4">Vị trí</th>
                <th className="px-6 py-4">Liên kết</th>
                <th className="px-6 py-4 w-28 text-center">Thứ tự</th>
                <th className="px-6 py-4 w-32 text-center">Trạng thái</th>
                <th className="px-6 py-4 w-44 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Loader2
                      size={40}
                      className="animate-spin text-primary-600 mx-auto mb-4"
                    />
                    <p className="text-gray-400 font-bold uppercase text-[10px]">
                      Đang tải dữ liệu banner...
                    </p>
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <ImageIcon size={32} />
                    </div>
                    <p className="text-gray-400 font-bold">
                      Chưa có banner nào. Bấm "Thêm Banner" để tạo mới.
                    </p>
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr
                    key={banner.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="w-20 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                        {banner.image_url ? (
                          <img
                            src={resolveImageUrl(banner.image_url)}
                            alt={banner.title || "banner"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <ImageIcon size={20} className="text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 text-sm">
                        {banner.title || (
                          <span className="italic text-gray-400">
                            (không có tiêu đề)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">ID: {banner.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${POSITION_BADGE[banner.position]}`}
                      >
                        {POSITION_LABEL[banner.position] || banner.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {banner.link_url ? (
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary-700 hover:text-primary-800 font-bold underline-offset-2 hover:underline"
                        >
                          <Link2 size={12} />
                          {banner.link_url}
                        </a>
                      ) : (
                        <span className="text-xs italic text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          icon={<ArrowUp size={14} />}
                          text
                          rounded
                          className="w-7 h-7"
                          disabled={reordering}
                          onClick={() => handleMove(banner, "up")}
                        />
                        <span className="text-xs font-bold text-gray-700 w-6 text-center">
                          {banner.sort_order}
                        </span>
                        <Button
                          icon={<ArrowDown size={14} />}
                          text
                          rounded
                          className="w-7 h-7"
                          disabled={reordering}
                          onClick={() => handleMove(banner, "down")}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(banner)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${
                          banner.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${banner.is_active ? "bg-green-500" : "bg-gray-400"}`}
                        ></div>
                        {banner.is_active ? "Hoạt động" : "Đã tắt"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          icon={<Edit3 size={18} />}
                          text
                          rounded
                          className="w-9 h-9"
                          onClick={() => {
                            setEditingBanner(banner);
                            setModalOpen(true);
                          }}
                        />
                        <Button
                          icon={<Trash2 size={18} />}
                          text
                          rounded
                          severity="danger"
                          className="w-9 h-9"
                          onClick={() => handleDelete(banner)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollableTable>
      </div>
    </AdminLayout>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number | string;
  color: "blue" | "green" | "amber";
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 transition-all transform hover:-translate-y-0.5">
      <div
        className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center shrink-0`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-[9px] font-black uppercase truncate">
          {title}
        </p>
        <h3 className="text-xl font-black text-gray-800">{value}</h3>
      </div>
    </div>
  );
};

// ───────────────────────── Form Modal ─────────────────────────

interface BannerFormModalProps {
  visible: boolean;
  banner: Banner | null;
  onHide: () => void;
  onSaveSuccess: () => void;
}

const BannerFormModal: React.FC<BannerFormModalProps> = ({
  visible,
  banner,
  onHide,
  onSaveSuccess,
}) => {
  const isEdit = !!banner;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    position: "top" as BannerPosition,
    title: "",
    link_url: "",
    sort_order: 0,
    is_active: true,
    image_url: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setFile(null);
    if (isEdit && banner) {
      setFormData({
        position: banner.position,
        title: banner.title || "",
        link_url: banner.link_url || "",
        sort_order: banner.sort_order ?? 0,
        is_active: banner.is_active ?? true,
        image_url: banner.image_url || "",
      });
      setPreviewUrl(resolveImageUrl(banner.image_url || ""));
    } else {
      setFormData({
        position: "top",
        title: "",
        link_url: "",
        sort_order: 0,
        is_active: true,
        image_url: "",
      });
      setPreviewUrl("");
    }
  }, [visible, banner, isEdit]);

  // Free object URL when component unmounts or new file picked
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const acceptFile = (f: File | undefined | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, file: "Tệp phải là ảnh." }));
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: "Ảnh không được vượt quá 10MB." }));
      return;
    }
    setErrors((prev) => ({ ...prev, file: "" }));
    setFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0]);
    // reset so the same file can be re-picked after removal
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(isEdit && banner?.image_url ? banner.image_url : "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.position) newErrors.position = "Vui lòng chọn vị trí.";
    if (!isEdit && !file && !formData.image_url) {
      newErrors.file = "Vui lòng chọn ảnh hoặc nhập URL ảnh.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      // Use multipart when there's a file; otherwise send JSON
      let payload: FormData | Record<string, any>;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("position", formData.position);
        if (formData.title) fd.append("title", formData.title);
        if (formData.link_url) fd.append("link_url", formData.link_url);
        fd.append("sort_order", String(formData.sort_order ?? 0));
        fd.append("is_active", formData.is_active ? "true" : "false");
        payload = fd;
      } else {
        payload = {
          position: formData.position,
          title: formData.title || undefined,
          link_url: formData.link_url || undefined,
          sort_order: formData.sort_order ?? 0,
          is_active: formData.is_active,
          ...(formData.image_url ? { image_url: formData.image_url } : {}),
        };
      }

      if (isEdit && banner) {
        await api.updateBanner(banner.id, payload);
      } else {
        await api.createBanner(payload);
      }
      onSaveSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[640px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-primary-700 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold flex items-center gap-2 text-lg uppercase tracking-tight">
            {isEdit ? <Edit3 size={20} /> : <Plus size={20} />}
            {isEdit ? "Cập nhật Banner" : "Thêm Banner mới"}
          </h3>
          <Button
            icon={<X size={20} />}
            text
            rounded
            onClick={onHide}
            className="!text-white hover:!bg-white/20"
          />
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          {/* Image upload */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
              Ảnh banner {!isEdit && <span className="text-red-500">*</span>}
            </label>
            <label
              htmlFor="banner-file-input"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative block w-full aspect-[16/6] rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all bg-gray-50 hover:bg-gray-100 ${
                errors.file
                  ? "border-red-300"
                  : isDragging
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-primary-300"
              }`}
            >
              {previewUrl ? (
                <>
                  <img
                    crossOrigin="anonymous"
                    src={previewUrl}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                    <span className="px-3 py-1.5 bg-white text-gray-800 text-[10px] font-black uppercase rounded-lg shadow-md">
                      Đổi ảnh
                    </span>
                    {file && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          clearFile();
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg shadow-md hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon size={36} className="mb-2" />
                  <p className="text-[11px] font-bold uppercase">
                    Bấm hoặc kéo thả ảnh vào đây
                  </p>
                  <p className="text-[10px] mt-1 text-gray-300">PNG, JPG ≤ 10MB</p>
                </div>
              )}
              <input
                id="banner-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            {errors.file && (
              <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">
                {errors.file}
              </p>
            )}
            <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
              {isEdit
                ? "Để trống nếu giữ ảnh hiện tại."
                : "Có thể tải ảnh từ máy hoặc nhập URL bên dưới."}
            </p>
          </div>

          {/* Image URL fallback */}
          {!file && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                Hoặc URL ảnh
              </label>
              <InputText
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700"
                placeholder="https://..."
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                Vị trí <span className="text-red-500">*</span>
              </label>
              <Dropdown
                value={formData.position}
                options={POSITION_OPTIONS}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.value })
                }
                className={`w-full !bg-gray-50 !border-${errors.position ? "red-500" : "gray-200"} !rounded-xl outline-none font-bold text-gray-700`}
              />
              {errors.position && (
                <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">
                  {errors.position}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
                Thứ tự hiển thị
              </label>
              <InputNumber
                value={formData.sort_order}
                onValueChange={(e) =>
                  setFormData({ ...formData, sort_order: e.value ?? 0 })
                }
                showButtons
                min={0}
                className="w-full"
                inputClassName="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
              Tiêu đề
            </label>
            <InputText
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700"
              placeholder="Banner trang chủ..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">
              Đường dẫn liên kết
            </label>
            <InputText
              value={formData.link_url}
              onChange={(e) =>
                setFormData({ ...formData, link_url: e.target.value })
              }
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700"
              placeholder="/tin-tuc hoặc https://..."
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-black text-gray-800">Trạng thái</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">
                Bật để hiển thị banner trên giao diện công khai
              </p>
            </div>
            <InputSwitch
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: !!e.value })
              }
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-4 shrink-0 bg-gray-50/50">
          <Button
            label="HỦY BỎ"
            onClick={onHide}
            className="flex-1 py-3 border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-white uppercase tracking-widest text-[11px]"
            outlined
          />
          <Button
            label={isEdit ? "CẬP NHẬT" : "THÊM MỚI"}
            icon={
              isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )
            }
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
          />
        </div>
      </div>
    </div>
  );
};

export default BannersManagement;
