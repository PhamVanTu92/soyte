import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../api";
import { Button } from "@/components/prime";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập địa chỉ email.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Email không đúng định dạng.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await api.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể gửi yêu cầu khôi phục. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link
          to="/login"
          className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-6 transition group"
        >
          <ArrowLeft
            size={16}
            className="mr-2 group-hover:-translate-x-1 transition-transform"
          />
          Quay lại đăng nhập
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
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
                Quên mật khẩu
              </h1>
              <p className="text-white/80 text-[11px] font-medium uppercase tracking-widest mt-1">
                Sở Y Tế Hà Nội
              </p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {success ? (
              <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-100">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-800">Yêu cầu đã được gửi!</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến địa chỉ email <span className="font-bold text-primary-600">{email}</span>.
                  </p>
                </div>
                <Button 
                  label="VỀ TRANG ĐĂNG NHẬP" 
                  className="w-full !py-4 !bg-[#0088cc] !text-white font-bold rounded-2xl shadow-lg hover:!bg-[#0077bb] transition-all"
                  onClick={() => navigate("/login")}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
                  <p className="text-xs text-blue-800 text-center font-medium leading-relaxed">
                    Vui lòng nhập <span className="font-bold">Địa chỉ Email</span> của bạn. Chúng tôi sẽ gửi một liên kết để thiết lập lại mật khẩu.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full p-4 bg-gray-50 border ${errors.email ? "border-red-500" : "border-gray-200"} rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all text-sm font-bold`}
                    placeholder="example@gmail.com"
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">{errors.email}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  label={isLoading ? "ĐANG GỬI..." : "GỬI YÊU CẦU"}
                  className="w-full py-4 !bg-[#0088cc] !text-white font-black rounded-2xl shadow-xl shadow-primary-100 hover:!bg-[#0077bb] transition-all transform hover:-translate-y-0.5"
                />
              </form>
            )}
          </div>

          <div className="bg-gray-50/50 p-6 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              Bảo mật tài khoản cán bộ Sở Y Tế
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
