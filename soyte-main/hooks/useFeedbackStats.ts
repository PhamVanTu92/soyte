import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { feedBacksSevice } from '../services/feedBacksSevice';
import { api } from '../api';
import { Toast } from 'primereact/toast';
import { DashboardStats } from '../types/DashboardStats';

function mapEvaluateDashboard(data: any): DashboardStats {
  const forms: any[] = data.forms || [];

  const dateSet = new Set<string>();
  for (const form of forms) {
    for (const t of (form.trend || [])) dateSet.add(t.date);
  }
  const categories = Array.from(dateSet);

  const summary = forms.map((form: any) => {
    const sections: string[] = form.sectionNames || [];
    const series = [
      {
        name: 'Điểm hài lòng chung',
        data: categories.map(date => {
          const pt = form.trend?.find((t: any) => t.date === date);
          return pt ? (pt.overall ?? null) : null;
        }),
      },
      ...sections.map(sectionName => ({
        name: sectionName,
        data: categories.map(date => {
          const pt = form.trend?.find((t: any) => t.date === date);
          return pt ? (pt[sectionName] ?? null) : null;
        }),
      })),
    ];
    return { id: form.id, name: form.name, series };
  });

  return {
    overview: {
      total: data.overview?.total || 0,
      pending: 0,
      accepted: 0,
      averageRating: data.overview?.averageRating || 0,
      satisfactionRate: data.overview?.satisfactionRate || 0,
    } as any,
    evaluate: {
      ratingDistribution: data.overview?.ratingDistribution || {
        star5: 0, star4: 0, star3: 0, star2: 0, star1: 0, star0: 0,
      },
    },
    categories,
    summary,
    reflect: {
      tiendo: { daLam: 0, dangLam: 0, chuaLam: 0 },
      danhgia: { dat: 0, khongDat: 0 },
      bySection: [],
      summary: { completedProgress: 0, completedRate: 0, needsFix: 0, reachedRate: 0, totalContent: 0 },
    },
    trend: [],
  };
}

export const useFeedbackStats = (type?: string, toastRef?: React.RefObject<Toast | null>, surveyKey?: string | string[], unit?: string, unitType?: string, isFilterLoading?: boolean) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    setStats(null);
  }, [type]);

  const fetchDashboardStats = useCallback(async (payload: { startDate: string, endDate: string }) => {
    if (isFilterLoading) return;
    try {
      setLoading(true);

      if (type === 'evaluate') {
        const keyParam = Array.isArray(surveyKey) ? surveyKey[0] : surveyKey;
        const response = await api.getEvaluateDashboard(keyParam || undefined);
        const data = response?.data ?? response;
        setStats(mapEvaluateDashboard(data));
      } else {
        const response = await feedBacksSevice.fetchStats(payload, type, surveyKey, unit, unitType);
        const data = response.data?.data || response.data;
        setStats(data);
      }
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
      toastRef?.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải dữ liệu thống kê từ máy chủ'
      });
    } finally {
      setLoading(false);
    }
  }, [toastRef, type, surveyKey, unit, unitType, isFilterLoading]);

  // Tính toán phần trăm cho biểu đồ
  const totalTiendo = stats && stats.reflect ? (stats.reflect.tiendo.daLam + stats.reflect.tiendo.dangLam + stats.reflect.tiendo.chuaLam) : 0;
  const totalDanhgia = stats && stats.reflect ? (stats.reflect.danhgia.dat + stats.reflect.danhgia.khongDat) : 0;

  // Hàm hỗ trợ tính % và làm tròn
  const getPercent = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) + '%' : '0%';
  };

  // Cấu hình dữ liệu cho Biểu đồ Tiến độ
  const tiendoChartData = useMemo(() => {
    if (!stats || !stats.reflect) return { labels: [], datasets: [] };
    const { tiendo } = stats.reflect;
    return {
      labels: [
        `Đã làm (${getPercent(tiendo.daLam, totalTiendo)})`,
        `Đang làm (${getPercent(tiendo.dangLam, totalTiendo)})`,
        `Chưa làm (${getPercent(tiendo.chuaLam, totalTiendo)})`
      ],
      datasets: [
        {
          data: [tiendo.daLam, tiendo.dangLam, tiendo.chuaLam],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], // Xanh lá, Vàng, Đỏ
          hoverBackgroundColor: ['#059669', '#d97706', '#dc2626']
        }
      ]
    };
  }, [stats, totalTiendo]);

  // Cấu hình dữ liệu cho Biểu đồ Đánh giá
  const danhgiaChartData = useMemo(() => {
    if (!stats || !stats.reflect) return { labels: [], datasets: [] };
    const { danhgia } = stats.reflect;
    return {
      labels: [
        `Đạt (${getPercent(danhgia.dat, totalDanhgia)})`,
        `Không đạt (${getPercent(danhgia.khongDat, totalDanhgia)})`
      ],
      datasets: [
        {
          data: [danhgia.dat, danhgia.khongDat],
          backgroundColor: ['#10b981', '#ef4444'], // Xanh lá, Đỏ
          hoverBackgroundColor: ['#059669', '#dc2626']
        }
      ]
    };
  }, [stats, totalDanhgia]);

  // Cấu hình cho biểu đồ cột ngang (chỉ dùng cho type evaluate)
  const barChartData = useMemo(() => {
    if (!stats || !stats.evaluate) return { labels: [], datasets: [] };
    const dist = stats.evaluate.ratingDistribution;
    return {
      labels: ['Rất tốt (5★)', 'Tốt (4★)', 'Trung bình (3★)', 'Kém (2★)', 'Rất kém (1★)', 'Không đánh giá'],
      datasets: [
        {
          label: 'Số lượng đánh giá',
          data: [
            dist.star5,
            dist.star4,
            dist.star3,
            dist.star2,
            dist.star1,
            dist.star0
          ],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444', '#94a3b8'],
          borderRadius: 4
        }
      ]
    };
  }, [stats]);
  
  const getPercentValue = getPercent;

  return {
    stats,
    loading,
    fetchDashboardStats,
    tiendoChartData,
    danhgiaChartData,
    barChartData,
    totalTiendo,
    totalDanhgia,
    getPercentValue
  };
};
