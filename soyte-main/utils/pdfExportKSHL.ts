import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'
import { TIMES_REGULAR_BASE64, TIMES_BOLD_BASE64 } from '@/utils/pdfFonts'

export const exportKSHLToPDF = async (
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
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.addFileToVFS('times.ttf', TIMES_REGULAR_BASE64);
        doc.addFont('times.ttf', 'TimesNewRoman', 'normal', 'Identity-H');
        doc.addFileToVFS('timesbd.ttf', TIMES_BOLD_BASE64);
        doc.addFont('timesbd.ttf', 'TimesNewRoman', 'bold', 'Identity-H');
        const FONT = 'TimesNewRoman';

        const endDateObj = new Date();
        const monthYearTitle = `tháng ${endDateObj.getMonth() + 1} năm ${endDateObj.getFullYear()}`;
        const monthYearText = `tháng ${endDateObj.getMonth() + 1}/${endDateObj.getFullYear()}`;

        let currentY = 20;

        const checkPageBreak = (heightNeeded: number) => {
            if (currentY + heightNeeded > 280) {
                doc.addPage();
                currentY = 20;
            }
        };

        const printParagraph = (text: string, isBold = false, align: 'left' | 'center' | 'justify' = 'justify', customX = 20, customWidth = 170) => {
            doc.setFont(FONT, isBold ? 'bold' : 'normal');
            doc.setFontSize(12);
            const lines = doc.splitTextToSize(text, customWidth);
            checkPageBreak(lines.length * 6);
            doc.text(lines, customX, currentY, { align: align === 'justify' ? 'left' : align, maxWidth: customWidth });
            currentY += (lines.length * 6) + 2;
        };

        // --- HEADER ---
        doc.setFontSize(11);
        doc.setFont(FONT, 'normal');
        doc.text('UBND THÀNH PHỐ HÀ NỘI', 55, currentY, { align: 'center' });
        doc.setFont(FONT, 'bold');
        doc.text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', 150, currentY, { align: 'center' });
        currentY += 5;

        doc.text('SỞ Y TẾ', 55, currentY, { align: 'center' });
        doc.text('Độc lập – Tự do – Hạnh phúc', 150, currentY, { align: 'center' });
        doc.line(45, currentY + 1, 65, currentY + 1);
        doc.line(125, currentY + 1, 175, currentY + 1);
        currentY += 8;

        doc.setFont(FONT, 'normal');
        doc.text('Số : ........ /BC-SYT', 55, currentY, { align: 'center' });
        const now = new Date();
        doc.text(`Hà Nội, ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(now.getMonth() + 1).padStart(2, '0')} năm ${now.getFullYear()}`, 150, currentY, { align: 'center' });
        currentY += 15;

        // --- TITLE (Sử dụng thời gian động) ---
        doc.setFontSize(13);
        doc.setFont(FONT, 'bold');
        doc.text('BÁO CÁO', 105, currentY, { align: 'center' });
        currentY += 6;
        printParagraph(`Kết quả khảo sát, đánh giá sự hài lòng của người bệnh nội trú, ngoại trú và người dân sử dụng dịch vụ tiêm chủng mở rộng của Ngành Y tế Hà Nội ${monthYearTitle}`, true, 'center', 105, 160);
        currentY += 4;

        // --- NỘI DUNG VĂN BẢN ---
        printParagraph('Thực hiện nội dung chỉ đạo tại Nghị Quyết số 72-NQ-TW ngày 09/09/2025 của Bộ Chính trị về một số giải pháp đột phá, tăng cường bảo vệ, chăm sóc và nâng cao sức khỏe nhân dân; Chương trình hành động số 06-CTr/TU ngày 12/01/2026 của Thành ủy Hà Nội; Quyết định số 56/QĐ-BYT ngày 08/01/2024 của Bộ Y tế hướng dẫn về phương pháp đo lường sự hài lòng của người dân đối với dịch vụ y tế công giai đoạn 2024 - 2030;');
        printParagraph(`Sở Y tế thành phố Hà Nội báo cáo kết quả khảo sát, đánh giá sự hài lòng của người bệnh nội trú, ngoại trú và người dân sử dụng dịch vụ tiêm chủng mở rộng của Ngành Y tế Hà Nội ${monthYearTitle} như sau:`);

        printParagraph('I. CÔNG TÁC CHỈ ĐẠO', true);
        printParagraph('Sở Y tế Hà Nội đã ban hành các kế hoạch và các văn bản chỉ đạo các đơn vị thực hiện bao gồm: Kế hoạch số 1329/KH-SYT ngày 11/02/2026 của Sở Y tế Hà Nội về việc thực hiện Thực hiện khảo sát, đánh giá sự hài lòng của người bệnh nội trú, ngoại trú và người dân sử dụng dịch vụ tiêm chủng mở rộng của Ngành Y tế Hà Nội năm 2026; Kế hoạch số 834/KH-SYT ngày 27/01/2026; Công văn số 1344/SYT-NVY.');
        printParagraph('Bên cạnh phần tự khảo sát và tổng hợp kết quả của đơn vị, Sở Y tế Hà Nội đã yêu cầu các đơn vị triển khai 03 mã khảo sát sự hài lòng tại các các điểm tiếp đón và khu vực nội trú. Từ kết quả khảo sát độc lập để so sánh cũng như giám sát lại kết quả tự khảo sát của đơn vị.');

        printParagraph('II. KẾT QUẢ THỰC HIỆN', true);
        printParagraph('1. Kết quả chung về việc triển khai khảo sát sự hài lòng qua mã QR', true);
        printParagraph('Thực hiện Kế hoạch của Sở Y tế Hà Nội, các đơn vị đã triển khai hình thức khảo sát trực tuyến thông qua mã QR Code. Tại các cơ sở khám bệnh, chữa bệnh và trạm y tế, mã QR khảo sát được bố trí tại nhiều vị trí khác nhau, trung bình từ 10 - 30 điểm/đơn vị đối với bệnh viện, từ 1-3 điểm/đơn vị đối với trạm y tế đặc biệt là khu vực đón tiếp, khu vực khám bệnh ngoại trú, các khoa lâm sàng đối với người bệnh nội trú, khu vực tiêm chủng mở rộng, bảng thông tin bệnh viện và các vị trí đông người qua lại nhằm tạo điều kiện thuận lợi cho người bệnh và người dân tham gia khảo sát. Số điểm dán mã QR khảo sát:');
        printParagraph(`    - Tại các Bệnh viện Công lập: ....... điểm khảo sát\n    - Tại các Bệnh viện ngoài Công lập: ....... điểm khảo sát\n    - Tại các Trạm Y tế: ....... điểm khảo sát`, false, 'left', 30);

        // --- HÀM VẼ BẢNG ---
        const drawTable = (title: string, data: any[], isAppendix: boolean = false, type1: string = '', type2: string = '', unitLabel: string = 'Đơn vị') => {
            checkPageBreak(40);

            doc.setFontSize(12);
            doc.setFont(FONT, 'bold');
            if (isAppendix) {
                const parts = title.split(': ');
                doc.text(parts[0], 105, currentY, { align: 'center' });
                doc.text(parts[1], 105, currentY + 6, { align: 'center' });
                currentY += 12;
            } else {
                doc.text(title, 20, currentY);
                currentY += 6;
            }

            const headerTongHop = ['TS đơn vị báo cáo', 'Tổng số phiếu KS hài lòng', 'Tỷ lệ hài lòng', 'TS đơn vị báo cáo', 'Tổng số phiếu KS hài lòng', 'Tỷ lệ hài lòng'];

            let head = [];
            if (isAppendix) {
                head = [
                    [{ content: 'STT', rowSpan: 3 }, { content: unitLabel, rowSpan: 3 }, { content: 'KQ tự khảo sát của đơn vị', colSpan: 4 }, { content: 'KQ khảo sát qua QR của SYT', colSpan: 4 }],
                    [{ content: `CSHL\n${type1}`, rowSpan: 2 }, { content: `CSHL\n${type2}`, rowSpan: 2 }, { content: 'TS phiếu KS', colSpan: 2 }, { content: `CSHL\n${type1}`, rowSpan: 2 }, { content: `CSHL\n${type2}`, rowSpan: 2 }, { content: 'TS phiếu KS', colSpan: 2 }],
                    [type1, type2, type1, type2]
                ];
            } else {
                head = [
                    [{ content: 'STT', rowSpan: 2 }, { content: unitLabel, rowSpan: 2 }, { content: 'KQ tự khảo sát của đơn vị', colSpan: 3 }, { content: 'KQ khảo sát qua QR của SYT', colSpan: 3 }],
                    headerTongHop
                ];
            }

            const body = data.map(row => {
                const rowData: any[] = [
                    { content: row.id, styles: { fontStyle: row.isTotal ? 'bold' : 'normal' } },
                    { content: row.type, styles: { fontStyle: row.isTotal ? 'bold' : 'normal', halign: !row.isTotal && !isAppendix ? 'center' : 'left' } },
                    { content: row.col1, styles: { fontStyle: row.isTotal ? 'bold' : 'normal' } },
                    { content: row.col2, styles: { fontStyle: row.isTotal ? 'bold' : 'normal' } },
                    { content: row.col3, styles: { fontStyle: row.isTotal ? 'bold' : 'normal' } },
                    { content: row.col4, styles: { fontStyle: row.isTotal ? 'bold' : 'normal' } },
                    { content: row.col5, styles: { fontStyle: row.isTotal ? 'bold' : 'normal' } },
                    { content: row.col6, styles: { fontStyle: row.isTotal ? 'bold' : 'normal' } }
                ];
                if (isAppendix) {
                    rowData.push({ content: row.col7 || '', styles: { fontStyle: 'normal' } });
                    rowData.push({ content: row.col8 || '', styles: { fontStyle: 'normal' } });
                }
                return rowData;
            });

            autoTable(doc, {
                startY: currentY,
                head: head as any,
                body: body,
                styles: { font: FONT, fontSize: isAppendix ? 8 : 9, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 1 },
                headStyles: { font: FONT, fontStyle: 'bold', fillColor: [255, 255, 255], halign: 'center', valign: 'middle' },
                columnStyles: isAppendix
                    ? { 0: { halign: 'center', cellWidth: 8 }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' }, 9: { halign: 'center' } }
                    : { 0: { halign: 'center', cellWidth: 10 }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center' } },
                theme: 'grid'
            });

            currentY = (doc as any).lastAutoTable.finalY + 8;
        };

        // Vẽ các bảng tổng hợp
        drawTable('2. Kết quả khảo sát hài lòng người bệnh ngoại trú', data.dataNgoaiTru, false);
        drawTable('3. Kết quả khảo sát hài lòng người bệnh nội trú', data.dataNoiTru, false);
        drawTable('4. Kết quả khảo sát hài lòng người dân sử dụng dịch vụ tiêm chủng:', data.dataTiemChung, false);

        printParagraph('5. Kết quả chi tiết', true);
        printParagraph('- Các Bệnh viện công lập: Phụ lục 1 (đính kèm)\n- Các Bệnh viện ngoài công lập: Phụ lục 2 (đính kèm)\n- Trạm Y tế xã/phường: Phụ lục 3 (đính kèm)');

        printParagraph('III. NHẬN XÉT KẾT QUẢ VÀ ĐÁNH GIÁ CHUNG', true);
        printParagraph('Qua tổng hợp ý kiến khảo sát của người bệnh ngoại trú, nội trú và người dân sử dụng dịch vụ tiêm chủng, nhìn chung các ý kiến đánh giá tích cực về chất lượng dịch vụ khám chữa bệnh, thái độ phục vụ của nhân viên y tế và môi trường khám chữa bệnh. Kết quả khảo sát theo 05 nhóm chỉ số cho thấy:');
        printParagraph('1. Khả năng tiếp cận dịch vụ y tế: Đa số người bệnh đánh giá việc tiếp cận dịch vụ khám chữa bệnh tương đối thuận lợi. Tuy nhiên, một số ý kiến phản ánh thời gian chờ đợi khám bệnh còn kéo dài.');
        printParagraph('2. Sự minh bạch thông tin và thủ tục: Các cơ sở y tế đã thực hiện niêm yết công khai các quy trình, giá dịch vụ. Tuy nhiên, một số ý kiến cho rằng thông tin hướng dẫn cần rõ ràng hơn.');
        printParagraph('3. Cơ sở vật chất và phương tiện phục vụ: Cơ sở vật chất nhiều nơi đã được cải tạo xanh - sạch - đẹp. Tuy nhiên, khu vực nhà vệ sinh và ghế chờ tại một số nơi còn hạn chế.');
        printParagraph('4. Thái độ ứng xử, năng lực chuyên môn: Đa số đánh giá tích cực về tinh thần trách nhiệm, thái độ thân thiện và sự tận tình của nhân viên y tế.');

        printParagraph('IV. MỘT SỐ TỒN TẠI, KHÓ KHĂN VÀ GIẢI PHÁP THỰC HIỆN', true);
        printParagraph('Qua kết quả khảo sát vẫn còn một số tồn tại như:\n- Thời gian chờ đợi khám bệnh tại một số thời điểm vẫn còn kéo dài.\n- Cơ sở vật chất tại một số đơn vị, đặc_biệt là nhà vệ sinh cần cải thiện.');
        printParagraph('Sở Y tế yêu cầu các đơn vị y tế tập trung triển khai các giải pháp:\n1. Tăng cường cải tiến quy trình khám chữa bệnh.\n2. Tăng cường công tác quản lý và giám sát dịch vụ hỗ trợ.\n3. Nâng cấp cơ sở vật chất và môi trường bệnh viện.\n4. Bổ sung nguồn nhân lực và nâng cao năng lực chuyên môn.\n5. Tăng cường tiếp nhận và xử lý phản ánh của người dân.');
        // --- KẾT LUẬN ĐỘNG THEO THÁNG NĂM ---
        printParagraph(`Trên đây là báo cáo kết quả triển khai khảo sát hài lòng của người dân, người bệnh nội trú, ngoại trú và tiêm chủng tại các cơ sở y tế trực thuộc Sở Y tế Hà Nội ${monthYearText}.`);

        // --- CHỮ KÝ VÀ NƠI NHẬN ---
        checkPageBreak(70); // Tăng khoảng trống check ngắt trang vì Nơi nhận khá dài
        currentY += 10;
        doc.setFontSize(11);

        // Cột trái: Nơi nhận
        doc.setFont(FONT, 'bold');
        doc.text('Nơi nhận:', 20, currentY);

        // Cột phải: Chữ ký
        doc.setFont(FONT, 'bold');
        doc.text('KT. GIÁM ĐỐC', 150, currentY, { align: 'center' });
        doc.text('PHÓ GIÁM ĐỐC', 150, currentY + 5, { align: 'center' });

        doc.setFont(FONT, 'normal');
        let nY = currentY + 5;
        const lineSpacing = 5;

        // --- Nhóm 1: Để báo cáo ---
        const startGroup1 = nY;
        doc.text('- Cục QLKCB-BYT', 20, nY); nY += lineSpacing;
        doc.text('- Sở Nội Vụ;', 20, nY); nY += lineSpacing;
        doc.text('- Viện NCPTKT-XHHN;', 20, nY); nY += lineSpacing;
        doc.text('- Ban Giám đốc Sở Y tế;', 20, nY);

        // Vẽ đường gộp nhóm 1 (tạo hình giống dấu ngoặc ])
        doc.line(70, startGroup1 - 3, 72, startGroup1 - 3); // gạch ngang trên
        doc.line(72, startGroup1 - 3, 72, nY + 1);          // gạch dọc
        doc.line(70, nY + 1, 72, nY + 1);                   // gạch ngang dưới
        doc.text('(để báo cáo)', 75, startGroup1 + 1.5 * lineSpacing); // Căn chữ ra giữa ngoặc

        nY += lineSpacing;

        // --- Nhóm 2: Để thực hiện ---
        const startGroup2 = nY;
        doc.text('- Các phòng thuộc Sở Y tế;', 20, nY); nY += lineSpacing;
        doc.text('- Bộ phận truyền thông Sở Y tế;', 20, nY); nY += lineSpacing;
        doc.text('- Các BV công lập và tư nhân;', 20, nY); nY += lineSpacing;
        doc.text('- 126 xã/phường;', 20, nY); nY += lineSpacing;
        doc.text('- TT KSBT Hà Nội; TTCC 115;', 20, nY);

        // Vẽ đường gộp nhóm 2
        doc.line(70, startGroup2 - 3, 72, startGroup2 - 3);
        doc.line(72, startGroup2 - 3, 72, nY + 1);
        doc.line(70, nY + 1, 72, nY + 1);
        doc.text('(để thực hiện)', 75, startGroup2 + 2 * lineSpacing);

        nY += lineSpacing;

        // --- Các mục lẻ còn lại ---
        doc.text('- UBND các xã/phường; (để p/h c/đ)', 20, nY); nY += lineSpacing;
        doc.text('- Lưu VT, TCCB, VPS, NVYHẰNG', 20, nY);

        // --- PHẦN PHỤ LỤC ---
        doc.addPage(); currentY = 20;
        drawTable('Phụ lục 1: Kết quả khảo sát hài lòng của các Bệnh viện công lập', data.dataPhuLuc1, true, 'nội trú', 'ngoại trú', 'Tên bệnh viện');
        drawTable('Phụ lục 2: Kết quả khảo sát hài lòng của các Bệnh viện ngoài công lập', data.dataPhuLuc2, true, 'nội trú', 'ngoại trú', 'Tên bệnh viện');
        drawTable('Phụ lục 3: Kết quả khảo sát hài lòng của các Trạm Y tế', data.dataPhuLuc3, true, 'tiêm\nchủng', 'ngoại\ntrú', 'Xã / Phường');

        doc.save(`Bao_Cao_Khao_Sat_Hai_Long_${monthYearText.replace('/', '_')}.pdf`);
        onSuccess('Đã xuất PDF văn bản hành chính');
    } catch (error) {
        console.error("PDF Error:", error);
        onError('Xuất PDF thất bại');
    } finally {
        setLoading(false);
    }
};
