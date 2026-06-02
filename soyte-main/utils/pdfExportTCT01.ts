import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'
import { TIMES_REGULAR_BASE64, TIMES_BOLD_BASE64 } from '@/utils/pdfFonts'
import { formatDateVN } from '@/utils/dateUtils'

export const exportTCT01ToPDF = async (
    mockData: any,
    dateFilter: { startDate: string, endDate: string },
    setLoading: (val: boolean) => void,
    onSuccess: (msg: string) => void,
    onError: (msg: string) => void
) => {
    setLoading(true);
    try {
        const doc = new jsPDF();

        // Nhúng font hỗ trợ Tiếng Việt
        doc.addFileToVFS('times.ttf', TIMES_REGULAR_BASE64);
        doc.addFont('times.ttf', 'TimesNewRomanRegular', 'normal', 'Identity-H');
        doc.addFileToVFS('timesbd.ttf', TIMES_BOLD_BASE64);
        doc.addFont('timesbd.ttf', 'TimesNewRomanBold', 'normal', 'Identity-H');

        const FONT_REGULAR = 'TimesNewRomanRegular';
        const FONT_BOLD = 'TimesNewRomanBold';

        doc.setFont(FONT_REGULAR);

        let currentY = 20;
        const leftMargin = 15;
        const rightMargin = 15;
        const contentWidth = 210 - leftMargin - rightMargin;

        // 1. HEADER (Quốc hiệu)
        doc.setFontSize(11);
        doc.setFont(FONT_BOLD);
        doc.text("UBND THÀNH PHỐ HÀ NỘI", 50, currentY, { align: "center" });
        doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 150, currentY, { align: "center" });
        currentY += 5;
        doc.text("TỔ CÔNG TÁC SỐ 01", 50, currentY, { align: "center" });
        doc.text("Độc lập - Tự do - Hạnh phúc", 150, currentY, { align: "center" });
        currentY += 6;

        doc.setFont(FONT_REGULAR);
        const now = new Date();
        doc.text(`Hà Nội, ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(now.getMonth() + 1).padStart(2, '0')} năm ${now.getFullYear()}`, 150, currentY, { align: "center" });
        currentY += 15;

        // 2. TIÊU ĐỀ
        doc.setFontSize(14);
        doc.setFont(FONT_BOLD);
        doc.text("BÁO CÁO", 105, currentY, { align: "center" });
        currentY += 8;

        const titleText = "Kết quả thực hiện của Tổ công tác số 01 về khắc phục các tồn tại, hạn chế mang tính phổ thông năm 2026";
        const titleLines = doc.splitTextToSize(titleText, 160);
        doc.text(titleLines, 105, currentY, { align: "center" });
        currentY += (titleLines.length * 6) + 2;

        doc.setFontSize(12);
        doc.setFont(FONT_REGULAR);
        doc.text(`(Kỳ báo cáo từ ngày ${formatDateVN(dateFilter.startDate)} đến ngày ${formatDateVN(dateFilter.endDate)})`, 105, currentY, { align: "center" });
        currentY += 12;

        const printPara = (text: string, options: any = {}) => {
            const { indent = leftMargin, maxWidth = contentWidth, fontStyle = 'normal', fontSize = 12, spacing = 6, align = 'left' } = options;
            doc.setFont(fontStyle === 'bold' ? FONT_BOLD : FONT_REGULAR);
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(text, maxWidth);

            lines.forEach((line: string) => {
                if (currentY > 280) {
                    doc.addPage();
                    currentY = 20;
                }
                doc.text(line, indent, currentY, { align: align });
                currentY += spacing;
            });
        };

        // 3. NỘI DUNG MỞ ĐẦU
        printPara("Thực hiện Chương trình hành động số 06-CTr/TU ngày 12/01/2026 của Ban Thường vụ Thành ủy về thực hiện Nghị quyết số 72-NQ/TW ngày 09/9/2025 của Bộ Chính trị về một số giải pháp đột phá, tăng cường bảo vệ, chăm sóc và nâng cao sức khỏe Nhân dân;");
        printPara("Quyết định số 543/QĐ-UBND ngày 04/02/2026 của UBND thành phố Hà Nội về thành lập các Tổ công tác triển khai thực hiện Chương trình hành động số 06-Ctr/TU ngày 12/01/2026 của Ban Thường vụ Thành uỷ về thực hiện Nghị quyết 72-NQ/TW ngày 09/9/2025 của Bộ Chính trị về một số giải pháp đột phá, tăng cường bảo vệ, chăm sóc và nâng cao sức khoẻ nhân dân;");
        printPara("Kế hoạch số 71/KH-UBND ngày 26/02/2026 của UBND thành phố Hà Nội về thực hiện Chương trình hành động số 06-CTr/TU ngày 12/01/2026 của Ban Thường vụ Thành ủy thực hiện Nghị quyết số 72-NQ/TW ngày 09/9/2025 của Bộ Chính trị về một số giải pháp đột phá, tăng cường bảo vệ, chăm sóc và nâng cao sức khỏe Nhân dân, Tổ công tác số 01 về khắc phục các tồn tại, hạn chế mang tính phổ thông (Tổ công tác) đã thực hiện được các công tác như sau:");

        // 4. PHẦN 1
        currentY += 4;
        printPara("1. Công tác triển khai, hướng dẫn", { fontStyle: 'bold' });
        printPara("Phòng Kiểm tra lĩnh vực Y tế đã tham mưu Giám đốc Sở Y tế - Tổ Trưởng tổ công tác ban hành Kế hoạch số 1749/KH-SYT ngày 03/3/2026 (Kèm theo đề cương và 03 phụ lục kiểm tra về việc khắc phục tồn tại, hạn chế mang tính phổ thông năm 2026) kiểm tra việc thực hiện khắc phục các tồn tại, hạn chế mang tính phổ thông theo Chương trình hành động số 06-CTr/TU ngày 12/01/2026 của Ban Thường vụ Thành ủy thực hiện Nghị quyết số 72-NQ/TW ngày 09/9/2025 của Bộ Chính trị tại các cơ sở y tế, đơn vị trợ giúp xã hội trực thuộc và trạm y tế xã, phường.");

        // 5. PHẦN 2
        currentY += 4;
        printPara("2. Kết quả tiếp nhận báo cáo của các đơn vị", { fontStyle: 'bold' });
        printPara(`(từ ngày ${formatDateVN(dateFilter.startDate)} đến ngày ${formatDateVN(dateFilter.endDate)}).`, { fontStyle: 'normal' });

        const blocks = [
            { id: '2.1', key: 'benhVien', title: 'Khối các bệnh viện trực thuộc' },
            { id: '2.2', key: 'troGiupXaHoi', title: 'Các đơn vị trợ giúp xã hội trực thuộc' },
            { id: '2.3', key: 'tramYTe', title: 'Các trạm y tế xã, phường' }
        ];

        blocks.forEach((khoi) => {
            const data = mockData[khoi.key as keyof typeof mockData] as any;

            printPara(`${khoi.id}. Kết quả triển khai thực hiện báo cáo của ${khoi.title.toLowerCase()}`, { fontStyle: 'bold' });
            printPara(`${khoi.id}.1. Kết quả tiếp nhận báo cáo`, { fontStyle: 'bold', indent: leftMargin + 5 });
            printPara(`Tổng số: ${data.tongSo} đơn vị.`, { indent: leftMargin + 5 });

            autoTable(doc, {
                startY: currentY,
                head: [['STT', 'Nội dung', 'Số lượng', 'Tỷ lệ']],
                body: (data.tiepNhan || []).map((item: any) => [item.stt, item.noiDung, item.soLuong, item.tyLe]),
                theme: 'grid',
                styles: { font: FONT_REGULAR, fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
                headStyles: { font: FONT_BOLD, fontStyle: 'normal', fillColor: [240, 240, 240], halign: 'center' },
                columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center', cellWidth: 30 } },
                margin: { left: leftMargin, right: rightMargin }
            });
            currentY = (doc as any).lastAutoTable.finalY + 8;

            printPara(`${khoi.id}.2. Kết quả thực hiện theo đề cương và phụ lục báo cáo`, { fontStyle: 'bold', indent: leftMargin + 5 });
            const reportedNum = (data.tiepNhan && data.tiepNhan.length > 0) ? data.tiepNhan[0].soLuong : 0;
            printPara(`(Chỉ phân tích trên ${reportedNum} đơn vị báo cáo)`, { fontStyle: 'normal', indent: leftMargin + 5 });

            autoTable(doc, {
                startY: currentY,
                head: [['STT', 'Nội dung', 'Số lượng', 'Tỷ lệ']],
                body: (data.deCuong || []).map((item: any) => [item.stt, item.noiDung, item.soLuong, item.tyLe]),
                theme: 'grid',
                styles: { font: FONT_REGULAR, fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
                headStyles: { font: FONT_BOLD, fontStyle: 'normal', fillColor: [240, 240, 240], halign: 'center' },
                columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center', cellWidth: 30 } },
                margin: { left: leftMargin, right: rightMargin }
            });
            currentY = (doc as any).lastAutoTable.finalY + 8;
        });

        // 6. PHẦN 3
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        printPara("3. Công tác thực hiện của các phòng", { fontStyle: 'bold' });
        printPara("Phòng Kế hoạch - Tài chính", { fontStyle: 'bold', indent: leftMargin + 5 });
        printPara("Đã tham mưu lãnh đạo Sở Y tế các văn bản gửi UBND Thành phố:", { indent: leftMargin + 5 });
        printPara("- Văn bản số 2040/SYT-KHTC ngày 12/3/2026 về việc rà soát, hoàn thiện dự thảo văn bản chỉ đạo của UBND Thành phố để tổ chức triển khai khắc phục các tồn tại, hạn chế mang tính phổ thông theo Chương trình số 06-CTr/TU ngày 12/01/2026 của Ban Thường vụ Thành ủy.", { indent: leftMargin + 10, maxWidth: contentWidth - 10 });
        printPara("- Văn bản số 2254/SYT-KHTC ngày 18/3/2026 về danh mục dự án đầu tư công trung hạn giai đoạn 2026-2030 thực hiện Nghị quyết số 72-NQ/TW ngày 09/9/2025 của Bộ Chính trị.", { indent: leftMargin + 10, maxWidth: contentWidth - 10 });

        currentY += 2;
        printPara("Phòng Nghiệp vụ Y", { fontStyle: 'bold', indent: leftMargin + 5 });
        printPara("Đã tham mưu lãnh đạo Sở Y tế ban hành các văn bản:", { indent: leftMargin + 5 });
        printPara("- Văn bản số 2061/SYT-NVY ngày 12/3/2026 về việc thực hiện các chỉ đạo của Sở Y tế theo nhiệm vụ của chương trình số 06-CTrTU ngày 12/01/2026 của Thành Uỷ Hà Nội.", { indent: leftMargin + 10, maxWidth: contentWidth - 10 });
        printPara("- Báo cáo 2217/BC-SYT ngày 17/3/2026 báo cáo khảo sát đánh giá sự hài lòng của người bệnh nội trú, ngoại trú và người dân sử dụng dịch vụ tiêm chủng mở rộng tháng 2 năm 2026.", { indent: leftMargin + 10, maxWidth: contentWidth - 10 });
        printPara("- Kế hoạch số 2336/KH-SYT ngày 19/3/2026 về việc thực hiện cơ sở y tế sáng – xanh – sạch – đẹp và giảm thiểu chất thải nhựa của Ngành Y tế Hà Nội năm 2026.", { indent: leftMargin + 10, maxWidth: contentWidth - 10 });

        currentY += 2;
        printPara("Phòng Tổ chức cán bộ", { fontStyle: 'bold', indent: leftMargin + 5 });
        printPara("Đã tham mưu lãnh đạo Sở Y tế ban hành Công văn số 2296/SYT-TCCB ngày 19/3/2026 đôn đốc việc khắc phục các tồn tại, hạn chế mang tính chất phổ thông ngành Y tế liên quan đến thực hiện quy tắc ứng xử, thái độ phục vụ của nhân viên y tế.", { indent: leftMargin + 5, maxWidth: contentWidth - 5 });

        // 7. Footer
        currentY += 6;
        printPara(`Trên đây là Báo cáo kết quả thực hiện của Tổ công tác số 01 về việc khắc phục các tồn tại, hạn chế mang tính phổ thông năm 2026 (Kỳ báo cáo từ ngày ${formatDateVN(dateFilter.startDate)} đến ngày ${formatDateVN(dateFilter.endDate)}).`);
        printPara("Tổ công tác số 01 kính báo cáo./.", { fontStyle: 'bold' });

        if (currentY > 230) { doc.addPage(); currentY = 20; }
        currentY += 10;
        doc.setFont(FONT_REGULAR);
        doc.setFontSize(11);
        doc.text("Nơi nhận:", leftMargin, currentY);
        doc.text("- Ban điều hành;", leftMargin, currentY + 5);
        doc.text("- Các thành viên Tổ công tác;", leftMargin, currentY + 10);
        doc.text("- Sở Y tế;", leftMargin, currentY + 15);
        doc.text("- Phòng KH-TC;", leftMargin, currentY + 20);
        doc.text("- Lưu: Tổ công tác.", leftMargin, currentY + 25);

        doc.setFont(FONT_BOLD);
        doc.setFontSize(12);
        doc.text("TỔ TRƯỞNG", 150, currentY, { align: "center" });

        // Tự động chuyển trang nếu không đủ chỗ cho tiêu đề Phụ lục
        currentY += 60; // Tăng khoảng cách sau chữ ký
        if (currentY > 260) {
            doc.addPage();
            currentY = 25;
        }

        // 8. PHỤ LỤC (Danh sách đơn vị đã gửi báo cáo)
        doc.addPage();
        currentY = 25;
        doc.setFont(FONT_BOLD);
        doc.setFontSize(14);
        doc.text("PHỤ LỤC 1", 105, currentY, { align: "center" });
        currentY += 9;
        doc.setFontSize(12);
        doc.text("DANH SÁCH CÁC ĐƠN VỊ ĐÃ THỰC HIỆN BÁO CÁO", 105, currentY, { align: "center" });

        const romanNums = ["I", "II", "III", "IV", "V"];
        const appendixBody: any[] = [];
        
        const categoriesData = [
            { key: 'benhVien', nhom: 'Khối Bệnh viện' },
            { key: 'troGiupXaHoi', nhom: 'Khối cơ sở trợ giúp xã hội' },
            { key: 'tramYTe', nhom: 'Khối Trạm y tế xã, phường, thị trấn' }
        ];

        categoriesData.forEach((cat, index) => {
            const groupData = mockData[cat.key as keyof typeof mockData] as any;
            appendixBody.push([
                { content: romanNums[index], styles: { font: FONT_BOLD, fontStyle: 'normal', halign: 'center', fillColor: [240, 240, 240] } },
                { content: cat.nhom.toUpperCase(), styles: { font: FONT_BOLD, fontStyle: 'normal', fillColor: [240, 240, 240] } }
            ]);

            if (groupData && groupData.danhSach && groupData.danhSach.length > 0) {
                groupData.danhSach.forEach((ten: string, i: number) => {
                    appendixBody.push([{ content: i + 1, styles: { halign: 'center' } }, ten]);
                });
            } else {
                appendixBody.push([{ content: '-', styles: { halign: 'center' } }, '(Không có dữ liệu)']);
            }
        });

        currentY += 7;
        autoTable(doc, {
            startY: currentY,
            head: [['STT', 'Tên đơn vị']],
            body: appendixBody,
            theme: 'grid',
            styles: { font: FONT_REGULAR, fontSize: 11, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
            headStyles: { font: FONT_BOLD, fontStyle: 'normal', fillColor: [230, 230, 230], halign: 'center' },
            columnStyles: { 0: { halign: 'center', cellWidth: 20 } },
            margin: { left: leftMargin, right: rightMargin }
        });

        doc.save(`Bao_Cao_TCT01_${dateFilter.startDate}_den_${dateFilter.endDate}.pdf`);
        onSuccess('Đã xuất file PDF thành công');
    } catch (error) {
        console.error(error);
        onError('Lỗi xuất file PDF');
    } finally {
        setLoading(false);
    }
};
