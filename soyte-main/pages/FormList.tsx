import React, { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronRight, FileText, Home, PhoneCall, ShieldCheck } from "lucide-react";
import { api } from "@/api";
import { surveyService } from "@/services/surveyService";
const ALLOWED_TYPES = ["evaluate", "reflect"] as const;
type FormType = (typeof ALLOWED_TYPES)[number];
const FormList: React.FC = () => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { type } = useParams<{ type?: string }>();

  const isValidType =
    type === undefined || ALLOWED_TYPES.includes(type as FormType);

  if (!isValidType) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        // Using surveyService which has a promise cache for deduplication
        const data = await surveyService.fetchSurveys(1, 1000, type, true);
        const surveyList = data?.items || data || [];
        setSurveys(surveyList);
      } catch (error) {
        console.error("Fetch surveys error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [type]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">
          <Link
            to="/"
            className="hover:text-primary-600 flex items-center gap-1"
          >
            <Home size={14} /> Trang chủ
          </Link>
          <ChevronRight size={14} className="mx-2 text-gray-300" />
          {type === "reflect" && (
            <span className="text-primary-700">Phản ánh y tế</span>
          )}
          {type === "evaluate" && (
            <span className="text-primary-700">Giám sát chất lượng dịch vụ y tế</span>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-primary-800 text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 -translate-y-1/4 translate-x-1/4 rotate-12">
          <ShieldCheck size={400} />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <span className="bg-secondary-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest mb-4 inline-block shadow-lg">
                Hệ thống khảo sát & Phản ánh
              </span>
              {type === "reflect" && (
                <>
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-4">
                    Phản ánh y tế
                  </h1>
                  <p className="text-primary-100 text-lg font-medium max-w-xl italic">
                    Gửi phản ánh và ý kiến của bạn về chất lượng dịch vụ y tế để cơ quan chức năng kịp thời tiếp nhận và xử lý.
                  </p>
                </>
              )}
              {type === "evaluate" && (
                <>
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-4">
                    Giám sát chất lượng y tế
                  </h1>
                  <p className="text-primary-100 text-lg font-medium max-w-xl italic">
                    Theo dõi và giám sát chất lượng dịch vụ y tế, góp phần nâng cao hiệu quả quản lý và cải thiện trải nghiệm người bệnh.
                  </p>
                </>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] shadow-2xl shrink-0 hidden lg:block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-800 shadow-lg">
                  <PhoneCall size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest">Hotline hỗ trợ</p>
                  <h4 className="text-xl font-black">1900 9068</h4>
                </div>
              </div>
              <p className="text-xs text-primary-200 leading-relaxed italic">Giải đáp thắc mắc 24/7 từ chuyên gia.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang tải danh sách...</p>
             </div>
        ) : surveys.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-400">Hiện tại chưa có cuộc khảo sát nào</h3>
                <p className="text-slate-400 text-sm mt-1">Vui lòng quay lại sau</p>
            </div>
        ) : (
          surveys.map((survey) => (
            <div key={survey.key || survey.id} className="mb-16 last:mb-0">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-slate-200 flex-1"></div>
                <div className="bg-white px-6 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                    <h2 className="text-sm md:text-base font-black text-slate-700 uppercase tracking-widest italic leading-none">
                        {survey.name}
                    </h2>
                </div>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(survey.form_ids || []).map((form: any) => (
                  <Link
                    key={form.form_id || form.id}
                    to={`/forms/${form.form_id || form.id}?survey_key=${survey.key || survey.id}`}
                    className="group block p-6 bg-white rounded-[2rem] shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
                    
                    <div className="w-16 h-16 bg-primary-600 group-hover:bg-primary-700 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary-200 transition-all transform group-hover:rotate-6 relative z-10">
                      <FileText className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-base md:text-lg font-black text-slate-800 group-hover:text-primary-700 transition-colors mb-3 leading-tight px-2 relative z-10 min-h-[3.5rem]">
                      {form.name}
                    </h3>
                    
                    <div className="mt-auto pt-4 border-t border-slate-50 w-full flex items-center justify-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest relative z-10">
                        Nhấn để điền <ChevronRight size={14} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FormList;
