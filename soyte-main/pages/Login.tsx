import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../AuthContext"; // Import useAuth
import { Button } from "@/components/prime";
import { getLandingPath } from "../utils/permissionUtils";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from context

  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};
    if (!email.trim()) newErrors.email = "Vui lòng nhập tài khoản hoặc email.";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const loginEmail = email.includes("@") ? email : `${email}@soyte.gov.vn`;
      const data = await api.post("/auth/login", {
        email: loginEmail,
        password: password,
      });

      if (data && data.token) {
        const loggedInUser = await login(data.token, data.user);
        const landingPath = getLandingPath(loggedInUser);
        navigate(landingPath, { replace: true });
      } else {
        throw new Error("Phản hồi từ máy chủ không hợp lệ.");
      }
    } catch (err: any) {
      console.error("Login component error:", err);
      if (err.message.includes("Failed to fetch")) {
        setError(
          "Không thể kết nối đến máy chủ API. Vui lòng kiểm tra lại dịch vụ backend.",
        );
      } else {
        setError(
          "Đăng nhập thất bại: Tài khoản hoặc mật khẩu không chính xác.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-6 transition group"
        >
          <ArrowLeft
            size={16}
            className="mr-2 group-hover:-translate-x-1 transition-transform"
          />{" "}
          Quay lại trang chủ
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
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
                Hệ Thống Quản Trị
              </h1>
              <p className="text-white/80 text-[11px] font-medium uppercase tracking-widest mt-1">
                Sở Y Tế Hà Nội
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-7 space-y-3">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                Tài khoản / Email
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-4 bg-gray-50 border ${errors.email ? "border-red-500" : "border-gray-200"} rounded-xl outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all text-sm font-medium`}
                placeholder="admin@soyte.gov.vn"
              />
              {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-4 bg-gray-50 border ${errors.password ? "border-red-500" : "border-gray-200"} rounded-xl outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all text-sm font-medium`}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  text
                  rounded
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 !text-gray-400 hover:!text-primary-600"
                />
              </div>
              {errors.password && <p className="text-red-500 text-[10px] mt-1 font-bold ml-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between px-1">
              <Link
                to="/forgot-password"
                className="text-[10px] font-black text-gray-400 hover:text-primary-600 transition-colors uppercase tracking-widest"
              >
                Quên mật khẩu?
              </Link>
              <Link
                to="/register"
                className="text-[10px] font-black text-primary-600 hover:text-primary-800 transition-colors uppercase tracking-widest"
              >
                Đăng ký ngay →
              </Link>
            </div>
            <div className="space-y-4">
              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                label={isLoading ? "Đang kiểm tra..." : "Đăng nhập"}
                className="w-full px-2 py-4 !bg-[#0088cc] !text-white font-bold rounded-xl shadow-lg hover:!bg-[#0077bb] transition-all"
              />
            </div>
          </form>

          <div className="bg-gray-50/50 p-6 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              Truy cập nội bộ dành cho cán bộ sở y tế
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
