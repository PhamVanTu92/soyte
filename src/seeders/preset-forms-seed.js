/**
 * preset-forms-seed.js
 *
 * Tạo 3 biểu mẫu chuẩn BYT vào bảng chuẩn hóa:
 *   forms → form_sections → form_questions → form_options
 *
 * Mẫu 1: Phiếu KSHL người bệnh nội trú        (BYT - Mẫu số 1)
 * Mẫu 2: Phiếu KSHL người bệnh ngoại trú      (BYT - Mẫu số 2)
 * Mẫu 3: Phiếu KSHL dịch vụ tiêm chủng mở rộng (BYT - Mẫu số 3)
 * Mẫu 4: Biểu mẫu trống (blank)
 *
 * Chạy: node src/seeders/preset-forms-seed.js
 * An toàn: bỏ qua form đã tồn tại (check theo name + type)
 */

'use strict';

require('dotenv').config();
process.env.DB_DIALECT = process.env.DB_DIALECT || 'postgres';

const db = require('../models');

/* ── Likert options mặc định BYT ─────────────────────────────── */
const LIKERT_OPTS = [
  { option_key: '1', label: 'Rất không hài lòng',               order_index: 0 },
  { option_key: '2', label: 'Không hài lòng',                    order_index: 1 },
  { option_key: '3', label: 'Bình thường',                        order_index: 2 },
  { option_key: '4', label: 'Hài lòng',                           order_index: 3 },
  { option_key: '5', label: 'Rất hài lòng',                       order_index: 4 },
  { option_key: '0', label: 'Không sử dụng / Không có ý kiến',   order_index: 5 },
];

const lk = (key, label) => ({
  question_key: key, type: 'likert', label, required: false, score_weight: 1.0,
  options: LIKERT_OPTS.map(o => ({ ...o })),
});

