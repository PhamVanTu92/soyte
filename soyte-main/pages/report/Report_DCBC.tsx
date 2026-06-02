import AdminLayout from "@/components/AdminLayout";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { feedBacksSevice } from "@/services/feedBacksSevice";
import { formService } from "@/services/formService";
import { ReportTabContent } from "@/components/report/ReportTabContent";
import { ReportFilters } from "@/components/report/ReportFilters";
import { Toast } from "@/components/prime";
import { TabView, TabPanel } from "primereact/tabview";
import { FeedbackItem } from "@/types/feedbacks";
import { exportReportToPDF } from "@/utils/pdfExport";
import { exportReportToWord } from "@/utils/wordExport";
import { ReportAppendix } from "@/components/report/ReportAppendix";
import { ReportHeader } from "@/components/report/ReportHeader";
import {
  ReportLoadingState,
  ReportEmptyState,
  StyledTabViewCSS,
} from "@/components/report/ReportStates";
import { useReportFilter } from "@/hooks/useReportFilter";
import { useFacilities } from "@/hooks/useFacilities";
import { surveyService } from "@/services/surveyService";
import { getReportedFacilityId } from "@/utils/reportDataUtils";

const Report_DCBC = () => {
  const { facilities } = useFacilities();
  const toast = useRef<Toast>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [formTemplates, setFormTemplates] = useState<Record<string, any>>({});
  const fetchedTemplatesRef = useRef<Set<string>>(new Set());
  const loadingTemplatesRef = useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedSurveyKey, setSelectedSurveyKey] = useState<string>("");

  const { 
    filterType, 
    dateFilter, 
    finalUnit,
    finalUnitType,
    isFilterLoading,
    handleFilterChange, 
    handleCustomDateChange,
  } = useReportFilter();

  const userFacilities = useMemo(() => {
    if (!facilities.length || isFilterLoading) return [];
    let filtered = [...facilities];
    if (finalUnitType) {
      filtered = filtered.filter(f => (f.type || "").toString().toUpperCase().trim() === finalUnitType.toUpperCase().trim());
    }
    if (finalUnit) {
      const unitIds = finalUnit.split(',').map(id => id.trim());
      filtered = filtered.filter(f => unitIds.includes(String(f.id)));
    }
    return filtered;
  }, [facilities, finalUnit, finalUnitType, isFilterLoading]);

  const fetchAllFeedbacks = async () => {
    if (isFilterLoading) return;
    try {
      setLoading(true);
      const response = await feedBacksSevice.fetchFeedBacksByType(
        "reflect",
        dateFilter.startDate,
        dateFilter.endDate,
        selectedSurveyKey,
        finalUnit,
        finalUnitType
      );
      const data = response.data || response;
      let list: any[] = [];

      if (data?.items && Array.isArray(data.items)) {
        list = data.items;
      } else if (data?.data?.items && Array.isArray(data.data.items)) {
        list = data.data.items;
      } else if (Array.isArray(data)) {
        list = data;
      }
      setFeedbacks(list);
    } catch (error) {
      console.error(error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải danh sách phản hồi để báo cáo",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFeedbacks();
  }, [
    dateFilter.startDate,
    dateFilter.endDate,
    selectedSurveyKey,
    finalUnit,
    finalUnitType,
    isFilterLoading,
  ]);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const data = await surveyService.fetchSurveys(1, 1000, "reflect");
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
  }, []);

  // Nhóm các phản hồi theo Biểu mẫu
  const groupedFeedbacks = useMemo<
    Record<string, { title: string; items: FeedbackItem[] }>
  >(() => {
    const groups: Record<string, { title: string; items: FeedbackItem[] }> = {};
    // Map phụ để khử trùng theo formId + unitId: formId -> { unitId -> latestFeedback }
    const formUnitMap: Record<string, Record<string, FeedbackItem>> = {};

    feedbacks.forEach((fb) => {
      const fId = String(fb.form_id || "unknown");

      // Xác định title cho group nếu chưa có
      if (!groups[fId]) {
        let title = "";
        if (Number(fId) === 3) title = "Khối các bệnh viện trực thuộc";
        else if (Number(fId) === 17) title = "Đơn vị trợ giúp xã hội trực thuộc";
        else if (Number(fId) === 18) title = "Khối các trạm y tế xã, phường";

        groups[fId] = {
          title: title || fb.info?.title || `Mẫu phản ánh (${fId})`,
          items: [],
        };
        formUnitMap[fId] = {};
      }

      // Xác định key duy nhất cho đơn vị để khử trùng
      const unitKey = getReportedFacilityId(fb, userFacilities) || `fb-${fb.id}`;

      const existing = formUnitMap[fId][unitKey];
      if (!existing) {
        formUnitMap[fId][unitKey] = fb;
      } else {
        // Ưu tiên bản ghi có ngày tạo mới nhất (trường hợp nộp lại nhiều lần)
        const existingDate = new Date(existing.createdAt || existing.created_at || existing.date || 0);
        const fbDate = new Date(fb.createdAt || fb.created_at || fb.date || 0);
        if (fbDate > existingDate) {
          formUnitMap[fId][unitKey] = fb;
        }
      }
    });

    // Chuyển kết quả từ formUnitMap vào groups.items
    Object.keys(formUnitMap).forEach(fId => {
      groups[fId].items = Object.values(formUnitMap[fId]);
    });

    return groups;
  }, [feedbacks, userFacilities]);

  // Tự động tải template cho tất cả các form có trong dữ liệu báo cáo
  useEffect(() => {
    const fetchTemplates = async () => {
      const formIds = Object.keys(groupedFeedbacks).filter(
        (id) => id !== "unknown",
      );

      for (const id of formIds) {
        if (
          !fetchedTemplatesRef.current.has(id) &&
          !loadingTemplatesRef.current.has(id)
        ) {
          loadingTemplatesRef.current.add(id);
          try {
            const res = await formService.fetchFormById(id);
            const tplData = res.data || res;
            setFormTemplates((prev) => ({ ...prev, [id]: tplData }));
            fetchedTemplatesRef.current.add(id);
          } catch (err) {
            console.error(`Error fetching template ${id}:`, err);
          } finally {
            loadingTemplatesRef.current.delete(id);
          }
        }
      }
    };

    if (Object.keys(groupedFeedbacks).length > 0) {
      fetchTemplates();
    }
  }, [groupedFeedbacks]);

  const exportToPDF = async () => {
    await exportReportToPDF(
      groupedFeedbacks,
      formTemplates,
      userFacilities,
      dateFilter,
      setLoading,
      (msg) =>
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: msg,
        }),
      (msg) =>
        toast.current?.show({ severity: "error", summary: "Lỗi", detail: msg }),
    );
  };

  const exportToWord = async () => {
    await exportReportToWord(
      groupedFeedbacks,
      formTemplates,
      userFacilities,
      dateFilter,
      setLoading,
      (msg) =>
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: msg,
        }),
      (msg) =>
        toast.current?.show({ severity: "error", summary: "Lỗi", detail: msg }),
    );
  };

  const reportHeader = (
    <ReportHeader
      title="Kết quả tiếp nhận báo cáo từ ngày"
      dateFilter={dateFilter}
      loading={loading}
      disabledExport={feedbacks.length === 0}
      onExportWord={exportToWord}
      onExportPDF={exportToPDF}
    />
  );

  return (
    <AdminLayout
      title="Đề cương báo cáo (DCBC)"
      subtitle="Báo cáo tình hình tiếp nhận và xử lý phản ánh, kiến nghị"
    >
      <Toast ref={toast} />

      <div className="space-y-6">
        <ReportFilters
          filterType={filterType}
          handleFilterChange={handleFilterChange}
          dateFilter={dateFilter}
          handleCustomDateChange={handleCustomDateChange}
          reportHeader={reportHeader}
          surveys={surveys}
          selectedSurveyKey={selectedSurveyKey}
          onSurveyChange={(val) => setSelectedSurveyKey(val)}
          isMulti={false}
        />

        {loading ? (
          <ReportLoadingState />
        ) : Object.keys(groupedFeedbacks).length > 0 ? (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <TabView className="styled-tabview" scrollable>
                {Object.entries(groupedFeedbacks).map(
                  ([formId, group]: [string, any]) => (
                    <TabPanel
                      key={formId}
                      header={
                        <span
                          title={group.title}
                          className="block font-semibold"
                        >
                          {group.title}
                        </span>
                      }
                    >
                      <div className="p-4 md:p-6 bg-slate-50 min-h-[50vh]">
                        <ReportTabContent
                          formId={formId}
                          feedbacks={group.items}
                          dateFilter={dateFilter}
                          surveyType="reflect"
                          formTemplate={formTemplates[formId]}
                          surveys={surveys}
                          selectedSurveyKey={selectedSurveyKey}
                        />
                      </div>
                    </TabPanel>
                  ),
                )}
              </TabView>
            </div>

            {/* Phụ lục danh sách các đơn vị */}
            <ReportAppendix
              groupedFeedbacks={groupedFeedbacks}
              formTemplates={formTemplates}
              type="DCBC"
              surveys={surveys}
              selectedSurveyKey={selectedSurveyKey}
              dateFilter={dateFilter}
            />
          </>
        ) : (
          <ReportEmptyState message="Không tìm thấy phản ánh nào trong khoảng thời gian đã chọn." />
        )}
      </div>

      <StyledTabViewCSS />
    </AdminLayout>
  );
};

export default Report_DCBC;
