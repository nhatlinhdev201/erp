# ═══════════════════════════════════════════════════════════════════════════════
# L-ERP MRP - HƯỚNG DẪN NHẬP LIỆU DỮ LIỆU ĐẦU VÀO
# Input Data Import Guide
# ═══════════════════════════════════════════════════════════════════════════════

## 📋 DANH SÁCH FILE DỮ LIỆU ĐẦU VÀO

| # | File Name | Mô tả | Thứ tự nhập |
|---|-----------|-------|-------------|
| 1 | `01_PARTS_MASTER.csv` | Danh mục vật tư | ⭐ Nhập đầu tiên |
| 2 | `02_SUPPLIERS.csv` | Nhà cung cấp | ⭐ Nhập thứ 2 |
| 3 | `03_WAREHOUSES.csv` | Kho/Vị trí | ⭐ Nhập thứ 3 |
| 4 | `04_BOM.csv` | Bill of Materials | ⭐ Nhập thứ 4 |
| 5 | `05_INVENTORY.csv` | Tồn kho ban đầu | ⭐ Nhập thứ 5 |
| 6 | `06_CUSTOMERS.csv` | Khách hàng | ⭐ Nhập thứ 6 |

**⚠️ QUAN TRỌNG**: Phải nhập theo đúng thứ tự trên vì dữ liệu có liên kết với nhau.

---

## 📦 FILE 1: PARTS_MASTER (Danh mục vật tư)

### Mô tả
Chứa thông tin tất cả vật tư, linh kiện, bán thành phẩm và thành phẩm.

### Các cột dữ liệu

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `part_number` | String | ✅ | Mã vật tư (unique) | `RM-STL-001` |
| `name` | String | ✅ | Tên vật tư | `Thép tấm 2mm` |
| `description` | String | | Mô tả chi tiết | `Thép tấm carbon 2mm x 1220 x 2440` |
| `category` | String | ✅ | Danh mục chính | `Raw Materials` |
| `sub_category` | String | | Danh mục phụ | `Steel` |
| `unit` | String | ✅ | Đơn vị tính | `kg`, `pcs`, `m`, `m2` |
| `unit_cost` | Number | ✅ | Giá/đơn vị (VND) | `25000` |
| `min_stock` | Number | | Tồn tối thiểu | `100` |
| `max_stock` | Number | | Tồn tối đa | `500` |
| `reorder_point` | Number | ✅ | Điểm đặt hàng | `150` |
| `safety_stock` | Number | | Tồn an toàn | `50` |
| `lead_time_days` | Number | ✅ | Thời gian giao (ngày) | `7` |
| `supplier_code` | String | | Mã nhà cung cấp | `SUP-001` |
| `critical` | Y/N | | Vật tư quan trọng | `Y` hoặc `N` |

### Quy tắc đặt mã

| Prefix | Loại | Ví dụ |
|--------|------|-------|
| `RM-` | Raw Materials (Nguyên vật liệu) | `RM-STL-001` |
| `CMP-` | Components (Linh kiện) | `CMP-SCR-001` |
| `SF-` | Semi-Finished (Bán thành phẩm) | `SF-FRM-001` |
| `FG-` | Finished Goods (Thành phẩm) | `FG-PRD-A1` |
| `PKG-` | Packaging (Bao bì) | `PKG-BOX-001` |

### Danh mục (Category)

| Category | Mô tả |
|----------|-------|
| `Raw Materials` | Nguyên vật liệu thô |
| `Components` | Linh kiện, phụ tùng |
| `Semi-Finished` | Bán thành phẩm |
| `Finished Goods` | Thành phẩm |
| `Packaging` | Bao bì đóng gói |

---

## 🏭 FILE 2: SUPPLIERS (Nhà cung cấp)

### Các cột dữ liệu

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `supplier_code` | String | ✅ | Mã NCC (unique) | `SUP-001` |
| `name` | String | ✅ | Tên công ty | `Thép Việt Nam Steel` |
| `contact_person` | String | ✅ | Người liên hệ | `Nguyễn Văn An` |
| `phone` | String | ✅ | Điện thoại | `0901234567` |
| `email` | String | ✅ | Email | `an@vietsteel.com` |
| `address` | String | | Địa chỉ | `123 Đường Công Nghiệp` |
| `city` | String | ✅ | Thành phố | `Biên Hòa` |
| `country` | String | ✅ | Quốc gia | `Vietnam` |
| `payment_terms` | Number | | Điều khoản thanh toán (ngày) | `30` |
| `lead_time_days` | Number | ✅ | Thời gian giao mặc định | `7` |
| `rating` | Number | | Đánh giá (1-5) | `5` |
| `status` | String | ✅ | Trạng thái | `Active` / `Inactive` |

