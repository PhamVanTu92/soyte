import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  FileText,
  Home,
  ArrowLeft,
  Download,
  Printer,
  ShieldCheck,
  PhoneCall,
} from "lucide-react";
import { api } from "@/api";
import { Button } from "@/components/prime";

const TemplateQrView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const surveyKey = searchParams.get("survey_key");

  // useEffect(() => {
  //   if (!surveyKey) {
  //     navigate("/");
  //   }
  // }, [surveyKey, navigate]);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/forms/${id}`);
        setForm(res.data);
      } catch (error) {
        console.error("Fetch form error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchForm();
  }, [id]);

  const publicUrl = `${window.location.origin}/forms/${id}${surveyKey ? `?survey_key=${surveyKey}` : ''}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(publicUrl)}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR_Code_${form?.name || id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      window.open(qrUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-red-500 mb-4 font-bold text-xl">
          Không tìm thấy biểu mẫu
        </div>
        <Button
          label="Quay lại"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(-1)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary-100 selection:text-primary-900 pb-20 overflow-x-hidden">
      <style>{`
        /* Dedicated PRINT styles - Robust isolation */
        @media print {
          @page { size: landscape; margin: 0; }
          html, body { 
            height: 100vh !important; 
            overflow: hidden !important; 
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Completely hide the main UI to avoid interference */
          .main-ui-container { display: none !important; }
          /* Show only our dedicated print container */
          .print-layout-container { 
            display: flex !important; 
            position: fixed !important;
            inset: 0 !important;
            z-index: 99999 !important;
            background: white !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 2cm !important;
          }
        }
        /* Hide print layout in normal browser view */
        .print-layout-container { display: none; }
      `}</style>

      {/* 1. DEDICATED PRINT VIEW - Isolated from the rest of the app */}
      <div className="print-layout-container flex-col items-center justify-center min-h-screen w-full bg-white">
        <div className="w-full max-w-5xl flex flex-row items-center justify-between gap-10 p-10 border border-gray-100 rounded-[3rem] bg-white relative overflow-hidden shadow-sm">
          {/* Vertical Accent Line */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#0066a2]"></div>

          {/* Left: Metadata */}
          <div className="flex-1 text-left space-y-8 pl-8 max-w-[60%]">
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-black text-[#0066a2] uppercase tracking-tight leading-tight break-words">
                {form.name}
              </h1>
              <p className="text-base text-slate-500 font-medium leading-relaxed italic opacity-90 break-words line-clamp-3">
                {form.description || "Bảng kiểm đánh giá kết quả kiểm tra việc khắc phục tồn tại, hạn chế mang tính phổ thông năm 2026 tại các trạm y tế xã, phường."}
              </p>
            </div>

            <div className="bg-slate-50 px-6 py-5 rounded-3xl border border-gray-100 w-fit mt-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 leading-none">
                Liên kết chính thức để đánh giá
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]"></div>
                <span className="text-[13px] font-black text-[#0066a2] break-all select-all">
                  {publicUrl}
                </span>
              </div>
            </div>
          </div>

          {/* Right: QR Code Visuals */}
          <div className="shrink-0 flex flex-col items-center justify-center space-y-6 min-w-[340px] pr-4">
            <div className="bg-white p-6 rounded-[3rem] border border-gray-50 flex items-center justify-center shadow-lg shadow-blue-50/50">
              <img
                crossOrigin="anonymous"
                src={qrUrl}
                alt="Form QR Code"
                className="w-[8cm] h-[8cm] block object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-[13px] font-black text-[#0066a2] uppercase tracking-[0.4em]">
                QUÉT MÃ ĐỂ ĐÁNH GIÁ
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80">
                Sở Y tế Hà Nội - Cổng dịch vụ công
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN REGULAR UI - Standard layout for the screen */}
      <div className="main-ui-container">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 no-print">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">
            <div className="flex items-center">
              <Link
                to="/"
                className="hover:text-primary-600 flex items-center gap-1.5 transition-colors"
              >
                <Home size={14} /> TRANG CHỦ
              </Link>
              <ChevronRight size={14} className="mx-2 text-gray-300" />
              <Link
                to="/admin/templates"
                className="hover:text-primary-600 transition-colors"
              >
                QUẢN LÝ BIỂU MẪU
              </Link>
              <ChevronRight size={14} className="mx-2 text-gray-300" />
              <span className="text-primary-700">MÃ QR ĐỊNH DANH</span>
            </div>

            <Button
              label="QUAY LẠI QUẢN LÝ"
              icon="pi pi-arrow-left"
              className="p-button-text p-button-sm text-gray-400 font-black tracking-widest text-[10px] hover:text-primary-600 transition-colors"
              onClick={() => navigate("/admin/templates")}
            />
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-primary-800 text-white py-16 relative overflow-hidden hero-bg">
          <div className="absolute top-0 right-0 opacity-10 -translate-y-1/4 translate-x-1/4 rotate-12">
            <ShieldCheck size={400} />
          </div>
          <div className="container mx-auto px-4 relative z-10 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="bg-secondary-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest mb-4 inline-block shadow-lg">
                  Dịch vụ công trực tuyến
                </span>

                {form.type === "reflect" ? (
                  <>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-4 drop-shadow-lg">
                      Phản ánh y tế
                    </h1>
                    <p className="text-primary-100 text-lg font-medium max-w-xl opacity-90">
                      Gửi phản ánh và ý kiến của bạn về chất lượng dịch vụ y tế,
                      thái độ phục vụ và các vấn đề liên quan đến khám chữa bệnh
                      để cơ quan chức năng kịp thời tiếp nhận và xử lý.
                    </p>
                  </>
                ) : form.type === "evaluate" ? (
                  <>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-4 drop-shadow-lg">
                      Giám sát chất lượng y tế
                    </h1>
                    <p className="text-primary-100 text-lg font-medium max-w-xl opacity-90">
                      Theo dõi và giám sát chất lượng dịch vụ y tế tại các cơ sở
                      khám chữa bệnh, góp phần nâng cao hiệu quả quản lý và cải
                      thiện trải nghiệm của người bệnh.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-4 drop-shadow-lg">
                      {form.name}
                    </h1>
                    <p className="text-primary-100 text-lg font-medium max-w-xl opacity-90">
                      Tải xuống hoặc in mã QR này để niêm yết tại các cơ sở giúp
                      người dân dễ dàng truy cập và thực hiện đánh giá.
                    </p>
                  </>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] shadow-2xl shrink-0 hidden lg:block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-800 shadow-lg">
                    <PhoneCall size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest">
                      Hotline hỗ trợ
                    </p>
                    <h4 className="text-xl font-black">1900 9068</h4>
                  </div>
                </div>
                <p className="text-xs text-left text-primary-200 leading-relaxed italic">
                  Giải đáp thắc mắc về BHYT <br /> 24/7 từ chuyên gia Sở Y tế.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Content */}
        <div className="container mx-auto px-4 mt-8 mb-20 relative z-20 qr-content">
          <div className="max-w-6xl mx-auto bg-gradient-to-br from-blue-50/50 via-white to-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(15,23,42,0.06)] border border-blue-100 border-t-[10px] border-primary-600 p-8 md:p-12 lg:p-16 relative overflow-hidden qr-row">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl print-hidden"></div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-stretch qr-content-split text-left">
                {/* Left Column: Info + Buttons */}
                <div className="flex-1 flex flex-col justify-between space-y-10 group">
                  <div className="space-y-8">
                    <h3 className="text-3xl md:text-3xl font-black text-primary-800 tracking-tight leading-[1.1] uppercase max-w-2xl">
                      {form.name}
                    </h3>

                    <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed opacity-80 max-w-xl">
                      {form.description ||
                        "Bảng kiểm đánh giá kết quả kiểm tra việc khắc phục tồn tại, hạn chế mang tính phổ thông năm 2026 tại các trạm y tế xã, phường."}
                    </p>

                    <div className="w-24 h-1 bg-slate-100 rounded-full no-print"></div>
                  </div>

                  <div className="bg-white/40 backdrop-blur-sm px-8 py-6 rounded-[2rem] border border-white shadow-sm max-w-md qr-link-box">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">
                      Liên kết chính thức
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                      <span className="text-sm font-black text-primary-700 break-all">
                        {publicUrl}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: QR Code + Meta Info */}
                <div className="lg:w-[480px] shrink-0 flex flex-col items-center justify-between qr-area">
                  <div className="bg-white p-8 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(30,64,175,0.1)] border border-blue-50 relative group w-full mb-8">
                    <div className="relative z-10 bg-white p-4 rounded-3xl border border-slate-50 group-hover:scale-[1.03] transition-transform duration-700 ease-out flex justify-center">
                      <img
                        crossOrigin="anonymous"
                        src={qrUrl}
                        alt="QR Code"
                        className="w-56 h-56 md:w-80 md:h-80 object-contain"
                      />
                    </div>
                    <div className="mt-8 text-center space-y-2">
                      <p className="text-[14px] font-black text-primary-900 uppercase tracking-[0.25em]">
                        QUÉT MÃ ĐỂ ĐÁNH GIÁ
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80">
                        Sở Y tế Hà Nội - Cổng dịch vụ công
                      </p>
                    </div>
                  </div>

                  {/* Buttons moved under QR on right */}
                  <div className="flex flex-wrap gap-4 no-print w-full justify-center mb-8">
                    <Button
                      label="TẢI XUỐNG"
                      icon={<Download size={18} />}
                      className="bg-[#0088cc] text-white border-none px-6 py-4 rounded-xl font-black text-xs tracking-widest hover:translate-y-[-4px] transition-all shadow-lg shadow-blue-100/50 hover:shadow-xl hover:bg-[#0077bb] flex-1 min-w-[140px]"
                      onClick={handleDownload}
                    />
                    <Button
                      label="IN MÃ QR"
                      icon={<Printer size={18} />}
                      className="bg-primary-900 text-white border-none px-6 py-4 rounded-xl font-black text-xs tracking-widest hover:translate-y-[-4px] transition-all shadow-lg shadow-slate-200/50 hover:shadow-xl hover:bg-black flex-1 min-w-[140px]"
                      onClick={() => window.print()}
                    />
                  </div>

                  {/* Bottom Links (Aligned under QR box on desktop) */}
                  <div className="w-full h-px bg-slate-100/50 mb-6 lg:hidden"></div>
                  <div className="flex items-center justify-end w-full px-4 no-print">
                    <Link
                      to={`/forms/${id}${surveyKey ? `?survey_key=${surveyKey}` : ""}`}
                      className="text-[11px] font-black text-slate-400 hover:text-primary-600 transition-all uppercase tracking-[0.12em] flex items-center gap-2 group/link"
                    >
                      XEM CHI TIẾT{" "}
                      <ChevronRight
                        size={16}
                        className="group-hover/link:translate-x-1 transition-transform"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateQrView;
