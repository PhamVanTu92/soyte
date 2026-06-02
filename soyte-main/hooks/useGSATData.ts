import { useState, useEffect } from "react";
import { api } from "@/api";

export interface TableRow {
  id: number | string;
  type: string;
  col1?: any;
  col2?: any;
  col3?: any;
  col4?: any;
  col5?: any;
  col6?: any;
  col7?: any;
  col8?: any;
  isTotal?: boolean;
}

export interface GSATProcessedData {
  dataNgoaiTru: TableRow[];
  dataNoiTru: TableRow[];
  dataTiemChung: TableRow[];
  dataPhuLuc1: TableRow[];
  dataPhuLuc2: TableRow[];
  dataPhuLuc3: TableRow[];
}

// dataPhuLuc* đã có col1-col8 sẵn → pass through.
// dataNgoaiTru/NoiTru/TiemChung dùng selfUnitsReported, totalUnits, selfRate...
function mapRow(raw: any, index: number): TableRow {
  // Phụ lục: đã có col1-col8
  if ("col1" in raw) return { ...raw, id: raw.id ?? index + 1 };

  const selfUnits = raw.selfUnitsReported ?? 0;
  const totalUnits = raw.totalUnits ?? 0;
  const qrUnits = raw.qrUnitsReported ?? 0;

  const fmtRate = (r: any) => {
    const n = parseFloat(r);
    if (!n || isNaN(n)) return "";
    return n.toFixed(2) + "%";
  };

  return {
    id: raw.id ?? index + 1,
    type: raw.type ?? "",
    col1: totalUnits > 0 ? `${selfUnits}/${totalUnits}` : "",
    col2: raw.selfTotalPhieu || "",
    col3: fmtRate(raw.selfRate),
    col4: totalUnits > 0 ? `${qrUnits}/${totalUnits}` : "",
    col5: raw.qrTotalPhieu || "",
    col6: fmtRate(raw.qrRate),
    isTotal: raw.isTotal ?? false,
  };
}

function mapRows(arr: any[]): TableRow[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((r, i) => mapRow(r, i));
}

export function useGSATData(
  surveyKey: string,
  unit: string,
  isFilterLoading: boolean,
) {
  const [processedData, setProcessedData] = useState<GSATProcessedData>({
    dataNgoaiTru: [],
    dataNoiTru: [],
    dataTiemChung: [],
    dataPhuLuc1: [],
    dataPhuLuc2: [],
    dataPhuLuc3: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isFilterLoading) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.getGsatReport({
          survey_key: surveyKey || undefined,
          unit: unit && unit !== "none" ? unit : undefined,
        });

        const d = res?.data ?? res;

        setProcessedData({
          dataNgoaiTru: mapRows(d?.dataNgoaiTru ?? d?.ngoai_tru ?? []),
          dataNoiTru: mapRows(d?.dataNoiTru ?? d?.noi_tru ?? []),
          dataTiemChung: mapRows(d?.dataTiemChung ?? d?.tiem_chung ?? []),
          dataPhuLuc1: mapRows(d?.dataPhuLuc1 ?? d?.phu_luc_1 ?? d?.phuLuc1 ?? []),
          dataPhuLuc2: mapRows(d?.dataPhuLuc2 ?? d?.phu_luc_2 ?? d?.phuLuc2 ?? []),
          dataPhuLuc3: mapRows(d?.dataPhuLuc3 ?? d?.phu_luc_3 ?? d?.phuLuc3 ?? []),
        });
      } catch (err) {
        console.error("Lỗi khi tải báo cáo GSAT:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [surveyKey, unit, isFilterLoading]);

  return { processedData, loading, setLoading };
}
