import { useState, useEffect, useMemo } from 'react'
import { feedBacksSevice } from '@/services/feedBacksSevice'
import { formService } from '@/services/formService'
import { useFacilities } from '@/hooks/useFacilities';

export interface DateFilter {
    startDate: string;
    endDate: string;
}

export function useKSHLData(dateFilter: DateFilter, surveyKey?: string, unit?: string, unitType?: string, isFilterLoading?: boolean) {
    const [rawFeedbacks, setRawFeedbacks] = useState<any[]>([]);
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { facilities, loading: facilitiesLoading } = useFacilities();
    
    const allUnits = useMemo(() => {
        if (!facilities.length || isFilterLoading) return [];
        
        let filtered = [...facilities];
        
        // Lọc theo loại hình nếu có
        if (unitType) {
            filtered = filtered.filter(f => (f.type || "").toString().toUpperCase().trim() === String(unitType).toUpperCase().trim());
        }
        
        // Lọc theo danh sách đơn vị cụ thể nếu có
        if (unit && unit !== 'none') {
            const unitIds = unit.split(',').map(id => id.trim());
            filtered = filtered.filter(f => unitIds.includes(String(f.id)));
        }
        
        return filtered;
    }, [facilities, unit, unitType, isFilterLoading]);

    useEffect(() => {
        const fetchData = async () => {
            if (isFilterLoading) return;
            setLoading(true);
            setError(null);
            try {
                const [fbRes, formRes] = await Promise.all([
                    feedBacksSevice.fetchFeedBacksByType('evaluate', dateFilter.startDate, dateFilter.endDate, surveyKey, unit, unitType),
                    formService.fetchForms(1, 1000, 'evaluate')
                ]);

                const fbRaw = fbRes.items || fbRes.data?.items || fbRes.data || fbRes;
                setRawFeedbacks(Array.isArray(fbRaw) ? fbRaw : []);

                const formRaw = formRes.items || formRes.data?.items || formRes.data || formRes;
                setForms(Array.isArray(formRaw) ? formRaw : []);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu báo cáo:", err);
                setError('Không thể tải dữ liệu báo cáo');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dateFilter, surveyKey, unit, unitType, isFilterLoading]);

    const processedData = useMemo(() => {
        if (!rawFeedbacks.length) {
            return {
                dataNgoaiTru: [], dataNoiTru: [], dataTiemChung: [],
                dataPhuLuc1: [], dataPhuLuc2: [], dataPhuLuc3: []
            };
        }

        // Map form_id -> loại khảo sát (19: Nội trú, 20: Ngoại trú, 21: Tiêm chủng)
        const formTypeMap: Record<string, string> = {};
        forms.forEach(f => {
            const id = f._id || f.id;
            if (!id) return;
            const sId = String(id);
            if (sId === "19") formTypeMap[id] = "noi_tru";
            else if (sId === "20") formTypeMap[id] = "ngoai_tru";
            else if (sId === "21") formTypeMap[id] = "tiem_chung";
            else {
                const name = (f.name || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").trim();
                if (name.includes("noitru") || name.includes("noi")) formTypeMap[id] = "noi_tru";
                else if (name.includes("tiem") || name.includes("vaccine")) formTypeMap[id] = "tiem_chung";
                else if (name.includes("ngoaitru") || name.includes("ngoai")) formTypeMap[id] = "ngoai_tru";
            }
        });

        // unitId -> surveyType -> { self: [], qr: [] }
        const unitGroups: Record<string, Record<string, { self: any[], qr: any[] }>> = {};
        const unmappedFeedbacks: Record<string, { self: any[], qr: any[] }> = {
            'noi_tru': { self: [], qr: [] },
            'ngoai_tru': { self: [], qr: [] },
            'tiem_chung': { self: [], qr: [] },
            'unknown': { self: [], qr: [] }
        };

        rawFeedbacks.forEach(fb => {
            // Giải nén ID đơn vị từ info object (ví dụ info["1"].value.key)
            let parsedFacilityId = null;
            if (fb.info && typeof fb.info === 'object') {
                if (fb.info["1"]?.value?.key) {
                    parsedFacilityId = fb.info["1"].value.key;
                } else {
                    const keys = Object.keys(fb.info);
                    for (const k of keys) {
                        const item = fb.info[k];
                        if (item && item.value && typeof item.value === 'object' && item.value.key && !isNaN(Number(k))) {
                            const possibleId = item.value.key;
                            if (typeof possibleId === 'string' && possibleId.length > 2) {
                                parsedFacilityId = possibleId;
                                break;
                            }
                        }
                    }
                }
            }

            const unitIdRaw = fb.facility_id || fb.unitId || fb.unit_id || fb.branch_id ||
                fb.unit?.id || fb.unit?._id || fb.facility?.id ||
                fb.info?.facility_id || fb.data?.facility_id || parsedFacilityId;
            const unitId = unitIdRaw ? String(unitIdRaw).trim() : null;

            const formIdRaw = fb.form_id || fb.formId || fb.template_id || fb.templateId ||
                (typeof fb.form === 'object' ? (fb.form?._id || fb.form?.id) : fb.form) ||
                fb.info?.form_id || fb.data?.form_id;
            const formId = formIdRaw ? String(formIdRaw).trim() : null;

            let stype = 'unknown';
            if (formId === "19") stype = "noi_tru";
            else if (formId === "20") stype = "ngoai_tru";
            else if (formId === "21") stype = "tiem_chung";
            else if (formId && formTypeMap[formId]) stype = formTypeMap[formId];

            const finalSType = stype || 'unknown';
            const isSelf = !!(fb.user_id || fb.userId || fb.creator_id || fb.creatorId || fb.created_by);
            const target = isSelf ? 'self' : 'qr';

            let matchedUnit = null;
            if (unitId) {
                matchedUnit = allUnits.find(u => String(u.id).trim() === unitId);
            }

            if (matchedUnit) {
                if (!unitGroups[matchedUnit.id]) unitGroups[matchedUnit.id] = {};
                if (!unitGroups[matchedUnit.id][finalSType]) unitGroups[matchedUnit.id][finalSType] = { self: [], qr: [] };
                unitGroups[matchedUnit.id][finalSType][target].push(fb);
            } else {
                if (!unmappedFeedbacks[finalSType]) unmappedFeedbacks[finalSType] = { self: [], qr: [] };
                unmappedFeedbacks[finalSType][target].push(fb);
            }
        });

        // Tính tỷ lệ hài lòng từ sections -> option -> ratingVote.value (0=không đánh giá, bỏ qua)
        const calcRate = (arr: any[]) => {
            if (!arr || !arr.length) return 0;
            let totalWeightedScore = 0;
            let count = 0;

            arr.forEach(fb => {
                let fbScore = 0;
                let fbMax = 0;

                const sections = fb.sections || fb.info?.sections || fb.data?.sections;
                if (sections && Array.isArray(sections)) {
                    sections.forEach((sec: any) => {
                        const options = sec.option || sec.options || sec.questions;
                        if (options && Array.isArray(options)) {
                            options.forEach((opt: any) => {
                                const val = opt.ratingVote?.value ?? opt.rating?.value ?? opt.score ?? opt.answerValue;
                                // Điểm từ 1-5 hợp lệ; 0 = không đánh giá, bỏ qua
                                if (val !== undefined && val !== null && !isNaN(Number(val)) && Number(val) > 0) {
                                    fbScore += Number(val);
                                    fbMax += 5;
                                }
                            });
                        }
                    });
                }

                if (fbMax === 0) {
                    const r = fb.rating ?? fb.averageRating ?? fb.avgRating ?? fb.score ??
                        fb.info?.rating ?? fb.info?.averageRating ?? 0;
                    if (r > 0) { fbScore = Number(r); fbMax = 5; }
                }

                if (fbMax > 0) {
                    totalWeightedScore += (fbScore / fbMax);
                    count++;
                }
            });

            if (count === 0) return 0;
            return (totalWeightedScore / count) * 100;
        };

        const displayRate = (val: number) => val > 0 ? val.toFixed(2) : "0";
        const formatNumber = (n: number) => n.toLocaleString('vi-VN');

        const publicHospitals = allUnits.filter(u => u.type === 'BV' && u.category !== "Cơ sở y tế tư nhân");
        const privateHospitals = allUnits.filter(u => u.type === 'BV' && u.category === "Cơ sở y tế tư nhân");
        const tytUnits = allUnits.filter(u => u.type === 'TYT');

        // Tạo dữ liệu bảng tổng hợp (8 cột)
        const createSummaryData = (units: any[], surveyType: string, label: string) => {
            let selfUnitsReported = 0, selfTotalPhieu = 0, selfTotalRate = 0;
            let qrUnitsReported = 0, qrTotalPhieu = 0, qrTotalRate = 0;

            units.forEach(u => {
                const g = unitGroups[u.id];
                const s = g ? g[surveyType] : null;
                if (s && s.self.length > 0) { selfUnitsReported++; selfTotalPhieu += s.self.length; selfTotalRate += calcRate(s.self); }
                if (s && s.qr.length > 0) { qrUnitsReported++; qrTotalPhieu += s.qr.length; qrTotalRate += calcRate(s.qr); }
            });

            const selfRate = selfUnitsReported > 0 ? (selfTotalRate / selfUnitsReported).toFixed(2) : "0";
            const qrRate = qrUnitsReported > 0 ? (qrTotalRate / qrUnitsReported).toFixed(2) : "0";

            return {
                type: label,
                col1: units.length > 0 ? `${selfUnitsReported}/${units.length}` : "",
                col2: formatNumber(selfTotalPhieu),
                col3: selfRate,
                col4: units.length > 0 ? `${qrUnitsReported}/${units.length}` : "",
                col5: formatNumber(qrTotalPhieu),
                col6: qrRate
            };
        };

        const summaryNgoaiTru = [
            { id: '1', ...createSummaryData(publicHospitals, 'ngoai_tru', 'BV công lập') },
            { id: '2', ...createSummaryData(privateHospitals, 'ngoai_tru', 'BV ngoài công lập') },
            { id: '3', ...createSummaryData(tytUnits, 'ngoai_tru', 'Trạm Y tế') },
            {
                id: '4', type: 'Không ghi địa chỉ', col1: '',
                col2: formatNumber(unmappedFeedbacks.ngoai_tru.self.length + unmappedFeedbacks.unknown.self.length),
                col3: displayRate(calcRate([...unmappedFeedbacks.ngoai_tru.self, ...unmappedFeedbacks.unknown.self])),
                col4: '',
                col5: formatNumber(unmappedFeedbacks.ngoai_tru.qr.length + unmappedFeedbacks.unknown.qr.length),
                col6: displayRate(calcRate([...unmappedFeedbacks.ngoai_tru.qr, ...unmappedFeedbacks.unknown.qr]))
            },
            { id: '', type: 'Tổng', isTotal: true, ...createSummaryData([...publicHospitals, ...privateHospitals, ...tytUnits], 'ngoai_tru', 'Tổng') }
        ];
        const lastRow = summaryNgoaiTru[summaryNgoaiTru.length - 1];
        lastRow.col2 = formatNumber(parseInt(lastRow.col2.replace(/\./g, '')) + unmappedFeedbacks.ngoai_tru.self.length + unmappedFeedbacks.unknown.self.length);
        lastRow.col5 = formatNumber(parseInt(lastRow.col5.replace(/\./g, '')) + unmappedFeedbacks.ngoai_tru.qr.length + unmappedFeedbacks.unknown.qr.length);

        const summaryNoiTru = [
            { id: '1', ...createSummaryData(publicHospitals, 'noi_tru', 'BV công lập') },
            { id: '2', ...createSummaryData(privateHospitals, 'noi_tru', 'BV ngoài công lập') },
            {
                id: '3', type: 'Không ghi địa chỉ', col1: '',
                col2: formatNumber(unmappedFeedbacks.noi_tru.self.length + unmappedFeedbacks.unknown.self.length),
                col3: displayRate(calcRate([...unmappedFeedbacks.noi_tru.self, ...unmappedFeedbacks.unknown.self])),
                col4: '',
                col5: formatNumber(unmappedFeedbacks.noi_tru.qr.length + unmappedFeedbacks.unknown.qr.length),
                col6: displayRate(calcRate([...unmappedFeedbacks.noi_tru.qr, ...unmappedFeedbacks.unknown.qr]))
            },
            { id: '', type: 'Tổng', isTotal: true, ...createSummaryData([...publicHospitals, ...privateHospitals], 'noi_tru', 'Tổng') }
        ];
        const lastRowNoiTru = summaryNoiTru[summaryNoiTru.length - 1];
        lastRowNoiTru.col2 = formatNumber(parseInt(lastRowNoiTru.col2.replace(/\./g, '')) + unmappedFeedbacks.noi_tru.self.length + unmappedFeedbacks.unknown.self.length);
        lastRowNoiTru.col5 = formatNumber(parseInt(lastRowNoiTru.col5.replace(/\./g, '')) + unmappedFeedbacks.noi_tru.qr.length + unmappedFeedbacks.unknown.qr.length);

        const summaryTiemChung = [
            { id: '1', ...createSummaryData(facilities.filter(f => f.type === 'BV'), 'tiem_chung', 'Khối Bệnh viện') },
            { id: '2', ...createSummaryData(tytUnits, 'tiem_chung', 'Khối TYT') },
            {
                id: '3', type: 'Không ghi địa chỉ', col1: '',
                col2: formatNumber(unmappedFeedbacks.tiem_chung.self.length + unmappedFeedbacks.unknown.self.length),
                col3: displayRate(calcRate([...unmappedFeedbacks.tiem_chung.self, ...unmappedFeedbacks.unknown.self])),
                col4: '',
                col5: formatNumber(unmappedFeedbacks.tiem_chung.qr.length + unmappedFeedbacks.unknown.qr.length),
                col6: displayRate(calcRate([...unmappedFeedbacks.tiem_chung.qr, ...unmappedFeedbacks.unknown.qr]))
            },
            { id: '', type: 'Tổng', isTotal: true, ...createSummaryData([...facilities.filter(f => f.type === 'BV'), ...tytUnits], 'tiem_chung', 'Tổng') }
        ];
        const lastRowTiemChung = summaryTiemChung[summaryTiemChung.length - 1];
        lastRowTiemChung.col2 = formatNumber(parseInt(lastRowTiemChung.col2.replace(/\./g, '')) + unmappedFeedbacks.tiem_chung.self.length + unmappedFeedbacks.unknown.self.length);
        lastRowTiemChung.col5 = formatNumber(parseInt(lastRowTiemChung.col5.replace(/\./g, '')) + unmappedFeedbacks.tiem_chung.qr.length + unmappedFeedbacks.unknown.qr.length);

        // Tạo dữ liệu bảng phụ lục (10 cột)
        const createAppendixData = (units: any[], type1: string, type2: string, groupCommune = false) => {
            const rawRows = units.map((u) => {
                const g = unitGroups[u.id];
                const s1 = g ? g[type1] : null;
                const s2 = g ? g[type2] : null;

                let typeName = u.name;
                if (groupCommune) {
                    const addressMatch = u.address?.match(/(?:xã|phường|thị trấn|x\.|p\.)\s*([^-,.]+)/i);
                    const nameMatch = u.name.match(/(?:xã|phường|thị trấn|x\.|p\.)\s*([^-,.]+)/i);
                    if (addressMatch && addressMatch[1]) typeName = addressMatch[1].trim();
                    else if (nameMatch && nameMatch[1]) typeName = nameMatch[1].trim();
                    else typeName = u.name.replace(/Trạm y tế /i, '').trim();
                    typeName = typeName.normalize('NFC');
                }

                return {
                    typeName,
                    col1: s1 ? calcRate(s1.self) : 0,
                    col2: s2 ? calcRate(s2.self) : 0,
                    col3: s1?.self.length || 0,
                    col4: s2?.self.length || 0,
                    col5: s1 ? calcRate(s1.qr) : 0,
                    col6: s2 ? calcRate(s2.qr) : 0,
                    col7: s1?.qr.length || 0,
                    col8: s2?.qr.length || 0,
                };
            });

            if (groupCommune) {
                const grouped: Record<string, any> = {};
                rawRows.forEach(row => {
                    if (!grouped[row.typeName]) {
                        grouped[row.typeName] = { ...row, sumRate1: 0, sumRate2: 0, sumRate5: 0, sumRate6: 0, active1: 0, active2: 0, active5: 0, active6: 0 };
                    }
                    const g = grouped[row.typeName];
                    g.col3 += row.col3; g.col4 += row.col4; g.col7 += row.col7; g.col8 += row.col8;
                    if (row.col1 > 0) { g.sumRate1 += row.col1; g.active1++; }
                    if (row.col2 > 0) { g.sumRate2 += row.col2; g.active2++; }
                    if (row.col5 > 0) { g.sumRate5 += row.col5; g.active5++; }
                    if (row.col6 > 0) { g.sumRate6 += row.col6; g.active6++; }
                });

                return Object.keys(grouped).sort().map((name, idx) => {
                    const g = grouped[name];
                    return {
                        id: (idx + 1).toString(), type: name,
                        col1: g.active1 > 0 ? (g.sumRate1 / g.active1).toFixed(2) + "%" : "",
                        col2: g.active2 > 0 ? (g.sumRate2 / g.active2).toFixed(2) + "%" : "",
                        col3: g.col3 > 0 ? formatNumber(g.col3) : "",
                        col4: g.col4 > 0 ? formatNumber(g.col4) : "",
                        col5: g.active5 > 0 ? (g.sumRate5 / g.active5).toFixed(2) + "%" : "",
                        col6: g.active6 > 0 ? (g.sumRate6 / g.active6).toFixed(2) + "%" : "",
                        col7: g.col7 > 0 ? formatNumber(g.col7) : "",
                        col8: g.col8 > 0 ? formatNumber(g.col8) : ""
                    };
                });
            }

            return rawRows.map((r, idx) => ({
                id: (idx + 1).toString(), type: r.typeName,
                col1: r.col1 > 0 ? r.col1.toFixed(2) + "%" : "",
                col2: r.col2 > 0 ? r.col2.toFixed(2) + "%" : "",
                col3: r.col3 > 0 ? formatNumber(r.col3) : "",
                col4: r.col4 > 0 ? formatNumber(r.col4) : "",
                col5: r.col5 > 0 ? r.col5.toFixed(2) + "%" : "",
                col6: r.col6 > 0 ? r.col6.toFixed(2) + "%" : "",
                col7: r.col7 > 0 ? formatNumber(r.col7) : "",
                col8: r.col8 > 0 ? formatNumber(r.col8) : ""
            }));
        };

        return {
            dataNgoaiTru: summaryNgoaiTru,
            dataNoiTru: summaryNoiTru,
            dataTiemChung: summaryTiemChung,
            dataPhuLuc1: createAppendixData(publicHospitals, 'noi_tru', 'ngoai_tru'),
            dataPhuLuc2: createAppendixData(privateHospitals, 'noi_tru', 'ngoai_tru'),
            dataPhuLuc3: createAppendixData(tytUnits, 'tiem_chung', 'ngoai_tru', true)
        };
    }, [rawFeedbacks, forms, allUnits]);

    return { processedData, loading, error, setLoading };
}
