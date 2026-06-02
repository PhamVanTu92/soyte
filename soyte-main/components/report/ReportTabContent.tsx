import React, { useState, useEffect, useMemo } from 'react';
import { formService } from '@/services/formService';
import { FeedbackItem } from '@/types/feedbacks';
import { useFacilities } from '@/hooks/useFacilities';
import { Dropdown } from 'primereact/dropdown';
import { feedBacksSevice } from '@/services/feedBacksSevice';

interface ReportTabContentProps {
    formId: string;
    feedbacks: FeedbackItem[];
    dateFilter: { startDate: string, endDate: string };
    surveyType: string;
    totalUnits?: number;
    formTemplate?: any; // Nhận template đã fetch từ cha
    surveys?: any[];
    selectedSurveyKey?: string;
}

export const ReportTabContent: React.FC<ReportTabContentProps> = ({
    formId,
    feedbacks,
    dateFilter,
    surveyType,
    formTemplate: propTemplate,
    surveys = [],
    selectedSurveyKey = ""
}) => {
    const { facilities } = useFacilities();
    const [detailedFeedbacks, setDetailedFeedbacks] = useState<any[]>([]);
    const [formTemplate, setFormTemplate] = useState<any>(propTemplate || null);
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
    
    // Trạng thái cho dữ liệu so sánh
    const [compareData, setCompareData] = useState<any>(null);
    const [isCompareLoading, setIsCompareLoading] = useState(false);

    // Fetch dữ liệu so sánh khi chọn survey ở dropdown đầu
    useEffect(() => {
        const fetchCompareData = async () => {
            const isAllSurveys = !selectedSurveyKey || selectedSurveyKey === "" || selectedSurveyKey === "undefined";
            
            try {
                setIsCompareLoading(true);
                // Nếu chọn tất cả, truyền type thay vì survey_key
                const res = await feedBacksSevice.fetchCompare(
                    isAllSurveys ? undefined : selectedSurveyKey,
                    isAllSurveys ? surveyType : undefined
                );
                setCompareData(res.data || res);
            } catch (err) {
                console.error("Error fetching compare data:", err);
                setCompareData(null);
            } finally {
                setIsCompareLoading(false);
            }
        };

        fetchCompareData();
    }, [selectedSurveyKey, surveyType]);

    // Tính tổng số đơn vị dự kiến dựa trên thông tin biểu mẫu gốc
    const totalUnits = useMemo(() => {
        if (!formTemplate) return 0;

        // Metadata của biểu mẫu có thể lưu trong 'info' hoặc 'data.info' tùy vào cách lấy dữ liệu
        const infoSource = formTemplate.info || formTemplate.data?.info;
        if (!infoSource) return 0;

        // Tìm trường thông tin xác định đơn vị nào cần báo cáo
        // Tìm loại 'facility_multiselect' hoặc tiêu đề có chứa 'Cơ sở y tế' hoặc 'Đơn vị'
        let facilityField: any = null;

        const findInArray = (arr: any[]) => {
            return arr.find((i: any) =>
                i.type === 'facility_multiselect' ||
                (i.title && (i.title.toLowerCase().includes('cơ sở y tế') || i.title.toLowerCase().includes('đơn vị')))
            );
        };

        if (Array.isArray(infoSource)) {
            facilityField = findInArray(infoSource);
        } else if (typeof infoSource === 'object') {
            const values = Object.values(infoSource);
            facilityField = findInArray(values);
        }

        if (!facilityField) return 0;

        // 1. Nếu các đơn vị được chọn thủ công (danh sách cố định)
        if (facilityField.option && Array.isArray(facilityField.option) && facilityField.option.length > 0) {
            return facilityField.option.length;
        }

        // 2. Nếu là danh sách động dựa trên loại đơn vị (VD: tất cả TYT)
        const selectedTypes = facilityField.facilityTypeFilter || [];
        const filteredFacilities = facilities.filter(f =>
            selectedTypes.length === 0 || selectedTypes.includes(f.type)
        );
        return filteredFacilities.length;
    }, [formTemplate, facilities]);

    // Trạng thái mở rộng cho Bảng 3
    const [expandedGroupsTable3, setExpandedGroupsTable3] = useState<Record<number, boolean>>({});

    // Thống kê tổng hợp tình hình báo cáo 
    const summaryStats = useMemo(() => {
        const reportedCount = feedbacks.length;
        const unReportingCount = Math.max(0, totalUnits - reportedCount);

        let onTimeCount = 0;
        let lateCount = 0;

        // Phân loại "Đúng hạn" và "Không đúng hạn" theo ngày giới hạn của cuộc khảo sát (ưu tiên) hoặc biểu mẫu
        const currentSurvey = selectedSurveyKey ? surveys?.find((s: any) => String(s.key || s.id) === String(selectedSurveyKey)) : null;

        feedbacks.forEach(fb => {
            let activeSurvey = currentSurvey;
            if (!activeSurvey && surveys && surveys.length > 0) {
                const fbSurveyId = fb.survey_id || fb.surveyId || fb.info?.survey_id;
                if (fbSurveyId) {
                    activeSurvey = surveys.find(s => String(s.key || s.id) === String(fbSurveyId));
                }
                if (!activeSurvey) {
                    activeSurvey = surveys.find((s: any) => (s.form_ids || []).some((f: any) => String(f.form_id || f.id || f) === String(formId)));
                }
            }

            let startLimit = null;
            let endLimit = null;

            if (activeSurvey && (activeSurvey.dateFrom || activeSurvey.dateTo)) {
                startLimit = activeSurvey.dateFrom ? new Date(activeSurvey.dateFrom) : null;
                endLimit = activeSurvey.dateTo ? new Date(activeSurvey.dateTo) : null;
            } else if (formTemplate && (formTemplate.startDate || formTemplate.endDate)) {
                startLimit = formTemplate.startDate ? new Date(formTemplate.startDate) : null;
                endLimit = formTemplate.endDate ? new Date(formTemplate.endDate) : null;
            }

            if (startLimit) startLimit.setHours(0, 0, 0, 0);
            if (endLimit) endLimit.setHours(23, 59, 59, 999);

            const submissionDate = new Date(fb.createdAt || fb.created_at || fb.date || Date.now());
            const isAfterStart = !startLimit || submissionDate >= startLimit;
            const isBeforeEnd = !endLimit || submissionDate <= endLimit;

            if (isAfterStart && isBeforeEnd) {
                onTimeCount++;
            } else {
                lateCount++;
            }
        });

        return [
            { id: 1, name: 'Đơn vị báo cáo', count: reportedCount, rate: totalUnits > 0 ? `${((reportedCount / totalUnits) * 100).toFixed(1)}%` : '0%' },
            { id: 2, name: 'Đơn vị không báo cáo', count: unReportingCount, rate: totalUnits > 0 ? `${(unReportingCount / totalUnits * 100).toFixed(1)}%` : '0%' },
            { id: 3, name: 'Đơn vị báo cáo đúng hạn', count: onTimeCount, rate: totalUnits > 0 ? `${((onTimeCount / totalUnits) * 100).toFixed(1)}%` : '0%' },
            { id: 4, name: 'Đơn vị báo cáo không đúng hạn', count: lateCount, rate: totalUnits > 0 ? `${((lateCount / totalUnits) * 100).toFixed(1)}%` : '0%' },
        ];
    }, [feedbacks, totalUnits, formTemplate, surveys, selectedSurveyKey, formId]);

    useEffect(() => {
        // Luôn cập nhật template khi dữ liệu từ cha (propTemplate) thay đổi
        if (propTemplate) {
            setFormTemplate(propTemplate);
        }
    }, [propTemplate]);

    // Trạng thái loading cho riêng phần biểu mẫu nếu dữ liệu từ cha chưa về kịp
    const isTemplateLoading = !formTemplate && formId && formId !== 'unknown';

    useEffect(() => {
        // Cập nhật chi tiết khi feedbacks từ cha truyền xuống thay đổi
        setDetailedFeedbacks(feedbacks || []);
    }, [feedbacks]);

    // Tổng hợp dữ liệu từ các section để xây dựng Bảng 2
    // Đếm số lượng đơn vị đã làm, đang làm, chưa làm cho mỗi nội dung kiểm tra
    const aggregatedChecks = React.useMemo(() => {
        if (!detailedFeedbacks || detailedFeedbacks.length === 0) return [];

        // Sử dụng các section của phản hồi đầu tiên làm cấu trúc mẫu
        const templateSections = detailedFeedbacks[0].sections;
        if (!templateSections || templateSections.length === 0) return [];

        const aggregated = templateSections.map((group: any) => {
            return {
                name: group.name,
                options: group.option.map((optTemplate: any) => {
                    // Tìm các tùy chọn tương ứng trong tất cả phản hồi
                    let daLam = 0;
                    let dangLam = 0;
                    let chuaLam = 0;

                    detailedFeedbacks.forEach(fb => {
                        if (!fb.sections) return;
                        // Tìm nhóm và tùy chọn này trong phản hồi
                        const fbGroup = fb.sections.find((g: any) => g.name === group.name);
                        if (fbGroup && fbGroup.option) {
                            const fbOpt = fbGroup.option.find((o: any) => o.content === optTemplate.content);
                            if (fbOpt) {
                                const tiendo = Number(fbOpt.tiendo);
                                if (tiendo === 1) daLam++;
                                else if (tiendo === 2) dangLam++;
                                else if (tiendo === 3) chuaLam++;
                            }
                        }
                    });

                    return {
                        content: optTemplate.content,
                        method: optTemplate.method,
                        productOut: optTemplate.productOut,
                        statusCounts: { daLam, dangLam, chuaLam }
                    };
                })
            };
        });

        return aggregated;
    }, [detailedFeedbacks]);

    // Duyệt tất cả cơ sở để tạo ra mảng các loại (tiền tố) duy nhất từ API (ví dụ: ['bv', 'bt', 'tyt'])
    const facilityTypeSet = React.useMemo(() => {
        const types = new Set<string>();
        facilities.forEach(f => {
            if (f.type) types.add(f.type.toLowerCase());
        });
        return types;
    }, [facilities]);

    // Hàm hỗ trợ trích xuất tên đơn vị từ thông tin phản hồi (info)
    const getUnitName = (fb: any) => {
        if (fb.info) {
            // Tìm kiếm trong các trường của info để xác định trường nào chứa thông tin đơn vị/bệnh viện
            for (const key in fb.info) {
                const field = fb.info[key];
                // Kiểm tra cấu trúc: field.value là object có key (slug/id)
                if (field && typeof field === 'object' && field.value && typeof field.value === 'object' && field.value.key) {
                    const fbKey = String(field.value.key).toLowerCase();
                    // Lấy phần tiền tố trước dấu gạch ngang (ví dụ: 'bt-1' -> 'bt')
                    const prefix = fbKey.split('-')[0];
                    
                    // Kiểm tra xem tiền tố có nằm trong danh sách loại cơ sở từ API không
                    if (facilityTypeSet.has(prefix)) {
                        return field.value.value || field.value.name || "Đơn vị";
                    }
                }
            }
        }
        // Fallback: sử dụng facility_id hoặc các trường tên cơ bản
        const facilityId = fb.facility_id || fb.info?.facility_id;
        const facility = facilities.find(f => String(f.id) === String(facilityId));
        return facility ? facility.name : (fb.fullName || fb.name || `Đơn vị (${facilityId || '?'})`);
    };

    // Tổng hợp dữ liệu cho Bảng 3: Theo dõi tiến độ từng đơn vị (Gộp theo nhóm La mã, so sánh tháng)
    const unitProgressData = React.useMemo(() => {
        if (!detailedFeedbacks || detailedFeedbacks.length === 0) return [];

        const templateSections = detailedFeedbacks[0].sections;
        if (!templateSections || templateSections.length === 0) return [];

        // Xác định tháng hiện tại và tháng trước dựa trên dateFilter (hoặc thời gian thực)
        const now = new Date();
        const currentMonth = dateFilter?.endDate ? new Date(dateFilter.endDate).getMonth() : now.getMonth();
        const currentYear = dateFilter?.endDate ? new Date(dateFilter.endDate).getFullYear() : now.getFullYear();
        
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // IDs của survey (cho logic cũ)
        const currentSurveyId = compareData?.currentSurvey?.id;
        const previousSurveyId = compareData?.previousSurvey?.id;
        
        // Dữ liệu mảng mới từ API compare
        const compareCurrentList = Array.isArray(compareData?.current) 
            ? compareData.current.filter((u: any) => String(u.form_id || u.formId) === String(formId))
            : null;
        const comparePreviousList = Array.isArray(compareData?.previous) 
            ? compareData.previous.filter((u: any) => String(u.form_id || u.formId) === String(formId))
            : null;

        return templateSections.map((group: any) => {
            // Nhóm dữ liệu theo đơn vị
            const unitMap: Record<string, { name: string, ky1Vals: number[], ky2Vals: number[] }> = {};

            // Nếu có dữ liệu mảng từ API compare, ưu tiên sử dụng
            if (compareCurrentList) {
                compareCurrentList.forEach((u: any) => {
                    const unitName = u.unit || u.name;
                    if (!unitMap[unitName]) unitMap[unitName] = { name: unitName, ky1Vals: [], ky2Vals: [] };
                    
                    const section = u.bySection?.find((s: any) => s.name === group.name);
                    if (section && section.total > 0) {
                        const rate = Math.round((section.danhgia?.dat || 0) / section.total * 100);
                        unitMap[unitName].ky2Vals.push(rate);
                    }
                });
            }

            if (comparePreviousList) {
                comparePreviousList.forEach((u: any) => {
                    const unitName = u.unit || u.name;
                    if (!unitMap[unitName]) unitMap[unitName] = { name: unitName, ky1Vals: [], ky2Vals: [] };
                    
                    const section = u.bySection?.find((s: any) => s.name === group.name);
                    if (section && section.total > 0) {
                        const rate = Math.round((section.danhgia?.dat || 0) / section.total * 100);
                        unitMap[unitName].ky1Vals.push(rate);
                    }
                });
            }

            // Nếu chưa có dữ liệu từ API compare (hoặc bổ sung thêm từ feedbacks hiện tại), 
            // thực hiện logic tính toán thủ công
            if (!compareCurrentList && !comparePreviousList) {
                detailedFeedbacks.forEach(fb => {
                    const unitName = getUnitName(fb);

                    if (!unitMap[unitName]) {
                        unitMap[unitName] = { name: unitName, ky1Vals: [], ky2Vals: [] };
                    }

                    const fbGroup = fb.sections?.find((g: any) => g.name === group.name);
                    if (fbGroup && fbGroup.option) {
                        const fbDate = new Date(fb.createdAt || fb.created_at || fb.date || Date.now());
                        const fbMonth = fbDate.getMonth();
                        const fbYear = fbDate.getFullYear();

                        let groupTotal = 0;
                        let groupCount = 0;
                        fbGroup.option.forEach((opt: any) => {
                            const val = Number(opt.danhgia);
                            if ([1, 2].includes(val)) {
                                groupTotal += (val === 1 ? 100 : 0);
                                groupCount++;
                            }
                        });

                        if (groupCount > 0) {
                            const avg = groupTotal / groupCount;
                            
                            // Ưu tiên so sánh theo survey_id nếu có compareData
                            if (currentSurveyId && previousSurveyId) {
                                const fbSurveyId = fb.survey_id || fb.surveyId || fb.info?.survey_id;
                                if (String(fbSurveyId) === String(currentSurveyId)) {
                                    unitMap[unitName].ky2Vals.push(avg);
                                } else if (String(fbSurveyId) === String(previousSurveyId)) {
                                    unitMap[unitName].ky1Vals.push(avg);
                                }
                            } else {
                                // Fallback so sánh theo tháng như cũ
                                if (fbMonth === currentMonth && fbYear === currentYear) {
                                    unitMap[unitName].ky2Vals.push(avg);
                                } else if (fbMonth === prevMonth && fbYear === prevYear) {
                                    unitMap[unitName].ky1Vals.push(avg);
                                }
                            }
                        }
                    }
                });
            }

            const unitsDetail = Object.values(unitMap).map(u => {
                const ky2Avg = u.ky2Vals.length > 0 ? Math.round(u.ky2Vals.reduce((a, b) => a + b, 0) / u.ky2Vals.length) : 0;
                const ky1Avg = u.ky1Vals.length > 0 ? Math.round(u.ky1Vals.reduce((a, b) => a + b, 0) / u.ky1Vals.length) : 0;
                const diff = ky2Avg - ky1Avg;

                return {
                    unitName: u.name,
                    ky1: `${ky1Avg}%`,
                    ky2: `${ky2Avg}%`,
                    diff: diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '0%',
                    trend: diff > 0 ? 'Tăng' : diff < 0 ? 'Giảm' : 'Ổn định',
                    rank: ky2Avg >= 80 ? 'Tốt' : ky2Avg >= 50 ? 'Trung bình' : 'Chưa đạt'
                };
            });

            return {
                groupName: group.name,
                units: unitsDetail
            };
        });
    }, [detailedFeedbacks, facilities, dateFilter, compareData]);

    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {totalUnits > 0 && (
                <div className="text-slate-800 font-bold text-lg mb-2">
                    Tổng số: <span className="text-primary-700">{totalUnits}</span> đơn vị.
                </div>
            )}
            {/* Bảng 1: Thống kê tổng hợp */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <h3 className="font-bold text-slate-800 text-lg">Tổng hợp tình hình báo cáo</h3>
                </div>
                <div className="overflow-x-auto p-6">
                    <table className="w-full border-collapse border border-slate-300">
                        <thead className="bg-primary-900 text-white">
                            <tr>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-16">STT</th>
                                <th className="border border-slate-600 p-3 text-left font-semibold">Nội dung</th>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-32">Số lượng</th>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-32">Tỷ lệ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryStats.map((stat) => (
                                <tr key={stat.id} className="hover:bg-slate-50 border-b border-slate-200">
                                    <td className="border border-slate-300 p-3 text-center text-slate-700 font-medium">{stat.id}</td>
                                    <td className="border border-slate-300 p-3 text-slate-800 font-medium">{stat.name}</td>
                                    <td className="border border-slate-300 p-3 text-center font-bold text-primary-700">{stat.count}</td>
                                    <td className="border border-slate-300 p-3 text-center font-bold text-slate-600">{stat.rate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bảng 2: Chi tiết các nội dung kiểm tra */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div
                    className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                >
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Chi tiết tình trạng thực hiện các nội dung kiểm tra</h3>
                        <p className="text-sm text-slate-500 mt-1 italic">(Chỉ phân tích trên {feedbacks.length} đơn vị gửi báo cáo)</p>
                    </div>
                </div>

                <div className="overflow-x-auto p-6 animate-in slide-in-from-top-2 duration-300">
                    {isTemplateLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <i className="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
                            <span className="ml-3 text-slate-500">Đang tải chi tiết biểu mẫu...</span>
                        </div>
                    ) : aggregatedChecks.length > 0 ? (
                        <table className="w-full border-collapse border border-slate-300">
                            <thead className="bg-primary-900 text-white">
                                <tr>
                                    <th rowSpan={2} className="border border-slate-600 p-3 text-center font-semibold w-16 align-middle">STT</th>
                                    <th rowSpan={2} className="border border-slate-600 p-3 text-center font-semibold w-[30%] align-middle">Nội dung kiểm tra</th>
                                    <th rowSpan={2} className="border border-slate-600 p-3 text-center font-semibold w-[20%] align-middle">Phương thức thực hiện</th>
                                    <th rowSpan={2} className="border border-slate-600 p-3 text-center font-semibold w-[20%] align-middle">Bằng chứng, kết quả</th>
                                    <th colSpan={3} className="border border-slate-600 p-2 text-center font-semibold border-b-0">Tình trạng thực hiện</th>
                                </tr>
                                <tr>
                                    <th className="border border-slate-600 p-2 text-center text-sm">Đã thực hiện<br /><span className="text-xs font-normal opacity-80">(số đơn vị)</span></th>
                                    <th className="border border-slate-600 p-2 text-center text-sm">Đang thực hiện<br /><span className="text-xs font-normal opacity-80">(số đơn vị)</span></th>
                                    <th className="border border-slate-600 p-2 text-center text-sm">Chưa thực hiện<br /><span className="text-xs font-normal opacity-80">(số đơn vị)</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    let globalIdx = 0;
                                    return aggregatedChecks.map((group: any, gi: number) => {
                                        const isGroupExpanded = expandedGroups[gi] !== false;
                                        const groupStats = group.options.reduce((acc: any, opt: any) => {
                                            acc.daLam += opt.statusCounts.daLam;
                                            acc.dangLam += opt.statusCounts.dangLam;
                                            acc.chuaLam += opt.statusCounts.chuaLam;
                                            return acc;
                                        }, { daLam: 0, dangLam: 0, chuaLam: 0 });

                                        const formatStats = (total: number) => {
                                            return total === 0 ? '0' : total.toString();
                                        };

                                        return (
                                            <React.Fragment key={gi}>
                                                <tr
                                                    className="bg-primary-800 text-white cursor-pointer hover:bg-primary-700 transition-colors"
                                                    onClick={() => setExpandedGroups(prev => ({ ...prev, [gi]: !isGroupExpanded }))}
                                                >
                                                    <td className="border border-slate-600 p-2 text-center font-bold">
                                                        {roman[gi] || gi + 1}
                                                    </td>
                                                    <td colSpan={3} className="border border-slate-600 p-3 text-left font-bold text-sm">
                                                        <div className="flex justify-between items-center">
                                                            <span>{group.name || `Nhóm nội dung ${gi + 1}`}</span>
                                                            <i className={`pi ${isGroupExpanded ? 'pi-chevron-up' : 'pi-chevron-down'} text-xs ml-2 opacity-80`}></i>
                                                        </div>
                                                    </td>
                                                    <td className="border border-slate-600 p-2 text-center font-bold text-xs">
                                                        {formatStats(groupStats.daLam)}
                                                    </td>
                                                    <td className="border border-slate-600 p-2 text-center font-bold text-xs">
                                                        {formatStats(groupStats.dangLam)}
                                                    </td>
                                                    <td className="border border-slate-600 p-2 text-center font-bold text-xs">
                                                        {formatStats(groupStats.chuaLam)}
                                                    </td>
                                                </tr>
                                                {isGroupExpanded && group.options.map((opt: any, oi: number) => {
                                                    globalIdx++;
                                                    return (
                                                        <tr key={oi} className="hover:bg-slate-50 border-b border-slate-300">
                                                            <td className="border border-slate-300 p-3 text-center text-slate-700 font-medium">{globalIdx}</td>
                                                            <td className="border border-slate-300 p-3 text-sm text-slate-800">
                                                                <div className="whitespace-pre-wrap">{opt.content}</div>
                                                            </td>
                                                            <td className="border border-slate-300 p-3 text-sm text-slate-700">
                                                                <div className="whitespace-pre-wrap">{opt.method}</div>
                                                            </td>
                                                            <td className="border border-slate-300 p-3 text-sm text-slate-700">
                                                                <div className="whitespace-pre-wrap">{opt.productOut}</div>
                                                            </td>
                                                            <td className="border border-slate-300 p-3 text-center font-semibold text-primary-700">{opt.statusCounts.daLam || '0'}</td>
                                                            <td className="border border-slate-300 p-3 text-center font-semibold text-orange-600">{opt.statusCounts.dangLam || '0'}</td>
                                                            <td className="border border-slate-300 p-3 text-center font-semibold text-red-600">{opt.statusCounts.chuaLam || '0'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <i className="pi pi-inbox text-4xl text-slate-300 mb-3 block"></i>
                            <p className="text-slate-500">Chưa có dữ liệu phản hồi cho biểu mẫu này để phân tích.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bảng 3: Bảng theo dõi tiến độ khắc phục */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">Bảng theo dõi tiến độ khắc phục của đơn vị giữa các kỳ báo cáo</h3>
                    <div className="flex items-center gap-4">
                        {isCompareLoading && <i className="pi pi-spin pi-spinner text-primary-500"></i>}
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {unitProgressData.map((group: any, gi: number) => {
                        const isExpanded = expandedGroupsTable3[gi] !== false;
                        return (
                            <div key={gi} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div 
                                    className="bg-primary-900 text-white p-4 flex justify-between items-center cursor-pointer hover:bg-primary-800 transition-colors"
                                    onClick={() => setExpandedGroupsTable3(prev => ({ ...prev, [gi]: !isExpanded }))}
                                >
                                    <h4 className="font-bold flex items-center gap-3">
                                        <span className="bg-white text-primary-900 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                                            {roman[gi] || gi + 1}
                                        </span>
                                        {group.groupName}
                                    </h4>
                                    <i className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'} font-bold`}></i>
                                </div>
                                
                                {isExpanded && (
                                    <div className="p-4 bg-slate-50/50">
                                        <div className="overflow-x-auto bg-white rounded-xl shadow-inner border border-slate-200">
                                            <table className="w-full border-collapse">
                                                <thead className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider">
                                                    <tr>
                                                        <th className="border border-slate-200 p-3 text-center w-16">STT</th>
                                                        <th className="border border-slate-200 p-3 text-left">Đơn vị</th>
                                                        <th className="border border-slate-200 p-3 text-center w-24">Kỳ 1</th>
                                                        <th className="border border-slate-200 p-3 text-center w-24">Kỳ 2</th>
                                                        <th className="border border-slate-200 p-3 text-center w-24">Chênh lệch</th>
                                                        <th className="border border-slate-200 p-3 text-center w-24">Xu hướng</th>
                                                        <th className="border border-slate-200 p-3 text-center w-28">Xếp loại</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {group.units.map((unit: any, ui: number) => (
                                                        <tr key={ui} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                                            <td className="border border-slate-200 p-3 text-center text-slate-500 font-medium">{ui + 1}</td>
                                                            <td className="border border-slate-200 p-3 text-slate-800 font-semibold">{unit.unitName}</td>
                                                            <td className="border border-slate-200 p-3 text-center text-primary-700 font-bold">{unit.ky1}</td>
                                                            <td className="border border-slate-200 p-3 text-center text-slate-600 font-bold">{unit.ky2}</td>
                                                            <td className="border border-slate-200 p-3 text-center font-bold text-slate-700">{unit.diff}</td>
                                                            <td className="border border-slate-200 p-3 text-center">
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
                                                                    unit.trend.includes('Tăng') ? 'bg-green-100 text-green-700' : 
                                                                    unit.trend.includes('Giảm') ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                    {unit.trend}
                                                                </span>
                                                            </td>
                                                            <td className="border border-slate-200 p-3 text-center">
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
                                                                    unit.rank.includes('Tốt') ? 'bg-green-500 text-white' : 
                                                                    unit.rank.includes('Trung bình') ? 'bg-orange-500 text-white' : 
                                                                    unit.rank.includes('Chưa đạt') ? 'bg-red-500 text-white' : 'bg-slate-400 text-white'
                                                                }`}>
                                                                    {unit.rank}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
