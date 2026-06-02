# Kế hoạch remap UI phần Phản hồi và Đánh giá theo API mới

## Mục tiêu

- Chuẩn hóa dữ liệu trả về từ nhóm API `/api/feedbacks*` trước khi bind vào UI.
- Loại bỏ kiểu xử lý "đoán schema" đang nằm rải rác trong `hooks` và `components`.
- Tách rõ 2 lớp:
  - `service/adapter`: đọc response mới và normalize.
  - `UI`: chỉ render theo model nội bộ ổn định.

## API mới cần cover

- `GET /api/feedbacks`
- `POST /api/feedbacks/list`
- `GET /api/feedbacks/stats`
- `POST /api/feedbacks/stats`
- `GET /api/feedbacks/compare`
- `POST /api/feedbacks/compare`
- `GET /api/feedbacks/check-unit`
- `GET /api/feedbacks/{id}`
- `POST /api/feedbacks`
- `DELETE /api/feedbacks/{id}`

## Chênh lệch hiện tại trong code

### 1. Tầng gọi API đang chưa bám đúng docs mới

- [services/feedBacksSevice.ts](/abs/path/d:/Project/ok/soyte/services/feedBacksSevice.ts:1) đang gửi `unit`, trong khi docs mới đang thể hiện `unit_id`.
- `check-unit` ở [components/formDetail/SurveyInfo.tsx](/abs/path/d:/Project/ok/soyte/components/formDetail/SurveyInfo.tsx:303) đang gửi thêm `form_id`; docs ảnh chụp hiện chỉ thể hiện `unit_id`, `type`, `survey_key`.
- `stats` và `compare` có `report_type` ở docs mới, nhưng UI hiện chưa truyền tham số này.

### 2. UI đang phụ thuộc trực tiếp vào schema backend cũ

- [hooks/useFeedbacks.ts](/abs/path/d:/Project/ok/soyte/hooks/useFeedbacks.ts:16) unwrap response theo nhiều nhánh `response.data`, `data.items`, `data.data.items`, `Array.isArray(data)`.
- [components/feedbacks/FeedbackDetailsDialog.tsx](/abs/path/d:/Project/ok/soyte/components/feedbacks/FeedbackDetailsDialog.tsx:169) giả định chi tiết luôn có `sections[].option[]`.
- `reflect` đang giả định item con có `tiendo`, `danhgia`, `ghichu`, `content`, `method`, `productOut`.
- `evaluate` đang giả định item con có `answerType`, `answerValue`, `ratingVote.value`.
- [hooks/useFeedbackStats.ts](/abs/path/d:/Project/ok/soyte/hooks/useFeedbackStats.ts:12) đang assume stats về đúng `DashboardStats` cũ.

### 3. Vùng rủi ro cao

- `GET detail` có thể đã đổi từ `sections` sang `submission_data`.
- `stats` có thể đổi tên field tổng hợp cho `reflect` và `evaluate`.
- `compare` đang chưa có tầng map riêng, nhưng phần report có thể dùng để thay thế tính toán local.
- `check-unit` hiện đang suy luận kết quả từ `message`; cần chuyển sang boolean chuẩn nếu API mới có field rõ ràng.

## Kế hoạch triển khai

### Giai đoạn 1: Chụp response thật

- Dùng script `scripts/inspect_feedback_apis.mjs` để gọi từng endpoint an toàn.
- Mặc định chỉ gọi các endpoint read-only.
- Lưu raw response + shape summary ra file JSON để team cùng đối chiếu.
- Xác nhận chính xác các điểm sau:
  - tên field phân trang
  - tên field detail
  - tên field stats/compare
  - quy ước `unit` hay `unit_id`
  - `check-unit` trả boolean ở field nào

### Giai đoạn 2: Tạo lớp normalize

- Thêm file mới: `services/feedbackAdapters.ts`
- Tạo các hàm:
  - `extractFeedbackListResponse`
  - `normalizeFeedbackListItem`
  - `normalizeFeedbackDetail`
  - `normalizeFeedbackStats`
  - `normalizeFeedbackCompare`
  - `normalizeCheckUnitResult`

