# ═══════════════════════════════════════════════════════════════════════════════
# L-ERP MRP SYSTEM - GÓI TÀI LIỆU CHO KHÁCH HÀNG
# Customer Delivery Package
# ═══════════════════════════════════════════════════════════════════════════════

## 📦 NỘI DUNG GÓI TÀI LIỆU

```
RTR_MRP_Customer_Package/
│
├── README_CUSTOMER.md          ← File này (đọc trước)
├── WINDOWS_SETUP.md            ← #1: Hướng dẫn cài đặt Windows 10
│
├── data-templates/             ← #2: Các bảng dữ liệu đầu vào
│   ├── 00_DATA_IMPORT_GUIDE.md     ← Hướng dẫn nhập liệu
│   ├── 01_PARTS_MASTER.csv         ← Danh mục vật tư
│   ├── 02_SUPPLIERS.csv            ← Nhà cung cấp
│   ├── 03_WAREHOUSES.csv           ← Kho/Vị trí
│   ├── 04_BOM.csv                  ← Bill of Materials
│   ├── 05_INVENTORY.csv            ← Tồn kho ban đầu
│   └── 06_CUSTOMERS.csv            ← Khách hàng
│
└── docker/                     ← File cấu hình Docker
    ├── docker-compose.yml
    └── Dockerfile
```

---

## 🚀 BẮT ĐẦU

### Bước 1: Đọc hướng dẫn cài đặt
- Mở file `WINDOWS_SETUP.md`
- Làm theo hướng dẫn từng bước

### Bước 2: Chuẩn bị dữ liệu đầu vào
- Mở thư mục `data-templates/`
- Đọc file `00_DATA_IMPORT_GUIDE.md`
- Điền dữ liệu vào các file CSV theo thứ tự:
  1. Parts Master (Danh mục vật tư)
  2. Suppliers (Nhà cung cấp)
  3. Warehouses (Kho)
  4. BOM (Bill of Materials)
  5. Inventory (Tồn kho)
  6. Customers (Khách hàng)

### Bước 3: Cài đặt và khởi chạy
- Theo hướng dẫn trong `WINDOWS_SETUP.md`

### Bước 4: Import dữ liệu
- Sau khi hệ thống chạy, import các file CSV đã chuẩn bị

### Bước 5: Test chức năng MRP
- Tạo Sales Order
- Hệ thống tự động tính:
  - Vật tư thiếu cần mua
  - Đề xuất Purchase Order
  - Trạng thái tồn kho

---

## 📋 DANH SÁCH FILE DỮ LIỆU ĐẦU VÀO (INPUT)

| # | File | Mô tả | Số dòng mẫu |
|---|------|-------|-------------|
| 1 | 01_PARTS_MASTER.csv | Danh mục vật tư | 35 items |
| 2 | 02_SUPPLIERS.csv | Nhà cung cấp | 13 suppliers |
| 3 | 03_WAREHOUSES.csv | Kho/Vị trí | 15 warehouses |
| 4 | 04_BOM.csv | Bill of Materials | 40 BOM lines |
| 5 | 05_INVENTORY.csv | Tồn kho ban đầu | 45 inventory records |
| 6 | 06_CUSTOMERS.csv | Khách hàng | 12 customers |

---

## 🔧 YÊU CẦU HỆ THỐNG

### Phần cứng
- CPU: 4 cores+
- RAM: 8 GB+
- Disk: 20 GB SSD

### Phần mềm
- Windows 10/11 (64-bit)
- Docker Desktop hoặc Node.js 18+

---

## 📞 HỖ TRỢ

Nếu cần hỗ trợ:
- Email: support@rtr.vn
- Phone: [số điện thoại]

---

**Version**: 1.0.0  
**Date**: 2025-12-31
