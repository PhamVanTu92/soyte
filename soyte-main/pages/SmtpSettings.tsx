import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { api } from "../api";
import { SmtpConfig } from "../types";
import {
  Settings,
  Server,
  Shield,
  Mail,
  Key,
  Save,
  Loader2,
  RefreshCw,
  Hash,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { Toast } from "primereact/toast";
import { Button, InputText, InputNumber, InputSwitch } from "@/components/prime";

const SmtpSettings: React.FC = () => {
  const [config, setConfig] = useState<SmtpConfig>({
    smtp_host: "",
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: "",
    smtp_pass: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const toast = useRef<Toast>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.getSmtpConfig();
      if (response && response.data) {
        setConfig(response.data);
      } else if (response) {
        setConfig(response);
      }
    } catch (err) {
      console.error("Failed to fetch SMTP config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config.smtp_host || !config.smtp_port || !config.smtp_user || !config.smtp_pass) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Vui lòng nhập đầy đủ các trường thông tin bắt buộc",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.updateSmtpConfig(config);
      if (!res?.message) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã cập nhật cấu hình SMTP",
        });
      }
    } catch (err: any) {
      console.error("Failed to update SMTP config:", err);
      if (err.message && err.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể lưu cấu hình SMTP",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="Cấu hình SMTP Hệ thống">
      <Toast ref={toast} />

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center">
                <Settings size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">CÀI ĐẶT MÁY CHỦ EMAIL</h3>
                <p className="text-xs text-gray-500 font-medium">Quản lý các thông số kết nối gửi mail tự động</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                label="LƯU THAY ĐỔI"
                icon={isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                onClick={handleSave}
                disabled={loading || isSaving}
                className="!px-6 !py-2.5 !bg-primary-600 !text-white !font-black !rounded-xl !shadow-lg !shadow-primary-100 !transition-all hover:!-translate-y-0.5"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center">
              <Loader2 size={40} className="animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Đang tải cấu hình...</p>
            </div>
          ) : (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <SectionHeader icon={Server} title="THÔNG TIN MÁY CHỦ" />

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">SMTP HOST (MÁY CHỦ) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <InputText
                        value={config.smtp_host}
                        onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                        placeholder="e.g. smtp.gmail.com"
                        className="w-full !px-4 !py-3.5 !bg-gray-50 !border-gray-200 !rounded-2xl outline-none focus:!ring-2 focus:!ring-primary-100 !font-bold !text-gray-700 !transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">CỔNG (PORT) <span className="text-red-500">*</span></label>
                      <InputNumber
                        value={config.smtp_port}
                        onValueChange={(e) => setConfig({ ...config, smtp_port: e.value || 587 })}
                        useGrouping={false}
                        className="w-full"
                        inputClassName="w-full !px-4 !py-3.5 !bg-gray-50 !border-gray-200 !rounded-2xl outline-none focus:!ring-2 focus:!ring-primary-100 !font-bold !text-gray-700 !transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest text-center">BẢO MẬT (SSL/TLS)</label>
                      <div className="flex items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-2xl h-[52px]">
                        <InputSwitch
                          checked={config.smtp_secure}
                          onChange={(e) => setConfig({ ...config, smtp_secure: e.value })}
                        />
                        <span className="ml-3 font-black text-[10px] text-gray-600 uppercase tracking-widest">
                          {config.smtp_secure ? "Bật" : "Tắt"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <SectionHeader icon={Shield} title="XÁC THỰC TÀI KHOẢN" />

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">TÀI KHOẢN (USER) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <InputText
                        value={config.smtp_user}
                        onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                        placeholder="your-email@gmail.com"
                        className="w-full !pl-12 !pr-4 !py-3.5 !bg-gray-50 !border-gray-200 !rounded-2xl outline-none focus:!ring-2 focus:!ring-primary-100 !font-bold !text-gray-700 !transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">MẬT KHẨU (PASSWORD) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <InputText
                        type={showPassword ? "text" : "password"}
                        value={config.smtp_pass}
                        onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full !pl-12 !pr-12 !py-3.5 !bg-gray-50 !border-gray-200 !rounded-2xl outline-none focus:!ring-2 focus:!ring-primary-100 !font-bold !text-gray-700 !transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 animate-in zoom-in-95 duration-500 delay-200">
                  <Lock className="text-amber-600 shrink-0" size={20} />
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    <span className="font-bold underline uppercase tracking-tight">Lưu ý:</span> Nếu sử dụng Gmail, vui lòng đảm bảo bạn đã tạo và sử dụng <strong>App Password</strong> (Mật khẩu ứng dụng) thay vì mật khẩu chính của tài khoản để đảm bảo tính bảo mật.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

const SectionHeader: React.FC<{ icon: any; title: string }> = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
    <Icon className="text-primary-600" size={20} />
    <h4 className="font-black text-gray-800 text-xs tracking-widest uppercase">{title}</h4>
  </div>
);

export default SmtpSettings;
