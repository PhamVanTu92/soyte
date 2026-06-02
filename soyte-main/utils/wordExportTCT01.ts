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

export const exportTCT01ToWord = async (
    mockData: any,
    dateFilter: { startDate: string, endDate: string },
    setLoading: (val: boolean) => void,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void
) => {
    setLoading(true);
    try {
        const now = new Date();

        const mkCell = (text: string, options: { bold?: boolean, align?: any, colSpan?: number, rowSpan?: number, fill?: string, size?: number } = {}) => {
            const { bold = false, align = AlignmentType.LEFT, colSpan = 1, rowSpan = 1, fill, size = 22 } = options;

            const textRuns = text.split('\n').map((t, idx, arr) => {
                const run = new TextRun({ text: t, font: "Times New Roman", size, bold });
                return idx < arr.length - 1 ? [run, new TextRun({ break: 1 })] : [run];
            }).flat();

            return new TableCell({
                children: [new Paragraph({
                    children: textRuns,
                    alignment: align
                })],
                verticalAlign: VerticalAlign.CENTER,
                columnSpan: colSpan,
                rowSpan: rowSpan,
                shading: fill ? { fill, type: "solid", color: "auto" } : undefined,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
            });
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
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SỞ Y TẾ HÀ NỘI", font: "Times New Roman", size: 22, bold: true })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TỔ CÔNG TÁC SỐ 01", font: "Times New Roman", size: 22, bold: true })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "-----------------------", font: "Times New Roman", size: 22 })] }),
                            ]
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", font: "Times New Roman", size: 22, bold: true })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", font: "Times New Roman", size: 22, bold: true })] }),
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "-----------------------", font: "Times New Roman", size: 22 })] }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({
                                        text: `Hà Nội, ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(now.getMonth() + 1).padStart(2, '0')} năm ${now.getFullYear()}`,
                                        font: "Times New Roman",
                                        size: 22,
                                        italics: true
                                    })]
                                }),
                            ]
                        })
                    ]
                })
            ]
        }));

        children.push(new Paragraph({ spacing: { before: 400, after: 200 } }));
        children.push(new Paragraph({
            spacing: { after: 200 },
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
                text: "Kết quả thực hiện của Tổ công tác số 01 về khắc phục các tồn tại, hạn chế mang tính phổ thông năm 2026",
                font: "Times New Roman", size: 28, bold: true
            })]
        }));
        children.push(new Paragraph({
            spacing: { after: 400 },
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
                text: `(Kỳ báo cáo từ ngày ${formatDateVN(dateFilter.startDate)} đến ngày ${formatDateVN(dateFilter.endDate)})`,
                font: "Times New Roman", size: 22, italics: true
            })]
        }));

        children.push(new Paragraph({
            spacing: { before: 200, after: 200 },
            children: [new TextRun({ text: "I. CÔNG TÁC TRIỂN KHAI", font: "Times New Roman", size: 22, bold: true })]
        }));

        children.push(new Paragraph({
            spacing: { after: 200 },
            alignment: AlignmentType.JUSTIFIED,
            children: [new TextRun({
                text: "Phòng Kiểm tra lĩnh vực Y tế đã tham mưu Giám đốc Sở Y tế - Tổ Trưởng tổ công tác ban hành Kế hoạch số 1749/KH-SYT ngày 03/3/2026 (Kèm theo đề cương và 03 phụ lục kiểm tra về việc khắc phục tồn tại, hạn chế mang tính phổ thông năm 2026) kiểm tra việc thực hiện khắc phục các tồn tại, hạn chế mang tính phổ thông theo Chương trình hành động số 06-CTr/TU ngày 12/01/2026 của Ban Thường vụ Thành ủy thực hiện Nghị quyết số 72-NQ/TW ngày 09/9/2025 của Bộ Chính trị tại các cơ sở y tế, đơn vị trợ giúp xã hội trực thuộc và trạm y tế xã, phường.",
                font: "Times New Roman", size: 24
            })]
        }));

        children.push(new Paragraph({
            spacing: { before: 200, after: 200 },
            children: [new TextRun({ text: "II. KẾT QUẢ THỰC HIỆN", font: "Times New Roman", size: 22, bold: true })]
        }));

        const blocks = [
            { key: 'benhVien', title: 'Khối Bệnh viện', id: '1' },
            { key: 'troGiupXaHoi', title: 'Khối cơ sở trợ giúp xã hội', id: '2' },
            { key: 'tramYTe', title: 'Khối Trạm y tế xã, phường, thị trấn', id: '3' }
        ];

        blocks.forEach(khoi => {
            const data = mockData[khoi.key as keyof typeof mockData] as any;

            children.push(new Paragraph({
                spacing: { before: 200, after: 200 },
                children: [new TextRun({ text: `${khoi.id}. Kết quả triển khai thực hiện báo cáo của ${khoi.title.toLowerCase()}`, font: "Times New Roman", size: 22, bold: true })]
            }));

            children.push(new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({ text: `Tổng số: ${data.tongSo} đơn vị.`, font: "Times New Roman", size: 20 })]
            }));

            const rows1 = [
                new TableRow({
                    children: [
                        mkCell('STT', { bold: true, align: AlignmentType.CENTER }),
                        mkCell('Nội dung', { bold: true, align: AlignmentType.CENTER }),
                        mkCell('Số lượng', { bold: true, align: AlignmentType.CENTER }),
                        mkCell('Tỷ lệ', { bold: true, align: AlignmentType.CENTER }),
                    ]
                }),
                ... (data?.tiepNhan || []).map((item: any) => new TableRow({
                    children: [
                        mkCell(item.stt.toString(), { align: AlignmentType.CENTER }),
                        mkCell(item.noiDung),
                        mkCell(item.soLuong.toString(), { align: AlignmentType.CENTER, bold: true }),
                        mkCell(item.tyLe, { align: AlignmentType.CENTER, bold: true }),
                    ]
                }))
            ];
            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows1 }));

            children.push(new Paragraph({
                spacing: { before: 200, after: 200 },
                children: [new TextRun({ text: "Nhận xét về tỷ lệ đơn vị gửi báo cáo: .......................................................................................", font: "Times New Roman", size: 20 })]
            }));

            const reportedNum = (data?.tiepNhan && data.tiepNhan.length > 0) ? data.tiepNhan[0].soLuong : 0;
            children.push(new Paragraph({
                spacing: { before: 200, after: 200 },
                children: [new TextRun({ text: `Kết quả thực hiện theo đề cương và biểu mẫu (Chỉ phân tích tên ${reportedNum} đơn vị gửi báo cáo):`, font: "Times New Roman", size: 20, italics: true })]
            }));

            const rows2 = [
                new TableRow({
                    children: [
                        mkCell('STT', { bold: true, align: AlignmentType.CENTER }),
                        mkCell('Nội dung', { bold: true, align: AlignmentType.CENTER }),
                        mkCell('Số lượng', { bold: true, align: AlignmentType.CENTER }),
                        mkCell('Tỷ lệ', { bold: true, align: AlignmentType.CENTER }),
                    ]
                }),
                ... (data?.deCuong || []).map((item: any) => new TableRow({
                    children: [
                        mkCell(item.stt.toString(), { align: AlignmentType.CENTER }),
                        mkCell(item.noiDung),
                        mkCell(item.soLuong.toString(), { align: AlignmentType.CENTER, bold: true }),
                        mkCell(item.tyLe, { align: AlignmentType.CENTER, bold: true }),
                    ]
                }))
            ];
            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows2 }));

            children.push(new Paragraph({
                spacing: { before: 200, after: 400 },
                children: [new TextRun({ text: "Nhận xét về kết quả: ...................................................................................................................", font: "Times New Roman", size: 20 })]
            }));
        });

        // 7. Section Footer (Nơi nhận)
        children.push(new Paragraph({ spacing: { before: 600 } }));

        const footerRows = [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "Nơi nhận:", font: "Times New Roman", size: 22, bold: true, italics: true })] }),
                            new Paragraph({ children: [new TextRun({ text: "- Như trên;", font: "Times New Roman", size: 20 })] }),
                            new Paragraph({ children: [new TextRun({ text: "- Giám đốc Sở Y tế (để b/c);", font: "Times New Roman", size: 20 })] }),
                            new Paragraph({ children: [new TextRun({ text: "- Lưu: VT, KT.", font: "Times New Roman", size: 20 })] }),
                        ]
                    }),
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KT. GIÁM ĐỐC", font: "Times New Roman", size: 22, bold: true })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TỔ TRƯỞNG TỔ CÔNG TÁC SỐ 01", font: "Times New Roman", size: 22, bold: true })] }),
                            new Paragraph({ children: [new TextRun({ text: "", break: 4 })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PHÓ GIÁM ĐỐC SỞ Y TẾ", font: "Times New Roman", size: 22, bold: true })] }),
                        ]
                    })
                ]
            })
        ];
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: footerRows, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } } }));

        // 8. PHỤ LỤC 1: Các đơn vị đã thực hiện báo cáo
        const romanNums = ["I", "II", "III", "IV", "V"];
        children.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));
        children.push(new Paragraph({
            spacing: { before: 800, after: 200 },
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "PHỤ LỤC 1", font: "Times New Roman", size: 28, bold: true })]
        }));
        children.push(new Paragraph({
            spacing: { after: 400 },
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "DANH SÁCH CÁC ĐƠN VỊ ĐÃ THỰC HIỆN BÁO CÁO", font: "Times New Roman", size: 24, bold: true })]
        }));

        const appendixRows: TableRow[] = [
            new TableRow({
                children: [
                    mkCell('STT', { bold: true, align: AlignmentType.CENTER }),
                    mkCell('Tên đơn vị', { bold: true, align: AlignmentType.CENTER }),
                ]
            })
        ];

        blocks.forEach((khoi, index) => {
            const data = mockData[khoi.key as keyof typeof mockData] as any;
            
            appendixRows.push(new TableRow({
                children: [
                    mkCell(romanNums[index], { bold: true, align: AlignmentType.CENTER }),
                    mkCell(khoi.title, { bold: true }),
                ]
            }));

            if (data && data.danhSach && data.danhSach.length > 0) {
                data.danhSach.forEach((ten: string, i: number) => {
                    appendixRows.push(new TableRow({
                        children: [
                            mkCell(String(i + 1), { align: AlignmentType.CENTER }),
                            mkCell(ten),
                        ]
                    }));
                });
            } else {
                appendixRows.push(new TableRow({
                    children: [
                        mkCell("-", { align: AlignmentType.CENTER }),
                        mkCell("(Không có dữ liệu)"),
                    ]
                }));
            }
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: appendixRows }));

        const section = {
            properties: { type: SectionType.CONTINUOUS },
            children: children
        };

        const doc = new Document({ sections: [section] });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Bao_Cao_TCT01_${dateFilter.endDate}.docx`);
        onSuccess('Đã xuất file Word thành công');
    } catch (error) {
        console.error(error);
        onError('Lỗi xuất file Word');
    } finally {
        setLoading(false);
    }
};