---

## 🏪 FILE 3: WAREHOUSES (Kho/Vị trí)

### Các cột dữ liệu

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `warehouse_code` | String | ✅ | Mã kho (unique) | `WH-MAIN-01` |
| `name` | String | ✅ | Tên kho | `Kho Nguyên vật liệu chính` |
| `type` | String | ✅ | Loại kho | `Raw Materials` |
| `address` | String | | Địa chỉ | `Lô A1 KCN Tân Bình` |
| `city` | String | ✅ | Thành phố | `TP.HCM` |
| `manager` | String | | Quản lý kho | `Nguyễn Văn Kho` |
| `phone` | String | | Điện thoại | `0901111111` |
| `capacity` | Number | | Sức chứa (m2) | `2000` |
| `status` | String | ✅ | Trạng thái | `Active` |

### Loại kho (Type)

| Type | Mô tả |
|------|-------|
| `Raw Materials` | Kho nguyên vật liệu |
| `Components` | Kho linh kiện |
| `WIP` | Kho bán thành phẩm |
| `Finished Goods` | Kho thành phẩm |
| `Distribution` | Kho phân phối |
| `Production` | Khu vực sản xuất |
| `QC` | Khu vực kiểm tra |
| `Quarantine` | Kho cách ly |
| `Defective` | Kho hàng lỗi |
| `Returns` | Kho hàng trả về |

---

## 📋 FILE 4: BOM (Bill of Materials)

### ⭐ Đây là file QUAN TRỌNG NHẤT cho MRP

### Các cột dữ liệu

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `parent_part` | String | ✅ | Mã vật tư cha | `FG-PRD-A1` |
| `child_part` | String | ✅ | Mã vật tư con | `SF-FRM-001` |
| `quantity` | Number | ✅ | Số lượng cần | `1` |
| `unit` | String | ✅ | Đơn vị | `pcs` |
| `bom_level` | Number | ✅ | Cấp BOM (1-5) | `1` |
| `sequence` | Number | | Thứ tự lắp ráp | `10` |
| `scrap_rate` | Number | | Tỷ lệ hao hụt (%) | `3` |
| `notes` | String | | Ghi chú | `Khung chính` |

### Cấu trúc BOM đa cấp

```
FG-PRD-A1 (Thành phẩm)                    ← Level 0
├── SF-FRM-001 (Khung chính) x 1          ← Level 1
│   ├── RM-STL-002 (Thép tấm) x 15kg      ← Level 2
│   ├── RM-STL-003 (Thép ống) x 8m        ← Level 2
│   └── CMP-SCR-002 (Vít M5) x 24         ← Level 2
├── SF-FRM-002 (Khung phụ) x 2            ← Level 1
│   ├── RM-STL-001 (Thép tấm) x 8kg       ← Level 2
│   └── CMP-SCR-001 (Vít M4) x 16         ← Level 2
├── CMP-MOT-001 (Motor) x 2               ← Level 1
└── PKG-BOX-001 (Thùng carton) x 1        ← Level 1
```

### Quy tắc nhập BOM

1. **Nhập từ cao xuống thấp**: Level 1 trước, Level 2 sau
2. **parent_part**: Luôn là vật tư "cha" (sản phẩm hoặc bán thành phẩm)
3. **child_part**: Là vật tư "con" cần để làm ra vật tư cha
4. **quantity**: Số lượng vật tư con cần cho 1 đơn vị vật tư cha
5. **scrap_rate**: Tỷ lệ hao hụt dự kiến (VD: 3% = cần thêm 3%)

---

## 📊 FILE 5: INVENTORY (Tồn kho ban đầu)

### Các cột dữ liệu

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `part_number` | String | ✅ | Mã vật tư | `RM-STL-001` |
| `warehouse_code` | String | ✅ | Mã kho | `WH-MAIN-01` |
| `quantity` | Number | ✅ | Số lượng | `250` |
| `unit` | String | ✅ | Đơn vị | `kg` |
| `lot_number` | String | | Số lô | `LOT-2024-001` |
| `location_bin` | String | | Vị trí kệ | `A-01-01` |
| `last_count_date` | Date | | Ngày kiểm kê | `2024-12-01` |
| `status` | String | ✅ | Trạng thái | `Available` |

