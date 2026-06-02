import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Lock, XCircle } from "lucide-react";
import { Button } from "@/components/prime";
import { api } from "../api";
import { Toast } from "primereact/toast";
import { useAuth } from "../AuthContext";

const ChangePassword: React.FC = () => {
  const { user } = useAuth();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 6;
    const hasUpper = /[A-Z]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const noSpace = !/\s/.test(pass);
    
    return {
      minLength,
      hasUpper,
      hasSpecial,
      noSpace,
      isValid: minLength && hasUpper && hasSpecial && noSpace
    };
  };

  const validation = validatePassword(formData.newPassword);
  const passwordsMatch = formData.newPassword && formData.newPassword === formData.confirmPassword;
  const canSubmit = validation.isValid && passwordsMatch && formData.oldPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setIsLoading(true);
    try {
      const res = await api.changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      if (!res?.message) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Mật khẩu của bạn đã được thay đổi thành công",
        });
      }
      setTimeout(() => navigate(-1), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message && !err.message.includes("API Error") ? err.message : "Không thể cập nhật mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center p-4 font-sans">
      <Toast ref={toast} />
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-6 transition group"
        >
          <ArrowLeft
            size={16}
            className="mr-2 group-hover:-translate-x-1 transition-transform"
          />
          Quay lại
        </button>

        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100">
          {/* Blue Header Section - Matching Image 8 */}
          <div className="bg-[#0066a2] p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full p-0.5 shadow-lg flex items-center justify-center overflow-hidden border-2 border-white">
                <img
                  crossOrigin="anonymous"
                  src="https://storage-vnportal.vnpt.vn/gov-hni/6749/soyte.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-bold text-white uppercase tracking-tight">
                Đổi mật khẩu
              </h1>
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-2 bg-white/10 py-1 px-3 rounded-full inline-block">
                Người dùng: {user?.full_name || user?.name || "Cán bộ"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success ? (
              <div className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center space-y-3 animate-in zoom-in-95 duration-300">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-green-800 font-bold">Thành công!</h3>
                  <p className="text-green-600 text-xs">Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển hướng quay lại...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Lock size={12} /> Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <input
                        type={showOld ? "text" : "password"}
                        required
                        value={formData.oldPassword}
                        onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all text-sm font-bold"
                        placeholder="Nhập mật khẩu cũ"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Lock size={12} /> Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        required
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all text-sm font-bold"
                        placeholder="Nhập mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <CheckCircle2 size={12} /> Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`w-full p-4 bg-gray-50 border ${formData.confirmPassword && !passwordsMatch ? 'border-red-200' : 'border-gray-200'} rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all text-sm font-bold`}
                        placeholder="Nhập lại mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Điều kiện mật khẩu:</p>
                   <ValidationItem label="Ít nhất 6 ký tự" isValid={validation.minLength} hasInput={!!formData.newPassword} />
                   <ValidationItem label="Ít nhất 1 chữ cái in hoa" isValid={validation.hasUpper} hasInput={!!formData.newPassword} />
                   <ValidationItem label="Ít nhất 1 ký tự đặc biệt" isValid={validation.hasSpecial} hasInput={!!formData.newPassword} />
                   <ValidationItem label="Không chứa khoảng trắng" isValid={validation.noSpace} hasInput={!!formData.newPassword} />
                   <ValidationItem label="Mật khẩu xác nhận phải khớp" isValid={passwordsMatch} hasInput={!!formData.confirmPassword} />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !canSubmit}
                  loading={isLoading}
                  label="XÁC NHẬN ĐỔI MẬT KHẨU"
                  className="w-full !h-[60px] !bg-[#0088cc] !text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:!bg-[#0077bb] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none border-none"
                />
              </>
            )}
          </form>

          <footer className="bg-gray-50/50 p-6 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              Bảo mật tài khoản là ưu tiên hàng đầu
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

const ValidationItem: React.FC<{ label: string; isValid: boolean; hasInput: boolean }> = ({ label, isValid, hasInput }) => {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold">
      {hasInput ? (
        isValid ? (
          <CheckCircle2 size={14} className="text-green-500" />
        ) : (
          <XCircle size={14} className="text-red-400" />
        )
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200"></div>
      )}
      <span className={hasInput ? (isValid ? "text-green-700" : "text-red-600") : "text-gray-500"}>
        {label}
      </span>
    </div>
  );
};

export default ChangePassword;
