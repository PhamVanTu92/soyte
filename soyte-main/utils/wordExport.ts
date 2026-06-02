import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
    VerticalAlign,
    Header,
    Footer,
    PageNumber,
    NumberFormat,
    SectionType
} from "docx";
import { saveAs } from "file-saver";
import { formatDateVN } from "@/utils/dateUtils";
import { FeedbackItem } from "@/types/feedbacks";
import { calculateTotalUnits, calculateOnTimeStats, getReportedFacilityId, getExpectedFacilities } from "@/utils/reportDataUtils";

export const exportReportToWord = async (
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
        const mkCell = (text: string, bold = false, align: any = AlignmentType.LEFT, colSpan = 1, rowSpan = 1) => {
            return new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text, font: "Times New Roman", size: 22, bold })],
                    alignment: align
                })],
                verticalAlign: VerticalAlign.CENTER,
                columnSpan: colSpan,
                rowSpan: rowSpan,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
            });
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

        const children: any[] = [];

        // Header Section
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SỞ Y TẾ HÀ NỘI", font: "Times New Roman", size: 22 })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PHÒNG KIỂM TRA LĨNH VỰC Y TẾ", font: "Times New Roman", size: 22, bold: true })] }),
                            ]
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", font: "Times New Roman", size: 22, bold: true })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", font: "Times New Roman", size: 22, bold: true })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "-----------------------", font: "Times New Roman", size: 22 })] }),
                            ]
                        })
                    ]
                })
            ]
        }));

        children.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, font: "Times New Roman", size: 22, italics: true })] }));
        children.push(new Paragraph({ spacing: { before: 400, after: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ĐỀ CƯƠNG BÁO CÁO", font: "Times New Roman", size: 28, bold: true })] }));

        const mainRoman = ["I", "II", "III", "IV", "V"];
        const formEntries = (Object.entries(groupedFeedbacks) as [string, { title: string, items: FeedbackItem[] }][]).sort((a, b) => {
            const order: Record<string, number> = { "3": 1, "17": 2, "18": 3 };
            return (order[a[0]] || 99) - (order[b[0]] || 99);
        });

        for (let i = 0; i < formEntries.length; i++) {
            const [formId, group] = formEntries[i];
            const template = formTemplates[formId];
            if (!template) continue;

            const totalUnits = calculateTotalUnits(template, facilities);
            const reportedIds = new Set(group.items.map((fb: any) => getReportedFacilityId(fb, facilities)));
            const reportedCount = reportedIds.size;
            const unReportingCount = Math.max(0, totalUnits - reportedCount);
            const { onTimeCount, lateCount } = calculateOnTimeStats(group.items, template);

            children.push(new Paragraph({ spacing: { before: 400, after: 200 }, children: [new TextRun({ text: `${mainRoman[i] || i + 1}. Kết quả triển khai thực hiện báo cáo của ${group.title.toLowerCase()}`, font: "Times New Roman", size: 24, bold: true })] }));
            children.push(new Paragraph({ children: [new TextRun({ text: `Kết quả tiếp nhận báo cáo (từ ngày ${formatDateVN(dateFilter.startDate)} đến ngày ${formatDateVN(dateFilter.endDate)}).`, font: "Times New Roman", size: 22 })] }));
            children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `Tổng số: ${totalUnits} đơn vị.`, font: "Times New Roman", size: 22 })] }));

            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            mkCell('STT', true, AlignmentType.CENTER),
                            mkCell('Nội dung', true, AlignmentType.CENTER),
                            mkCell('Số lượng', true, AlignmentType.CENTER),
                            mkCell('Tỷ lệ', true, AlignmentType.CENTER)
                        ]
                    }),
                    new TableRow({ children: [mkCell('1', false, AlignmentType.CENTER), mkCell('Đơn vị báo cáo'), mkCell(reportedCount.toString(), false, AlignmentType.CENTER), mkCell(totalUnits > 0 ? `${(reportedCount / totalUnits * 100).toFixed(1)}%` : '0%', false, AlignmentType.CENTER)] }),
                    new TableRow({ children: [mkCell('2', false, AlignmentType.CENTER), mkCell('Đơn vị không báo cáo'), mkCell(unReportingCount.toString(), false, AlignmentType.CENTER), mkCell(totalUnits > 0 ? `${(unReportingCount / totalUnits * 100).toFixed(1)}%` : '0%', false, AlignmentType.CENTER)] }),
                    new TableRow({ children: [mkCell('3', false, AlignmentType.CENTER), mkCell('Đơn vị báo cáo đúng hạn'), mkCell(onTimeCount.toString(), false, AlignmentType.CENTER), mkCell(totalUnits > 0 ? `${(onTimeCount / totalUnits * 100).toFixed(1)}%` : '0%', false, AlignmentType.CENTER)] }),
                    new TableRow({ children: [mkCell('4', false, AlignmentType.CENTER), mkCell('Đơn vị báo cáo không đúng hạn'), mkCell(lateCount.toString(), false, AlignmentType.CENTER), mkCell(totalUnits > 0 ? `${(lateCount / totalUnits * 100).toFixed(1)}%` : '0%', false, AlignmentType.CENTER)] }),
                ]
            }));

            children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Nhận xét về tỷ lệ đơn vị gửi báo cáo:", font: "Times New Roman", size: 22 })] }));
            children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "....................................................................................................................................................", font: "Times New Roman", size: 22 })] }));

            // --- Kết quả tổng hợp biểu mẫu đánh giá ---
            if (reportedCount > 0 && group.items[0]?.sections) {
                children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: `Kết quả tổng hợp biểu mẫu đánh giá (theo Phụ lục ${i + 1})`, font: "Times New Roman", size: 24, bold: true })] }));
                children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `(Chỉ phân tích trên ${reportedCount} đơn vị gửi báo cáo).`, font: "Times New Roman", size: 20, italics: true })] }));

                const templateSections = group.items[0].sections;
                const criteriaRows: TableRow[] = [
                    new TableRow({
                        children: [
                            mkCell('STT', true, AlignmentType.CENTER, 1, 2),
                            mkCell('Nội dung kiểm tra', true, AlignmentType.CENTER, 1, 2),
                            mkCell('Phương thức\nthực hiện', true, AlignmentType.CENTER, 1, 2),
                            mkCell('Bằng chứng,\nkết quả', true, AlignmentType.CENTER, 1, 2),
                            mkCell('Tình trạng thực hiện', true, AlignmentType.CENTER, 3, 1),
                        ]
                    }),
                    new TableRow({
                        children: [
                            mkCell('Đã thực hiện\n(số đơn vị)', true, AlignmentType.CENTER),
                            mkCell('Đang thực hiện\n(số đơn vị)', true, AlignmentType.CENTER),
                            mkCell('Chưa thực hiện\n(số đơn vị)', true, AlignmentType.CENTER),
                        ]
                    })
                ];

                const sectionRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                let sttCounter = 1;

                templateSections.forEach((sec: any, si: number) => {
                    // Group header row
                    criteriaRows.push(new TableRow({
                        children: [
                            mkCell(sectionRoman[si] || (si + 1).toString(), true, AlignmentType.CENTER),
                            mkCell(sec.name, true, AlignmentType.LEFT, 3),
                            mkCell('', false, AlignmentType.CENTER),
                            mkCell('', false, AlignmentType.CENTER),
                            mkCell('', false, AlignmentType.CENTER),
                        ]
                    }));

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

                        criteriaRows.push(new TableRow({
                            children: [
                                mkCell((sttCounter++).toString(), false, AlignmentType.CENTER),
                                mkCell(opt.content),
                                mkCell(opt.method || ''),
                                mkCell(opt.productOut || ''),
                                mkCell(daLam.toString(), true, AlignmentType.CENTER),
                                mkCell(dangLam.toString(), true, AlignmentType.CENTER),
                                mkCell(chuaLam.toString(), true, AlignmentType.CENTER),
                            ]
                        }));
                    });
                });

                children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: criteriaRows }));

                children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Nhận xét về tỷ lệ đơn vị đã thực hiện, đang thực hiện và chưa thực hiện:", font: "Times New Roman", size: 22 })] }));
                children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "....................................................................................................................................................", font: "Times New Roman", size: 22 })] }));
            }
        }

        // --- PHỤ LỤC 1: ĐƠN VỊ CHƯA GỬI BÁO CÁO ---
        children.push(new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PHỤ LỤC 1", font: "Times New Roman", size: 24, bold: true, break: 1 })] }));
        children.push(new Paragraph({ spacing: { after: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Danh sách đơn vị chưa gửi báo cáo", font: "Times New Roman", size: 22, bold: false })] }));

        const appendixIRows: TableRow[] = [
            new TableRow({
                children: [
                    mkCell('STT', true, AlignmentType.CENTER),
                    mkCell('Tên đơn vị', true, AlignmentType.CENTER)
                ]
            })
        ];

        formEntries.forEach(([formId, group], gi) => {
            const template = formTemplates[formId];
            if (!template) return;
            const expected = getExpectedFacilities(template, facilities);
            const reportedIds = new Set(group.items.map((fb: any) => getReportedFacilityId(fb, facilities)));
            const nonReported = expected.filter(exp => !reportedIds.has(exp.id));

            appendixIRows.push(new TableRow({
                children: [
                    mkCell(mainRoman[gi] || (gi + 1).toString(), true, AlignmentType.CENTER),
                    mkCell(group.title, true)
                ]
            }));

            if (nonReported.length > 0) {
                nonReported.forEach((unit, ii) => {
                    appendixIRows.push(new TableRow({ children: [mkCell((ii + 1).toString(), false, AlignmentType.CENTER), mkCell(unit.name)] }));
                });
            } else {
                appendixIRows.push(new TableRow({ children: [mkCell("-", false, AlignmentType.CENTER), mkCell("(Không có đơn vị nào chưa báo cáo)", false, AlignmentType.LEFT)] }));
            }
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: appendixIRows }));

        // --- PHỤ LỤC 2: ĐƠN VỊ BÁO CÁO KHÔNG ĐÚNG HẠN ---
        children.push(new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PHỤ LỤC 2", font: "Times New Roman", size: 24, bold: true, break: 1 })] }));
        children.push(new Paragraph({ spacing: { after: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Danh sách đơn vị thực hiện báo cáo không đúng hạn", font: "Times New Roman", size: 22, bold: false })] }));

        const appendixIIRows: TableRow[] = [
            new TableRow({
                children: [
                    mkCell('STT', true, AlignmentType.CENTER),
                    mkCell('Tên đơn vị', true, AlignmentType.CENTER)
                ]
            })
        ];

        formEntries.forEach(([formId, group], gi) => {
            const template = formTemplates[formId];
            if (!template || !template.endDate) return;

            appendixIIRows.push(new TableRow({
                children: [
                    mkCell(mainRoman[gi] || (gi + 1).toString(), true, AlignmentType.CENTER),
                    mkCell(group.title, true)
                ]
            }));

            const lateReports = group.items.filter((item: any) => new Date(item.createdAt) > new Date(template.endDate));
            if (lateReports.length > 0) {
                const uniqueLateUnits = Array.from(new Set(lateReports.map((fb: any) => getUnitNameLocal(fb))));
                uniqueLateUnits.forEach((name, ii) => {
                    appendixIIRows.push(new TableRow({ children: [mkCell((ii + 1).toString(), false, AlignmentType.CENTER), mkCell(name)] }));
                });
            } else {
                appendixIIRows.push(new TableRow({ children: [mkCell("-", false, AlignmentType.CENTER), mkCell("(Không có đơn vị nào báo cáo trễ hạn)", false, AlignmentType.LEFT)] }));
            }
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: appendixIIRows }));

        // Signature Section
        children.push(new Paragraph({ spacing: { before: 800 } }));

        const footerRows = [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NGƯỜI LẬP BIỂU", font: "Times New Roman", size: 22, bold: true })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký, ghi rõ họ tên)", font: "Times New Roman", size: 20, italics: true })] }),
                        ]
                    }),
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "THỦ TRƯỞNG ĐƠN VỊ", font: "Times New Roman", size: 22, bold: true })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký tên, đóng dấu)", font: "Times New Roman", size: 20, italics: true })] }),
                        ]
                    })
                ]
            })
        ];
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: footerRows, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } } }));

        const doc = new Document({
            sections: [{
                properties: { type: SectionType.CONTINUOUS },
                children: children
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Bao_cao_tong_hop_${dateFilter.endDate}.docx`);
        onSuccess('Đã xuất file Word báo cáo tổng hợp');
    } catch (error) {
        console.error("Word Export Error:", error);
        onError('Quá trình xuất Word gặp sự cố');
    } finally {
        setLoading(false);
    }
};