/* ═══════════════════════════════════════════════════════════════
   MẪU SỐ 1 — NỘI TRÚ
═══════════════════════════════════════════════════════════════ */
const FORM_NOI_TRU = {
  name:        'Phiếu khảo sát sự hài lòng người bệnh nội trú',
  org:         'Bộ Y tế',
  badge:       'MẪU SỐ 1',
  description: 'Nhằm nâng cao chất lượng khám, chữa bệnh, hướng tới sự hài lòng người bệnh, chúng tôi tiến hành khảo sát về mức độ hài lòng của Ông/Bà. Ý kiến của Ông/Bà sẽ giúp bệnh viện từng bước cải tiến chất lượng. Các thông tin sẽ được bảo mật và không ảnh hưởng đến việc điều trị của Ông/Bà. Xin trân trọng cảm ơn!',
  type:        'evaluate',
  status:      'active',
  sections: [
    {
      title: 'A. Khả năng tiếp cận',
      order_index: 0,
      questions: [
        lk('A1', 'A1. Các sơ đồ, biển báo chỉ dẫn đường đến các khoa, phòng và thông báo giờ khám, chữa bệnh, giờ vào thăm rõ ràng, dễ hiểu.'),
        lk('A2', 'A2. Các tòa nhà, cầu thang bộ, thang máy, buồng bệnh được đánh số và hướng dẫn rõ ràng, dễ tìm.'),
        lk('A3', 'A3. Các lối đi trong bệnh viện, hành lang bằng phẳng, an toàn, dễ đi.'),
        lk('A4', 'A4. Thời gian chờ đợi thang máy, làm thủ tục và chờ đợi trong quá trình khám, chữa bệnh chấp nhận được.'),
        lk('A5', 'A5. Người bệnh hỏi và gọi được nhân viên y tế khi cần thiết.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'B. Sự minh bạch thông tin và thủ tục khám bệnh, điều trị',
      order_index: 1,
      questions: [
        lk('B1', 'B1. Quy trình, thủ tục hành chính (nhập, xuất viện, chuyển viện, chuyển khoa…) rõ ràng, công khai, thuận tiện.'),
        lk('B2', 'B2. Giá dịch vụ y tế được niêm yết, thông báo công khai ở vị trí dễ quan sát, dễ đọc, dễ hiểu và được tư vấn, giải thích các chi phí cao nếu có.'),
        lk('B3', 'B3. Quy trình, thời gian làm thủ tục thanh toán viện phí khi ra viện rõ ràng, công khai, thuận tiện.'),
        lk('B4', 'B4. Được phổ biến về nội quy và những thông tin cần thiết khi nằm viện rõ ràng, đầy đủ.'),
        lk('B5', 'B5. Được giải thích về tình trạng bệnh, phương pháp và thời gian dự kiến điều trị rõ ràng, đầy đủ.'),
        lk('B6', 'B6. Được giải thích, tư vấn trước khi yêu cầu làm các xét nghiệm, thăm dò, kỹ thuật cao rõ ràng, đầy đủ.'),
        lk('B7', 'B7. Được công khai và cập nhật thông tin về dùng thuốc và chi phí điều trị.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'C. Cơ sở vật chất và phương tiện phục vụ người bệnh',
      order_index: 2,
      questions: [
        lk('C1',  'C1. Buồng bệnh khang trang, sạch sẽ, có đầy đủ các thiết bị điều chỉnh nhiệt độ phù hợp như quạt, máy sưởi hoặc điều hòa.'),
        lk('C2',  'C2. Buồng bệnh yên tĩnh, bảo đảm an toàn, an ninh, trật tự, phòng ngừa trộm cắp, yên tâm khi nằm viện.'),
        lk('C3',  'C3. Giường bệnh, ga, gối đầy đủ cho mỗi người một giường, chắc chắn, sử dụng tốt.'),
        lk('C4',  'C4. Được cung cấp quần áo đầy đủ, sạch sẽ.'),
        lk('C5',  'C5. Nhà vệ sinh, nhà tắm thuận tiện, sạch sẽ, sử dụng tốt.'),
        lk('C6',  'C6. Được cung cấp đầy đủ nước uống nóng, lạnh ngay tại khoa điều trị.'),
        lk('C7',  'C7. Người bệnh và người nhà người bệnh truy cập được mạng internet không dây (wifi) ngay tại buồng bệnh.'),
        lk('C8',  'C8. Được bảo đảm sự riêng tư khi nằm viện như thay quần áo, khám bệnh, đi vệ sinh tại giường… có rèm che, vách ngăn hoặc nằm riêng.'),
        lk('C9',  'C9. Căng-tin bệnh viện phục vụ ăn uống và nhu cầu sinh hoạt thiết yếu đầy đủ và chất lượng.'),
        lk('C10', 'C10. Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp.'),
        lk('C11', 'C11. Được cung cấp phương tiện vận chuyển nội viện như xe lăn, cáng, xe điện đầy đủ, kịp thời, sử dụng tốt khi có nhu cầu.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'D. Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế',
      order_index: 3,
      questions: [
        lk('D1', 'D1. Bác sỹ, điều dưỡng có lời nói, thái độ, giao tiếp đúng mực.'),
        lk('D2', 'D2. Nhân viên phục vụ (hộ lý, bảo vệ, kế toán…) có lời nói, thái độ, giao tiếp đúng mực.'),
        lk('D3', 'D3. Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ.'),
        lk('D4', 'D4. Bác sỹ, điều dưỡng hợp tác tốt và xử lý công việc thành thạo, kịp thời.'),
        lk('D5', 'D5. Được bác sỹ thăm khám, động viên tại phòng điều trị.'),
        lk('D6', 'D6. Được tư vấn chế độ ăn, vận động, theo dõi và phòng ngừa biến chứng.'),
        lk('D7', 'D7. Không bị nhân viên y tế gợi ý bồi dưỡng.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'E. Kết quả cung cấp dịch vụ',
      order_index: 4,
      questions: [
        lk('E1', 'E1. Thời gian chờ đợi khi khám, chữa bệnh tại bệnh viện.'),
        lk('E2', 'E2. Được cấp phát thuốc đúng giờ, hướng dẫn sử dụng thuốc đầy đủ và các tác dụng phụ nếu có.'),
        lk('E3', 'E3. Được nhắc lịch tái khám và hướng dẫn thực hành ăn uống, luyện tập, chăm sóc tại nhà trước khi ra viện.'),
        lk('E4', 'E4. Trang thiết bị, vật tư y tế đầy đủ, hiện đại, đáp ứng nhu cầu khám chữa bệnh.'),
        lk('E5', 'E5. Kết quả điều trị đáp ứng được nguyện vọng.'),
        lk('E6', 'E6. Ông/Bà đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế.'),
        {
          question_key: 'E7', type: 'single', label: 'E7. Ông/Bà cho nhận xét về số tiền chi trả có tương xứng với chất lượng dịch vụ y tế không?',
          required: false, order_index: 6, score_weight: 1.0,
          options: [
            { option_key: '1', label: 'Rất đắt so với chất lượng',                          order_index: 0 },
            { option_key: '2', label: 'Đắt hơn so với chất lượng',                           order_index: 1 },
            { option_key: '3', label: 'Tương xứng so với chất lượng',                        order_index: 2 },
            { option_key: '4', label: 'Rẻ hơn so với chất lượng',                            order_index: 3 },
            { option_key: '5', label: 'Không tự chi trả nên không biết (BHYT/người khác)',   order_index: 4 },
            { option_key: '6', label: 'Ý kiến khác',                                         order_index: 5 },
          ],
        },
      ],
    },
    {
      title: 'G. Thông tin bổ sung',
      order_index: 5,
      questions: [
        {
          question_key: 'G1', type: 'number',
          label: 'G1. Đánh giá chung, bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi của Ông/Bà trước khi nằm viện? (điền số từ 0% đến 100%, hoặc trên 100% nếu bệnh viện vượt mong đợi)',
          required: false, order_index: 0, score_weight: 1.0, options: [],
        },
        {
          question_key: 'G2', type: 'single',
          label: 'G2. Nếu có nhu cầu khám, chữa bệnh, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?',
          required: false, order_index: 1, score_weight: 1.0,
          options: [
            { option_key: '1', label: 'Chắc chắn không bao giờ quay lại',                   order_index: 0 },
            { option_key: '2', label: 'Không muốn quay lại nhưng có ít lựa chọn khác',       order_index: 1 },
            { option_key: '3', label: 'Muốn chuyển sang bệnh viện khác',                     order_index: 2 },
            { option_key: '4', label: 'Có thể sẽ quay lại',                                  order_index: 3 },
            { option_key: '5', label: 'Chắc chắn sẽ quay lại hoặc giới thiệu cho người khác', order_index: 4 },
            { option_key: '6', label: 'Khác',                                                order_index: 5 },
          ],
        },
        {
          question_key: 'G3', type: 'textarea',
          label: 'G3. Đối với các câu hỏi có ý kiến chưa hài lòng, đề nghị Ông/Bà ghi rõ thêm lý do tại sao không hài lòng?',
          required: false, order_index: 2, score_weight: 1.0, options: [],
        },
        {
          question_key: 'G4', type: 'textarea',
          label: 'G4. Ông/Bà có ý kiến hoặc nhận xét gì khác giúp bệnh viện và hệ thống khám, chữa bệnh phục vụ người bệnh được tốt hơn, xin ghi rõ?',
          required: false, order_index: 3, score_weight: 1.0, options: [],
        },
      ],
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   MẪU SỐ 2 — NGOẠI TRÚ
═══════════════════════════════════════════════════════════════ */
const FORM_NGOAI_TRU = {
  name:        'Phiếu khảo sát ý kiến người bệnh ngoại trú',
  org:         'Bộ Y tế',
  badge:       'MẪU SỐ 2',
  description: 'Nhằm nâng cao chất lượng khám, chữa bệnh, hướng tới sự hài lòng người bệnh, chúng tôi tiến hành khảo sát về mức độ hài lòng của Ông/Bà. Các thông tin sẽ được bảo mật và không ảnh hưởng đến việc điều trị của Ông/Bà. Xin trân trọng cảm ơn!',
  type:        'evaluate',
  status:      'active',
  sections: [
    {
      title: 'A. Khả năng tiếp cận',
      order_index: 0,
      questions: [
        lk('A1', 'A1. Các biển báo, chỉ dẫn đường đến bệnh viện rõ ràng, dễ nhìn, dễ tìm.'),
        lk('A2', 'A2. Các sơ đồ, biển báo chỉ dẫn đường đến các khoa, phòng trong bệnh viện rõ ràng, dễ hiểu, dễ tìm.'),
        lk('A3', 'A3. Các khối nhà, cầu thang được đánh số rõ ràng, dễ tìm.'),
        lk('A4', 'A4. Các lối đi trong bệnh viện, hành lang bằng phẳng, dễ đi.'),
        lk('A5', 'A5. Có thể tìm hiểu các thông tin và đăng ký khám qua điện thoại, trang tin điện tử của bệnh viện (website) thuận tiện.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'B. Sự minh bạch thông tin và thủ tục khám bệnh, điều trị',
      order_index: 1,
      questions: [
        lk('B1',  'B1. Quy trình khám bệnh được niêm yết rõ ràng, công khai, dễ hiểu.'),
        lk('B2',  'B2. Các quy trình, thủ tục khám bệnh đơn giản, thuận tiện.'),
        lk('B3',  'B3. Giá dịch vụ y tế niêm yết rõ ràng, công khai.'),
        lk('B4',  'B4. Nhân viên y tế tiếp đón, hướng dẫn người bệnh làm các thủ tục niềm nở, tận tình.'),
        lk('B5',  'B5. Được xếp hàng theo thứ tự trước sau khi làm các thủ tục đăng ký, nộp tiền, khám bệnh, xét nghiệm, chiếu chụp.'),
        lk('B6',  'B6. Đánh giá thời gian chờ đợi làm thủ tục đăng ký khám.'),
        lk('B7',  'B7. Đánh giá thời gian chờ tới lượt bác sỹ khám.'),
        lk('B8',  'B8. Đánh giá thời gian được bác sỹ khám và tư vấn.'),
        lk('B9',  'B9. Đánh giá thời gian chờ làm xét nghiệm, chiếu chụp.'),
        lk('B10', 'B10. Đánh giá thời gian chờ nhận kết quả xét nghiệm, chiếu chụp.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'C. Cơ sở vật chất và phương tiện phục vụ người bệnh',
      order_index: 2,
      questions: [
        lk('C1', 'C1. Có phòng/sảnh chờ khám sạch sẽ, thoáng mát vào mùa hè; kín gió và ấm áp vào mùa đông.'),
        lk('C2', 'C2. Phòng chờ có đủ ghế ngồi cho người bệnh và sử dụng tốt.'),
        lk('C3', 'C3. Phòng chờ có quạt (điều hòa) đầy đủ, hoạt động thường xuyên.'),
        lk('C4', 'C4. Phòng chờ có các phương tiện giúp người bệnh có tâm lý thoải mái như ti-vi, tranh ảnh, tờ rơi, nước uống...'),
        lk('C5', 'C5. Được bảo đảm sự riêng tư khi khám bệnh, chiếu chụp, làm thủ thuật.'),
        lk('C6', 'C6. Nhà vệ sinh thuận tiện, sử dụng tốt, sạch sẽ.'),
        lk('C7', 'C7. Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp.'),
        lk('C8', 'C8. Khu khám bệnh bảo đảm an ninh, trật tự, phòng ngừa trộm cắp cho người dân.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'D. Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế',
      order_index: 3,
      questions: [
        lk('D1', 'D1. Nhân viên y tế (bác sỹ, điều dưỡng) có lời nói, thái độ, giao tiếp đúng mực.'),
        lk('D2', 'D2. Nhân viên phục vụ (hộ lý, bảo vệ, kế toán…) có lời nói, thái độ, giao tiếp đúng mực.'),
        lk('D3', 'D3. Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ.'),
        lk('D4', 'D4. Năng lực chuyên môn của bác sỹ, điều dưỡng đáp ứng mong đợi.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'E. Kết quả cung cấp dịch vụ',
      order_index: 4,
      questions: [
        lk('E1', 'E1. Kết quả khám bệnh đã đáp ứng được nguyện vọng.'),
        lk('E2', 'E2. Các hóa đơn, phiếu thu, đơn thuốc, kết quả xét nghiệm được cung cấp đầy đủ, rõ ràng.'),
        lk('E3', 'E3. Đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế.'),
        lk('E4', 'E4. Đánh giá mức độ hài lòng về giá cả dịch vụ y tế.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'G. Thông tin bổ sung',
      order_index: 5,
      questions: [
        {
          question_key: 'G1', type: 'number',
          label: 'G1. Bệnh viện đáp ứng được bao nhiêu % so với mong đợi của Ông/Bà? (0–100%)',
          required: false, order_index: 0, score_weight: 1.0, options: [],
        },
        {
          question_key: 'G2', type: 'textarea',
          label: 'G2. Ý kiến/nhận xét khác giúp bệnh viện phục vụ người bệnh tốt hơn?',
          required: false, order_index: 1, score_weight: 1.0, options: [],
        },
      ],
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   MẪU SỐ 3 — TIÊM CHỦNG MỞ RỘNG
═══════════════════════════════════════════════════════════════ */
const FORM_TIEM_CHUNG = {
  name:        'Phiếu khảo sát sự hài lòng của người sử dụng dịch vụ tiêm chủng mở rộng',
  org:         'Bộ Y tế',
  badge:       'MẪU SỐ 3',
  description: 'Để nâng cao chất lượng dịch vụ tiêm chủng mở rộng, chúng tôi xin ý kiến của Ông/bà đối với dịch vụ tiêm chủng mà Ông/bà đã trải nghiệm. Ý kiến của Ông/bà sẽ giúp chúng tôi cải thiện chất lượng dịch vụ.',
  type:        'evaluate',
  status:      'active',
  sections: [
    {
      title: 'A. Khả năng tiếp cận',
      order_index: 0,
      questions: [
        lk('A1', 'A1. Ông/Bà dễ dàng tiếp cận với điểm tiêm chủng.'),
        lk('A2', 'A2. Lối đi, hành lang tại địa điểm tiêm chủng bằng phẳng, di chuyển dễ dàng.'),
        lk('A3', 'A3. Các lối đi, hành lang bằng phẳng, an toàn, dễ đi.'),
        lk('A4', 'A4. Hài lòng về thời gian tổ chức tiêm chủng mở rộng.'),
        lk('A5', 'A5. Lịch tiêm chủng, loại vắc xin tiêm chủng được thông báo rộng rãi trên loa truyền thanh hoặc tổ dân phố, nhân viên y tế thôn/khu phố trực tiếp thông báo.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'B. Sự minh bạch thông tin và thủ tục tiêm chủng',
      order_index: 1,
      questions: [
        lk('B1', 'B1. Quy trình, thủ tục hành chính rõ ràng, công khai, thuận tiện.'),
        lk('B2', 'B2. Hài lòng về thời gian chờ tới lượt tiêm chủng.'),
        lk('B3', 'B3. Hài lòng về việc được nhân viên y tế hỏi, khám và ghi chép thông tin về tình trạng sức khỏe, tiền sử dị ứng, tiền sử tiêm chủng.'),
        lk('B4', 'B4. Hài lòng về việc được thông báo về loại vắc xin được tiêm chủng, nước sản xuất, năm sản xuất/hạn sử dụng.'),
        lk('B5', 'B5. Hài lòng về việc được nhân viên y tế thông báo tác dụng, liều lượng, đường dùng của loại vắc xin trước mỗi lần tiêm.'),
        lk('B6', 'B6. Hài lòng về việc được nhân viên y tế thông báo/cho xem hộp/lọ vắc xin còn nguyên niêm phong nhãn mác (đối với lọ vắc xin đóng 01 liều/lọ) hoặc còn đủ số liều trong lọ.'),
        lk('B7', 'B7. Được cung cấp đầy đủ thông tin về vắc xin, lịch tiêm và các khuyến cáo liên quan.'),
        lk('B8', 'B8. Được nhân viên y tế thông báo về các phản ứng có thể gặp sau tiêm chủng và cách xử trí.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'C. Cơ sở vật chất và trang thiết bị tiêm chủng',
      order_index: 2,
      questions: [
        lk('C1',  'C1. Khu vực chờ trước, trong và theo dõi sau tiêm sạch sẽ, thoáng mát vào mùa hè; kín gió và ấm áp vào mùa đông.'),
        lk('C2',  'C2. Hài lòng về khu vực chờ có đủ ghế ngồi.'),
        lk('C3',  'C3. Hài lòng về có khu vực/bàn tư vấn, khám sàng lọc.'),
        lk('C4',  'C4. Hài lòng về có khu vực/bàn tiêm chủng.'),
        lk('C5',  'C5. Hài lòng về có phòng/khu vực theo dõi và xử trí phản ứng sau tiêm chủng.'),
        lk('C6',  'C6. Hài lòng về việc vắc xin được bảo quản lạnh trong buổi tiêm chủng (phích vắc xin, tủ lạnh).'),
        lk('C7',  'C7. Hài lòng về việc được sử dụng bơm kim tiêm riêng cho mỗi mũi tiêm.'),
        lk('C8',  'C8. Hài lòng về việc có hộp chống sốc, phác đồ chống sốc treo tại nơi theo dõi, xử trí phản ứng sau tiêm chủng.'),
        lk('C9',  'C9. Hài lòng về việc có thùng rác chứa chất thải y tế.'),
        lk('C10', 'C10. Hài lòng về nhà vệ sinh thuận tiện, sử dụng tốt, sạch sẽ.'),
        lk('C11', 'C11. Hài lòng về khuôn viên cơ sở tiêm chủng xanh, sạch, đẹp.'),
        lk('C12', 'C12. Hài lòng về đảm bảo trật tự, phòng ngừa trộm cắp tại điểm tiêm chủng.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'D. Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế',
      order_index: 3,
      questions: [
        lk('D1', 'D1. Hài lòng về nhân viên tiếp đón, hướng dẫn thủ tục niềm nở, nhiệt tình.'),
        lk('D2', 'D2. Nhân viên phục vụ có lời nói, thái độ, giao tiếp đúng mực.'),
        lk('D3', 'D3. Hài lòng về nhân viên y tế tư vấn tỉ mỉ, rõ ràng.'),
        lk('D4', 'D4. Hài lòng về việc nhân viên y tế thao tác thành thạo, thuần thục khi thăm khám, tiêm chủng.'),
        lk('D5', 'D5. Hài lòng khi các thắc mắc của người dân (nếu có) được nhân viên y tế giải thích tận tình, thông tin rõ ràng, đầy đủ.'),
      ].map((q, i) => ({ ...q, order_index: i })),
    },
    {
      title: 'E. Kết quả cung cấp dịch vụ',
      order_index: 4,
      questions: [
        lk('E1', 'E1. Hài lòng với chất lượng dịch vụ tiêm chủng được cung cấp.'),
        lk('E2', 'E2. Hài lòng về lần sử dụng dịch vụ tiêm chủng này.'),
        lk('E3', 'E3. Được nhắc lịch cho lần tiêm tiếp theo.'),
        {
          question_key: 'E4', type: 'single',
          label: 'E4. Nếu bản thân hoặc người thân có nhu cầu tiêm chủng, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?',
          required: false, order_index: 3, score_weight: 1.0,
          options: [
            { option_key: '1', label: 'Chắc chắn không bao giờ quay lại',                        order_index: 0 },
            { option_key: '2', label: 'Muốn chuyển sang cơ sở khác',                              order_index: 1 },
            { option_key: '3', label: 'Chắc chắn sẽ quay lại hoặc giới thiệu cho người khác',    order_index: 2 },
            { option_key: '4', label: 'Khác (ghi rõ)',                                            order_index: 3 },
          ],
        },
      ],
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   MẪU 4 — BIỂU MẪU TRỐNG
═══════════════════════════════════════════════════════════════ */
const FORM_BLANK = {
  name:        'Biểu mẫu trống (mẫu khởi tạo)',
  org:         '',
  badge:       '',
  description: 'Biểu mẫu trống để bắt đầu tạo phiếu khảo sát mới từ đầu.',
  type:        'evaluate',
  status:      'active',
  sections: [
    {
      title: 'Phần 1',
      order_index: 0,
      questions: [
        {
          question_key: 'Q1', type: 'text',
          label: 'Câu hỏi mẫu — nhập nội dung câu hỏi vào đây.',
          required: false, order_index: 0, score_weight: 1.0, options: [],
        },
      ],
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   Insert helper
═══════════════════════════════════════════════════════════════ */
async function insertForm(formData) {
  const { sections, ...meta } = formData;
  const t = await db.sequelize.transaction();
  try {
    const form = await db.Form.create(
      { ...meta, data: '{}', info: null },
      { transaction: t },
    );

    for (const sec of sections) {
      const { questions, ...secMeta } = sec;
      const createdSec = await db.FormSection.create(
        { form_id: form.id, ...secMeta },
        { transaction: t },
      );

      for (const q of questions) {
        const { options, ...qMeta } = q;
        const createdQ = await db.FormQuestion.create(
          { section_id: createdSec.id, ...qMeta },
          { transaction: t },
        );

        if (options && options.length > 0) {
          await db.FormOption.bulkCreate(
            options.map(o => ({ question_id: createdQ.id, ...o })),
            { transaction: t, ignoreDuplicates: true },
          );
        }
      }
    }

    await t.commit();
    return form;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

/* ═══════════════════════════════════════════════════════════════
   Main
═══════════════════════════════════════════════════════════════ */
async function main() {
  try {
    await db.sequelize.authenticate();
    console.log('[seed] DB connected');

    const FORMS = [FORM_NOI_TRU, FORM_NGOAI_TRU, FORM_TIEM_CHUNG, FORM_BLANK];
    let inserted = 0;
    let skipped  = 0;

    for (const formData of FORMS) {
      const exists = await db.Form.findOne({
        where: { name: formData.name, type: formData.type },
      });

      if (exists) {
        console.log(`  [skip] "${formData.name}" — đã tồn tại (id=${exists.id})`);
        skipped++;
        continue;
      }

      const form = await insertForm(formData);
      const secCount = formData.sections.length;
      const qCount   = formData.sections.reduce((a, s) => a + s.questions.length, 0);
      console.log(`  [ok]   "${formData.name}" → id=${form.id} | ${secCount} phần | ${qCount} câu hỏi`);
      inserted++;
    }

    console.log(`\n[seed] Hoàn thành. Đã tạo: ${inserted} | Bỏ qua: ${skipped}`);
  } catch (err) {
    console.error('[seed] Lỗi:', err.message);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

main();
