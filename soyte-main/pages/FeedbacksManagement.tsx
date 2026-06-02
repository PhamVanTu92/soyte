import AdminLayout from "../components/AdminLayout";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Toast } from "@/components/prime";
import { Navigate, useParams } from "react-router-dom";
import { useFeedbacks } from "../hooks/useFeedbacks";
import { useFeedbackStats } from "../hooks/useFeedbackStats";
import { ReportFilters } from "../components/report/ReportFilters";
import { FeedbackStatsSection } from "../components/feedbacks/FeedbackStatsSection";
import { FeedbackDataTable } from "../components/feedbacks/FeedbackDataTable";
import { FeedbackDetailsDialog } from "../components/feedbacks/FeedbackDetailsDialog";
import FacilityStatusCard from "../components/feedbacks/FacilityStatusCard";
import { surveyService } from "@/services/surveyService";
import { useReportFilter } from "@/hooks/useReportFilter";

const ALLOWED_TYPES = ["evaluate", "reflect"] as const;
type FormType = (typeof ALLOWED_TYPES)[number];

const FeedbacksManagement: React.FC = () => {
  const toast = useRef<Toast>(null);
  const { type } = useParams();

  const isValidType =
    type === undefined || ALLOWED_TYPES.includes(type as FormType);

  if (!isValidType) {
    return <Navigate to="/admin" replace />;
  }

  const isEvaluate = type === "evaluate";

  const {
    filterType,
    dateFilter,
    finalUnit,
    finalUnitType,
    isFilterLoading,
    handleFilterChange,
    handleCustomDateChange,
  } = useReportFilter();

  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedSurveyKeys, setSelectedSurveyKeys] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const effectiveUnit =
    selectedUnits.length > 0 ? selectedUnits.join(",") : finalUnit;

  const {
    feedbacks,
    forms,
    loading: feedbacksLoading,
    totalRecords,
    lazyParams,
    selectedFeedback,
    dialogVisible,
    infoLabels,
    onPage,
    viewDetails,
    deleteFeedback,
    setDialogVisible,
  } = useFeedbacks(
    type,
    toast,
    selectedSurveyKeys,
    effectiveUnit,
    finalUnitType,
    isFilterLoading,
  );

  const {
    stats,
    loading: statsLoading,
    fetchDashboardStats,
    tiendoChartData,
    danhgiaChartData,
    barChartData,
    getPercentValue,
  } = useFeedbackStats(
    type,
    toast,
    selectedSurveyKeys,
    effectiveUnit,
    finalUnitType,
    isFilterLoading,
  );

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const data = await surveyService.fetchSurveys(1, 1000, type);
        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        setSurveys(list);
      } catch (err) {
        console.error("Lỗi khi tải danh sách khảo sát:", err);
      }
    };
    fetchSurveys();
  }, [type]);

  useEffect(() => {
    if (!isFilterLoading) {
      fetchDashboardStats(dateFilter);
    }
  }, [dateFilter, type, fetchDashboardStats, selectedSurveyKeys, isFilterLoading]);

  /**
   * Khi đang ở chế độ "Giám sát chất lượng" và chọn đúng 1 cuộc khảo sát
   * → hiển thị FacilityStatusCard với survey.id tương ứng
   */
  const facilityStatusSurvey = useMemo(() => {
    if (!isEvaluate || selectedSurveyKeys.length !== 1) return null;
    const key = selectedSurveyKeys[0];
    return surveys.find((s) => String(s.survey_key) === String(key) || String(s.id) === String(key)) ?? null;
  }, [isEvaluate, selectedSurveyKeys, surveys]);

  return (
    <AdminLayout title="Quản lý góp ý - phản hồi">
      <Toast ref={toast} />

      <ReportFilters
        filterType={filterType}
        handleFilterChange={handleFilterChange}
        dateFilter={dateFilter}
        handleCustomDateChange={handleCustomDateChange}
        reportHeader={null}
        surveys={surveys}
        selectedSurveyKeys={selectedSurveyKeys}
        onSurveyChange={(vals) => setSelectedSurveyKeys(vals)}
        showDateFilter={type !== "evaluate"}
        selectedUnits={selectedUnits}
        onUnitChange={setSelectedUnits}
      />

      {/* Tình trạng nộp phiếu theo cơ sở — chỉ hiện khi evaluate + đã chọn 1 survey */}
      {facilityStatusSurvey && (
        <FacilityStatusCard
          surveyId={facilityStatusSurvey.id}
          surveyName={facilityStatusSurvey.name}
        />
      )}

      <FeedbackStatsSection
        type={type}
        stats={stats}
        loading={statsLoading}
        tiendoChartData={tiendoChartData}
        danhgiaChartData={danhgiaChartData}
        barChartData={barChartData}
        getPercentValue={getPercentValue}
      />

      <FeedbackDataTable
        feedbacks={feedbacks}
        forms={forms}
        loading={feedbacksLoading}
        totalRecords={totalRecords}
        lazyParams={lazyParams}
        onPage={onPage}
        viewDetails={viewDetails}
        onDelete={deleteFeedback}
      />

      <FeedbackDetailsDialog
        dialogVisible={dialogVisible}
        setDialogVisible={setDialogVisible}
        selectedFeedback={selectedFeedback}
        infoLabels={infoLabels}
        type={type}
        onDelete={deleteFeedback}
      />
    </AdminLayout>
  );
};

export default FeedbacksManagement;
