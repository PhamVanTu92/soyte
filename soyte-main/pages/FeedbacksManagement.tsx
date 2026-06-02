import AdminLayout from "../components/AdminLayout";
import React, { useRef, useState, useEffect } from "react";
import { Toast } from "@/components/prime";
import { Navigate, useParams } from "react-router-dom";
import { getDefaultDates } from "../utils/dateUtils";
import { useFeedbacks } from "../hooks/useFeedbacks";
import { useFeedbackStats } from "../hooks/useFeedbackStats";
import { ReportFilters } from "../components/report/ReportFilters";
import { FeedbackStatsSection } from "../components/feedbacks/FeedbackStatsSection";
import { FeedbackDataTable } from "../components/feedbacks/FeedbackDataTable";
import { FeedbackDetailsDialog } from "../components/feedbacks/FeedbackDetailsDialog";
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
    //return <Navigate to="/404" replace />;
    return <Navigate to="/admin" replace />;
  }
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

  const effectiveUnit = selectedUnits.length > 0 ? selectedUnits.join(",") : finalUnit;

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
  } = useFeedbacks(type, toast, selectedSurveyKeys, effectiveUnit, finalUnitType, isFilterLoading);

  const {
    stats,
    loading: statsLoading,
    fetchDashboardStats,
    tiendoChartData,
    danhgiaChartData,
    barChartData,
    getPercentValue,
  } = useFeedbackStats(type, toast, selectedSurveyKeys, effectiveUnit, finalUnitType, isFilterLoading);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const data = await surveyService.fetchSurveys(1, 1000, type);
        // Ensure list is always an array
        const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
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
