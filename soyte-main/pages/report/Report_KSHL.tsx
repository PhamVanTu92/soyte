import AdminLayout from "@/components/AdminLayout";
import React, { useState, useRef } from "react";
import { Toast } from "@/components/prime";
import { ReportFilters } from "@/components/report/ReportFilters";
import { TablePreview } from "@/components/report/TablePreview";
import { exportKSHLToWord } from "@/utils/wordExportKSHL";
import { exportKSHLToPDF } from "@/utils/pdfExportKSHL";
import { useGSATData } from "@/hooks/useGSATData";
import { ReportHeader } from "@/components/report/ReportHeader";
import { useReportFilter } from "@/hooks/useReportFilter";
import { surveyNewService } from "@/services/surveyNewService";

const Report_KSHL = () => {
  const toast = useRef<Toast>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedSurveyKey, setSelectedSurveyKey] = useState<string>("");

  const { finalUnit, isFilterLoading } = useReportFilter();

  // --- Trạng thái ẩn/hiện bảng ---
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>(
    {
      ngoaiTru: true,
      noiTru: true,
      tiemChung: true,
      phuLuc1: true,
      phuLuc2: true,
      phuLuc3: true,
    },
  );
  const toggleTable = (key: string) =>
    setExpandedTables((prev) => ({ ...prev, [key]: !prev[key] }));

  // --- Dữ liệu từ API GSAT ---
  const { processedData, loading, setLoading } = useGSATData(
    selectedSurveyKey,
    finalUnit ?? "",
    isFilterLoading,
  );
  const {
    dataNgoaiTru,
    dataNoiTru,
    dataTiemChung,
    dataPhuLuc1,
    dataPhuLuc2,
    dataPhuLuc3,
  } = processedData;

  React.useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const data = await surveyNewService.fetchSurveys(1, 1000, "evaluate");
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

  // --- Xuất file ---
  const exportPayload = {
    dataNgoaiTru,
    dataNoiTru,
    dataTiemChung,
    dataPhuLuc1,
    dataPhuLuc2,
    dataPhuLuc3,
  };

  const handleExportPDF = async () => {
    await exportKSHLToPDF(
      exportPayload,
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

  const handleExportWord = async () => {
    await exportKSHLToWord(
      exportPayload,
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
      title="Kết quả khảo sát hài lòng"
      loading={loading}
      onExportWord={handleExportWord}
      onExportPDF={handleExportPDF}
    />
  );

  const tableProps = { expandedTables, toggleTable };

  return (
    <AdminLayout title="Báo cáo Khảo sát hài lòng" subtitle="">
      <Toast ref={toast} />
      <div className="space-y-6 pb-10">
        <ReportFilters
          filterType=""
          handleFilterChange={() => {}}
          dateFilter={{ startDate: "", endDate: "" }}
          handleCustomDateChange={() => {}}
          reportHeader={reportHeader}
          surveys={surveys}
          selectedSurveyKey={selectedSurveyKey}
          onSurveyChange={(val) => setSelectedSurveyKey(val)}
          isMulti={false}
          showDateFilter={false}
        />

        {/* Bảng Tổng hợp */}
        <TablePreview
          title="1. Kết quả người bệnh ngoại trú"
          data={dataNgoaiTru}
          tableKey="ngoaiTru"
          {...tableProps}
        />
        <TablePreview
          title="2. Kết quả người bệnh nội trú"
          data={dataNoiTru}
          tableKey="noiTru"
          {...tableProps}
        />
        <TablePreview
          title="3. Kết quả người dân sử dụng dịch vụ tiêm chủng"
          data={dataTiemChung}
          tableKey="tiemChung"
          {...tableProps}
        />

        <hr className="my-8 border-slate-200" />

        {/* Bảng Phụ lục */}
        <TablePreview
          title="Phụ lục 1: Kết quả khảo sát hài lòng của các Bệnh viện công lập"
          data={dataPhuLuc1}
          isAppendix
          type1="nội trú"
          type2="ngoại trú"
          unitLabel="Tên bệnh viện"
          tableKey="phuLuc1"
          {...tableProps}
        />
        <TablePreview
          title="Phụ lục 2: Kết quả khảo sát hài lòng của các Bệnh viện ngoài công lập"
          data={dataPhuLuc2}
          isAppendix
          type1="nội trú"
          type2="ngoại trú"
          unitLabel="Tên bệnh viện"
          tableKey="phuLuc2"
          {...tableProps}
        />
        <TablePreview
          title="Phụ lục 3: Kết quả khảo sát hài lòng của các Trạm Y tế"
          data={dataPhuLuc3}
          isAppendix
          type1="tiêm chủng"
          type2="ngoại trú"
          unitLabel="Xã / Phường"
          tableKey="phuLuc3"
          {...tableProps}
        />
      </div>
    </AdminLayout>
  );
};

export default Report_KSHL;
