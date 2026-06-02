import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'
import { TIMES_REGULAR_BASE64, TIMES_BOLD_BASE64 } from '@/utils/pdfFonts'
import { formatDateVN } from '@/utils/dateUtils'
import { FeedbackItem } from '@/types/feedbacks'
import { calculateTotalUnits, calculateOnTimeStats, getReportedFacilityId, getExpectedFacilities } from '@/utils/reportDataUtils'

export const exportReportToPDF = async (
    groupedFeedbacks: Record<string, { title: string, items: FeedbackItem[] }>,
    formTemplates: Record<string, any>,
    facilities: any[],
    dateFilter: { startDate: string, endDate: string },
    setLoading: (val: boolean) => void,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void
) => {
    setLoading(true);
    try {
        const doc = new jsPDF();

        // Font setup
        doc.addFileToVFS('times.ttf', TIMES_REGULAR_BASE64);
        doc.addFont('times.ttf', 'TimesNewRoman', 'normal', 'Identity-H');
        doc.addFileToVFS('timesbd.ttf', TIMES_BOLD_BASE64);
        doc.addFont('timesbd.ttf', 'TimesNewRoman', 'bold', 'Identity-H');

        const FONT = 'TimesNewRoman';

        const drawHeader = (pageDoc: jsPDF) => {
            pageDoc.setFontSize(11);
            pageDoc.setFont(FONT, 'normal');
            pageDoc.text('SỞ Y TẾ HÀ NỘI', 50, 15, { align: 'center' });
            pageDoc.setFont(FONT, 'bold');
            pageDoc.text('PHÒNG KIỂM TRA LĨNH VỰC Y TẾ', 50, 20, { align: 'center' });

            pageDoc.setFont(FONT, 'bold');
            pageDoc.text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', 150, 15, { align: 'center' });
            pageDoc.setFont(FONT, 'normal');
            pageDoc.text('Độc lập - Tự do - Hạnh phúc', 150, 20, { align: 'center' });
            pageDoc.line(125, 21, 175, 21);

            const now = new Date();
            pageDoc.text(`Hà Nội, ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(now.getMonth() + 1).padStart(2, '0')} năm ${now.getFullYear()}`, 150, 28, { align: 'center' });
        };

        const getUnitNameLocal = (item: FeedbackItem) => {
            const id = getReportedFacilityId(item, facilities);
            const facility = (facilities || []).find(f => String(f.id) === String(id));
            if (facility) return facility.name;
            if (item.info) {
                const firstMatchedField = Object.entries(item.info)
                    .filter(([k]) => !isNaN(Number(k)))
                    .find(([_, v]: [string, any]) => v?.value?.key && v?.value?.value);
                if (firstMatchedField) return String((firstMatchedField[1] as any).value.value);
            }
            return item.fullName || item.name || 'Chưa xác định';
        };

        drawHeader(doc);

        doc.setFontSize(14);
        doc.setFont(FONT, 'bold');
        doc.text('ĐỀ CƯƠNG BÁO CÁO', 105, 45, { align: 'center' });

        let currentY = 55;
        const mainRomanNumerals = ["I", "II", "III", "IV", "V"];
        const formEntries = (Object.entries(groupedFeedbacks) as [string, { title: string, items: FeedbackItem[] }][]).sort((a, b) => {
            const order: Record<string, number> = { "3": 1, "17": 2, "18": 3 };
            return (order[a[0]] || 99) - (order[b[0]] || 99);
        });

        for (let i = 0; i < formEntries.length; i++) {
            const [formId, group] = formEntries[i];
            const formTemplate = formTemplates[formId];
            if (!formTemplate) continue;

            const totalUnits = calculateTotalUnits(formTemplate, facilities);
            const reportedIds = new Set(group.items.map((fb: any) => getReportedFacilityId(fb, facilities)));
            const reportedCount = reportedIds.size;
            const unReportingCount = Math.max(0, totalUnits - reportedCount);
            const { onTimeCount, lateCount } = calculateOnTimeStats(group.items, formTemplate);

            if (currentY > 240) { doc.addPage(); currentY = 20; }

            doc.setFont(FONT, 'bold');
            doc.setFontSize(12);
            doc.text(`${mainRomanNumerals[i] || i + 1}. Kết quả triển khai thực hiện báo cáo của ${group.title.toLowerCase()}`, 20, currentY);
            currentY += 7;

            doc.setFont(FONT, 'normal');
            doc.text(`Kết quả tiếp nhận báo cáo (từ ngày ${formatDateVN(dateFilter.startDate)} đến ngày ${formatDateVN(dateFilter.endDate)}).`, 20, currentY);
            currentY += 7;
            doc.text(`Tổng số: ${totalUnits} đơn vị.`, 20, currentY);
            currentY += 5;

            autoTable(doc, {
                startY: currentY,
                head: [['STT', 'Nội dung', 'Số lượng', 'Tỷ lệ']],
                body: [
                    ['1', 'Đơn vị báo cáo', reportedCount, totalUnits > 0 ? `${((reportedCount / totalUnits) * 100).toFixed(1)}%` : '0%'],
                    ['2', 'Đơn vị không báo cáo', unReportingCount, totalUnits > 0 ? `${(unReportingCount / totalUnits * 100).toFixed(1)}%` : '0%'],
                    ['3', 'Đơn vị báo cáo đúng hạn', onTimeCount, totalUnits > 0 ? `${((onTimeCount / totalUnits) * 100).toFixed(1)}%` : '0%'],
                    ['4', 'Đơn vị báo cáo không đúng hạn', lateCount, totalUnits > 0 ? `${((lateCount / totalUnits) * 100).toFixed(1)}%` : '0%'],
                ],
                styles: { font: FONT, fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
                headStyles: { font: FONT, fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center' },
                columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center', cellWidth: 30 } },
                theme: 'grid'
            });

            currentY = (doc as any).lastAutoTable.finalY + 8;

            doc.setFont(FONT, 'normal');
            doc.text('Nhận xét về tỷ lệ đơn vị gửi báo cáo:', 20, currentY);
            currentY += 6;
            doc.text('....................................................................................................................................................', 20, currentY);
            currentY += 8;

            doc.setFont(FONT, 'bold');
            doc.text(`Kết quả tổng hợp biểu mẫu đánh giá (theo Phụ lục ${i + 1})`, 20, currentY);
            currentY += 6;
            doc.setFont(FONT, 'normal');
            doc.text(`(Chỉ phân tích trên ${reportedCount} đơn vị gửi báo cáo).`, 20, currentY);
            currentY += 5;

            if (reportedCount > 0 && group.items[0]?.sections) {
                const templateSections = group.items[0].sections;
                const table2Body: any[] = [];
                const sectionRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                let sttCounter = 1;

                templateSections.forEach((sec: any, si: number) => {
                    const optionRows: any[] = [];
                    sec.option.forEach((opt: any) => {
                        let daLam = 0, dangLam = 0, chuaLam = 0;
                        group.items.forEach(dfb => {
                            const dfbSec = dfb.sections?.find((s: any) => s.name === sec.name);
                            const dfbOpt = dfbSec?.option?.find((o: any) => o.content === opt.content);
                            if (dfbOpt) {
                                const tiendo = Number(dfbOpt.tiendo);
                                if (tiendo === 1) daLam++;
                                else if (tiendo === 2) dangLam++;
                                else if (tiendo === 3) chuaLam++;
                            }
                        });

                        optionRows.push([
                            sttCounter++,
                            opt.content,
                            opt.method || '',
                            opt.productOut || '',
                            daLam || '0',
                            dangLam || '0',
                            chuaLam || '0'
                        ]);
                    });

                    table2Body.push([
                        { content: sectionRoman[si] || si + 1, styles: { halign: 'center', fontStyle: 'bold' } },
                        { content: sec.name, colSpan: 3, styles: { fontStyle: 'bold' } },
                        { content: '', styles: { halign: 'center', fontStyle: 'bold' } },
                        { content: '', styles: { halign: 'center', fontStyle: 'bold' } },
                        { content: '', styles: { halign: 'center', fontStyle: 'bold' } }
                    ]);
                    table2Body.push(...optionRows);
                });

                if (currentY > 230) { doc.addPage(); currentY = 20; }

                autoTable(doc, {
                    startY: currentY,
                    head: [
                        [
                            { content: 'STT', rowSpan: 2 },
                            { content: 'Nội dung kiểm tra', rowSpan: 2 },
                            { content: 'Phương thức\nthực hiện', rowSpan: 2 },
                            { content: 'Bằng chứng,\nkết quả', rowSpan: 2 },
                            { content: 'Tình trạng thực hiện', colSpan: 3 }
                        ],
                        ['Đã thực hiện\n(số đơn vị)', 'Đang thực hiện\n(số đơn vị)', 'Chưa thực hiện\n(số đơn vị)']
                    ],
                    body: table2Body,
                    styles: { font: FONT, fontSize: 10, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
                    headStyles: { font: FONT, fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center', valign: 'middle' },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 10 },
                        4: { halign: 'center', cellWidth: 20 },
                        5: { halign: 'center', cellWidth: 20 },
                        6: { halign: 'center', cellWidth: 20 }
                    },
                    theme: 'grid'
                });
                currentY = (doc as any).lastAutoTable.finalY + 8;

                doc.setFont(FONT, 'normal');
                doc.text('Nhận xét về tỷ lệ đơn vị đã thực hiện, đang thực hiện và chưa thực hiện:', 20, currentY);
                currentY += 6;
                doc.text('....................................................................................................................................................', 20, currentY);
                currentY += 15;
            }
        }

        const appendixRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

        // --- PHỤ LỤC 1: Đơn vị CHƯA gửi báo cáo ---
        doc.addPage();
        currentY = 20;
        doc.setFontSize(14);
        doc.setFont(FONT, 'bold');
        doc.text('PHỤ LỤC 1', 105, currentY, { align: 'center' });
        currentY += 7;
        doc.setFontSize(11);
        doc.setFont(FONT, 'normal');
        doc.text('Danh sách các đơn vị chưa gửi báo cáo', 105, currentY, { align: 'center' });
        currentY += 10;

        const appendixIBody: any[] = [];
        formEntries.forEach(([formId, group], gi) => {
            const template = formTemplates[formId];
            if (!template) return;
            const expected = getExpectedFacilities(template, facilities);
            const reportedIds = new Set(group.items.map((fb: any) => getReportedFacilityId(fb, facilities)));
            const nonReported = expected.filter(exp => !reportedIds.has(exp.id));

            appendixIBody.push([
                { content: appendixRoman[gi] || gi + 1, styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: group.title, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
            ]);

            if (nonReported.length > 0) {
                nonReported.forEach((unit, ii) => {
                    appendixIBody.push([{ content: ii + 1, styles: { halign: 'center' } }, unit.name]);
                });
            } else {
                appendixIBody.push([{ content: '-', styles: { halign: 'center' } }, '(Không có đơn vị nào chưa báo cáo)']);
            }
        });

        autoTable(doc, {
            startY: currentY,
            head: [['STT', 'Tên đơn vị']],
            body: appendixIBody,
            styles: { font: FONT, fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
            headStyles: { font: FONT, fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center' },
            columnStyles: { 0: { halign: 'center', cellWidth: 20 } },
            theme: 'grid'
        });

        currentY = (doc as any).lastAutoTable?.finalY + 15;

        // --- PHỤ LỤC 2: Đơn vị báo cáo KHÔNG đúng hạn ---
        if (currentY > 220) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(14);
        doc.setFont(FONT, 'bold');
        doc.text('PHỤ LỤC 2', 105, currentY, { align: 'center' });
        currentY += 7;
        doc.setFontSize(11);
        doc.setFont(FONT, 'normal');
        doc.text('Danh sách các đơn vị thực hiện báo cáo không đúng hạn', 105, currentY, { align: 'center' });
        currentY += 10;

        const appendixIIBody: any[] = [];
        formEntries.forEach(([formId, group], gi) => {
            const template = formTemplates[formId];
            if (!template || !template.endDate) return;

            appendixIIBody.push([
                { content: appendixRoman[gi] || gi + 1, styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: group.title, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
            ]);

            const lateReports = group.items.filter((item: any) => new Date(item.createdAt) > new Date(template.endDate));
            if (lateReports.length > 0) {
                const uniqueLateUnits = Array.from(new Set(lateReports.map((fb: any) => getUnitNameLocal(fb))));
                uniqueLateUnits.forEach((name, ii) => {
                    appendixIIBody.push([{ content: ii + 1, styles: { halign: 'center' } }, name]);
                });
            } else {
                appendixIIBody.push([{ content: '-', styles: { halign: 'center' } }, '(Không có đơn vị nào báo cáo trễ hạn)']);
            }
        });

        autoTable(doc, {
            startY: currentY,
            head: [['STT', 'Tên đơn vị']],
            body: appendixIIBody,
            styles: { font: FONT, fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
            headStyles: { font: FONT, fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center' },
            columnStyles: { 0: { halign: 'center', cellWidth: 20 } },
            theme: 'grid'
        });

        currentY = (doc as any).lastAutoTable?.finalY || currentY + 20;

        if (currentY > 230) { doc.addPage(); currentY = 20; }
        const footerY = currentY + 15;
        doc.setFontSize(11);
        doc.setFont(FONT, 'bold');
        doc.text('NGƯỜI LẬP BIỂU', 50, footerY, { align: 'center' });
        doc.text('THỦ TRƯỞNG ĐƠN VỊ', 150, footerY, { align: 'center' });
        doc.setFont(FONT, 'normal');
        doc.text('(Ký, ghi rõ họ tên)', 50, footerY + 5, { align: 'center' });
        doc.text('(Ký tên, đóng dấu)', 150, footerY + 5, { align: 'center' });

        doc.save(`Bao_cao_chi_tiet_${dateFilter.endDate}.pdf`);
        onSuccess('Đã xuất file PDF báo cáo chi tiết chuẩn mẫu');
    } catch (error) {
        console.error("PDF Export Error:", error);
        onError('Quá trình xuất PDF gặp sự cố');
    } finally {
        setLoading(false);
    }
};
