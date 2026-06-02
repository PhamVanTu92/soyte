<div align="center"> 
  
  # 🏥 Cổng Thông Tin & Quản Trị - Sở Y Tế Hà Nội
  
  **Giải pháp quản lý y tế hiện đại, trực quan và hiệu quả.**
  **Author : An Tú**
</div>

---

## 🌟 Giới thiệu tổng quan

Dự án **Sở Y tế Hà Nội - Cổng thông tin** là một ứng dụng web quản trị đa năng, được thiết kế để hỗ trợ việc quản lý, tra cứu và điều phối các hoạt động y tế trên địa bàn thành phố. Hệ thống cung cấp giao diện hiện đại, tối ưu hóa trải nghiệm người dùng (UX/UI) và khả năng xử lý dữ liệu mạnh mẽ.

## ✨ Tính năng chính

### 🛡️ Khu vực Quản trị (Admin)
- **Dashboard thông thái**: Biểu đồ thống kê trực quan về bài viết, người dùng và các chỉ số y tế.
- **Quản lý Cơ sở Y tế (CSYT)**:
  - Thống kê chi tiết theo loại hình (Bệnh viện, Trạm y tế, Chi cục...).
  - **Bộ lọc tương tác (Interactive Filters)**: Lọc dữ liệu ngay lập tức bằng cách click vào các thẻ thống kê.
  - Phân trang Client-side mượt mà, tìm kiếm nhanh trên hàng nghìn bản ghi.
- **Quản lý Tin tức**: Hệ thống CMS biên tập nội dung y tế chuyên nghiệp.
- **Quản lý Người dùng**: Phân quyền và điều hành danh sách tài khoản.

### 🏥 Dịch vụ & Tra cứu
- **Hồ sơ sức khỏe**: Quản lý và theo dõi thông tin sức khỏe cá nhân.
- **Tra cứu dữ liệu**: Hệ thống tìm kiếm thông tin y tế tập trung.
- **Trung tâm cấp cứu**: Điều phối và thông tin khẩn cấp.
- **Lịch công tác**: Quản lý lịch làm việc của cán bộ y tế.

## 🛠️ Công nghệ sử dụng

Hệ thống được xây dựng trên nền tảng các công nghệ tiên tiến nhất hiện nay:

- **Frontend Core**: [React 18](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **UI Framework**: [PrimeReact](https://primereact.org/) & [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Bản đồ**: [Leaflet](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/)
- **Biểu đồ**: [Chart.js](https://www.chartjs.org/) & [Recharts](https://recharts.org/)
- **Quản lý trạng thái**: React Context API
- **Xử lý Thời gian**: [date-fns](https://date-fns.org/)

## 📂 Cấu trúc thư mục

```bash
├── public/          # Tài nguyên tĩnh
├── src/
│   ├── api/         # Cấu hình API client (axios/fetch)
│   ├── components/  # Các component dùng chung (Layout, Sidebar, UI...)
│   ├── pages/       # Các trang chức năng chính (Dashboard, Phòng khám, Tin tức...)
│   ├── services/    # Logic xử lý dữ liệu và Business logic
│   ├── styles/      # Cấu hình CSS Global và Design System
│   ├── types/       # Định nghĩa TypeScript interfaces
│   ├── constants.tsx# Các hằng số và dữ liệu mẫu
│   └── App.tsx      # Entry point và cấu hình Routing
```

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên
- **Package Manager**: `npm` hoặc `pnpm`

### Các bước thực hiện

1. **Clone dự án**:
   ```bash
   git clone [url-du-an]
   cd soyte
   ```

2. **Cài đặt thư viện**:
   ```bash
   npm install
   # hoặc sử dụng pnpm
   pnpm install
   ```

3. **Cấu hình môi trường**:
   - Tạo file `.env.local` dựa trên mẫu.
   - Cập nhật các biến API và Key cần thiết.

4. **Chạy ứng dụng (Development Mode)**:
   ```bash
   npm run dev
   ```
   *Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`*

5. **Build dự án**:
   ```bash
   npm run build
   ```

---

<div align="center">
  <p>Được phát triển với ❤️ cho nền y tế Thủ đô.</p>
</div>
