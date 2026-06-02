import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Lock, XCircle, Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/prime";
import { api } from "../api";
import { Toast } from "primereact/toast";
import { useAuth } from "../AuthContext";

const ConfirmPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setIsTokenChecking(false);
        setError("Thiếu mã xác thực (token). Vui lòng sử dụng liên kết từ email.");
        return;
      }

      try {
        setIsTokenChecking(true);
        const res = await api.checkToken(token);
        // Giả sử API trả về { email: "user@example.com" }
        setEmail(res.email || "");
        setIsTokenValid(true);
      } catch (err: any) {
        console.error("Token verification failed:", err);
        setIsTokenValid(false);
        setError("Liên kết xác thực không hợp lệ hoặc đã hết hạn.");
      } finally {
        setIsTokenChecking(false);
      }
    };

    verifyToken();
  }, [token]);

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

  const validation = validatePassword(password);
  const passwordsMatch = password && password === confirmPassword;

  const validateResendEmail = () => {
    const trimmedEmail = resendEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      return "Vui lòng nhập email tài khoản.";
    }

    if (!emailRegex.test(trimmedEmail)) {
      return "Email không đúng định dạng.";
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid) return;
    if (!passwordsMatch) return;
    if (!isTokenValid) return;

    setError("");
    setIsLoading(true);
    try {
      const response = await api.confirmPassword({ email, password, token });
      
      if (response.token) {
        await login(response.token);
        if (!response.message) {
          toast.current?.show({
            severity: "success",
            summary: "Thành công",
            detail: "Mật khẩu đã được cập nhật. Đang đăng nhập...",
          });
        }
        setTimeout(() => navigate("/admin/dashboard"), 1500);
      } else {
        setSuccess(true);
        if (!response.message) {
          toast.current?.show({
            severity: "success",
            summary: "Thành công",
            detail: "Mật khẩu đã được cập nhật thành công",
          });
        }
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message && !err.message.includes("API Error") ? err.message : "Không thể cập nhật mật khẩu. Vui lòng thử lại.");
      if (err.message && err.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Cập nhật mật khẩu thất bại",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationMessage = validateResendEmail();

    setResendError("");
    setResendSuccess(false);

    if (validationMessage) {
      setResendError(validationMessage);
      return;
    }

    setIsResending(true);
    try {
      await api.requestVerificationEmail(resendEmail.trim());
      setResendSuccess(true);
      setResendEmail("");
    } catch (err: any) {
      console.error("Resend verification failed:", err);
      setResendError(
        err.message && !err.message.includes("API Error")
          ? err.message
          : "Không thể gửi yêu cầu cấp lại mail xác thực. Vui lòng thử lại.",
      );
      if (err.message && err.message.includes("API Error")) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Gửi yêu cầu cấp lại mail xác thực thất bại",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  if (isTokenChecking) {
    return (
      <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#0066a2] animate-spin" />
          <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Đang xác thực liên kết...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center p-4">
      <Toast ref={toast} />
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
                Xác nhận mật khẩu
              </h1>
              {isTokenValid && (
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-2 bg-white/10 py-1 px-3 rounded-full inline-block">
                  Email: {email}
                </p>
              )}
            </div>
          </div>

          <div className="p-8">
            {!isTokenValid ? (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border-4 border-red-100 shadow-xl">
                  <AlertCircle size={40} />
                </div>
                <div>
                  <h3 className="text-red-700 font-black uppercase text-lg mb-2">Liên kết không hợp lệ</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    {error || "Liên kết xác thực của bạn không hợp lệ hoặc đã hết hạn sử dụng."}
                  </p>
                  <form
                    onSubmit={handleResendVerification}
                    className="text-left p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4"
                  >
                    <div className="text-center">
                      <p className="text-gray-700 text-[11px] font-black uppercase tracking-widest">
                        Yêu cầu cấp lại mail xác thực
                      </p>
                      <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                        Nhập email tài khoản của bạn để gửi yêu cầu cấp lại mail xác thực.
                      </p>
                    </div>

                    {resendSuccess && (
                      <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-green-700 text-sm flex items-start gap-3">
                        <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                        <span>Yêu cầu đã được gửi. Vui lòng kiểm tra email của bạn.</span>
                      </div>
                    )}

                    {resendError && (
                      <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-700 text-sm flex items-start gap-3">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{resendError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">
                        Email tài khoản
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={resendEmail}
                          onChange={(e) => {
                            setResendEmail(e.target.value);
                            if (resendError) setResendError("");
                            if (resendSuccess) setResendSuccess(false);
                          }}
                          className={`w-full pl-12 pr-4 py-4 bg-white border ${resendError ? "border-red-300" : "border-gray-200"} rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all text-sm font-bold`}
                          placeholder="example@gmail.com"
                        />
                        <Mail
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isResending}
                      loading={isResending}
                      className="w-full px-6 py-4 !bg-[#0088cc] !text-white font-black rounded-2xl shadow-xl shadow-primary-100 hover:!bg-[#0077bb] transition-all transform hover:-translate-y-0.5"
                    >
                      {!isResending && (
                        <span className="inline-flex items-center justify-center gap-2">
                          <Send size={16} />
                          YÊU CẦU CẤP LẠI MAIL XÁC THỰC
                        </span>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      <p className="text-green-600 text-xs">Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển hướng đến trang đăng nhập...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <Lock size={12} /> Mật khẩu mới
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full p-4 bg-gray-50 border ${password && !validation.isValid ? 'border-red-200' : 'border-gray-200'} rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all text-sm font-bold`}
                            placeholder="Nhập mật khẩu mới"
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
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <CheckCircle2 size={12} /> Xác nhận mật khẩu
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full p-4 bg-gray-50 border ${confirmPassword && !passwordsMatch ? 'border-red-200' : 'border-gray-200'} rounded-2xl outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all text-sm font-bold`}
                            placeholder="Nhập lại mật khẩu mới"
                          />
                          <Button
                            type="button"
                            icon={showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            text
                            rounded
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 !text-gray-400 hover:!text-primary-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Điều kiện mật khẩu:</p>
                       <ValidationItem label="Ít nhất 6 ký tự" isValid={validation.minLength} hasInput={!!password} />
                       <ValidationItem label="Ít nhất 1 chữ cái in hoa" isValid={validation.hasUpper} hasInput={!!password} />
                       <ValidationItem label="Ít nhất 1 ký tự đặc biệt" isValid={validation.hasSpecial} hasInput={!!password} />
                       <ValidationItem label="Không chứa khoảng trắng" isValid={validation.noSpace} hasInput={!!password} />
                       <ValidationItem label="Mật khẩu xác nhận phải khớp" isValid={passwordsMatch} hasInput={!!confirmPassword} />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || !validation.isValid || !passwordsMatch}
                      loading={isLoading}
                      label="CẬP NHẬT MẬT KHẨU"
                      className="w-full py-4 !bg-[#0088cc] !text-white font-black rounded-2xl shadow-xl shadow-primary-100 hover:!bg-[#0077bb] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                    />
                  </>
                )}
              </form>
            )}
          </div>

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

export default ConfirmPassword;
