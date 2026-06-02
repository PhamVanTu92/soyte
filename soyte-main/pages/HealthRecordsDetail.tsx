
import React, { useEffect, useRef, useState } from "react";
import { 
  Building2, 
  Activity, 
  HeartPulse, 
  Building, 
  Stethoscope, 
  Home, 
  MapPin, 
  ChevronRight,
  ShieldCheck,
  Search
} from "lucide-react";

const HealthRecordsDetail = () => {
  const initialized = useRef(false); 
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    loadScript("https://datahub.hanoi.gov.vn/js/visualcommon/publish-dashboard-drag.js")
      .then(() => {
        const win = window as any;
        if (win.dashboard) {
          win.dashboard.setUnit('');
          win.dashboard.setUser('');
          win.dashboard.domReady(() => {
            win.dashboard.viewDashboard(
              'https://datahub.hanoi.gov.vn/databox/ttksbt/tinyroute/5DEDFF31436D175D.cpx?secrd=zZlJb2VFjTYo0sQ8vu0Tmk2K87v92uRv5VtEQsbYeQHWoRD9KmJ3AiWiHLfkBh1m', 
              'view-design'
            );
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load dashboard script:", error);
      });

    return () => {
      const scriptElement = document.querySelector('script[src="https://datahub.hanoi.gov.vn/js/visualcommon/publish-dashboard-drag.js"]');
      if (scriptElement) {
        // We might want to keep it if multiple navigations happen, but cleanup is safer for POC
      }
      const viewDesign = document.getElementById('view-design');
      if(viewDesign) {
          viewDesign.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-12">
      {/* Header Area */}
      <div className="bg-primary-900 text-white py-12 px-4 shadow-lg mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none -translate-y-1/4 translate-x-1/4">
          <Activity size={300} />
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-secondary-400" size={32} />
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Hồ sơ Sức khỏe Toàn dân</h1>
          </div>
          <p className="text-primary-100 text-lg max-w-3xl leading-relaxed">
            Hệ thống tích hợp dữ liệu sức khỏe thông minh, cho phép người dân tra cứu lịch sử khám bệnh, 
            kết quả xét nghiệm và quản lý các thông số sinh tồn từ tất cả các cơ sở y tế trên địa bàn Thủ đô.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4"> 
        {/* Dashboard Frame */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden min-h-[650px] flex flex-col">
          <div className="bg-gray-800 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Activity className="text-secondary-400" size={18} />
              <span className="text-sm font-bold uppercase tracking-widest">Dữ liệu thời gian thực</span>
            </div>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </div>
          </div>
          <div className="flex-grow relative bg-slate-100">
             <div 
               id="view-design" 
               className="w-full h-[600px]"
               style={{ height: "600px", width: "100%" }}
             >
               {/* Dashboard script loads here */}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthRecordsDetail;
