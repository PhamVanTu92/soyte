import React, { useState, useCallback, useEffect } from 'react';
import { formService } from '../services/formService';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';
import { TemplateData, GroupNode, OptionNode, InfoNode } from '../types/templates';
import { confirmDialog } from 'primereact/confirmdialog';

export const useTemplateForm = (
  id: string | undefined,
  type: string | undefined,
  toastRef: React.RefObject<Toast | null>
) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [template, setTemplate] = useState<TemplateData>({
    name: "",
    description: "",
    status: true,
    type: type || "reflect",
    info: [],
    startDate: null,
    endDate: null,
    data: [
      {
        name: "",
        status: true,
        Roman: "roman",
        option: []
      }
    ]
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const toggleGroup = (index: number) => {
    setExpandedGroups(prev => ({ ...prev, [index]: prev[index] === undefined ? false : !prev[index] }));
  };

  const fetchTemplate = useCallback(async () => {
    if (id) {
      try {
        setFetching(true);
        const data = await formService.fetchFormById(id);
        const templateData = data?.data || data;
        if (templateData) {
          setTemplate({
            ...templateData,
            status: templateData.status === 'active' || templateData.status === 'true' || templateData.status === true,
            startDate: templateData.startDate ? new Date(templateData.startDate) : null,
            endDate: templateData.endDate ? new Date(templateData.endDate) : null
          });
        }
      } catch (error) {
        console.error(error);
        toastRef?.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải biểu mẫu' });
      } finally {
        setFetching(false);
      }
    }
  }, [id, toastRef]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const validateTemplate = () => {
    if (!template.name || template.name.trim() === "") {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng nhập tên biểu mẫu để tiếp tục',
        life: 3000
      });
      return false;
    }

    if (template.startDate && template.endDate) {
      if (new Date(template.startDate) > new Date(template.endDate)) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Kiểm tra lại',
          detail: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
          life: 3000
        });
        return false;
      }
    }

    return true;
  };

  const saveAction = async () => {
    try {
      setLoading(true);
      const cleanedData = template.data
        .map(group => ({
          ...group,
          option: group.option.filter(opt => opt.content && opt.content.trim() !== "")
        }))
        .filter(group => (group.option && group.option.length > 0) || (group.name && group.name.trim() !== ""));

      const cleanedInfo = (template.info || []).filter(info => info.title && info.title.trim() !== "");

      const payload = {
        ...template,
        data: cleanedData,
        info: cleanedInfo,
        status: template.status ? 'active' : 'inactive'
      };

      let res;
      if (id) {
        res = await formService.updateForm(id, payload);
      } else {
        res = await formService.createForm(payload);
      }
      if (!res?.message) {
        toastRef.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã lưu biểu mẫu",
        });
      }
      setTimeout(() => {
        navigate(template.type ? `/admin/templates/${template.type}` : '/admin/templates');
      }, 1000);
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes("API Error")) {
        toastRef.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Lỗi khi lưu biểu mẫu",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!validateTemplate()) return;

    confirmDialog({
      header: 'Xác nhận lưu biểu mẫu',
      message: 'Bạn có chắc chắn muốn lưu tất cả các nội dung và thiết lập này không?',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Đồng ý lưu',
      acceptClassName: 'p-button-primary px-4 py-2 border-round-lg shadow-1 ml-2 text-white bg-primary-600',
      rejectLabel: 'Quay lại',
      rejectClassName: 'p-button-text text-slate-500 px-4 py-2 border-round-lg',
      accept: () => saveAction()
    });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Group functions
  const addGroup = () => {
    setTemplate((prev) => ({
      ...prev,
      data: [...prev.data, { name: "", status: true, Roman: "roman", option: [] }]
    }));
  };

  const updateGroup = (index: number, field: keyof GroupNode, val: any) => {
    const newData = [...template.data];
    newData[index] = { ...newData[index], [field]: val };
    
    if (field === 'status') {
      newData[index].option = newData[index].option.map(opt => ({
        ...opt,
        status: val
      }));
    } else if (field === 'isValidate') {
      newData[index].option = newData[index].option.map(opt => ({
        ...opt,
        isValidate: val
      }));
    }
    
    setTemplate({ ...template, data: newData });
  };

  const removeGroup = (index: number) => {
    const newData = [...template.data];
    newData.splice(index, 1);
    setTemplate({ ...template, data: newData });
  };

  // Option functions
  const addOption = (groupIndex: number) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];

    const allOptions = template.data.flatMap(g => g.option || []);
    const nextKey = allOptions.length > 0
      ? Math.max(...allOptions.map(o => typeof o.key === 'number' ? o.key : (Number(o.key) || 0))) + 1
      : 1;

    newOptions.push({
      key: nextKey,
      content: "",
      method: "",
      productOut: "",
      progress: { type: "tiendo", value: -1 },
      rating: { type: "danhgia", value: -1 },
      ratingVote: { type: "hailong", value: -1 },
      note: "",
      answerType: "score1_5",
      answerOptions: [],
      status: true
    });
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const updateOption = (groupIndex: number, optionIndex: number, field: keyof OptionNode, val: any) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: val };
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    newOptions.splice(optionIndex, 1);
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const addAnswerOption = (groupIndex: number, optionIndex: number) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    const currentAnsOpts = newOptions[optionIndex].answerOptions || [];
    const nextKey = currentAnsOpts.length > 0
      ? Math.max(...currentAnsOpts.map(o => typeof o.key === 'number' ? o.key : (Number(o.key) || 0))) + 1
      : 1;
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      answerOptions: [...currentAnsOpts, { key: nextKey, value: "" }]
    };
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const updateAnswerOption = (groupIndex: number, optionIndex: number, ansIdx: number, val: string) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    const currentAnsOpts = [...(newOptions[optionIndex].answerOptions || [])];
    currentAnsOpts[ansIdx] = { ...currentAnsOpts[ansIdx], value: val };
    newOptions[optionIndex] = { ...newOptions[optionIndex], answerOptions: currentAnsOpts };
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const removeAnswerOption = (groupIndex: number, optionIndex: number, ansIdx: number) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    const currentAnsOpts = [...(newOptions[optionIndex].answerOptions || [])];
    currentAnsOpts.splice(ansIdx, 1);
    newOptions[optionIndex] = { ...newOptions[optionIndex], answerOptions: currentAnsOpts };
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  // Info functions
  const addInfoField = () => {
    const currentInfo = template.info || [];
    const nextKey = currentInfo.length > 0
      ? Math.max(...currentInfo.map(i => typeof i.key === 'number' ? i.key : (Number(i.key) || 0))) + 1
      : 1;
    setTemplate((prev) => ({
      ...prev,
      info: [...(prev.info || []), { key: nextKey, title: "", value: "", type: "text", status: true, isValidate: false, isDisable: false, option: [] }]
    }));
  };

  const updateInfoField = (index: number, field: keyof InfoNode, val: any) => {
    const newInfo = [...(template.info || [])];
    newInfo[index] = { ...newInfo[index], [field]: val };
    if (field === 'title') {
      newInfo[index].value = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, '_').toLowerCase();
    }
    setTemplate({ ...template, info: newInfo });
  };

  const removeInfoField = (index: number) => {
    const newInfo = [...(template.info || [])];
    newInfo.splice(index, 1);
    setTemplate({ ...template, info: newInfo });
  };

  const addInfoOption = (infoIndex: number) => {
    const newInfo = [...(template.info || [])];
    const newOptions = [...(newInfo[infoIndex].option || [])];
    const nextKey = newOptions.length > 0
      ? Math.max(...newOptions.map(o => typeof o.key === 'number' ? o.key : (Number(o.key) || 0))) + 1
      : 1;
    newOptions.push({ key: nextKey, value: "" });
    newInfo[infoIndex] = { ...newInfo[infoIndex], option: newOptions };
    setTemplate({ ...template, info: newInfo });
  };

  const updateInfoOption = (infoIndex: number, optIndex: number, val: string) => {
    const newInfo = [...(template.info || [])];
    const newOptions = [...newInfo[infoIndex].option];
    newOptions[optIndex] = { ...newOptions[optIndex], value: val };
    newInfo[infoIndex] = { ...newInfo[infoIndex], option: newOptions };
    setTemplate({ ...template, info: newInfo });
  };

  const removeInfoOption = (infoIndex: number, optIndex: number) => {
    const newInfo = [...(template.info || [])];
    const newOptions = [...newInfo[infoIndex].option];
    newOptions.splice(optIndex, 1);
    newInfo[infoIndex] = { ...newInfo[infoIndex], option: newOptions };
    setTemplate({ ...template, info: newInfo });
  };

  return {
    template,
    setTemplate,
    loading,
    fetching,
    expandedGroups,
    toggleGroup,
    fetchTemplate,
    handleSave,
    handleCancel,
    addGroup,
    updateGroup,
    removeGroup,
    addOption,
    updateOption,
    removeOption,
    addAnswerOption,
    updateAnswerOption,
    removeAnswerOption,
    addInfoField,
    updateInfoField,
    removeInfoField,
    addInfoOption,
    updateInfoOption,
    removeInfoOption
  };
};
