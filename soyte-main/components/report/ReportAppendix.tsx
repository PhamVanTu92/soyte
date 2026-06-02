import React from 'react';
import { FeedbackItem } from '@/types/feedbacks';
import { useFacilities } from '@/hooks/useFacilities';
import { getReportedFacilityId, getExpectedFacilities } from '@/utils/reportDataUtils';

interface ReportAppendixProps {
    groupedFeedbacks: Record<string, { title: string, items: FeedbackItem[] }>;
    formTemplates?: Record<string, any>;
    type?: 'DCBC' | 'TCT01';
    surveys?: any[];
    selectedSurveyKey?: string;
    dateFilter?: any;
}

export const ReportAppendix: React.FC<ReportAppendixProps> = ({
    groupedFeedbacks,
    formTemplates,
    type = 'DCBC',
    surveys = [],
    selectedSurveyKey = "",
    dateFilter = null
}) => {
    const { facilities } = useFacilities();

    const getAppendixData = () => {
        const sortedEntries = (Object.entries(groupedFeedbacks) as [string, { title: string, items: FeedbackItem[] }][]).sort((a, b) => {
            const order: Record<string, number> = { "3": 1, "17": 2, "18": 3 };
            return (order[a[0]] || 99) - (order[b[0]] || 99);
        });

        if (type === 'TCT01') {
            return {
                app1Title: "PHỤ LỤC 1",
                app1Sub: "Danh mục các đơn vị đã thực hiện báo cáo trong kỳ",
                app1Items: sortedEntries.map(([formId, group]) => {
                    // Loại bỏ các đơn vị trùng lặp (nếu một đơn vị nộp nhiều lần)
                    const uniqueUnitsMap = new Map();
                    group.items.forEach(item => {
                        const name = getReportedFacilityName(item, facilities);
                        if (!uniqueUnitsMap.has(name)) {
                            uniqueUnitsMap.set(name, { id: item.id, name });
                        }
                    });
                    
                    return {
                        title: group.title,
                        units: Array.from(uniqueUnitsMap.values())
                    };
                }),
                app2Title: null,
                app2Sub: null,
                app2Items: []
            };
        } else {
            const app1Groups = sortedEntries.map(([formId, group]) => {
                const template = formTemplates?.[formId];
                if (!template) return { title: group.title, units: [] };

                const expected = getExpectedFacilities(template, facilities);

                // Lấy tên đơn vị đã báo cáo từ groupedFeedbacks (đã có sẵn)
                // Dùng getReportedFacilityName giống như phần hiển thị, đảm bảo nhất quán
                const reportedNames = new Set(
                    group.items.map(item =>
                        getReportedFacilityName(item, facilities).trim().toLowerCase()
                    )
                );
                console.log(reportedNames);
                // Đơn vị chưa báo cáo = expected - reported (so sánh bằng tên hiển thị)
                const nonReported = expected.filter((exp: any) =>
                    !reportedNames.has(String(exp.name).trim().toLowerCase())
                );

                return { title: group.title, units: nonReported };
            });
            // Giao điểm đồng bộ logic với ReportTabContent
            const app2Groups = sortedEntries.map(([formId, group]) => {
                const template = formTemplates?.[formId];
                if (!template) return { title: group.title, units: [] };

                const lateUnitsList: any[] = [];
                const seenLateNames = new Set();
                
                group.items.filter(item => {
                    // Logic tìm activeSurvey y hệt ReportTabContent
                    let activeSurvey = selectedSurveyKey ? surveys?.find((s: any) => String(s.key || s.id) === String(selectedSurveyKey)) : null;

                    if (!activeSurvey && surveys && surveys.length > 0) {
                        const fbSurveyId = item.survey_id || item.surveyId || item.info?.survey_id;
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
                    } else if (template && (template.startDate || template.endDate)) {
                        startLimit = template.startDate ? new Date(template.startDate) : null;
                        endLimit = template.endDate ? new Date(template.endDate) : null;
                    }

                    if (startLimit) startLimit.setHours(0, 0, 0, 0);
                    if (endLimit) endLimit.setHours(23, 59, 59, 999);

                    const submissionDate = new Date(item.createdAt || item.created_at || item.date || Date.now());
                    const isAfterStart = !startLimit || submissionDate >= startLimit;
                    const isBeforeEnd = !endLimit || submissionDate <= endLimit;

                    return !(isAfterStart && isBeforeEnd);
                }).forEach(item => {
                    const name = getReportedFacilityName(item, facilities);
                    if (!seenLateNames.has(name)) {
                        seenLateNames.add(name);
                        lateUnitsList.push({ id: item.id, name });
                    }
                });

                return { title: group.title, units: lateUnitsList };
            });

            return {
                app1Title: "PHỤ LỤC 1",
                app1Sub: "Danh mục các đơn vị CHƯA thực hiện báo cáo trong kỳ",
                app1Items: app1Groups,
                app2Title: "PHỤ LỤC 2",
                app2Sub: "Danh mục các đơn vị thực hiện báo cáo KHÔNG đúng hạn",
                app2Items: app2Groups
            };
        }
    };

    const getReportedFacilityName = (item: FeedbackItem, facilities: any[]) => {
        if (!item) return "Đơn vị (?)";

        if (item.info) {
            const fbInfo = item.info as any;
            const facilityTypeSet = new Set((facilities || []).map(f => f.type?.toLowerCase()).filter(Boolean));
            
            // Lần quét 1: Ưu tiên trường khớp với facility type từ API
            for (const key in fbInfo) {
                const field = fbInfo[key];
                if (field?.value?.key && field?.value?.value) {
                    const fbKey = String(field.value.key).toLowerCase();
                    const prefix = fbKey.split('-')[0];
                    if (facilityTypeSet.has(prefix)) {
                        return field.value.value;
                    }
                }
            }
            
            // Lần quét 2: Nếu không thấy khớp prefix, lấy trường multiselect/select đầu tiên có key/value
            for (const key in fbInfo) {
                const field = fbInfo[key];
                if (field?.value?.key && field?.value?.value) {
                    return field.value.value;
                }
            }
        }

        const id = getReportedFacilityId(item, facilities);
        const facility = (facilities || []).find(f => String(f.id) === String(id));
        if (facility) return facility.name;

        return item.fullName || item.name || `Đơn vị (${id || '?'})`;
    };

    const { app1Title, app1Sub, app1Items, app2Title, app2Sub, app2Items } = getAppendixData();
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

    return (
        <div className="space-y-10 mt-10">
            {/* Appendix 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{app1Title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5 italic">{app1Sub}</p>
                    </div>
                </div>

                <div className="p-6 md:p-8 overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 bg-white shadow-sm">
                        <thead className="bg-primary-900 text-white">
                            <tr>
                                <th className="border border-slate-600 p-3 text-center font-semibold w-20">STT</th>
                                <th className="border border-slate-600 p-3 text-left font-semibold">Tên đơn vị</th>
                            </tr>
                        </thead>
                        <tbody>
                            {app1Items.map((group, gi) => (
                                <React.Fragment key={`app1-${gi}`}>
                                    <tr className="bg-slate-100 border-b border-slate-300">
                                        <td className="border border-slate-300 p-3 text-center font-bold text-primary-900 bg-slate-100">
                                            {roman[gi] || gi + 1}
                                        </td>
                                        <td className="border border-slate-300 p-3 text-left font-bold text-primary-900 italic text-sm">
                                            {group.title}
                                        </td>
                                    </tr>
                                    {group.units.length > 0 ? (
                                        group.units.map((unit: any, ii: number) => (
                                            <tr key={`app1-${gi}-${ii}`} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                                <td className="border border-slate-300 p-3 text-center text-slate-700 font-medium">
                                                    {ii + 1}
                                                </td>
                                                <td className="border border-slate-300 p-3 text-left text-slate-800 font-semibold">
                                                    {unit.name}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className="border-b border-slate-200 italic text-slate-400">
                                            <td className="border border-slate-300 p-3 text-center">-</td>
                                            <td className="border border-slate-300 p-3 text-left">
                                                Tất cả đơn vị đã hoàn thành báo cáo
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Appendix 2 */}
            {app2Title && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{app2Title}</h3>
                            <p className="text-sm text-slate-500 mt-0.5 italic">{app2Sub}</p>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-300 bg-white shadow-sm">
                            <thead className="bg-primary-900 text-white">
                                <tr>
                                    <th className="border border-slate-600 p-3 text-center font-semibold w-20">STT</th>
                                    <th className="border border-slate-600 p-3 text-left font-semibold">Tên đơn vị</th>
                                </tr>
                            </thead>
                            <tbody>
                                {app2Items.map((group, gi) => (
                                    <React.Fragment key={`app2-${gi}`}>
                                        <tr className="bg-slate-100 border-b border-slate-300">
                                            <td className="border border-slate-300 p-3 text-center font-bold text-primary-900 bg-slate-100">
                                                {roman[gi] || gi + 1}
                                            </td>
                                            <td className="border border-slate-300 p-3 text-left font-bold text-primary-900 italic text-sm">
                                                {group.title}
                                            </td>
                                        </tr>
                                        {group.units.length > 0 ? (
                                            group.units.map((unit: any, ii: number) => (
                                                <tr key={`app2-${gi}-${ii}`} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                                    <td className="border border-slate-300 p-3 text-center text-slate-700 font-medium">
                                                        {ii + 1}
                                                    </td>
                                                    <td className="border border-slate-300 p-3 text-left text-slate-800 font-semibold">
                                                        {unit.name}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr className="border-b border-slate-200 italic text-slate-400">
                                                <td className="border border-slate-300 p-3 text-center">-</td>
                                                <td className="border border-slate-300 p-3 text-left">Không có đơn vị thực hiện báo cáo muộn</td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