Mục tiêu của model normalize:

- List item luôn có:
  - `id`
  - `type`
  - `submittedAt`
  - `creatorName`
  - `unitId`
  - `unitType`
  - `surveyKey`
  - `info`
- Detail luôn có:
  - `id`
  - `meta`
  - `infoEntries`
  - `sections`
  - `raw`
- Stats luôn map về đúng `DashboardStats` nội bộ để chart không phải biết schema backend.

### Giai đoạn 3: Nối lại UI

#### A. Danh sách feedback

- Sửa [hooks/useFeedbacks.ts](/abs/path/d:/Project/ok/soyte/hooks/useFeedbacks.ts:16) để:
  - gọi service
  - normalize list response
  - chỉ trả `FeedbackListItem[]` đã sạch
- Sửa [components/feedbacks/FeedbackDataTable.tsx](/abs/path/d:/Project/ok/soyte/components/feedbacks/FeedbackDataTable.tsx:1) để dùng field chuẩn thay vì fallback nhiều lớp.

#### B. Chi tiết feedback

- Sửa `viewDetails` trong [hooks/useFeedbacks.ts](/abs/path/d:/Project/ok/soyte/hooks/useFeedbacks.ts:49) để normalize detail ngay sau khi fetch.
- Sửa [components/feedbacks/FeedbackDetailsDialog.tsx](/abs/path/d:/Project/ok/soyte/components/feedbacks/FeedbackDetailsDialog.tsx:1):
  - render từ model `sections` chuẩn hóa
  - tách mapper cho `reflect` và `evaluate`
  - giữ fallback hiển thị raw khi API mới thiếu field

#### C. Thống kê feedback

- Sửa [hooks/useFeedbackStats.ts](/abs/path/d:/Project/ok/soyte/hooks/useFeedbackStats.ts:12) để normalize stats trước khi set state.
- Nếu `report_type` ảnh hưởng shape response:
  - thêm control chọn report type ở filter
  - truyền xuống `fetchStats` và `fetchCompare`

#### D. Check đơn vị đã nộp

- Sửa [components/formDetail/SurveyInfo.tsx](/abs/path/d:/Project/ok/soyte/components/formDetail/SurveyInfo.tsx:303):
  - dùng adapter `normalizeCheckUnitResult`
  - bỏ suy luận từ `message` nếu API mới đã có boolean rõ ràng
  - xác nhận lại có cần `form_id` hay không

#### E. Compare cho report

- Rà lại các màn report đang tự tính từ danh sách feedback:
  - [components/report/ReportTabContent.tsx](/abs/path/d:/Project/ok/soyte/components/report/ReportTabContent.tsx:1)
  - [pages/report/Report_DCBC.tsx](/abs/path/d:/Project/ok/soyte/pages/report/Report_DCBC.tsx:1)
  - [pages/report/Report_TCT01.tsx](/abs/path/d:/Project/ok/soyte/pages/report/Report_TCT01.tsx:1)
- Nếu API `compare` trả đủ dữ liệu, ưu tiên dùng server-side aggregate thay vì tiếp tục tự tính trên FE.

## Thứ tự làm đề xuất

1. Chạy script lấy mẫu response thật cho `list`, `stats`, `compare`, `check-unit`, `detail`.
2. Chốt bảng mapping field mới -> model UI nội bộ.
3. Viết adapter/normalizer.
4. Cập nhật `useFeedbacks` và `useFeedbackStats`.
5. Sửa `FeedbackDetailsDialog` theo model normalize.
6. Rà lại `SurveyInfo` và các màn report.
7. Test lại 2 luồng `reflect` và `evaluate`.

## Tiêu chí hoàn thành

- UI không còn đọc trực tiếp field raw từ backend ở nhiều nơi.
- Mỗi endpoint mới có ít nhất 1 shape sample thực tế.
- Đổi schema backend không làm vỡ table/chart/dialog nếu adapter vẫn giữ contract nội bộ.
- `reflect` và `evaluate` đều render đúng ở:
  - danh sách
  - chi tiết
  - thống kê
  - kiểm tra đơn vị đã nộp
