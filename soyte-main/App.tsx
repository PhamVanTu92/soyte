import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import NewsCategory from "./pages/NewsCategory";
import NewsDetail from "./pages/NewsDetail";
import HealthRecords from "./pages/HealthRecords";
import HanoiSystem from "./pages/HanoiSystem";
import EmergencyCenter from "./pages/EmergencyCenter";
import HealthConsultation from "./pages/HealthConsultation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import AdminDashboard from "./pages/AdminDashboard";
import HealthRecordsDetail from "./pages/HealthRecordsDetail";
import DataLookup from "./pages/DataLookup";
import DigitalTransformation from "./pages/DigitalTransformation";
import PolicyHealthInsurance from "./pages/PolicyHealthInsurance";
import UserManagement from "./pages/UserManagement";
import SmtpSettings from "./pages/SmtpSettings";
import ConfirmPassword from "./pages/ConfirmPassword";
import AdminWorkSchedule from "./pages/AdminWorkSchedule";
import TemplatesManagement from "./pages/TemplatesManagement";
import TemplateCreate from "./pages/TemplateCreate";
import TemplateQrView from "./pages/TemplateQrView";
import FeedbacksManagement from "./pages/FeedbacksManagement";
import SurveysManagement from "./pages/SurveysManagement";
import AdminRoute from "./components/AdminRoute";
import SocialFacilitiesManagement from "./pages/SocialFacilitiesManagement";
import AffiliatedFacilitiesManagement from "./pages/AffiliatedFacilitiesManagement";
import TradingFacilitiesManagement from "./pages/TradingFacilitiesManagement";
import PermissionsManagement from "./pages/PermissionsManagement";
import RolesManagement from "./pages/RolesManagement";
import BannersManagement from "./pages/BannersManagement";
import Report_DCBC from "./pages/report/Report_DCBC";
import Report_KSHL from "./pages/report/Report_KSHL";
import Report_TCT01 from "./pages/report/Report_TCT01";
import { useAuth } from "./AuthContext";
import { Toast } from "@/components/prime";
import { useRef } from "react";
import FormDetail from "./pages/FormDetail";
import FormList from "./pages/FormList";
import { ConfirmDialog } from "primereact/confirmdialog";
const ExternalRedirect = ({ to }: { to: string }) => {
  window.location.replace(to);
  return null;
};

const App = () => {
  const { loading } = useAuth();
  const toast = useRef(null);
  (window as any).$toast = toast;

  if (loading) {
    return (
      <>
        <Toast ref={toast} />
        <ConfirmDialog />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
            Đang tải hệ thống...
          </p>
        </div>
      </>
    );
  }

  return (
    <Layout>
      <Toast ref={toast} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/confirm-password" element={<ConfirmPassword />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/health-records/detail"
          element={<HealthRecordsDetail />}
        />
        <Route path="/schedule" element={<ExternalRedirect to="http://lichcongtac.qnict.vn/sythanoi/" />} />
        <Route path="/formsList/:type?" element={<FormList />} />
        <Route path="/forms/:id" element={<FormDetail />} />
        <Route path="/policy" element={<PolicyHealthInsurance />} />
        <Route path="/news/:categoryId" element={<NewsCategory />} />
        <Route path="/news/detail/:id" element={<NewsDetail />} />
        <Route path="/health-records" element={<HealthRecords />} />
        <Route path="/hanoi-system" element={<HanoiSystem />} />
        <Route path="/emergency" element={<EmergencyCenter />} />
        <Route path="/consulting" element={<HealthConsultation />} />
        <Route path="/data-lookup" element={<DataLookup />} />
        <Route
          path="/digital-transformation"
          element={<DigitalTransformation />}
        />
        {/* Public QR View */}
        <Route path="/templates/qr/:id" element={<TemplateQrView />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="smtp" element={<SmtpSettings />} />
          <Route path="schedules" element={<AdminWorkSchedule />} />{" "}
          <Route path="templates/:type?" element={<TemplatesManagement />} />{" "}
          <Route path="templates/create/:type?" element={<TemplateCreate />} />{" "}
          <Route path="templates/edit/:id" element={<TemplateCreate />} />{" "}
          <Route path="feedbacks/:type?" element={<FeedbacksManagement />} />{" "}
          <Route path="surveys/:type?" element={<SurveysManagement />} />{" "}
          <Route
            path="social-facilities"
            element={<SocialFacilitiesManagement />}
          />{" "}
          <Route
            path="affiliated-facilities"
            element={<AffiliatedFacilitiesManagement />}
          />{" "}
          <Route
            path="trading-facilities"
            element={<TradingFacilitiesManagement />}
          />{" "}
          <Route path="permissions" element={<PermissionsManagement />} />{" "}
          <Route path="roles" element={<RolesManagement />} />{" "}
          <Route path="banners" element={<BannersManagement />} />{" "}
          <Route path="report/DCBC" element={<Report_DCBC />} />
          <Route path="report/KSHL" element={<Report_KSHL />} />
          <Route path="report/TCT01" element={<Report_TCT01 />} />
          {/* New Admin Schedule Route */}
          <Route index element={<AdminRoute />} />
        </Route>
        {/* Not Found */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