### Trạng thái tồn kho (Status)

| Status | Mô tả |
|--------|-------|
| `Available` | Có sẵn, có thể sử dụng |
| `Reserved` | Đã đặt trước cho đơn hàng |
| `Quarantine` | Đang cách ly, chờ kiểm tra |
| `Defective` | Hàng lỗi |
| `On-Hold` | Tạm giữ |

---

## 👥 FILE 6: CUSTOMERS (Khách hàng)

### Các cột dữ liệu

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `customer_code` | String | ✅ | Mã KH (unique) | `CUS-001` |
| `company_name` | String | ✅ | Tên công ty | `Công ty TNHH ABC` |
| `contact_person` | String | ✅ | Người liên hệ | `Nguyễn Văn A` |
| `phone` | String | ✅ | Điện thoại | `0901234567` |
| `email` | String | ✅ | Email | `a@abc.com` |
| `address` | String | | Địa chỉ | `123 Lê Lợi` |
| `city` | String | ✅ | Thành phố | `TP.HCM` |
| `country` | String | ✅ | Quốc gia | `Vietnam` |
| `payment_terms` | Number | | Điều khoản TT (ngày) | `30` |
| `credit_limit` | Number | | Hạn mức tín dụng (VND) | `500000000` |
| `status` | String | ✅ | Trạng thái | `Active` |

---

## 🔄 QUY TRÌNH NHẬP LIỆU

### Bước 1: Chuẩn bị file Excel/CSV

1. Mở file template CSV bằng Excel
2. Xóa các dòng comment (bắt đầu bằng #)
3. Điền dữ liệu theo format
4. Lưu lại dưới dạng CSV (UTF-8)

### Bước 2: Kiểm tra dữ liệu

Trước khi import, kiểm tra:
- ✅ Không có ô trống ở cột Required
- ✅ Mã không bị trùng lặp
- ✅ Định dạng số đúng (không có dấu phẩy)
- ✅ Ngày đúng format: `YYYY-MM-DD`

### Bước 3: Import vào hệ thống

**Cách 1**: Qua giao diện web
1. Vào Settings → Import Data
2. Chọn loại dữ liệu
3. Upload file CSV
4. Review và xác nhận

**Cách 2**: Qua Prisma Studio
1. Mở Prisma Studio: `npx prisma studio`
2. Chọn bảng cần import
3. Click "Add record"
4. Điền dữ liệu

**Cách 3**: Qua API
```bash
curl -X POST http://localhost:3000/api/v2/parts/import \
  -H "Content-Type: multipart/form-data" \
  -F "file=@01_PARTS_MASTER.csv"
```

---

## 🧮 CÔNG THỨC MRP

Sau khi có đầy đủ dữ liệu, hệ thống sẽ tính toán:

### 1. Net Requirements (Nhu cầu thực)

```
Net Requirements = Gross Requirements - On Hand - Scheduled Receipts + Safety Stock
```

### 2. Ví dụ tính toán

**Sales Order**: 10 máy Model A1 (`FG-PRD-A1`)

**BOM Level 1**:
- Cần: 10 x Khung chính (`SF-FRM-001`) = 10 pcs
- Tồn kho: 15 pcs
- **Net Requirement**: 10 - 15 = -5 → Đủ, không cần sản xuất thêm

**BOM Level 2** (cho 1 Khung chính):
- Cần: 15kg Thép tấm 3mm (`RM-STL-002`)
- Với 10 khung: 15 x 10 = 150kg (+ 3% hao hụt = 154.5kg)
- Tồn kho: 180kg
- **Net Requirement**: 154.5 - 180 = -25.5kg → Đủ

### 3. Purchase Suggestion

Nếu Net Requirement > 0:
- Hệ thống tự động đề xuất mua
- Số lượng = Net Requirement + Safety Stock
- Lead time = từ Supplier hoặc Part Master

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề khi nhập liệu:
1. Kiểm tra format dữ liệu
2. Xem log lỗi trong hệ thống
3. Liên hệ: support@rtr.vn

---

**Version**: 1.0  
**Last Updated**: 2025-12-31
