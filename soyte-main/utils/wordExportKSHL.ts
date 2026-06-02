import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, VerticalAlign } from 'docx';
import { saveAs } from 'file-saver';
import { formatDateVN } from '@/utils/dateUtils';

export const exportKSHLToWord = async (
    data: {
        dataNgoaiTru: any[],
        dataNoiTru: any[],
        dataTiemChung: any[],
        dataPhuLuc1: any[],
        dataPhuLuc2: any[],
        dataPhuLuc3: any[],
    },
    setLoading: (val: boolean) => void,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void
) => {
    setLoading(true);
    try {
        const endDateObj = new Date();
        const monthYearTitle = `tháng ${endDateObj.getMonth() + 1} năm ${endDateObj.getFullYear()}`;
        const monthYearText = `tháng ${endDateObj.getMonth() + 1}/${endDateObj.getFullYear()}`;
        const now = new Date();

        const children: any[] = [];

        // --- Helper functions ---
        const mkText = (text: string, options: { bold?: boolean, italics?: boolean, size?: number, break?: number } = {}) => {
            return new TextRun({
                text: text,
                font: "Times New Roman",
                size: options.size || 24, // 12pt = 24
                bold: options.bold,
                italics: options.italics,
                break: options.break
            });
        };

        const mkParagraph = (text: string | TextRun[], options: { align?: any, bold?: boolean, italics?: boolean, size?: number, before?: number, after?: number, indent?: number } = {}) => {
            return new Paragraph({
                alignment: options.align || AlignmentType.JUSTIFIED,
                spacing: { before: options.before ?? 120, after: options.after ?? 120, line: 360 },
                indent: options.indent ? { firstLine: options.indent } : undefined,
                children: typeof text === 'string' ? [mkText(text, { bold: options.bold, italics: options.italics, size: options.size })] : text
            });
        };

        const mkCell = (content: string | Paragraph[], options: { bold?: boolean, align?: any, colSpan?: number, rowSpan?: number, size?: number, bgColor?: string } = {}) => {
            return new TableCell({
                columnSpan: options.colSpan,
                rowSpan: options.rowSpan,
                verticalAlign: VerticalAlign.CENTER,
                shading: options.bgColor ? { fill: options.bgColor } : undefined,
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: typeof content === 'string'
                    ? [new Paragraph({
                        alignment: options.align || AlignmentType.LEFT,
                        children: [mkText(content, { bold: options.bold, size: options.size || 22 })]
                    })]
                    : content
            });
        };

        // --- HEADER ---
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
                        mkCell([
                            mkParagraph("UBND THÀNH PHỐ HÀ NỘI", { align: AlignmentType.CENTER, size: 22 }),
                            mkParagraph("SỞ Y TẾ", { align: AlignmentType.CENTER, bold: true, size: 22, before: 0 }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: "__________", size: 22, bold: true })]
                            })
                        ], { align: AlignmentType.CENTER }),
                        mkCell([
                            mkParagraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { align: AlignmentType.CENTER, bold: true, size: 22 }),
                            mkParagraph("Độc lập – Tự do – Hạnh phúc", { align: AlignmentType.CENTER, bold: true, size: 22, before: 0 }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: "_______________________", size: 22, bold: true })]
                            })
                        ], { align: AlignmentType.CENTER })
                    ]
                }),
                new TableRow({
                    children: [
                        mkCell([
                            mkParagraph("Số : ........ /BC-SYT", { align: AlignmentType.CENTER, size: 22, before: 100 })
                        ]),
                        mkCell([
                            mkParagraph(`Hà Nội, ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(now.getMonth() + 1).padStart(2, '0')} năm ${now.getFullYear()}`, {
                                align: AlignmentType.CENTER,
                                italics: true,
                                size: 22,
                                before: 100
                            })
                        ])
                    ]
                })
            ]
        }));

        children.push(new Paragraph({ spacing: { before: 400, after: 100 }, alignment: AlignmentType.CENTER, children: [mkText("BÁO CÁO", { bold: true, size: 28 })] }));
        children.push(mkParagraph(`Kết quả khảo sát, đánh giá sự hài lòng của người bệnh nội trú, ngoại trú và người dân sử dụng dịch vụ tiêm chủng mở rộng của Ngành Y tế Hà Nội ${monthYearTitle}`, { align: AlignmentType.CENTER, bold: true, size: 26, after: 300 }));

        children.push(mkParagraph('Thực hiện nội dung chỉ đạo tại Nghị Quyết số 72-NQ-TW ngày 09/09/2025 của Bộ Chính trị về một số giải pháp đột phá, tăng cường bảo vệ, chăm sóc và nâng cao sức khỏe nhân dân; Chương trình hành động số 06-CTr/TU ngày 12/01/2026 của Thành ủy Hà Nội; Quyết định số 56/QĐ-BYT ngày 08/01/2024 của Bộ Y tế hướng dẫn về phương pháp đo lường sự hài lòng của người dân đối với dịch vụ y tế công giai đoạn 2024 - 2030;', { indent: 700 }));
        children.push(mkParagraph(`Sở Y tế thành phố Hà Nội báo cáo kết quả khảo sát, đánh giá sự hài lòng của người bệnh nội trú, ngoại trú và người dân sử dụng dịch vụ tiêm chủng mở rộng của Ngành Y tế Hà Nội ${monthYearTitle} như sau:`, { indent: 700 }));

        children.push(mkParagraph('I. CÔNG TÁC CHỈ ĐẠO', { bold: true }));
        children.push(mkParagraph('Sở Y tế Hà Nội đã ban hành các kế hoạch và các văn bản chỉ đạo các đơn vị thực hiện bao gồm: Kế hoạch số 1329/KH-SYT ngày 11/02/2026 của Sở Y tế Hà Nội về việc thực hiện Thực hiện khảo sát, đánh giá sự hài lòng của người bệnh nội trú, ngoại trú và người dân sử dụng dịch vụ tiêm chủng mở rộng của Ngành Y tế Hà Nội năm 2026; Kế hoạch số 834/KH-SYT ngày 27/01/2026; Công văn số 1344/SYT-NVY.', { indent: 700 }));
        children.push(mkParagraph('Bên cạnh phần tự khảo sát và tổng hợp kết quả của đơn vị, Sở Y tế Hà Nội đã yêu cầu các đơn vị triển khai 03 mã khảo sát sự hài lòng tại các các điểm tiếp đón và khu vực nội trú. Từ kết quả khảo sát độc lập để so sánh cũng như giám sát lại kết quả tự khảo sát của đơn vị.', { indent: 700 }));

        children.push(mkParagraph('II. KẾT QUẢ THỰC HIỆN', { bold: true }));
        children.push(mkParagraph('1. Kết quả chung về việc triển khai khảo sát sự hài lòng qua mã QR', { bold: true }));
        children.push(mkParagraph('Thực hiện Kế hoạch của Sở Y tế Hà Nội, các đơn vị đã triển khai hình thức khảo sát trực tuyến thông qua mã QR Code. Tại các cơ sở khám bệnh, chữa bệnh và trạm y tế, mã QR khảo sát được bố trí tại nhiều vị trí khác nhau, trung bình từ 10 - 30 điểm/đơn vị đối với bệnh viện, từ 1-3 điểm/đơn vị đối với trạm y tế đặc biệt là khu vực đón tiếp, khu vực khám bệnh ngoại trú, các khoa lâm sàng đối với người bệnh nội trú, khu vực tiêm chủng mở rộng, bảng thông tin bệnh viện và các vị trí đông người qua lại nhằm tạo điều kiện thuận lợi cho người bệnh và người dân tham gia khảo sát. Số điểm dán mã QR khảo sát:', { indent: 700 }));

        children.push(new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 200, line: 360 },
            indent: { left: 1000 }, 
            children: [
                new TextRun({ text: `- Tại các Bệnh viện Công lập: ....... điểm khảo sát`, font: "Times New Roman", size: 24 }),
                new TextRun({ text: `- Tại các Bệnh viện ngoài Công lập: ....... điểm khảo sát`, font: "Times New Roman", size: 24, break: 1 }),
                new TextRun({ text: `- Tại các Trạm Y tế: ....... điểm khảo sát`, font: "Times New Roman", size: 24, break: 1 }),
            ]
        }));

        // --- DRAW TABLE FUNCTION ---
        const createSummaryTable = (title: string, data: any[], unitLabel: string = 'Đơn vị') => {
            children.push(mkParagraph(title, { bold: true, before: 200 }));

            const headerTongHop = ['TS đơn vị báo cáo', 'Tổng số phiếu KS hài lòng', 'Tỷ lệ hài lòng', 'TS đơn vị báo cáo', 'Tổng số phiếu KS hài lòng', 'Tỷ lệ hài lòng'];

            const rows = [
                new TableRow({
                    children: [
                        mkCell('STT', { bold: true, align: AlignmentType.CENTER, rowSpan: 2 }),
                        mkCell(unitLabel, { bold: true, align: AlignmentType.CENTER, rowSpan: 2 }),
                        mkCell('KQ tự khảo sát của đơn vị', { bold: true, align: AlignmentType.CENTER, colSpan: 3 }),
                        mkCell('KQ khảo sát qua QR của SYT', { bold: true, align: AlignmentType.CENTER, colSpan: 3 }),
                    ]
                }),
                new TableRow({
                    children: headerTongHop.map(h => mkCell(h, { bold: true, align: AlignmentType.CENTER, size: 20 }))
                })
            ];

            data.forEach(row => {
                rows.push(new TableRow({
                    children: [
                        mkCell(row.id || '', { align: AlignmentType.CENTER, bold: !!row.isTotal }),
                        mkCell(row.type || '', { bold: !!row.isTotal }),
                        mkCell(row.col1 || '', { align: AlignmentType.CENTER, bold: !!row.isTotal }),
                        mkCell(row.col2 || '', { align: AlignmentType.CENTER, bold: !!row.isTotal }),
                        mkCell(row.col3 || '', { align: AlignmentType.CENTER, bold: !!row.isTotal }),
                        mkCell(row.col4 || '', { align: AlignmentType.CENTER, bold: !!row.isTotal }),
                        mkCell(row.col5 || '', { align: AlignmentType.CENTER, bold: !!row.isTotal }),
                        mkCell(row.col6 || '', { align: AlignmentType.CENTER, bold: !!row.isTotal }),
                    ]
                }));
            });

            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: rows
            }));
        };

        createSummaryTable('2. Kết quả khảo sát hài lòng người bệnh ngoại trú', data.dataNgoaiTru);
        createSummaryTable('3. Kết quả khảo sát hài lòng người bệnh nội trú', data.dataNoiTru);
        createSummaryTable('4. Kết quả khảo sát hài lòng người dân sử dụng dịch vụ tiêm chủng:', data.dataTiemChung);

        children.push(mkParagraph('5. Kết quả chi tiết', { bold: true, before: 200 }));
        children.push(mkParagraph('- Các Bệnh viện công lập: Phụ lục 1 (đính kèm)\n- Các Bệnh viện ngoài công lập: Phụ lục 2 (đính kèm)\n- Trạm Y tế xã/phường: Phụ lục 3 (đính kèm)'));

        children.push(mkParagraph('III. NHẬN XÉT KẾT QUẢ VÀ ĐÁNH GIÁ CHUNG', { bold: true }));
        children.push(mkParagraph('Qua tổng hợp ý kiến khảo sát của người bệnh ngoại trú, nội trú và người dân sử dụng dịch vụ tiêm chủng, nhìn chung các ý kiến đánh giá tích cực về chất lượng dịch vụ khám chữa bệnh, thái độ phục vụ của nhân viên y tế và môi trường khám chữa bệnh. Kết quả khảo sát theo 05 nhóm chỉ số cho thấy:', { indent: 700 }));
        children.push(mkParagraph('1. Khả năng tiếp cận dịch vụ y tế: Đa số người bệnh đánh giá việc tiếp cận dịch vụ khám chữa bệnh tương đối thuận lợi. Tuy nhiên, một số ý kiến phản ánh thời gian chờ đợi khám bệnh còn kéo dài.', { indent: 700 }));
        children.push(mkParagraph('2. Sự minh bạch thông tin và thủ tục: Các cơ sở y tế đã thực hiện niêm yết công khai các quy trình, giá dịch vụ. Tuy nhiên, một số ý kiến cho rằng thông tin hướng dẫn cần rõ ràng hơn.', { indent: 700 }));
        children.push(mkParagraph('3. Cơ sở vật chất và phương tiện phục vụ: Cơ sở vật chất nhiều nơi đã được cải tạo xanh - sạch - đẹp. Tuy nhiên, khu vực nhà vệ sinh và ghế chờ tại một số nơi còn hạn chế.', { indent: 700 }));
        children.push(mkParagraph('4. Thái độ ứng xử, năng lực chuyên môn: Đa số đánh giá tích cực về tinh thần trách nhiệm, thái độ thân thiện và sự tận tình của nhân viên y tế.', { indent: 700 }));

        children.push(mkParagraph('IV. MỘT SỐ TỒN TẠI, KHÓ KHĂN VÀ GIẢI PHÁP THỰC HIỆN', { bold: true }));
        children.push(mkParagraph('Qua kết quả khảo sát vẫn còn một số tồn tại như:\n- Thời gian chờ đợi khám bệnh tại một số thời điểm vẫn còn kéo dài.\n- Cơ sở vật chất tại một số đơn vị, đặc biệt là nhà vệ sinh cần cải thiện.', { indent: 700 }));
        children.push(mkParagraph('Sở Y tế yêu cầu các đơn vị y tế tập trung triển khai các giải pháp:\n1. Tăng cường cải tiến quy trình khám chữa bệnh.\n2. Tăng cường công tác quản lý và giám sát dịch vụ hỗ trợ.\n3. Nâng cấp cơ sở vật chất và môi trường bệnh viện.\n4. Bổ sung nguồn nhân lực và nâng cao năng lực chuyên môn.\n5. Tăng cường tiếp nhận và xử lý phản ánh của người dân.', { indent: 700 }));

        children.push(mkParagraph(`Trên đây là báo cáo kết quả triển khai khảo sát hài lòng của người dân, người bệnh nội trú, ngoại trú và tiêm chủng tại các cơ sở y tế trực thuộc Sở Y tế Hà Nội ${monthYearText}.`, { after: 400 }));

        // --- SIGNATURE SECTION ---
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
                        mkCell([
                            new Paragraph({
                                children: [new TextRun({ text: "Nơi nhận:", bold: true, italics: true, size: 22 })]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.LEFT, children: [
                                    new TextRun({ text: "- Cục QLKCB-BYT", size: 20, break: 1 }),
                                    new TextRun({ text: "- Sở Nội Vụ;", size: 20, break: 1 }),
                                    new TextRun({ text: "- Viện NCPTKT-XHHN;", size: 20, break: 1 }),
                                    new TextRun({ text: "- Ban Giám đốc Sở Y tế;", size: 20, break: 1 }),
                                    new TextRun({ text: "- Các phòng thuộc Sở Y tế;", size: 20, break: 1 }),
                                    new TextRun({ text: "- Bộ phận truyền thông Sở Y tế;", size: 20, break: 1 }),
                                    new TextRun({ text: "- Các BV công lập và tư nhân;", size: 20, break: 1 }),
                                    new TextRun({ text: "- 126 xã/phường;", size: 20, break: 1 }),
                                    new TextRun({ text: "- TT KSBT Hà Nội; TTCC 115;", size: 20, break: 1 }),
                                    new TextRun({ text: "- UBND các xã/phường; (để p/h c/đ)", size: 20, break: 1 }),
                                    new TextRun({ text: "- Lưu VT, TCCB, VPS, NVYHẰNG", size: 20, break: 1 }),
                                ]
                            })
                        ], { width: { size: 50, type: WidthType.PERCENTAGE } } as any),
                        mkCell([
                            mkParagraph("KT. GIÁM ĐỐC", { align: AlignmentType.CENTER, bold: true, size: 24, before: 0, after: 0 }),
                            mkParagraph("PHÓ GIÁM ĐỐC", { align: AlignmentType.CENTER, bold: true, size: 24, before: 0, after: 400 }),
                        ], { align: AlignmentType.CENTER, width: { size: 50, type: WidthType.PERCENTAGE } } as any)
                    ]
                })
            ]
        }));

        // --- APPENDIX ---
        const createAppendixTable = (title: string, data: any[], type1: string, type2: string, unitLabel: string) => {
            children.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] })); // Space before appendix
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 100 },
                children: [mkText(title, { bold: true, size: 24 })]
            }));

            const rows = [
                new TableRow({
                    children: [
                        mkCell('STT', { bold: true, align: AlignmentType.CENTER, rowSpan: 3, size: 18 }),
                        mkCell(unitLabel, { bold: true, align: AlignmentType.CENTER, rowSpan: 3, size: 18 }),
                        mkCell('KQ tự khảo sát của đơn vị', { bold: true, align: AlignmentType.CENTER, colSpan: 4, size: 18 }),
                        mkCell('KQ khảo sát qua QR của SYT', { bold: true, align: AlignmentType.CENTER, colSpan: 4, size: 18 }),
                    ]
                }),
                new TableRow({
                    children: [
                        mkCell(`CSHL\n${type1}`, { bold: true, align: AlignmentType.CENTER, rowSpan: 2, size: 18 }),
                        mkCell(`CSHL\n${type2}`, { bold: true, align: AlignmentType.CENTER, rowSpan: 2, size: 18 }),
                        mkCell('TS phiếu KS', { bold: true, align: AlignmentType.CENTER, colSpan: 2, size: 18 }),
                        mkCell(`CSHL\n${type1}`, { bold: true, align: AlignmentType.CENTER, rowSpan: 2, size: 18 }),
                        mkCell(`CSHL\n${type2}`, { bold: true, align: AlignmentType.CENTER, rowSpan: 2, size: 18 }),
                        mkCell('TS phiếu KS', { bold: true, align: AlignmentType.CENTER, colSpan: 2, size: 18 }),
                    ]
                }),
                new TableRow({
                    children: [
                        mkCell(type1, { bold: true, align: AlignmentType.CENTER, size: 18 }),
                        mkCell(type2, { bold: true, align: AlignmentType.CENTER, size: 18 }),
                        mkCell(type1, { bold: true, align: AlignmentType.CENTER, size: 18 }),
                        mkCell(type2, { bold: true, align: AlignmentType.CENTER, size: 18 }),
                    ]
                })
            ];

            data.forEach(row => {
                rows.push(new TableRow({
                    children: [
                        mkCell(row.id || '', { align: AlignmentType.CENTER, size: 18 }),
                        mkCell(row.type || '', { size: 18 }),
                        mkCell(row.col1 || '', { align: AlignmentType.CENTER, size: 18 }),
                        mkCell(row.col2 || '', { align: AlignmentType.CENTER, size: 18 }),
                        mkCell(row.col3 || '', { align: AlignmentType.CENTER, size: 18 }),
                        mkCell(row.col4 || '', { align: AlignmentType.CENTER, size: 18 }),
                        mkCell(row.col5 || '', { align: AlignmentType.CENTER, size: 18 }),
                        mkCell(row.col6 || '', { align: AlignmentType.CENTER, size: 18 }),
                        mkCell(row.col7 || '', { align: AlignmentType.CENTER, size: 18 }),
                        mkCell(row.col8 || '', { align: AlignmentType.CENTER, size: 18 }),
                    ]
                }));
            });

            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: rows
            }));
        };

        createAppendixTable('Phụ lục 1: Kết quả khảo sát hài lòng của các Bệnh viện công lập', data.dataPhuLuc1, 'nội trú', 'ngoại trú', 'Tên bệnh viện');
        createAppendixTable('Phụ lục 2: Kết quả khảo sát hài lòng của các Bệnh viện ngoài công lập', data.dataPhuLuc2, 'nội trú', 'ngoại trú', 'Tên bệnh viện');
        createAppendixTable('Phụ lục 3: Kết quả khảo sát hài lòng của các Trạm Y tế', data.dataPhuLuc3, 'tiêm chủng', 'ngoại trú', 'Xã / Phường');

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1134, // 2cm
                            bottom: 1134,
                            left: 1701, // 3cm
                            right: 850, // 1.5cm
                        }
                    }
                },
                children: children
            }]
        });

        const buffer = await Packer.toBlob(doc);
        saveAs(buffer, `Bao_Cao_Khao_Sat_Hai_Long_${monthYearText.replace('/', '_')}.docx`);
        onSuccess('Đã xuất file Word thành công');
    } catch (error) {
        console.error("Word Export Error:", error);
        onError('Xuất file Word thất bại');
    } finally {
        setLoading(false);
    }
};
