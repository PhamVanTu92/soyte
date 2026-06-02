import React, { useState, useEffect, useCallback } from 'react';
import { feedBacksSevice } from '../services/feedBacksSevice';
import { formService } from '../services/formService';
import { Toast } from 'primereact/toast';
import { FeedbackItem } from '../types/feedbacks';

export const useFeedbacks = (type?: string, toastRef?: React.RefObject<Toast | null>, surveyKey?: string | string[], unit?: string, unitType?: string, isFilterLoading?: boolean) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({ first: 0, rows: 30, page: 1 });
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [infoLabels, setInfoLabels] = useState<Record<string, string>>({});
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllForms = async () => {
      try {
        const res = await formService.fetchForms(1, 1000, type);
        const raw = res?.items || res?.data?.items || res?.data || res;
        setForms(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error("Lỗi khi tải danh sách biểu mẫu:", err);
        setForms([]);
      }
    };
    fetchAllForms();
  }, [type]);

  const fetchFeedbacks = useCallback(async () => {
    if (isFilterLoading) return;
    try {
      setLoading(true);
      const response = await feedBacksSevice.fetchFeedBacks(lazyParams.page, lazyParams.rows, type, surveyKey, unit, unitType);
      const data = response.data || response;
      let list: any[] = [];
      let total = 0;
      
      if (data?.items && Array.isArray(data.items)) { list = data.items; total = data.total || list.length; }
      else if (data?.data?.items && Array.isArray(data.data.items)) { list = data.data.items; total = data.data.total || list.length; }
      else if (Array.isArray(data)) { list = data; total = data.length; }
      
      setFeedbacks(list);
      setTotalRecords(total);
    } catch (error) {
      console.error(error);
      toastRef?.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách phản hồi' });
    } finally {
      setLoading(false);
    }
  }, [lazyParams.page, lazyParams.rows, type, toastRef, surveyKey, unit, unitType, isFilterLoading]);

  useEffect(() => {
    if (!isFilterLoading) {
      fetchFeedbacks();
    }
  }, [fetchFeedbacks, isFilterLoading]);

  const onPage = (event: any) => {
    setLazyParams({ first: event.first, rows: event.rows, page: event.page + 1 });
  };

  const viewDetails = async (rowData: FeedbackItem) => {
    try {
      const id = rowData.id || rowData._id;
      if (!id) {
          setSelectedFeedback(rowData);
          setDialogVisible(true);
          return;
      }
      
      const response = await feedBacksSevice.fetchFeedBackById(id);
      const data = response.data || response;
      const fbData = data.data || data;
      setSelectedFeedback(fbData);
      setDialogVisible(true);

      // Fetch dynamic labels from the form template
      const formId = fbData.form_id;
      if (formId) {
        try {
          const formRes = await formService.fetchFormById(formId);
          const formData = formRes.data || formRes;
          if (formData?.info && Array.isArray(formData.info)) {
            const labelMap: Record<string, string> = {};
            formData.info.forEach((item: any) => {
              if (item.key !== undefined) {
                labelMap[String(item.key)] = item.title;
              }
            });
            setInfoLabels(labelMap);
          } else {
            setInfoLabels({});
          }
        } catch (err) {
          console.error("Lỗi khi tải thông tin biểu mẫu:", err);
          setInfoLabels({});
        }
      } else {
        setInfoLabels({});
      }
    } catch (error) {
      console.error(error);
      toastRef?.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải chi tiết phản hồi' });
      setSelectedFeedback(rowData);
      setDialogVisible(true);
    }
  };

  const deleteFeedback = async (id: string) => {
    try {
      setLoading(true);
      const res = await feedBacksSevice.deleteFeedBack(id);
      if (!res?.message) {
        toastRef?.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã xoá phản hồi",
        });
      }
      await fetchFeedbacks();
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes("API Error")) {
        toastRef?.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể xoá phản hồi",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    feedbacks,
    forms,
    loading,
    totalRecords,
    lazyParams,
    selectedFeedback,
    dialogVisible,
    infoLabels,
    onPage,
    viewDetails,
    deleteFeedback,
    setDialogVisible,
    fetchFeedbacks
  };
};
