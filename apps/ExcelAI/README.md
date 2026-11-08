# Excel-as-Matrix 2026

Ứng dụng bảng tính AI-Native hiện đại, được xây dựng với React + TypeScript.

---

## Tính năng chính

### Công thức & Tính toán
- **90+ hàm Excel** - SUM, AVERAGE, VLOOKUP, IF, INDEX/MATCH, và nhiều hơn nữa
- **Tham chiếu ô** - A1, $A$1, A1:B10 (tương đối/tuyệt đối)
- **Tự động tính toán lại** - Cập nhật công thức theo thời gian thực

### Chỉnh sửa & Định dạng
- **Định dạng ô** - Font, màu sắc, căn lề, border
- **Định dạng số** - Tiền tệ, phần trăm, ngày tháng
- **Định dạng có điều kiện** - Tự động highlight theo quy tắc
- **Data Validation** - Kiểm tra dữ liệu nhập vào

### Import/Export
- **Import Excel** - Hỗ trợ .xlsx, .xls
- **Import CSV** - Tự động phân tích cột
- **Export Excel** - Xuất workbook hoàn chỉnh
- **Export CSV** - Xuất sheet đơn lẻ

### Biểu đồ
- Bar Chart (ngang/dọc)
- Line Chart
- Area Chart
- Pie Chart

### Tính năng khác
- **Tìm & Thay thế** - Ctrl+F / Ctrl+H
- **Go To** - Nhảy đến ô bất kỳ (Ctrl+G / F5)
- **Sắp xếp tùy chỉnh** - Multi-level sorting
- **Comments** - Ghi chú trên ô
- **In ấn** - Tùy chỉnh trang in
- **20+ phím tắt** - Thao tác nhanh

---

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|-----------|----------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Zustand | State Management |
| Vite | Build Tool |
| TailwindCSS | Styling |
| Recharts | Biểu đồ |
| XLSX | Import/Export Excel |

---

## Cài đặt

```bash
# Clone repo
git clone https://github.com/linkk/excel-as-matrix.git
cd excel-as-matrix/frontend

# Cài dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build
```

---

## Cấu trúc dự án

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── Grid/          # Bảng tính chính
│   │   ├── Modern/        # UI hiện đại 2026
│   │   ├── Dialogs/       # Các hộp thoại
│   │   └── Charts/        # Biểu đồ
│   ├── stores/            # Zustand stores
│   ├── utils/             # Utilities
│   │   ├── formulaEngine/ # Công thức Excel
│   │   └── excelIO.ts     # Import/Export
│   ├── hooks/             # Custom hooks
│   ├── types/             # TypeScript types
│   └── styles/            # CSS styles
├── public/                # Static assets
└── dist/                  # Production build
```

---

## Hiệu suất

- **Virtual Scrolling** - Chỉ render ô hiển thị (~200 DOM nodes)
- **Code Splitting** - Tách vendor chunks
- **Lazy Loading** - Load dialog theo yêu cầu
- **CSS Containment** - Tối ưu paint performance
- **Bundle Size** - ~103 KB gzipped

---

## Phím tắt

| Phím | Chức năng |
|------|-----------|
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+X | Cut |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+F | Tìm kiếm |
| Ctrl+H | Thay thế |
| Ctrl+G / F5 | Go To |
| Ctrl+P | In |
| F12 | Export |
| Arrow Keys | Di chuyển |
| Tab | Sang phải |
| Enter | Xuống dưới |

---

## Trạng thái dự án

**98% HOÀN THÀNH**

- ✅ Formula Engine (90+ hàm)
- ✅ Import/Export Excel/CSV
- ✅ Biểu đồ (5 loại)
- ✅ Comments
- ✅ Print
- ✅ Keyboard Shortcuts
- ✅ Dark Theme (Green)
- ⏳ Insert Image (pending)
- ⏳ Insert Shapes (pending)

---

## Giấy phép

Private Repository - All Rights Reserved

---

## Tác giả

**linkk** - 2026
